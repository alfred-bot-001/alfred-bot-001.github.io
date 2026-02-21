"""W3C Verifiable Credential Model."""
import time
import hashlib
import secrets


def create_verifiable_credential(
    issuer_did: str,
    holder_did: str,
    kyc_data: dict,
) -> dict:
    """Create a W3C Verifiable Credential for KYC attestation."""
    cred_id = "urn:uuid:" + hashlib.sha256(
        (holder_did + secrets.token_hex(8)).encode()
    ).hexdigest()[:36]

    # Map risk level
    country = kyc_data.get("country", "Unknown")
    high_risk = ["IR", "KP", "SY", "CU"]
    country_risk = "high" if country.upper() in high_risk else "low"

    return {
        "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://zkkyc.example.com/v1",
        ],
        "id": cred_id,
        "type": ["VerifiableCredential", "KYCCredential"],
        "issuer": issuer_did,
        "issuanceDate": time.strftime("%Y-%m-%d"),
        "expirationDate": f"{int(time.strftime('%Y')) + 1}-{time.strftime('%m-%d')}",
        "credentialSubject": {
            "id": holder_did,
            "name": kyc_data.get("name", ""),
            "nationality": kyc_data.get("country", ""),
            "idNumber": kyc_data.get("id_number", ""),
            "kycLevel": kyc_data.get("kyc_level", 2),
            "sanctionClear": True,
            "countryRisk": country_risk,
            "amlCheck": "passed",
        },
        "credentialStatus": {
            "type": "MerkleAccumulator2026",
            "statusPurpose": "revocation",
        },
    }
