import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Code, 
  Layers, 
  Database, 
  FileSpreadsheet, 
  Languages, 
  Box, 
  Tag, 
  Command, 
  Cpu, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Filter, 
  SlidersHorizontal,
  ChevronRight,
  Info
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả công cụ', count: 57, icon: Layers },
  { id: 'rebar_structural', label: 'Vẽ thép & Bản vẽ kết cấu', count: 12, icon: Box },
  { id: 'model_selection', label: 'Đọc mô hình & Chọn đối tượng', count: 5, icon: Database },
  { id: 'excel_processing', label: 'Xử lý dữ liệu Excel', count: 4, icon: FileSpreadsheet },
  { id: 'translation', label: 'Dịch bản vẽ Việt / Trung', count: 2, icon: Languages },
  { id: 'element_manipulation', label: 'Tạo & Thao tác đối tượng', count: 11, icon: Box },
  { id: 'tag_quantities', label: 'Tag & Thống kê khối lượng', count: 5, icon: Tag },
  { id: 'ribbon_commands', label: 'Lệnh điều khiển Ribbon', count: 15, icon: Command },
  { id: 'dynamic_csharp_utility', label: 'C# Động & Tiện ích khác', count: 3, icon: Cpu }
];

const MCP_TOOLS = [
  // Group 1: Vẽ thép & Bản vẽ kết cấu (12 tools)
  {
    id: 'create_column_rebar',
    name: 'create_column_rebar',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-write',
    licenseCode: 'column-rebar',
    description: 'Tạo hệ cốt thép cột hoàn chỉnh (thép chủ + đai bao + đai C + đoạn nối so le 50%) theo cấu hình preset hoặc instance mark theo TCVN 5574:2018.',
    inputs: [
      { name: 'column_ids', type: 'int[]', required: true, desc: 'Danh sách ElementId các cột bê tông trong Revit' },
      { name: 'preset_name', type: 'string', required: false, desc: 'Tên cấu hình preset đã lưu (ví dụ: "C7_STANDARD")' },
      { name: 'main_bar_type', type: 'string', required: false, desc: 'Tên Type thanh thép chủ (ví dụ: "Rebar Bar: 20M" hoặc "CB400-V d20")' },
      { name: 'stirrup_type', type: 'string', required: false, desc: 'Tên Type đai cốt thép (ví dụ: "CB240-T d8")' },
      { name: 'stirrup_spacing', type: 'int[]', required: false, desc: 'Mảng 3 bước đai [đáy, giữa, đỉnh] (ví dụ: [100, 200, 100])' }
    ],
    outputs: {
      success: true,
      created_rebar_ids: [104523, 104524, 104525, 104526],
      total_bars_created: 192,
      stirrup_sets_count: 32,
      transaction_name: 'TX_Rebar_Column_C7',
      message: 'Đã tạo thành công cốt thép cho 16 cột.'
    },
    errorHandling: 'Báo lỗi và Rollback nếu cột không tồn tại, cột không thuộc Category Structural Columns, hoặc thiếu RebarBarType tương ứng trong Document.'
  },
  {
    id: 'create_beam_rebar',
    name: 'create_beam_rebar',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-write',
    licenseCode: 'beam-rebar',
    description: 'Bố trí thép dầm chính, dầm phụ, thép tăng cường gối/nhịp, thép giá và đai gia cường 2 đầu dầm theo bảng tính Excel hoặc preset.',
    inputs: [
      { name: 'beam_ids', type: 'int[]', required: true, desc: 'Danh sách ElementId các đoạn dầm thuộc trục dầm liên tục' },
      { name: 'excel_path', type: 'string', required: false, desc: 'Đường dẫn file Excel chứa bảng thép thiết kế' },
      { name: 'preset_name', type: 'string', required: false, desc: 'Tên cấu hình preset dầm' },
      { name: 'cover', type: 'double', required: false, desc: 'Chiều dày lớp bê tông bảo vệ (mm), mặc định 25mm' },
      { name: 'lap_length', type: 'double', required: false, desc: 'Chiều dài đoạn nối thép neo dầm (ví dụ: 30*d)' }
    ],
    outputs: {
      success: true,
      beam_count: 4,
      spans_detected: 4,
      total_length_m: 28.5,
      created_rebar_ids: [201101, 201102, 201103, 201104],
      message: 'Hoàn thành bố trí thép cho 4 nhịp dầm liên tục.'
    },
    errorHandling: 'Báo lỗi nếu các dầm không cùng phương, dầm không thuộc Category Structural Framing, hoặc file Excel sai định dạng cột.'
  },
  {
    id: 'create_footing_rebar',
    name: 'create_footing_rebar',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-write',
    licenseCode: 'footing-rebar',
    description: 'Bố trí thép móng đơn, móng băng, móng bè (lưới đáy bẻ mỏ 90°, lưới trên, đai bo viền, thép chân chó Bar Chair đỡ lưới trên).',
    inputs: [
      { name: 'footing_ids', type: 'int[]', required: true, desc: 'Danh sách ElementId các đài móng' },
      { name: 'preset_name', type: 'string', required: false, desc: 'Tên preset móng (ví dụ: "V1", "M1_PAD")' },
      { name: 'bottom_bar_type', type: 'string', required: false, desc: 'Mác và đường kính thép lưới đáy (ví dụ: "CB400-V d14")' },
      { name: 'bottom_spacing', type: 'int', required: false, desc: 'Bước rải thép lưới đáy (mm, ví dụ: 150)' },
      { name: 'top_mesh', type: 'bool', required: false, desc: 'Bố trí lưới thép lớp trên (true/false)' }
    ],
    outputs: {
      success: true,
      footing_count: 8,
      rebar_ids: [301450, 301451, 301452],
      bar_chairs_created: 32,
      message: 'Hoàn tất bố trí cốt thép 3D cho 8 đài móng.'
    },
    errorHandling: 'Báo lỗi nếu phần tử không thuộc Category Structural Foundations hoặc không đủ chiều dày để bố trí 2 lớp thép.'
  },
  {
    id: 'create_wall_rebar',
    name: 'create_wall_rebar',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-write',
    licenseCode: 'wall-rebar',
    description: 'Bố trí lưới thép đứng, thép ngang 2 lớp, đai liên kết chữ C và thép gia cường mép lỗ mở cửa cho vách bê tông cốt thép.',
    inputs: [
      { name: 'wall_ids', type: 'int[]', required: true, desc: 'Danh sách ElementId các vách bê tông cốt thép' },
      { name: 'vertical_bar', type: 'string', required: false, desc: 'Tên Type thép đứng (ví dụ: "CB400-V d12")' },
      { name: 'horizontal_bar', type: 'string', required: false, desc: 'Tên Type thép ngang (ví dụ: "CB240-T d10")' },
      { name: 'vertical_spacing', type: 'int', required: false, desc: 'Khoảng cách thép đứng (mm, ví dụ: 200)' },
      { name: 'horizontal_spacing', type: 'int', required: false, desc: 'Khoảng cách thép ngang (mm, ví dụ: 200)' }
    ],
    outputs: {
      success: true,
      wall_count: 2,
      hidden_columns_created: 4,
      rebar_ids: [401100, 401101, 401102],
      message: 'Bố trí thành công 2 lớp thép vách và cột biên ẩn.'
    },
    errorHandling: 'Báo lỗi nếu tường không phải là Structural Wall hoặc có biên dạng cong 3D phức tạp vượt ngoài giới hạn cho phép.'
  },
  {
    id: 'create_slab_rebar',
    name: 'create_slab_rebar',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Tạo thép sàn 2 lớp (phương X/Y), thép mũ gối trên đỉnh dầm và thép gia cường góc 45° tại vị trí lỗ mở sàn / hộp kỹ thuật.',
    inputs: [
      { name: 'floor_id', type: 'int', required: true, desc: 'ElementId của sàn bê tông cốt thép' },
      { name: 'top_bar', type: 'string', required: false, desc: 'Tên Type thép lớp trên' },
      { name: 'bottom_bar', type: 'string', required: false, desc: 'Tên Type thép lớp dưới' },
      { name: 'spacing_x', type: 'int', required: false, desc: 'Bước rải phương X (mm, ví dụ: 150)' },
      { name: 'spacing_y', type: 'int', required: false, desc: 'Bước rải phương Y (mm, ví dụ: 150)' },
      { name: 'boundary_curve_ids', type: 'int[]', required: false, desc: 'Tập hợp đường bao giới hạn vùng rải' }
    ],
    outputs: {
      success: true,
      slab_rebar_ids: [501201, 501202, 501203],
      total_area_m2: 145.6,
      message: 'Đã tạo thép sàn 2 lớp hoàn chỉnh.'
    },
    errorHandling: 'Báo lỗi nếu biên dạng sàn không khép kín hoặc thiếu tham số gán Rebar Cover.'
  },
  {
    id: 'generate_beam_drawing_sheet',
    name: 'generate_beam_drawing_sheet',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-write',
    licenseCode: 'beam-drawing',
    description: 'Tự động tạo Sheet mới, cắt mặt cắt dọc và các mặt cắt ngang dầm liên tục, đặt Viewport theo tỷ lệ và căn lề khung tên chuẩn.',
    inputs: [
      { name: 'beam_ids', type: 'int[]', required: true, desc: 'Danh sách ElementId các dầm trên trục' },
      { name: 'sheet_number', type: 'string', required: false, desc: 'Mã số bản vẽ (ví dụ: "KC-201")' },
      { name: 'sheet_name', type: 'string', required: false, desc: 'Tên bản vẽ (ví dụ: "CHI TIẾT DẦM TRỤC 3")' },
      { name: 'titleblock_name', type: 'string', required: false, desc: 'Tên Family khung tên Titleblock (ví dụ: "A1_Metric_Standard")' },
      { name: 'scale', type: 'int', required: false, desc: 'Tỷ lệ mặt cắt dọc (ví dụ: 25, 50)' }
    ],
    outputs: {
      success: true,
      sheet_id: 601001,
      sheet_number: 'KC-201',
      view_ids: [601010, 601011, 601012, 601013],
      viewports_placed: 5,
      message: 'Đã tạo Sheet KC-201 và sắp xếp 5 Viewport tự động.'
    },
    errorHandling: 'Báo lỗi nếu khung tên Titleblock không tồn tại trong Document hoặc trùng Sheet Number với bản vẽ khác.'
  },
  {
    id: 'generate_footing_drawing_sheet',
    name: 'generate_footing_drawing_sheet',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-write',
    licenseCode: 'footing-drawing',
    description: 'Tự động tạo Sheet bản vẽ chi tiết móng, mặt bằng định vị móng và các mặt cắt 1-1, 2-2 qua đài móng.',
    inputs: [
      { name: 'footing_ids', type: 'int[]', required: true, desc: 'Danh sách ElementId các đài móng' },
      { name: 'sheet_number', type: 'string', required: false, desc: 'Mã số bản vẽ (ví dụ: "KC-101")' },
      { name: 'sheet_name', type: 'string', required: false, desc: 'Tên bản vẽ (ví dụ: "CHI TIẾT MÓNG ĐƠN M1-M8")' },
      { name: 'scale', type: 'int', required: false, desc: 'Tỷ lệ bản vẽ (ví dụ: 25, 50)' }
    ],
    outputs: {
      success: true,
      sheet_id: 701001,
      section_view_ids: [701010, 701011],
      message: 'Đã tạo Sheet chi tiết móng thành công.'
    },
    errorHandling: 'Báo lỗi nếu không xác định được mặt phẳng cắt hợp lệ của các đài móng đã chọn.'
  },
  {
    id: 'create_rebar_schedule',
    name: 'create_rebar_schedule',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Tạo bảng thống kê cốt thép chuẩn kèm hình dáng thanh thép uốn (Rebar Shape), phân loại theo đường kính và cấu kiện.',
    inputs: [
      { name: 'schedule_name', type: 'string', required: false, desc: 'Tên bảng thống kê (ví dụ: "THỐNG KÊ THÉP DẦM TẦNG 2")' },
      { name: 'filter_by_mark', type: 'string', required: false, desc: 'Lọc theo Mark cấu kiện (ví dụ: "D*")' },
      { name: 'filter_by_level', type: 'string', required: false, desc: 'Lọc theo Level (ví dụ: "Tầng 2")' },
      { name: 'include_shapes', type: 'bool', required: false, desc: 'Hiển thị hình vẽ uốn thanh (true/false)' }
    ],
    outputs: {
      success: true,
      schedule_id: 801500,
      total_weight_kg: 4850.6,
      total_weight_ton: 4.85,
      message: 'Bảng thống kê thép đã được khởi tạo thành công.'
    },
    errorHandling: 'Báo lỗi nếu dự án chưa có cốt thép hoặc tên bảng Schedule bị trùng lặp.'
  },
  {
    id: 'tag_rebar_elements',
    name: 'tag_rebar_elements',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Tự động gắn thẻ Rebar Tag cho tất cả các thanh cốt thép trên View hiện hành, tự căn chỉnh đường dẫn Leader.',
    inputs: [
      { name: 'view_id', type: 'int', required: true, desc: 'ElementId của View cần gắn Tag' },
      { name: 'tag_family_name', type: 'string', required: false, desc: 'Tên Family Tag (ví dụ: "M_Rebar Tag")' },
      { name: 'leader', type: 'bool', required: false, desc: 'Bật đường chỉ dẫn Leader (true/false)' },
      { name: 'orientation', type: 'string', required: false, desc: 'Hướng nhãn: "Horizontal" hoặc "Aligned"' }
    ],
    outputs: {
      success: true,
      tagged_count: 48,
      message: 'Đã gắn 48 nhãn Rebar Tag tự động không bị đè chữ.'
    },
    errorHandling: 'Báo lỗi nếu View là 3D không bị khóa góc nhìn hoặc Tag Family chưa được tải vào dự án.'
  },
  {
    id: 'modify_rebar_parameters',
    name: 'modify_rebar_parameters',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Thay đổi hàng loạt tham số cốt thép (đường kính, bước rải, chiều dài bẻ móc, mác thép CB400-V/CB240-T).',
    inputs: [
      { name: 'rebar_ids', type: 'int[]', required: true, desc: 'Danh sách ElementId các thanh cốt thép cần sửa' },
      { name: 'parameters', type: 'object', required: true, desc: 'Dictionary các cặp Key-Value tham số cần cập nhật' }
    ],
    outputs: {
      success: true,
      modified_count: 120,
      message: 'Đã cập nhật tham số thành công cho 120 thanh thép.'
    },
    errorHandling: 'Báo lỗi nếu tham số là Read-Only hoặc giá trị gán sai kiểu dữ liệu Revit Parameter.'
  },
  {
    id: 'check_rebar_clashes',
    name: 'check_rebar_clashes',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Kiểm tra va chạm hình học và khoảng hở tối thiểu giữa các thanh cốt thép, nút giao cột dầm hoặc với lỗ mở.',
    inputs: [
      { name: 'rebar_ids', type: 'int[]', required: false, desc: 'Danh sách ElementId thanh thép cần kiểm tra (mặc định toàn bộ)' },
      { name: 'tolerance_mm', type: 'double', required: false, desc: 'Dung sai va chạm (mm, mặc định 2.0)' }
    ],
    outputs: {
      success: true,
      clash_count: 0,
      clash_pairs: [],
      min_clearance_found_mm: 28.5,
      message: 'Không phát hiện va chạm vượt ngưỡng cho phép.'
    },
    errorHandling: 'Trả về danh sách rỗng nếu không tìm thấy va chạm; trả về danh sách vị trí xung đột nếu có.'
  },
  {
    id: 'isolate_continuous_beam_axis',
    name: 'isolate_continuous_beam_axis',
    category: 'rebar_structural',
    categoryName: 'Vẽ thép & Bản vẽ kết cấu',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Tự động tìm kiếm, lọc và sắp xếp tuần tự các đoạn dầm thuộc cùng một trục kết cấu liên tục từ gối 1 đến gối N.',
    inputs: [
      { name: 'grid_name', type: 'string', required: true, desc: 'Tên trục kết cấu (ví dụ: "Trục 3", "Grid C")' },
      { name: 'level_name', type: 'string', required: false, desc: 'Tên tầng cần lọc (ví dụ: "Tầng 2")' }
    ],
    outputs: {
      success: true,
      axis_name: 'Trục 3',
      ordered_beam_ids: [10231, 10232, 10233, 10234],
      total_span_count: 4,
      total_length_m: 28.5
    },
    errorHandling: 'Báo lỗi nếu trục không tồn tại hoặc không tìm thấy cấu kiện dầm nào nằm dọc theo trục.'
  },

  // Group 2: Đọc mô hình & Chọn đối tượng (5 tools)
  {
    id: 'get_selected_elements',
    name: 'get_selected_elements',
    category: 'model_selection',
    categoryName: 'Đọc mô hình & Chọn đối tượng',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Lấy danh sách ID, Category, Name và Type của các phần tử đang được người dùng chọn trong cửa sổ Revit hiện hành.',
    inputs: [],
    outputs: {
      count: 4,
      elements: [
        { id: 10231, category: 'Structural Framing', name: 'D1', type: '300x600mm' },
        { id: 10232, category: 'Structural Framing', name: 'D2', type: '300x600mm' },
        { id: 10233, category: 'Structural Framing', name: 'D3', type: '300x600mm' },
        { id: 10234, category: 'Structural Framing', name: 'D4', type: '300x600mm' }
      ]
    },
    errorHandling: 'Trả về mảng rỗng nếu người dùng chưa chọn phần tử nào trên màn hình Revit.'
  },
  {
    id: 'select_elements_by_ids',
    name: 'select_elements_by_ids',
    category: 'model_selection',
    categoryName: 'Đọc mô hình & Chọn đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Đánh dấu chọn (highlight selection) các phần tử trong mô hình Revit theo danh sách ElementId.',
    inputs: [
      { name: 'element_ids', type: 'int[]', required: true, desc: 'Mảng ElementId cần highlight' }
    ],
    outputs: {
      success: true,
      selected_count: 4,
      message: 'Đã chọn 4 phần tử trong Document hiện hành.'
    },
    errorHandling: 'Báo lỗi nếu danh sách ID không hợp lệ hoặc các phần tử không tồn tại trong Document.'
  },
  {
    id: 'query_elements_by_category',
    name: 'query_elements_by_category',
    category: 'model_selection',
    categoryName: 'Đọc mô hình & Chọn đối tượng',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Truy vấn các phần tử trong mô hình theo Category (Cột, Dầm, Sàn, Móng...) kèm bộ lọc tầng hoặc Mark.',
    inputs: [
      { name: 'category', type: 'string', required: true, desc: 'Tên Category (ví dụ: "Structural Columns", "Structural Framing")' },
      { name: 'level_name', type: 'string', required: false, desc: 'Lọc theo tên Level (ví dụ: "Tầng 1")' },
      { name: 'mark_filter', type: 'string', required: false, desc: 'Lọc theo giá trị tham số Mark (ví dụ: "C7")' },
      { name: 'limit', type: 'int', required: false, desc: 'Giới hạn số lượng kết quả trả về' }
    ],
    outputs: {
      count: 16,
      elements: [
        { id: 104501, name: 'C7', mark: 'C7', level: 'Tầng 1' },
        { id: 104502, name: 'C7', mark: 'C7', level: 'Tầng 1' }
      ]
    },
    errorHandling: 'Báo lỗi nếu tên Category không tồn tại trong Autodesk Revit BuiltInCategory enum.'
  },
  {
    id: 'get_element_parameters',
    name: 'get_element_parameters',
    category: 'model_selection',
    categoryName: 'Đọc mô hình & Chọn đối tượng',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Đọc toàn bộ tham số Built-in, Shared Parameter và Project Parameter của một phần tử Revit xác định.',
    inputs: [
      { name: 'element_id', type: 'int', required: true, desc: 'ElementId của phần tử cần đọc tham số' }
    ],
    outputs: {
      element_id: 104501,
      parameters: {
        'Mark': { value: 'C7', type: 'String', is_readonly: false },
        'b': { value: 500, type: 'Length', is_readonly: false },
        'h': { value: 500, type: 'Length', is_readonly: false },
        'Structural Material': { value: 'Concrete - B25', type: 'MaterialId', is_readonly: false }
      }
    },
    errorHandling: 'Báo lỗi nếu ElementId không tồn tại trong Document.'
  },
  {
    id: 'get_element_geometry_bbox',
    name: 'get_element_geometry_bbox',
    category: 'model_selection',
    categoryName: 'Đọc mô hình & Chọn đối tượng',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Lấy tọa độ BoundingBox 3D (Min, Max), tâm đối tượng và thể tích hình học của phần tử Revit.',
    inputs: [
      { name: 'element_id', type: 'int', required: true, desc: 'ElementId của phần tử cần tính toán hình học' }
    ],
    outputs: {
      element_id: 104501,
      bbox_min: [-2.5, 10.0, 0.0],
      bbox_max: [-2.0, 10.5, 3.6],
      center: [-2.25, 10.25, 1.8],
      volume_m3: 0.9
    },
    errorHandling: 'Báo lỗi nếu phần tử không chứa hình học 3D (ví dụ: View, Sheet, Material).'
  },

  // Group 3: Xử lý dữ liệu Excel (4 tools)
  {
    id: 'read_rebar_excel_table',
    name: 'read_rebar_excel_table',
    category: 'excel_processing',
    categoryName: 'Xử lý dữ liệu Excel',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Đọc và phân tích cấu trúc bảng thép từ file Excel (Mark dầm/cột, vị trí, đường kính, số thanh, lớp bảo vệ).',
    inputs: [
      { name: 'file_path', type: 'string', required: true, desc: 'Đường dẫn tuyệt đối hoặc tương đối tới file .xlsx/.xls' },
      { name: 'sheet_name', type: 'string', required: false, desc: 'Tên trang tính cần đọc (mặc định sheet đầu tiên)' },
      { name: 'header_row', type: 'int', required: false, desc: 'Vị trí dòng tiêu đề cột (mặc định dòng 1)' }
    ],
    outputs: {
      success: true,
      row_count: 24,
      columns_mapped: ['Mark', 'Span', 'TopBars', 'BottomBars', 'Stirrups'],
      data: [
        { Mark: 'D1', TopBars: '3d22+2d20', BottomBars: '3d20+2d20', Stirrups: 'd8a100/150' }
      ]
    },
    errorHandling: 'Mở file ở chế độ Read-Only FileShare để tránh nghẽn khi người dùng đang mở Excel. Báo lỗi nếu file hỏng hoặc sai cấu trúc.'
  },
  {
    id: 'export_rebar_to_excel',
    name: 'export_rebar_to_excel',
    category: 'excel_processing',
    categoryName: 'Xử lý dữ liệu Excel',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Xuất bảng thống kê chi tiết cốt thép từ mô hình Revit ra file Excel theo mẫu định dạng chuẩn dự án.',
    inputs: [
      { name: 'file_path', type: 'string', required: true, desc: 'Đường dẫn file đích để ghi dữ liệu Excel' },
      { name: 'filter_by_level', type: 'string', required: false, desc: 'Lọc thép theo tầng' }
    ],
    outputs: {
      success: true,
      exported_path: 'C:\\Projects\\Export\\BangThongKeThep.xlsx',
      total_items: 120,
      total_weight_kg: 8450.0
    },
    errorHandling: 'Báo lỗi nếu thư mục đích không có quyền ghi (Permission Denied) hoặc file đang bị khóa độc quyền.'
  },
  {
    id: 'sync_parameters_from_excel',
    name: 'sync_parameters_from_excel',
    category: 'excel_processing',
    categoryName: 'Xử lý dữ liệu Excel',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Cập nhật hàng loạt tham số vào các phần tử Revit từ file Excel theo mã khóa ElementId hoặc Mark.',
    inputs: [
      { name: 'file_path', type: 'string', required: true, desc: 'Đường dẫn file Excel nguồn' },
      { name: 'key_column', type: 'string', required: true, desc: 'Tên cột khóa liên kết (ví dụ: "ElementId" hoặc "Mark")' },
      { name: 'update_columns', type: 'string[]', required: true, desc: 'Danh sách các cột tham số cần đồng bộ vào Revit' }
    ],
    outputs: {
      success: true,
      updated_count: 85,
      failed_count: 0,
      errors: []
    },
    errorHandling: 'Báo cáo chi tiết danh sách các phần tử không thể cập nhật do tham số Read-Only hoặc kiểu dữ liệu không tương thích.'
  },
  {
    id: 'export_model_quantities_excel',
    name: 'export_model_quantities_excel',
    category: 'excel_processing',
    categoryName: 'Xử lý dữ liệu Excel',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Trích xuất khối lượng bê tông, diện tích ván khuôn và khối lượng thép toàn dự án ra file Excel.',
    inputs: [
      { name: 'file_path', type: 'string', required: true, desc: 'Đường dẫn file Excel xuất khối lượng' },
      { name: 'group_by', type: 'string', required: false, desc: 'Nhóm theo "Level", "Category" hoặc "Material"' }
    ],
    outputs: {
      success: true,
      file_path: 'C:\\Projects\\Export\\KhoiLuongDuAn.xlsx',
      summary: { concrete_m3: 1250.4, rebar_ton: 142.8, formwork_m2: 4890.0 }
    },
    errorHandling: 'Bỏ qua các phần tử không có thuộc tính khối lượng hoặc chưa hoàn tất tính toán hình học.'
  },

  // Group 4: Dịch bản vẽ Việt / Trung (2 tools)
  {
    id: 'translate_sheet_annotations',
    name: 'translate_sheet_annotations',
    category: 'translation',
    categoryName: 'Dịch bản vẽ Việt / Trung',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Dịch toàn bộ Text Note, Dimension override text và Annotation trên Sheet giữa Tiếng Việt và Tiếng Trung.',
    inputs: [
      { name: 'sheet_id', type: 'int', required: true, desc: 'ElementId của Sheet cần dịch' },
      { name: 'source_lang', type: 'string', required: true, desc: 'Ngôn ngữ nguồn: "vi" hoặc "zh"' },
      { name: 'target_lang', type: 'string', required: true, desc: 'Ngôn ngữ đích: "zh" hoặc "vi"' },
      { name: 'preserve_terms', type: 'bool', required: false, desc: 'Giữ nguyên các thuật ngữ kỹ thuật chuyên ngành' }
    ],
    outputs: {
      success: true,
      sheet_id: 601001,
      translated_count: 38,
      message: 'Đã dịch 38 ghi chú bản vẽ sang Tiếng Trung.'
    },
    errorHandling: 'Báo lỗi nếu Sheet không tồn tại hoặc ngôn ngữ chỉ định không nằm trong bộ từ điển hỗ trợ.'
  },
  {
    id: 'batch_translate_parameters',
    name: 'batch_translate_parameters',
    category: 'translation',
    categoryName: 'Dịch bản vẽ Việt / Trung',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Dịch giá trị các tham số mô tả (Comments, Description, Family Name) hàng loạt giữa Tiếng Việt và Tiếng Trung.',
    inputs: [
      { name: 'element_ids', type: 'int[]', required: true, desc: 'Mảng ElementId các đối tượng' },
      { name: 'parameter_names', type: 'string[]', required: true, desc: 'Mảng tên các tham số cần dịch' },
      { name: 'source_lang', type: 'string', required: true, desc: 'Ngôn ngữ nguồn ("vi" / "zh")' },
      { name: 'target_lang', type: 'string', required: true, desc: 'Ngôn ngữ đích ("zh" / "vi")' }
    ],
    outputs: {
      success: true,
      modified_elements: 64,
      total_translations: 128
    },
    errorHandling: 'Tự động bỏ qua các tham số Read-Only và ghi log cảnh báo.'
  },

  // Group 5: Tạo & Thao tác đối tượng (11 tools)
  {
    id: 'create_structural_column',
    name: 'create_structural_column',
    category: 'element_manipulation',
    categoryName: 'Tạo & Thao tác đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Tạo cột kết cấu mới theo tọa độ điểm X, Y, Level đáy, Level đỉnh và Family Type.',
    inputs: [
      { name: 'family_name', type: 'string', required: true, desc: 'Tên Family cột (ví dụ: "M_Concrete-Rectangular-Column")' },
      { name: 'type_name', type: 'string', required: true, desc: 'Tên Type (ví dụ: "500 x 500mm")' },
      { name: 'location', type: 'double[]', required: true, desc: 'Tọa độ vị trí [X, Y, Z] trong không gian mô hình' },
      { name: 'base_level', type: 'string', required: true, desc: 'Tên Level đáy cột' },
      { name: 'top_level', type: 'string', required: true, desc: 'Tên Level đỉnh cột' }
    ],
    outputs: { success: true, column_id: 108920, message: 'Đã tạo cột kết cấu mới.' },
    errorHandling: 'Báo lỗi nếu Family Type không tồn tại hoặc Level không hợp lệ.'
  },
  {
    id: 'create_structural_beam',
    name: 'create_structural_beam',
    category: 'element_manipulation',
    categoryName: 'Tạo & Thao tác đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Tạo dầm kết cấu mới nối giữa 2 điểm tọa độ 3D theo Type và Level xác định.',
    inputs: [
      { name: 'family_name', type: 'string', required: true, desc: 'Tên Family dầm (ví dụ: "M_Concrete-Rectangular Beam")' },
      { name: 'type_name', type: 'string', required: true, desc: 'Tên Type dầm (ví dụ: "300 x 600mm")' },
      { name: 'start_point', type: 'double[]', required: true, desc: 'Tọa độ điểm đầu [X, Y, Z]' },
      { name: 'end_point', type: 'double[]', required: true, desc: 'Tọa độ điểm cuối [X, Y, Z]' },
      { name: 'level_name', type: 'string', required: true, desc: 'Tên Level đặt dầm' }
    ],
    outputs: { success: true, beam_id: 204910, length_m: 6.5 },
    errorHandling: 'Báo lỗi nếu điểm đầu và cuối trùng nhau hoặc khoảng cách quá ngắn (< 10mm).'
  },
  {
    id: 'create_structural_footing',
    name: 'create_structural_footing',
    category: 'element_manipulation',
    categoryName: 'Tạo & Thao tác đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Tạo móng đơn / đài móng tại vị trí tọa độ theo Family Type và Level.',
    inputs: [
      { name: 'type_name', type: 'string', required: true, desc: 'Tên Type móng' },
      { name: 'location', type: 'double[]', required: true, desc: 'Tọa độ tâm móng [X, Y, Z]' },
      { name: 'level_name', type: 'string', required: true, desc: 'Tên Level đặt móng' }
    ],
    outputs: { success: true, footing_id: 304120 },
    errorHandling: 'Báo lỗi nếu Type móng không thuộc Structural Foundation.'
  },
  {
    id: 'create_structural_wall',
    name: 'create_structural_wall',
    category: 'element_manipulation',
    categoryName: 'Tạo & Thao tác đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Tạo tường hoặc vách bê tông kết cấu theo đường thẳng tọa độ, chiều cao và Type.',
    inputs: [
      { name: 'wall_type_name', type: 'string', required: true, desc: 'Tên Wall Type kết cấu' },
      { name: 'start_point', type: 'double[]', required: true, desc: 'Điểm đầu [X, Y, Z]' },
      { name: 'end_point', type: 'double[]', required: true, desc: 'Điểm cuối [X, Y, Z]' },
      { name: 'base_level', type: 'string', required: true, desc: 'Level chân vách' },
      { name: 'height', type: 'double', required: true, desc: 'Chiều cao vách (m)' }
    ],
    outputs: { success: true, wall_id: 402310 },
    errorHandling: 'Báo lỗi nếu Type không phải Structural Wall.'
  },
  {
    id: 'create_structural_floor',
    name: 'create_structural_floor',
    category: 'element_manipulation',
    categoryName: 'Tạo & Thao tác đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Tạo sàn bê tông kết cấu theo chuỗi đường bao CurveLoop khép kín và Level.',
    inputs: [
      { name: 'floor_type_name', type: 'string', required: true, desc: 'Tên Floor Type' },
      { name: 'boundary_points', type: 'double[][]', required: true, desc: 'Mảng các điểm tọa độ tạo thành đường bao khép kín' },
      { name: 'level_name', type: 'string', required: true, desc: 'Level đặt sàn' }
    ],
    outputs: { success: true, floor_id: 504100, area_m2: 240.5 },
    errorHandling: 'Báo lỗi nếu đường bao không khép kín hoặc có các đoạn thẳng tự cắt nhau.'
  },
  {
    id: 'modify_element_parameter',
    name: 'modify_element_parameter',
    category: 'element_manipulation',
    categoryName: 'Tạo & Thao tác đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Gán giá trị mới cho một tham số xác định của phần tử Revit.',
    inputs: [
      { name: 'element_id', type: 'int', required: true, desc: 'ElementId cần sửa' },
      { name: 'parameter_name', type: 'string', required: true, desc: 'Tên tham số cần gán giá trị' },
      { name: 'value', type: 'any', required: true, desc: 'Giá trị mới' }
    ],
    outputs: { success: true, message: 'Tham số đã được cập nhật thành công.' },
    errorHandling: 'Báo lỗi nếu tham số Read-Only hoặc sai kiểu dữ liệu Revit.'
  },
  {
    id: 'batch_modify_parameters',
    name: 'batch_modify_parameters',
    category: 'element_manipulation',
    categoryName: 'Tạo & Thao tác đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Gán giá trị tham số hàng loạt cho danh sách nhiều phần tử cùng lúc.',
    inputs: [
      { name: 'element_ids', type: 'int[]', required: true, desc: 'Danh sách ElementId' },
      { name: 'parameter_name', type: 'string', required: true, desc: 'Tên tham số' },
      { name: 'value', type: 'any', required: true, desc: 'Giá trị cần gán' }
    ],
    outputs: { success: true, updated_count: 32 },
    errorHandling: 'Báo cáo chi tiết danh sách phần tử thất bại nếu có.'
  },
  {
    id: 'delete_elements',
    name: 'delete_elements',
    category: 'element_manipulation',
    categoryName: 'Tạo & Thao tác đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Xóa danh sách phần tử khỏi mô hình Revit theo ElementId trong transaction an toàn.',
    inputs: [
      { name: 'element_ids', type: 'int[]', required: true, desc: 'Danh sách ElementId cần xóa' }
    ],
    outputs: { success: true, deleted_count: 5 },
    errorHandling: 'Báo lỗi nếu phần tử đang bị ghim (Pinned) hoặc bị khóa bởi Worksharing.'
  },
  {
    id: 'copy_elements',
    name: 'copy_elements',
    category: 'element_manipulation',
    categoryName: 'Tạo & Thao tác đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Sao chép các phần tử sang Level khác hoặc theo vector tịnh tiến XYZ.',
    inputs: [
      { name: 'element_ids', type: 'int[]', required: true, desc: 'Danh sách ElementId gốc' },
      { name: 'translation_vector', type: 'double[]', required: true, desc: 'Vector tịnh tiến [dX, dY, dZ]' },
      { name: 'target_level_name', type: 'string', required: false, desc: 'Level đích' }
    ],
    outputs: { success: true, new_element_ids: [60101, 60102, 60103] },
    errorHandling: 'Báo lỗi nếu Level đích không hợp lệ.'
  },
  {
    id: 'move_elements',
    name: 'move_elements',
    category: 'element_manipulation',
    categoryName: 'Tạo & Thao tác đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Di chuyển phần tử theo vector không gian XYZ.',
    inputs: [
      { name: 'element_ids', type: 'int[]', required: true, desc: 'Danh sách ElementId cần di chuyển' },
      { name: 'translation_vector', type: 'double[]', required: true, desc: 'Vector di chuyển [dX, dY, dZ]' }
    ],
    outputs: { success: true, moved_count: 4 },
    errorHandling: 'Báo lỗi nếu phần tử có ràng buộc hình học (Constrained) không thể di chuyển.'
  },
  {
    id: 'rotate_element',
    name: 'rotate_element',
    category: 'element_manipulation',
    categoryName: 'Tạo & Thao tác đối tượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Xoay phần tử quanh trục thẳng đứng Z một góc xác định (độ).',
    inputs: [
      { name: 'element_id', type: 'int', required: true, desc: 'ElementId cần xoay' },
      { name: 'angle_degrees', type: 'double', required: true, desc: 'Góc xoay (độ, ví dụ: 90.0, 45.0)' },
      { name: 'center_point', type: 'double[]', required: false, desc: 'Tọa độ tâm xoay [X, Y, Z]' }
    ],
    outputs: { success: true, message: 'Đã xoay đối tượng thành công.' },
    errorHandling: 'Báo lỗi nếu phần tử đang bị Pinned.'
  },

  // Group 6: Tag & Thống kê khối lượng (5 tools)
  {
    id: 'tag_elements_by_category',
    name: 'tag_elements_by_category',
    category: 'tag_quantities',
    categoryName: 'Tag & Thống kê khối lượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Tự động gắn nhãn (Tag) cho tất cả các đối tượng thuộc Category trên một View xác định.',
    inputs: [
      { name: 'view_id', type: 'int', required: true, desc: 'ElementId của View' },
      { name: 'category_name', type: 'string', required: true, desc: 'Tên Category cần gắn Tag' },
      { name: 'tag_family_name', type: 'string', required: false, desc: 'Tên Family Tag' }
    ],
    outputs: { success: true, tagged_count: 24 },
    errorHandling: 'Báo lỗi nếu View không hỗ trợ Annotation hoặc Tag Family chưa được tải.'
  },
  {
    id: 'create_material_takeoff_schedule',
    name: 'create_material_takeoff_schedule',
    category: 'tag_quantities',
    categoryName: 'Tag & Thống kê khối lượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Tạo bảng thống kê bóc tách vật liệu (Bê tông, Cốt thép, Ván khuôn) theo tầng và cấu kiện.',
    inputs: [
      { name: 'category_name', type: 'string', required: true, desc: 'Category cần bóc tách' },
      { name: 'schedule_name', type: 'string', required: false, desc: 'Tên bảng Schedule' },
      { name: 'fields', type: 'string[]', required: true, desc: 'Danh sách các trường thông tin' }
    ],
    outputs: { success: true, schedule_id: 802100 },
    errorHandling: 'Báo lỗi nếu tên bảng Schedule bị trùng lặp.'
  },
  {
    id: 'calculate_concrete_volume',
    name: 'calculate_concrete_volume',
    category: 'tag_quantities',
    categoryName: 'Tag & Thống kê khối lượng',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Tính toán tổng thể tích bê tông (m³) theo cấu kiện, phân khu thi công hoặc tầng.',
    inputs: [
      { name: 'category_filter', type: 'string', required: false, desc: 'Lọc Category' },
      { name: 'level_name', type: 'string', required: false, desc: 'Lọc Level' }
    ],
    outputs: { total_volume_m3: 345.8, breakdown_by_type: { '500x500': 120.0, '300x600': 225.8 } },
    errorHandling: 'Bỏ qua các đối tượng rỗng không có khối lượng hình học.'
  },
  {
    id: 'calculate_rebar_weight',
    name: 'calculate_rebar_weight',
    category: 'tag_quantities',
    categoryName: 'Tag & Thống kê khối lượng',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Tính toán tổng trọng lượng cốt thép (kg và tấn) phân tách chi tiết theo từng đường kính (Φ10, Φ12, Φ14, Φ20, Φ22...).',
    inputs: [
      { name: 'level_name', type: 'string', required: false, desc: 'Lọc theo tầng' },
      { name: 'rebar_ids', type: 'int[]', required: false, desc: 'Danh sách ID thép cụ thể' }
    ],
    outputs: {
      total_weight_kg: 18450.5,
      total_weight_ton: 18.45,
      by_diameter: { 'd8': 1250.0, 'd12': 3400.5, 'd20': 8200.0, 'd22': 5600.0 }
    },
    errorHandling: 'Trả về 0 nếu chưa có cốt thép trong phạm vi truy vấn.'
  },
  {
    id: 'update_schedule_views',
    name: 'update_schedule_views',
    category: 'tag_quantities',
    categoryName: 'Tag & Thống kê khối lượng',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Làm mới và cập nhật lại toàn bộ dữ liệu bảng thống kê hiển thị trên các Sheet.',
    inputs: [
      { name: 'schedule_ids', type: 'int[]', required: false, desc: 'Danh sách ID Schedule cần refresh' }
    ],
    outputs: { success: true, updated_schedules: 6 },
    errorHandling: 'Báo lỗi nếu Schedule đang bị khóa bởi tiến trình khác.'
  },

  // Group 7: Lệnh điều khiển Ribbon (15 tools)
  {
    id: 'trigger_column_rebar_command',
    name: 'trigger_column_rebar_command',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-write',
    licenseCode: 'column-rebar',
    description: 'Kích hoạt lệnh vẽ cốt thép cột (CR) từ Ribbon add-in trên tab LDL-STRUCTURAL.',
    inputs: [{ name: 'selection_mode', type: 'string', required: false, desc: 'Chế độ chọn: "Interactive" hoặc "AllInLevel"' }],
    outputs: { success: true, command_status: 'Executed' },
    errorHandling: 'Báo lỗi nếu chưa mở Document hoặc thiếu bản quyền `column-rebar`.'
  },
  {
    id: 'trigger_beam_rebar_command',
    name: 'trigger_beam_rebar_command',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-write',
    licenseCode: 'beam-rebar',
    description: 'Kích hoạt lệnh vẽ cốt thép dầm (BR) từ Ribbon add-in.',
    inputs: [{ name: 'selection_mode', type: 'string', required: false, desc: 'Chế độ chọn' }],
    outputs: { success: true, command_status: 'Executed' },
    errorHandling: 'Báo lỗi nếu thiếu license `beam-rebar`.'
  },
  {
    id: 'trigger_footing_rebar_command',
    name: 'trigger_footing_rebar_command',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-write',
    licenseCode: 'footing-rebar',
    description: 'Kích hoạt lệnh vẽ cốt thép móng (FR) từ Ribbon add-in.',
    inputs: [{ name: 'selection_mode', type: 'string', required: false, desc: 'Chế độ chọn' }],
    outputs: { success: true, command_status: 'Executed' },
    errorHandling: 'Báo lỗi nếu thiếu license `footing-rebar`.'
  },
  {
    id: 'trigger_wall_rebar_command',
    name: 'trigger_wall_rebar_command',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-write',
    licenseCode: 'wall-rebar',
    description: 'Kích hoạt lệnh vẽ cốt thép vách (WR) từ Ribbon add-in.',
    inputs: [{ name: 'selection_mode', type: 'string', required: false, desc: 'Chế độ chọn' }],
    outputs: { success: true, command_status: 'Executed' },
    errorHandling: 'Báo lỗi nếu thiếu license `wall-rebar`.'
  },
  {
    id: 'trigger_beam_drawing_command',
    name: 'trigger_beam_drawing_command',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-write',
    licenseCode: 'beam-drawing',
    description: 'Kích hoạt lệnh tạo bản vẽ dầm liên tục (BD) từ Ribbon add-in.',
    inputs: [{ name: 'beam_ids', type: 'int[]', required: false, desc: 'Danh sách ID dầm' }],
    outputs: { success: true, command_status: 'Executed' },
    errorHandling: 'Báo lỗi nếu thiếu license `beam-drawing`.'
  },
  {
    id: 'trigger_footing_drawing_command',
    name: 'trigger_footing_drawing_command',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-write',
    licenseCode: 'footing-drawing',
    description: 'Kích hoạt lệnh tạo bản vẽ móng (FD) từ Ribbon add-in.',
    inputs: [{ name: 'footing_ids', type: 'int[]', required: false, desc: 'Danh sách ID móng' }],
    outputs: { success: true, command_status: 'Executed' },
    errorHandling: 'Báo lỗi nếu thiếu license `footing-drawing`.'
  },
  {
    id: 'trigger_model_from_cad_command',
    name: 'trigger_model_from_cad_command',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-write',
    licenseCode: 'model-from-cad',
    description: 'Kích hoạt công cụ dựng mô hình từ CAD (MC) — Yêu cầu AutoCAD Full 2016+.',
    inputs: [{ name: 'cad_path', type: 'string', required: false, desc: 'Đường dẫn file DWG' }],
    outputs: { success: true, command_status: 'Executed' },
    errorHandling: 'Báo lỗi nếu máy tính chưa cài AutoCAD Full 2016+ hoặc thiếu license `model-from-cad`.'
  },
  {
    id: 'trigger_dwg_export_command',
    name: 'trigger_dwg_export_command',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-write',
    licenseCode: 'dwg-export',
    description: 'Kích hoạt công cụ xuất DWG hàng loạt (DE) chuẩn layer công ty — Yêu cầu AutoCAD Full 2016+.',
    inputs: [{ name: 'sheet_ids', type: 'int[]', required: false, desc: 'Danh sách ID Sheet cần xuất' }],
    outputs: { success: true, command_status: 'Executed' },
    errorHandling: 'Báo lỗi nếu thiếu AutoCAD 2016+ hoặc thiếu license `dwg-export`.'
  },
  {
    id: 'trigger_license_dialog',
    name: 'trigger_license_dialog',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-read',
    licenseCode: 'free',
    description: 'Mở hộp thoại đăng nhập Google OAuth PKCE và kích hoạt bản quyền trên màn hình Revit.',
    inputs: [],
    outputs: { success: true, dialog_opened: true },
    errorHandling: 'Báo lỗi nếu giao diện Revit đang bận hoặc đang trong lệnh tương tác.'
  },
  {
    id: 'trigger_settings_dialog',
    name: 'trigger_settings_dialog',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-read',
    licenseCode: 'utility-tools',
    description: 'Mở hộp thoại cấu hình hệ thống & thiết lập preset Add-in.',
    inputs: [],
    outputs: { success: true, dialog_opened: true },
    errorHandling: 'Báo lỗi nếu giao diện Revit đang bận.'
  },
  {
    id: 'trigger_rebar_schedule_command',
    name: 'trigger_rebar_schedule_command',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-write',
    licenseCode: 'utility-tools',
    description: 'Kích hoạt lệnh tạo bảng thống kê cốt thép tự động (RS).',
    inputs: [],
    outputs: { success: true, command_status: 'Executed' },
    errorHandling: 'Báo lỗi nếu Document rỗng.'
  },
  {
    id: 'trigger_point_cloud_command',
    name: 'trigger_point_cloud_command',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-write',
    licenseCode: 'point-cloud',
    description: 'Kích hoạt công cụ xử lý đám mây điểm Scan to BIM.',
    inputs: [],
    outputs: { success: true, command_status: 'Executed' },
    errorHandling: 'Báo lỗi nếu thiếu license `point-cloud`.'
  },
  {
    id: 'trigger_chat_ai_window',
    name: 'trigger_chat_ai_window',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-read',
    licenseCode: 'chat-ai',
    description: 'Mở cửa sổ bảng điều khiển Chat AI tích hợp trong Revit (AI).',
    inputs: [],
    outputs: { success: true, window_visible: true },
    errorHandling: 'Báo lỗi nếu thiếu license `chat-ai`.'
  },
  {
    id: 'trigger_mcp_server_restart',
    name: 'trigger_mcp_server_restart',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-write',
    licenseCode: 'mcp-read',
    description: 'Khởi động lại dịch vụ MCP Server nội bộ trên cổng loopback 8765.',
    inputs: [],
    outputs: { success: true, port: 8765, status: 'Running' },
    errorHandling: 'Báo lỗi nếu không thể bind lại cổng loopback do cổng bị chiếm dụng.'
  },
  {
    id: 'get_ribbon_status',
    name: 'get_ribbon_status',
    category: 'ribbon_commands',
    categoryName: 'Lệnh điều khiển Ribbon',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Kiểm tra trạng thái sẵn sàng của các panel và lệnh trên tab LDL-STRUCTURAL.',
    inputs: [],
    outputs: {
      active_tab: 'LDL-STRUCTURAL',
      available_commands: ['CR', 'BR', 'FR', 'WR', 'SR', 'BD', 'FD', 'CD', 'WD', 'RS', 'MC', 'DE', 'LM', 'LC', 'AI', 'LA', 'ST', 'MS'],
      license_tier: 'Rebar + AI Suite'
    },
    errorHandling: 'Trả về trạng thái hiện tại của UI Ribbon.'
  },

  // Group 8: Thực thi C# động an toàn & Tiện ích khác (3 tools)
  {
    id: 'send_code_to_revit',
    name: 'send_code_to_revit',
    category: 'dynamic_csharp_utility',
    categoryName: 'C# Động & Tiện ích khác',
    permission: 'mcp-write',
    licenseCode: 'mcp-write',
    description: 'Biên dịch Roslyn và thực thi đoạn mã C# động an toàn trong transaction Revit, kèm sandbox kiểm soát lỗi & hộp thoại xác nhận an toàn.',
    inputs: [
      { name: 'csharp_code', type: 'string', required: true, desc: 'Mã nguồn C# chứa class thực thi IExternalCommand hoặc logic Revit API' },
      { name: 'transaction_name', type: 'string', required: false, desc: 'Tên transaction định danh trong Revit Undo history' },
      { name: 'dry_run', type: 'bool', required: false, desc: 'Chế độ chạy thử không commit dữ liệu (true/false)' }
    ],
    outputs: {
      success: true,
      execution_time_ms: 45.2,
      result_summary: 'Đã thực thi 12 thao tác Revit API an toàn.',
      compiler_errors: []
    },
    errorHandling: 'Roslyn compiler kiểm tra cú pháp trước khi chạy. Nếu phát hiện ngoại lệ runtime hoặc lỗi cú pháp, tự động Rollback transaction ngay lập tức và trả về compiler_errors.'
  },
  {
    id: 'get_revit_application_info',
    name: 'get_revit_application_info',
    category: 'dynamic_csharp_utility',
    categoryName: 'C# Động & Tiện ích khác',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Lấy thông tin phiên bản Revit (2022–2027), active document, project info và tài khoản người dùng đang đăng nhập.',
    inputs: [],
    outputs: {
      revit_version: 'Autodesk Revit 2025 (Build 2025.1.0)',
      build_number: '20240412_1500',
      document_title: 'DuAnChungCu_ThapA_KetCau.rvt',
      document_path: 'C:\\Projects\\DuAnChungCu_ThapA_KetCau.rvt',
      is_workshared: true,
      active_view: 'Mặt bằng kết cấu Tầng 2'
    },
    errorHandling: 'Trả về trạng thái "no_active_document" nếu người dùng chưa mở dự án nào.'
  },
  {
    id: 'ping_mcp_server',
    name: 'ping_mcp_server',
    category: 'dynamic_csharp_utility',
    categoryName: 'C# Động & Tiện ích khác',
    permission: 'mcp-read',
    licenseCode: 'mcp-read',
    description: 'Kiểm tra kết nối liveness và đo độ trễ của BIMAutomation MCP Server trên cổng loopback 8765.',
    inputs: [],
    outputs: {
      status: 'ok',
      protocol_version: '2025-11-25',
      server_name: 'BIMAutomation-MCP-Server',
      timestamp: '2026-08-22T07:40:00Z',
      latency_ms: 1.2
    },
    errorHandling: 'Báo lỗi timeout nếu Add-in trong Revit chưa khởi động hoặc port 8765 bị ngắt kết nối.'
  }
];

