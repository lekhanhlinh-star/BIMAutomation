import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  Download,
  FileCheck,
  FileText,
  Headphones,
  HelpCircle,
  Laptop,
  Loader2,
  PhoneCall,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { publicApi } from '../../api/services';
import { useAuthStore } from '../../store/useAuthStore';
import TrialRegistrationModal from '../../components/TrialRegistrationModal';

function validDownloadUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (value.startsWith('/downloads/')) return true;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const steps = [
  {
    step: '01',
    title: 'Tải bộ cài đặt',
    desc: 'Nhấn nút Tải bộ cài (.exe) tương thích cho phiên bản Revit bạn đang sử dụng.'
  },
  {
    step: '02',
    title: 'Chạy cài đặt 30 giây',
    desc: 'Tắt phần mềm Revit, nhấp đúp vào file cài đặt và làm theo hướng dẫn trên màn hình.'
  },
  {
    step: '03',
    title: 'Mở Revit & Kích hoạt',
    desc: 'Khởi động Revit, mở Tab BIMAutomation trên thanh Ribbon và đăng nhập tài khoản để trải nghiệm.'
  }
];

const supportedVersions = [
  { version: 'Revit 2027', status: 'Hỗ trợ chính thức', popular: true },
  { version: 'Revit 2026', status: 'Hỗ trợ chính thức', popular: true },
  { version: 'Revit 2025', status: 'Hỗ trợ chính thức', popular: true },
  { version: 'Revit 2024', status: 'Hỗ trợ chính thức', popular: false },
  { version: 'Revit 2023', status: 'Hỗ trợ chính thức', popular: false },
  { version: 'Revit 2022', status: 'Hỗ trợ chính thức', popular: false }
];

export default function DownloadPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const outletContext = useOutletContext();
  const onOpenConsultation = outletContext?.onOpenConsultation || (() => {});

  const { data: release, isLoading, isError } = useQuery({
    queryKey: ['release'],
    queryFn: publicApi.getReleases,
    retry: false,
  });

  const ready = validDownloadUrl(release?.downloadUrl);

  return (
    <div className="page-shell py-12 lg:py-16 pb-24 max-w-4xl">
      {/* Header */}
      <header className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-soft)] border border-[var(--line)] text-xs font-bold text-[var(--brand)] mb-3">
          <Zap size={14} /> Bộ cài đặt Autodesk Revit Add-in
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Tải phần mềm BIMAutomation (Revit 2022–2027)
        </h1>
        <p className="mt-4 text-base text-[var(--text-secondary)] leading-relaxed">
          Tự động tích hợp thanh công cụ Ribbon chuyên nghiệp vào Autodesk Revit. Dùng thử miễn phí 14 ngày với đầy đủ 30+ tiện ích.
        </p>
      </header>

      {/* Trial Onboarding Banner */}
      {isAuthenticated && !user?.is_trial_registered && (
        <div className="mt-8 p-6 bg-gradient-to-r from-[var(--brand-soft)]/50 to-[var(--surface-raised)] border border-[var(--brand)]/30 rounded-[var(--radius-panel)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Clock className="text-amber-500 w-4 h-4" /> Kích hoạt dùng thử 14 ngày cho đội ngũ
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Đăng ký thông tin kỹ sư để mở khóa toàn bộ tính năng và nhận hỗ trợ kỹ thuật trực tiếp.
            </p>
          </div>
          <button
            onClick={() => setIsTrialModalOpen(true)}
            className="primary-button !min-h-9 !py-1.5 !px-4 text-xs font-bold shrink-0 cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </div>
      )}

      {/* Main Download Card */}
      <div className="mt-10 p-8 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-md">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2.5 text-[var(--text-secondary)]">
            <Loader2 className="animate-spin" size={22} /> Đang kiểm tra bản phát hành mới nhất…
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center pb-6 border-b border-[var(--line)]">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">
                    BIMAutomation Installer
                  </h2>
                  <span className="font-mono text-xs font-extrabold text-[var(--brand)] bg-[var(--brand-soft)] px-2.5 py-1 rounded">
                    {release?.latestVersion}
                  </span>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                  Tương thích {release?.revitVersions} · Dung lượng: <strong>{release?.fileSize}</strong> · Ngày phát hành: <strong>{release?.releaseDate}</strong>
                </p>
              </div>

              {ready ? (
                <a href={release.downloadUrl} className="primary-button shrink-0 font-bold !py-3.5 !px-6 text-sm sm:text-base shadow-md" download>
                  <Download size={20} /> Tải bộ cài đặt (.exe)
                </a>
              ) : (
                <button disabled className="secondary-button opacity-50 cursor-not-allowed shrink-0 font-bold">
                  <Download size={19} /> Bản cài đang được đồng bộ
                </button>
              )}
            </div>

            {/* Supported Revit Versions Grid */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                Phiên bản Autodesk Revit hỗ trợ
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {supportedVersions.map((v) => (
                  <div
                    key={v.version}
                    className="p-3 rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-subtle)] text-center space-y-0.5"
                  >
                    <p className="font-mono text-xs font-extrabold text-[var(--text-primary)]">{v.version}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 size={11} /> 64-bit
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3-Step Installation Guide */}
      <section className="mt-12">
        <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] text-center">
          Hướng dẫn cài đặt nhanh trong 3 bước
        </h3>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div
              key={s.step}
              className="p-6 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-xs"
            >
              <span className="font-mono text-2xl font-extrabold text-[var(--brand)] block mb-3">
                {s.step}
              </span>
              <h4 className="font-bold text-base text-[var(--text-primary)]">{s.title}</h4>
              <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System Requirements & Changelog */}
      <div className="grid md:grid-cols-2 gap-6 mt-12">
        {/* Requirements */}
        <div className="p-6 sm:p-7 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-xs">
          <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2 mb-4">
            <Cpu className="text-[var(--brand)]" size={18} /> Yêu cầu hệ thống & Phần cứng
          </h3>
          <ul className="space-y-3 text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
            {[
              'Autodesk Revit 2022, 2023, 2024, 2025, 2026, 2027',
              'Hệ điều hành Windows 10 hoặc Windows 11 (64-bit)',
              '.NET Framework 4.8 / .NET 8 Runtime (đã tích hợp sẵn)',
              'Dung lượng ổ cứng khả dụng tối thiểu 200 MB',
              'Kết nối Internet để xác thực và cập nhật License'
            ].map((req) => (
              <li key={req} className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Changelog */}
        <div className="p-6 sm:p-7 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-xs">
          <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2 mb-4">
            <FileText className="text-[var(--brand)]" size={18} /> Điểm mới trong bản cập nhật
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)] list-disc pl-5 leading-relaxed">
            {release?.changelog?.map((change, idx) => (
              <li key={idx}>{change}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Support Box */}
      <div className="mt-12 p-6 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
            <Headphones size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)]">Cần hỗ trợ cài đặt từ xa?</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Kỹ sư hỗ trợ sẵn sàng kết nối qua UltraViewer hoặc Google Meet để cài đặt giúp bạn.
            </p>
          </div>
        </div>
        <a
          href="tel:0904885833"
          className="secondary-button shrink-0 text-xs font-bold"
        >
          <PhoneCall size={14} className="text-emerald-500" /> Gọi: 0904 885 833
        </a>
      </div>

      {/* Trial Modal */}
      <TrialRegistrationModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
      />
    </div>
  );
}
