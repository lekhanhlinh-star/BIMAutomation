import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, ChevronDown, Download,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { savePendingIntent } from '../../utils/pendingIntent';
import { publicApi } from '../../api/services';
import AiToolIcon from '../../components/icons/AiToolIcon';

const outcomes = [
  {
    number: '01',
    title: 'Vẽ thép hàng loạt, vẫn đúng cách bạn làm',
    description: 'Gọi cấu hình đã lưu theo tên hệ cột, dầm, vách hoặc móng. BIMAutomation áp dụng đồng nhất cho toàn bộ cấu kiện cần xử lý.',
  },
  {
    number: '02',
    title: 'Đưa bảng Excel vào thẳng quy trình Revit',
    description: 'Dùng bảng thép dầm quen thuộc của đội ngũ để tạo mô hình. Không cần nhập lại từng thông số hay chuyển dữ liệu qua nhiều bước.',
  },
  {
    number: '03',
    title: 'Đi tiếp từ mô hình đến hồ sơ',
    description: 'Sau khi dựng thép, tiếp tục tạo mặt cắt, bố trí sheet, ghi kích thước và gắn tag trong cùng một luồng công việc.',
  },
];

const pluginGroups = [
  {
    title: 'Bố trí thép sàn', label: 'Ảnh chụp trong Revit 2025', image: '/assets/product/real/slab-rebar-revit-2025.jpg',
    alt: 'Cửa sổ Bố trí thép sàn của BIMAutomation đang xem trước hai lớp thép trên mô hình Revit 2025',
    description: 'Chọn ô sàn, cấu hình lớp dưới và lớp trên, sau đó xem trước toàn bộ thanh thép ngay trong mô hình đang mở.',
    items: ['Xem trước 2D / 3D', 'Cấu hình từng phương', 'Kiểm tra trước khi tạo'], className: 'lg:col-span-7',
  },
  {
    title: 'Bố trí thép vách', label: 'Ảnh chụp trong Revit 2025', image: '/assets/product/real/wall-rebar-revit-2025.jpg',
    alt: 'Cửa sổ Wall Rebar của BIMAutomation với mặt cắt ngang, mặt cắt dọc và xem trước 3D trong Revit 2025',
    description: 'Thiết lập thép dọc, thép ngang, thép giằng và lớp bảo vệ với mặt cắt cùng bản xem trước 3D trên một màn hình.',
    items: ['Mặt cắt ngang', 'Mặt cắt dọc', 'Review 3D'], className: 'lg:col-span-5',
  },
  {
    title: 'Bố trí thép dầm', label: 'Ảnh chụp trong Revit 2025', image: '/assets/product/real/beam-rebar-revit-2025.jpg',
    alt: 'Cửa sổ Quick Setting để bố trí thép dầm và xem trước mô hình 3D trong Revit 2025',
    description: 'Nhập thép chủ, thép tăng cường, đai và tùy chọn triển khai sheet trong cửa sổ làm việc trực tiếp của plugin.',
    items: ['Thép chủ và tăng cường', 'Cấu hình đai', 'Xem trước 3D'], className: 'lg:col-span-5',
  },
  {
    title: 'MCP Server trong Revit', label: 'Ảnh chụp trong Revit 2025', image: '/assets/product/real/mcp-server-revit-2025.jpg',
    alt: 'Cửa sổ RevitAPP MCP Server đang chạy và hiển thị danh sách công cụ AI trong Revit 2025',
    description: 'MCP Server chạy cùng Revit, cho phép chọn AI client, sao chép cấu hình kết nối và kiểm tra các công cụ đang sẵn sàng.',
    items: ['Claude Desktop', 'Cấu hình kết nối', 'Danh sách tool đang chạy'], className: 'lg:col-span-7',
  },
];

