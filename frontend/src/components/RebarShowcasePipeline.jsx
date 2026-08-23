import React, { useState } from 'react';
import { 
  Box, 
  Layers, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  Tag, 
  Sparkles, 
  ChevronRight, 
  Play, 
  RotateCcw, 
  Cpu, 
  Grid, 
  Building2, 
  TableProperties,
  Maximize2
} from 'lucide-react';

const REBAR_TOOLS = [
  {
    id: 'column',
    name: 'AI Column Rebar',
    element: 'Cột Bê Tông Cốt Thép',
    tag: 'CR • column-rebar',
    iconSrc: '/assets/brand/icons/icon-column-rebar.svg',
    specs: 'Thép chủ 12Φ20–Φ32 • Đai 3 vùng a100/a200 • Đai C chống phình',
    description: 'Đọc tiết diện cột, phân loại cột góc/biên/giữa, rải thép chủ so le 50% tự động.',
    features: [
      'Neo nối so le 50% theo TCVN 5574:2018',
      'Đai 3 vùng tự động, đai lồng cho cột lớn'
    ],
    mcpTool: 'create_column_rebar'
  },
  {
    id: 'beam',
    name: 'AI Beam Rebar',
    element: 'Dầm Liên Tục Nhiều Nhịp',
    tag: 'BR • beam-rebar',
    iconSrc: '/assets/brand/icons/icon-beam-rebar.svg',
    specs: 'Thép gối L/3 • Thép nhịp L/2 neo 30Φ • Đai gia cường 2h',
    description: 'Nhận diện dầm liên tục trên trục, đọc file Excel hoặc preset để chia thép gối, thép nhịp tự động.',
    features: [
      'Thép gối trên và thép nhịp dưới neo đúng chuẩn',
      'Đai dày ở 2 đầu dầm, thưa dần vào giữa nhịp'
    ],
    mcpTool: 'create_beam_rebar'
  },
  {
    id: 'footing',
    name: 'AI Footing Rebar',
    element: 'Móng Đơn, Móng Băng, Móng Bè',
    tag: 'FR • footing-rebar',
    iconSrc: '/assets/brand/icons/icon-footing-rebar.svg',
    specs: 'Lưới đáy bẻ mỏ 90° • Lưới trên • Chân chó Bar Chair Φ12/Φ14',
    description: 'Bố trí lưới thép đáy và lưới trên cho móng chịu uốn 2 chiều, tự động chèn chân chó đỡ lưới.',
    features: [
      'Lưới đáy 2 phương bẻ móc neo an toàn',
      'Đai bo viền đài và râu thép chờ cổ cột'
    ],
    mcpTool: 'create_footing_rebar'
  },
  {
    id: 'wall',
    name: 'AI Wall Rebar',
    element: 'Vách Thang Máy & Vách Bê Tông',
    tag: 'WR • wall-rebar',
    iconSrc: '/assets/brand/icons/icon-wall-rebar.svg',
    specs: '2 Lớp lưới đứng/ngang • Cột biên ẩn đai kín • Gia cường mép cửa',
    description: 'Nhận diện vách và lỗ mở cửa, rải 2 lớp lưới thép đứng/ngang, gia cường mép lỗ mở tự động.',
    features: [
      '2 lớp lưới thép đứng và ngang kèm đai liên kết',
      'Cột biên ẩn và gia cường quanh lỗ mở'
    ],
    mcpTool: 'create_wall_rebar'
  },
  {
    id: 'slab',
    name: 'AI Slab Rebar',
    element: 'Sàn Bê Tông Toàn Khối',
    tag: 'SR • utility-tools',
    iconSrc: '/assets/brand/icons/icon-slab-rebar.svg',
    specs: 'Sàn 2 lớp toàn khối • Thép mũ gối qua dầm • Gia cường góc 45°',
    description: 'Đọc đường bao sàn, nhận diện chiều dày và dầm biên, rải thép lớp dưới và thép mũ gối tự động.',
    features: [
      'Thép lớp dưới 2 phương bám sát đường bao sàn',
      'Thép mũ gối và gia cường quanh lỗ mở kỹ thuật'
    ],
    mcpTool: 'create_slab_rebar'
  }
];

