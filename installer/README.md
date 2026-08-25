# Hướng Dẫn Đóng Gói, Lưu Trữ & Phát Hành Bộ Cài Đặt `BIMAutomation.Installer.exe`

Tài liệu này hướng dẫn chi tiết quy trình từ lúc biên dịch mã nguồn C# Revit Add-in, đóng gói bộ cài đặt độc lập Inno Setup, lưu trữ phân phối tốc độ cao (Cloudflare R2 / GitHub Releases) và phát hành trên hệ thống Web Admin BIMAutomation.

---

## 1. Cấu Trúc Thư Mục Bộ Cài Đặt

```text
installer/
├── RevitAPP.iss            # Kịch bản biên dịch Inno Setup 6 (Tự động dò Revit 2022-2027)
├── RevitAPP.addin          # Template manifest khai báo Addin trong Revit
├── build_installer.ps1     # Script PowerShell tự động build, ký số & tính SHA-256
├── bin/                    # (Tùy chọn) Chứa DLLs đầu ra của từng bản Revit
│   ├── Revit2022/
│   ├── Revit2023/
│   ├── Revit2024/
│   ├── Revit2025/
│   ├── Revit2026/
│   └── Revit2027/
└── Output/                 # Thư mục chứa file đầu ra: BIMAutomation.Installer.exe
```

---

## 2. Quy Trình Đóng Gói & Ký Số (Code Signing)

### Bước 1: Biên dịch bộ cài đặt
Chạy lệnh PowerShell:
```powershell
.\installer\build_installer.ps1 -Version "2.5.0"
```
*Script sẽ tự động gọi Inno Setup Compiler (`ISCC.exe`) để tạo tệp `Output/BIMAutomation.Installer.exe` và in ra mã băm SHA-256 cùng dung lượng.*

### Bước 2: Ký số (Nếu có chứng chỉ Code Signing)
```powershell
.\installer\build_installer.ps1 -Version "2.5.0" -CertPfxPath "C:\certs\my_cert.pfx" -CertPassword "YourSecretPass"
```

> **Mẹo xử lý Windows Defender SmartScreen:**  
> Nếu bạn chưa mua chứng chỉ Code Signing EV đắt tiền:
> 1. Người dùng khi tải file về bấm: **"More info" (Thông tin khác) -> "Run anyway" (Vẫn chạy)**.
> 2. Gửi file `.exe` vừa đóng gói lên cổng [Microsoft Security Intelligence File Submission](https://www.microsoft.com/en-us/wdsi/filesubmission) (chọn mục *Software developer*) để Defender duyệt sạch trong 24h.

---

## 3. Lưu Trữ & Phân Phối Tốc Độ Cao

### Lựa chọn 1: Cloudflare R2 (Khuyên dùng nhất - Miễn phí Băng thông Egress)
1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/) -> Vào mục **R2 Object Storage**.
2. Tạo bucket: `bimautomation-releases` (Public Access: Cho phép Custom Domain, ví dụ `cdn.bimautomation.vn`).
3. Upload file `BIMAutomation.Installer.exe` vào thư mục `releases/v2.5.0/`.
4. URL tải trực tiếp:
   ```text
   https://cdn.bimautomation.vn/releases/v2.5.0/BIMAutomation.Installer.exe
   ```

### Lựa chọn 2: GitHub Releases
1. Tạo một Tag Release mới trên Repository: `v2.5.0`.
2. Đính kèm tệp `BIMAutomation.Installer.exe` vào mục **Assets**.
3. Copy link download của tệp:
   ```text
   https://github.com/lekhanhlinh-star/BIMAutomation/releases/download/v2.5.0/BIMAutomation.Installer.exe
   ```

---

## 4. Phát Hành Trên Cổng Quản Trị (Admin Portal)

1. Truy cập: `https://bimautomation.myminiserver.info/admin/releases` (hoặc `http://localhost:5173/admin/releases` khi chạy local).
2. Điền thông tin bản phát hành:
   - **Phiên bản:** `v2.5.0`
   - **Dung lượng hiển thị:** `48.5 MB`
   - **Đường dẫn tải file cài đặt (URL):** Link Direct vừa lấy ở Bước 3.
   - **Mã băm SHA-256 Checksum:** Nhập mã băm nhận được từ script (ví dụ: `e3b0c44298fc1c149...`).
   - **Nhật ký thay đổi (Changelog):** Các tính năng mới trong bản cập nhật.
3. Nhấn **"Phát hành phiên bản mới"**.

Ngay lập tức:
- Trang chủ `/download` sẽ tự động hiển thị nút tải cho bản mới nhất kèm mã SHA-256 và nút Copy Checksum.
- Trang khách hàng `/portal` hiển thị link tải trực tiếp.
- Người dùng mới chỉ cần tải về, cài đặt 30 giây và đăng nhập Google OAuth PKCE để tự động mở khóa 14 ngày dùng thử full tính năng.
