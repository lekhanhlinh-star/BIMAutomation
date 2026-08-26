import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Download,
  FileText,
  Headphones,
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
    title: 'Tải BIMAutomation.Installer.exe',
    desc: 'Nhấn nút Tải bộ cài đặt duy nhất (.exe) hỗ trợ toàn bộ các phiên bản Revit từ 2022 đến 2027.'
  },
  {
    step: '02',
    title: 'Chạy cài đặt tự động 30 giây',
    desc: 'Tắt Revit và chạy file cài đặt. Hệ thống tự động nạp manifest vào %AppData%\\Autodesk\\Revit\\Addins\\<năm> cho tất cả phiên bản.'
  },
  {
    step: '03',
    title: 'Mở Revit & Đăng nhập Google',
    desc: 'Khởi động Revit, mở Tab BIMAutomation trên thanh Ribbon và bấm Đăng nhập Google để tự động kích hoạt bản quyền Server-Authoritative.'
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
  const [copiedHash, setCopiedHash] = useState(false);

  const { data: release, isLoading } = useQuery({
    queryKey: ['release'],
    queryFn: publicApi.getReleases,
    retry: false,
  });

  const ready = validDownloadUrl(release?.downloadUrl);

  const handleCopyHash = () => {
    if (release?.sha256Hash) {
      navigator.clipboard.writeText(release.sha256Hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="download-page page-shell">
      <header className="download-hero">
        <div className="download-hero__copy">
          <p className="download-kicker"><Zap size={15} aria-hidden="true" /> Bộ cài đặt Autodesk Revit Add-in</p>
          <h1>
            Tải phần mềm BIMAutomation (Revit 2022–2027)
          </h1>
          <p>
            Tự động tích hợp thanh công cụ Ribbon <strong>BIMAutomation</strong> và 57 công cụ chuẩn MCP vào Autodesk Revit. Dùng thử miễn phí 14 ngày trọn bộ tính năng.
          </p>
        </div>
        <div className="download-hero__spec" aria-label="Thông tin tương thích">
          <span>Hệ điều hành</span><strong>Windows 10 / 11</strong>
          <span>Kiến trúc</span><strong>64-bit</strong>
          <span>Autodesk Revit</span><strong>2022—2027</strong>
        </div>
      </header>

      {isAuthenticated && !user?.is_trial_registered && (
        <aside className="download-trial-banner">
          <Clock aria-hidden="true" />
          <div>
            <h2>Kích hoạt dùng thử 14 ngày cho đội ngũ</h2>
            <p>
              Đăng ký thông tin kỹ sư để mở khóa toàn bộ 13 tính năng và nhận hỗ trợ kỹ thuật trực tiếp.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsTrialModalOpen(true)}
            className="primary-button"
          >
            Đăng ký ngay
          </button>
        </aside>
      )}

      <section className="download-release" aria-label="Bản phát hành BIMAutomation">
        {isLoading ? (
          <div className="download-release__loading" aria-live="polite">
            <Loader2 className="animate-spin" size={22} aria-hidden="true" /> Đang kiểm tra bản phát hành mới nhất…
          </div>
        ) : (
          <>
            <div className="download-release__header">
              <div className="download-release__identity">
                <span className="download-release__icon"><Download aria-hidden="true" /></span>
                <div>
                  <p>Bản phát hành mới nhất</p>
                  <h2 id="download-release-title">BIMAutomation.Installer.exe</h2>
                </div>
              </div>
              <span className="download-release__version">{release?.latestVersion}</span>
            </div>

            <div className="download-release__body">
              <div className="download-release__primary">
                <dl className="download-release__metadata">
                  <div><dt>Tương thích</dt><dd>{release?.revitVersions}</dd></div>
                  <div><dt>Dung lượng</dt><dd>{release?.fileSize}</dd></div>
                  <div><dt>Ngày phát hành</dt><dd>{release?.releaseDate}</dd></div>
                </dl>

                {release?.sha256Hash ? (
                  <div className="download-checksum">
                    <ShieldCheck size={16} aria-hidden="true" />
                    <div><span>SHA-256</span><code>{release.sha256Hash}</code></div>
                    <button type="button" onClick={handleCopyHash} title="Copy SHA-256 Checksum" aria-live="polite">
                      {copiedHash ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                      {copiedHash ? 'Đã chép' : 'Chép mã'}
                    </button>
                  </div>
                ) : null}

                {ready ? (
                  <a href={release.downloadUrl} className="primary-button download-release__cta" download="BIMAutomation.Installer.exe">
                    <Download size={20} aria-hidden="true" /> Tải BIMAutomation.Installer.exe
                  </a>
                ) : (
                  <button disabled className="secondary-button download-release__cta">
                    <Download size={19} aria-hidden="true" /> Bản cài đang được đồng bộ
                  </button>
                )}
              </div>

              <aside className="download-smartscreen">
                <AlertCircle size={18} aria-hidden="true" />
                <div>
                  <strong>Lưu ý khi mở file trên Windows 10/11:</strong>
                  <p>
                    Nếu xuất hiện thông báo <em>"Windows protected your PC" (SmartScreen)</em>, bạn chỉ cần nhấn <strong>"More info" (Thông tin khác)</strong> và chọn <strong>"Run anyway" (Vẫn chạy)</strong> để tiến hành cài đặt an toàn.
                  </p>
                </div>
              </aside>
            </div>

            <div className="download-versions">
              <div className="download-section-label">
                <span>Phiên bản Autodesk Revit hỗ trợ</span>
                <small>Tự động nhận diện</small>
              </div>
              <div className="download-versions__grid">
                {supportedVersions.map((version) => (
                  <div key={version.version}>
                    <strong>{version.version}</strong>
                    <span><CheckCircle2 size={12} aria-hidden="true" />64-bit</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="download-install" aria-labelledby="download-install-title">
        <div className="download-install__intro">
          <p className="download-kicker">Quy trình cài đặt</p>
          <h2 id="download-install-title">Hướng dẫn cài đặt & Kích hoạt trong 3 bước</h2>
        </div>
        <ol className="download-install__steps">
          {steps.map((step) => (
            <li key={step.step}>
              <span>{step.step}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="download-details">
        <section aria-labelledby="download-requirements-title">
          <header>
            <Cpu size={19} aria-hidden="true" />
            <h2 id="download-requirements-title">Yêu cầu hệ thống & Phần mềm</h2>
          </header>
          <ul>
            {[
              'Autodesk Revit 2022, 2023, 2024, 2025, 2026, 2027 (64-bit)',
              'Hệ điều hành Windows 10 hoặc Windows 11 (64-bit)',
              '.NET Framework 4.8 / .NET 8 Runtime (đã tích hợp sẵn trong bộ cài)',
              'AutoCAD Full 2016+ (Bắt buộc cho tính năng Model from CAD & DWG Export; AutoCAD LT không hỗ trợ)',
              'Đăng nhập Google OAuth 2.0 PKCE để xác thực bản quyền Server-Authoritative'
            ].map((req) => (
              <li key={req}>
                <CheckCircle2 size={15} aria-hidden="true" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="download-changelog-title">
          <header>
            <FileText size={19} aria-hidden="true" />
            <h2 id="download-changelog-title">Điểm mới trong bản cập nhật</h2>
          </header>
          <ul>
            {release?.changelog?.map((change, idx) => (
              <li key={idx}><span>{String(idx + 1).padStart(2, '0')}</span>{change}</li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="download-support">
        <Headphones size={22} aria-hidden="true" />
        <div>
          <h2>Cần hỗ trợ cài đặt từ xa?</h2>
          <p>
            Kỹ sư hỗ trợ sẵn sàng kết nối qua UltraViewer hoặc Google Meet để cài đặt giúp bạn.
          </p>
        </div>
        <a href="tel:0799660737" className="secondary-button">
          <PhoneCall size={15} aria-hidden="true" /> Gọi: 0799 660 737
        </a>
      </aside>

      <TrialRegistrationModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
      />
    </div>
  );
}
