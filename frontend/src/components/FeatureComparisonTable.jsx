import React from 'react';
import { Check, HelpCircle, Minus } from 'lucide-react';

const categories = [
  {
    name: '1. Khai triển Kiến trúc & Bản vẽ',
    items: [
      { name: 'Ghi kích thước tự động (Auto Dimension cấu kiện)', starter: true, pro: true, enterprise: true, desc: 'Tự động tạo chuỗi dim cho tường, dầm, cột, cửa theo tiêu chuẩn' },
      { name: 'Đổi tên hàng loạt (Batch Rename Sheet, View, Family)', starter: true, pro: true, enterprise: true, desc: 'Đổi tên tiền tố, hậu tố, số thứ tự với bộ lọc nâng cao' },
      { name: 'Tự động gắn Tag & Khóa vị trí (Auto Tagging)', starter: 'Cơ bản', pro: 'Nâng cao', enterprise: 'Tùy biến quy tắc', desc: 'Gắn thẻ tên phòng, cấu kiện, cửa theo template' },
      { name: 'Tạo View & Đặt View lên Sheet tự động', starter: false, pro: true, enterprise: true, desc: 'Tạo hàng trăm Sheet và căn chỉnh Viewport chuẩn tỷ lệ' },
    ]
  },
  {
    name: '2. Kết cấu & Cốt thép',
    items: [
      { name: 'Khống chế & Đánh số cốt thép (Rebar Numbering)', starter: false, pro: true, enterprise: true, desc: 'Đánh số thanh thép theo phân khu và đường kính' },
      { name: 'Tự động trích xuất bảng thống kê cốt thép', starter: false, pro: true, enterprise: true, desc: 'Bảng thống kê hình dáng thanh thép và tổng trọng lượng' },
      { name: 'Kiểm tra xung đột hình học kết cấu', starter: false, pro: true, enterprise: true, desc: 'Phát hiện nhanh giao cắt giữa cốt thép, ống luồn và cấu kiện' },
    ]
  },
  {
    name: '3. Hệ thống Cơ điện MEP',
    items: [
      { name: 'Tự động kết nối Ống gió / Ống nước (Auto Routing)', starter: false, pro: true, enterprise: true, desc: 'Tự động tạo co, lơ, tê kết nối thiết bị cơ điện' },
      { name: 'Quản lý cao độ & Độ dốc đường ống tự động', starter: false, pro: true, enterprise: true, desc: 'Điều chỉnh độ dốc chuẩn kỹ thuật cho hệ thống thoát nước' },
      { name: 'Tính toán & Xuất tải nhiệt sơ bộ', starter: false, pro: false, enterprise: true, desc: 'Tích hợp công thức tính toán tải HVAC nhanh trong Revit' },
    ]
  },
  {
    name: '4. Quản lý Dữ liệu & Xuất bản',
    items: [
      { name: 'Đồng bộ tham số 2 chiều Excel (Parameter Sync)', starter: '100 tham số', pro: 'Không giới hạn', enterprise: 'Không giới hạn + API', desc: 'Xuất/Nhập dữ liệu Parameter Revit qua bảng tính Excel' },
      { name: 'Xuất hàng loạt PDF, DWG, IFC chuẩn đặt tên', starter: 'Tối đa 10 file', pro: 'Không giới hạn', enterprise: 'Không giới hạn + Auto Batch', desc: 'Xuất theo đúng quy chuẩn mã hiệu dự án của chủ đầu tư' },
      { name: 'Dọn rác & Tối ưu dung lượng Model (File Purge)', starter: true, pro: true, enterprise: true, desc: 'Xóa view thừa, line style rác và nén file mô hình an toàn' },
    ]
  },
  {
    name: '5. Quyền lợi Bản quyền & Hỗ trợ Kỹ thuật',
    items: [
      { name: 'Số thiết bị kích hoạt đồng thời', starter: '1 thiết bị', pro: '1 thiết bị (Đổi linh hoạt)', enterprise: 'Cấp theo gói máy (Team)', desc: 'Chính sách quản lý thiết bị kích hoạt' },
      { name: 'Hệ thống Quản trị License tập trung (Admin Portal)', starter: false, pro: false, enterprise: true, desc: 'Bảng điều khiển cho Trưởng phòng BIM cấp/thu hồi bản quyền kỹ sư' },
      { name: 'Kênh Hỗ trợ Kỹ thuật', starter: 'Email (24h)', pro: 'Hotline + Zalo Ưu tiên', enterprise: 'Chuyên viên kỹ thuật 1-1 riêng', desc: 'Thời gian và kênh hỗ trợ xử lý sự cố' },
      { name: 'Cập nhật phiên bản Revit mới (Revit 2022-2027)', starter: 'Trong thời hạn', pro: 'Miễn phí nâng cấp', enterprise: 'Miễn phí nâng cấp trọn đời', desc: 'Tương thích tức thì khi Autodesk phát hành bản mới' },
      { name: 'Xuất hóa đơn GTGT (VAT) hợp lệ', starter: true, pro: true, enterprise: true, desc: 'Cung cấp hóa đơn điện tử hợp lệ cho doanh nghiệp thanh toán' },
    ]
  }
];

