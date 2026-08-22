import React, { useMemo, useState } from 'react';
import { ArrowRight, Calculator, Check, DollarSign, Sparkles, TrendingUp, Users } from 'lucide-react';

export default function RoiCalculator({ onOpenConsultation }) {
  const [engineers, setEngineers] = useState(6);
  const [salaryMillion, setSalaryMillion] = useState(18); // 18 triệu VNĐ/tháng

  const metrics = useMemo(() => {
    const monthlyHoursPerEngineer = 176;
    const hoursSavedPerMonthPerEngineer = 40; // Tiết kiệm ~22.7% thời gian tác vụ lặp
    const totalHoursSavedMonth = engineers * hoursSavedPerMonthPerEngineer;
    const totalHoursSavedYear = totalHoursSavedMonth * 12;

    const hourlyRate = (salaryMillion * 1_000_000) / monthlyHoursPerEngineer;
    const moneySavedMonth = Math.round(totalHoursSavedMonth * hourlyRate);
    const moneySavedYear = moneySavedMonth * 12;

    // Chi phí bản quyền ước tính gói năm ~208.000đ/tháng/kỹ sư
    const annualSoftwareCost = engineers * 2_490_000;
    const netBenefitYear = moneySavedYear - annualSoftwareCost;
    const roiMultiplier = ((moneySavedYear / annualSoftwareCost)).toFixed(1);

    return {
      totalHoursSavedMonth,
      totalHoursSavedYear,
      moneySavedMonth,
      moneySavedYear,
      annualSoftwareCost,
      netBenefitYear,
      roiMultiplier
    };
  }, [engineers, salaryMillion]);

  return (
    <div className="bento-card p-8 lg:p-12">
      <div className="max-w-3xl">
        <h3 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Tính toán giá trị đầu tư (ROI Engine)
        </h3>
        <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
          Kéo chọn quy mô đội ngũ Revit và mức lương trung bình để ước tính thời gian & ngân sách tối ưu hóa cho doanh nghiệp bạn.
        </p>
      </div>

      <div className="mt-10 grid lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-12 items-center">
        {/* Sliders Input */}
        <div className="space-y-6 bg-[var(--surface-subtle)] p-7 rounded-[var(--radius-panel)] border border-[var(--line)]">
          {/* Slider 1: Số lượng kỹ sư */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label htmlFor="engineer-count-slider" className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Users size={16} className="text-[var(--brand)]" /> Quy mô đội ngũ Revit
              </label>
              <span className="font-mono text-base font-extrabold text-[var(--brand)] bg-[var(--surface)] px-3 py-1 rounded-md border border-[var(--line)] shadow-xs">
                {engineers} kỹ sư
              </span>
            </div>
            <input
              id="engineer-count-slider"
              type="range"
              min="1"
              max="50"
              value={engineers}
              onChange={(e) => setEngineers(Number(e.target.value))}
              className="w-full accent-[var(--brand)] cursor-pointer h-2 bg-[var(--line)] rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-1.5 font-mono">
              <span>1 người</span>
              <span>25 người</span>
              <span>50 người</span>
            </div>
          </div>

          {/* Slider 2: Mức lương */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label htmlFor="salary-million-slider" className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" /> Mức lương TB / Kỹ sư
              </label>
              <span className="font-mono text-base font-extrabold text-[var(--text-primary)] bg-[var(--surface)] px-3 py-1 rounded-md border border-[var(--line)] shadow-xs">
                {salaryMillion} triệu / tháng
              </span>
            </div>
            <input
              id="salary-million-slider"
              type="range"
              min="10"
              max="45"
              step="1"
              value={salaryMillion}
              onChange={(e) => setSalaryMillion(Number(e.target.value))}
              className="w-full accent-[var(--brand)] cursor-pointer h-2 bg-[var(--line)] rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-1.5 font-mono">
              <span>10 triệu</span>
              <span>25 triệu</span>
              <span>45 triệu</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--line)] text-xs text-[var(--text-secondary)] space-y-2">
            <p className="flex items-center gap-2 font-medium">
              <Check size={14} className="text-emerald-500 shrink-0" />
              Tự động hóa hơn 80% thao tác Dim, Rename và Xuất hồ sơ lặp lại.
            </p>
            <p className="flex items-center gap-2 font-medium">
              <Check size={14} className="text-emerald-500 shrink-0" />
              Giảm thiểu sai sót cấu kiện và chậm tiến độ bàn giao hồ sơ.
            </p>
          </div>
        </div>

        {/* Output Metrics Card */}
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--line)] shadow-xs">
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Thời gian tiết kiệm</p>
              <strong className="block mt-2 text-3xl font-mono font-extrabold text-[var(--brand)]">
                {metrics.totalHoursSavedMonth.toLocaleString('vi-VN')} giờ<span className="text-xs font-normal text-[var(--text-secondary)]">/tháng</span>
              </strong>
              <p className="mt-1.5 text-xs text-[var(--text-secondary)] font-medium">
                Tương đương ~{metrics.totalHoursSavedYear.toLocaleString('vi-VN')} giờ làm việc/năm
              </p>
            </div>

            <div className="p-6 rounded-[var(--radius-panel)] bg-gradient-to-br from-[var(--surface)] to-[var(--brand-soft)]/30 border border-[var(--line)] shadow-xs">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={14} /> Ngân sách tối ưu
              </p>
              <strong className="block mt-2 text-3xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {(metrics.moneySavedYear / 1_000_000).toFixed(0)} triệu<span className="text-xs font-normal text-[var(--text-secondary)]">/năm</span>
              </strong>
              <p className="mt-1.5 text-xs text-[var(--text-secondary)] font-medium">
                ~{(metrics.moneySavedMonth / 1_000_000).toFixed(1)} triệu VNĐ mỗi tháng
              </p>
            </div>
          </div>

          {/* ROI summary box */}
          <div className="p-6 rounded-[var(--radius-panel)] bg-[var(--surface-subtle)] border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">
                Hiệu suất đầu tư (ROI): <span className="text-[var(--brand)] font-mono font-extrabold text-base">Gấp {metrics.roiMultiplier}x lần chi phí</span>
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Chi phí phần mềm chỉ chiếm ~2% ngân sách nhân sự mà bạn tối ưu được.
              </p>
            </div>
            <button
              onClick={onOpenConsultation}
              className="primary-button shrink-0 text-xs sm:text-sm !py-2.5 !px-5 shadow-sm"
            >
              <Sparkles size={15} /> Báo giá cho {engineers} máy <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
