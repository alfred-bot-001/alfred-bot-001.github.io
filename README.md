# zkKYC — 零知识 KYC 凭证系统

> 链上 P2P 交易的隐私合规方案：证明你通过了 KYC，但不暴露任何个人信息。

## 📋 目录

- [背景与问题](#背景与问题)
- [方案概述](#方案概述)
- [系统架构](#系统架构)
- [核心技术](#核心技术)
- [完整流程](#完整流程)
- [Bob 的验证流程详解](#bob-的验证流程详解)
- [Merkle 根从哪来](#merkle-根从哪来)
- [三种验证方案](#三种验证方案)
- [安全设计](#安全设计)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [API 文档](#api-文档)
- [研究资料](#研究资料)

---

## 背景与问题

在链上 P2P 转账场景中，存在一个核心矛盾：

```
Alice ←→ Bob  (链上 P2P 转账)

❌ 问题：
  · 双方没有做链上 KYC
  · Bob 担心 Alice 是否在制裁名单上
  · Bob 担心与 Alice 交易是否会影响自己账户安全
  · 但 Alice 不愿意暴露自己的真实身份

✅ 需求：
  · Alice 能证明自己通过了大机构（如 Binance）的 KYC
  · 不暴露任何个人信息（姓名、国籍、证件号）
  · 不暴露是哪家机构签发的 KYC
  · 证明不可关联到 Alice 的链上地址或交易
  · Bob 可以独立验证，不需要信任 Alice
```

传统方案要么隐私不足（出示护照/证件），要么安全性不够（自我声明）。

**zkKYC 用零知识证明解决这个矛盾。**

---

## 方案概述

zkKYC 是一个基于零知识证明的 KYC 凭证系统，让用户能够：

| 能做到 | 不会暴露 |
|---|---|
| ✅ 证明通过了 KYC 认证 | ❌ 用户真实姓名 |
| ✅ 证明不在制裁名单 | ❌ 用户国籍 |
| ✅ 证明反洗钱检查通过 | ❌ 证件号码 |
| ✅ 证明凭证未过期、未撤销 | ❌ 哪家机构签发 |
| ✅ 每次证明不可关联 | ❌ 链上地址/交易记录 |

---

## 系统架构

### 角色

| 角色 | 说明 | 示例 |
|---|---|---|
| **Issuer（发行方）** | 完成 KYC 审核，签发凭证 | Binance、Coinbase |
| **Holder（持有方）** | 持有凭证，按需生成零知识证明 | Alice（用户） |
| **Verifier（验证方）** | 验证零知识证明 | Bob（交易对手） |
| **Registry（注册表）** | 链上合约，存储公钥和 Merkle 根 | BNB Chain 合约 |

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    链上 (Smart Contract)                  │
│                                                           │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ DID Registry │  │  Revocation   │  │   Verifier    │  │
│  │              │  │  Accumulator  │  │   Contract    │  │
│  │ · 发行方 DID │  │  · Merkle 根  │  │  · 验证 ZKP   │  │
│  │ · 公钥列表   │  │  · 撤销状态   │  │  · Nullifier  │  │
│  └──────────────┘  └───────────────┘  └───────────────┘  │
└────────▲───────────────────▲──────────────────▲──────────┘
         │                   │                  │
         │      读取公钥     │    读取 Merkle 根 │   提交验证
         │                   │                  │
┌────────┴───────────────────┴──────────────────┴──────────┐
│                    链下 (Off-chain)                        │
│                                                           │
│  ┌───────────┐     ┌───────────┐     ┌────────────────┐  │
│  │  Issuer   │────▶│  Holder   │────▶│    Verifier    │  │
│  │ (Binance) │ 凭证│  (Alice)  │ ZKP │    (Bob)       │  │
│  │           │     │           │     │                │  │
│  │ 签发 VC   │     │ 生成 Proof│     │ 验证 Proof     │  │
│  └───────────┘     └───────────┘     └────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### 技术栈

| 组件 | 选型 | 说明 |
|---|---|---|
| DID 标准 | `did:zkkyc` | 基于 W3C DID Core |
| 凭证标准 | W3C Verifiable Credentials v2 | 可验证凭证 |
| 签名方案 | BBS+ (简化版) | 原生支持选择性披露 |
| 承诺方案 | Pedersen 承诺 (Hash-based) | 隐藏值但可验证 |
| 撤销机制 | Merkle Tree Accumulator | 链上存根，O(1) 撤销 |
| 防重放 | Nullifier | Hash(secret ‖ nonce) |
| 椭圆曲线 | ECDSA P-256 (NIST) | 密钥生成和签名 |
| 后端 | Python + FastAPI | API 服务 |
| 前端 | 纯 HTML/JS/CSS | 无框架依赖 |

---

## 核心技术

### 1. BBS+ 选择性披露签名

传统签名（ECDSA）：签名后要么全部展示，要么什么都不展示。

BBS+ 签名：签名 N 个字段，可以只展示其中 M 个，同时证明其余字段也被签名过。

```
签名时（Issuer）:
  对每个字段生成承诺: commitment_i = Hash(value_i || blinding_i)
  对所有承诺一起签名: signature = ECDSA.sign(concat(all_commitments))

披露时（Holder）:
  披露字段: 给出 value + blinding（可以验证 commitment）
  隐藏字段: 只给出 commitment（无法反推 value）
  签名: 保持不变（覆盖所有字段的承诺）

验证时（Verifier）:
  1. 检查披露字段的 value + blinding 是否匹配 commitment  ✓
  2. 检查签名是否覆盖所有 commitments（含隐藏的）         ✓
  3. 结论: 隐藏字段确实被签名过，但我不知道值是什么       ✓
```

### 2. Merkle 树撤销累加器

```
有效凭证集合:

          [Root]              ← 链上公开
         /      \
      [H01]    [H23]
      /   \    /   \
    [H0] [H1] [H2] [H3]     ← 叶子 = Hash(credential_id)
     │    │    │    │
    凭证0 凭证1 凭证2 凭证3

撤销凭证1:
  → 从树中移除叶子 H1
  → 重算根 → 新 Root'（与旧 Root 不同）
  → 链上更新 Root → Root'
  → 凭证1 的 Merkle 路径不再能算出 Root'

关键: 树不暴露哪个叶子被移除
```

### 3. Nullifier（消零器）

```
Nullifier = Hash(credential_secret || context_nonce)

场景1: 不可关联（每次 nonce 不同）
  交易1: Nullifier = Hash(secret || nonce_A) = 0xabc...
  交易2: Nullifier = Hash(secret || nonce_B) = 0x7f3...
  交易3: Nullifier = Hash(secret || nonce_C) = 0xd41...
  → 三个 Nullifier 完全不同，无法判断是同一人

场景2: 防重放（同一 nonce 产生相同 nullifier）
  Bob 发 nonce_X 给 Alice
  Alice 生成 proof（含 Nullifier_X）
  Alice 再次提交同一 proof → Nullifier_X 已记录 → 拒绝
```

### 4. DID（去中心化标识符）

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:zkkyc:ee814b5633c46f3c...",       // 由公钥哈希推导
  "verificationMethod": [{
    "id": "did:zkkyc:ee814b...#key-1",
    "type": "EcdsaSecp256r1VerificationKey2019",
    "publicKeyHex": "04a7c3b8..."               // 链上注册
  }]
}
```

### 5. W3C 可验证凭证 (VC)

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "KYCCredential"],
  "issuer": "did:zkkyc:Binance...",             // 发行方 DID
  "credentialSubject": {
    "id": "did:zkkyc:Alice...",                 // 持有方 DID
    "kycLevel": 2,                              // ← 可选择性披露
    "sanctionClear": true,                      // ← 可选择性披露
    "amlCheck": "passed",                       // ← 可选择性披露
    "countryRisk": "low",                       // ← 可选择性披露
    "name": "张小明",                            // ← 隐藏
    "nationality": "SG",                        // ← 隐藏
    "idNumber": "S1234567A"                     // ← 隐藏
  }
}
```

---

## 完整流程

### Phase 1: 凭证签发（一次性）

```
用户完成 KYC
     │
     ▼
┌─────────────────────────────────────────────────────┐
│ Binance（Issuer）                                    │
│                                                       │
│  1. 验证用户身份（姓名、证件、人脸）                   │
│  2. 生成用户独立 DID（与链上地址无关）                 │
│  3. 创建 W3C 可验证凭证（VC）                         │
│  4. 用 BBS+ 签名对所有字段签名                        │
│  5. 将凭证 ID 加入 Merkle 树                          │
│  6. 更新链上 Merkle 根                                │
│  7. 将凭证 + 签名数据发送给用户                       │
│                                                       │
│  ⚠️ Binance 之后不保存用户个人信息                    │
│     只保留凭证 ID 用于撤销                            │
└─────────────────────────────────────────────────────┘
     │
     ▼
用户将凭证存储在本地设备（手机钱包/浏览器插件）
```

### Phase 2: P2P 交易

```
Bob                              Alice
 │                                │
 │  ① "请证明你的 KYC 状态"       │
 │───────────────────────────────▶│
 │                                │
 │  ② 发送随机 nonce              │
 │───────────────────────────────▶│
 │                                │
 │                                │  ③ 本地生成 ZK 证明:
 │                                │     · 选择性披露（BBS+）
 │                                │     · Merkle 成员证明
 │                                │     · Nullifier 生成
 │                                │     · 过期检查
 │                                │
 │  ④ 发送 proof.json (~2KB)      │
 │◀───────────────────────────────│
 │                                │
 │  ⑤ 验证证明:                   │
 │     · 从链上读取公钥            │
 │     · 从链上读取 Merkle 根      │
 │     · 逐项检查                  │
 │                                │
 │  ⑥ 验证通过 → 执行交易         │
 │◀══════════════════════════════▶│
```

### Phase 3: 撤销（如需要）

```
用户被加入制裁名单
     │
     ▼
Binance 从 Merkle 树中移除该凭证 ID
     │
     ▼
链上 Merkle 根更新
     │
     ▼
该用户的任何新证明都无法通过验证
（Merkle 路径算不出新的根）

⚠️ 撤销不暴露被撤销者的身份
```

---

## Bob 的验证流程详解

Bob 收到 Alice 的 proof.json 后，执行 6 步验证：

```
┌─────────────────────────────────────────────────────┐
│ 第零步：从链上获取信任锚点                           │
│                                                       │
│  issuer_pubkey = Registry.getIssuer().publicKey       │
│  merkle_root   = Registry.getIssuer().merkleRoot      │
│                                                       │
│  ⚡ 关键：这两个值来自链上合约，Alice 无法伪造        │
│     Bob 自己读链，不需要信任 Alice 或 Binance          │
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│ 第一步：验证 BBS+ 签名                               │
│                                                       │
│  对每个披露字段:                                      │
│    assert Hash(value || blinding) == commitment       │
│                                                       │
│  对所有字段的承诺:                                    │
│    combined = sort_concat(all_commitments)             │
│    ECDSA.verify(issuer_pubkey, combined, signature)   │
│                                                       │
│  ✅ 确认: 这些字段确实是发行方签署的                  │
│     隐藏字段的承诺也在签名里（签过但看不到值）        │
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│ 第二步：验证 Merkle 证明（非撤销）                    │
│                                                       │
│  current = leaf_hash                                  │
│  for sibling in proof.siblings:                       │
│    current = Hash(current + sibling)                  │
│  assert current == merkle_root  ← 链上的根            │
│                                                       │
│  ✅ 确认: 凭证在有效集合中（未被撤销）                │
│     Bob 不知道具体是哪个凭证                          │
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│ 第三步：检查 Nullifier                                │
│                                                       │
│  assert proof.nullifier NOT IN used_nullifiers        │
│  used_nullifiers.add(proof.nullifier)                 │
│                                                       │
│  ✅ 确认: 此证明未被重放                              │
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│ 第四步：检查业务合规字段                              │
│                                                       │
│  assert sanctionClear == true    → 不在制裁名单       │
│  assert amlCheck == "passed"     → 反洗钱通过         │
│  assert kycLevel >= 1            → KYC 等级足够       │
│  assert countryRisk != "high"    → 国家风险可接受     │
│                                                       │
│  ✅ 这些值已通过签名验证确认是真的                    │
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│ 第五步：过期检查                                      │
│                                                       │
│  assert proof.expirationProof.notExpired == true      │
│                                                       │
│  ✅ 凭证仍在有效期                                    │
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│                     最终判定                          │
│                                                       │
│  全部通过 ✅ → 证明有效，可以安全交易                 │
│  任何一项 ❌ → 拒绝交易                               │
└─────────────────────────────────────────────────────┘
```

### Bob 验证后知道什么 vs 不知道什么

| ✅ Bob 知道 | ❌ Bob 不知道 |
|---|---|
| Alice 通过了某大机构 KYC | Alice 叫什么名字 |
| Alice 不在制裁名单 | Alice 是哪国人 |
| Alice 反洗钱检查通过 | Alice 的证件号码 |
| Alice 国家风险低 | 是 Binance 还是 Coinbase 签发 |
| 凭证未过期、未被撤销 | Alice 的其他链上交易 |

---

## Merkle 根从哪来

**核心原则：Bob 的信任来自链上数据，不依赖 Alice。**

### 方案一：链上合约存储（推荐）

```
Binance 每次签发/撤销凭证后更新链上合约:

┌──────────────────────────────────┐
│  链上 Registry 合约（公开数据）  │
│                                    │
│  issuer_pubkey: 0x04a7c3b8...     │  ← 任何人可读
│  merkle_root:   0xf3b1a2c4...     │  ← 任何人可读
│  last_updated:  1740100000        │
└──────────────────────────────────┘
         ▲
         │ Bob 直接读合约
         │ (ethers.js / web3.py)
         │
       Bob
```

### 方案二：多源交叉验证

```
Bob 同时查询:
  ① 链上合约       → merkle_root = 0xf3b1...
  ② Binance 官网   → merkle_root = 0xf3b1...
  ③ 第三方审计机构  → merkle_root = 0xf3b1...

三者一致 → 可信
```

### 常见问题

**Q: Alice 每次生成新证明，Merkle 根会变吗？**

A: **不会。** Merkle 根只在凭证签发或撤销时变化。生成证明是 Alice 的本地操作，不涉及 Merkle 树。

**Q: Alice 的 Merkle 路径从哪来？**

A: 签发凭证时 Binance 给 Alice。Merkle 树更新时推送新路径。类似 Binance Proof of Reserves 的做法。

**Q: Bob 需要联系 Binance 吗？**

A: **不需要。** Bob 只需读链上合约。这就是"去中心化验证"的含义。

---

## 三种验证方案

### 📱 方案A：钱包内置 SDK

```javascript
// Alice 端（1 行代码）
const proof = await zkkyc.generateProof(bobNonce);

// Bob 端（1 行代码）
const result = await verifier.verify(proof);
// result = { valid: true, kycLevel: 2, sanctionClear: true, ... }
```

**用户体验：** 钱包弹窗显示验证结果，Bob 点击确认即可。

### 🌐 方案B：P2P 平台自动验证

平台后台自动完成验证，Bob 只看到：

```
卖方 KYC 状态: ✅ 已验证
  · KYC 等级: 2 (增强认证)
  · 制裁检查: ✅ 通过
  · 反洗钱:   ✅ 通过
```

Bob 全程只点一个按钮。

### 💻 方案C：手动验证（类似 Binance PoS）

```bash
# 1. 下载开源验证工具
git clone https://github.com/binance/zkkyc-verifier.git
cd zkkyc-verifier && pip install -r requirements.txt

# 2. 验证 proof 文件
python verify.py --proof proof.json --chain bnb-mainnet

# 输出:
# [1/8] 连接 BNB Chain RPC... ✅
# [2/8] 从链上读取发行方公钥... ✅
# [3/8] 从链上读取 Merkle 根... ✅
# [4/8] 验证 BBS+ 签名... ✅
# [5/8] 验证 Merkle 成员证明... ✅
# [6/8] 检查 Nullifier... ✅
# [7/8] 检查制裁 & 反洗钱... ✅
# [8/8] 检查凭证有效期... ✅
#
# ✅ 验证结果：证明有效 (VALID)
```

---

## 安全设计

| 风险 | 应对措施 |
|---|---|
| 凭证转卖 | 凭证绑定用户 DID 私钥，转卖 = 交出私钥 |
| Issuer 串通追踪 | BBS+ 盲签名，Issuer 无法关联签发和使用 |
| 证明重放 | Nullifier + 时间戳 + Verifier 随机挑战 |
| 凭证过期不撤销 | Merkle 树撤销 + 过期时间检查 |
| 虚假 KYC | Issuer 信誉机制 + 链上质押惩罚 |
| Merkle 根伪造 | 链上合约存储，任何人可验证 |
| 量子威胁 | 远期迁移到 lattice-based ZKP |

---

## 项目结构

```
zero-knowledge-proofs/
├── README.md                          # 本文件
├── SPEC.md                            # 详细需求规格
├── zkkyc/
│   ├── app.py                         # FastAPI 后端（7 个 API 端点）
│   ├── requirements.txt               # Python 依赖
│   ├── crypto/                        # 密码学模块
│   │   ├── keys.py                    # ECC 密钥生成（ECDSA P-256）
│   │   ├── bbs.py                     # BBS+ 选择性披露签名
│   │   ├── commitments.py             # Pedersen 承诺（Hash-based）
│   │   ├── merkle.py                  # Merkle 树撤销累加器
│   │   ├── nullifier.py              # Nullifier 生成
│   │   └── zkproof.py                # ZK 证明生成与验证
│   ├── models/                        # 数据模型
│   │   ├── did.py                     # DID 文档模型
│   │   ├── credential.py             # W3C 可验证凭证
│   │   └── proof.py                   # 证明展示模型
│   └── static/                        # 前端演示
│       ├── index.html                 # 技术视角演示（7 步流程）
│       ├── user-demo.html             # 用户视角演示（3 种方案）
│       ├── style.css                  # 暗色主题样式
│       └── app.js                     # 前端交互逻辑
```

---

## 快速开始

### 安装

```bash
git clone https://github.com/alfred-bot-001/zero-knowledge-proofs.git
cd zero-knowledge-proofs/zkkyc

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 启动

```bash
python3 app.py
```

服务运行在 `http://localhost:8099`

### 演示页面

| 页面 | 地址 | 说明 |
|---|---|---|
| 技术视角 | `http://localhost:8099/` | 7 步交互流程 + Bob 验证动画 + JSON 中文注释 |
| 用户视角 | `http://localhost:8099/user-demo.html` | 3 种方案对比（钱包/平台/手动） |

### API 测试

```bash
# 初始化发行方
curl -X POST http://localhost:8099/api/issuer/setup

# 签发 KYC 凭证
curl -X POST http://localhost:8099/api/user/kyc \
  -H 'Content-Type: application/json' \
  -d '{"name":"张小明","country":"SG","id_number":"S1234567A","kyc_level":2}'

# 生成零知识证明
curl -X POST http://localhost:8099/api/proof/generate \
  -H 'Content-Type: application/json' \
  -d '{"holder_did":"<DID>","verifier_nonce":"<NONCE>","disclosed_fields":["kycLevel","sanctionClear","amlCheck","countryRisk"]}'

# 验证证明
curl -X POST http://localhost:8099/api/proof/verify \
  -H 'Content-Type: application/json' \
  -d '{"proof":<PROOF_OBJECT>,"verifier_nonce":"<NONCE>"}'
```

---

## API 文档

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/issuer/setup` | POST | 初始化发行方（生成密钥、DID、注册） |
| `/api/user/kyc` | POST | 用户提交 KYC，获取可验证凭证 |
| `/api/proof/generate` | POST | 生成零知识证明 |
| `/api/proof/verify` | POST | 验证零知识证明（6 项检查） |
| `/api/credential/revoke` | POST | 撤销凭证（更新 Merkle 根） |
| `/api/demo/unlinkability` | POST | 不可关联性演示（3 次证明对比） |
| `/api/registry/status` | GET | 系统状态（凭证数、验证数等） |
| `/api/reset` | POST | 重置所有状态 |

所有 POST 端点返回格式：

```json
{
  "result": { ... },           // 操作结果
  "explanation": {             // 技术解释
    "title": "...",
    "steps": ["..."],
    "technical": "...",
    "next": "..."
  }
}
```

---

## 研究资料

- [Personhood Credentials (arXiv 2408.07892)](https://arxiv.org/html/2408.07892v1) — OpenAI/Microsoft，ZKP 在身份认证中的应用
- [Binance zkmerkle-proof-of-solvency](https://github.com/binance/zkmerkle-proof-of-solvency) — Binance PoS 零知识证明实现
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) — 可验证凭证标准
- [W3C DID Core](https://www.w3.org/TR/did-core/) — 去中心化标识符标准
- [BBS+ Signatures](https://identity.foundation/bbs-signature/draft-irtf-cfrg-bbs-signatures.html) — BBS+ 签名方案规范

---

## 声明

本项目为**研究原型 / 演示用途**，不是生产代码。密码学实现为简化版本，用于说明原理。生产系统应使用经过审计的密码学库和正式的 zk-SNARK/STARK 证明系统（如 gnark、circom）。

---

## License

MIT
