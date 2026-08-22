import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Cpu,
  Download,
  Filter,
  Headphones,
  Layers,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { savePendingIntent } from '../../utils/pendingIntent';

const featureList = [
  {
    id: 'auto-dimension',
    title: 'Ghi kích thước tự động (Auto Dimension)',
    category: 'Kiến trúc & Khai triển',
    catKey: 'arch',
    description: 'Tự động nhận diện và tạo chuỗi kích thước chuẩn cho hệ tường, dầm, cột, cửa đi, cửa sổ và chi tiết cấu kiện theo tiêu chuẩn bản vẽ kỹ thuật.',
    image: '/assets/product/auto-dimension.webp',
    metric: 'Tiết kiệm ~90% thời gian Dim',
    bullets: [
      'Ghi kích thước tổng thể, kích thước tim trục và kích thước chi tiết cấu kiện',
      'Tự động né tránh các đối tượng đè lấn và sắp xếp đường dóng thẳng hàng',
      'Tùy biến chuẩn Dimension Style và khoảng cách dóng theo quy chuẩn công ty'
    ]
  },
  {
    id: 'batch-rename',
    title: 'Đổi tên hàng loạt (Batch Rename & Numbering)',
    category: 'Quản lý Dữ liệu & Bản vẽ',
    catKey: 'sheets',
    description: 'Quy chuẩn tên gọi cho hàng trăm View, Sheet, Family và Group theo cấu trúc tiền tố, hậu tố hoặc số thứ tự tăng dần kèm màn hình xem trước Trước/Sau.',
    image: '/assets/product/batch-rename.webp',
    metric: 'Đổi tên 500 Sheet trong 10 giây',
    bullets: [
      'Xem trước (Preview) toàn bộ thay đổi trước khi bấm Áp dụng',
      'Hỗ trợ công thức Regex, tìm kiếm và thay thế chuỗi ký tự linh hoạt',
      'Tính năng hoàn tác (Undo) an toàn khi có sự nhầm lẫn'
    ]
  },
  {
    id: 'parameter-manager',
    title: 'Đồng bộ tham số 2 chiều Excel (Parameter Sync)',
    category: 'Quản lý Dữ liệu & Bản vẽ',
    catKey: 'sheets',
    description: 'Kiểm tra, tính toán và đồng bộ tham số giữa mô hình Revit và bảng tính Excel mà không cần phải lập trình Dynamo phức tạp.',
    image: '/assets/product/parameter-manager.webp',
    metric: 'Xuất & Nhập 10.000 tham số tức thì',
    bullets: [
      'Xuất bảng thống kê thuộc tính ra file Excel với định dạng chuẩn',
      'Chỉnh sửa dữ liệu nhanh trong Excel và cập nhật ngược lại vào Revit',
      'Tự động kiểm tra và cảnh báo các cấu kiện bị thiếu tham số quan trọng'
    ]
  },
  {
    id: 'sheet-publisher',
    title: 'Tự động tạo Sheet & Căn chỉnh Viewport',
    category: 'Quản lý Dữ liệu & Bản vẽ',
    catKey: 'sheets',
    description: 'Tạo hàng loạt Sheet từ danh sách Excel, tự động gán đúng khung tên và đặt Viewport chuẩn tọa độ và tỉ lệ theo quy chuẩn hồ sơ.',
    image: '/assets/product/sheet-publisher.webp',
    metric: 'Tạo 100 Sheet trong 1 phút',
    bullets: [
      'Tự động đặt View vào đúng tọa độ tâm khung tên trên mọi Sheet',
      'Sao chép (Duplicate) cấu trúc View và Sheet kèm theo các ghi chú chi tiết',
      'Lưu cấu hình mẫu (Template) để tái sử dụng cho các dự án tiếp theo'
    ]
  },
  {
    id: 'batch-exporter',
    title: 'Xuất hàng loạt PDF, DWG & IFC chuẩn mã hiệu',
    category: 'Xuất bản & Tối ưu',
    catKey: 'export',
    description: 'Xuất hàng trăm bản vẽ sang định dạng PDF, DWG và mô hình IFC đồng thời theo đúng quy tắc đặt tên mã hiệu dự án của chủ đầu tư.',
    image: '/assets/product/batch-exporter.webp',
    metric: 'Xuất 100 bản vẽ trong 2 phút',
    bullets: [
      'Đặt tên file tự động theo mã Sheet Number + Sheet Name + Revision',
      'Tự động ghép nhiều trang thành 1 file PDF duy nhất hoặc tách riêng',
      'Theo dõi tiến trình xuất file trực quan và ghi nhận nhật ký lỗi chi tiết'
    ]
  },
  {
    id: 'rebar-tools',
    title: 'Khống chế & Đánh số cốt thép Kết cấu',
    category: 'Kết cấu & Cốt thép',
    catKey: 'structure',
    description: 'Tự động sắp xếp, đánh số thanh thép Rebar theo phân khu, đường kính và trích xuất bảng thống kê khối lượng cốt thép tự động.',
    image: '/assets/product/parameter-manager.webp',
    metric: 'Chính xác 100% khối lượng thép',
    bullets: [
      'Đánh số Rebar theo phân khu thi công (Zone/Level) và nhóm đường kính',
      'Tạo bảng thống kê hình dáng thanh thép (Bar Schedule) chuẩn TCVN',
      'Kiểm tra xung đột hình học và chiều dài neo nối thanh thép'
    ]
  },
  {
    id: 'mep-routing',
    title: 'Tự động kết nối & Cân chỉnh độ dốc MEP',
    category: 'Hệ thống Cơ điện MEP',
    catKey: 'mep',
    description: 'Tự động đi tuyến ống gió, ống nước với phụ kiện cút/tê chuẩn kỹ thuật và tự động gán độ dốc thoát nước theo tiêu chuẩn thiết kế.',
    image: '/assets/product/auto-dimension.webp',
    metric: 'Giảm 75% thời gian vẽ ống MEP',
    bullets: [
      'Tự động kết nối đầu chờ thiết bị vào tuyến ống nhánh và trục chính',
      'Kiểm soát cao độ đỉnh/đáy ống (BOP/TOP) và kiểm tra va chạm sơ bộ',
      'Tự động gán màu phân loại hệ thống theo tiêu chuẩn ASME/TCVN'
    ]
  }
];

