**NỘI DUNG WEBSITE BÁN HÀNG**

# RevitAPP — Ra lệnh bằng lời, Revit tự vẽ thép

*Nội dung viết theo đúng tính năng đang có trong code, lấy AI/MCP vẽ thép tự động làm điểm bán hàng số 1*

*Add-in v1.14.3  ·  Revit 2022–2027  ·  Tab Ribbon: BIMAutomation*

*✎ Mọi số liệu trong tài liệu lấy trực tiếp từ source code. Đoạn in nghiêng có ký hiệu ✎ là ghi chú cho bạn — xóa trước khi đưa lên web. Chỗ trong dấu \[ \] là phần bạn cần điền.*

## **Thông tin gốc trích từ code**

| Hạng mục | Giá trị thật | Nguồn |
| :---- | :---- | :---- |
| **Tên sản phẩm** | RevitAPP (ProductCode \= "revitapp") | LicenseConfig.cs |
| **Tab Ribbon** | BIMAutomation | Application.cs |
| **Phiên bản** | v1.14.3 | RevitAPP.csproj |
| **Revit hỗ trợ** | 2022 – 2027 (R22–R27) | RevitAPP.csproj |
| **Lệnh trên Ribbon** | 18 nút / 4 panel | Application.cs |
| **Tool AI & MCP** | 57 tool duy nhất, dùng chung một registry | ChatToolRegistry.cs |
| **Tool vẽ thép qua AI** | 5 tool: cột, dầm, dầm-từ-Excel, tường, móng | Chat/Tools/Draw\*RebarTool.cs |
| **Endpoint MCP** | http://127.0.0.1:8765/mcp — Streamable HTTP, MCP 2025-11-25 | RevitMcpHttpServer.cs |
| **Bảo mật MCP** | Loopback-only \+ bearer token 256-bit | McpAccessTokenStore.cs |
| **Máy chủ license** | https://bimautomation.myminiserver.info | LicenseConfig.cs |

# **1\. Trang chủ — Khối Hero**

## **1.1. Tiêu đề chính**

**Gõ một câu. Revit tự vẽ xong hệ thép.**

*Phương án thay thế:*

* Add-in Revit đầu tiên cho phép AI vẽ cốt thép thay bạn.  
* Bạn ra lệnh bằng tiếng Việt. RevitAPP dựng thép trong Revit.  
* Không còn click từng cột. Chỉ cần nói tên hệ cột.

## **1.2. Đoạn mô tả**

RevitAPP mở 57 công cụ Revit cho trợ lý AI qua chuẩn MCP — trong đó có 5 công cụ vẽ cốt thép hoàn chỉnh cho cột, dầm, tường, sàn và móng. Bạn gõ “vẽ hệ cột C7 theo cấu hình đã lưu”, AI tự dò toàn bộ Structural Column mang Mark C7 trong cả dự án, áp đúng preset theo từng tầng và dựng thép chủ, đai, nối so le, thép chờ móng. Bạn xác nhận trước khi mô hình thay đổi.

## **1.3. Ba câu lệnh mẫu — nên để chạy động trên trang chủ**

Hiển thị lần lượt như đang gõ, kèm ảnh/GIF kết quả trong Revit:

**① Vẽ thép cột cả hệ, không cần chọn gì:**

**„ Vẽ hệ cột C7 theo cấu hình đã lưu “**

AI dò toàn bộ Structural Column có Instance Mark \= C7 trong dự án, tự nhận preset trùng tên C7 và áp cấu hình riêng theo từng tầng.

**② Vẽ thép dầm hàng loạt từ bảng Excel:**

**„ Vẽ thép cho các dầm đang chọn theo bảng thép trong file Excel này “**

Parser đọc bảng, áp cấu hình theo Mark cho từng dầm. Mỗi dầm được gọi riêng để thép không tràn sang dầm khác cùng trục.

**③ Vẽ thép móng theo preset:**

**„ Vẽ thép cho các móng đang chọn theo preset V1 “**

Lưới đáy, lưới trên, thép kê, đai ngang — trả về đúng số lượng đã tạo.

## **1.4. Nút hành động**

* Dùng thử miễn phí \[14\] ngày  
* Xem AI vẽ thép (video demo)

