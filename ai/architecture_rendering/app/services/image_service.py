import asyncio
import base64
import io
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Tuple, Optional
from PIL import Image, ImageChops, ImageEnhance
from app.core.config import settings, logger

class ImageService:
    @staticmethod
    def _decode_base64_sync(data_uri_or_base64: str) -> Tuple[Image.Image, str]:
        """Decodes base64 string to PIL Image and extracts format."""
        if "," in data_uri_or_base64:
            header, base64_data = data_uri_or_base64.split(",", 1)
            ext = "png"
            if "jpeg" in header or "jpg" in header:
                ext = "jpg"
            elif "webp" in header:
                ext = "webp"
        else:
            base64_data = data_uri_or_base64
            ext = "png"

        if len(base64_data) > 32 * 1024 * 1024:
            raise ValueError("Image exceeds 24 MB")
        image_bytes = base64.b64decode(base64_data, validate=True)
        image = Image.open(io.BytesIO(image_bytes))
        if image.format not in ("PNG", "JPEG", "WEBP") or image.width * image.height > 24_000_000:
            raise ValueError("Unsupported image format or image too large")
        image.load()
        if image.mode != "RGB":
            image = image.convert("RGB")
        return image, ext

    @classmethod
    async def decode_base64_to_image(cls, data_uri_or_base64: str) -> Tuple[Image.Image, str]:
        return await asyncio.to_thread(cls._decode_base64_sync, data_uri_or_base64)

    @staticmethod
    def _encode_image_to_base64_sync(image: Image.Image, format: str = "PNG") -> str:
        buffered = io.BytesIO()
        image.save(buffered, format=format)
        encoded = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/{format.lower()};base64,{encoded}"

    @classmethod
    async def encode_image_to_base64(cls, image: Image.Image, format: str = "PNG") -> str:
        return await asyncio.to_thread(cls._encode_image_to_base64_sync, image, format)

    @staticmethod
    def _save_image_sync(image: Image.Image, target_path: str, format: str = "PNG") -> None:
        Path(target_path).parent.mkdir(parents=True, exist_ok=True)
        image.save(target_path, format=format, quality=95)

    @classmethod
    async def save_image(cls, image: Image.Image, target_path: str, format: str = "PNG") -> None:
        await asyncio.to_thread(cls._save_image_sync, image, target_path, format)

    @classmethod
    def generate_render_id(cls, prefix: str = "rnd") -> str:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        short_id = uuid.uuid4().hex[:8]
        return f"{prefix}_{timestamp}_{short_id}"

    @classmethod
    def get_output_file_path(cls, render_id: str, ext: str = "png") -> str:
        return os.path.join(settings.OUTPUTS_DIR, f"{render_id}.{ext}")

    @classmethod
    def get_input_file_path(cls, render_id: str, ext: str = "png") -> str:
        return os.path.join(settings.INPUTS_DIR, f"{render_id}_input.{ext}")

    @classmethod
    def get_public_url(cls, render_id: str, ext: str = "png") -> str:
        return f"/static/outputs/{render_id}.{ext}"

    @staticmethod
    def _create_mock_render_sync(base_img: Image.Image, view_type: str = "exterior", lighting: str = "golden_hour") -> Image.Image:
        """
        Creates an architectural visualization mock preview when offline.
        Uses soft ambient tinting while preserving crisp Revit geometry.
        """
        w, h = base_img.size
        img_rgb = base_img.convert("RGB")
        
        # Determine ambient lighting tone
        if "night" in lighting or "dusk" in lighting or "blue" in lighting:
            tint_color = (25, 45, 95)
        elif "golden" in lighting:
            tint_color = (255, 230, 195)
        elif "overcast" in lighting:
            tint_color = (235, 238, 242)
        else:  # midday_sun
            tint_color = (245, 245, 235)

        tint_layer = Image.new("RGB", (w, h), tint_color)
        
        if "night" in lighting or "dusk" in lighting or "blue" in lighting:
            blended = ImageChops.multiply(img_rgb, tint_layer)
        else:
            blended = Image.blend(img_rgb, ImageChops.multiply(img_rgb, tint_layer), 0.45)

        # Enhance contrast and saturation for architectural punch
        contrast = ImageEnhance.Contrast(blended).enhance(1.2)
        final_img = ImageEnhance.Color(contrast).enhance(1.25)
        return final_img

    @classmethod
    async def create_mock_render(cls, base_img: Image.Image, view_type: str = "exterior", lighting: str = "golden_hour") -> Image.Image:
        return await asyncio.to_thread(cls._create_mock_render_sync, base_img, view_type, lighting)
