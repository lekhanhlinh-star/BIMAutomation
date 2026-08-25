import base64
from datetime import datetime, timezone
import os
from typing import Any
import uuid

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
import hashlib
import hmac
import jwt
import re

from app.core.config import settings

LICENSE_HMAC_SECRET = settings.license_hmac_secret
_HMAC_HEX_RE = re.compile(r"^[0-9a-f]{64}$")

# Global key cache
_RSA_PRIVATE_KEY: rsa.RSAPrivateKey | None = None
_RSA_PUBLIC_KEY: rsa.RSAPublicKey | None = None


def get_or_create_rsa_keys() -> tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey]:
    global _RSA_PRIVATE_KEY, _RSA_PUBLIC_KEY
    if _RSA_PRIVATE_KEY is not None and _RSA_PUBLIC_KEY is not None:
        return _RSA_PRIVATE_KEY, _RSA_PUBLIC_KEY

    # Check if PEM is passed via env variable
    pem_env = settings.license_rsa_private_key or os.environ.get("LICENSE_RSA_PRIVATE_KEY")
    if pem_env:
        try:
            private_key = serialization.load_pem_private_key(
                pem_env.encode("utf-8"),
                password=None,
                backend=default_backend(),
            )
            if isinstance(private_key, rsa.RSAPrivateKey):
                _RSA_PRIVATE_KEY = private_key
                _RSA_PUBLIC_KEY = private_key.public_key()
                return _RSA_PRIVATE_KEY, _RSA_PUBLIC_KEY
        except Exception:
            pass

    # Check if custom path is set in env
    custom_key_path = settings.license_rsa_private_key_path or os.environ.get("LICENSE_RSA_PRIVATE_KEY_PATH")
    if custom_key_path and os.path.exists(custom_key_path):
        try:
            with open(custom_key_path, "rb") as f:
                private_key = serialization.load_pem_private_key(
                    f.read(),
                    password=None,
                    backend=default_backend(),
                )
                if isinstance(private_key, rsa.RSAPrivateKey):
                    _RSA_PRIVATE_KEY = private_key
                    _RSA_PUBLIC_KEY = private_key.public_key()
                    return _RSA_PRIVATE_KEY, _RSA_PUBLIC_KEY
        except Exception:
            pass

    # Check if PEM exists in persistent data directory (outside source tree)
    data_dir_candidates = [
        "/app/data",
        os.path.join(os.getcwd(), "data"),
        os.path.join(os.getcwd(), "..", "data"),
    ]
    key_file_path = None
    for candidate in data_dir_candidates:
        if os.path.exists(candidate) and os.path.isdir(candidate):
            key_file_path = os.path.join(candidate, "license_rsa_private.pem")
            break

    if key_file_path and os.path.exists(key_file_path):
        try:
            with open(key_file_path, "rb") as f:
                private_key = serialization.load_pem_private_key(
                    f.read(),
                    password=None,
                    backend=default_backend(),
                )
                if isinstance(private_key, rsa.RSAPrivateKey):
                    _RSA_PRIVATE_KEY = private_key
                    _RSA_PUBLIC_KEY = private_key.public_key()
                    return _RSA_PRIVATE_KEY, _RSA_PUBLIC_KEY
        except Exception:
            pass

    # Generate a fresh 2048-bit RSA key pair
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend(),
    )
    _RSA_PRIVATE_KEY = private_key
    _RSA_PUBLIC_KEY = private_key.public_key()

    # Persist to disk for stability across restarts
    if key_file_path:
        try:
            pem_bytes = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            )
            with open(key_file_path, "wb") as f:
                f.write(pem_bytes)
        except Exception:
            pass

    return _RSA_PRIVATE_KEY, _RSA_PUBLIC_KEY


def get_public_key_pem() -> str:
    _, pub_key = get_or_create_rsa_keys()
    pem = pub_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return pem.decode("utf-8")


def get_public_key_xml() -> str:
    """
    Exports the RSA public key in standard .NET RSACryptoServiceProvider XML format:
    <RSAKeyValue><Modulus>...</Modulus><Exponent>...</Exponent></RSAKeyValue>
    """
    _, pub_key = get_or_create_rsa_keys()
    public_numbers = pub_key.public_numbers()
    
    # Convert integer modulus and exponent to base64 strings
    modulus_bytes = public_numbers.n.to_bytes(
        (public_numbers.n.bit_length() + 7) // 8, byteorder="big"
    )
    exponent_bytes = public_numbers.e.to_bytes(
        (public_numbers.e.bit_length() + 7) // 8, byteorder="big"
    )
    
    mod_b64 = base64.b64encode(modulus_bytes).decode("ascii")
    exp_b64 = base64.b64encode(exponent_bytes).decode("ascii")
    
    return f"<RSAKeyValue><Modulus>{mod_b64}</Modulus><Exponent>{exp_b64}</Exponent></RSAKeyValue>"