*Dòng trấn an: Cài trong 30 giây · Đăng nhập Google, không cần nhập key · Revit 2022–2027 · Mọi thay đổi mô hình đều hỏi xác nhận*

*✎ Hero hiện tại của web đang là “Tự động hóa Autodesk Revit. Chuẩn hóa 100% hồ sơ bản vẽ” — câu này bất kỳ add-in nào cũng nói được. Trong khi thứ không đối thủ nào ở Việt Nam có là AI vẽ được cốt thép thật. Đó mới là câu đáng đặt ở dòng đầu.*

# **2\. Trang “AI vẽ thép” — trang quan trọng nhất**

Đề xuất đây là trang có nhiều lưu lượng nhất sau trang chủ, và là trang mọi quảng cáo đổ về.

## **2.1. Vì sao AI vẽ được thép, trong khi các add-in khác chỉ trả lời câu hỏi**

Hầu hết tích hợp AI vào Revit chỉ dừng ở đọc mô hình và trả lời. RevitAPP khác ở chỗ AI gọi thẳng vào chính engine vẽ thép mà add-in đang dùng cho nút bấm trên Ribbon — cùng một code, cùng một transaction, cùng một license gate. AI không mô phỏng, không sinh script, mà chạy đúng công cụ đã được kiểm chứng.

* Cùng registry 57 tool cho cả cửa sổ Chat AI và MCP server — không có hai đường khác nhau để lệch kết quả.  
* Dùng chung hàng đợi ExternalEvent và transaction ownership với các lệnh Ribbon.  
* Mọi tool làm thay đổi mô hình đều yêu cầu người dùng xác nhận trong Revit.  
* Tool vẽ thép đều bị license gate: draw\_column\_rebar cần quyền column-rebar, draw\_beam\_rebar cần beam-rebar, draw\_wall\_rebar cần wall-rebar, draw\_footing\_rebar cần footing-rebar.

## **2.2. Năm công cụ vẽ thép AI gọi được**

### **draw\_column\_rebar — Thép cột**

Vẽ thép chủ và đai, nối so le, tùy chọn thép chờ móng và móc đỉnh cột.

**Điểm mạnh nhất:** chỉ cần nói tên hệ cột. Truyền columnMark, AI tự dò toàn bộ Structural Column mang Instance Mark đó trong cả dự án — không phải chọn tay, không phải mở từng tầng. Khi bạn nói “hệ cột C7”, add-in mặc định dùng luôn preset đã lưu tên C7.

**Tham số AI điều khiển được (đơn vị mm):**

| Nhóm | Tham số |
| :---- | :---- |
| **Chọn cột** | columnMark (dò theo Instance Mark toàn dự án), columnIds, hoặc bỏ trống để dùng selection hiện tại |
| **Cấu hình lưu sẵn** | presetName — dùng nguyên preset theo từng tầng |
| **Thép chủ** | mainBarDiameterMm, barsX, barsY, coverMm |
| **Nối thép** | lapFactor, staggerLap (nối so le 50/50), lapPosition (đầu/giữa), crankAtLap (uốn tại vị trí nối) |
| **Đai** | stirrupDiameterMm, stirrupSpacingEndMm, stirrupSpacingMidMm, confineZoneLenMm (vùng gia cường l0), stirrupSectionType, addPartition |
| **Thép phân bố** | useDistributionBar, distributionBarDiameterMm |
| **Móc đỉnh** | topHookBending, topHookLengthMm — bẻ móc cột tầng trên cùng |
| **Thép chờ móng** | foundationStarter (bẻ chữ L), foundationHmMm, foundationLbMm, foundationDirection, foundationSplitBothSides (chẽ 2 nhánh) |

### **draw\_beam\_rebar — Thép dầm, đọc được bảng Excel**

Vẽ thép chủ trên/dưới, gia cường hai lớp trên và dưới, cốt đai, thép chống phình.

**Điểm mạnh nhất:** truyền đường dẫn file Excel, parser áp cấu hình theo Mark cho từng dầm. Đây là quy trình quen thuộc của kỹ sư kết cấu — bảng thống kê thép dầm vốn đã nằm sẵn trong Excel.

