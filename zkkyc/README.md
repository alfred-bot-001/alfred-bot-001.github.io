# zkKYC — 零知识 KYC 凭证系统演示

Zero-Knowledge KYC Credential System — On-Chain P2P Privacy Compliance Demo

## 一键启动 / Quick Start

```bash
git clone <repo-url>
cd zkkyc
./start.sh
```

打开浏览器访问 `http://localhost:8099`

## 手动启动 / Manual Start

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python app.py
```

## 要求 / Requirements

- Python 3.10+
- 无其他外部依赖

## 页面 / Pages

| URL | 说明 |
|-----|------|
| `/` | 技术视角 — 7步演示完整 zkKYC 流程 |
| `/user-demo.html` | 用户视角 — 3种交互方案（钱包/平台/手动） |

支持中英文切换（页面右上角按钮）。

## 端口 / Port

默认 `8099`，修改 `app.py` 最后一行的 `port=8099`。
