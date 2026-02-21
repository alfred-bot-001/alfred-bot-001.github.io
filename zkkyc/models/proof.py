"""Proof presentation model."""


def create_presentation(holder_did: str, proof: dict, verifier_nonce: str) -> dict:
    """Wrap a ZK proof in a Verifiable Presentation."""
    return {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "type": ["VerifiablePresentation", "zkKYCPresentation"],
        "holder": holder_did,
        "verifierNonce": verifier_nonce,
        "proof": proof,
    }