| Nhóm | Tham số |
| :---- | :---- |
| **Nguồn dữ liệu** | excelFilePath, excelSheetName, excelHeaderRow — hoặc beamIds, hoặc selection hiện tại |
| **Thép chủ** | mainTopCount/DiameterMm, mainBottomCount/DiameterMm, mainAnchorLengthMm (chiều dài neo), mainTopBendDownLengthMm |
| **Gia cường trên** | topAddEnabled \+ Count/Diameter/Length/EdgeHookDown, và lớp 2 topAddL2\* |
| **Gia cường dưới** | bottomAddEnabled \+ Count/Diameter/Length, và lớp 2 bottomAddL2\* |
| **Đai** | stirrupDiameterMm, stirrupSpacingEndMm (vùng gối), stirrupSpacingMidMm (vùng nhịp) |
| **Chống phình** | antiBulgeEnabled, antiBulgeDiameterMm, antiBulgeSpacingMm, antiBulgeHeightThresholdMm (ngưỡng chiều cao dầm tự bật) |
| **Chung** | coverMm |

### **draw\_wall\_rebar — Thép tường / vách**

Hai lưới thép dọc và ngang hai mặt, kèm thép giằng.

| Nhóm | Tham số |
| :---- | :---- |
| **Chọn tường** | wallIds hoặc selection hiện tại; presetName (ví dụ V1) |
| **Lưới thép** | verticalDiameterMm/SpacingMm, horizontalDiameterMm/SpacingMm |
| **Thép giằng** | tieEnabled, tieDiameterMm, tieSpacingMm |
| **Lớp bảo vệ** | coverTopBottomMm, coverLeftRightMm, coverStartEndMm |
| **Móc & offset** | topHookType/LengthMm, bottomHookType/LengthMm, topOffsetMm, bottomOffsetMm, horizontalOffsetStartMm/EndMm |
| **Bổ sung** | drawAdditionalRebar |

*Nếu gọi preset không tồn tại, tool trả về luôn danh sách preset đang có để bạn chọn lại.*

### **draw\_footing\_rebar — Thép móng đơn**

Lưới đáy và lưới trên tùy chọn, kèm thép kê và đai ngang. Tham số: meshDiameterMm, bottomSpacingMm, topSpacingMm, bottomHookMm, topHookMm, drawTop, bottomCoverMm, topCoverMm, sideCoverMm, hoặc presetName.

Kết quả trả về đếm rõ: “Đã tạo N lưới, N thép kê, N đai ngang cho X/Y móng”, kèm cảnh báo nếu có móng không vẽ được.

### **draw\_beam\_rebar\_from\_open\_excel — Thép dầm từ Excel đang mở**

Biến thể lấy bảng thép trực tiếp từ workbook Excel bạn đang mở, không cần nhập đường dẫn.

## **2.3. Không chỉ vẽ thép — AI làm tiếp phần bản vẽ**

Sau khi thép đã dựng, cùng trợ lý đó triển khai luôn bản vẽ:

| Tool | Việc AI làm |
| :---- | :---- |
| **draw\_beam\_drawing** | Tạo mặt cắt ngang dầm |
| **find\_beam\_longitudinal\_presets** | Tìm preset mặt cắt dọc dầm phù hợp |
| **draw\_beam\_longitudinal\_drawing** | Triển khai mặt cắt dọc dầm hàng loạt lên sheet có sẵn: chọn số dầm mỗi sheet, chia dependent view tại lưới gần trung điểm, đặt nét cắt cách lưới ưu tiên 500 mm, xếp mặt cắt ngang 1–2 hàng, luôn giữ nguyên tỷ lệ |
| **draw\_footing\_drawing / draw\_footing\_section** | Mặt bằng và mặt cắt móng |
| **arrange\_footing\_sheet / draw\_and\_arrange\_footing\_sheet** | Vẽ và sắp xếp sheet móng trong một lượt |
| **create\_dimensions** | Ghi kích thước |
| **tag\_all\_walls / tag\_all\_rooms** | Gắn tag hàng loạt |

**Đây là điểm chốt cho khối này:** từ câu lệnh đến bản vẽ hoàn chỉnh trên sheet, không rời khỏi khung chat.

*✎ Kịch bản video demo đề xuất, một mạch không cắt: chọn vài dầm → gõ “vẽ thép theo bảng Excel này” → gõ tiếp “triển khai mặt cắt dọc lên sheet, 2 dầm mỗi sheet” → quay màn hình sheet thành phẩm. Một video như vậy bán hàng tốt hơn cả trang tính năng.*

