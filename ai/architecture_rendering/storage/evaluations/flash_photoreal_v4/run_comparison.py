"""Replay saved v3 prompts against v4 with identical images/options; requires --real."""
import asyncio, json, sys, time
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from app.core.config import settings
from app.schemas.render import RenderOptions
from app.services.request_service import prepare_render
from app.services.rendering_service import ArchitecturalRenderingService

async def main():
    if '--real' not in sys.argv:
        raise SystemExit('Pass --real to spend provider quota.')
    settings.DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-image'
    if settings.MOCK_RENDER_ENABLED or not settings.GOOGLE_API_KEY:
        raise SystemExit('Requires a real configured Gemini key and mock disabled.')
    folder = Path(__file__).resolve().parent
    service = ArchitecturalRenderingService()
    report = []
    for name in ('interior','exterior','roof'):
        before = json.loads((folder / f'{name}_before.json').read_text())
        with Image.open(ROOT / 'sample_data' / before['source']) as source:
            source = source.convert('RGB')
        source.save(folder / f'{name}_source.png')
        after = prepare_render(RenderOptions.model_validate(before['effective_options']))
        (folder / f'{name}_after.json').write_text(after.model_dump_json(indent=2), encoding='utf-8')
        for variant, prompt, version in [('before', before['prompt_used'], before['prompt_version']), ('after', after.prompt_used, after.prompt_version)]:
            started = time.monotonic()
            row = {'case':name,'variant':variant,'model':settings.DEFAULT_IMAGE_MODEL,'prompt_version':version,'visual_review':'pending'}
            try:
                image = await service._generate_with_langchain(source,prompt,'preview_1k')
                image.save(folder / f'{name}_{variant}.png')
                row.update(status='success',dimensions=list(image.size))
            except Exception as exc:
                row.update(status='failed',error=type(exc).__name__,message=str(exc))
            row['seconds'] = round(time.monotonic()-started,2)
            report.append(row)
            (folder / 'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
            print(json.dumps(row,ensure_ascii=False),flush=True)

asyncio.run(main())
