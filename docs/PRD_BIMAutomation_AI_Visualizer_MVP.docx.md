**BIMAutomation AI Visualizer**

**Product Requirements Document \- MVP**

Revit Add-in cho AI Architectural Rendering \- Interior & Exterior

| Thông tin | Giá trị |
| ----- | ----- |
| Sản phẩm | BIMAutomation AI Visualizer |
| Phiên bản | MVP v1 |
| Đối tượng | Kiến trúc sư / BIM user dùng Autodesk Revit |
| Mô hình kinh doanh | SaaS add-in qua backend, subscription \+ credits |
| Giá entry đề xuất | 250.000 VND / user / tháng |
| Mục tiêu MVP | Chứng minh user ưu tiên workflow trong Revit hơn tự upload ảnh lên Gemini |

# **1\. Tóm tắt sản phẩm**

BIMAutomation AI Visualizer là Revit add-in cho phép người dùng biến Current 3D View hoặc Saved View thành ảnh visualization kiến trúc bằng AI mà không cần rời Revit. Giá trị cốt lõi không phải chỉ là “gọi Gemini”, mà là tự động hóa toàn bộ workflow Revit → AI → kết quả, đồng thời sử dụng dữ liệu BIM để tăng độ chính xác và tạo các thao tác mà Gemini web không có.

North Star của MVP:

**“Từ một Revit view tới một ảnh presentation-ready trong 1 click, giữ geometry quan trọng, không export thủ công, không prompt engineering.”**

# **2\. Vấn đề người dùng**

* Workflow thủ công với Gemini: export/screenshot → upload → viết prompt → retry → download → quản lý file → quay lại Revit.  
* General image AI có thể làm thay đổi cửa, mullion, furniture, staircase, facade repetition hoặc camera.  
* Prompt giữa các user không nhất quán; chất lượng phụ thuộc khả năng prompt engineering.  
* Nhiều view trong cùng project dễ bị drift về style/material/lighting.  
* User khó thay đổi đúng một Revit element cụ thể nếu chỉ dùng ảnh và text prompt.  
* Không có lịch sử render gắn theo Revit View/Project.

# **3\. Vì sao user chọn add-in thay vì tự dùng Gemini**

| Nhu cầu | Gemini web |  | BIMAutomation AI Visualizer |
| ----- | ----- | ----- | ----- |
| One-click từ Revit | Không |  | Có |
| Tự lấy current view / camera | Không |  | Có |
| Preset thay prompt | Một phần |  | Có, theo workflow kiến trúc |
| Strict geometry mode | Chỉ bằng prompt |  | Revit-aware constraints \+ masks/context |
| Edit selected element | Thủ công / mô tả vùng |  | Theo ElementId \+ mask |
| Project style consistency | Phải tự quản lý |  | Preset theo project |
| Batch nhiều Revit views | Thủ công |  | Backend job queue |
| History theo Revit View | Không gắn BIM |  | Có |
| Model switching | User tự chọn app/model |  | Backend Model Router tự tối ưu cost/quality |

Điều kiện để sản phẩm đáng trả tiền: cùng một output, add-in phải giảm tối thiểu khoảng 70–80% thao tác thủ công so với workflow export → Gemini → download.

# **4\. User persona & Jobs-to-be-Done**

| Persona | Job chính | Điểm đau |
| ----- | ----- | ----- |
| Architect / Interior Designer | Tạo nhanh phương án visual từ model đang thiết kế | Mất thời gian export, prompt, retry |
| BIM Architect | Giữ layout/camera/geometry trong nhiều phương án | AI thường hallucinate geometry |
| Small Studio | Tạo nhiều view đồng nhất cho client | Style consistency và chi phí |
| Student / Junior Architect | Có render nhanh mà không học engine phức tạp | Không có GPU/render pipeline |

# **5\. Phạm vi MVP**

## **5.1 Must-have**

1. One-click render Current 3D View.  
2. Preset Interior / Exterior.  
3. Preset style, material mood, lighting, creativity.  
4. Geometry mode: Strict / Balanced / Creative.  
5. Preview 1K và Final 2K.  
6. Async job: queued / processing / completed / failed.  
7. Render history gắn theo project/view.  
8. Credit/quota theo subscription.  
9. Model Router phía backend.  
10. Selected Element Material Edit: user chọn element trong Revit và AI chỉ thay appearance của vùng tương ứng.

## **5.2 Nên có sau MVP**

* Batch render nhiều Saved Views  
* Project Visual Style  
* 4 variations  
* Side-by-side compare  
* Upscale 1K → 2K  
* Team/Studio account

## **5.3 Không làm trong MVP**

* AI video / animation  
* 360 panorama  
* Text-to-3D  
* Custom LoRA training cho từng user  
* Render engine replacement hoàn toàn cho V-Ray/Enscape/D5  
* Public AI API cho bên thứ ba

# **6\. User flow chính**