# **3\. Kết nối AI agent bên ngoài qua MCP**

Ngoài cửa sổ Chat AI có sẵn, RevitAPP mở chính 57 tool đó ra chuẩn MCP để bạn dùng Claude, Cursor hay bất kỳ MCP client nào điều khiển Revit.

## **3.1. Thông số kỹ thuật — ghi thẳng lên web cho khách kỹ thuật**

| Hạng mục | Giá trị |
| :---- | :---- |
| **Giao thức** | MCP Streamable HTTP, phiên bản ổn định 2025-11-25 |
| **Endpoint** | http://127.0.0.1:8765/mcp |
| **Phạm vi mạng** | Chỉ loopback — không mở ra mạng ngoài |
| **Xác thực** | Bearer token 256-bit sinh riêng từng máy, lưu tại %LocalAppData%\\RevitAPP\\mcp-access-token.txt |
| **Bật/tắt** | Ribbon BIMAutomation → Commands → MCP Server |
| **Phụ thuộc ngoài** | Không cần revit\_mcp\_plugin, commandRegistry.json hay MCP server bên thứ ba |
| **Hàng đợi** | Worker có giới hạn, kết quả liên kết riêng theo từng request |
| **An toàn** | Mọi tool thay đổi mô hình đều yêu cầu xác nhận trong Revit; license gate và transaction ownership giữ nguyên như lệnh Ribbon |

## **3.2. Toàn bộ 57 tool theo nhóm**

| Nhóm | SL | Tool |
| :---- | :---- | :---- |
| **Vẽ thép & bản vẽ kết cấu** | 12 | draw\_column\_rebar, draw\_beam\_rebar, draw\_beam\_rebar\_from\_open\_excel, draw\_wall\_rebar, draw\_footing\_rebar, draw\_beam\_drawing, draw\_footing\_drawing, draw\_footing\_section, arrange\_footing\_sheet, draw\_and\_arrange\_footing\_sheet, find\_beam\_longitudinal\_presets, draw\_beam\_longitudinal\_drawing |
| **Đọc mô hình & chọn đối tượng** | 5 | get\_selected\_elements, get\_current\_view\_info, get\_current\_view\_elements, select\_all\_by\_category, ai\_element\_filter |
| **Excel** | 4 | get\_open\_excel\_workbooks, find\_excel\_files, inspect\_excel\_file, read\_excel\_table |
| **Dịch bản vẽ Việt / Trung** | 2 | get\_viewport\_text\_notes, apply\_text\_note\_translations |
| **Tạo & thao tác đối tượng** | 11 | create\_point\_based\_element, create\_line\_based\_element, create\_surface\_based\_element, create\_grid, create\_level, create\_room, create\_structural\_framing\_system, operate\_element, delete\_element, color\_elements, create\_dimensions |
| **Tag & thống kê** | 5 | tag\_all\_walls, tag\_all\_rooms, export\_room\_data, get\_material\_quantities, analyze\_model\_statistics |
| **Mở lệnh Ribbon** | 15 | open\_column\_rebar, open\_beam\_rebar, open\_beam\_drawing, open\_footing\_rebar, open\_footing\_drawing, open\_footing\_section, open\_wall\_rebar, open\_align\_views, open\_translate\_text, open\_renumber\_schedule, open\_license, open\_mcp\_server, toggle\_point\_cloud, run\_point\_cloud\_poc, focus\_chat |
| **Chạy mã C\# động** | 1 | send\_code\_to\_revit — giới hạn 1.200 ký tự, luôn phải xác nhận trước khi chạy |
| **Khác** | 2 | say\_hello, get\_available\_family\_types |

# **4\. Các tính năng còn lại trên Ribbon**

Ngoài trục AI/MCP, RevitAPP có 18 lệnh bấm trực tiếp trên tab BIMAutomation. Trình bày ngắn gọn, không cần chiếm trang chủ.

## **4.1. Panel Rebar — bấm nút vẽ thép thủ công**

Cùng engine với các tool AI, dành cho người muốn kiểm soát từng thông số qua giao diện.

