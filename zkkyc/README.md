# 🔐 zkKYC — 零知识 KYC 凭证系统

**Zero-Knowledge KYC Credential System — On-Chain P2P Privacy Compliance**

链上 P2P 交易场景下，用零知识证明实现隐私合规：证明你通过了 KYC，但不暴露任何个人信息。

In on-chain P2P trading scenarios, use zero-knowledge proofs for privacy compliance: prove you passed KYC without revealing any personal information.

---

## 🚀 一键启动 / Quick Start

**前提 / Prerequisites:** Python 3.10+

```bash
git clone git@github.com:alfred-bot-001/zero-knowledge-proofs.git
cd zero-knowledge-proofs/zkkyc
./start.sh
```

脚本会自动完成：
1. 创建 Python 虚拟环境 (`venv`)
2. 安装所有依赖 (`fastapi`, `uvicorn`, `ecdsa`)
3. 启动服务

The script automatically:
1. Creates a Python virtual environment (`venv`)
2. Installs all dependencies (`fastapi`, `uvicorn`, `ecdsa`)
3. Starts the server

启动后打开 / After startup, open: **http://localhost:8099**

---

## 📖 手动启动 / Manual Start

```bash
cd zkkyc
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python app.py
```

如需更改端口，修改 `app.py` 最后一行：

To change port, edit the last line in `app.py`:

```python
uvicorn.run(app, host="0.0.0.0", port=8099)
```

---

## 🌐 页面说明 / Pages

| URL | 中文 | English |
|-----|------|---------|
| `http://localhost:8099/` | 技术视角 — 7步完整演示 zkKYC 流程 | Technical View — 7-step full zkKYC demo |
| `http://localhost:8099/user-demo.html` | 用户视角 — 3种交互方案 | User View — 3 interaction scenarios |

页面右上角有 **中/EN 切换按钮**，支持中英文实时切换。

Language toggle button (中/EN) is available at the top-right corner of each page.

---

## 🔬 技术视角 7 步演示 / Technical View: 7-Step Demo

| 步骤 / Step | 内容 / Content |
|-------------|----------------|
| ① 发行方初始化 / Initialize Issuer | 生成 ECDSA 密钥对，创建 DID，注册链上 / Generate ECDSA keys, create DID, register on-chain |
| ② KYC & 凭证签发 / KYC & Credential | 用户提交 KYC，签发 BBS+ 签名的 W3C 可验证凭证 / Submit KYC, issue BBS+ signed W3C VC |
| ③ P2P 交易请求 / P2P Trade Request | Bob 生成挑战 nonce，请求 Alice 证明 KYC / Bob generates challenge nonce |
| ④ 生成 ZK 证明 / Generate ZK Proof | 选择性披露 + Merkle 成员证明 + Nullifier / Selective disclosure + Merkle proof + Nullifier |
| ⑤ 验证证明 / Verify Proof | 逐步动画验证：签名→Merkle→Nullifier→合规→过期 / Animated step-by-step verification |
| ⑥ 凭证撤销 / Revocation | 从 Merkle 树移除，旧证明自动失效 / Remove from Merkle tree, old proofs auto-invalidate |
| ⑦ 不可关联性 / Unlinkability | 同一凭证生成 3 个无法关联的证明 / Same credential, 3 unlinkable proofs |

## 👤 用户视角 3 种方案 / User View: 3 Scenarios

| 方案 / Scenario | 说明 / Description |
|-----------------|-------------------|
| 📱 钱包对钱包 / Wallet-to-Wallet | SDK 自动完成，双方钱包直接交互 / SDK handles everything, direct wallet interaction |
| 🌐 P2P 平台 / P2P Platform | 平台自动请求并验证 KYC 证明 / Platform auto-requests and verifies KYC proof |
| 💻 手动验证 / Manual Verification | 类似 Binance PoR，下载开源工具本地验证 / Like Binance PoR, download tools to verify locally |

---

## 🏗️ 项目结构 / Project Structure

```
zkkyc/
├── app.py                  # FastAPI 服务入口 / FastAPI server entry
├── requirements.txt        # Python 依赖 / Python dependencies
├── start.sh               # 一键启动脚本 / One-click start script
├── crypto/                 # 密码学模块 / Cryptography modules
│   ├── keys.py            #   ECDSA 密钥管理 / ECDSA key management
│   ├── bbs.py             #   BBS+ 签名 / BBS+ signatures
│   ├── merkle.py          #   Merkle 树 / Merkle tree
│   ├── nullifier.py       #   消零器 / Nullifier generation
│   ├── commitments.py     #   Pedersen 承诺 / Pedersen commitments
│   └── zkproof.py         #   ZK 证明生成与验证 / ZK proof gen & verify
├── models/                 # 数据模型 / Data models
│   ├── did.py             #   DID 文档 / DID documents
│   ├── credential.py      #   可验证凭证 / Verifiable credentials
│   └── proof.py           #   可验证展示 / Verifiable presentations
└── static/                 # 前端 / Frontend
    ├── index.html         #   技术视角页面 / Technical view
    ├── user-demo.html     #   用户视角页面 / User view
    ├── app.js             #   主逻辑 / Main logic
    ├── style.css          #   样式 / Styles
    └── i18n.js            #   中英文翻译 / i18n translations
```

---

## 🔑 核心技术 / Core Technologies

- **BBS+ Signatures** — 选择性披露，只展示你想展示的字段 / Selective disclosure
- **Merkle Tree** — 非撤销证明，不暴露哪个凭证 / Non-revocation proof without revealing which credential
- **Nullifier** — 防重放 + 不可关联 / Anti-replay + unlinkable
- **W3C DID / VC** — 去中心化身份标准 / Decentralized identity standards
- **Pedersen Commitments** — 隐藏值的密码学承诺 / Cryptographic commitments for hidden values

---

## ⚠️ 免责声明 / Disclaimer

本项目为教育演示，密码学实现为模拟，不适用于生产环境。

This is an educational demo. Cryptographic implementations are simulated and not suitable for production use.
