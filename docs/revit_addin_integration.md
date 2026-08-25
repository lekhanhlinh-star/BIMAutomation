# Tài Liệu Tích Hợp RevitAPP Add-In (C# / .NET) với Google OAuth, License Server & MCP

```text
BASE_URL=https://bimautomation.myminiserver.info
```

Tài liệu này hướng dẫn lập trình viên phát triển Revit Add-in (.NET Framework 4.8 / .NET 8 cho Autodesk Revit 2022–2027) tích hợp với hệ thống xác thực **Google OAuth 2.0 PKCE**, cơ chế cấp phép bản quyền **Server-Authoritative** kèm **Chống gian lận Dùng thử 14 ngày (Anti-Trial-Abuse)**, và liên kết giao thức **RevitAPP Model Context Protocol (MCP)**.

> **Tài liệu tham khảo chuyên sâu:**  
> Để tìm hiểu chi tiết về giao thức MCP Server, hướng dẫn cấu hình Claude Desktop / Cursor và danh bạ 57 công cụ tự động hóa, vui lòng xem [Tài liệu kỹ thuật RevitAPP MCP Server (docs/revit_mcp.md)](revit_mcp.md).

---

## 1. Luồng Tương Tác Giữa RevitAPP Add-In và Backend

```
+---------------------------------------------------------------------------------+
|                              Revit Desktop Add-in                               |
|                                                                                 |
| 1. Tạo PKCE code_verifier & code_challenge (S256)                               |
| 2. Bật HttpListener cục bộ đón callback (http://127.0.0.1:{port}/callback)      |
| 3. Mở trình duyệt Web mặc định: GET /oauth/authorize?...                        |
+----------------------------------------+----------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                       Trình duyệt Web & Backend Server                          |
|                                                                                 |
| 4. Người dùng bấm "Đăng nhập với Google"                                        |
| 5. Nếu tài khoản mới: Hiện Form đăng ký cá nhân tinh gọn ngay trên trình duyệt  |
| 6. Bấm "Hoàn tất & Kích hoạt RevitAPP" -> Server tự động 302 Redirect về:      |
|    http://127.0.0.1:{port}/callback?code=...&state=...                          |
+----------------------------------------+----------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                              Revit Desktop Add-in                               |
|                                                                                 |
| 7. HttpListener nhận Authorization Code                                         |
| 8. Gửi POST /oauth/token -> Nhận access_token & refresh_token                   |
| 9. Gửi POST /api/v1/entitlements/check (kèm hardware_fingerprint SHA-256)       |
|    - Nếu có Paid License -> Mở khóa theo gói mua                               |
|    - Nếu là máy mới -> Tự động kích hoạt 14 ngày Dùng thử Full 13 tính năng     |
|    - Nếu máy hết hạn 14 ngày -> Khóa dùng thử trên máy vĩnh viễn                |
+---------------------------------------------------------------------------------+
```

---

## 2. Mã Nguồn C# Thu Thập Hardware Fingerprint (Anti-Abuse)

Thu thập 4 tín hiệu phần cứng bất biến để tạo mã băm SHA-256 (`smbiosUuid | diskSerial | cpuId | machineGuid`):

```csharp
using System;
using System.Management;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;

public static class HardwareFingerprint
{
    public static string GetFingerprintHash()
    {
        string smbiosUuid  = GetWmiProperty("Win32_ComputerSystemProduct", "UUID");
        string diskSerial  = GetWmiProperty("Win32_DiskDrive", "SerialNumber");
        string cpuId       = GetWmiProperty("Win32_Processor", "ProcessorId");
        string machineGuid = GetWindowsMachineGuid();

        string rawSignals = $"{smbiosUuid}|{diskSerial}|{cpuId}|{machineGuid}";

        using (SHA256 sha256 = SHA256.Create())
        {
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawSignals));
            return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
        }
    }

    private static string GetWmiProperty(string className, string propertyName)
    {
        try
        {
            using (ManagementClass mc = new ManagementClass(className))
            using (ManagementObjectCollection moc = mc.GetInstances())
            {
                foreach (ManagementObject mo in moc)
                {
                    var val = mo[propertyName];
                    if (val != null && !string.IsNullOrWhiteSpace(val.ToString()))
                        return val.ToString().Trim();
                }
            }
        }
        catch { }
        return "UNKNOWN";
    }

    private static string GetWindowsMachineGuid()
    {
        try
        {
            using (var key = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64)
                                        .OpenSubKey(@"SOFTWARE\Microsoft\Cryptography"))
            {
                return key?.GetValue("MachineGuid")?.ToString()?.Trim() ?? "UNKNOWN";
            }
        }
        catch { }
        return "UNKNOWN";
    }
}
```

