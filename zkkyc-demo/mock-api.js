(() => {
  const state = {
    issuer: null,
    users: {},
    usedNullifiers: new Set(),
    revoked: new Set(),
    credentials: 0,
    verifications: 0,
    revocations: 0,
    merkleRoot: "",
  };

  const nowIso = () => new Date().toISOString();
  const hash = (value) => {
    let h = 2166136261;
    const text = JSON.stringify(value);
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, "0").repeat(8).slice(0, 64);
  };
  const id = (prefix) => `${prefix}:${hash([prefix, Date.now(), Math.random()]).slice(0, 32)}`;
  const did = () => `did:zkkyc:${hash([Date.now(), Math.random()]).slice(0, 40)}`;
  const wait = () => new Promise((resolve) => setTimeout(resolve, 180));

  function setupIssuer() {
    const issuerDid = did();
    state.issuer = {
      issuer_did: issuerDid,
      did_document: {
        "@context": ["https://www.w3.org/ns/did/v1"],
        id: issuerDid,
        verificationMethod: [{
          id: `${issuerDid}#key-1`,
          type: "EcdsaSecp256r1VerificationKey2019",
          controller: issuerDid,
          publicKeyHex: hash(["issuer-key", issuerDid]),
        }],
        authentication: [`${issuerDid}#key-1`],
        assertionMethod: [`${issuerDid}#key-1`],
        name: "Binance KYC Authority",
      },
      public_key: `${hash(["public", issuerDid]).slice(0, 32)}...`,
      algorithm: "ECDSA-P256 + BBS+ selective disclosure",
    };
    return {
      result: state.issuer,
      explanation: {
        title: "🏛️ 发行方初始化完成",
        steps: [
          "生成 ECDSA P-256 椭圆曲线密钥对（演示模拟）",
          `推导 DID 标识符: ${issuerDid}`,
          "创建 W3C DID 文档",
          "将发行方公钥写入模拟链上注册表",
        ],
        technical: "GitHub Pages 静态演示在浏览器内模拟密码学流程，便于公开访问。真实后端版仍保留在 FastAPI 项目中。",
        next: "现在用户可以提交 KYC 并获取可验证凭证。",
      },
    };
  }

  function submitKyc(req) {
    if (!state.issuer) throw new Error("发行方未初始化，请先执行初始化。");
    const holderDid = did();
    const credentialId = id("urn:credential");
    const subject = {
      id: holderDid,
      name: req.name,
      nationality: req.country,
      idNumber: req.id_number,
      kycLevel: req.kyc_level,
      sanctionClear: true,
      amlCheck: "passed",
      countryRisk: "low",
    };
    const credential = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      id: credentialId,
      type: ["VerifiableCredential", "KYCCredential"],
      issuer: state.issuer.issuer_did,
      issuanceDate: nowIso(),
      expirationDate: new Date(Date.now() + 365 * 86400000).toISOString(),
      credentialSubject: subject,
      credentialStatus: { id: `${credentialId}#status`, type: "MerkleRevocationRegistry", statusPurpose: "revocation" },
    };
    state.credentials += 1;
    state.merkleRoot = hash(Object.keys(state.users).concat(credentialId));
    state.users[holderDid] = { credential, subject, credentialId };
    return {
      result: {
        holder_did: holderDid,
        credential_id: credentialId,
        credential,
        signed_fields: ["kycLevel", "sanctionClear", "amlCheck", "countryRisk", "nationality", "idNumber"],
        merkle_root: state.merkleRoot,
      },
      explanation: {
        title: "📜 KYC 凭证已签发",
        steps: [
          `用户「${req.name}」提交了 KYC 信息`,
          `生成用户 DID: ${holderDid}`,
          "创建 W3C 可验证凭证，包含 KYC 认证",
          "使用 BBS+ 模拟签名对凭证字段签名",
          `新 Merkle 根: ${state.merkleRoot.slice(0, 16)}...`,
        ],
        technical: "凭证字段被签名后，后续可以只披露合规结论，不披露姓名、国籍、证件号码。",
        privacy_note: "⚠️ 静态演示只在浏览器内保存状态，刷新页面后会清空。",
        next: "用户现在可以为 P2P 交易生成零知识证明了。",
      },
    };
  }

  function generateProof(req) {
    const user = state.users[req.holder_did];
    if (!user) throw new Error("用户未找到");
    const disclosed = {};
    req.disclosed_fields.forEach((field) => {
      if (field in user.subject) disclosed[field] = user.subject[field];
    });
    const nullifier = hash([user.credentialId, req.verifier_nonce, Math.random()]);
    const proof = {
      type: "ZKKYCProof",
      holder: req.holder_did,
      nullifier,
      selectiveDisclosure: {
        disclosed,
        hidden_commitments: {
          name: hash(["name", user.subject.name]),
          nationality: hash(["country", user.subject.nationality]),
          idNumber: hash(["id", user.subject.idNumber]),
        },
        signature: hash(["bbs", user.credentialId, req.verifier_nonce]),
      },
      revocationProof: {
        merkleRoot: state.merkleRoot,
        leafHash: hash(user.credentialId),
        notRevoked: !state.revoked.has(req.holder_did),
      },
      expirationProof: { notExpired: true, checkedAt: nowIso() },
      verifierNonce: req.verifier_nonce,
    };
    return {
      result: {
        presentation: {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiablePresentation"],
          holder: req.holder_did,
          proof,
        },
        proof_size_bytes: JSON.stringify(proof).length,
        nullifier,
      },
      explanation: {
        title: "🔐 零知识证明已生成",
        steps: [
          `披露字段: ${JSON.stringify(disclosed)}`,
          "隐藏姓名、国籍、证件号码等隐私字段",
          `生成 Nullifier: ${nullifier.slice(0, 16)}...`,
          "创建 Merkle 非撤销证明",
        ],
        proven_statements: ["持有者拥有有效 KYC 凭证", "凭证未被撤销", "AML 与制裁检查通过"],
        hidden_information: ["姓名", "国籍", "证件号码", "链上地址关联"],
        technical: "每次证明绑定验证方 nonce，因此同一凭证生成的证明也无法被关联。",
        next: "将此证明发送给验证方。",
      },
    };
  }

  function verifyProof(req) {
    const proof = req.proof;
    const replay = state.usedNullifiers.has(proof.nullifier);
    const revoked = proof.revocationProof.notRevoked === false;
    const checks = [
      { check: "BBS+ signature", passed: true, detail: "披露字段来自可信发行方签名凭证" },
      { check: "Hidden commitments", passed: true, detail: "隐藏字段承诺完整，未泄露原文" },
      { check: "revocation / Merkle", passed: !revoked, detail: revoked ? "凭证已撤销，不在有效集合中" : "凭证在有效 Merkle 集合中" },
      { check: "Nullifier replay", passed: !replay, detail: replay ? "此证明已使用过" : "Nullifier 首次出现" },
      { check: "sanction / AML", passed: true, detail: "制裁名单未命中，AML 检查通过" },
      { check: "expiration", passed: true, detail: "凭证仍在有效期内" },
    ];
    const valid = checks.every((item) => item.passed);
    if (valid) {
      state.usedNullifiers.add(proof.nullifier);
      state.verifications += 1;
    }
    return {
      result: { valid, checks },
      explanation: {
        title: valid ? "✅ 证明验证通过" : "❌ 证明被拒绝",
        steps: checks.map((c) => `${c.passed ? "✅" : "❌"} ${c.check}: ${c.detail}`),
        technical: "验证方只看到合规断言和证明材料，看不到用户的姓名、证件号码或原始 KYC 文件。",
        next: valid ? "证明有效，可以继续 P2P 交易。" : "证明无效，请勿继续交易。",
      },
    };
  }

  function revokeCredential(req) {
    const user = state.users[req.holder_did];
    if (!user) throw new Error("用户未找到");
    const oldRoot = state.merkleRoot;
    state.revoked.add(req.holder_did);
    state.revocations += 1;
    state.merkleRoot = hash([oldRoot, "revoked", user.credentialId]);
    return {
      result: {
        revoked: true,
        credential_id: user.credentialId,
        holder_did: req.holder_did,
        old_merkle_root: oldRoot,
        new_merkle_root: state.merkleRoot,
      },
      explanation: {
        title: "🚫 凭证已撤销",
        steps: [
          `从有效集合中移除凭证 ${user.credentialId.slice(0, 20)}...`,
          `旧 Merkle 根: ${oldRoot.slice(0, 16)}...`,
          `新 Merkle 根: ${state.merkleRoot.slice(0, 16)}...`,
          "该凭证的新证明将无法通过验证",
        ],
        technical: "撤销通过更新 Merkle 根模拟。根变化后，被撤销凭证无法再证明自己属于有效集合。",
        next: "尝试用被撤销的凭证生成新证明，验证将失败。",
      },
    };
  }

  function unlinkability() {
    const holderDid = Object.keys(state.users).find((item) => !state.revoked.has(item)) || Object.keys(state.users)[0];
    if (!holderDid) throw new Error("没有可用的有效用户");
    const proofs = Array.from({ length: 3 }, () => {
      const nonce = hash(["nonce", Math.random()]).slice(0, 32);
      const nullifier = hash([holderDid, nonce, Math.random()]);
      return {
        nonce,
        nullifier,
        signature_fragment: `${hash(["sig", nonce]).slice(0, 32)}...`,
        proof_hash: hash([nullifier, nonce]).slice(-8),
      };
    });
    return {
      result: { holder_did: holderDid, proofs_generated: 3, proofs, all_from_same_user: true, can_link_proofs: false },
      explanation: {
        title: "🔗 不可关联性演示",
        steps: [
          `用同一用户生成了 ${proofs.length} 个证明`,
          "每个证明使用不同验证方随机数",
          ...proofs.map((p, i) => `证明 ${i + 1}: nullifier = ${p.nullifier.slice(0, 20)}...`),
          "观察者无法判断这些证明来自同一个人",
        ],
        technical: "Nullifier = Hash(凭证密钥 || 验证方随机数)。每次 nonce 不同，证明就不同。",
        next: "演示完成。",
      },
    };
  }

  window.zkKycMockApi = async (endpoint, data = null) => {
    await wait();
    try {
      if (endpoint === "/api/issuer/setup") return setupIssuer();
      if (endpoint === "/api/user/kyc") return submitKyc(data);
      if (endpoint === "/api/proof/generate") return generateProof(data);
      if (endpoint === "/api/proof/verify") return verifyProof(data);
      if (endpoint === "/api/credential/revoke") return revokeCredential(data);
      if (endpoint === "/api/demo/unlinkability") return unlinkability();
      if (endpoint === "/api/reset") {
        Object.assign(state, { issuer: null, users: {}, usedNullifiers: new Set(), revoked: new Set(), credentials: 0, verifications: 0, revocations: 0, merkleRoot: "" });
        return { result: "reset", explanation: { title: "🔄 系统已重置", steps: ["所有状态已清除"] } };
      }
      if (endpoint === "/api/registry/status") {
        return { result: { total_credentials: state.credentials, total_verifications: state.verifications, total_revocations: state.revocations, merkle_root: state.merkleRoot } };
      }
      throw new Error(`Unknown endpoint: ${endpoint}`);
    } catch (error) {
      throw new Error(error.message || "Mock API 错误");
    }
  };
})();
