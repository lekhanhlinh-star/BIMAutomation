"""Six real-image evaluation cases. Explicit --real is required; never substitutes mocks."""
import argparse
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from app.core.config import settings
from app.schemas.render import RenderRequest
from app.services.image_service import ImageService
from app.services.rendering_service import ArchitecturalRenderingService
from app.services.request_service import prepare_render
from PIL import Image


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--real', action='store_true', required=True)
    parser.add_argument('--case', action='append', help='Run selected case IDs only (repeatable).')
    args = parser.parse_args()
    if not settings.GOOGLE_API_KEY:
        raise SystemExit('Gemini key is not configured; no real evaluation was run.')
    settings.MOCK_RENDER_ENABLED = False
    output = ROOT / 'storage' / 'evaluations' / datetime.now().strftime('%Y%m%d_%H%M%S')
    output.mkdir(parents=True)
    print(f'Evaluation: {output}', flush=True)
    cases = [
        ('interior', 'interior', 'sample_interior_view.png', {'wall_material': 'wall_white_paint', 'wall_material_location': 'Các mảng tường hiện có'}, {'item': 'Một chậu cây nhỏ', 'location': 'Trên sàn tại góc trái ảnh, chỉ khi còn khoảng trống, không che lối đi'}),
        ('exterior', 'exterior', 'sample_exterior_view.png', {'wall_material': 'wall_white_paint', 'wall_material_location': 'Các mảng tường mặt đứng hiện có'}, {'item': 'Một chậu cây nhỏ', 'location': 'Trên nền sân phía trái ảnh, không che cửa hoặc lối vào'}),
        ('roof', 'exterior', 'sample_elevated_roof_view.png', {'roof_material': 'roof_metal', 'roof_material_location': 'Bề mặt mái nhìn thấy'}, {'item': 'Một chậu cây nhỏ', 'location': 'Trên sân trước nhà ở phía dưới ảnh, chỉ khi nhìn thấy khoảng trống phù hợp'}),
    ]
    results = []
    service = ArchitecturalRenderingService()
    for name, view, filename, finishes, addition in cases:
        image = Image.open(ROOT / 'sample_data' / filename).convert('RGB')
        image.save(output / f'{name}_source.png')
        for mode in ('strict', 'balanced'):
            case_id = f'{name}_{mode}'
            if args.case and case_id not in args.case:
                continue
            request = RenderRequest(image_base64=await ImageService.encode_image_to_base64(image), view_type=view,
                geometry_mode=mode, quality='preview_1k', lighting='soft_daylight', **finishes,
                additions=[addition] if mode == 'balanced' else [], project_name='Demo acceptance evaluation', view_name=case_id)
            prepared = prepare_render(request)
            (output / f'{case_id}_request.json').write_text(prepared.model_dump_json(indent=2), encoding='utf-8')
            print(f'Start {case_id}', flush=True)
            try:
                response = await service.render(request)
                source_path = Path(ImageService.get_output_file_path(response.render_id))
                (output / f'{case_id}.png').write_bytes(source_path.read_bytes())
                (output / f'{case_id}_metadata.json').write_text(response.metadata.model_dump_json(indent=2), encoding='utf-8')
                entry = {'case': case_id, 'status': response.status, 'render_id': response.render_id,
                         'seconds': response.metadata.duration_seconds, 'model': response.metadata.model,
                         'warnings': response.metadata.warnings, 'visual_review': 'pending'}
            except Exception as exc:
                entry = {'case': case_id, 'status': 'failed', 'error': type(exc).__name__, 'message': str(exc)}
            results.append(entry)
            (output / 'report.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
            print(json.dumps(entry, ensure_ascii=False), flush=True)
    print('Complete. Visual inspection is still required; API success alone is not an acceptance result.', flush=True)


if __name__ == '__main__':
    asyncio.run(main())
