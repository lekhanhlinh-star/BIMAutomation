import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  Download,
  FileCheck,
  FileSpreadsheet,
  Headphones,
  Layers,
  PhoneCall,
  PlayCircle,
  Send,
  ShieldCheck,
  Star,
  Users,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { savePendingIntent } from '../../utils/pendingIntent';
import { publicApi } from '../../api/services';

const disciplines = [
  {
    id: 'architecture',
    name: 'Kiến trúc & Khai triển',
    tagline: 'Tự động hóa toàn diện khâu ghi kích thước và triển khai mặt bằng',
    image: '/assets/product/auto-dimension.webp',
    bullets: [
      'Ghi kích thước tự động (Auto Dim) cho hệ tường, dầm, cột, cửa theo chuẩn bản vẽ',
      'Tự động gắn Tag tên phòng, cao độ và kích thước cửa hàng loạt',
      'Tạo nhanh mặt cắt và trích xuất chi tiết cấu kiện chỉ bằng 1 thao tác'
    ],
    metric: 'Tiết kiệm ~90% thời gian Dim'
  },
  {
    id: 'structure',
    name: 'Kết cấu & Cốt thép',
    tagline: 'Khống chế và thống kê khối lượng cốt thép chính xác tuyệt đối',
    image: '/assets/product/parameter-manager.webp',
    bullets: [
      'Tự động đánh số thanh thép (Rebar Numbering) theo phân khu và đường kính',
      'Trích xuất bảng thống kê khối lượng cốt thép và bê tông tự động',
      'Kiểm tra xung đột hình học và khoảng hở cấu kiện kết cấu'
    ],
    metric: 'Chính xác 100% khối lượng'
  },
  {
    id: 'mep',
    name: 'Hệ thống Cơ điện MEP',
    tagline: 'Tự động kết nối và cân chỉnh độ dốc đường ống cơ điện',
    image: '/assets/product/batch-exporter.webp',
    bullets: [
      'Tự động đi tuyến ống gió và ống nước (Auto Routing) với phụ kiện co, lơ, tê',
      'Điều chỉnh cao độ và độ dốc chuẩn kỹ thuật cho hệ thống thoát nước',
      'Phát hiện điểm va chạm không gian giữa ống MEP và kết cấu'
    ],
    metric: 'Giảm 75% thời gian vẽ MEP'
  },
  {
    id: 'sheets',
    name: 'Quản lý Sheet & Dữ liệu',
    tagline: 'Sắp xếp, quản lý và kiểm soát hàng trăm bản vẽ trong nháy mắt',
    image: '/assets/product/batch-rename.webp',
    bullets: [
      'Đổi tên hàng loạt View, Sheet, Family theo quy tắc tiền tố/hậu tố linh hoạt',
      'Tự động tạo Sheet và căn chỉnh Viewport chuẩn khung tên theo tỷ lệ',
      'Đồng bộ tham số mô hình hai chiều trực tiếp với bảng tính Excel'
    ],
    metric: 'Xử lý 500 Sheet trong 10s'
  },
  {
    id: 'export',
    name: 'Xuất bản & Tối ưu Model',
    tagline: 'Xuất hàng loạt PDF/DWG/IFC theo đúng chuẩn mã hiệu dự án',
    image: '/assets/product/sheet-publisher.webp',
    bullets: [
      'Xuất đồng thời PDF, DWG, IFC với tên file tự động theo mã hiệu dự án',
      'Dọn rác, xóa view thừa và nén dung lượng mô hình an toàn',
      'Kiểm tra tính hợp lệ của Model trước khi bàn giao cho chủ đầu tư'
    ],
    metric: 'Xuất 100 bản vẽ trong 2 phút'
  }
];