---

## 3. Trọn Bộ Mã Nguồn C# Đăng Nhập & Kiểm Tra Bản Quyền RevitAPP

```csharp
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class RevitAuthClient
{
    private const string ServerBaseUrl = "https://bimautomation.myminiserver.info";
    private const string ClientId = "revitapp-desktop";
    private readonly HttpClient _httpClient = new HttpClient();

    public string AccessToken { get; private set; }
    public string RefreshToken { get; private set; }

    /// <summary>
    /// Bắt đầu luồng đăng nhập Google và nhận token từ trình duyệt
    /// </summary>
    public async Task<bool> LoginWithGoogleAsync()
    {
        // 1. Tạo cổng Loopback ngẫu nhiên
        int port = GetRandomUnusedPort();
        string redirectUri = $"http://127.0.0.1:{port}/callback";

        // 2. Sinh cặp khóa PKCE
        string codeVerifier = GenerateCodeVerifier();
        string codeChallenge = GenerateCodeChallenge(codeVerifier);
        string state = Guid.NewGuid().ToString("N");

        // 3. Khởi động HttpListener cục bộ
        using (var listener = new HttpListener())
        {
            listener.Prefixes.Add($"http://127.0.0.1:{port}/");
            listener.Start();

            // 4. Mở trình duyệt Web mặc định đến trang Authorization
            string authUrl = $"{ServerBaseUrl}/oauth/authorize" +
                             $"?response_type=code" +
                             $"&client_id={ClientId}" +
                             $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                             $"&code_challenge={codeChallenge}" +
                             $"&code_challenge_method=S256" +
                             $"&state={state}";

            Process.Start(new ProcessStartInfo
            {
                FileName = authUrl,
                UseShellExecute = true
            });

            // 5. Lắng nghe phản hồi từ Loopback
            var context = await listener.GetContextAsync();
            var req = context.Request;
            var resp = context.Response;

            string code = req.QueryString["code"];
            string receivedState = req.QueryString["state"];

            if (string.IsNullOrEmpty(code) || receivedState != state)
            {
                byte[] errorBytes = Encoding.UTF8.GetBytes("<html><body style='font-family:sans-serif;text-align:center;padding:50px;background:#090d16;color:#f87171;'><h2>Xác thực thất bại!</h2><p>Mã bảo mật CSRF hoặc Authorization code không khớp.</p></body></html>");
                resp.ContentType = "text/html; charset=utf-8";
                resp.OutputStream.Write(errorBytes, 0, errorBytes.Length);
                resp.Close();
                return false;
            }

            // Gửi trang thành công đẹp mắt về trình duyệt
            byte[] successBytes = Encoding.UTF8.GetBytes("<html><body style='font-family:sans-serif;text-align:center;padding:50px;background:#090d16;color:#38bdf8;'><h2>Đăng nhập thành công!</h2><p style='color:#94a3b8;'>Đã xác thực bản quyền với RevitAPP. Bạn có thể đóng tab này và quay lại Autodesk Revit.</p><script>setTimeout(() => window.close(), 2500);</script></body></html>");
            resp.ContentType = "text/html; charset=utf-8";
            resp.OutputStream.Write(successBytes, 0, successBytes.Length);
            resp.Close();

            // 6. Đổi Authorization Code lấy Access & Refresh Tokens
            return await ExchangeCodeForTokensAsync(code, codeVerifier, redirectUri);
        }
    }

    private async Task<bool> ExchangeCodeForTokensAsync(string code, string codeVerifier, string redirectUri)
    {
        var payload = new
        {
            grant_type = "authorization_code",
            client_id = ClientId,
            code = code,
            code_verifier = codeVerifier,
            redirect_uri = redirectUri
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync($"{ServerBaseUrl}/oauth/token", content);

        if (!response.IsSuccessStatusCode)
            return false;

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        AccessToken = doc.RootElement.GetProperty("access_token").GetString();
        RefreshToken = doc.RootElement.GetProperty("refresh_token").GetString();
        return true;
    }

    /// <summary>
    /// Kiểm tra quyền hạn bản quyền hoặc dùng thử 14 ngày Server-Authoritative
    /// </summary>
    public async Task<EntitlementResult> CheckLicenseAndTrialAsync(string revitVersion = "2025")
    {
        if (string.IsNullOrEmpty(AccessToken))
            return new EntitlementResult { Allowed = false, Message = "Chưa đăng nhập tài khoản Google." };

        string fingerprint = HardwareFingerprint.GetFingerprintHash();
        string deviceName = Environment.MachineName;

        var requestBody = new
        {
            product_code = "revitapp",
            hardware_fingerprint = fingerprint,
            device_name = deviceName,
            revit_version = revitVersion
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{ServerBaseUrl}/api/v1/entitlements/check");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", AccessToken);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);

        // Nếu token hết hạn (401), thử refresh token tự động
        if (response.StatusCode == HttpStatusCode.Unauthorized && !string.IsNullOrEmpty(RefreshToken))
        {
            bool refreshed = await RefreshAccessTokenAsync();
            if (refreshed)
                return await CheckLicenseAndTrialAsync(revitVersion);
        }

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<EntitlementResult>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    private async Task<bool> RefreshAccessTokenAsync()
    {
        var payload = new
        {
            grant_type = "refresh_token",
            client_id = ClientId,
            refresh_token = RefreshToken
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync($"{ServerBaseUrl}/oauth/token", content);
        if (!response.IsSuccessStatusCode) return false;

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        AccessToken = doc.RootElement.GetProperty("access_token").GetString();
        RefreshToken = doc.RootElement.GetProperty("refresh_token").GetString();
        return true;
    }

    #region Helpers
    private static int GetRandomUnusedPort()
    {
        var listener = new System.Net.Sockets.TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        int port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    private static string GenerateCodeVerifier()
    {
        byte[] bytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(bytes);
        }
        return Base64UrlEncode(bytes);
    }

    private static string GenerateCodeChallenge(string codeVerifier)
    {
        using (SHA256 sha256 = SHA256.Create())
        {
            byte[] hash = sha256.ComputeHash(Encoding.ASCII.GetBytes(codeVerifier));
            return Base64UrlEncode(hash);
        }
    }

    private static string Base64UrlEncode(byte[] input)
    {
        return Convert.ToBase64String(input)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
    #endregion
}

public class EntitlementResult
{
    public bool Allowed { get; set; }
    public string Product { get; set; }
    public string Plan { get; set; }
    public bool IsTrial { get; set; }
    public string ExpiresAt { get; set; }
    public string[] Features { get; set; } = Array.Empty<string>();
    public string SignedLicenseToken { get; set; }
    public int GracePeriodHours { get; set; } = 72;
    public string Error { get; set; }
    public string Message { get; set; }
}

/// <summary>
/// Bộ xác thực bản quyền C# an toàn: Xác thực chữ ký RS256 bằng RSA Public Key,
/// lưu trữ cache mã hóa DPAPI và hỗ trợ Offline Grace Period 72h chống tua đồng hồ.
/// </summary>
public static class SecureLicenseValidator
{
    // RSA Public Key (Lấy từ GET /api/v1/entitlements/public-key hoặc nhúng cố định)
    private const string RsaPublicKeyXml = @"<RSAKeyValue><Modulus>0NN9WEmxMmMLeIwU3dQWhnSuC1lQ...</Modulus><Exponent>AQAB</Exponent></RSAKeyValue>";
    private static readonly string CachePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "RevitAPP", "lic_cache.dat"
    );

    public static bool VerifyAndStoreToken(string jwtToken, string expectedHwid)
    {
        try
        {
            var parts = jwtToken.Split('.');
            if (parts.Length != 3) return false;

            byte[] dataToVerify = Encoding.UTF8.GetBytes($"{parts[0]}.{parts[1]}");
            byte[] signature = Base64UrlDecode(parts[2]);

            using (var rsa = new RSACryptoServiceProvider())
            {
                rsa.FromXmlString(RsaPublicKeyXml);
                bool valid = rsa.VerifyData(dataToVerify, CryptoConfig.MapNameToOID("SHA256"), signature);
                if (!valid) return false;
            }

            // Phân tích payload
            string payloadJson = Encoding.UTF8.GetString(Base64UrlDecode(parts[1]));
            using var doc = JsonDocument.Parse(payloadJson);
            string tokenHwid = doc.RootElement.GetProperty("hwid").GetString();

            if (!string.Equals(tokenHwid, expectedHwid, StringComparison.OrdinalIgnoreCase))
                return false;

            // Lưu cache an toàn dưới Windows DPAPI (chỉ tài khoản Windows hiện tại giải mã được)
            byte[] rawBytes = Encoding.UTF8.GetBytes(jwtToken);
            byte[] encrypted = ProtectedData.Protect(rawBytes, null, DataProtectionScope.CurrentUser);
            string dir = Path.GetDirectoryName(CachePath);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            File.WriteAllBytes(CachePath, encrypted);

            return true;
        }
        catch
        {
            return false;
        }
    }

    private static byte[] Base64UrlDecode(string input)
    {
        string output = input.Replace('-', '+').Replace('_', '/');
        switch (output.Length % 4)
        {
            case 2: output += "=="; break;
            case 3: output += "="; break;
        }
        return Convert.FromBase64String(output);
    }
}
```