const BEAM_PIPELINE_STEPS = [
  {
    step: 1,
    title: 'Chọn Dầm Trên Trục',
    action: 'get_selected_elements()',
    desc: 'Kỹ sư chọn 4 đoạn dầm trực tiếp trên màn hình Revit.',
    output: 'Trả về mảng ElementId: [10231, 10232, 10233, 10234]'
  },
  {
    step: 2,
    title: 'Cách Ly & Sắp Xếp Trục Liên Tục',
    action: 'isolate_continuous_beam_axis("Trục 3")',
    desc: 'Thuật toán hình học sắp xếp dầm liên tục từ gối trục 1 đến gối trục 4 (Tổng nhịp 28.5m).',
    output: 'Tạo chuỗi dầm liên tục D1-D2-D3-D4 với tọa độ gối tựa chính xác'
  },
  {
    step: 3,
    title: 'Đọc Bảng Thép Excel / Preset',
    action: 'read_rebar_excel_table("BangThepDam_T2.xlsx")',
    desc: 'Phân tích đường kính, số lượng thanh và vị trí cắt uốn theo Mark từng dầm.',
    output: 'Khớp dữ liệu: D1 (3Φ22+2Φ20), D2 (3Φ22+2Φ20), đai Φ8a100/150'
  },
  {
    step: 4,
    title: 'Mô Hình Hóa Thép 3D Hoàn Chỉnh',
    action: 'create_beam_rebar(...)',
    desc: 'Tạo thép gối trên, thép nhịp dưới, thép giá, đai dày 2 đầu dầm trong Transaction an toàn.',
    output: 'Sinh 48 thanh thép chủ 3D và 180 bộ đai chuẩn RebarShape'
  },
  {
    step: 5,
    title: 'Tạo Mặt Cắt Dọc Dầm',
    action: 'ViewSection.Create(Longitudinal)',
    desc: 'Tự động cắt dọc tâm trục dầm, ẩn các cấu kiện không liên quan, gán View Template dầm.',
    output: 'Tạo View "Mặt cắt dọc Dầm Trục 3" tỷ lệ 1:50'
  },
  {
    step: 6,
    title: 'Tạo Các Mặt Cắt Ngang Gối / Nhịp',
    action: 'ViewSection.Create(Transverse)',
    desc: 'Tự động tạo các mặt cắt ngang đại diện qua vị trí gối tựa và giữa nhịp mỗi dầm.',
    output: 'Tạo 8 mặt cắt ngang chi tiết (1-1, 2-2, 3-3, 4-4...)'
  },
  {
    step: 7,
    title: 'Tạo Sheet & Khung Tên Titleblock',
    action: 'generate_beam_drawing_sheet(...)',
    desc: 'Khởi tạo Sheet mới (ví dụ KC-201) với Khung tên A1 tiêu chuẩn của công ty.',
    output: 'Tạo Sheet KC-201: "CHI TIẾT DẦM TRỤC 3 - TẦNG 2"'
  },
  {
    step: 8,
    title: 'Bố Trí Viewport & Gắn Rebar Tag',
    action: 'tag_rebar_elements(view_id=...)',
    desc: 'Căn chỉnh mặt cắt dọc và mặt cắt ngang thẳng hàng, tự động gắn Rebar Tag và kích thước Dim.',
    output: 'Gắn 56 nhãn thép Rebar Tag có Leader không bị chồng chéo'
  },
  {
    step: 9,
    title: 'Chèn Bảng Rebar Schedule',
    action: 'create_rebar_schedule(...)',
    desc: 'Tự động tính tổng trọng lượng thép dầm và đặt bảng thống kê uốn vào góc phải dưới của Sheet.',
    output: 'Bảng thống kê thép: Tổng trọng lượng 1.85 Tấn (CB400-V & CB240-T)'
  }
];

const FOOTING_PIPELINE_STEPS = [
  {
    step: 1,
    title: 'Chọn Nhóm Đài Móng',
    action: 'get_selected_elements()',
    desc: 'Chọn các đài móng đơn M1–M8 trên mặt bằng kết cấu móng.',
    output: 'Nhận diện 8 đối tượng Structural Foundations'
  },
  {
    step: 2,
    title: 'Áp Dụng Preset Móng V1',
    action: 'create_footing_rebar(preset="V1")',
    desc: 'Tạo lưới thép đáy 2 phương Φ14a150 bẻ mỏ 90°, lưới trên Φ12a200, chân chó Bar Chair và đai bo.',
    output: 'Hoàn thành mô hình hóa 3D cho 8 đài móng M1–M8'
  },
  {
    step: 3,
    title: 'Tạo Sheet Chi Tiết Móng',
    action: 'generate_footing_drawing_sheet(...)',
    desc: 'Tạo Sheet mới KC-101 với khung tên chuẩn A1.',
    output: 'Tạo Sheet KC-101: "CHI TIẾT MÓNG ĐƠN M1-M8"'
  },
  {
    step: 4,
    title: 'Tạo Mặt Bằng Định Vị Móng',
    action: 'CreateFoundationPlanView()',
    desc: 'Cắt mặt bằng cao độ đáy đài, gắn Tag móng và kích thước khoảng cách trục.',
    output: 'Mặt bằng định vị móng tỷ lệ 1:100 đặt lên Sheet'
  },
  {
    step: 5,
    title: 'Tạo Mặt Cắt 1-1 & 2-2 Qua Đài',
    action: 'CreateFootingSections()',
    desc: 'Cắt dọc và cắt ngang qua đài móng, hiển thị rõ lớp bê tông lót, lưới thép và râu cột.',
    output: '2 Mặt cắt chi tiết tỷ lệ 1:25 đặt thẳng hàng'
  },
  {
    step: 6,
    title: 'Đặt Viewport & Bảng Thống Kê Thép',
    action: 'create_rebar_schedule(footing_ids=...)',
    desc: 'Căn chỉnh hoàn thiện bản vẽ, gắn bảng thống kê uốn thép móng tự động.',
    output: 'Xuất bản hồ sơ bản vẽ móng hoàn chỉnh 100% sẵn sàng in'
  }
];