| Nút | Mô tả |
| :---- | :---- |
| **Vẽ Thép Cột** | Thép chủ, đai, nối so le, thép chờ móng, móc đỉnh. |
| **Vẽ Thép Dầm** | Thép chủ trên/dưới, gia cường 2 lớp, đai, thép chống phình; đọc được cấu hình từ Excel. |
| **Vẽ Thép Tường** | Hai lưới dọc \+ ngang hai mặt, thép giằng. |
| **Vẽ Thép Sàn** | Bố trí cốt thép sàn. |
| **Vẽ Móng Đơn** | Kèm REVIEW 3D tương tác: lưới đáy/trên/giữa, chân chó, đai ngang có màu riêng và cập nhật trực tiếp theo mọi tùy chọn. Hỗ trợ móng tam giác và đa giác bất kỳ; bê tông hiển thị bán trong suốt để nhìn rõ thép bên trong. |

## **4.2. Panel Drawing Rebar — triển khai bản vẽ**

* Mặt Cắt Ngang Dầm — chỉ sắp xếp viewport vừa tạo, giữ nguyên viewport cũ trên sheet.  
* Mặt Cắt Dọc Dầm — theo chuỗi dầm liên tục, có preview trục và vị trí cắt, mặt cắt ngang gối–nhịp, tag/dim/detail thật, phát hành lên sheet có sẵn.  
* Mặt Bằng Móng và Mặt Cắt Móng.

## **4.3. Panel CAD Tools**

**Model From CAD — cửa sổ 4 tab, đọc trực tiếp đối tượng bạn quét chọn trong AutoCAD đang mở, không cần link/import CAD vào Revit, có preview 2D/3D zoom và orbit:**

| Tab | Chức năng |
| :---- | :---- |
| **Create Grid** | Từ LINE trong AutoCAD dựng lưới trục: giữ nguyên khoảng cách, góc và chiều dài tương đối, hỗ trợ trục chéo, bỏ qua Grid trùng. |
| **Create Column** | Từ LINE, closed polyline và nested block dựng Structural Column; chọn family, b–h, level, offset, rotation. |
| **Create Beam** | Quét Grid Axes rồi Beam Lines; đọc b×h từ TEXT/MTEXT; ghép rail đứt thành một cây dầm theo Gap Join; chỉ tách khi b×h đổi hoặc khe vượt Gap Max. |
| **Create Slab** | Bốn bước Grid Axes → Slab Lines → Ô Trống → Vùng Hatch; vùng hatch là sàn hạ riêng cắt khỏi sàn chính; chiều dày và cao độ đọc từ TEXT/MTEXT. |

**Xuất DWG Model — xuất toàn bộ sheet thành một DWG Model Space tự chứa qua AutoCAD Automation. DIM/DIMSTYLE chuyển annotative, Text Style Arial Narrow cao 2.5 width factor 0.8, DIMLFAC chuẩn hóa theo tỷ lệ viewport.**

**Cần AutoCAD bản đầy đủ 2016 trở lên trên cùng máy. AutoCAD LT không dùng được.**

## **4.4. Panel Commands — tiện ích**

* Chat AI — cửa sổ trợ lý trong Revit.  
* MCP Server — bật/tắt endpoint cho AI agent ngoài.  
* License — đăng nhập Google, xem hạn dùng và tính năng đã mở khóa.  
* Dịch Text — dịch TextNote trong các Viewport được chọn, không cần API key.  
* Đánh Số Schedule — đánh số lại các dòng trong Schedule.  
* Lưới 3D/2D — đồng bộ hai đầu toàn bộ lưới trục đang hiển thị; dùng được trong mặt bằng, mặt đứng, mặt cắt và Detail/Callout.  
* Căn Chỉnh View — căn viewport trên sheet.  
* Point Cloud / PC POC — làm việc với dữ liệu point cloud.

# **5\. Bảng giá theo mã tính năng**

License của RevitAPP cấp quyền theo từng mã tính năng, mỗi lệnh kiểm tra đúng mã của nó. Bảng giá nên dựng thẳng từ các mã này.