11. User mở 3D View trong Revit.  
12. Mở panel “AI Visualizer”.  
13. Chọn Interior/Exterior, Style, Lighting, Geometry Mode và Quality.  
14. Nhấn Generate.  
15. Add-in capture input view và metadata cần thiết, upload qua HTTPS.  
16. Backend xác thực user, kiểm tra credits, tạo Render Job và chọn model.  
17. AI provider/GPU worker render ảnh.  
18. Kết quả hiển thị trong add-in; user có thể Save, Regenerate, Finalize 2K hoặc Edit Selected Element.

# **7\. Functional Requirements**

| ID | Yêu cầu | Acceptance Criteria |
| ----- | ----- | ----- |
| FR-01 | Capture Current View | Không yêu cầu user export file thủ công |
| FR-02 | Render preset | User generate được chỉ với preset; prompt custom là optional |
| FR-03 | Geometry modes | Backend nhận mode và thay đổi preservation strategy |
| FR-04 | Async render job | UI không block Revit trong thời gian render |
| FR-05 | History | Có thể xem ít nhất 20 kết quả gần nhất theo view/project |
| FR-06 | Credits | Không cho submit job khi hết credits; ledger ghi đầy đủ |
| FR-07 | Selected Element Edit | Mask gắn đúng element đang chọn; vùng ngoài mask phải được giữ tối đa |
| FR-08 | Quality tiers | 1K Preview và 2K Final có cost/credit khác nhau |
| FR-09 | Model Router | Có thể đổi provider mà không update Revit client |
| FR-10 | Retry/failure | Không trừ credit với lỗi provider có thể xác nhận |

# **8\. Chiến lược accuracy**

MVP không cần cam kết “BIM-perfect rendering”. Mục tiêu là architectural fidelity đủ cao cho concept/presentation. Accuracy được tăng theo tầng, từ rẻ và đơn giản đến Revit-aware.

| Tầng | Input | Mục tiêu |
| ----- | ----- | ----- |
| L1 \- Baseline | RGB \+ auto prompt | Nhanh, dùng cho Preview |
| L2 \- Revit-aware prompt | RGB \+ category counts/context | Giảm hallucination |
| L3 \- Element masks | RGB \+ mask theo ElementId | Localized edit chính xác hơn |
| L4 \- Structural data | Depth/edge/semantic masks | Accuracy cao cho future Accurate mode |
| L5 \- Validation | So sánh edges/counts trước-sau | Phát hiện output drift nặng |

# **9\. Backend Architecture**

**Revit Add-in → HTTPS API → Auth/Subscription → Render Job → Queue → Model Router → Provider/GPU Worker → Object Storage → Result**

