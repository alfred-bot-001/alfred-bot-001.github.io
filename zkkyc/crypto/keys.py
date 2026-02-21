"""ECC Key Generation using NIST P-256 curve."""
import hashlib
import secrets
from ecdsa import SigningKey, VerifyingKey, NIST256p, BadSignatureError


def generate_keypair():
    """Generate an ECC keypair on NIST P-256."""
    sk = SigningKey.generate(curve=NIST256p)
    vk = sk.get_verifying_key()
    return {
        "private_key": sk.to_string().hex(),
        "public_key": vk.to_string().hex(),
        "algorithm": "ECDSA-P256",
    }


def sign_message(private_key_hex: str, message: bytes) -> str:
    """Sign a message with ECDSA."""
    sk = SigningKey.from_string(bytes.fromhex(private_key_hex), curve=NIST256p)
    sig = sk.sign(message, hashfunc=hashlib.sha256)
    return sig.hex()


def verify_signature(public_key_hex: str, message: bytes, signature_hex: str) -> bool:
    """Verify an ECDSA signature."""
    try:
        vk = VerifyingKey.from_string(bytes.fromhex(public_key_hex), curve=NIST256p)
        return vk.verify(bytes.fromhex(signature_hex), message, hashfunc=hashlib.sha256)
    except BadSignatureError:
        return False


def derive_did(public_key_hex: str) -> str:
    """Derive a DID from a public key."""
    key_hash = hashlib.sha256(bytes.fromhex(public_key_hex)).hexdigest()[:40]
    return f"did:zkkyc:{key_hash}"