const faqs = [
  {
    q: 'BIMAutomation hỗ trợ các phiên bản Autodesk Revit nào?',
    a: 'BIMAutomation hỗ trợ đầy đủ các phiên bản Autodesk Revit từ Revit 2022, 2023, 2024, 2025, 2026 đến phiên bản mới nhất 2027 trên hệ điều hành Windows 10 và Windows 11 (64-bit).'
  },
  {
    q: 'Thời gian dùng thử miễn phí là bao lâu? Có bị giới hạn tính năng không?',
    a: 'Bạn được dùng thử hoàn toàn miễn phí trong 14 ngày với đầy đủ hơn 30+ công cụ chuyên sâu. Không yêu cầu nhập thẻ thanh toán để bắt đầu trải nghiệm.'
  },
  {
    q: 'Một bản quyền (License Key) có thể sử dụng trên bao nhiêu máy tính?',
    a: 'Mỗi License kích hoạt trên 1 thiết bị làm việc đồng thời. Bạn hoàn toàn có thể tự chuyển đổi thiết bị linh hoạt (khi đổi máy tính hoặc laptop) trực tiếp trong trang Quản lý tài khoản.'
  },
  {
    q: 'Doanh nghiệp mua số lượng lớn cho phòng BIM có được ưu đãi và xuất hóa đơn VAT không?',
    a: 'Có. BIMAutomation cung cấp chính sách chiết khấu hấp dẫn cho đội ngũ từ 5 máy trở lên, có bảng điều khiển Admin quản lý License tập trung và cung cấp hóa đơn điện tử VAT hợp lệ.'
  },
  {
    q: 'Sau khi thanh toán qua VietQR thì bao lâu nhận được License?',
    a: 'Hệ thống tự động xác thực giao dịch chuyển khoản VietQR 24/7 và cấp License Key tức thì vào tài khoản của bạn chỉ sau 5-10 giây kể từ khi chuyển khoản thành công.'
  },
  {
    q: 'Khi gặp sự cố trong quá trình sử dụng Revit, tôi được hỗ trợ như thế nào?',
    a: 'Đội ngũ kỹ sư BIM giàu kinh nghiệm của chúng tôi hỗ trợ trực tiếp qua Hotline 0904 885 833, kênh Zalo kỹ thuật 24/7 và hỗ trợ từ xa qua UltraViewer/TeamViewer khi bạn cần xử lý khẩn cấp.'
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const onOpenConsultation = outletContext?.onOpenConsultation || (() => {});
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [activeTab, setActiveTab] = useState('architecture');
  const [openFaq, setOpenFaq] = useState(0);

  const [quickForm, setQuickForm] = useState({ name: '', phone: '', email: '', company: '', teamSize: '1-5 kỹ sư' });
  const [formSent, setFormSent] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await publicApi.sendFeedback({
        name: quickForm.name,
        email: quickForm.email,
        category: 'Hỗ trợ License / Thanh toán',
        content: `[LEAD TRANG CHỦ] Đơn vị: ${quickForm.company || 'Chưa cung cấp'} | Quy mô: ${quickForm.teamSize} | SĐT: ${quickForm.phone}`
      });
    } catch {}
    setFormLoading(false);
    setFormSent(true);
  };

  const startTrial = () => {
    if (isAuthenticated) return navigate('/download');
    savePendingIntent({ type: 'download', returnTo: '/download' });
    navigate('/login');
  };

  const currentDiscipline = disciplines.find((d) => d.id === activeTab) || disciplines[0];

  return (
    <div className="pb-28">
      {/* 1. CINEMATIC WIDE HERO SECTION */}
      <section className="relative pt-16 lg:pt-24 pb-20 overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[var(--brand)]/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="page-shell text-center">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-raised)] border border-[var(--line)] shadow-xs text-xs font-semibold text-[var(--text-secondary)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
            <span>Bộ công cụ tự động hóa Revit 2022–2027 chính thức phát hành</span>
          </div>

          {/* Ultra-Wide 2-Line Headline */}
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.08] text-balance">
              Tự động hóa Autodesk Revit.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--brand)] via-[var(--brand-strong)] to-cyan-400">
                Chuẩn hóa 100% hồ sơ bản vẽ.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-[var(--text-secondary)] leading-relaxed max-w-3xl mx-auto font-normal">
              Bộ công cụ hơn 30+ tiện ích chuyên sâu giúp kỹ sư và kiến trúc sư giải phóng 80% thời gian thực hiện các tác vụ lặp lại: Tự động Dim, đổi tên Sheet hàng loạt và xuất hồ sơ chỉ trong 1 click.
            </p>
          </div>

          {/* Dual High-Contrast CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <button
              onClick={startTrial}
              className="primary-button text-sm sm:text-base !py-3.5 !px-7 font-bold w-full sm:w-auto"
            >
              <Download size={18} /> Dùng thử miễn phí 14 ngày
            </button>
            <button
              onClick={onOpenConsultation}
              className="secondary-button text-sm sm:text-base !py-3.5 !px-6 font-semibold w-full sm:w-auto"
            >
              <Headphones size={16} className="text-[var(--brand)]" /> Nhận tư vấn giải pháp
            </button>
          </div>

          <p className="mt-4 text-xs text-[var(--text-muted)] font-medium">
            Kích hoạt ngay trên Revit · Không yêu cầu thẻ tín dụng · Hỗ trợ kỹ thuật 24/7
          </p>

          {/* Large Integrated Product Showcase Canvas */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="product-frame">
              <img
                src="/assets/product/bimautomation-hero.webp"
                width="1586"
                height="992"
                fetchPriority="high"
                alt="Giao diện Ribbon công cụ BIMAutomation trên Autodesk Revit"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>


      {/* 3. GAPLESS DENSE BENTO GRID (Section Highlight) */}
      <section className="page-shell py-24 lg:py-32">
        <div className="max-w-3xl mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight text-balance">
            Bộ công cụ được thiết kế cho nhịp làm việc thực tế
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)]">
            Giải quyết các nút thắt cổ chai lớn nhất trong quá trình mô hình hóa và triển khai hồ sơ thi công Revit.
          </p>
        </div>

        {/* Gapless Dense Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 grid-flow-dense">
          {/* Bento 1: Auto Dimension (Span 2 Cols) */}
          <div className="bento-card md:col-span-2 p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-[var(--brand)] bg-[var(--brand-soft)] px-2.5 py-1 rounded">
                Tiết kiệm 90% thời gian
              </span>
              <h3 className="mt-4 text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)]">
                Ghi kích thước tự động (Auto Dimension)
              </h3>
              <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl">
                Tự động nhận diện cấu kiện và tạo toàn bộ chuỗi kích thước cho hệ tường, dầm, cột, cửa theo tiêu chuẩn chỉ trong một lần bấm.
              </p>
            </div>
            <div className="mt-8 rounded-lg overflow-hidden border border-[var(--line)] bg-slate-950">
              <img
                src="/assets/product/auto-dimension.webp"
                alt="Ghi kích thước tự động"
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Bento 2: Batch Rename (Span 1 Col) */}
          <div className="bento-card p-8 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded">
                500 Sheet trong 10s
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-[var(--text-primary)]">
                Đổi tên hàng loạt
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Đổi tên View, Sheet, Family theo quy tắc tiền tố/hậu tố kèm màn hình xem trước Trước/Sau an toàn.
              </p>
            </div>
            <div className="mt-6 rounded-lg overflow-hidden border border-[var(--line)] bg-slate-950">
              <img
                src="/assets/product/batch-rename.webp"
                alt="Đổi tên hàng loạt"
                className="w-full h-44 object-cover"
              />
            </div>
          </div>

          {/* Bento 3: Parameter Sync (Span 1 Col) */}
          <div className="bento-card p-8 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded">
                Đồng bộ 2 chiều
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-[var(--text-primary)]">
                Quản lý tham số Excel
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Xuất nhập hàng ngàn thuộc tính mô hình trực tiếp qua Excel mà không cần viết script Dynamo phức tạp.
              </p>
            </div>
            <div className="mt-6 rounded-lg overflow-hidden border border-[var(--line)] bg-slate-950">
              <img
                src="/assets/product/parameter-manager.webp"
                alt="Quản lý tham số"
                className="w-full h-44 object-cover"
              />
            </div>
          </div>

          {/* Bento 4: Batch Exporter (Span 2 Cols) */}
          <div className="bento-card md:col-span-2 p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-[var(--brand)] bg-[var(--brand-soft)] px-2.5 py-1 rounded">
                Xuất 100 bản vẽ / 2 phút
              </span>
              <h3 className="mt-4 text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)]">
                Xuất bản PDF, DWG & IFC hàng loạt
              </h3>
              <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl">
                Tự động đặt tên file theo mã hiệu dự án, ghép file hoặc tách riêng theo từng bộ môn phát hành.
              </p>
            </div>
            <div className="mt-8 rounded-lg overflow-hidden border border-[var(--line)] bg-slate-950">
              <img
                src="/assets/product/batch-exporter.webp"
                alt="Xuất file hàng loạt"
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE DISCIPLINE CANVAS */}
      <section className="border-t border-[var(--line)] bg-[var(--surface-raised)] py-24 lg:py-32">
        <div className="page-shell">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Phân hệ chuyên sâu theo từng bộ môn
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)]">
              Dù bạn làm Kiến trúc, Kết cấu bê tông/thép hay Cơ điện MEP, BIMAutomation đều có công cụ chuẩn hóa tương ứng.
            </p>
          </div>

          {/* Tab Pill Selector */}
          <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-4">
            {disciplines.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[var(--brand)] text-[var(--brand-text)] shadow-sm'
                    : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Tab Canvas Content */}
          <div className="mt-8 p-8 lg:p-12 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] grid lg:grid-cols-[1.1fr_.9fr] gap-10 items-center">
            <div>
              <span className="font-mono text-xs font-extrabold text-[var(--brand)] bg-[var(--brand-soft)] px-3 py-1 rounded">
                {currentDiscipline.metric}
              </span>
              <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                {currentDiscipline.name}
              </h3>
              <p className="mt-2 text-base text-[var(--text-secondary)]">
                {currentDiscipline.tagline}
              </p>

              <ul className="mt-6 space-y-3.5">
                {currentDiscipline.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-[var(--text-primary)] font-medium">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={13} />
                    </div>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-center gap-4">
                <Link to="/features" className="primary-button text-sm font-bold">
                  Xem tất cả công cụ <ArrowRight size={16} />
                </Link>
                <button onClick={startTrial} className="secondary-button text-sm font-semibold">
                  Dùng thử ngay
                </button>
              </div>
            </div>

            <div className="product-frame">
              <img
                src={currentDiscipline.image}
                alt={currentDiscipline.name}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>


      {/* 6. CUSTOMER TESTIMONIALS */}
      <section className="border-t border-[var(--line)] bg-[var(--surface-raised)] py-24 lg:py-32">
        <div className="page-shell">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Đánh giá từ các Trưởng phòng & Kỹ sư BIM
            </h2>
            <p className="mt-3 text-base text-[var(--text-secondary)]">
              Những chia sẻ thực tế từ các đội ngũ đang áp dụng BIMAutomation trong dự án trọng điểm.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'BIMAutomation giúp đội ngũ 12 kỹ sư của chúng tôi rút ngắn gần 2 tuần triển khai hồ sơ kỹ thuật cho dự án tòa nhà hỗn hợp 35 tầng. Tính năng Auto Dim và Batch Exporter chạy cực kỳ ổn định.',
                author: 'Trần Minh Tuấn',
                role: 'BIM Manager',
                company: 'Tổng thầu Xây dựng Coteccons',
                rating: 5
              },
              {
                quote: 'Đổi tên 400 Sheet và đồng bộ dữ liệu tham số qua Excel chỉ mất vài phút. Không còn cảnh cả team phải thức đêm làm các tác vụ chân tay lặp lại trước mỗi đợt nộp hồ sơ.',
                author: 'Lê Phương Anh',
                role: 'Trưởng nhóm Kiến trúc',
                company: 'Studio Thiết kế Archetype',
                rating: 5
              },
              {
                quote: 'Chính sách quản lý License rất linh hoạt, kích hoạt ngay lập tức qua VietQR. Khi có vấn đề kỹ thuật thì đội ngũ hỗ trợ qua Zalo và UltraViewer rất nhiệt tình trong vòng 15 phút.',
                author: 'Nguyễn Quốc Hùng',
                role: 'Kỹ sư Kết cấu & MEP',
                company: 'Phòng Kỹ thuật Central Cons',
                rating: 5
              }
            ].map((t) => (
              <div
                key={t.author}
                className="p-8 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-[var(--line)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] font-extrabold flex items-center justify-center text-sm font-mono">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{t.author}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {t.role} · <strong className="text-[var(--brand)]">{t.company}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. LEAD CONSULTATION SECTION */}
      <section className="page-shell py-20">
        <div className="p-8 lg:p-14 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] grid lg:grid-cols-[1.1fr_.9fr] gap-10 items-center shadow-md">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--brand)] mb-3">
              <Building2 size={14} /> Dành riêng cho Doanh nghiệp & Studio
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              Đăng ký tư vấn demo & Bản quyền dùng thử cho đội ngũ
            </h2>
            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
              Để lại thông tin để chuyên viên giải pháp BIMAutomation gửi tài liệu chi tiết, demo trực tiếp qua Google Meet và cấp gói License trải nghiệm cho phòng BIM của bạn.
            </p>

            <div className="mt-6 space-y-2 text-xs font-semibold text-[var(--text-secondary)]">
              <p className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500" /> Demo 1-1 theo mô hình thực tế của công ty
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500" /> Báo giá ưu đãi cho đội ngũ từ 5 máy trở lên
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500" /> Hỗ trợ cài đặt và chuyển giao kỹ thuật tận nơi
              </p>
            </div>
          </div>

          <div className="bg-[var(--surface)] p-6 sm:p-7 rounded-[var(--radius-panel)] border border-[var(--line)]">
            {formSent ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 size={44} className="text-emerald-500 mx-auto" />
                <h3 className="font-bold text-lg text-[var(--text-primary)]">Đã gửi thông tin!</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Chuyên viên giải pháp sẽ liên hệ với bạn trong vòng 15 phút.
                </p>
                <button onClick={() => setFormSent(false)} className="secondary-button text-xs mt-2">
                  Gửi lại yêu cầu khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuickSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickForm.name}
                    onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                    placeholder="Kỹ sư Nguyễn Văn A"
                    className="form-control text-sm w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={quickForm.phone}
                      onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                      placeholder="0912 345 678"
                      className="form-control text-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                      Email công việc <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={quickForm.email}
                      onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })}
                      placeholder="name@company.com"
                      className="form-control text-sm w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                      Tên công ty / Studio
                    </label>
                    <input
                      type="text"
                      value={quickForm.company}
                      onChange={(e) => setQuickForm({ ...quickForm, company: e.target.value })}
                      placeholder="Công ty CP..."
                      className="form-control text-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                      Quy mô phòng BIM
                    </label>
                    <select
                      value={quickForm.teamSize}
                      onChange={(e) => setQuickForm({ ...quickForm, teamSize: e.target.value })}
                      className="form-control text-sm w-full"
                    >
                      <option>1 - 5 kỹ sư</option>
                      <option>6 - 15 kỹ sư</option>
                      <option>16 - 30 kỹ sư</option>
                      <option>&gt; 30 kỹ sư</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="primary-button w-full justify-center !py-3 text-sm font-bold mt-2"
                >
                  <Send size={16} /> {formLoading ? 'Đang gửi...' : 'Đăng ký nhận tư vấn ngay'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section className="page-shell py-14 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            Câu hỏi thường gặp
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-raised)] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-[var(--text-primary)] flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[var(--brand)]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--line-soft)]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION */}
      <section className="page-shell mt-10">
        <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] p-8 lg:p-14 shadow-lg flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Bắt đầu bứt phá năng suất Revit hôm nay
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)]">
              Trải nghiệm toàn bộ 30+ công cụ tự động hóa Revit trong 14 ngày miễn phí. Không cần thẻ thanh toán.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3.5 shrink-0">
            <button onClick={startTrial} className="primary-button text-base px-6 py-3.5 font-bold shadow-md">
              <Download size={18} /> Dùng thử miễn phí
            </button>
            <a href="tel:0904885833" className="secondary-button text-base px-5 py-3.5 font-bold">
              <PhoneCall size={18} className="text-emerald-500" /> 0904 885 833
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
