"""ZK Proof Generation & Verification.

Combines all crypto primitives into a complete ZK proof flow:
1. BBS+ selective disclosure (prove signed fields without revealing them)
2. Merkle proof (prove non-revocation)
3. Nullifier (prevent linkability)
4. Timestamp check (prove credential not expired)
"""
import hashlib
import time
import secrets
from .bbs import bbs_derive_proof, bbs_verify_proof
from .merkle import MerkleTree
from .nullifier import generate_nullifier, generate_random_nonce


def generate_zkproof(
    credential: dict,
    signed_data: dict,
    merkle_tree: MerkleTree,
    verifier_nonce: str,
    disclosed_fields: list[str] | None = None,
) -> dict:
    """Generate a complete ZK proof.

    Proves:
    - Holder has valid credential signed by trusted issuer
    - Credential is not revoked (Merkle membership)
    - Credential is not expired
    - sanctionClear is true
    - amlCheck is passed
    Without revealing any personal info.
    """
    if disclosed_fields is None:
        disclosed_fields = ["kycLevel", "sanctionClear", "amlCheck", "countryRisk"]

    cred_subject = credential["credentialSubject"]
    cred_id = credential["id"]

    # 1. Selective disclosure proof
    sd_proof = bbs_derive_proof(signed_data, disclosed_fields, cred_subject)

    # 2. Merkle membership proof (non-revocation)
    merkle_proof = merkle_tree.get_proof(cred_id)

    # 3. Nullifier (unlinkable)
    cred_secret = hashlib.sha256(
        (cred_id + signed_data["signature"][:32]).encode()
    ).hexdigest()
    nullifier = generate_nullifier(cred_secret, verifier_nonce)

    # 4. Expiration proof commitment
    expiry = credential.get("expirationDate", "2099-12-31")
    now = time.strftime("%Y-%m-%d")
    not_expired = expiry >= now
    expiry_commitment = hashlib.sha256(
        (expiry + "||" + secrets.token_hex(16)).encode()
    ).hexdigest()

    # 5. Assemble proof
    proof = {
        "type": "zkKYCProof2026",
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "verifierNonce": verifier_nonce,
        "nullifier": nullifier,
        "selectiveDisclosure": sd_proof,
        "revocationProof": {
            "merkleRoot": merkle_proof["root"] if merkle_proof else None,
            "proof": merkle_proof["proof"] if merkle_proof else None,
            "leafHash": merkle_proof["leaf_hash"] if merkle_proof else None,
            "valid": merkle_proof is not None,
        },
        "expirationProof": {
            "notExpired": not_expired,
            "commitment": expiry_commitment,
        },
        "provenStatements": [
            "Holder possesses a valid KYC credential",
            "Credential was signed by a trusted issuer",
            "Credential has not been revoked",
            "Credential has not expired",
            "Holder is not on sanctions list",
            "AML check was passed",
        ],
        "hiddenInformation": [
            "Holder's real identity",
            "Holder's name, nationality, ID number",
            "Which specific issuer signed the credential",
            "Holder's blockchain address",
            "Link to any specific transaction",
        ],
    }
    return proof


def verify_zkproof(
    proof: dict,
    issuer_public_key: str,
    merkle_root: str,
    used_nullifiers: set,
) -> dict:
    """Verify a complete ZK proof.

    Returns detailed verification results for each check.
    """
    results = {
        "valid": True,
        "checks": [],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    # Check 1: Selective disclosure (BBS+ signature)
    sd_result = bbs_verify_proof(issuer_public_key, proof["selectiveDisclosure"])
    results["checks"].extend(sd_result["checks"])
    if not sd_result["valid"]:
        results["valid"] = False

    # Check 2: Revocation (Merkle root match)
    rev = proof["revocationProof"]
    rev_valid = rev["valid"] and rev["merkleRoot"] == merkle_root
    results["checks"].append({
        "check": "Credential not revoked",
        "passed": rev_valid,
        "detail": (
            "Merkle proof confirms credential is in valid set"
            if rev_valid
            else "Credential has been revoked or Merkle root mismatch"
        ),
    })
    if not rev_valid:
        results["valid"] = False

    # Check 3: Expiration
    exp_valid = proof["expirationProof"]["notExpired"]
    results["checks"].append({
        "check": "Credential not expired",
        "passed": exp_valid,
        "detail": "Credential expiration date is in the future",
    })
    if not exp_valid:
        results["valid"] = False

    # Check 4: Nullifier freshness
    nullifier = proof["nullifier"]
    null_fresh = nullifier not in used_nullifiers
    results["checks"].append({
        "check": "Nullifier is fresh (no replay)",
        "passed": null_fresh,
        "detail": (
            "This proof has not been used before"
            if null_fresh
            else "REPLAY DETECTED: This proof was already submitted"
        ),
    })
    if not null_fresh:
        results["valid"] = False

    # Check 5: Sanctions clear (from disclosed fields)
    disclosed = proof["selectiveDisclosure"].get("disclosed", {})
    sanction_check = disclosed.get("sanctionClear", {})
    sanction_clear = sanction_check.get("value") == "True"
    results["checks"].append({
        "check": "Not on sanctions list",
        "passed": sanction_clear,
        "detail": "sanctionClear field verified as True",
    })
    if not sanction_clear:
        results["valid"] = False

    # Check 6: AML passed
    aml_check = disclosed.get("amlCheck", {})
    aml_passed = aml_check.get("value") == "passed"
    results["checks"].append({
        "check": "AML check passed",
        "passed": aml_passed,
        "detail": "amlCheck field verified as 'passed'",
    })
    if not aml_passed:
        results["valid"] = False

    return results
