"""Nullifier generation for unlinkable proofs.

Nullifier = Hash(credential_secret || context)

- With unique context per interaction: unlinkable (can't tell same user)
- With fixed scope: linkable within scope (detect double-use)
"""
import hashlib
import secrets


def generate_nullifier(credential_secret: str, context: str) -> str:
    """Generate a nullifier for a specific context.

    The nullifier is deterministic given the same secret and context,
    but reveals nothing about the credential or its holder.
    """
    return hashlib.sha256(
        (credential_secret + "||" + context).encode()
    ).hexdigest()


def generate_random_nonce() -> str:
    """Generate a random nonce for a verification challenge."""
    return secrets.token_hex(16)


def check_nullifier_reuse(nullifier: str, used_nullifiers: set) -> bool:
    """Check if a nullifier has been used before (double-spend detection)."""
    return nullifier in used_nullifiers
