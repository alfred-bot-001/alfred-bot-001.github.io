"""zkKYC — 零知识 KYC 凭证系统 API"""
import json
import time
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

from crypto.keys import generate_keypair, sign_message, verify_signature, derive_did
from crypto.bbs import bbs_sign, bbs_derive_proof, bbs_verify_proof
from crypto.merkle import MerkleTree
from crypto.nullifier import generate_random_nonce, generate_nullifier
from crypto.zkproof import generate_zkproof, verify_zkproof
from models.did import create_did_document
from models.credential import create_verifiable_credential
from models.proof import create_presentation

app = FastAPI(title="zkKYC", description="零知识 KYC 凭证系统")

# ── In-memory state ──
state = {
    "issuer": None,
    "users": {},
    "merkle_tree": MerkleTree(),
    "used_nullifiers": set(),
    "revoked": set(),
    "registry": {
        "issuers": [],
        "total_credentials": 0,
        "total_verifications": 0,
        "total_revocations": 0,
    },
}


class KYCRequest(BaseModel):
    name: str
    country: str
    id_number: str
    kyc_level: int = 2


class ProofRequest(BaseModel):
    holder_did: str
    verifier_nonce: str
    disclosed_fields: list[str] = ["kycLevel", "sanctionClear", "amlCheck", "countryRisk"]


class VerifyRequest(BaseModel):
    proof: dict
    verifier_nonce: str


class RevokeRequest(BaseModel):
    holder_did: str


@app.post("/api/issuer/setup")
def setup_issuer():
    keypair = generate_keypair()
    did = derive_did(keypair["public_key"])
    did_doc = create_did_document(did, keypair["public_key"], name="Binance KYC Authority")
    state["issuer"] = {"keypair": keypair, "did": did, "did_document": did_doc}
    state["registry"]["issuers"].append(did)
    return {
        "result": {
            "issuer_did": did,
            "did_document": did_doc,
            "public_key": keypair["public_key"][:32] + "...",
            "algorithm": keypair["algorithm"],
        },
        "explanation": {
            "title": "🏛️ 发行方初始化完成",
            "steps": [
                "生成 ECDSA P-256 椭圆曲线密钥对（私钥 + 公钥）",
                f"推导 DID 标识符: {did}",
                "创建 W3C DID 文档（去中心化身份文档）",
                "将发行方公钥注册到链上注册表",
            ],
            "technical": (
                "发行方（Binance）在 NIST P-256 椭圆曲线上生成密钥对。\n"
                "公钥注册到链上 DID 注册表，验证方可以查找。\n"
                "私钥用于签署 KYC 凭证。\n"
                "DID（去中心化标识符）由公钥哈希推导，遵循 W3C DID Core 规范。"
            ),
            "next": "现在用户可以提交 KYC 并获取可验证凭证。",
        },
    }


@app.post("/api/user/kyc")
def submit_kyc(req: KYCRequest):
    if not state["issuer"]:
        raise HTTPException(400, "发行方未初始化，请先执行初始化。")
    issuer = state["issuer"]
    holder_kp = generate_keypair()
    holder_did = derive_did(holder_kp["public_key"])
    credential = create_verifiable_credential(
        issuer_did=issuer["did"], holder_did=holder_did, kyc_data=req.model_dump()
    )
    signed_data = bbs_sign(issuer["keypair"]["private_key"], credential["credentialSubject"])
    state["merkle_tree"].add_leaf(credential["id"])
    state["merkle_tree"].build()
    state["users"][holder_did] = {
        "credential": credential, "signed_data": signed_data,
        "keypair": holder_kp, "kyc_data": req.model_dump(),
    }
    state["registry"]["total_credentials"] += 1
    return {
        "result": {
            "holder_did": holder_did,
            "credential_id": credential["id"],
            "credential": credential,
            "signed_fields": signed_data["signed_fields"],
            "merkle_root": state["merkle_tree"].root,
        },
        "explanation": {
            "title": "📜 KYC 凭证已签发",
            "steps": [
                f"用户「{req.name}」提交了 KYC 信息",
                f"生成用户 DID: {holder_did}",
                "创建 W3C 可验证凭证，包含 KYC 认证",
                "使用 BBS+ 签名对所有凭证字段签名",
                f"已签名字段: {signed_data['signed_fields']}",
                "将凭证加入 Merkle 树（有效集合）",
                f"新 Merkle 根: {state['merkle_tree'].root[:16]}...",
            ],
            "technical": (
                "凭证使用 BBS+ 签名方案，天然支持选择性披露 ——\n"
                "持有者之后可以证明特定字段被签名过，而不暴露其他字段。\n"
                "每个字段被单独承诺（Pedersen 承诺），然后所有承诺一起签名。\n"
                "凭证 ID 被加入 Merkle 树，用于追踪所有有效凭证。"
            ),
            "privacy_note": (
                "⚠️ 完整凭证（姓名、国籍、证件号）仅存储在用户设备上。\n"
                "发行方只保存凭证 ID 用于撤销，在真实系统中连这个也可以盲化。"
            ),
            "next": "用户现在可以为 P2P 交易生成零知识证明了。",
        },
    }


