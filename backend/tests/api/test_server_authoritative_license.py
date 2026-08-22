import base64
from datetime import datetime, timedelta, timezone
import hashlib
import json
import secrets
import urllib.parse
import uuid

from fastapi.testclient import TestClient
import jwt
import pytest

from app.core.config import settings
from app.services.token_service import JWT_AUDIENCE, JWT_ISSUER, create_access_token


def generate_pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(32)
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    challenge = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    return verifier, challenge


def test_pkce_authorization_code_and_token_exchange(client: TestClient) -> None:
    # 1. Register user
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": "pkce_user@example.com", "password": "securepassword123"},
    )
    assert reg_resp.status_code == 201
    user_id = reg_resp.json()["id"]

    code_verifier, code_challenge = generate_pkce_pair()
    redirect_uri = "http://127.0.0.1:45678/callback"
    state = "state-xyz-123"

    # Test 1: Authorize via Consent form
    consent_resp = client.post(
        "/oauth/consent",
        data={
            "user_id": user_id,
            "client_id": "revitapp-desktop",
            "redirect_uri": redirect_uri,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            "state": state,
            "name": "Kỹ Sư PKCE",
            "phone": "0987654321",
            "job_title": "Kỹ sư Kết cấu",
            "revit_version": "2025",
            "use_case": "Bố trí cốt thép tự động",
            "terms_accepted": "true",
        },
        follow_redirects=False,
    )
    assert consent_resp.status_code == 302
    location = consent_resp.headers["location"]
    assert redirect_uri in location
    assert "code=" in location
    assert f"state={state}" in location

    # Extract code
    parsed = urllib.parse.urlparse(location)
    query_params = urllib.parse.parse_qs(parsed.query)
    code = query_params["code"][0]

    # Test 2: Invalid verifier should fail
    fail_token_resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "authorization_code",
            "client_id": "revitapp-desktop",
            "code": code,
            "code_verifier": "wrong-verifier-123456789012345678901234567890",
            "redirect_uri": redirect_uri,
        },
    )
    assert fail_token_resp.status_code == 400

    # Re-authorize for successful exchange
    code_verifier, code_challenge = generate_pkce_pair()
    auth_resp2 = client.get(
        "/oauth/authorize",
        params={
            "response_type": "code",
            "client_id": "revitapp-desktop",
            "redirect_uri": redirect_uri,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            "state": state,
            "user_id": user_id,
        },
        follow_redirects=False,
    )
    assert auth_resp2.status_code == 302
    code2 = urllib.parse.parse_qs(urllib.parse.urlparse(auth_resp2.headers["location"]).query)["code"][0]

    # Test 3: Correct verifier exchanges for tokens
    success_token_resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "authorization_code",
            "client_id": "revitapp-desktop",
            "code": code2,
            "code_verifier": code_verifier,
            "redirect_uri": redirect_uri,
        },
    )
    assert success_token_resp.status_code == 200
    token_data = success_token_resp.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data

    # Test 4: Authorization code cannot be used twice (Single-use)
    replay_resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "authorization_code",
            "client_id": "revitapp-desktop",
            "code": code2,
            "code_verifier": code_verifier,
            "redirect_uri": redirect_uri,
        },
    )
    assert replay_resp.status_code == 400


def test_refresh_token_rotation_and_reuse_revocation(client: TestClient) -> None:
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": "rotation_user@example.com", "password": "securepassword123"},
    )
    user_id = reg_resp.json()["id"]

    code_verifier, code_challenge = generate_pkce_pair()
    redirect_uri = "http://127.0.0.1:45678/callback"

    consent_resp = client.post(
        "/oauth/consent",
        data={
            "user_id": user_id,
            "client_id": "revitapp-desktop",
            "redirect_uri": redirect_uri,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            "state": "s1",
            "name": "Kỹ Sư Rotation",
            "phone": "0987654321",
            "job_title": "Kỹ sư Kết cấu",
            "revit_version": "2025",
            "use_case": "Bố trí cốt thép tự động",
            "terms_accepted": "true",
        },
        follow_redirects=False,
    )
    assert consent_resp.status_code == 302
    code = urllib.parse.parse_qs(urllib.parse.urlparse(consent_resp.headers["location"]).query)["code"][0]

    token_resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "authorization_code",
            "client_id": "revitapp-desktop",
            "code": code,
            "code_verifier": code_verifier,
            "redirect_uri": redirect_uri,
        },
    )
    initial_tokens = token_resp.json()
    refresh_token_v1 = initial_tokens["refresh_token"]

    # Rotate Refresh Token (v1 -> v2)
    rotate_resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "refresh_token",
            "client_id": "revitapp-desktop",
            "refresh_token": refresh_token_v1,
        },
    )
    assert rotate_resp.status_code == 200
    rotated_tokens = rotate_resp.json()
    refresh_token_v2 = rotated_tokens["refresh_token"]
    assert refresh_token_v2 != refresh_token_v1

    # Security: Reusing old refresh token v1 MUST trigger family revocation (HTTP 400 invalid_grant)
    compromised_resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "refresh_token",
            "client_id": "revitapp-desktop",
            "refresh_token": refresh_token_v1,
        },
    )
    assert compromised_resp.status_code == 400
    assert compromised_resp.json()["detail"] == "invalid_grant"

    # Subsequent use of v2 should also fail because the family is revoked
    revoked_resp = client.post(
        "/oauth/token",
        json={
            "grant_type": "refresh_token",
            "client_id": "revitapp-desktop",
            "refresh_token": refresh_token_v2,
        },
    )
    assert revoked_resp.status_code == 400


def test_entitlement_resolution_and_tamper_proofing(client: TestClient) -> None:
    user_id = uuid.uuid4()
    # 1. Create standard access token
    token = create_access_token(
        user_id=user_id,
        email="token_test@example.com",
        role="CUSTOMER",
    )

    # 2. Decode and verify payload
    payload = jwt.decode(
        token,
        settings.secret_key,
        algorithms=["HS256"],
        audience=JWT_AUDIENCE,
        issuer=JWT_ISSUER,
    )
    assert payload["sub"] == str(user_id)
    assert payload["email"] == "token_test@example.com"
    assert payload["role"] == "CUSTOMER"

    # 3. Tampered token with altered role should fail verification
    header_b64 = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    tampered_payload = payload.copy()
    tampered_payload["role"] = "ADMIN"
    tampered_payload_b64 = base64.urlsafe_b64encode(json.dumps(tampered_payload).encode()).decode().rstrip("=")
    fake_token = f"{header_b64}.{tampered_payload_b64}.invalidsignature"

    with pytest.raises(jwt.InvalidSignatureError):
        jwt.decode(
            fake_token,
            settings.secret_key,
            algorithms=["HS256"],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
        )


def test_client_cannot_claim_entitlements_or_forge_hardware(client: TestClient) -> None:
    # Attempting to query entitlements with a forged or invalid token
    resp = client.get(
        "/api/v1/entitlements/revitapp",
        headers={"Authorization": "Bearer fake.tampered.token"},
    )
    assert resp.status_code == 401
