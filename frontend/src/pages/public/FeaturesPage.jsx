import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowRight,
  Play,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { savePendingIntent } from '../../utils/pendingIntent';
import AiToolIcon from '../../components/icons/AiToolIcon';

const workflows = [
  {
    id: 'rebar',
    index: '01',
    shortTitle: 'Vẽ cốt thép',
    eyebrow: 'Cốt thép kết cấu',
    title: 'Kết thúc việc vẽ từng thanh thép bằng tay.',
    description:
      'Chọn cấu kiện hoặc gọi tên hệ cột, BIMAutomation áp cấu hình đã lưu để dựng thép đồng loạt. Với dầm, bạn có thể đưa thẳng bảng Excel đang dùng vào quy trình.',
    highlights: ['Cột theo tên hệ và preset', 'Dầm từ bảng Excel', 'Vách, sàn và móng'],
    image: '/assets/product/real/column-rebar-revit-2025.jpg',
    imageAlt: 'Cửa sổ Vẽ Thép Cột của BIMAutomation hiển thị cấu hình theo tầng và review 2D trong Revit 2025',
  },
  {
    id: 'drawing',
    index: '02',
    shortTitle: 'Triển khai bản vẽ',
    eyebrow: 'Model đến sheet',
    title: 'Đi tiếp từ mô hình đến bản vẽ, không ngắt mạch.',
    description:
      'Sau khi dựng thép, tiếp tục tạo mặt cắt dọc, mặt cắt ngang và bố trí lên sheet. Đội ngũ giảm thời gian căn viewport, gắn tag và lặp lại bố cục.',
    highlights: ['Mặt cắt dầm liên tục', 'Bản vẽ và mặt cắt móng', 'Bố trí view trên sheet'],
    image: '/assets/product/real/beam-rebar-revit-2025.jpg',
    imageAlt: 'Cửa sổ Quick Setting của BIMAutomation để cấu hình thép dầm và tùy chọn tạo drawing sheet trong Revit 2025',
  },
  {
    id: 'footing',
    index: '03',
    shortTitle: 'Vẽ thép móng',
    eyebrow: 'Móng và đài móng',
    title: 'Cấu hình các lớp thép móng và xem trước trước khi tạo.',
    description:
      'Thiết lập lớp dưới, lớp trên, lớp giữa và các thanh gia cường ngay trong cửa sổ plugin. Review 3D giúp kỹ sư kiểm tra bố trí trước khi ghi vào mô hình.',
    highlights: ['Nhiều lớp cốt thép', 'Lớp bê tông bảo vệ', 'Review 3D trước khi tạo'],
    image: '/assets/product/real/footing-rebar-revit-2025.jpg',
    imageAlt: 'Cửa sổ Isolated Footing của BIMAutomation với cấu hình lớp thép và review 3D trong Revit 2025',
  },
  {
    id: 'ai',
    index: '04',
    shortTitle: 'Workflow cùng AI',
    eyebrow: 'Codex, Claude và MCP clients',
    title: 'Biến một yêu cầu thành nhiều bước Revit có kiểm soát.',
    description:
      'Dùng AI client bạn quen để yêu cầu công việc bằng ngôn ngữ tự nhiên. BIMAutomation chọn đúng plugin, đưa yêu cầu vào Revit và chờ bạn xác nhận trước khi thay đổi mô hình.',
    highlights: ['Dùng câu lệnh tiếng Việt', 'Phối hợp nhiều plugin', 'Bạn giữ quyền duyệt cuối'],
    image: '/assets/product/real/mcp-server-revit-2025.jpg',
    imageAlt: 'Cửa sổ RevitAPP MCP Server đang chạy với danh sách tool và cấu hình Claude Desktop trong Revit 2025',
  },
];

function WorkflowVisual({ workflow }) {
  return (
    <figure className="features-real-shot">
      <img src={workflow.image} alt={workflow.imageAlt} loading="lazy" />
      <figcaption><span>Ảnh chụp trực tiếp</span> Autodesk Revit 2025 · BIMAutomation đang chạy trong file dự án</figcaption>
    </figure>
  );
}

