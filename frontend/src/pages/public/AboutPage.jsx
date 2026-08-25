import React from 'react';
import { Target, Award, Users, Palette, FileCode2, Download, ShieldCheck, Box, Sparkles } from 'lucide-react';

const values = [
  { icon: Target, title: 'Tầm nhìn', body: 'Trở thành hệ sinh thái Add-in & Automation hàng đầu cho ngành Xây dựng & BIM (AEC Industry).' },
  { icon: Award, title: 'Chất lượng', body: 'Mọi tính năng đều trải qua quá trình kiểm thử khắt khe trên các dự án quy mô thực tế trước khi phát hành.' },
  { icon: Users, title: 'Đồng hành', body: 'Lắng nghe đóng góp từ cộng đồng người dùng hàng tuần để cải tiến và bổ sung tính năng mới liên tục.' },
];

const brandAssets = [
  {
    name: 'Biểu Tượng Thép Cột',
    iconSrc: '/assets/brand/icons/icon-column-rebar.svg',
    category: 'Structural Rebar SVG',
    desc: 'Icon vector tiết diện cột, thép chủ so le và đai C'
  },
  {
    name: 'Biểu Tượng Thép Dầm',
    iconSrc: '/assets/brand/icons/icon-beam-rebar.svg',
    category: 'Structural Rebar SVG',
    desc: 'Icon vector dầm liên tục, đai gia cường gối và nhịp'
  },
  {
    name: 'Biểu Tượng Thép Móng',
    iconSrc: '/assets/brand/icons/icon-footing-rebar.svg',
    category: 'Structural Rebar SVG',
    desc: 'Icon vector móng đơn, chân râu bẻ mỏ và lưới thép đáy'
  },
  {
    name: 'Biểu Tượng Thép Vách',
    iconSrc: '/assets/brand/icons/icon-wall-rebar.svg',
    category: 'Structural Rebar SVG',
    desc: 'Icon vector 2 lớp thép đứng/ngang và móc giằng C'
  },
  {
    name: 'Biểu Tượng Thép Sàn',
    iconSrc: '/assets/brand/icons/icon-slab-rebar.svg',
    category: 'Structural Rebar SVG',
    desc: 'Icon vector lưới thép mũ gối, thép đáy và con kê'
  },
  {
    name: 'MCP AI Protocol Core',
    iconSrc: '/assets/brand/icons/icon-mcp-engine.svg',
    category: 'Protocol & Engine SVG',
    desc: 'Biểu tượng trung tâm điều phối 57 công cụ MCP AI'
  }
];

export default function AboutPage() {
  return (
    <div className="page-shell py-16 space-y-16">
      {/* Hero Section */}
      <div className="grid lg:grid-cols-[.85fr_1.15fr] gap-12 lg:gap-16 items-start">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--brand)] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thương hiệu & Hệ sinh thái BIMAutomation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight text-balance">
            Về sản phẩm BIMAutomation
          </h1>
          <p className="mt-5 text-[var(--text-secondary)] text-base leading-relaxed max-w-md">
            BIMAutomation ra đời với sứ mệnh đột phá: ứng dụng Trí tuệ Nhân tạo (AI) và 57 công cụ chuẩn MCP để tự động hóa toàn diện khâu mô hình hóa cốt thép 3D và triển khai bản vẽ kết cấu trong Autodesk Revit 2022–2027.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--line)] text-xs font-mono font-semibold text-[var(--text-secondary)]">
              Tab: BIMAutomation
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--line)] text-xs font-mono font-semibold text-[var(--text-secondary)]">
              Tiêu chuẩn: TCVN 5574:2018
            </span>
          </div>
        </div>

        <div className="border-t border-[var(--line)]">
          {values.map(({ icon: Icon, title, body }) => (
            <div key={title} className="py-6 border-b border-[var(--line)] flex gap-5">
              <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)] shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)] leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Identity & Vector Assets Showcase */}
      <div className="p-8 sm:p-10 rounded-2xl bg-[var(--surface-raised)] border border-[var(--line)] shadow-xs">
        <div className="max-w-2xl mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--brand)] uppercase tracking-wider mb-2">
            <Palette className="w-4 h-4" />
            <span>Brand Assets & Vector Icon Kit</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Bộ Nhận Diện Đồ Họa Kết Cấu Chuẩn Xác
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
            Hệ thống biểu tượng vector và quy chuẩn màu sắc Blueprint Navy / Electric Cyan được thiết kế chuyên biệt cho hệ sinh thái BIMAutomation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {brandAssets.map((asset) => (
            <div
              key={asset.name}
              className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--brand)] transition-all duration-200 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-[var(--surface-subtle)] border border-[var(--line)] p-2 shrink-0 flex items-center justify-center">
                <img src={asset.iconSrc} alt={asset.name} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono font-bold text-[var(--brand)] uppercase">
                  {asset.category}
                </span>
                <h4 className="text-sm font-bold text-[var(--text-primary)] truncate mt-0.5">
                  {asset.name}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-normal mt-1">
                  {asset.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
