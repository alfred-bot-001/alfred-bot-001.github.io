# zkKYC — Zero-Knowledge KYC Credential System

## Overview
A complete end-to-end prototype of a privacy-preserving KYC credential system for blockchain P2P transfers. Users can prove they passed KYC at a major institution without revealing any personal information.

## Business Context
In on-chain P2P transfers, neither party has done KYC. But one party often worries the other might be on a sanctions list, involved in money laundering, or non-compliant — which could affect their own account safety. They want the other party to prove they have KYC from a trusted institution, but WITHOUT revealing:
- Who they are
- Which institution issued the KYC
- Any link to the current transaction

## Architecture

### Roles
1. **Issuer** (e.g., Binance) — Issues KYC credentials after user completes KYC
2. **Holder** (User) — Holds credential, generates ZK proofs on demand
3. **Verifier** (Counterparty) — Verifies the ZK proof before transacting

### Tech Stack
- **Backend**: Python (FastAPI)
- **Frontend**: Single-page web app (HTML/JS/CSS)
- **ZKP**: Python implementation using elliptic curves and hash-based commitments
- **DID**: Simplified DID document model
- **Signatures**: BBS+-like selective disclosure (simplified for prototype)
- **Revocation**: Merkle tree accumulator

## What to Build

### Single web application with interactive demo flow:

**Page Layout:**
- Left side: Interactive controls and forms
- Right side: Technical explanation panel showing what's happening at each step
- Bottom: Transaction log / proof inspector

**Step-by-step interactive flow:**

#### Step 1: Issuer Setup
- Button: "Initialize Issuer (Binance)"
- Creates Issuer DID, generates keypair
- Deploys mock "on-chain" registry
- Explanation panel: What is a DID? What keys are generated? Why BBS+?

#### Step 2: User KYC & Credential Issuance
- Form: Enter mock user info (name, country, ID number)
- Button: "Complete KYC & Issue Credential"
- Shows: The full VC that gets created (with all fields)
- Shows: What gets stored on user's device vs what Issuer keeps
- Explanation: W3C VC structure, BBS+ signatures, what each field means

#### Step 3: P2P Transaction Request
- Two wallet panels: Alice (holder) and Bob (verifier)
- Bob requests: "Prove you have valid KYC before I transact"
- Bob sends a random challenge/nonce
- Explanation: Why a fresh nonce? What is unlinkability?

#### Step 4: ZK Proof Generation
- Alice's side generates ZK proof
- Animated/visual: Show which fields are hidden, which statements are proven
- Show the proof object (compact, no personal data)
- Explanation: What the circuit proves, what nullifier means, selective disclosure

#### Step 5: Verification
- Bob verifies the proof
- Check: Valid signature? Not expired? Not revoked? Sanctions clear?
- Green checkmark for each check
- Explanation: What each verification step does

#### Step 6: Revocation Demo
- Button: "Revoke Alice's credential" (simulate sanctions hit)
- Try to generate new proof → still generates
- Try to verify → FAILS at revocation check
- Explanation: How revocation works without revealing who was revoked

#### Step 7: Unlinkability Demo
- Generate multiple proofs from same credential
- Show they look completely different
- Show nullifiers are different (with different nonces)
- Explanation: Why proofs can't be linked, comparison with traditional KYC

### Technical Requirements:
1. All crypto operations happen in Python backend, called via API
2. Frontend is pure HTML/JS/CSS (no framework needed, keep it simple)
3. Use actual elliptic curve math (py_ecc or similar) — not just mock/fake
4. The ZKP doesn't need to be production-grade Groth16, but must demonstrate real:
   - Commitment schemes (Pedersen commitments)
   - Hash-based proofs (Merkle proofs for revocation)
   - Signature verification in ZK (simplified)
   - Nullifier generation
   - Selective disclosure
5. Each API endpoint returns both the result AND a human-readable explanation
6. Beautiful, modern UI with dark theme
7. Step-by-step flow with clear visual progression
8. Code panel showing the actual crypto operations

### API Endpoints:
```
POST /api/issuer/setup          — Initialize issuer DID + keys
POST /api/user/kyc              — Submit KYC and receive credential
POST /api/proof/generate        — Generate ZK proof from credential
POST /api/proof/verify          — Verify a ZK proof
POST /api/credential/revoke     — Revoke a credential
POST /api/demo/unlinkability    — Generate multiple proofs for comparison
GET  /api/registry/status       — Get current registry state
```

### File Structure:
```
zkkyc/
├── app.py                 # FastAPI main app
├── crypto/
│   ├── __init__.py
│   ├── keys.py           # Key generation (ECC)
│   ├── bbs.py            # BBS+ signature (simplified)
│   ├── commitments.py    # Pedersen commitments
│   ├── merkle.py         # Merkle tree for revocation
│   ├── nullifier.py      # Nullifier generation
│   └── zkproof.py        # ZK proof generation & verification
├── models/
│   ├── __init__.py
│   ├── did.py            # DID document model
│   ├── credential.py     # Verifiable Credential model
│   └── proof.py          # Proof model
├── static/
│   ├── index.html        # Main demo page
│   ├── style.css         # Dark theme styling
│   └── app.js            # Frontend logic
├── requirements.txt
└── README.md
```

## Important Notes
- This is a PROTOTYPE / DEMO, not production code
- The ZKP is simplified but must use REAL cryptographic primitives
- Focus on making the demo educational and visually clear
- Each step must explain what's happening and WHY
- The UI should feel like a polished product demo, not a hacker project
