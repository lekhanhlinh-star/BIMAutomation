# Deployment — 2026-09-08 (Form Redesign, Geometric Lock & UI Polish)

- SSH: `server_deploy`; workspace: `/home/linh/BIMAutomation`.
- Frontend: http://140.115.59.61:5174
- Backend docs: http://140.115.59.61:8010/docs
- Services updated: `ai_rendering`, `frontend_ai_rendering` (both healthy).
- Backup created: `/home/linh/deploy-backups/rendering-20260907-sync-prompt-redesign/source-backup.tar.gz`.
- Key changes deployed:
  - Form UI streamlined into 4 essential groups (Phong cách, Vật liệu 2x2, Ánh sáng/Bối cảnh, Bảo toàn hình khối CAD/Revit).
  - Gỡ bỏ hoàn toàn khối kiểm tra rườm rà (Section 06), thay bằng thanh hành động trực tiếp (chọn 1K/2K + nút tạo ảnh).
  - Gỡ bỏ nhãn "(Lovable style)", chuẩn hóa tab so sánh thành "Kéo so sánh".
  - Prompt compiler phiên bản `2026-09-07.9` khóa 100% hình khối 3D và góc nhìn camera.
  - Thêm presets kiến trúc Việt Nam: Vữa khoáng kem ngà, Biệt thự vòm cong, Nắng trưa nhiệt đới, Đá granite xám đậm, Khung nhôm champagne.
- Verification: 65/65 tests passed inside production container; frontend bundle `index-Bhb9C0eC.js` and `index-Cq_luAfd.css` built and verified live.

---

# Deployment — 2026-09-07 (Previous)

- SSH: `server_deploy`; workspace: `/home/linh/BIMAutomation`.
- Frontend: http://140.115.59.61:5174
- Backend docs: http://140.115.59.61:8010/docs
- Updated services: `ai_rendering`, `frontend_ai_rendering`; both healthy.
- Real provider mode: Gemini `gemini-3-pro-image`, mock disabled.
- Synced the two demo source modules, excluding server `.env`, storage, virtual environments, node_modules and build artifacts. Removed obsolete frontend components through scoped rsync with backup.
- Server Compose change: microservice APP_NAME override and image-model fallback aligned; other services not redeployed.
- Retained existing `bimautomation_ai_rendering_storage` volume.

Validation: remote backend image 57 tests passed; frontend image built with npm ci; nginx configuration passed on the application network. From the development machine, fetched frontend HTML and JS/CSS, confirmed reference_render_id and the new reference-selection control in the bundle; both view previews returned version 2026-09-07.3, missing view returned 422, sample proxy worked, health through frontend returned ready with mock false. No additional real image generation was performed during deployment, and no browser interaction test was performed.

## Rollback assets

Server backup: `/home/linh/deploy-backups/rendering-20260907-consistency-v1`.

- `source.tar.gz`: previous source and Compose file (mode 600; may include server environment files).
- `build.log`: deployment image build log.
- `rollback.compose.yml`: previous image tags.

To roll back the two runtime images from `/home/linh/BIMAutomation`:

```sh
docker compose -f docker-compose.yml -f /home/linh/deploy-backups/rendering-20260907-consistency-v1/rollback.compose.yml up -d --no-deps --no-build --wait ai_rendering frontend_ai_rendering
```

This changes runtime images only; it does not restore source files. Do not remove the storage volume when rolling back.
