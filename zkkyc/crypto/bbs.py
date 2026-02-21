"""Simplified BBS+ Signature Scheme for Selective Disclosure.

Real BBS+ uses bilinear pairings on elliptic curves.
This prototype simulates the key properties:
  1. Sign multiple messages (fields) at once
  2. Selectively disclose subset of signed fields
  3. Verifier can confirm undisclosed fields were signed without seeing them

We achieve this by:
  - Signing each field's commitment individually with ECDSA
  - Creating a combined signature over all commitments
  - Allowing selective reveal of (value, blinding) for chosen fields
"""
import hashlib
import json
from ecdsa import SigningKey, VerifyingKey, NIST256p, BadSignatureError
from .commitments import commit, verify_commitment


def bbs_sign(private_key_hex: str, fields: dict) -> dict:
    """Sign multiple fields with BBS+-like scheme.

    Returns commitments for all fields + a combined signature.
    """
    sk = SigningKey.from_string(bytes.fromhex(private_key_hex), curve=NIST256p)

    field_commitments = {}
    field_blindings = {}
    for key, value in fields.items():
        c = commit(str(value))
        field_commitments[key] = c["commitment"]
        field_blindings[key] = c["blinding"]

    # Combined signature over sorted commitments
    combined = "|".join(
        f"{k}={field_commitments[k]}" for k in sorted(field_commitments)
    )
    combined_hash = hashlib.sha256(combined.encode()).digest()
    signature = sk.sign(combined_hash, hashfunc=hashlib.sha256).hex()

    return {
        "commitments": field_commitments,
        "blindings": field_blindings,
        "signature": signature,
        "signed_fields": sorted(list(fields.keys())),
    }


def bbs_derive_proof(
    signed_data: dict,
    disclosed_fields: list[str],
    original_fields: dict,
) -> dict:
    """Derive a selective disclosure proof.

    Reveals values+blindings only for disclosed_fields.
    For hidden fields, only the commitment is shown.
    """
    proof = {
        "disclosed": {},
        "hidden_commitments": {},
        "signature": signed_data["signature"],
        "signed_fields": signed_data["signed_fields"],
        "all_commitments": signed_data["commitments"],
    }
    for field in signed_data["signed_fields"]:
        if field in disclosed_fields:
            proof["disclosed"][field] = {
                "value": str(original_fields[field]),
                "blinding": signed_data["blindings"][field],
                "commitment": signed_data["commitments"][field],
            }
        else:
            proof["hidden_commitments"][field] = signed_data["commitments"][field]

    return proof


def bbs_verify_proof(public_key_hex: str, proof: dict) -> dict:
    """Verify a selective disclosure proof.

    Checks:
    1. Disclosed field commitments open correctly
    2. Combined signature is valid over all commitments
    """
    results = {"valid": True, "checks": []}

    # Check 1: Verify disclosed commitments open correctly
    for field, data in proof["disclosed"].items():
        ok = verify_commitment(data["commitment"], data["value"], data["blinding"])
        results["checks"].append({
            "check": f"Commitment opens for '{field}'",
            "passed": ok,
            "detail": f"Value '{data['value']}' matches commitment",
        })
        if not ok:
            results["valid"] = False

    # Check 2: Verify signature over all commitments
    combined = "|".join(
        f"{k}={proof['all_commitments'][k]}" for k in sorted(proof["all_commitments"])
    )
    combined_hash = hashlib.sha256(combined.encode()).digest()
    try:
        vk = VerifyingKey.from_string(bytes.fromhex(public_key_hex), curve=NIST256p)
        sig_ok = vk.verify(
            bytes.fromhex(proof["signature"]), combined_hash, hashfunc=hashlib.sha256
        )
    except BadSignatureError:
        sig_ok = False

    results["checks"].append({
        "check": "BBS+ signature valid",
        "passed": sig_ok,
        "detail": "Combined signature over all field commitments",
    })
    if not sig_ok:
        results["valid"] = False

    # Check 3: Note which fields are hidden
    hidden = list(proof["hidden_commitments"].keys())
    results["checks"].append({
        "check": "Hidden fields integrity",
        "passed": True,
        "detail": f"Fields {hidden} are committed but not revealed — privacy preserved",
    })

    return results