| Mã tính năng | Mở khóa |
| :---- | :---- |
| **column-rebar** | Vẽ Thép Cột \+ tool AI draw\_column\_rebar |
| **beam-rebar** | Vẽ Thép Dầm \+ draw\_beam\_rebar, draw\_beam\_rebar\_from\_open\_excel |
| **wall-rebar** | Vẽ Thép Tường \+ draw\_wall\_rebar |
| **footing-rebar** | Vẽ Móng Đơn \+ draw\_footing\_rebar |
| **beam-drawing** | Mặt Cắt Ngang Dầm, Mặt Cắt Dọc Dầm |
| **footing-drawing** | Mặt Bằng Móng, Mặt Cắt Móng |
| **chat-ai** | Cửa sổ Chat AI |
| **utility-tools** | MCP Server, Dịch Text, Đánh Số Schedule, Lưới 3D/2D, Căn Chỉnh View |
| **model-from-cad** | Model From CAD (Grid / Column / Beam / Slab) |
| **dwg-export** | Xuất DWG Model |
| **point-cloud** | Point Cloud, PC POC |
| **mcp-write** | Quyền ghi qua MCP |

## **Đề xuất cấu trúc gói — lấy AI làm điểm nâng gói**

| Gói | Bao gồm | Giá |
| :---- | :---- | :---- |
| **Dùng thử \[14\] ngày** | Toàn bộ, kể cả AI vẽ thép | 0đ |
| **Cốt thép** | column-rebar, beam-rebar, wall-rebar, footing-rebar, beam-drawing, footing-drawing — chỉ bấm nút thủ công | \[…\]đ |
| **Cốt thép \+ AI** | Như trên, cộng chat-ai, utility-tools và mcp-write — mở khóa AI vẽ thép và MCP | \[…\]đ |
| **Full Suite** | Tất cả, thêm model-from-cad, dwg-export, point-cloud | \[…\]đ |
| **Doanh nghiệp** | Full Suite \+ quản lý license tập trung | \[…\]đ/máy |

*✎ Tách “Cốt thép” và “Cốt thép \+ AI” cho phép AI vẽ thép trở thành lý do nâng gói rõ ràng, thay vì chôn trong một gói Full duy nhất. Bạn quyết định giữ cách này hay giữ kiểu chia theo thời hạn Tháng/Năm như web hiện tại.*

*✎ Vẽ Thép Sàn hiện gọi LicenseCommandGate.Ensure(Title) không kèm mã tính năng — bất kỳ license hợp lệ nào cũng chạy được. Muốn bán riêng thì phải thêm mã, ví dụ "slab-rebar".*

# **6\. Trang Tải & Kích hoạt**

## **6.1. Ba bước**

| Bước | Nội dung |
| :---- | :---- |
| **1** | Tải RevitAPP.Installer.exe — một installer duy nhất cho mọi bản Revit, không phải chọn đúng phiên bản. |
| **2** | Chạy installer. Nó tự dò các bản Revit đang có trên máy và cài gói tương ứng vào %AppData%\\Autodesk\\Revit\\Addins\\\<năm\>. |
| **3** | Mở Revit → tab BIMAutomation → License → Đăng nhập Google. Không cần mã kích hoạt. |

*✎ Web hiện viết “Tải bộ cài (.exe) tương thích cho phiên bản Revit bạn đang sử dụng” — sai. Installer tự dò tất cả. Sửa câu này.*

## **6.2. Yêu cầu hệ thống**

* Windows 10 / 11 (64-bit)  
* Autodesk Revit 2022, 2023, 2024, 2025, 2026 hoặc 2027  
* Kết nối Internet — bắt buộc, dùng xác thực bản quyền  
* AutoCAD full 2016+ — chỉ cần cho Model From CAD và Xuất DWG Model

| Phiên bản Revit | Giới hạn |
| :---- | :---- |
| **Revit 2022** | Có fallback cho Viewport.GetProjectionToSheetTransform |
| **Revit 2022–2024** | Bỏ qua Rebar Bending Detail vì Revit API chưa hỗ trợ |
| **Revit 2025** | Bản được triển khai và kiểm chứng thực tế nhiều nhất |

## **6.3. Cách bản quyền hoạt động**

* Đăng nhập Google theo chuẩn OAuth PKCE. Add-in không lưu mật khẩu, không nhúng client secret.  
* Bản quyền gắn với tài khoản, không gắn mã kích hoạt. Đổi máy chỉ cần đăng nhập lại.  
* Xác minh trực tuyến với máy chủ. Gia hạn, nâng gói hay thu hồi có hiệu lực sau khoảng một chu kỳ làm mới, thường không quá \~75 giây.  
* Vì bảo mật, add-in fail closed: mất mạng kéo dài thì các lệnh có bản quyền tạm khóa cho tới khi kết nối lại.  
* Cập nhật không làm mất license và giữ nguyên preset. Đường cập nhật không bị license gate chặn.