export default function McpToolsHub() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [permissionFilter, setPermissionFilter] = useState('all'); // 'all', 'mcp-read', 'mcp-write'
  const [selectedTool, setSelectedTool] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Filter tools based on search query, category, and permission
  const filteredTools = useMemo(() => {
    return MCP_TOOLS.filter((tool) => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const matchesPermission = 
        permissionFilter === 'all' || 
        (permissionFilter === 'mcp-read' && tool.permission === 'mcp-read') ||
        (permissionFilter === 'mcp-write' && tool.permission === 'mcp-write');

      if (!matchesCategory || !matchesPermission) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inName = tool.name.toLowerCase().includes(q);
      const inDesc = tool.description.toLowerCase().includes(q);
      const inCat = tool.categoryName.toLowerCase().includes(q);
      const inParams = tool.inputs.some(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
      const inLicense = tool.licenseCode ? tool.licenseCode.toLowerCase().includes(q) : false;

      return inName || inDesc || inCat || inParams || inLicense;
    });
  }, [searchQuery, selectedCategory, permissionFilter]);

  const handleCopyToolName = (toolName, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(toolName);
    setCopiedId(toolName);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySchema = (tool) => {
    const schemaObj = {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.inputs.reduce((acc, inp) => {
          acc[inp.name] = {
            type: inp.type,
            description: inp.desc
          };
          return acc;
        }, {}),
        required: tool.inputs.filter(i => i.required).map(i => i.name)
      }
    };
    navigator.clipboard.writeText(JSON.stringify(schemaObj, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8" id="mcp-tools-hub">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mb-3">
          <Command className="w-3.5 h-3.5" />
          <span>MCP SPEC 2025-11-25 • 57 TOOLS DIRECTORY</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Danh Bạ 57 Công Cụ Chuẩn MCP BIMAutomation
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Tra cứu toàn diện các tool kết nối hai chiều giữa AI Client (Claude Desktop, Cursor, Chat Assistant) và Autodesk Revit. Tự động kiểm tra bản quyền, luồng STA và transaction an toàn.
        </p>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1320] border border-slate-200 dark:border-slate-800 shadow-lg mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tool theo tên, mô tả, tham số (ví dụ: column_rebar, excel, axis, schedule)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono placeholder:font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Permission Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setPermissionFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                permissionFilter === 'all'
                  ? 'bg-slate-900 dark:bg-sky-500 text-white dark:text-slate-950 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tất cả quyền ({MCP_TOOLS.length})
            </button>
            <button
              onClick={() => setPermissionFilter('mcp-write')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                permissionFilter === 'mcp-write'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Quyền Ghi (Write: 44)
            </button>
            <button
              onClick={() => setPermissionFilter('mcp-read')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                permissionFilter === 'mcp-read'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Quyền Đọc (Read: 13)
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                    : 'bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-sky-500'}`} />
                <span>{cat.label}</span>
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? 'bg-slate-950/20 text-slate-950 font-extrabold'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Count Summary Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
        <span>
          Hiển thị <strong className="text-slate-900 dark:text-slate-100 font-bold">{filteredTools.length}</strong> / 57 công cụ
        </span>
        {searchQuery && (
          <span>
            Kết quả khớp cho: "<span className="text-sky-500 font-mono font-semibold">{searchQuery}</span>"
          </span>
        )}
      </div>

      {/* Tools Cards Grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const isWrite = tool.permission === 'mcp-write';
            return (
              <div
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className="group relative p-4 rounded-xl bg-white dark:bg-[#0a1220] border border-slate-200 dark:border-slate-800/90 hover:border-sky-500/80 dark:hover:border-sky-500/60 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors break-all">
                      {tool.name}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isWrite
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                        }`}
                      >
                        {tool.permission}
                      </span>
                    </div>
                  </div>

                  {/* Category Tag */}
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <span>{tool.categoryName}</span>
                    {tool.licenseCode && (
                      <span className="ml-auto font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.2 rounded">
                        {tool.licenseCode}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-3">
                    {tool.description}
                  </p>

                  {/* Parameters Preview */}
                  {tool.inputs.length > 0 && (
                    <div className="mb-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
                      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Tham Số ({tool.inputs.length}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tool.inputs.map((inp) => (
                          <span
                            key={inp.name}
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {inp.name}
                            {inp.required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={(e) => handleCopyToolName(tool.name, e)}
                    className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors p-1"
                    title="Sao chép tên tool"
                  >
                    {copiedId === tool.name ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép tên</span>
                      </>
                    )}
                  </button>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Xem Schema</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 p-6 rounded-2xl bg-slate-50 dark:bg-[#0a1220] border border-slate-200 dark:border-slate-800">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Không tìm thấy công cụ MCP nào khớp với từ khóa
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Thử tìm kiếm với tên lệnh khác (ví dụ: beam, column, rebar, excel, schedule, tag) hoặc đặt lại bộ lọc danh mục.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setPermissionFilter('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Tool Inspection Modal / Drawer */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                    {selectedTool.categoryName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                      selectedTool.permission === 'mcp-write'
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                    }`}
                  >
                    {selectedTool.permission}
                  </span>
                  {selectedTool.licenseCode && (
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      License Code: {selectedTool.licenseCode}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                  {selectedTool.name}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTool(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-5">
              {/* Description */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 dark:text-slate-500 mb-1.5">
                  Mô Tả Chức Năng
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedTool.description}
                </p>
              </div>

              {/* Inputs Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 dark:text-slate-500">
                    Tham Số Đầu Vào (Inputs)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {selectedTool.inputs.length} tham số
                  </span>
                </div>

                {selectedTool.inputs.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50 dark:bg-[#0f192c] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="p-2.5">Tham Số</th>
                          <th className="p-2.5">Kiểu</th>
                          <th className="p-2.5">Bắt Buộc</th>
                          <th className="p-2.5 font-sans">Mô Tả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {selectedTool.inputs.map((inp) => (
                          <tr key={inp.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="p-2.5 font-bold text-sky-600 dark:text-sky-400">{inp.name}</td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400">{inp.type}</td>
                            <td className="p-2.5">
                              {inp.required ? (
                                <span className="text-rose-500 font-bold">Required</span>
                              ) : (
                                <span className="text-slate-400">Optional</span>
                              )}
                            </td>
                            <td className="p-2.5 font-sans text-slate-700 dark:text-slate-300">{inp.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-900 rounded-lg">
                    Không có tham số đầu vào (None).
                  </div>
                )}
              </div>

              {/* Output Structure */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 dark:text-slate-500">
                    Định Dạng Kết Quả Đầu Ra (JSON Output)
                  </h4>
                  <button
                    onClick={() => handleCopySchema(selectedTool)}
                    className="inline-flex items-center gap-1 text-xs font-mono text-sky-500 hover:text-sky-400 transition-colors"
                  >
                    {copiedSchema ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">Đã chép Schema!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép Schema</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-slate-900 text-sky-300 font-mono text-xs overflow-x-auto border border-slate-800">
                  {JSON.stringify(selectedTool.outputs, null, 2)}
                </pre>
              </div>

              {/* Error Handling & Safeguards */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Cơ Chế Bắt Lỗi & Xử Lý An Toàn</span>
                </h4>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  {selectedTool.errorHandling}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={(e) => handleCopyToolName(selectedTool.name, e)}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép tên Tool</span>
              </button>

              <button
                onClick={() => setSelectedTool(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