export default function RebarShowcasePipeline() {
  const [activeTab, setActiveTab] = useState('tools'); // 'tools' | 'beam_pipeline' | 'footing_pipeline'
  const [selectedToolId, setSelectedToolId] = useState('beam');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const selectedTool = REBAR_TOOLS.find(t => t.id === selectedToolId) || REBAR_TOOLS[0];
  const activePipelineSteps = activeTab === 'footing_pipeline' ? FOOTING_PIPELINE_STEPS : BEAM_PIPELINE_STEPS;
  const currentStep = activePipelineSteps[currentStepIndex] || activePipelineSteps[0];

  const handleNextStep = () => {
    if (currentStepIndex < activePipelineSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setCurrentStepIndex(0);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12" id="rebar-showcase-pipeline">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI REBAR ENGINES & SHEET PIPELINE</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          5 Công Cụ AI Vẽ Thép & Chuỗi Triển Khai Sheet Liên Tục
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Từ câu lệnh đến mô hình 3D và bản vẽ Sheet hoàn chỉnh.
        </p>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        <button
          onClick={() => {
            setActiveTab('tools');
            setCurrentStepIndex(0);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === 'tools'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25 scale-[1.02]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>5 Công Cụ AI Cốt Lõi (Cột, Dầm, Móng, Vách, Sàn)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('beam_pipeline');
            setCurrentStepIndex(0);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === 'beam_pipeline'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25 scale-[1.02]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Chuỗi Triển Khai Bản Vẽ Dầm (9 Bước)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('footing_pipeline');
            setCurrentStepIndex(0);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === 'footing_pipeline'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25 scale-[1.02]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Chuỗi Triển Khai Bản Vẽ Móng (6 Bước)</span>
        </button>
      </div>

      {/* Mode 1: 5 Core AI Tools Showcase */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Tool Selector List */}
          <div className="lg:col-span-4 space-y-2">
            {REBAR_TOOLS.map((tool) => {
              const isSelected = selectedToolId === tool.id;
              return (
                <div
                  key={tool.id}
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-white dark:bg-[#0c1424] border-sky-500 shadow-md shadow-sky-500/15 ring-1 ring-sky-500'
                      : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-[#0a1220]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-1.5 shrink-0 flex items-center justify-center">
                    <img src={tool.iconSrc} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {tool.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 shrink-0">
                        {tool.tag}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      {tool.element}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tool Detail Presentation Card */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-2 shrink-0 flex items-center justify-center shadow-xs">
                    <img src={selectedTool.iconSrc} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-sky-500 uppercase">
                      Cấu Kiện: {selectedTool.element}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedTool.name}
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Tool: {selectedTool.mcpTool}
                </span>
              </div>

              {/* Specs Badge */}
              <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 mb-4 text-xs font-mono font-bold text-sky-800 dark:text-sky-300">
                {selectedTool.specs}
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {selectedTool.description}
              </p>

              {/* Feature Highlights */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 dark:text-slate-500">
                  Quy Chuẩn Kỹ Thuật (TCVN 5574:2018):
                </h4>
                {selectedTool.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Trigger Callout */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>Hỗ trợ: Autodesk Revit 2022–2027</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Native STA Safe</span>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2 & 3: Interactive Step-by-Step Sheet Generation Pipeline */}
      {(activeTab === 'beam_pipeline' || activeTab === 'footing_pipeline') && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in">
          {/* Pipeline Step Navigator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                {activeTab === 'beam_pipeline' ? 'Quy Trình Khai Triển Dầm Liên Tục Lên Sheet' : 'Quy Trình Khai Triển Móng Lên Sheet'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                Bước {currentStepIndex + 1} / {activePipelineSteps.length}
              </span>
            </div>

            {/* Horizontal Steps Bar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-1.5">
              {activePipelineSteps.map((st, sIdx) => {
                const isActive = currentStepIndex === sIdx;
                const isPassed = currentStepIndex > sIdx;
                return (
                  <button
                    key={st.step}
                    onClick={() => setCurrentStepIndex(sIdx)}
                    className={`p-2 rounded-lg text-center transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-sky-500 text-slate-950 font-bold border-sky-500 shadow-md shadow-sky-500/20'
                        : isPassed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-[10px] font-mono">BƯỚC {st.step}</div>
                    <div className="text-[11px] truncate mt-0.5">{st.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Content Card */}
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-slate-800/90 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-sky-500 text-slate-950 font-mono font-extrabold text-xs flex items-center justify-center">
                  {currentStep.step}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {currentStep.title}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-slate-300 dark:border-slate-700">
                {currentStep.action}
              </span>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
              {currentStep.desc}
            </p>

            <div className="p-3 rounded-lg bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <span className="text-slate-400 uppercase mr-2">Kết quả thực thi:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {currentStep.output}
              </span>
            </div>
          </div>

          {/* Pipeline Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Bước Trước
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStepIndex(0)}
                title="Bắt đầu lại từ bước 1"
                className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextStep}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentStepIndex === activePipelineSteps.length - 1 ? 'Bắt Đầu Lại' : 'Bước Tiếp Theo →'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