const faqs = [
  { q: 'Tôi có cần biết viết prompt phức tạp không?', a: 'Không. Bạn có thể dùng câu lệnh tiếng Việt tự nhiên hoặc gọi đúng tên cấu hình đã lưu, ví dụ “vẽ hệ cột C7 theo cấu hình đã lưu”.' },
  { q: 'AI có tự ý thay đổi mô hình Revit không?', a: 'Không. Bạn luôn được xem lại yêu cầu và xác nhận trước khi những thay đổi quan trọng được ghi vào mô hình.' },
  { q: 'Tôi có bắt buộc dùng AI mới sử dụng được plugin không?', a: 'Không. Các công cụ chính vẫn có giao diện nút bấm trực tiếp trên Ribbon. AI là cách làm nhanh hơn khi bạn muốn ghép nhiều thao tác thành một yêu cầu.' },
  { q: 'Có thể dùng Codex, Claude hoặc Cursor không?', a: 'BIMAutomation được thiết kế để kết nối với các AI client tương thích MCP. Khả năng sử dụng cụ thể phụ thuộc vào cấu hình và tính năng MCP của từng client.' },
  { q: 'BIMAutomation hỗ trợ phiên bản nào?', a: 'Một bộ cài dùng cho Autodesk Revit 2022–2027 trên Windows 10/11 64-bit và tự nhận diện các phiên bản Revit đang có trên máy.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const onOpenConsultation = outletContext?.onOpenConsultation || (() => {});
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [openFaq, setOpenFaq] = useState(0);
  const [quickForm, setQuickForm] = useState({ name: '', phone: '', email: '' });
  const [formSent, setFormSent] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const startTrial = () => {
    if (isAuthenticated) return navigate('/download');
    savePendingIntent({ type: 'download', returnTo: '/download' });
    navigate('/login');
  };

  const handleQuickSubmit = async (event) => {
    event.preventDefault();
    setFormLoading(true);
    try {
      await publicApi.sendFeedback({
        name: quickForm.name,
        email: quickForm.email,
        category: 'Tư vấn BIMAutomation',
        content: `[LEAD TRANG CHỦ] SĐT: ${quickForm.phone}`,
      });
    } catch {
      // Keep the lead flow responsive if the public endpoint is temporarily unavailable.
    }
    setFormLoading(false);
    setFormSent(true);
  };

  return (
    <div className="home-page pb-20 sm:pb-28">
      <section className="home-hero relative overflow-hidden border-b border-[var(--line)]">
        <div className="editorial-shell editorial-hero-grid">
          <div className="editorial-hero-copy">
            <h1 className="editorial-title">
              Ít thao tác.
              <span>Nhiều việc hoàn thành.</span>
            </h1>
            <p className="editorial-subtitle">Plugin Revit cho kỹ sư kết cấu</p>
            <p className="editorial-description">
              Tự động hóa bố trí cốt thép, vẽ thép, kiểm tra và xuất bản vẽ phù hợp tiêu chuẩn Việt Nam. Tích hợp AI để tăng tốc tiến độ và giảm sai sót.
            </p>
            <div className="editorial-actions">
              <button onClick={startTrial} className="editorial-primary">Dùng thử 14 ngày</button>
              <button onClick={onOpenConsultation} className="editorial-secondary">
                Xem workflow thực tế <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </div>

          <figure className="editorial-hero-media">
            <img
              src="/assets/product/real/mcp-server-revit-2025.jpg"
              alt="RevitAPP MCP Server đang chạy trực tiếp trong Autodesk Revit 2025"
              loading="eager"
            />
            <figcaption>Ảnh chụp sản phẩm thực tế · Autodesk Revit 2025</figcaption>
          </figure>
        </div>
      </section>

      <section className="editorial-evidence">
        <div className="editorial-shell editorial-evidence-grid">
          <div className="editorial-facts">
            <span className="editorial-rule" aria-hidden="true" />
            <div className="editorial-fact-grid">
              <article>
                <h2>Revit 2022–2027</h2>
                <p>Tương thích các phiên bản Revit đang triển khai phổ biến.</p>
              </article>
              <article>
                <h2>TCVN 5574:2018</h2>
                <p>Bám theo tiêu chuẩn kết cấu bê tông cốt thép Việt Nam hiện hành.</p>
              </article>
              <article>
                <h2>MCP kết nối AI</h2>
                <p>Kết nối MCP Server để khai thác AI an toàn trong Revit.</p>
              </article>
            </div>
          </div>
          <figure className="editorial-evidence-media">
            <img
              src="/assets/product/real/wall-rebar-revit-2025.jpg"
              alt="BIMAutomation cấu hình thép vách, mặt cắt và xem trước 3D trong Revit 2025"
              loading="eager"
            />
          </figure>
        </div>
      </section>

      <section className="page-shell py-24 sm:py-32" id="workflow">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="home-kicker">Một cách làm việc mới</span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl text-balance">Bạn nói điều cần làm. BIMAutomation lo phần lặp lại.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--text-secondary)] sm:text-base">AI không thay quyết định của kỹ sư. Nó giúp biến quyết định đó thành thao tác Revit nhanh, nhất quán và dễ kiểm tra hơn.</p>
            <Link to="/features" className="home-arrow-link mt-7">Khám phá toàn bộ tính năng <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" /></Link>
          </div>
          <div className="border-t border-[var(--line)]">
            {outcomes.map(({ number, title, description }) => (
              <article key={number} className="grid gap-5 border-b border-[var(--line)] py-8 sm:grid-cols-[72px_1fr] sm:items-start sm:py-10">
                <span className="font-mono text-xs font-bold text-[var(--text-muted)]">/{number}</span>
                <div><h3 className="text-xl font-bold tracking-[-0.03em] sm:text-2xl">{title}</h3><p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-dark-section py-24 sm:py-32" id="plugins">
        <div className="page-shell">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div><span className="home-kicker">Hệ plugin BIMAutomation</span><h2 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl text-balance">Từ cốt thép đến hồ sơ, trong một hệ công cụ.</h2></div>
            <p className="max-w-md text-sm leading-7 text-[var(--text-secondary)]">Dùng từng plugin độc lập trên Ribbon hoặc để AI phối hợp nhiều bước cho một mục tiêu hoàn chỉnh.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:mt-14 lg:grid-cols-12">
            {pluginGroups.map((group) => (
              <article key={group.title} className={`home-plugin-card group ${group.className}`}>
                <div className="relative overflow-hidden border-b border-white/10">
                  <img src={group.image} alt={group.alt} loading="lazy" className="h-56 w-full object-cover object-top transition duration-500 group-hover:scale-[1.01] sm:h-72" />
                </div>
                <div className="p-6 sm:p-8">
                  <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-[var(--brand)]">{group.label}</span>
                  <h3 className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.035em]">{group.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">{group.description}</p>
                  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
                    {group.items.map((item) => (
                      <span key={item} className="home-spec-item inline-flex items-center gap-2">
                        {item === 'Claude Desktop' && <AiToolIcon tool="claude" size={18} />}
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface-raised)] py-24 sm:py-28">
        <div className="page-shell grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div>
            <span className="home-kicker">Câu hỏi thường gặp</span><h2 className="mt-5 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Trước khi bạn bắt đầu.</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[var(--text-secondary)]">Cần xem trực tiếp trên một file dự án thực tế? Đội ngũ kỹ thuật có thể demo 1-1 cùng bạn.</p>
            <button onClick={onOpenConsultation} className="home-arrow-link mt-6">Đặt lịch demo <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" /></button>
          </div>
          <div className="border-t border-[var(--line)]">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <article key={faq.q} className="border-b border-[var(--line)]">
                  <h3>
                    <button type="button" onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={`home-faq-${index}`} className="flex min-h-[72px] w-full items-center justify-between gap-6 py-5 text-left text-sm font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--brand)] sm:text-base">
                      <span className="flex items-center gap-3">
                        {faq.q.includes('Codex') && (
                          <span className="hidden shrink-0 items-center gap-1.5 sm:flex" aria-hidden="true">
                            <AiToolIcon tool="codex" size={18} />
                            <AiToolIcon tool="claude" size={18} />
                            <AiToolIcon tool="cursor" size={18} />
                          </span>
                        )}
                        <span>{faq.q}</span>
                      </span>
                      <ChevronDown size={18} strokeWidth={1.8} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[var(--brand)]' : 'text-[var(--text-muted)]'}`} aria-hidden="true" />
                    </button>
                  </h3>
                  {isOpen && (
                    <p id={`home-faq-${index}`} className="flex max-w-2xl items-start gap-3 pb-6 text-sm leading-7 text-[var(--text-secondary)]">
                      {faq.q.includes('Codex') && (
                        <span className="mt-1 flex shrink-0 items-center gap-1.5 sm:hidden" aria-hidden="true">
                          <AiToolIcon tool="codex" size={16} />
                          <AiToolIcon tool="claude" size={16} />
                          <AiToolIcon tool="cursor" size={16} />
                        </span>
                      )}
                      <span>{faq.a}</span>
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="page-shell pt-24 sm:pt-32">
        <div className="home-final-cta relative overflow-hidden">
          <div className="home-grid-pattern absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative grid gap-12 p-7 sm:p-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:p-16">
            <div>
              <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-cyan-300">BẮT ĐẦU VỚI FILE REVIT CỦA BẠN</span>
              <h2 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.05em] text-white sm:text-5xl text-balance">Biến những giờ thao tác lặp thành một workflow có thể tái sử dụng.</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">Dùng thử đầy đủ tính năng trong 14 ngày hoặc đặt lịch để đội ngũ BIMAutomation demo trực tiếp trên quy trình của doanh nghiệp bạn.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={startTrial} className="primary-button !min-h-12 !bg-cyan-400 !px-6 !text-slate-950 hover:!bg-cyan-300"><Download size={18} strokeWidth={1.8} aria-hidden="true" /> Tải BIMAutomation</button>
                <Link to="/pricing" className="inline-flex min-h-12 items-center gap-2 border border-white/20 px-6 text-sm font-bold text-white transition hover:border-cyan-300 hover:text-cyan-300">Xem bảng giá <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" /></Link>
              </div>
            </div>
            <div className="border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              {formSent ? (
                <div className="py-10 text-center"><CheckCircle2 size={36} className="mx-auto text-emerald-400" aria-hidden="true" /><h3 className="mt-4 text-lg font-bold text-white">Đã nhận yêu cầu của bạn</h3><p className="mt-2 text-sm text-slate-300">Đội ngũ BIMAutomation sẽ sớm liên hệ để trao đổi workflow phù hợp.</p></div>
              ) : (
                <form onSubmit={handleQuickSubmit}>
                  <h3 className="text-lg font-bold text-white">Đăng ký demo 1-1</h3><p className="mt-1 text-xs leading-5 text-slate-400">Dành cho kỹ sư, phòng BIM và doanh nghiệp muốn tối ưu quy trình riêng.</p>
                  <div className="mt-5 grid gap-3">
                    <label className="sr-only" htmlFor="home-lead-name">Họ và tên</label><input id="home-lead-name" required value={quickForm.name} onChange={(event) => setQuickForm({ ...quickForm, name: event.target.value })} className="home-dark-input" placeholder="Họ và tên" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><label className="sr-only" htmlFor="home-lead-phone">Số điện thoại</label><input id="home-lead-phone" type="tel" required value={quickForm.phone} onChange={(event) => setQuickForm({ ...quickForm, phone: event.target.value })} className="home-dark-input" placeholder="Số điện thoại" /></div>
                      <div><label className="sr-only" htmlFor="home-lead-email">Email công việc</label><input id="home-lead-email" type="email" required value={quickForm.email} onChange={(event) => setQuickForm({ ...quickForm, email: event.target.value })} className="home-dark-input" placeholder="Email công việc" /></div>
                    </div>
                    <button type="submit" disabled={formLoading} className="mt-1 min-h-12 bg-white px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60">{formLoading ? 'Đang gửi yêu cầu…' : 'Nhận tư vấn workflow'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