function RenderCell({ value }) {
  if (value === true) {
    return (
      <div className="flex justify-center text-emerald-500">
        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
          <Check size={14} />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center text-[var(--text-muted)] opacity-50">
        <Minus size={16} />
      </div>
    );
  }
  return (
    <span className="text-xs font-semibold text-[var(--text-primary)] text-center block">
      {value}
    </span>
  );
}

export default function FeatureComparisonTable({ onSelectPlan }) {
  return (
    <div className="mt-16 border border-[var(--line)] rounded-[var(--radius-panel)] bg-[var(--surface-raised)] shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8 bg-[var(--surface-subtle)] border-b border-[var(--line)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
            Bảng ma trận so sánh chi tiết tính năng
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Xem đầy đủ danh sách 20+ công cụ và quyền lợi tương ứng trên từng gói bản quyền.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[680px]">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--surface-raised)]">
              <th className="p-4 sm:p-5 text-sm font-extrabold text-[var(--text-primary)] w-2/5">
                Tính năng & Phân hệ
              </th>
              <th className="p-4 sm:p-5 text-center text-sm font-bold text-[var(--text-primary)] w-1/5 border-l border-[var(--line)]">
                Gói Tháng
                <span className="block text-xs font-normal text-[var(--text-muted)]">Cá nhân</span>
              </th>
              <th className="p-4 sm:p-5 text-center text-sm font-bold text-[var(--brand)] w-1/5 border-l border-[var(--line)] bg-[var(--brand-soft)]/20">
                Gói Năm
                <span className="block text-xs font-bold text-amber-500">Khuyên dùng ★</span>
              </th>
              <th className="p-4 sm:p-5 text-center text-sm font-bold text-[var(--text-primary)] w-1/5 border-l border-[var(--line)]">
                Gói Doanh nghiệp
                <span className="block text-xs font-normal text-[var(--text-muted)]">Studio & Doanh nghiệp</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, catIdx) => (
              <React.Fragment key={cat.name}>
                <tr className="bg-[var(--surface-subtle)] border-y border-[var(--line)] font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
                  <td colSpan={4} className="py-2.5 px-4 sm:px-5">
                    {cat.name}
                  </td>
                </tr>
                {cat.items.map((item, itemIdx) => (
                  <tr
                    key={item.name}
                    className="border-b border-[var(--line-soft)] hover:bg-[var(--surface-subtle)]/50 transition-colors text-sm"
                  >
                    <td className="py-3.5 px-4 sm:px-5">
                      <p className="font-semibold text-[var(--text-primary)]">{item.name}</p>
                      {item.desc && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-3 border-l border-[var(--line)]">
                      <RenderCell value={item.starter} />
                    </td>
                    <td className="py-3.5 px-3 border-l border-[var(--line)] bg-[var(--brand-soft)]/10">
                      <RenderCell value={item.pro} />
                    </td>
                    <td className="py-3.5 px-3 border-l border-[var(--line)]">
                      <RenderCell value={item.enterprise} />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