const categories = [
  { key: 'all', label: 'Tất cả tính năng' },
  { key: 'arch', label: 'Kiến trúc & Khai triển' },
  { key: 'structure', label: 'Kết cấu & Cốt thép' },
  { key: 'mep', label: 'Cơ điện MEP' },
  { key: 'sheets', label: 'Quản lý Sheet & Dữ liệu' },
  { key: 'export', label: 'Xuất bản & Tối ưu' }
];

export default function FeaturesPage() {
  const [selectedCat, setSelectedCat] = useState('all');
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const onOpenConsultation = outletContext?.onOpenConsultation || (() => {});
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const startTrial = () => {
    if (isAuthenticated) return navigate('/download');
    savePendingIntent({ type: 'download', returnTo: '/download' });
    navigate('/login');
  };

  const filtered = selectedCat === 'all'
    ? featureList
    : featureList.filter((f) => f.catKey === selectedCat);

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="page-shell pt-12 lg:pt-16 pb-10 max-w-3xl text-center mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-soft)] border border-[var(--line)] text-xs font-bold text-[var(--brand)] mb-3">
          <Layers size={14} /> Hệ sinh thái hơn 30+ công cụ Revit
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] text-balance tracking-tight">
          Ít thao tác thủ công.<br />Nhiều thời gian cho sáng tạo.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
          Bộ công cụ toàn diện giúp chuẩn hóa quy trình Revit từ giai đoạn dựng mô hình, quản lý dữ liệu đến xuất hồ sơ bàn giao.
        </p>
      </header>

      {/* Category Filter Tabs */}
      <div className="page-shell pb-6 border-b border-[var(--line)]">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCat(c.key)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                selectedCat === c.key
                  ? 'bg-[var(--brand)] text-[var(--brand-text)] shadow-md'
                  : 'bg-[var(--surface-raised)] border border-[var(--line)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Features List */}
      <div className="divide-y divide-[var(--line)]">
        {filtered.map((feature, index) => (
          <section
            key={feature.id}
            className={index % 2 === 1 ? 'bg-[var(--surface-subtle)]/40' : 'bg-[var(--surface)]'}
          >
            <div className="page-shell py-12 lg:py-16 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <div className={index % 2 ? 'lg:order-2' : ''}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--brand)] tracking-wider px-2.5 py-1 rounded bg-[var(--brand-soft)] border border-[var(--line)]">
                    {feature.category}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-900/40">
                    {feature.metric}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  {feature.title}
                </h2>
                
                <p className="mt-3 text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">
                  {feature.description}
                </p>

                <ul className="mt-6 space-y-3">
                  {feature.bullets.map((x) => (
                    <li key={x} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                      <div className="w-5 h-5 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={13} />
                      </div>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex items-center gap-3.5">
                  <button onClick={startTrial} className="primary-button text-xs sm:text-sm font-bold">
                    <Download size={16} /> Dùng thử tính năng này
                  </button>
                  <Link to="/pricing" className="secondary-button text-xs sm:text-sm font-semibold">
                    Xem bảng giá
                  </Link>
                </div>
              </div>

              <figure className={index % 2 ? 'lg:order-1' : ''}>
                <div className="product-frame shadow-md rounded-[var(--radius-panel)] border border-[var(--line)] overflow-hidden">
                  <img
                    src={feature.image}
                    width="1280"
                    height="960"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    alt={`Giao diện tính năng ${feature.title}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </figure>
            </div>
          </section>
        ))}
      </div>

      {/* Bottom CTA */}
      <section className="page-shell mt-16">
        <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] p-8 lg:p-12 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              Bạn có nhu cầu tùy biến công cụ theo chuẩn công ty?
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Đội ngũ phát triển của chúng tôi sẵn sàng xây dựng các tiện ích chuyên biệt theo tiêu chuẩn riêng của văn phòng thiết kế bạn.
            </p>
          </div>
          <button
            onClick={onOpenConsultation}
            className="primary-button shrink-0 text-sm sm:text-base font-bold px-6 py-3.5 shadow-md"
          >
            <Headphones size={17} /> Đăng ký nhận tư vấn
          </button>
        </div>
      </section>
    </div>
  );
}
