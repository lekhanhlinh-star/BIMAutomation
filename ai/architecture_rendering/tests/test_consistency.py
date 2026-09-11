import base64
import io
import json

import pytest
from PIL import Image

from app.core.config import settings
from app.services.image_service import ImageService
from app.services.rendering_service import ArchitecturalRenderingService, RenderFailure
from test_api import client, image_bytes


def render(client, image_bytes, **options):
    return client.post('/api/v1/render', json={
        'view_type': 'interior', **options,
        'image_base64': base64.b64encode(image_bytes).decode(),
    })


def test_fixed_reference_preview_upload_and_multiple_trials(client, image_bytes):
    first = render(client, image_bytes, wall_material='Sơn trắng').json()
    fixed = first['render_id']
    options = {'view_type': 'interior', 'reference_render_id': fixed,
               'wall_material': 'Sơn xám', 'wall_material_location': 'Tường trái'}
    preview = client.post('/api/v1/prompt/preview', json=options).json()
    assert set(preview['changed_fields']) == {'wall_material', 'wall_material_location'}
    assert 'Sơn trắng' in preview['prompt_used'] and 'Sơn xám' in preview['prompt_used']
    assert 'Image 1' in preview['prompt_used'] and 'Image 2' in preview['prompt_used']
    second = render(client, image_bytes, **options)
    third = client.post('/api/v1/render/upload', files={'file': ('x.png', image_bytes, 'image/png')},
                        data={'options': json.dumps(options)})
    for response in (second, third):
        assert response.status_code == 200, response.text
        metadata = response.json()['metadata']
        assert metadata['reference_render_id'] == fixed
        assert metadata['prompt_used'] == preview['prompt_used']
        assert metadata['changed_fields'] == preview['changed_fields']
        assert metadata['source_fingerprint'] == first['metadata']['source_fingerprint']
        assert metadata['is_mock'] is True


def test_same_options_and_cleared_material(client, image_bytes):
    first = render(client, image_bytes, wall_material='Sơn trắng').json()
    options = {'view_type': 'interior', 'reference_render_id': first['render_id'], 'wall_material': 'Sơn trắng'}
    same = client.post('/api/v1/prompt/preview', json=options).json()
    assert same['changed_fields'] == []
    assert 'No visual parameters changed' in same['prompt_used']
    cleared = client.post('/api/v1/prompt/preview', json={**options, 'wall_material': ''}).json()
    assert cleared['changed_fields'] == ['wall_material']
    assert '"requested": null' in cleared['prompt_used']


def test_reference_rejects_other_source_view_mode_and_missing_file(client, image_bytes, monkeypatch):
    first = render(client, image_bytes).json()
    fixed = first['render_id']
    buffer = io.BytesIO()
    Image.new('RGB', (160, 100), 'red').save(buffer, 'PNG')
    assert render(client, buffer.getvalue(), reference_render_id=fixed).status_code == 422
    assert client.post('/api/v1/prompt/preview', json={'view_type': 'exterior', 'reference_render_id': fixed}).status_code == 422
    monkeypatch.setattr(settings, 'MOCK_RENDER_ENABLED', False)
    assert render(client, image_bytes, reference_render_id=fixed).status_code == 422
    monkeypatch.setattr(settings, 'MOCK_RENDER_ENABLED', True)
    from pathlib import Path
    Path(ImageService.get_output_file_path(fixed)).unlink()
    assert render(client, image_bytes, reference_render_id=fixed).status_code == 422


@pytest.mark.parametrize('reference', ['../../etc/passwd', 'rnd_20260101_000000_ffffffff'])
def test_bad_reference_rejected(client, image_bytes, reference):
    assert render(client, image_bytes, reference_render_id=reference).status_code == 422


def test_balanced_to_strict_withdraws_only_requested_additions(client, image_bytes):
    first = render(client, image_bytes, geometry_mode='balanced', additions=[{'item': 'Ghế', 'location': 'Góc trái'}]).json()
    preview = client.post('/api/v1/prompt/preview', json={'view_type': 'interior', 'reference_render_id': first['render_id']}).json()
    assert set(preview['changed_fields']) == {'geometry_mode', 'additions'}
    assert 'remove withdrawn additions' in preview['prompt_used']
    assert 'Never remove objects present in Image 1' in preview['prompt_used']


@pytest.mark.asyncio
async def test_provider_receives_original_and_fixed_reference_in_order(monkeypatch):
    service = ArchitecturalRenderingService()
    original, reference = Image.new('RGB', (20, 10), 'white'), Image.new('RGB', (20, 10), 'blue')
    seen = {}
    class Model:
        async def ainvoke(self, messages, **kwargs):
            seen['content'] = messages[0].content
            class Response:
                content = []
            return Response()
    monkeypatch.setattr(service, '_get_langchain_image_model', lambda: Model())
    with pytest.raises(RenderFailure):
        await service._generate_with_langchain(original, 'compiled prompt', 'preview_1k', reference)
    images = [block['image_url']['url'] for block in seen['content'] if block['type'] == 'image_url']
    assert images == [await ImageService.encode_image_to_base64(original), await ImageService.encode_image_to_base64(reference)]
