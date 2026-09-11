import asyncio,json,sys,time
from pathlib import Path
from PIL import Image
root=Path('/home/linh/Desktop/BIMAutomation/ai/architecture_rendering')
sys.path.insert(0,str(root))
from app.core.config import settings
from app.schemas.render import RenderOptions
from app.services.request_service import prepare_render
from app.services.rendering_service import ArchitecturalRenderingService
out=root/'storage/evaluations/townhouse_retry'
options=RenderOptions(view_type='exterior',quality='final_2k',render_purpose='client_presentation',
wall_material='Sơn khoáng trắng ngà mờ, bề mặt mịn có vi cấu trúc nhẹ',wall_material_location='Tường mặt đứng, các gờ cong và tường rào hiện có',
door_material='Khung nhôm màu than đậm mờ, kính trong phản xạ nhẹ',door_material_location='Hệ cửa và khung cửa hiện có trên mặt đứng',
railing_material='Kính trong với tay vịn kim loại mảnh màu tối',railing_material_location='Các tấm lan can ban công hiện có, giữ nguyên kích thước và vị trí',
floor_material='Đá lát xám sáng bề mặt nhám nhẹ',floor_material_location='Sân và lối đi đã có trong ảnh; không áp dụng cho lòng đường hoặc bậc cửa',
lighting='Ban ngày trời quang, nắng ấm nhẹ tạo bóng cây tự nhiên; đèn tường và đèn dưới mái hiện có sáng nhẹ, không lấn át ánh sáng ban ngày',
environment_context='Bầu trời xanh tự nhiên có mây mỏng ở phần nền trời; giữ nguyên vị trí và kích thước cây hiện có',
custom_prompt='Bậc cửa hiện có hoàn thiện đá xám đậm; giữ số bậc và cao độ. Lòng đường hiện có là nhựa đường, không thêm xe hoặc vạch sơn.')
async def main():
 settings.DEFAULT_IMAGE_MODEL='gemini-3.1-flash-image'
 assert not settings.MOCK_RENDER_ENABLED
 variant=sys.argv[1]
 config=RenderOptions(view_type='exterior',quality='final_2k') if variant=='empty' else options
 prepared=prepare_render(config)
 (out/f'{variant}.json').write_text(prepared.model_dump_json(indent=2))
 with Image.open(root.parents[1]/'test_data/nha_pho.png') as im: source=im.convert('RGB')
 source.save(out/'source.png')
 start=time.monotonic()
 try:
  image=await ArchitecturalRenderingService()._generate_with_langchain(source,prepared.prompt_used,config.quality)
 except Exception as exc:
  root_exc=exc
  while root_exc.__cause__ is not None: root_exc=root_exc.__cause__
  reason=str(getattr(root_exc, 'message', str(root_exc))).replace(settings.GOOGLE_API_KEY, '[redacted]')
  failure={'status':'failed','http_status':getattr(exc,'status_code',None),'model':settings.DEFAULT_IMAGE_MODEL,'variant':variant,'reason':reason}
  (out/f'{variant}_failure.json').write_text(json.dumps(failure,ensure_ascii=False,indent=2))
  print(json.dumps(failure,ensure_ascii=False),flush=True)
  return
 image.save(out/f'{variant}.png')
 print(json.dumps({'variant':variant,'model':settings.DEFAULT_IMAGE_MODEL,'version':prepared.prompt_version,'dimensions':image.size,'seconds':round(time.monotonic()-start,2)}))
asyncio.run(main())
