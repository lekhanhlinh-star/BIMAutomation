import React from 'react';
import { Check, Minus, Sparkles, Star } from 'lucide-react';
import AiToolIcon from './icons/AiToolIcon';

const featureCategories = [
  {
    name: '1. Phân hệ Bố trí Cốt thép 3D (Rebar Modeling)',
    items: [
      {
        code: 'column-rebar',
        name: 'Bố trí cốt thép Cột (Column Rebar)',
        desc: 'Tự động rải thép chủ, đai bao, đai C và neo nối so le qua sàn theo TCVN 5574:2018.',
        trial: true,
        rebar: true,
        rebarAi: true,
        full: true,
        enterprise: true,
      },
      {
        code: 'beam-rebar',
        name: 'Bố trí cốt thép Dầm (Beam Rebar)',
        desc: 'Rải thép chủ chạy suốt, thép tăng cường gối/nhịp và đai dày 2 đầu dầm theo nhịp liên tục.',
        trial: true,
        rebar: true,
        rebarAi: true,
        full: true,
        enterprise: true,
      },
      {
        code: 'footing-rebar',
        name: 'Bố trí cốt thép Móng (Footing Rebar)',
        desc: 'Bố trí lưới thép đáy, lưới trên, thép chân chó và đai giằng cho đài móng cọc, móng đơn, móng băng.',
        trial: true,
        rebar: true,
        rebarAi: true,
        full: true,
        enterprise: true,
      },
      {
        code: 'wall-rebar',
        name: 'Bố trí cốt thép Vách & Tường (Wall Rebar)',
        desc: 'Rải lưới thép 2 lớp, thép đai bo viền, thép tăng cường góc và thép chờ liên kết sàn/móng.',
        trial: true,
        rebar: true,
        rebarAi: true,
        full: true,
        enterprise: true,
      },
    ],
  },
  {
    name: '2. Phân hệ Tự động Triển khai Bản vẽ Lên Sheet (Drawing Automation)',
    items: [
      {
        code: 'beam-drawing',
        name: 'Triển khai Bản vẽ Dầm liên tục (Beam Drawing)',
        desc: 'Tự động cắt mặt cắt dọc/ngang trục dầm, tạo Sheet, đặt Viewport, gắn Tag và bảng thống kê.',
        trial: true,
        rebar: true,
        rebarAi: true,
        full: true,
        enterprise: true,
      },
      {
        code: 'footing-drawing',
        name: 'Triển khai Bản vẽ Móng (Footing Drawing)',
        desc: 'Tạo mặt bằng định vị móng, trích xuất chi tiết từng đài móng và bảng thống kê uốn thép lên Sheet.',
        trial: true,
        rebar: true,
        rebarAi: true,
        full: true,
        enterprise: true,
      },
    ],
  },
  {
    name: '3. Phân hệ AI Assistant & Hệ thống 57 MCP Tools (AI & MCP Protocol)',
    items: [
      {
        code: 'chat-ai',
        name: 'Trợ lý Chat AI Assistant trong Revit',
        desc: 'Giao tiếp bằng tiếng Việt tự nhiên ngay trong giao diện Revit để ra lệnh dựng mô hình.',
        trial: true,
        rebar: false,
        rebarAi: true,
        full: true,
        enterprise: true,
      },
      {
        code: 'utility-tools',
        name: 'Bộ tiện ích Mô hình & Xử lý Excel',
        desc: 'Đọc dữ liệu bảng thép Excel, đồng bộ tham số 2 chiều và công cụ hỗ trợ mô hình hóa.',
        trial: true,
        rebar: false,
        rebarAi: true,
        full: true,
        enterprise: true,
      },
      {
        code: 'mcp-read',
        name: 'Quyền đọc mô hình qua MCP Server (mcp-read)',
        desc: 'Cho phép AI Client (Claude/Cursor) đọc cấu trúc, truy vấn cấu kiện và tham số qua cổng 8765.',
        tools: ['claude', 'cursor'],
        trial: true,
        rebar: false,
        rebarAi: true,
        full: true,
        enterprise: true,
      },
      {
        code: 'mcp-write',
        name: 'Quyền sinh thép & can thiệp an toàn qua MCP (mcp-write)',
        desc: 'Cho phép AI Client trực tiếp tạo cốt thép 3D, cắt mặt cắt và tạo Sheet trong Transaction đơn luồng.',
        trial: true,
        rebar: false,
        rebarAi: true,
        full: true,
        enterprise: true,
      },
    ],
  },
  {
    name: '4. Phân hệ CAD & Dữ liệu Nâng cao (CAD Automation & Point Cloud)',
    items: [
      {
        code: 'model-from-cad',
        name: 'Dựng mô hình Revit từ CAD (Model from CAD)',
        desc: 'Tự động quét layer và dựng cột, dầm, tường từ file DWG (Yêu cầu AutoCAD Full 2016+).',
        trial: true,
        rebar: false,
        rebarAi: false,
        full: true,
        enterprise: true,
      },
      {
        code: 'dwg-export',
        name: 'Xuất bản vẽ DWG chuẩn layer (DWG Export)',
        desc: 'Xuất hàng loạt bản vẽ sang AutoCAD theo đúng quy chuẩn layer và màu sắc công ty.',
        trial: true,
        rebar: false,
        rebarAi: false,
        full: true,
        enterprise: true,
      },
      {
        code: 'point-cloud',
        name: 'Xử lý đám mây điểm (Point Cloud Tools)',
        desc: 'Công cụ hỗ trợ định vị và mô hình hóa từ dữ liệu quét 3D laser scan.',
        trial: true,
        rebar: false,
        rebarAi: false,
        full: true,
        enterprise: true,
      },
    ],
  },
  {
    name: '5. Quyền lợi Bản quyền & Dịch vụ Hỗ trợ (License & Support)',
    items: [
      {
        code: 'devices',
        name: 'Số thiết bị kích hoạt đồng thời',
        desc: 'Chính sách quản lý thiết bị kích hoạt bản quyền.',
        trial: '1 thiết bị',
        rebar: '1 thiết bị (Đổi máy linh hoạt)',
        rebarAi: '1 thiết bị (Đổi máy linh hoạt)',
        full: '1 thiết bị (Đổi máy linh hoạt)',
        enterprise: 'Đa thiết bị cho Team (5–50+ máy)',
      },
      {
        code: 'portal',
        name: 'Cổng Quản trị License tập trung (Admin Portal)',
        desc: 'Bảng điều khiển trực tuyến cấp phát và thu hồi license cho đội ngũ kỹ sư.',
        trial: false,
        rebar: false,
        rebarAi: false,
        full: false,
        enterprise: true,
      },
      {
        code: 'customization',
        name: 'Tùy biến Preset & Quy chuẩn công ty',
        desc: 'Tùy chỉnh thư viện thông số cốt thép, quy chuẩn khung tên và nét vẽ theo tiêu chuẩn doanh nghiệp.',
        trial: false,
        rebar: false,
        rebarAi: false,
        full: 'Hỗ trợ cơ bản',
        enterprise: 'Tùy biến chuyên sâu 1-1',
      },
      {
        code: 'support',
        name: 'Kênh hỗ trợ kỹ thuật & Đào tạo',
        desc: 'Thời gian phản hồi và phương thức hỗ trợ xử lý sự cố.',
        trial: 'Cộng đồng',
        rebar: 'Email / Zalo (24h)',
        rebarAi: 'Hotline + Zalo Ưu tiên',
        full: 'Hotline + UltraViewer 24/7',
        enterprise: 'Chuyên viên riêng + Đào tạo 1-1',
      },
    ],
  },
];

