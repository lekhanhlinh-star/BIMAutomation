import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Layers, 
  FileSpreadsheet, 
  Building2, 
  ArrowRight,
  Database,
  Sliders
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'column-c7',
    tag: 'Preset Cột',
    title: 'Hệ cột C7 theo cấu hình lưu',
    prompt: 'Vẽ hệ cột C7 theo cấu hình đã lưu',
    icon: Building2,
    color: 'from-blue-500 to-cyan-500',
    description: 'Dò tìm Instance Mark = C7 trên toàn bộ mô hình, đọc tiết diện 500x500mm, rải 12Φ20 neo nối so le 50% và bố trí đai 3 vùng theo TCVN 5574:2018.',
    tools: ['query_elements_by_category', 'create_column_rebar', 'modify_rebar_parameters'],
    logs: [
      { time: '0.0s', type: 'cmd', text: 'Nhận lệnh: "Vẽ hệ cột C7 theo cấu hình đã lưu"' },
      { time: '0.3s', type: 'tool', text: 'query_elements_by_category("Structural Columns", mark_filter="C7")' },
      { time: '0.6s', type: 'info', text: 'Tìm thấy 16 cột C7 trên các tầng 1, 2, 3, 4, 5' },
      { time: '0.9s', type: 'tool', text: 'create_column_rebar(column_ids=[...], preset_name="C7_STANDARD")' },
      { time: '1.2s', type: 'trans', text: 'ExternalEvent Queue: Mở Transaction "TX_Rebar_Column_C7"' },
      { time: '1.5s', type: 'info', text: 'Rải 192 thanh chủ 12Φ20 (neo so le 50%), 480 bộ đai 3 vùng (a100/a200)' },
      { time: '1.8s', type: 'success', text: 'Commit Transaction thành công. 16/16 cột hoàn thành 100%.' }
    ],
    results: {
      target: '16 Cột kết cấu C7 (500×500 mm)',
      mainRebar: '12Φ20 / cột (CB400-V, so le 50%)',
      stirrups: 'Φ8 đai bao + đai C (a100/a200/a100)',
      executionTime: '1.8 giây',
      transaction: 'TX_Rebar_Column_C7',
      standard: 'TCVN 5574:2018',
      status: 'An toàn — Không xung đột'
    }
  },
  {
    id: 'beam-excel',
    tag: 'Dầm từ Excel',
    title: 'Thép dầm liên tục từ bảng Excel',
    prompt: 'Vẽ thép cho các dầm đang chọn theo bảng thép trong file Excel này',
    icon: FileSpreadsheet,
    color: 'from-emerald-500 to-teal-500',
    description: 'Cách ly dầm cùng trục liên tục, đọc file Excel khớp theo Mark dầm, rải thép gối L/3, thép nhịp L/2 neo vào cột 30Φ và đai dày 2 đầu dầm.',
    tools: ['get_selected_elements', 'read_rebar_excel_table', 'isolate_continuous_beam_axis', 'create_beam_rebar'],
    logs: [
      { time: '0.0s', type: 'cmd', text: 'Nhận lệnh & file đính kèm: "BangThepDam_T2.xlsx"' },
      { time: '0.4s', type: 'tool', text: 'get_selected_elements() -> 4 dầm được chọn' },
      { time: '0.7s', type: 'tool', text: 'isolate_continuous_beam_axis("Trục 3", level="Tầng 2")' },
      { time: '1.1s', type: 'tool', text: 'read_rebar_excel_table("BangThepDam_T2.xlsx") -> Khớp 4 nhịp D1, D2, D3, D4' },
      { time: '1.5s', type: 'trans', text: 'ExternalEvent Queue: Mở Transaction "TX_Rebar_Continuous_Beam_Grid3"' },
      { time: '2.0s', type: 'info', text: 'Tạo thép gối trên 3Φ22+2Φ20, thép nhịp dưới 3Φ20+2Φ20, đai Φ8a100/a150' },
      { time: '2.4s', type: 'success', text: 'Commit Transaction thành công. Đã rải xong 4 nhịp dầm trục 3.' }
    ],
    results: {
      target: '4 Dầm liên tục Trục 3 (D1–D4, 300×600 mm)',
      mainRebar: 'Gối: 3Φ22 + 2Φ20 (L/3) | Nhịp: 3Φ20 + 2Φ20',
      stirrups: 'Φ8 đai 2 đầu dầm a100, giữa nhịp a150',
      executionTime: '2.4 giây',
      transaction: 'TX_Rebar_Continuous_Beam_Grid3',
      standard: 'TCVN 5574:2018 / Excel Input',
      status: 'An toàn — Sẵn sàng xuất Sheet'
    }
  },
  {
    id: 'footing-preset',
    tag: 'Preset Móng',
    title: 'Thép móng theo Preset V1',
    prompt: 'Vẽ thép cho các móng đang chọn theo preset V1',
    icon: Layers,
    color: 'from-amber-500 to-orange-500',
    description: 'Nhận diện các đài móng đang chọn, áp dụng Preset V1 với lưới thép đáy 2 phương Φ14a150 bẻ mỏ 90°, lưới trên Φ12a200, chân chó Bar Chair và đai bo viền.',
    tools: ['get_selected_elements', 'create_footing_rebar', 'modify_rebar_parameters'],
    logs: [
      { time: '0.0s', type: 'cmd', text: 'Nhận lệnh: "Vẽ thép cho các móng đang chọn theo preset V1"' },
      { time: '0.3s', type: 'tool', text: 'get_selected_elements() -> 8 đài móng Structural Foundations' },
      { time: '0.6s', type: 'info', text: 'Nạp cấu hình Preset V1 (Móng 1800×2200×900 mm, B25)' },
      { time: '1.0s', type: 'trans', text: 'ExternalEvent Queue: Mở Transaction "TX_Rebar_Footing_V1"' },
      { time: '1.5s', type: 'info', text: 'Tạo lưới đáy 2 phương Φ14a150, lưới trên Φ12a200, 32 chân chó Bar Chair Φ12' },
      { time: '1.8s', type: 'info', text: 'Tạo 4 lớp đai bo viền Φ10a200 quanh thành đài móng' },
      { time: '2.2s', type: 'success', text: 'Commit Transaction thành công. Hoàn thành 8 đài móng M1–M8.' }
    ],
    results: {
      target: '8 Đài móng đơn M1–M8 (1.8×2.2×0.9 m)',
      mainRebar: 'Lưới đáy 2 phương Φ14a150 (bẻ mỏ 90°)',
      stirrups: 'Lưới trên Φ12a200 + 32 Chân chó Φ12 + Đai bo Φ10',
      executionTime: '2.2 giây',
      transaction: 'TX_Rebar_Footing_V1',
      standard: 'TCVN 5574:2018',
      status: 'An toàn — Đã kiểm tra khoảng hở'
    }
  }
];

