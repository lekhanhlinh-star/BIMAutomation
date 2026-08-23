import React, { useState } from 'react';
import { 
  Cpu, 
  Layers, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Lock, 
  GitBranch, 
  Eye, 
  Server, 
  Terminal, 
  Sparkles, 
  ChevronRight,
  Code2,
  FileCode2
} from 'lucide-react';

const PILLARS = [
  {
    id: 'pillar-1',
    number: '01',
    title: 'Direct .NET C# Engine Execution',
    headline: 'Xử Lý Nhanh Gấp 10-20 Lần Script Thường (Direct C# Native)',
    badge: 'High-Performance',
    icon: Cpu,
    color: 'from-blue-500 to-cyan-500',
    summary: 'Không sinh file script tạm — lệnh AI chạy thẳng bằng mã .NET native trong tiến trình Revit.',
    details: [
      'Nhanh gấp 10-20 lần so với script Dynamo/Python thông dịch.',
      'Chạy ổn định trên mọi bản Revit 2022-2027.'
    ],
    technicalProof: 'Direct DLL Invocation • Native .NET CLR • Zero Temporary Files'
  },
  {
    id: 'pillar-2',
    number: '02',
    title: 'Revit STA Threading & ExternalEvent Queue',
    headline: 'Không Bao Giờ Treo Hay Crash Revit (Đơn Luồng STA)',
    badge: 'Zero Crash Risk',
    icon: Layers,
    color: 'from-sky-500 to-indigo-500',
    summary: 'Mọi lệnh ghi mô hình xếp hàng đợi chuẩn của Revit, không chạy chen ngang.',
    details: [
      'Revit chỉ xử lý khi tiến trình rảnh, đúng chuẩn Single-Threaded của Autodesk.',
      'Không khóa luồng hay treo giao diện dù mô hình có hàng nghìn cấu kiện.'
    ],
    technicalProof: 'IExternalEventHandler • ExternalEvent.Raise() • Main UI Thread Safe'
  },
  {
    id: 'pillar-3',
    number: '03',
    title: 'Transaction Ownership & Auto-Rollback',
    headline: 'Sai Là Hoàn Tác Ngay, Không Hỏng Mô Hình (Atomic Rollback)',
    badge: 'Atomic Safety',
    icon: RotateCcw,
    color: 'from-emerald-500 to-teal-500',
    summary: 'Mỗi lệnh AI nằm trong một transaction riêng — lỗi thì tự rollback 100%.',
    details: [
      'Hủy lệnh hoặc gặp lỗi dữ liệu, mô hình quay về trạng thái trước đó ngay lập tức.',
      'Vẫn dùng được Ctrl+Z như bình thường.'
    ],
    technicalProof: 'Transaction.Start() • RollBack() on Error • Native Revit Undo Stack'
  },
  {
    id: 'pillar-4',
    number: '04',
    title: 'Server-Authoritative License & Gate',
    headline: 'Bản Quyền & Quyền Ghi Mô Hình Được Kiểm Soát Chặt',
    badge: 'Strict Security',
    icon: Lock,
    color: 'from-amber-500 to-orange-500',
    summary: 'Công cụ đọc và công cụ ghi mô hình tách riêng, license được xác thực real-time.',
    details: [
      'Công cụ chỉ đọc thì không bao giờ đổi được dữ liệu.',
      'Công cụ ghi thép bắt buộc license hợp lệ, chống dùng chung tài khoản.'
    ],
    technicalProof: 'mcp-read vs mcp-write Gating • SHA-256 Hardware ID • OAuth 2.0 PKCE'
  },
  {
    id: 'pillar-5',
    number: '05',
    title: 'Safe In-Revit Confirmation Prompt',
    headline: 'Bạn Luôn Là Người Bấm Xác Nhận Cuối Cùng (In-Revit Preview)',
    badge: 'Human-in-the-Loop',
    icon: Eye,
    color: 'from-rose-500 to-purple-500',
    summary: 'Trước khi tạo thép, add-in luôn hiện bảng tổng hợp để bạn kiểm tra và duyệt.',
    details: [
      'Xem số lượng, đường kính, khối lượng thép ước tính trước khi commit.',
      'Một cú nhấp: Xem trước, Xác nhận hoặc Hủy bỏ.'
    ],
    technicalProof: 'Visual Preview Dialog • Pre-Commit Element Summary • 1-Click Approval'
  }
];