def sign_license_token(
    user_id: uuid.UUID | str,
    email: str,
    hwid: str,
    product_code: str = "revitapp",
    plan_name: str = "Pro",
    is_trial: bool = False,
    features: list[str] | None = None,
    expires_at: datetime | None = None,
    grace_period_hours: int = 72,
    session_nonce: str | None = None,
) -> str:
    """
    Signs a Server-Authoritative License Token using RSA RS256 algorithm.
    """
    priv_key, _ = get_or_create_rsa_keys()
    now = datetime.now(timezone.utc)
    
    if expires_at is None:
        # Default 30 days if indefinite
        exp_ts = int(now.timestamp()) + 30 * 86400
    else:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        exp_ts = int(expires_at.timestamp())

    payload = {
        "iss": "https://bimautomation.myminiserver.info",
        "sub": f"usr_{user_id}",
        "email": email,
        "hwid": hwid,
        "prod": product_code,
        "plan": plan_name,
        "tier": plan_name.lower().strip(),
        "is_trial": is_trial,
        "features": features or [],
        "iat": int(now.timestamp()),
        "exp": exp_ts,
        "grace_period_hours": grace_period_hours,
        "session_nonce": session_nonce or str(uuid.uuid4()),
    }

    # Convert private key to PEM for PyJWT encoding with RS256
    priv_pem = priv_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    token = jwt.encode(
        payload,
        priv_pem,
        algorithm="RS256",
        headers={"kid": "bimauto-lic-2026-v1", "typ": "JWT"},
    )
    return token


def verify_license_token(token: str) -> dict[str, Any]:
    """
    Verifies the RS256 signed license token using the public key.
    """
    pub_pem = get_public_key_pem()
    decoded = jwt.decode(
        token,
        pub_pem,
        algorithms=["RS256"],
        issuer="https://bimautomation.myminiserver.info",
        options={"verify_exp": False},  # We handle exp and grace period check in client logic
    )
    return decoded


def compute_payload_hmac(
    timestamp: int,
    bios_uuid: str | None = None,
    cpu_id: str | None = None,
    motherboard_serial: str | None = None,
    disk_serial: str | None = None,
    mac_address: str | None = None,
    machine_guid: str | None = None,
    processor_id: str | None = None,
    baseboard_serial: str | None = None,
    secret_key: str | None = None,
) -> str:
    """
    Computes HMAC-SHA256 signature for hardware telemetry payload.
    Canonical format (strict contract with Revit Add-in):
    timestamp:bios_uuid:processor_id:baseboard_serial:disk_serial:mac_address:machine_guid
    Output: lowercase hex, without sha256= prefix.
    """
    resolved_cpu = cpu_id if cpu_id is not None else processor_id
    resolved_mb = motherboard_serial if motherboard_serial is not None else baseboard_serial

    def canonical_signal(value: str | None) -> str:
        # HardwareTelemetry.BuildCanonicalString preserves signal casing and
        # substitutes UNKNOWN for every unreadable/missing signal.
        normalized = (value or "").strip()
        return normalized if normalized else "UNKNOWN"

    secret = (secret_key or LICENSE_HMAC_SECRET).encode("utf-8")
    raw = ":".join(
        (
            str(timestamp),
            canonical_signal(bios_uuid),
            canonical_signal(resolved_cpu),
            canonical_signal(resolved_mb),
            canonical_signal(disk_serial),
            canonical_signal(mac_address),
            canonical_signal(machine_guid),
        )
    )
    return hmac.new(secret, raw.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_payload_hmac(
    signature: str,
    timestamp: int,
    bios_uuid: str | None = None,
    cpu_id: str | None = None,
    motherboard_serial: str | None = None,
    disk_serial: str | None = None,
    mac_address: str | None = None,
    machine_guid: str | None = None,
    processor_id: str | None = None,
    baseboard_serial: str | None = None,
    secret_key: str | None = None,
    tolerance_seconds: int = 300,
) -> tuple[bool, str | None]:
    """
    Verifies that the telemetry signature matches and timestamp is within acceptable window (Anti-Replay).
    """
    now_ts = int(datetime.now(timezone.utc).timestamp())
    if abs(now_ts - timestamp) > tolerance_seconds:
        return False, f"Request timestamp expired (Skew: {abs(now_ts - timestamp)}s > {tolerance_seconds}s)"

    expected_sig = compute_payload_hmac(
        timestamp=timestamp,
        bios_uuid=bios_uuid,
        cpu_id=cpu_id,
        motherboard_serial=motherboard_serial,
        disk_serial=disk_serial,
        mac_address=mac_address,
        machine_guid=machine_guid,
        processor_id=processor_id,
        baseboard_serial=baseboard_serial,
        secret_key=secret_key,
    )

    clean_sig = signature.strip()
    if not _HMAC_HEX_RE.fullmatch(clean_sig):
        return False, "Telemetry signature must be 64 lowercase hexadecimal characters"

    if not hmac.compare_digest(expected_sig, clean_sig):
        return False, "Invalid telemetry signature"

    return True, None