export default function HeroPromptTypewriter() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [displayedPrompt, setDisplayedPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleLogCount, setVisibleLogCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const scenario = SCENARIOS[selectedScenarioIndex];
  const typingTimerRef = useRef(null);
  const logTimerRef = useRef(null);

  // Handle typewriter typing
  useEffect(() => {
    let isMounted = true;
    let charIndex = 0;
    const targetText = scenario.prompt;
    setDisplayedPrompt('');
    setVisibleLogCount(0);
    setIsTyping(true);

    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    if (logTimerRef.current) clearInterval(logTimerRef.current);

    if (isPaused) return;

    typingTimerRef.current = setInterval(() => {
      if (!isMounted) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        return;
      }
      if (charIndex < targetText.length) {
        setDisplayedPrompt(targetText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        if (!isMounted) return;
        setIsTyping(false);
        // Start streaming logs
        let logIndex = 0;
        logTimerRef.current = setInterval(() => {
          if (!isMounted) {
            if (logTimerRef.current) clearInterval(logTimerRef.current);
            return;
          }
          if (logIndex <= scenario.logs.length) {
            setVisibleLogCount(logIndex);
            logIndex++;
          } else {
            if (logTimerRef.current) clearInterval(logTimerRef.current);
          }
        }, 320);
      }
    }, 45);

    return () => {
      isMounted = false;
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (logTimerRef.current) clearInterval(logTimerRef.current);
    };
  }, [selectedScenarioIndex, isPaused]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(scenario.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplay = () => {
    setIsPaused(false);
    setDisplayedPrompt('');
    setVisibleLogCount(0);
    setIsTyping(true);
    setSelectedScenarioIndex((prev) => prev);
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-6">
      {/* Scenario Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        {SCENARIOS.map((sc, idx) => {
          const Icon = sc.icon;
          const isSelected = selectedScenarioIndex === idx;
          return (
            <button
              key={sc.id}
              onClick={() => {
                setSelectedScenarioIndex(idx);
                setIsPaused(false);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-lg shadow-sky-500/25 scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-sky-500'}`} />
              <span>{sc.tag}</span>
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Terminal Frame */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080e18] shadow-2xl transition-all duration-300">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#0c1424] border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1.5" />
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-sky-500" />
              <span>BIMAutomation AI Prompt Simulator</span>
              <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">•</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold hidden sm:inline">127.0.0.1:8765/mcp</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              LIVE MCP
            </span>

            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            {/* Replay Button */}
            <button
              onClick={handleReplay}
              title="Phát lại hiệu ứng gõ"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Column: Interactive Typewriter & Execution Log Stream */}
          <div className="lg:col-span-7 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between space-y-4">
            <div>
              {/* Prompt Input Box */}
              <div className="relative group p-3 sm:p-4 rounded-xl bg-slate-100/90 dark:bg-[#0f192c] border border-slate-200 dark:border-slate-700/60 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Lệnh Kỹ Sư Gửi AI Client</span>
                  </div>
                  <button
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="font-mono text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 min-h-[48px] flex items-center leading-relaxed">
                  <span className="text-sky-500 mr-2 font-bold select-none">&gt;</span>
                  <span className="bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-300 dark:to-cyan-200 bg-clip-text text-transparent">
                    „ {displayedPrompt}
                  </span>
                  <span
                    className={`inline-block w-2.5 h-5 ml-1 bg-sky-500 transition-opacity ${
                      isTyping ? 'opacity-100 animate-pulse' : 'opacity-0'
                    }`}
                  />
                  {!isTyping && <span className="text-sky-500 dark:text-sky-300 font-bold ml-1">“</span>}
                </div>
              </div>

              {/* Action Log Stream */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-sky-500" />
                    <span>Tiến Trình Thực Thi Revit Native Engine</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    ExternalEvent STA Queue
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-xs max-h-[220px] overflow-y-auto pr-1">
                  {scenario.logs.slice(0, visibleLogCount).map((log, lIdx) => (
                    <div
                      key={lIdx}
                      className={`p-2 rounded-lg transition-all duration-200 animate-fade-in flex items-start gap-2 border ${
                        log.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-semibold'
                          : log.type === 'tool'
                          ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/50'
                          : log.type === 'trans'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                          : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-[10px] font-bold opacity-60 flex-shrink-0 pt-0.5">
                        [{log.time}]
                      </span>
                      <div className="flex-1 min-w-0 break-words">
                        {log.type === 'success' && (
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                        )}
                        {log.text}
                      </div>
                    </div>
                  ))}

                  {visibleLogCount < scenario.logs.length && !isPaused && (
                    <div className="p-2 text-xs font-mono text-slate-400 dark:text-slate-500 italic flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                      Đang xử lý qua Revit API...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tools Used Badges */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mr-1">
                  MCP Tools:
                </span>
                {scenario.tools.map((toolName) => (
                  <span
                    key={toolName}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                  >
                    {toolName}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Instant Live Preview Card */}
          <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-50/70 dark:bg-[#0a1220]/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Kết Quả Mô Hình Hóa 3D
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">
                  {scenario.results.standard}
                </span>
              </div>

              {/* Scenario Description */}
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                {scenario.description}
              </p>

              {/* Key Metrics Grid */}
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0e1728] border border-slate-200 dark:border-slate-800/80 shadow-sm">
                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                    Cấu Kiện Mục Tiêu
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {scenario.results.target}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0e1728] border border-slate-200 dark:border-slate-800/80 shadow-sm">
                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                    Cốt Thép Chủ
                  </div>
                  <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                    {scenario.results.mainRebar}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0e1728] border border-slate-200 dark:border-slate-800/80 shadow-sm">
                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                    Hệ Thép Đai & Phụ Kiện
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {scenario.results.stirrups}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white dark:bg-[#0e1728] border border-slate-200 dark:border-slate-800/80 shadow-sm">
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-500" />
                      Thời Gian
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {scenario.results.executionTime}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-[#0e1728] border border-slate-200 dark:border-slate-800/80 shadow-sm">
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Database className="w-3 h-3 text-emerald-500" />
                      Transaction
                    </div>
                    <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate" title={scenario.results.transaction}>
                      {scenario.results.transaction}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Safe Confirmation Callout */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {scenario.results.status}
              </span>
              <span className="font-mono text-[10px]">Autodesk Revit 2022-2027</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
