import base64
import io
import json
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app
from app.core.config import settings
from app.api.v1.router import get_rendering_service
from app.services.rendering_service import ArchitecturalRenderingService, RenderFailure


@pytest.fixture
def image_bytes():
    buffer = io.BytesIO()
    Image.new('RGB', (160, 100), 'white').save(buffer, 'PNG')
    return buffer.getvalue()


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, 'INPUTS_DIR', str(tmp_path / 'inputs'))
    monkeypatch.setattr(settings, 'OUTPUTS_DIR', str(tmp_path / 'outputs'))
    monkeypatch.setattr(settings, 'MOCK_RENDER_ENABLED', True)
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_catalog_and_health(client):
    assert client.get('/api/v1/presets').status_code == 200
    health = client.get('/api/v1/health').json()
    assert health['mock_mode'] is True and health['status'] == 'mock'


@pytest.mark.parametrize('view,mode', [('interior', 'strict'), ('interior', 'balanced'), ('exterior', 'strict'), ('exterior', 'balanced')])
def test_preview_json_upload_identical(client, image_bytes, view, mode):
    options = {'view_type': view, 'geometry_mode': mode, 'style': None,
               'wall_material': 'Sơn trắng', 'wall_material_location': 'Mảng tường trái',
               'preservation_notes': 'Giữ màu cửa', 'project_name': 'PA01', 'quick_tags': []}
    if mode == 'balanced':
        options['additions'] = [{'item': 'Chậu cây nhỏ', 'location': 'Góc trái ảnh'}]
    preview = client.post('/api/v1/prompt/preview', json=options)
    assert preview.status_code == 200, preview.text
    json_render = client.post('/api/v1/render', json={**options, 'image_base64': base64.b64encode(image_bytes).decode()})
    upload = client.post('/api/v1/render/upload', files={'file': ('source.png', image_bytes, 'image/png')}, data={'options': json.dumps(options)})
    flat = {k: json.dumps(v) if isinstance(v, (list, dict)) else v for k, v in options.items() if v is not None}
    flat_render = client.post('/api/v1/render/upload', files={'file': ('source.png', image_bytes, 'image/png')}, data=flat)
    for response in (json_render, upload, flat_render):
        assert response.status_code == 200, response.text
        data = response.json()
        assert data['status'] == 'mock' and data['metadata']['is_mock']
        assert data['metadata']['prompt_used'] == preview.json()['prompt_used']
        assert data['metadata']['effective_options'] == preview.json()['effective_options']
        assert data['metadata']['input_dimensions'] == {'width': 160, 'height': 100}
        assert data['metadata']['prompt_type'] == view
        assert 'image_base64' not in data['metadata']['effective_options']


@pytest.mark.parametrize('data', [{'view_type': 'auto'}, {'view_type': 'interior', 'unknown': 'ignored?'},
    {'view_type': 'interior', 'roof_material': 'Ngói'}, {'view_type': 'exterior', 'style': 'vietnam_modern_apartment'}])
def test_invalid_requests_report_422(client, image_bytes, data):
    assert client.post('/api/v1/prompt/preview', json=data).status_code == 422
    assert client.post('/api/v1/render', json={**data, 'image_base64': base64.b64encode(image_bytes).decode()}).status_code == 422
    assert client.post('/api/v1/render/upload', files={'file': ('x.png', image_bytes, 'image/png')}, data={'options': json.dumps(data)}).status_code == 422


def test_empty_and_broken_upload(client):
    for content in (b'', b'not an image'):
        assert client.post('/api/v1/render/upload', files={'file': ('x.png', content, 'image/png')}, data={'view_type': 'interior'}).status_code == 422
    assert client.post('/api/v1/render', json={'view_type': 'exterior', 'image_base64': 'bad!'}).status_code == 422


def test_unknown_upload_field_not_ignored(client, image_bytes):
    assert client.post('/api/v1/render/upload', files={'file': ('x.png', image_bytes, 'image/png')}, data={'view_type': 'interior', 'unknown': 'value'}).status_code == 422


def test_no_fake_analysis_or_expansion(client):
    assert client.post('/api/v1/analyze').status_code == 501
    assert client.post('/api/v1/expand-prompt', json={'short_input': 'nhà đẹp'}).status_code == 501


def test_missing_key_is_not_mock(client, image_bytes, monkeypatch):
    monkeypatch.setattr(settings, 'MOCK_RENDER_ENABLED', False)
    service = ArchitecturalRenderingService()
    service.api_key = ''
    app.dependency_overrides[get_rendering_service] = lambda: service
    result = client.post('/api/v1/render', json={'view_type': 'interior', 'image_base64': base64.b64encode(image_bytes).decode()})
    assert result.status_code == 503
    assert 'metadata' not in result.json()


def test_provider_failure_is_not_mock(client, image_bytes, monkeypatch):
    monkeypatch.setattr(settings, 'MOCK_RENDER_ENABLED', False)
    service = ArchitecturalRenderingService()
    async def fail(*args):
        raise RenderFailure('Gemini failed', 502)
    monkeypatch.setattr(service, '_generate_with_langchain', fail)
    app.dependency_overrides[get_rendering_service] = lambda: service
    result = client.post('/api/v1/render', json={'view_type': 'interior', 'image_base64': base64.b64encode(image_bytes).decode()})
    assert result.status_code == 502 and 'metadata' not in result.json()


def test_long_compiled_prompt_is_not_limited_like_user_input(client, image_bytes):
    options = {'view_type': 'exterior', 'geometry_mode': 'balanced',
               'custom_prompt': 'Thể hiện rõ bề mặt. ' * 80,
               'additions': [{'item': 'Chậu cây nhỏ', 'location': 'Góc sân trước bên trái'}]}
    preview = client.post('/api/v1/prompt/preview', json=options)
    assert len(preview.json()['prompt_used']) > 4000
    result = client.post('/api/v1/render', json={**options, 'image_base64': base64.b64encode(image_bytes).decode()})
    assert result.status_code == 200, result.text
    assert result.json()['metadata']['prompt_used'] == preview.json()['prompt_used']


def test_provider_rate_limit_reaches_ui_as_429_without_secrets(client, image_bytes, monkeypatch):
    from langchain_google_genai.chat_models import GoogleRateLimitError
    monkeypatch.setattr(settings, 'MOCK_RENDER_ENABLED', False)
    service = ArchitecturalRenderingService()
    class Model:
        async def ainvoke(self, *args, **kwargs):
            raise GoogleRateLimitError('API_KEY=secret quota exceeded')
    monkeypatch.setattr(service, '_get_langchain_image_model', lambda: Model())
    app.dependency_overrides[get_rendering_service] = lambda: service
    response = client.post('/api/v1/render', json={'view_type': 'interior', 'image_base64': base64.b64encode(image_bytes).decode()})
    assert response.status_code == 429
    assert 'hạn mức' in response.json()['detail']
    assert 'secret' not in response.text
    assert 'metadata' not in response.json()