# **7\. Câu hỏi thường gặp**

**Hỏi: AI vẽ thép có chính xác không, hay chỉ là mô phỏng?**

Đáp: AI gọi thẳng vào chính engine vẽ thép mà add-in dùng cho nút bấm trên Ribbon — cùng code, cùng transaction, cùng kết quả. AI không sinh script và không tự chế cách vẽ; nó chỉ điền tham số rồi chạy công cụ đã được kiểm chứng. Bạn xác nhận trước khi mô hình thay đổi.

**Hỏi: Tôi phải mô tả tham số kỹ thuật cho AI bằng lời sao cho đủ?**

Đáp: Không cần. Bạn lưu cấu hình trong add-in như bình thường rồi gọi theo tên, ví dụ “vẽ hệ cột C7 theo cấu hình đã lưu”. Với thép dầm, bạn đưa thẳng bảng Excel và parser áp cấu hình theo Mark cho từng dầm.

**Hỏi: AI có tự sửa mô hình của tôi mà không hỏi không?**

Đáp: Không. Mọi tool làm thay đổi mô hình đều yêu cầu bạn xác nhận trong Revit. Riêng chức năng chạy mã C\# động còn bị giới hạn 1.200 ký tự và luôn phải xác nhận.

**Hỏi: MCP Server có gửi mô hình của tôi ra ngoài không?**

Đáp: Không. Endpoint chỉ nghe trên loopback 127.0.0.1, không mở ra mạng ngoài, và được bảo vệ bằng bearer token 256-bit sinh riêng cho từng máy.

**Hỏi: Tôi dùng được AI agent nào?**

Đáp: Bất kỳ MCP client nào nói chuẩn MCP Streamable HTTP — Claude, Cursor và các client tương tự. Bạn cũng có thể dùng luôn cửa sổ Chat AI có sẵn trong Revit mà không cần cài gì thêm.

**Hỏi: RevitAPP hỗ trợ phiên bản Revit nào?**

Đáp: Revit 2022 đến 2027 trên Windows 10/11 64-bit. Một bộ cài duy nhất tự dò và cài cho mọi bản Revit đang có trên máy. Lưu ý Revit 2022–2024 không có Rebar Bending Detail do giới hạn của Revit API.

**Hỏi: Kích hoạt bản quyền thế nào?**

Đáp: Không cần mã kích hoạt. Mở Revit → tab BIMAutomation → License → Đăng nhập Google. Bản quyền gắn trực tiếp với tài khoản của bạn, đổi máy chỉ cần đăng nhập lại.

**Hỏi: Dùng RevitAPP có bắt buộc phải có Internet không?**

Đáp: Có. Bản quyền xác minh trực tuyến, nên máy cần kết nối mạng khi làm việc. Mất mạng kéo dài thì các lệnh có bản quyền tạm khóa cho tới khi kết nối lại — đây là cơ chế bắt buộc để bảo vệ bản quyền.

**Hỏi: Model From CAD và Xuất DWG Model cần gì thêm?**

Đáp: Cần AutoCAD bản đầy đủ 2016 trở lên trên cùng máy, vì hai lệnh này làm việc trực tiếp với AutoCAD qua Automation. AutoCAD LT không thay thế được. Các tính năng khác không cần AutoCAD.

# **8\. Web hiện tại cần sửa gì**

