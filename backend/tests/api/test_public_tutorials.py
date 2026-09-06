from fastapi.testclient import TestClient


def test_public_tutorials_return_current_youtube_videos(client: TestClient) -> None:
    response = client.get("/api/v1/public/tutorials")

    assert response.status_code == 200
    tutorials = response.json()
    assert [video["videoUrl"] for video in tutorials] == [
        "https://www.youtube.com/embed/VmM6KdZ624Q",
        "https://www.youtube.com/embed/DMfI2InIZAs",
    ]
    assert tutorials[0]["title"] == "Revit MCP – Hướng dẫn vẽ thép dầm"
    assert tutorials[1]["title"] == "Revit MCP – Hướng dẫn cài đặt BIMAutomation"