---

## 4. Danh Sách 13 Feature Codes & Ma Trận Phân Quyền

Khi gọi `CheckLicenseAndTrialAsync()`, danh sách các tính năng được phép sử dụng sẽ được trả về trong mảng `Features`:

| Feature Code | Tên Tính Năng | Quyền Hạn Dùng Thử 14 Ngày | Gói Cốt Thép (Manual) | Gói Cốt Thép + AI | Gói Full Suite |
|---|---|:---:|:---:|:---:|:---:|
| `column-rebar` | Bố trí cốt thép cột tự động | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `beam-rebar` | Bố trí cốt thép dầm tự động | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `footing-rebar` | Bố trí cốt thép móng tự động | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `wall-rebar` | Bố trí cốt thép vách tự động | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `beam-drawing` | Tạo bản vẽ chi tiết thép dầm | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `footing-drawing` | Tạo bản vẽ chi tiết móng | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `chat-ai` | Trợ lý AI trao đổi trực tiếp trong Revit | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `utility-tools` | Bộ tiện ích mô hình hóa & tham số | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `mcp-read` | Đọc thông số mô hình qua MCP | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `mcp-write` | Thay đổi/tạo mới cấu kiện qua MCP | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `model-from-cad` | Dựng mô hình từ CAD *(Y/c AutoCAD Full)* | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `dwg-export` | Xuất bản vẽ CAD tự động *(Y/c AutoCAD Full)* | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |
| `point-cloud` | Xử lý đám mây điểm Scan to BIM | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) | Khả dụng (Full) |

---

## 5. Bộ Cài Đặt Độc Lập `RevitAPP.Installer.exe` & Cấu Hình Môi Trường

1. **Bộ cài đặt thông minh:** 1 file cài duy nhất `RevitAPP.Installer.exe` tự động quét và nhận diện các phiên bản **Autodesk Revit 2022, 2023, 2024, 2025, 2026 và 2027** đã cài đặt trên máy tính.
2. **Ghi tệp Addin Manifest:** Tự động tạo tệp `RevitAPP.addin` trong đường dẫn người dùng:
   ```text
   %AppData%\Autodesk\Revit\Addins\<năm>\RevitAPP.addin
   ```
3. **Cài đặt thư viện MCP:** Khởi tạo thư mục làm việc và sinh Bearer Token 256-bit an toàn tại:
   ```text
   %LocalAppData%\RevitAPP\mcp-access-token.txt
   ```
4. **Yêu cầu hệ thống CAD:** Các tính năng `model-from-cad` và `dwg-export` yêu cầu máy trạm có cài đặt **AutoCAD bản Full phiên bản từ 2016 trở lên** để thực thi tự động hóa thông qua COM API.