| Đang có trên web | Thực tế trong code | Xử lý |
| :---- | :---- | :---- |
| **Không nhắc một chữ nào về AI vẽ thép hay MCP** | 5 tool vẽ thép \+ 57 tool AI, có MCP server tích hợp | Đưa lên làm trục chính của trang chủ — đây là việc quan trọng nhất |
| **“Ghi kích thước tự động (Auto Dimension)” là tính năng số 1, “tiết kiệm 90%”** | Không có lệnh Auto Dimension trên Ribbon; chỉ có tool AI create\_dimensions | Gỡ khỏi vị trí chủ lực; nếu giữ thì mô tả trong mục AI |
| **“Tự động đi tuyến ống MEP”, “giảm 75% thời gian vẽ MEP”** | Không có code MEP nào trong repo | Gỡ hoàn toàn hoặc chuyển sang Lộ trình phát triển |
| **“Đồng bộ tham số 2 chiều Excel”, “10.000 tham số”** | 4 tool AI đọc Excel \+ đọc bảng thép dầm — một chiều | Sửa thành “đọc bảng thép dầm trực tiếp từ Excel” |
| **“Batch Rename 500 Sheet trong 10 giây”, Regex, Preview, Undo** | Chỉ có Đánh Số Schedule | Gỡ hoặc mô tả đúng phạm vi |
| **“Tạo 100 Sheet trong 1 phút từ Excel”** | Chỉ có Căn Chỉnh View | Sửa lại phạm vi |
| **“Xuất PDF, DWG & IFC”, “100 bản vẽ / 2 phút”** | Chỉ có DWG, và cần AutoCAD full 2016+ | Sửa thành DWG, ghi rõ điều kiện |
| **“Bar Schedule chuẩn TCVN, kiểm tra chiều dài neo nối”** | Có 5 lệnh vẽ thép thật, nhưng chưa thấy code sinh Bar Schedule TCVN | Giữ phần vẽ thép, gỡ phần Bar Schedule |
| **“30+ công cụ” vs “Full 13 tính năng” trong portal** | 18 lệnh Ribbon, 12 mã tính năng, 57 tool AI | Dùng thống nhất “18 lệnh \+ 57 công cụ AI” |
| **Testimonial đích danh Coteccons, Central Cons, Archetype** | Không có căn cứ | Thay bằng khách hàng thật có xác nhận |
| **Bốn tên lẫn lộn: BIMAutomation, BIMPilot, RevitAPP, RevitAI** | Code dùng nhất quán RevitAPP; tab Ribbon là BIMAutomation | Chốt một tên, nói rõ quan hệ nhà phát hành ↔ tên add-in |

# **Phụ lục. 18 lệnh Ribbon và mã tính năng**

| \# | Panel | Nhãn nút | Class | Feature code |
| :---- | :---- | :---- | :---- | :---- |
| **1** | Rebar | Vẽ Thép Cột | DrawColumnRebarCommand | column-rebar |
| **2** | Rebar | Vẽ Thép Dầm | BeamRebarPro.Commands.StartupCommand | beam-rebar |
| **3** | Rebar | Vẽ Thép Tường | WallRebar.Commands.StartupCommand | wall-rebar |
| **4** | Rebar | Vẽ Thép Sàn | SlabReinforcementCommand | (chưa gắn mã) |
| **5** | Rebar | Vẽ Móng Đơn | IsolatedFootingRebar.Commands.StartupCommand | footing-rebar |
| **6** | Drawing Rebar | Mặt Cắt Ngang Dầm | BeamDrawingCommand | beam-drawing |
| **7** | Drawing Rebar | Mặt Cắt Dọc Dầm | BeamLongitudinalDrawingCommand | beam-drawing |
| **8** | Drawing Rebar | Mặt Bằng Móng | FootingDrawing.Addin.Commands.FootingDrawingCommand | footing-drawing |
| **9** | Drawing Rebar | Mặt Cắt Móng | FootingSectionDrawingCommand | footing-drawing |
| **10** | CAD Tools | Model From CAD | ModelFromCadCommand | model-from-cad |
| **11** | CAD Tools | Xuất DWG Model | ExportSheetsToDwgCommand | dwg-export |
| **12** | Commands | Chat AI | ChatCommand | chat-ai |
| **13** | Commands | MCP Server | McpServerCommand | utility-tools |
| **14** | Commands | License | LicenseCommand | (không gate) |
| **15** | Commands | Dịch Text | TranslateTextCommand | utility-tools |
| **16** | Commands | Đánh Số Schedule | RenumberScheduleCommand | utility-tools |
| **17** | Commands | Lưới 3D/2D | ToggleGridExtentCommand | utility-tools |
| **18** | Commands | Căn Chỉnh View | AlignSheetViewportsCommand | utility-tools |
| **\+** | Commands | Point Cloud / PC POC | TogglePointCloudPanelCommand / PointCloudPocCommand | point-cloud |

