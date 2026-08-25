from typing import Annotated, Any
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.license_crypto import get_public_key_pem, get_public_key_xml
from app.core.dependencies import get_current_user_flexible
from app.db.session import get_async_session
from app.models.user import User
from app.schemas.desktop_auth import EntitlementResponse, LicenseCheckRequest
from app.services import entitlement_service

router = APIRouter(prefix="/entitlements", tags=["entitlements"])


@router.get("/public-key")
async def get_license_public_key() -> dict[str, str]:
    """
    Returns the RSA public key used for verifying Server-Authoritative License Tokens in Revit Add-in.
    """
    return {
        "algorithm": "RS256",
        "keyId": "bimauto-lic-2026-v1",
        "pem": get_public_key_pem(),
        "xml": get_public_key_xml(),
    }


@router.post("/check", response_model=EntitlementResponse)
async def check_license_and_trial(
    payload: LicenseCheckRequest,
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
) -> EntitlementResponse:
    """
    Checks paid license or 14-day device trial for RevitAI client.
    Server-authoritative check with anti-abuse hardware fingerprint binding.
    """
    dev_id = None
    if payload.device_id:
        try:
            dev_id = uuid.UUID(payload.device_id)
        except ValueError:
            pass

    data = await entitlement_service.get_entitlement_for_user_and_device(
        session=db,
        user=current_user,
        product_code=payload.product_code,
        device_id=dev_id,
        installation_id=payload.installation_id,
        fingerprint_hash=payload.hardware_fingerprint,
        revit_version=payload.revit_version,
        display_name=payload.device_name,
        takeover=payload.takeover,
        is_periodic=payload.is_periodic,
        bios_uuid=payload.bios_uuid,
        cpu_id=payload.cpu_id,
        motherboard_serial=payload.motherboard_serial,
        disk_serial=payload.disk_serial,
        mac_address=payload.mac_address,
        machine_guid=payload.machine_guid,
        is_virtual_machine=payload.is_virtual_machine,
        virtual_machine_hint=payload.virtual_machine_hint,
        request_timestamp=payload.request_timestamp,
        request_signature=payload.request_signature,
        app_version=payload.app_version,
    )
    return EntitlementResponse(**data)


@router.get("/{productCode}", response_model=EntitlementResponse)
async def get_product_entitlement(
    productCode: str,
    current_user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[AsyncSession, Depends(get_async_session)],
    deviceId: str | None = Query(None, description="Activated device UUID"),
    installationId: str | None = Query(None, description="Installation UUID"),
    fingerprintHash: str | None = Query(None, description="Hardware fingerprint SHA-256 hash"),
    deviceName: str | None = Query(None, description="Computer name"),
    takeover: bool = Query(False, description="Take over active session on machine switch"),
    isPeriodic: bool = Query(False, description="Whether this is a background heartbeat check"),
    biosUuid: str | None = Query(None, description="SMBIOS System Product UUID"),
    cpuId: str | None = Query(None, description="CPU Processor ID"),
    processorId: str | None = Query(None, description="CPU Processor ID alias"),
    motherboardSerial: str | None = Query(None, description="BaseBoard serial number"),
    baseboardSerial: str | None = Query(None, description="BaseBoard serial number alias"),
    diskSerial: str | None = Query(None, description="Disk drive serial"),
    macAddress: str | None = Query(None, description="MAC address"),
    machineGuid: str | None = Query(None, description="Machine GUID"),
    isVirtualMachine: bool | None = Query(None, description="Is virtual machine detected"),
    virtualMachineHint: str | None = Query(None, description="VM detection evidence"),
    requestTimestamp: int | None = Query(None, description="Request epoch timestamp"),
    requestSignature: str | None = Query(None, description="HMAC-SHA256 signature"),
    appVersion: str | None = Query(None, description="Add-in app version"),
) -> EntitlementResponse:
    """
    Computes entitlement status and available features for the requesting user and machine.
    Server-authoritative: returns allowed features, plan, and expiry.
    """
    dev_id = None
    if deviceId:
        try:
            dev_id = uuid.UUID(deviceId)
        except ValueError:
            pass

    resolved_cpu = cpuId or processorId
    resolved_mb = motherboardSerial or baseboardSerial

    data = await entitlement_service.get_entitlement_for_user_and_device(
        session=db,
        user=current_user,
        product_code=productCode,
        device_id=dev_id,
        installation_id=installationId,
        fingerprint_hash=fingerprintHash,
        display_name=deviceName,
        takeover=takeover,
        is_periodic=isPeriodic,
        bios_uuid=biosUuid,
        cpu_id=resolved_cpu,
        motherboard_serial=resolved_mb,
        disk_serial=diskSerial,
        mac_address=macAddress,
        machine_guid=machineGuid,
        is_virtual_machine=isVirtualMachine,
        virtual_machine_hint=virtualMachineHint,
        request_timestamp=requestTimestamp,
        request_signature=requestSignature,
        app_version=appVersion,
    )
    return EntitlementResponse(**data)
