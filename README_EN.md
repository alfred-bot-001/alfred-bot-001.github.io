# zkKYC — Zero-Knowledge KYC Credential System

> A privacy-preserving compliance solution for on-chain P2P transactions: prove you passed KYC without revealing any personal information.

## 📋 Table of Contents

- [Background & Problem](#background--problem)
- [Solution Overview](#solution-overview)
- [System Architecture](#system-architecture)
- [Core Technologies](#core-technologies)
- [Complete Flow](#complete-flow)
- [Bob's Verification Flow](#bobs-verification-flow)
- [Where Does the Merkle Root Come From](#where-does-the-merkle-root-come-from)
- [Three Verification Approaches](#three-verification-approaches)
- [Security Design](#security-design)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [References](#references)

---

## Background & Problem

In on-chain P2P transfer scenarios, there is a fundamental contradiction:

```
Alice ←→ Bob  (On-chain P2P transfer)

❌ Problem:
  · Neither party has done on-chain KYC
  · Bob worries whether Alice is on a sanctions list
  · Bob worries whether transacting with Alice could compromise his account
  · But Alice doesn't want to reveal her real identity

✅ Requirements:
  · Alice can prove she passed KYC at a major institution (e.g., Binance)
  · No personal information revealed (name, nationality, ID number)
  · No disclosure of which institution issued the KYC
  · Proof cannot be linked to Alice's on-chain address or transactions
  · Bob can verify independently without trusting Alice
```

Traditional approaches either lack privacy (presenting passport/ID) or lack security (self-declaration).

**zkKYC solves this contradiction with zero-knowledge proofs.**

---

## Solution Overview

zkKYC is a zero-knowledge proof-based KYC credential system that enables users to:

| Can Prove | Won't Reveal |
|---|---|
| ✅ Passed KYC verification | ❌ Real name |
| ✅ Not on sanctions list | ❌ Nationality |
| ✅ Passed AML checks | ❌ ID number |
| ✅ Credential not expired or revoked | ❌ Issuing institution |
| ✅ Each proof is unlinkable | ❌ On-chain address/transactions |

---

## System Architecture

### Roles

| Role | Description | Example |
|---|---|---|
| **Issuer** | Completes KYC review, issues credentials | Binance, Coinbase |
| **Holder** | Holds credentials, generates ZK proofs on demand | Alice (user) |
| **Verifier** | Verifies zero-knowledge proofs | Bob (counterparty) |
| **Registry** | On-chain contract storing public keys and Merkle roots | BNB Chain contract |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   On-chain (Smart Contract)               │
│                                                           │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ DID Registry │  │  Revocation   │  │   Verifier    │  │
│  │              │  │  Accumulator  │  │   Contract    │  │
│  │ · Issuer DID │  │  · Merkle Root│  │  · Verify ZKP │  │
│  │ · Public Keys│  │  · Revocation │  │  · Nullifier  │  │
│  └──────────────┘  └───────────────┘  └───────────────┘  │
└────────▲───────────────────▲──────────────────▲──────────┘
         │                   │                  │
         │   Read public key │  Read Merkle root│  Submit proof
         │                   │                  │
┌────────┴───────────────────┴──────────────────┴──────────┐
│                    Off-chain                               │
│                                                           │
│  ┌───────────┐     ┌───────────┐     ┌────────────────┐  │
│  │  Issuer   │────▶│  Holder   │────▶│    Verifier    │  │
│  │ (Binance) │Cred.│  (Alice)  │ ZKP │    (Bob)       │  │
│  │           │     │           │     │                │  │
│  │ Issue VC  │     │ Gen Proof │     │ Verify Proof   │  │
│  └───────────┘     └───────────┘     └────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Choice | Description |
|---|---|---|
| DID Standard | `did:zkkyc` | Based on W3C DID Core |
| Credential Standard | W3C Verifiable Credentials v2 | Verifiable Credentials |
| Signature Scheme | BBS+ (simplified) | Native selective disclosure support |
| Commitment Scheme | Pedersen Commitment (Hash-based) | Hide values while enabling verification |
| Revocation | Merkle Tree Accumulator | On-chain stub, O(1) revocation |
| Anti-Replay | Nullifier | Hash(secret ‖ nonce) |
| Elliptic Curve | ECDSA P-256 (NIST) | Key generation and signing |
| Backend | Python + FastAPI | API service |
| Frontend | Plain HTML/JS/CSS | No framework dependencies |

---

## Core Technologies

### 1. BBS+ Selective Disclosure Signatures

Traditional signatures (ECDSA): after signing, you either reveal everything or nothing.

BBS+ signatures: sign N fields, selectively reveal M of them, while proving the remaining fields were also signed.

```
Signing (Issuer):
  Generate commitment per field: commitment_i = Hash(value_i || blinding_i)
  Sign all commitments together: signature = ECDSA.sign(concat(all_commitments))

Disclosure (Holder):
  Disclosed fields: provide value + blinding (commitment verifiable)
  Hidden fields: provide only commitment (value cannot be derived)
  Signature: unchanged (covers all field commitments)

Verification (Verifier):
  1. Check disclosed fields: value + blinding matches commitment    ✓
  2. Check signature covers all commitments (including hidden ones)  ✓
  3. Conclusion: hidden fields were indeed signed, but values unknown ✓
```

### 2. Merkle Tree Revocation Accumulator

```
Valid credential set:

          [Root]              ← Public on-chain
         /      \
      [H01]    [H23]
      /   \    /   \
    [H0] [H1] [H2] [H3]     ← Leaves = Hash(credential_id)
     │    │    │    │
   Cred0 Cred1 Cred2 Cred3

Revoking Cred1:
  → Remove leaf H1 from tree
  → Recompute root → New Root' (different from old Root)
  → Update on-chain Root → Root'
  → Cred1's Merkle path can no longer compute Root'

Key: The tree doesn't reveal which leaf was removed
```

### 3. Nullifier

```
Nullifier = Hash(credential_secret || context_nonce)

Scenario 1: Unlinkability (different nonce each time)
  Tx 1: Nullifier = Hash(secret || nonce_A) = 0xabc...
  Tx 2: Nullifier = Hash(secret || nonce_B) = 0x7f3...
  Tx 3: Nullifier = Hash(secret || nonce_C) = 0xd41...
  → Three completely different Nullifiers, cannot determine same person

Scenario 2: Anti-replay (same nonce produces same nullifier)
  Bob sends nonce_X to Alice
  Alice generates proof (with Nullifier_X)
  Alice resubmits same proof → Nullifier_X already recorded → Rejected
```

### 4. DID (Decentralized Identifier)

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:zkkyc:ee814b5633c46f3c...",       // Derived from public key hash
  "verificationMethod": [{
    "id": "did:zkkyc:ee814b...#key-1",
    "type": "EcdsaSecp256r1VerificationKey2019",
    "publicKeyHex": "04a7c3b8..."               // Registered on-chain
  }]
}
```

### 5. W3C Verifiable Credentials (VC)

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "KYCCredential"],
  "issuer": "did:zkkyc:Binance...",             // Issuer DID
  "credentialSubject": {
    "id": "did:zkkyc:Alice...",                 // Holder DID
    "kycLevel": 2,                              // ← Selectively disclosable
    "sanctionClear": true,                      // ← Selectively disclosable
    "amlCheck": "passed",                       // ← Selectively disclosable
    "countryRisk": "low",                       // ← Selectively disclosable
    "name": "Zhang Xiaoming",                   // ← Hidden
    "nationality": "SG",                        // ← Hidden
    "idNumber": "S1234567A"                     // ← Hidden
  }
}
```

---

## Complete Flow

### Phase 1: Credential Issuance (One-time)

```
User completes KYC
     │
     ▼
┌─────────────────────────────────────────────────────┐
│ Binance (Issuer)                                     │
│                                                       │
│  1. Verify user identity (name, documents, face)      │
│  2. Generate user-specific DID (unrelated to address) │
│  3. Create W3C Verifiable Credential (VC)             │
│  4. Sign all fields with BBS+ signature               │
│  5. Add credential ID to Merkle tree                  │
│  6. Update on-chain Merkle root                       │
│  7. Send credential + signature data to user          │
│                                                       │
│  ⚠️ Binance does NOT retain personal info afterwards  │
│     Only keeps credential ID for revocation           │
└─────────────────────────────────────────────────────┘
     │
     ▼
User stores credential locally (mobile wallet / browser extension)
```

### Phase 2: P2P Transaction

```
Bob                              Alice
 │                                │
 │  ① "Prove your KYC status"    │
 │───────────────────────────────▶│
 │                                │
 │  ② Send random nonce           │
 │───────────────────────────────▶│
 │                                │
 │                                │  ③ Generate ZK proof locally:
 │                                │     · Selective disclosure (BBS+)
 │                                │     · Merkle membership proof
 │                                │     · Nullifier generation
 │                                │     · Expiration check
 │                                │
 │  ④ Send proof.json (~2KB)      │
 │◀───────────────────────────────│
 │                                │
 │  ⑤ Verify proof:               │
 │     · Read public key on-chain  │
 │     · Read Merkle root on-chain │
 │     · Check each item           │
 │                                │
 │  ⑥ Verified → Execute trade    │
 │◀══════════════════════════════▶│
```

### Phase 3: Revocation (If Needed)

```
User added to sanctions list
     │
     ▼
Binance removes credential ID from Merkle tree
     │
     ▼
On-chain Merkle root updated
     │
     ▼
Any new proof from this user will fail verification
(Merkle path cannot compute the new root)

⚠️ Revocation does not reveal the identity of the revoked user
```

---

## Bob's Verification Flow

After receiving Alice's proof.json, Bob performs 6 verification steps:

```
┌─────────────────────────────────────────────────────┐
│ Step 0: Fetch trust anchors from chain               │
│                                                       │
│  issuer_pubkey = Registry.getIssuer().publicKey       │
│  merkle_root   = Registry.getIssuer().merkleRoot      │
│                                                       │
│  ⚡ Key: These values come from on-chain contracts    │
│     Alice cannot forge them                           │
│     Bob reads the chain himself, no trust needed      │
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│ Step 1: Verify BBS+ Signature                        │
│                                                       │
│  For each disclosed field:                            │
│    assert Hash(value || blinding) == commitment       │
│                                                       │
│  For all field commitments:                           │
│    combined = sort_concat(all_commitments)             │
│    ECDSA.verify(issuer_pubkey, combined, signature)   │
│                                                       │
│  ✅ Confirmed: fields were genuinely signed by issuer │
│     Hidden field commitments are also in the signature│
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│ Step 2: Verify Merkle Proof (Non-revocation)         │
│                                                       │
│  current = leaf_hash                                  │
│  for sibling in proof.siblings:                       │
│    current = Hash(current + sibling)                  │
│  assert current == merkle_root  ← from chain          │
│                                                       │
│  ✅ Confirmed: credential is in valid set (not revoked)│
│     Bob doesn't know which specific credential        │
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│ Step 3: Check Nullifier                              │
│                                                       │
│  assert proof.nullifier NOT IN used_nullifiers        │
│  used_nullifiers.add(proof.nullifier)                 │
│                                                       │
│  ✅ Confirmed: this proof has not been replayed       │
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│ Step 4: Check Business Compliance Fields             │
│                                                       │
│  assert sanctionClear == true    → not sanctioned     │
│  assert amlCheck == "passed"     → AML passed         │
│  assert kycLevel >= 1            → sufficient level   │
│  assert countryRisk != "high"    → acceptable risk    │
│                                                       │
│  ✅ These values are confirmed genuine via signature  │
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│ Step 5: Expiration Check                             │
│                                                       │
│  assert proof.expirationProof.notExpired == true      │
│                                                       │
│  ✅ Credential is still within validity period        │
└───────────────────────────────┬───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────┐
│                   Final Verdict                      │
│                                                       │
│  All passed ✅ → Proof valid, safe to transact        │
│  Any failed ❌ → Reject transaction                   │
└─────────────────────────────────────────────────────┘
```

### What Bob Knows vs. Doesn't Know After Verification

| ✅ Bob Knows | ❌ Bob Doesn't Know |
|---|---|
| Alice passed KYC at a major institution | Alice's real name |
| Alice is not on sanctions list | Alice's nationality |
| Alice passed AML checks | Alice's ID number |
| Alice's country risk is low | Whether Binance or Coinbase issued it |
| Credential is not expired or revoked | Alice's other on-chain transactions |

---

## Where Does the Merkle Root Come From

**Core principle: Bob's trust comes from on-chain data, independent of Alice.**

### Approach 1: On-chain Contract Storage (Recommended)

```
Binance updates on-chain contract after each issuance/revocation:

┌──────────────────────────────────┐
│  On-chain Registry (Public Data) │
│                                    │
│  issuer_pubkey: 0x04a7c3b8...     │  ← Anyone can read
│  merkle_root:   0xf3b1a2c4...     │  ← Anyone can read
│  last_updated:  1740100000        │
└──────────────────────────────────┘
         ▲
         │ Bob reads contract directly
         │ (ethers.js / web3.py)
         │
       Bob
```

### Approach 2: Multi-source Cross-verification

```
Bob queries simultaneously:
  ① On-chain contract    → merkle_root = 0xf3b1...
  ② Binance website      → merkle_root = 0xf3b1...
  ③ Third-party auditor  → merkle_root = 0xf3b1...

All three match → Trustworthy
```

### FAQ

**Q: Does the Merkle root change every time Alice generates a new proof?**

A: **No.** The Merkle root only changes when credentials are issued or revoked. Proof generation is a local operation by Alice and doesn't involve the Merkle tree.

**Q: Where does Alice get her Merkle path?**

A: Binance provides it when issuing the credential. When the Merkle tree updates, a new path is pushed. Similar to Binance Proof of Reserves approach.

**Q: Does Bob need to contact Binance?**

A: **No.** Bob only needs to read the on-chain contract. That's what "decentralized verification" means.

---

## Three Verification Approaches

### 📱 Approach A: Wallet-integrated SDK

```javascript
// Alice's side (1 line of code)
const proof = await zkkyc.generateProof(bobNonce);

// Bob's side (1 line of code)
const result = await verifier.verify(proof);
// result = { valid: true, kycLevel: 2, sanctionClear: true, ... }
```

**UX:** Wallet popup shows verification result, Bob clicks confirm.

### 🌐 Approach B: P2P Platform Auto-verification

Platform backend handles verification automatically. Bob only sees:

```
Seller KYC Status: ✅ Verified
  · KYC Level: 2 (Enhanced)
  · Sanctions Check: ✅ Passed
  · AML: ✅ Passed
```

Bob only clicks one button throughout.

### 💻 Approach C: Manual Verification (Similar to Binance PoR)

```bash
# 1. Download open-source verification tool
git clone https://github.com/binance/zkkyc-verifier.git
cd zkkyc-verifier && pip install -r requirements.txt

# 2. Verify proof file
python verify.py --proof proof.json --chain bnb-mainnet

# Output:
# [1/8] Connecting to BNB Chain RPC... ✅
# [2/8] Reading issuer public key from chain... ✅
# [3/8] Reading Merkle root from chain... ✅
# [4/8] Verifying BBS+ signature... ✅
# [5/8] Verifying Merkle membership proof... ✅
# [6/8] Checking Nullifier... ✅
# [7/8] Checking sanctions & AML... ✅
# [8/8] Checking credential validity... ✅
#
# ✅ Verification Result: VALID
```

---

## Security Design

| Risk | Mitigation |
|---|---|
| Credential resale | Credential bound to user DID private key; resale = giving up private key |
| Issuer collusion tracking | BBS+ blind signatures; issuer cannot link issuance and usage |
| Proof replay | Nullifier + timestamp + verifier random challenge |
| Expired but not revoked | Merkle tree revocation + expiration time check |
| Fake KYC | Issuer reputation mechanism + on-chain staking penalties |
| Merkle root forgery | On-chain contract storage, verifiable by anyone |
| Quantum threat | Future migration to lattice-based ZKP |

---

## Project Structure

```
zero-knowledge-proofs/
├── README.md                          # Chinese documentation
├── README_EN.md                       # English documentation (this file)
├── SPEC.md                            # Detailed specification
├── zkkyc/
│   ├── app.py                         # FastAPI backend (7 API endpoints)
│   ├── requirements.txt               # Python dependencies
│   ├── crypto/                        # Cryptography modules
│   │   ├── keys.py                    # ECC key generation (ECDSA P-256)
│   │   ├── bbs.py                     # BBS+ selective disclosure signatures
│   │   ├── commitments.py             # Pedersen commitments (Hash-based)
│   │   ├── merkle.py                  # Merkle tree revocation accumulator
│   │   ├── nullifier.py              # Nullifier generation
│   │   └── zkproof.py                # ZK proof generation & verification
│   ├── models/                        # Data models
│   │   ├── did.py                     # DID document model
│   │   ├── credential.py             # W3C Verifiable Credential
│   │   └── proof.py                   # Proof presentation model
│   └── static/                        # Frontend demo
│       ├── index.html                 # Technical demo (7-step flow)
│       ├── user-demo.html             # User demo (3 approaches)
│       ├── style.css                  # Dark theme styles
│       └── app.js                     # Frontend interaction logic
```

---

## Quick Start

### Installation

```bash
git clone https://github.com/alfred-bot-001/zero-knowledge-proofs.git
cd zero-knowledge-proofs/zkkyc

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Run

```bash
python3 app.py
```

Server runs at `http://localhost:8099`

### Demo Pages

| Page | URL | Description |
|---|---|---|
| Technical View | `http://localhost:8099/` | 7-step interactive flow + Bob verification animation + annotated JSON |
| User View | `http://localhost:8099/user-demo.html` | 3 approach comparison (wallet/platform/manual) |

### API Testing

```bash
# Initialize issuer
curl -X POST http://localhost:8099/api/issuer/setup

# Issue KYC credential
curl -X POST http://localhost:8099/api/user/kyc \
  -H 'Content-Type: application/json' \
  -d '{"name":"Zhang Xiaoming","country":"SG","id_number":"S1234567A","kyc_level":2}'

# Generate zero-knowledge proof
curl -X POST http://localhost:8099/api/proof/generate \
  -H 'Content-Type: application/json' \
  -d '{"holder_did":"<DID>","verifier_nonce":"<NONCE>","disclosed_fields":["kycLevel","sanctionClear","amlCheck","countryRisk"]}'

# Verify proof
curl -X POST http://localhost:8099/api/proof/verify \
  -H 'Content-Type: application/json' \
  -d '{"proof":<PROOF_OBJECT>,"verifier_nonce":"<NONCE>"}'
```

---

## API Documentation

| Endpoint | Method | Description |
|---|---|---|
| `/api/issuer/setup` | POST | Initialize issuer (generate keys, DID, register) |
| `/api/user/kyc` | POST | User submits KYC, receives verifiable credential |
| `/api/proof/generate` | POST | Generate zero-knowledge proof |
| `/api/proof/verify` | POST | Verify zero-knowledge proof (6 checks) |
| `/api/credential/revoke` | POST | Revoke credential (update Merkle root) |
| `/api/demo/unlinkability` | POST | Unlinkability demo (compare 3 proofs) |
| `/api/registry/status` | GET | System status (credential count, verification count, etc.) |
| `/api/reset` | POST | Reset all state |

All POST endpoints return:

```json
{
  "result": { ... },           // Operation result
  "explanation": {             // Technical explanation
    "title": "...",
    "steps": ["..."],
    "technical": "...",
    "next": "..."
  }
}
```

---

## References

- [Personhood Credentials (arXiv 2408.07892)](https://arxiv.org/html/2408.07892v1) — OpenAI/Microsoft, ZKP in identity verification
- [Binance zkmerkle-proof-of-solvency](https://github.com/binance/zkmerkle-proof-of-solvency) — Binance PoS zero-knowledge proof implementation
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) — Verifiable Credentials standard
- [W3C DID Core](https://www.w3.org/TR/did-core/) — Decentralized Identifiers standard
- [BBS+ Signatures](https://identity.foundation/bbs-signature/draft-irtf-cfrg-bbs-signatures.html) — BBS+ signature scheme specification

---

## Disclaimer

This project is a **research prototype / demo**. Not production code. Cryptographic implementations are simplified for illustrative purposes. Production systems should use audited cryptographic libraries and formal zk-SNARK/STARK proof systems (e.g., gnark, circom).

---

## License

MIT
