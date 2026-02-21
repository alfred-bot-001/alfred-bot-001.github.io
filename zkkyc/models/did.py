"""DID (Decentralized Identifier) Document Model."""
import time


def create_did_document(did: str, public_key_hex: str, name: str = "") -> dict:
    """Create a W3C-compliant DID Document."""
    return {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/v2",
        ],
        "id": did,
        "name": name,
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "verificationMethod": [
            {
                "id": f"{did}#key-1",
                "type": "EcdsaSecp256r1VerificationKey2019",
                "controller": did,
                "publicKeyHex": public_key_hex,
            }
        ],
        "authentication": [f"{did}#key-1"],
        "assertionMethod": [f"{did}#key-1"],
    }
