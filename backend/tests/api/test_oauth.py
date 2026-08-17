from fastapi.testclient import TestClient


def test_google_oauth_authorize(client: TestClient) -> None:
    response = client.get("/api/v1/auth/google/authorize")
    assert response.status_code == 200
    data = response.json()
    assert "authorization_url" in data
    assert "accounts.google.com" in data["authorization_url"]