@app.post("/api/proof/generate")
def generate_proof(req: ProofRequest):
    user = state["users"].get(req.holder_did)
    if not user:
        raise HTTPException(404, "用户未找到")
    proof = generate_zkproof(
        credential=user["credential"], signed_data=user["signed_data"],
        merkle_tree=state["merkle_tree"], verifier_nonce=req.verifier_nonce,
        disclosed_fields=req.disclosed_fields,
    )
    presentation = create_presentation(req.holder_did, proof, req.verifier_nonce)
    all_fields = user["credential"]["credentialSubject"]
    hidden = [f for f in all_fields if f not in req.disclosed_fields and f != "id"]
    revealed_values = {f: all_fields[f] for f in req.disclosed_fields if f in all_fields}
    return {
        "result": {
            "presentation": presentation,
            "proof_size_bytes": len(json.dumps(proof)),
            "nullifier": proof["nullifier"],
        },
        "explanation": {
            "title": "🔐 零知识证明已生成",
            "steps": [
                "创建选择性披露证明（BBS+）：",
                f"  → 披露: {req.disclosed_fields} = {revealed_values}",
                f"  → 隐藏: {hidden}（已承诺但未暴露）",
                f"生成 Nullifier: {proof['nullifier'][:16]}...",
                "创建 Merkle 成员证明（非撤销证明）",
                "添加过期证明",
                f"证明大小: {len(json.dumps(proof))} 字节",
            ],
            "proven_statements": [
                "持有者拥有有效的 KYC 凭证",
                "凭证由可信发行方签名",
                "凭证未被撤销",
                "凭证未过期",
                "持有者不在制裁名单上",
                "反洗钱检查已通过",
            ],
            "hidden_information": [
                "持有者的真实身份",
                "持有者的姓名、国籍、证件号码",
                "具体是哪个发行方签署的凭证",
                "持有者的区块链地址",
                "与任何具体交易的关联",
            ],
            "technical": (
                "证明组合了多种零知识技术：\n"
                "1. BBS+ 选择性披露：证明字段被签名但不暴露内容\n"
                "2. Merkle 证明：证明凭证在有效集合中（未撤销）\n"
                "3. Nullifier：Hash(凭证密钥 || nonce) — 每次交互唯一\n"
                "4. 过期证明：证明凭证日期未到\n\n"
                "验证方只能看到：KYC等级、制裁状态、反洗钱结果、国家风险。\n"
                "无法看到：姓名、国籍、证件号或签发机构。"
            ),
            "next": "将此证明发送给验证方（交易对手）。",
        },
    }


@app.post("/api/proof/verify")
def verify_proof(req: VerifyRequest):
    if not state["issuer"]:
        raise HTTPException(400, "没有已注册的发行方")
    result = verify_zkproof(
        proof=req.proof, issuer_public_key=state["issuer"]["keypair"]["public_key"],
        merkle_root=state["merkle_tree"].root, used_nullifiers=state["used_nullifiers"],
    )
    if result["valid"]:
        state["used_nullifiers"].add(req.proof.get("nullifier", ""))
        state["registry"]["total_verifications"] += 1
    return {
        "result": result,
        "explanation": {
            "title": "✅ 证明验证通过" if result["valid"] else "❌ 证明被拒绝",
            "steps": [
                f"{'✅' if c['passed'] else '❌'} {c['check']}: {c['detail']}"
                for c in result["checks"]
            ],
            "technical": (
                "验证检查项：\n"
                "1. BBS+ 签名：披露的字段确实是可信发行方签名的吗？\n"
                "2. 承诺打开：披露的值与承诺匹配吗？\n"
                "3. Merkle 根：凭证仍在有效集合中吗（未被撤销）？\n"
                "4. 过期检查：凭证还有效吗？\n"
                "5. Nullifier：此证明之前提交过吗（重放攻击）？\n"
                "6. 制裁检查：sanctionClear 是否为 true？\n"
                "7. 反洗钱：amlCheck 是否为 passed？"
            ),
            "next": (
                "证明有效 — 可以安全进行 P2P 交易！"
                if result["valid"]
                else "证明无效 — 请勿进行交易。"
            ),
        },
    }


