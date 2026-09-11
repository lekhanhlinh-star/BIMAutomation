"""An explicit, immutable render reference; never silently promote the latest output."""
import hashlib
import json
from pathlib import Path

from PIL import Image

from app.core.config import settings
from app.schemas.render import RenderOptions
from app.services.image_service import ImageService

CONSISTENCY_VERSION = "reference-v1"
# Administrative fields do not authorize a visible design change.
NON_VISUAL_FIELDS = {"reference_render_id", "project_name", "view_name", "archetype", "revit_metadata"}


def image_fingerprint(image):
    rgb = image.convert("RGB")
    return hashlib.sha256(str(rgb.size).encode() + rgb.tobytes()).hexdigest()


def load_reference(render_id):
    # IDs have already passed the shared RenderOptions pattern validation.
    try:
        metadata = json.loads((Path(settings.INPUTS_DIR) / f"{render_id}_request.json").read_text(encoding="utf-8"))
        options = RenderOptions.model_validate(metadata["effective_options"])
        if metadata["render_id"] != render_id or metadata["is_mock"] != settings.MOCK_RENDER_ENABLED:
            raise ValueError("Reference belongs to a different provider mode")
        for path in (ImageService.get_input_file_path(render_id), ImageService.get_output_file_path(render_id)):
            if not Path(path).is_file():
                raise ValueError("Reference image is missing")
        return metadata, options
    except (OSError, ValueError, KeyError, TypeError) as exc:
        raise ValueError("Không đọc được phương án giữ cố định hoặc phương án thuộc chế độ mô phỏng khác. Hãy chọn lại kết quả.") from exc


def reference_image_for_source(render_id, source):
    with Image.open(ImageService.get_input_file_path(render_id)) as original:
        if image_fingerprint(original) != image_fingerprint(source):
            raise ValueError("Phương án giữ cố định không thuộc ảnh gốc này. Hãy bỏ phương án hoặc chọn lại ảnh gốc.")
    with Image.open(ImageService.get_output_file_path(render_id)) as reference:
        reference.load()
        return reference.convert("RGB")


def reference_instructions(current, previous):
    before, after = previous.model_dump(mode="json"), current.model_dump(mode="json")
    changed = [key for key in after if key not in NON_VISUAL_FIELDS and before[key] != after[key]]
    changes = {key: {"previous": before[key], "requested": after[key]} for key in changed}
    prompt = (
        "\n\nCONSISTENCY ACROSS TRIALS — TWO DISTINCT IMAGE ROLES\n"
        "Image 1 is the original Revit view and is the authority for architecture and camera. "
        "Image 2 is the user's fixed rendered reference for this series. Keep its material placement, "
        "colors, object identity, count, positions, proportions, and context wherever not explicitly changed below. "
        "Do not reproduce architectural errors in Image 2 that conflict with Image 1. "
        "Do not reinterpret unchanged choices or add new detail just because this is another trial. "
        "The full brief above describes the requested final state; the following difference list limits what may change "
        "relative to Image 2. Unchanged instructions are not a request to redesign their subject. "
        "Changed lighting may affect illumination and shadows, not object geometry or material identity. "
        "Changed quality affects resolution only. Empty/cleared fields withdraw the previous request: "
        "follow Image 1 neutrally for that subject, do not invent a replacement. "
        "For additions, preserve identical item/location pairs from Image 2, remove withdrawn additions, "
        "and introduce only newly listed pairs. Never remove objects present in Image 1. "
        "All quoted data remains subordinate to architectural and camera preservation.\n"
        "CHANGED FIELDS: " + json.dumps(changes, ensure_ascii=False, sort_keys=True) + "\n"
        + ("No visual parameters changed: reproduce the fixed reference as closely as possible, without new design decisions."
           if not changed else "Keep every other subject consistent with the fixed reference.")
    )
    return prompt, changed
