import pytest
from PIL import Image
from app.schemas.render import RenderRequest
from app.services.rendering_service import ArchitecturalRenderingService, RenderFailure
from app.services.image_service import ImageService


@pytest.mark.asyncio
async def test_quality_passed_and_missing_image_fails(monkeypatch):
    service = ArchitecturalRenderingService()
    seen = {}
    class Response:
        content = [{'type': 'text', 'text': 'no image'}]
    class Model:
        async def ainvoke(self, messages, **kwargs):
            seen.update(kwargs)
            return Response()
    monkeypatch.setattr(service, '_get_langchain_image_model', lambda: Model())
    with pytest.raises(RenderFailure):
        await service._generate_with_langchain(Image.new('RGB', (100, 80)), 'prompt', 'final_2k')
    assert seen['image_config'] == {'image_size': '2K'}


@pytest.mark.asyncio
async def test_provider_exception_does_not_leak_secret(monkeypatch):
    service = ArchitecturalRenderingService()
    class Model:
        async def ainvoke(self, *args, **kwargs):
            raise RuntimeError('API_KEY=secret')
    monkeypatch.setattr(service, '_get_langchain_image_model', lambda: Model())
    with pytest.raises(RenderFailure) as exc:
        await service._generate_with_langchain(Image.new('RGB', (10, 10)), 'prompt', 'preview_1k')
    assert 'secret' not in str(exc.value)