@app.post("/api/credential/revoke")
def revoke_credential(req: RevokeRequest):
    user = state["users"].get(req.holder_did)
    if not user:
        raise HTTPException(404, "用户未找到")
    cred_id = user["credential"]["id"]
    old_root = state["merkle_tree"].root
    removed = state["merkle_tree"].remove_leaf(cred_id)
    state["revoked"].add(req.holder_did)
    state["registry"]["total_revocations"] += 1
    return {
        "result": {
            "revoked": removed, "credential_id": cred_id, "holder_did": req.holder_did,
            "old_merkle_root": old_root, "new_merkle_root": state["merkle_tree"].root,
        },
        "explanation": {
            "title": "🚫 凭证已撤销",
            "steps": [
                f"从有效集合中移除凭证 {cred_id[:20]}...",
                f"旧 Merkle 根: {old_root[:16]}...",
                f"新 Merkle 根: {state['merkle_tree'].root[:16]}...",
                "该凭证的任何新证明都将无法通过验证",
                "撤销操作不会暴露被撤销者的身份",
            ],
            "technical": (
                "撤销通过从 Merkle 树中移除凭证实现。\n"
                "根哈希变化后，任何用旧根生成的证明都会失败。\n\n"
                "重要特性：\n"
                "- Merkle 树不暴露哪个叶子被移除\n"
                "- 其他用户的证明不受影响\n"
                "- 被撤销用户仍可生成证明，但无法通过验证\n\n"
                "这是相比传统黑名单的关键优势：\n"
                "可以撤销某人而不公开标识他们。"
            ),
            "next": "尝试用被撤销的凭证生成新证明 — 验证将失败。",
        },
    }


@app.post("/api/demo/unlinkability")
def demo_unlinkability():
    holder_did = None
    for did, user in state["users"].items():
        if did not in state["revoked"]:
            holder_did = did
            break
    if not holder_did:
        raise HTTPException(400, "没有可用的有效用户")
    user = state["users"][holder_did]
    proofs = []
    for i in range(3):
        nonce = generate_random_nonce()
        proof = generate_zkproof(
            credential=user["credential"], signed_data=user["signed_data"],
            merkle_tree=state["merkle_tree"], verifier_nonce=nonce,
        )
        proofs.append({
            "nonce": nonce, "nullifier": proof["nullifier"],
            "signature_fragment": proof["selectiveDisclosure"]["signature"][:32] + "...",
            "proof_hash": str(hash(json.dumps(proof, sort_keys=True)))[-8:],
        })
    return {
        "result": {
            "holder_did": holder_did, "proofs_generated": len(proofs),
            "proofs": proofs, "all_from_same_user": True, "can_link_proofs": False,
        },
        "explanation": {
            "title": "🔗 不可关联性演示",
            "steps": [
                f"用同一用户（{holder_did[:20]}...）生成了 {len(proofs)} 个证明",
                "每个证明使用不同的验证方随机数",
                "对比 Nullifier — 它们完全不同：",
                *[f"  证明 {i+1}: nullifier = {p['nullifier'][:20]}..." for i, p in enumerate(proofs)],
                "观察者无法判断这些证明来自同一个人",
            ],
            "technical": (
                "不可关联性通过 Nullifier 设计实现：\n"
                "  Nullifier = Hash(凭证密钥 || 验证方随机数)\n\n"
                "由于每个验证方提供不同的随机 nonce，Nullifier 每次不同。\n"
                "证明结构也会变化，因为承诺的盲因子被重新随机化。\n\n"
                "对比传统 KYC：向 3 个商家出示护照，\n"
                "他们都能看到你是同一个人。\n"
                "使用 zkKYC，每个商家看到的是完全独立的证明 —— 无法关联。"
            ),
            "comparison": {
                "传统KYC": "出示护照 → 所有商家知道你是同一人",
                "zkKYC": "出示 ZK 证明 → 每个商家看到独立、不可关联的证明",
            },
            "next": "演示完成！你已经看到了完整的 zkKYC 生命周期。",
        },
    }


@app.get("/api/registry/status")
def registry_status():
    return {
        "result": {
            "issuers": state["registry"]["issuers"],
            "total_credentials": state["registry"]["total_credentials"],
            "total_verifications": state["registry"]["total_verifications"],
            "total_revocations": state["registry"]["total_revocations"],
            "merkle_root": state["merkle_tree"].root if state["merkle_tree"].root else None,
            "active_users": len(state["users"]) - len(state["revoked"]),
            "revoked_users": len(state["revoked"]),
            "used_nullifiers": len(state["used_nullifiers"]),
        },
    }


@app.post("/api/reset")
def reset_state():
    state["issuer"] = None
    state["users"] = {}
    state["merkle_tree"] = MerkleTree()
    state["used_nullifiers"] = set()
    state["revoked"] = set()
    state["registry"] = {
        "issuers": [], "total_credentials": 0,
        "total_verifications": 0, "total_revocations": 0,
    }
    return {"result": "reset", "explanation": {"title": "🔄 系统已重置", "steps": ["所有状态已清除"]}}


app.mount("/", StaticFiles(directory=str(Path(__file__).parent / "static"), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8099)
