"""Pedersen-like Commitments using hash-based construction.

In a real system, Pedersen commitments use elliptic curve points:
  C = v*G + r*H  where G,H are generator points.

For this prototype we use a hash-based analogue:
  C = SHA256(v || r)  which is computationally hiding and binding
  under the random oracle model.
"""
import hashlib
import secrets


def commit(value: str, blinding: str | None = None) -> dict:
    """Create a commitment to a value.
    Returns commitment hash and blinding factor.
    """
    if blinding is None:
        blinding = secrets.token_hex(32)
    commitment = hashlib.sha256(
        (value + "||" + blinding).encode()
    ).hexdigest()
    return {
        "commitment": commitment,
        "value": value,
        "blinding": blinding,
    }


def verify_commitment(commitment: str, value: str, blinding: str) -> bool:
    """Verify that a commitment opens to the claimed value."""
    expected = hashlib.sha256(
        (value + "||" + blinding).encode()
    ).hexdigest()
    return commitment == expected


def commit_fields(fields: dict) -> dict:
    """Commit to multiple fields individually (for selective disclosure)."""
    commitments = {}
    blindings = {}
    for key, value in fields.items():
        result = commit(str(value))
        commitments[key] = result["commitment"]
        blindings[key] = result["blinding"]
    return {"commitments": commitments, "blindings": blindings}