function RenderCell({ value }) {
  if (value === true) {
    return (
      <div className="flex justify-center text-emerald-500">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <Check size={14} strokeWidth={2} />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center text-[var(--text-muted)] opacity-40">
        <Minus size={16} strokeWidth={1.8} />
      </div>
    );
  }
  return (
    <span className="text-xs font-semibold text-[var(--text-primary)] text-center block">
      {value}
    </span>
  );
}
export default function FeatureComparisonTable() {
  return (
    <div className="mt-16 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] bg-[var(--surface-subtle)] p-6 sm:p-8 md:flex-row md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-bold text-[var(--brand)]">
            <Sparkles size={16} strokeWidth={1.8} /> Ma trận 13 Feature Codes & 5 Gói Bản Quyền
          </div>
          <h2 className="text-xl font-extrabold leading-tight tracking-[-0.03em] text-[var(--text-primary)] sm:text-2xl">
            Bảng so sánh chi tiết tính năng BIMAutomation
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Minh bạch 100% quyền truy cập tính năng theo đúng kiến trúc Server-Authoritative của hệ thống.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[860px]">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--surface-raised)]">
              <th className="p-4 sm:p-5 text-sm font-extrabold text-[var(--text-primary)] w-[32%]">
                Tính năng / Feature Code
              </th>
              <th className="p-4 text-center text-xs font-bold text-[var(--text-secondary)] w-[13%] border-l border-[var(--line)]">
                Dùng thử
                <span className="block text-[11px] font-normal text-[var(--text-muted)]">14 ngày Free</span>
              </th>
              <th className="p-4 text-center text-xs font-bold text-[var(--text-primary)] w-[13%] border-l border-[var(--line)]">
                Cốt thép
                <span className="block text-[11px] font-normal text-[var(--text-muted)]">Rebar Suite</span>
              </th>
              <th className="p-4 text-center text-xs font-bold text-[var(--brand)] w-[16%] border-l border-[var(--line)] bg-[var(--brand-soft)]/20">
                <span className="inline-flex items-center gap-1 text-[var(--brand)]">
                  <Star size={14} strokeWidth={1.8} fill="currentColor" /> Cốt thép + AI
                </span>
                <span className="block text-[11px] font-bold text-amber-500">Khuyên dùng ★</span>
              </th>
              <th className="p-4 text-center text-xs font-bold text-[var(--text-primary)] w-[13%] border-l border-[var(--line)]">
                Full Suite
                <span className="block text-[11px] font-normal text-[var(--text-muted)]">Rebar + CAD</span>
              </th>
              <th className="p-4 text-center text-xs font-bold text-[var(--text-primary)] w-[13%] border-l border-[var(--line)]">
                Doanh nghiệp
                <span className="block text-[11px] font-normal text-[var(--text-muted)]">Enterprise</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {featureCategories.map((cat) => (
              <React.Fragment key={cat.name}>
                <tr className="bg-[var(--surface-subtle)] border-y border-[var(--line)] font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
                  <td colSpan={6} className="py-2.5 px-4 sm:px-5">
                    {cat.name}
                  </td>
                </tr>
                {cat.items.map((item) => (
                  <tr
                    key={item.code}
                    className="border-b border-[var(--line-soft)] hover:bg-[var(--surface-subtle)]/50 transition-colors text-sm"
                  >
                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[var(--text-primary)]">{item.name}</p>
                        <code className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--line)]">
                          {item.code}
                        </code>
                      </div>
                      {item.desc && (
                        <p className="mt-1 flex items-start gap-2 text-xs leading-5 text-[var(--text-secondary)]">
                          {item.tools && (
                            <span className="mt-0.5 flex shrink-0 items-center gap-1.5 text-[var(--text-primary)]" aria-hidden="true">
                              {item.tools.map((tool) => <AiToolIcon key={tool} tool={tool} size={16} />)}
                            </span>
                          )}
                          <span>{item.desc}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-2.5 border-l border-[var(--line)]">
                      <RenderCell value={item.trial} />
                    </td>
                    <td className="py-3.5 px-2.5 border-l border-[var(--line)]">
                      <RenderCell value={item.rebar} />
                    </td>
                    <td className="py-3.5 px-2.5 border-l border-[var(--line)] bg-[var(--brand-soft)]/10">
                      <RenderCell value={item.rebarAi} />
                    </td>
                    <td className="py-3.5 px-2.5 border-l border-[var(--line)]">
                      <RenderCell value={item.full} />
                    </td>
                    <td className="py-3.5 px-2.5 border-l border-[var(--line)]">
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