export default function WhyAiDrawsRebar() {
  const [activePillarId, setActivePillarId] = useState('pillar-1');
  const [compareMode, setCompareMode] = useState('architectural'); // 'architectural' | 'comparison'

  const activePillar = PILLARS.find(p => p.id === activePillarId) || PILLARS[0];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12" id="why-ai-draws-rebar">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RELIABILITY & ARCHITECTURAL SAFETY</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Vì Sao AI Vẽ Được Thép An Toàn & Chuẩn Xác?
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          5 lý do BIMAutomation vẽ thép nhanh mà không gây lỗi mô hình hay crash Revit.
        </p>
      </div>

      {/* Mode Switcher Pills */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setCompareMode('architectural')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            compareMode === 'architectural'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25 scale-[1.02]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          5 Trụ Cột Kiến Trúc Kỹ Thuật
        </button>
        <button
          onClick={() => setCompareMode('comparison')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            compareMode === 'comparison'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25 scale-[1.02]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          So Sánh Với Script Truyền Thống
        </button>
      </div>

      {compareMode === 'architectural' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 5 Pillars List Selector */}
          <div className="lg:col-span-5 space-y-2.5">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isSelected = activePillarId === pillar.id;
              return (
                <div
                  key={pillar.id}
                  onClick={() => setActivePillarId(pillar.id)}
                  className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-white dark:bg-[#0c1424] border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500'
                      : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-[#0a1220] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-lg flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-sky-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400">
                        TRỤ CỘT {pillar.number}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.2 rounded font-bold ${
                          isSelected
                            ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {pillar.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {pillar.summary}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep Architectural Focus Card */}
          <div className="lg:col-span-7 rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl font-black font-mono text-sky-500 flex-shrink-0">
                    {activePillar.number}
                  </span>
                  <span className="h-4 w-px bg-slate-300 dark:bg-slate-700 flex-shrink-0" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                    {activePillar.title}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
                  {activePillar.badge}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-3">
                {activePillar.headline}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {activePillar.summary}
              </p>

              {/* Technical Points List */}
              <div className="space-y-3 mb-6">
                {activePillar.details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Verification Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 sm:justify-between">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Terminal className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Đặc Tả Kỹ Thuật:
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 break-words sm:text-right">
                  {activePillar.technicalProof}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Comparison Mode: Traditional Scripting vs BIMAutomation Architecture */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Box 1: Traditional Scripting */}
          <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="text-base sm:text-lg font-bold text-rose-950 dark:text-rose-200">
                Script Dynamo / Python Rời Rạc (Truyền Thống)
              </h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Tạo ra các file macro hoặc script trung gian dễ lỗi phiên bản khi nâng cấp Revit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Chạy ngầm không qua `IExternalEventHandler`, dễ gây xung đột luồng và crash Revit đột ngột.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Không có cơ chế Transaction an toàn — khi lỗi phải tắt file Revit hoặc sửa thủ công từng thanh.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Không có hộp thoại xác nhận tổng hợp khối lượng trước khi cam kết thay đổi mô hình.</span>
              </li>
            </ul>
          </div>

          {/* Box 2: BIMAutomation Native Engine */}
          <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base sm:text-lg font-bold text-emerald-950 dark:text-emerald-200">
                Kiến Trúc Native Engine BIMAutomation (MCP Standard)
              </h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Gọi thẳng DLL C# .NET tối ưu hóa Native, không sinh file tạm, tốc độ mili-giây.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Đồng bộ hóa qua `ExternalEvent` STA Queue chuẩn Autodesk, đảm bảo độ ổn định 100%.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Đóng gói trong Transaction định danh, tự động `RollBack()` ngay lập tức nếu có bất kỳ lỗi nào.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Hộp thoại xác nhận an toàn trong Revit hiển thị tổng số thanh thép trước khi người dùng bấm Lưu.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