| Component | Trách nhiệm |
| ----- | ----- |
| Revit Add-in (C\#) | Capture view, UX, upload, poll job, show result |
| ASP.NET Core API | Auth, licensing, jobs, credits, rate limit |
| PostgreSQL | Users, plans, jobs, usage, subscriptions |
| Redis / Queue | Render job queue, retry |
| Object Storage | Input/output images có TTL |
| Model Router | Chọn model theo mode/cost/quality |
| External APIs | Gemini/Qwen/FLUX cho giai đoạn đầu |
| GPU Worker (future) | Self-host model khi volume đủ lớn |

# **10\. Cost model & Pricing 250.000 VND/tháng**

Giả định unit cost tham khảo cho planning MVP: Preview khoảng $0.03/ảnh; Gemini Flash 1K khoảng $0.067/ảnh; 2K khoảng $0.101/ảnh. Input image token cost rất nhỏ so với output. Các con số cần được benchmark lại trước launch vì provider pricing có thể thay đổi.

| Scenario | Usage / user / tháng | AI cost ước tính | Nhận xét |
| ----- | ----- | ----- | ----- |
| 100 Preview | 100 × $0.03 | $3.00 (\~78k VND) | Phù hợp gói 250k |
| 150 Preview | 150 × $0.03 | $4.50 (\~117k VND) | Vẫn khả thi nhưng margin giảm |
| 150 Gemini 1K | 150 × $0.067 | $10.05 (\~261k VND) | Không phù hợp gói 250k |
| 150 Gemini 2K | 150 × $0.101 | $15.15 (\~394k VND) | Lỗ trước backend/support |

## **10.1 Pricing khuyến nghị cho MVP**

| Plan | Giá | Credits | Đối tượng |
| ----- | ----- | ----- | ----- |
| Trial | 0 VND | 15 credits | Test value |
| Basic | 250.000 VND/tháng | 100–120 credits | User cá nhân / occasional |
| Pro | 490.000 VND/tháng | 250–300 credits | User dùng hằng ngày |
| Studio | 990.000 VND/tháng | 600+ credits | Nhóm nhỏ / power users |
| **Operation** | **Credits đề xuất** |  |  |
| Preview 1K | 1 |  |  |
| Accurate 1K | 2 |  |  |
| Final 2K | 3 |  |  |
| Selected Element Edit | 1–2 |  |  |
| 4 variations | 4 |  |  |

Không nên bán “Unlimited 250k”. Power user 5 ảnh/ngày ≈ 150 ảnh/tháng nên tự nhiên rơi vào Pro, hoặc mua top-up credits.

# **11\. Model Router Strategy**

| Mode trong UI | Backend target | Chiến lược |
| ----- | ----- | ----- |
| Fast / Preview | Model \~$0.03/image | Default, volume cao |
| Accurate | Gemini/Qwen mạnh hơn | Dùng khi user cần geometry/prompt adherence cao |
| Final 2K | Premium image model | Chỉ sau khi user duyệt Preview |
| Fallback | Provider thứ hai | Tự retry khi provider chính lỗi |

Client không được hard-code tên model. API contract chỉ dùng các khái niệm product-level như preview/accurate/final để backend có thể thay model mà không cần phát hành lại add-in.

# **12\. KPI & Product Validation**

| KPI | Mục tiêu MVP |
| ----- | ----- |
| Activation | ≥ 60% user trial tạo render đầu tiên |
| Time-to-first-render | \< 3 phút từ lúc cài và mở panel |
| Successful render rate | ≥ 95% request không lỗi kỹ thuật |
| Repeat usage | ≥ 40% activated users quay lại trong 7 ngày |
| Gemini replacement signal | ≥ 50% beta users nói họ ưu tiên add-in cho Revit workflow |
| Paid conversion | ≥ 10–15% trial → paid trong nhóm target |
| AI COGS / Basic user | Mục tiêu \< 100k VND/tháng trung bình |
| Average accepted render | Giảm retry qua presets và model routing |

# **13\. Analytics cần log**

* user\_id / plan / app version  
* revit version  
* view type (interior/exterior)  
* mode / quality / preset  
* provider/model nội bộ  
* latency  
* provider cost  
* credit charged/refunded  
* retry count  
* success/failure reason  
* download/save action  
* regenerate/finalize action

# **14\. Security & Privacy**

* API keys của Gemini/Qwen/FLUX chỉ tồn tại ở backend; tuyệt đối không ship trong Revit add-in.  
* Mọi upload dùng HTTPS và signed object URLs.  
* Input/output image có retention mặc định giới hạn; cho phép xóa history.  
* Không upload toàn bộ RVT trong MVP; chỉ gửi dữ liệu cần cho render.  
* Rate limiting \+ device/session controls để hạn chế abuse.  
* Usage ledger phải idempotent để tránh trừ credits hai lần.

# **15\. Roadmap triển khai**

| Giai đoạn | Deliverable |
| ----- | ----- |
| Week 1 | Backend auth, users, plans, render\_jobs, credits |
| Week 2 | Revit → capture view → API → provider → result |
| Week 3 | Presets, geometry modes, history, failure handling |
| Week 4 | Selected Element Edit \+ masking prototype |
| Week 5 | Benchmark 20–30 Revit scenes: interior/exterior |
| Week 6 | Closed beta 20–50 users \+ telemetry |
| Post-MVP | Batch views, project style, self-host benchmark, team plans |

# **16\. Risks & Mitigation**

| Rủi ro | Tác động | Giảm thiểu |
| ----- | ----- | ----- |
| AI thay đổi geometry | Output mất giá trị BIM | Strict mode, masks, structural inputs, benchmark |
| COGS vượt 250k plan | Margin âm | Credits, model routing, preview-first |
| User thấy Gemini đủ dùng | Retention thấp | Revit-aware features, selected-element edit, batch/history |
| Provider pricing/throttling | Cost/availability | Model Router \+ fallback |
| Render inconsistent | Khó dùng cho project | Project Style \+ preset \+ reference images |
| Support Revit versions | Chi phí dev tăng | Giới hạn version support trong MVP |

# **17\. Definition of Done cho MVP**

* User mới có thể cài add-in, đăng nhập, tạo render đầu tiên mà không cần hướng dẫn trực tiếp.  
* Current Revit View được render 1K qua backend và trả về trong add-in.  
* Có ít nhất Interior và Exterior presets.  
* Có credit enforcement và usage tracking.  
* Có history theo user/view.  
* Có selected-element material edit prototype hoạt động trên tối thiểu Wall/Floor.  
* Benchmark 20–30 scene chứng minh chất lượng đủ dùng và ghi nhận geometry error rate.  
* Unit economics của Basic 250k giữ AI COGS trung bình dưới ngưỡng mục tiêu.  
* Beta user có bằng chứng định tính rằng workflow add-in tốt hơn tự export/upload Gemini.

# **18\. Quyết định sản phẩm cần giữ**

* Không định vị là “Gemini trong Revit”.  
* Không bán unlimited ở giá 250k khi chưa self-host/model-cost đủ thấp.  
* Không để user phải prompt engineering mới có ảnh đẹp.  
* Không hard-code một AI provider vào client.  
* Tập trung moat vào Revit context, element masks, workflow, consistency và history.  
* Preview 1K là default; 2K chỉ khi Finalize để bảo vệ gross margin.

*End of PRD \- BIMAutomation AI Visualizer MVP*