from fastapi.testclient import TestClient


def test_user_registration_with_name_and_phone(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "fullprofile@example.com",
            "password": "mypassword123",
            "name": "Nguyen Van A",
            "phone": "0912345678",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Nguyen Van A"
    assert data["phone"] == "0912345678"


def test_update_user_profile_and_password(client: TestClient) -> None:
    # 1. Register
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "updateprofile@example.com",
            "password": "oldpassword123",
        },
    )

    # 2. Login
    login_res = client.post(
        "/api/v1/auth/jwt/login",
        data={
            "username": "updateprofile@example.com",
            "password": "oldpassword123",
        },
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Patch Profile (Name, Phone)
    patch_res = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={
            "name": "Tran Van B",
            "phone": "0987654321",
        },
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Tran Van B"
    assert patch_res.json()["phone"] == "0987654321"

    # 4. Patch Password
    patch_pw_res = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={
            "password": "newpassword456",
        },
    )
    assert patch_pw_res.status_code == 200

    # 5. Verify login with new password
    new_login_res = client.post(
        "/api/v1/auth/jwt/login",
        data={
            "username": "updateprofile@example.com",
            "password": "newpassword456",
        },
    )
    assert new_login_res.status_code == 200