export default function FeaturesPage() {
  const [activeWorkflow, setActiveWorkflow] = useState('rebar');
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const onOpenConsultation = outletContext?.onOpenConsultation || (() => {});
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const selectedWorkflow = workflows.find((workflow) => workflow.id === activeWorkflow) || workflows[0];

  const startTrial = () => {
    if (isAuthenticated) return navigate('/download');
    savePendingIntent({ type: 'download', returnTo: '/download' });
    navigate('/login');
  };

  return (
    <div className="features-page pb-24 sm:pb-32">
      <section className="features-hero relative overflow-hidden border-b border-[var(--line)]">
        <div className="home-grid-pattern absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="page-shell relative grid items-center gap-12 py-16 sm:py-24 xl:min-h-[680px] xl:grid-cols-[0.9fr_1.1fr] xl:gap-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 text-xs font-semibold text-[var(--text-secondary)]">
              <span className="h-px w-8 bg-[var(--brand)]" />
              <span>Một hệ plugin cho công việc Revit hằng ngày</span>
            </div>
            <h1 className="max-w-3xl text-[clamp(2.75rem,6vw,5.25rem)] font-extrabold leading-[1.02] tracking-[-0.055em] text-balance">
              Nhiều giờ thao tác.
              <span className="mt-2 block text-[var(--brand)]">Được trả lại cho kỹ sư.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg sm:leading-8">
              BIMAutomation gom các công việc lặp lại—vẽ cốt thép, triển khai bản vẽ, chuyển dữ liệu CAD và điều khiển bằng AI—thành những workflow dễ dùng và dễ kiểm soát.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button onClick={startTrial} className="primary-button !min-h-12 !px-6 whitespace-nowrap">
                Dùng thử miễn phí <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <button onClick={onOpenConsultation} className="home-text-link min-h-12 px-4 text-sm font-semibold whitespace-nowrap">
                <Play size={18} strokeWidth={1.8} className="text-[var(--brand)]" aria-hidden="true" /> Xem demo theo workflow
              </button>
            </div>
          </div>

          <figure className="features-hero-shot">
            <img src="/assets/product/real/wall-rebar-revit-2025.jpg" alt="BIMAutomation đang cấu hình thép vách và review 3D trực tiếp trong Revit 2025" />
            <figcaption><span>Giao diện đang chạy</span> Cấu hình thép vách, mặt cắt và review 3D trong cùng cửa sổ Revit.</figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface-raised)]">
        <div className="page-shell grid grid-cols-2 divide-x divide-[var(--line)] sm:grid-cols-4">
          {[
            ['5', 'nhóm cấu kiện cốt thép'],
            ['18', 'lệnh trực tiếp trên Ribbon'],
            ['57', 'hành động sẵn sàng cho AI'],
            ['2022–2027', 'các phiên bản Revit hỗ trợ'],
          ].map(([number, label]) => (
            <div key={label} className="px-3 py-6 text-center sm:px-5 sm:py-8">
              <strong className="font-mono text-xl font-bold text-[var(--text-primary)] sm:text-2xl">{number}</strong>
              <span className="mx-auto mt-1 block max-w-[150px] text-[10px] leading-4 text-[var(--text-secondary)] sm:text-xs">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell py-24 sm:py-32" id="workflows">
        <div className="max-w-3xl">
          <span className="home-kicker">Bạn muốn rút ngắn việc nào?</span>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl text-balance">
            Bắt đầu từ kết quả bạn cần, không phải từ tên công cụ.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            Mỗi workflow kết hợp nhiều thao tác Revit thành một luồng rõ ràng. Bạn vẫn có thể dùng từng plugin riêng trên Ribbon khi muốn kiểm soát chi tiết.
          </p>
        </div>

        <div className="mt-12 grid border-y border-[var(--line)] md:grid-cols-4 md:divide-x md:divide-[var(--line)]">
          {workflows.map((workflow) => {
            const isActive = activeWorkflow === workflow.id;
            return (
              <button
                key={workflow.id}
                type="button"
                onClick={() => setActiveWorkflow(workflow.id)}
                aria-pressed={isActive}
                className={`group flex min-h-20 items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-4 text-left transition-colors last:border-b-0 md:border-b-0 ${isActive ? 'bg-[var(--brand)] text-[var(--brand-text)]' : 'hover:bg-[var(--surface-raised)]'}`}
              >
                <span className="text-xs font-bold sm:text-sm">{workflow.shortTitle}</span>
                <span className={`font-mono text-[10px] ${isActive ? 'opacity-70' : 'text-[var(--text-muted)]'}`}>/{workflow.index}</span>
              </button>
            );
          })}
        </div>

        <div className="features-workflow-stage mt-8 grid overflow-hidden xl:grid-cols-[0.92fr_1.08fr]">
          <div className="p-6 sm:p-10 xl:p-14">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold tracking-[0.14em] text-[var(--brand)]">
              {selectedWorkflow.id === 'ai' && (
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  <AiToolIcon tool="codex" size={16} />
                  <AiToolIcon tool="claude" size={16} />
                  <AiToolIcon tool="cursor" size={16} />
                </span>
              )}
              <span>{selectedWorkflow.eyebrow}</span>
            </div>
            <h3 className="mt-4 max-w-xl text-2xl font-extrabold leading-tight tracking-[-0.035em] sm:text-4xl text-balance">{selectedWorkflow.title}</h3>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{selectedWorkflow.description}</p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {selectedWorkflow.highlights.map((item) => (
                <li key={item} className="features-spec-item">{item}</li>
              ))}
            </ul>
            <Link to="/tutorials" className="home-arrow-link mt-8">Xem cách workflow hoạt động <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" /></Link>
          </div>

          <div className="features-workflow-visual">
            <WorkflowVisual workflow={selectedWorkflow} />
          </div>
        </div>
      </section>

      <section className="features-ai-section py-24 sm:py-32">
        <div className="page-shell grid items-center gap-14 xl:grid-cols-[1.05fr_0.95fr] xl:gap-24">
          <div>
            <span className="home-kicker !text-cyan-300">Plugin tốt hơn khi làm việc cùng nhau</span>
            <h2 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.045em] text-white sm:text-5xl text-balance">
              Từ một câu lệnh đến một kết quả có thể kiểm tra.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              <span className="inline-flex items-center gap-1.5 font-semibold text-white"><AiToolIcon tool="codex" size={18} />Codex</span>,{' '}
              <span className="inline-flex items-center gap-1.5 font-semibold text-white"><AiToolIcon tool="claude" size={18} />Claude</span> hoặc{' '}
              <span className="inline-flex items-center gap-1.5 font-semibold text-white"><AiToolIcon tool="cursor" size={18} />Cursor</span> có thể là nơi bạn bắt đầu. BIMAutomation kết nối yêu cầu đó với hệ plugin và đưa bước xác nhận cuối cùng trở lại Revit.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {['Codex', 'Claude', 'Cursor'].map((client) => (
                <span key={client} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-bold text-slate-100 shadow-sm">
                  <AiToolIcon tool={client.toLowerCase()} size={18} />
                  {client}
                </span>
              ))}
            </div>
          </div>

          <div className="features-ai-steps">
            {[
              ['01', 'Nói việc cần hoàn thành', 'Dùng câu lệnh tự nhiên hoặc gọi workflow đã quen.'],
              ['02', 'BIMAutomation phối hợp plugin', 'Đọc dữ liệu, chọn cấu kiện và chạy đúng công cụ cần thiết.'],
              ['03', 'Bạn duyệt kết quả', 'Kiểm tra trước khi những thay đổi quan trọng được đưa vào mô hình.'],
            ].map(([number, title, description]) => (
              <article key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-24 sm:py-32">
        <div className="features-final-cta">
          <div>
            <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-cyan-300">WORKFLOW CỦA MỖI ĐỘI NGŨ LÀ KHÁC NHAU</span>
            <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.045em] text-white sm:text-5xl text-balance">Đưa file mẫu của bạn. Chúng tôi demo trên đúng công việc đó.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">Dành cho kỹ sư, phòng BIM và doanh nghiệp muốn đánh giá BIMAutomation trên preset, bảng Excel và quy chuẩn hồ sơ đang sử dụng.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <button onClick={onOpenConsultation} className="primary-button !min-h-12 !bg-cyan-400 !px-6 !text-slate-950 hover:!bg-cyan-300">Đặt lịch demo 1-1 <ArrowRight size={18} strokeWidth={1.8} /></button>
            <button onClick={startTrial} className="inline-flex min-h-12 items-center justify-center border border-white/20 px-6 text-sm font-bold text-white transition hover:border-cyan-300 hover:text-cyan-300">Tải bản dùng thử</button>
          </div>
        </div>
      </section>
    </div>
  );
}
