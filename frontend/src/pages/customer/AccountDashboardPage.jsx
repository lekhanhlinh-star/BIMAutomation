import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, KeyRound, PackageCheck, ReceiptText, ShieldCheck } from 'lucide-react';
import { customerApi } from '../../api/services';
import { useAuthStore } from '../../store/useAuthStore';
import TrialRegistrationModal from '../../components/TrialRegistrationModal';

function DashboardSkeleton() {
  return (
    <div className="account-dashboard" aria-label="Đang tải thông tin tài khoản" aria-busy="true">
      <div className="account-skeleton h-8 w-56" />
      <div className="account-skeleton h-4 w-full max-w-xl" />
      <div className="account-skeleton mt-5 h-64 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="account-skeleton h-28" />
        <div className="account-skeleton h-28" />
        <div className="account-skeleton h-28" />
      </div>
    </div>
  );
}

export default function AccountDashboardPage() {
  const { user } = useAuthStore();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

  const licensesQuery = useQuery({
    queryKey: ['myLicenses'],
    queryFn: customerApi.getLicenses,
  });
  const ordersQuery = useQuery({
    queryKey: ['myOrders'],
    queryFn: customerApi.getOrders,
  });

  if (licensesQuery.isLoading || ordersQuery.isLoading) return <DashboardSkeleton />;

  const licenses = licensesQuery.data || [];
  const orders = ordersQuery.data || [];
  const activeLicenses = licenses.filter((license) => license.status === 'ACTIVE');
  const activeLicense = activeLicenses[0];
  const hasError = licensesQuery.isError || ordersQuery.isError;
  const displayName = user?.name || user?.email?.split('@')[0] || 'Kỹ sư BIM';
  const licenseState = activeLicense ? 'Đang hoạt động' : user?.is_trial_registered ? 'Đã đăng ký dùng thử' : 'Chưa kích hoạt';

  return (
    <div className="account-dashboard">
      <header className="account-dashboard__intro">
        <div>
          <p className="account-kicker">Không gian làm việc</p>
          <h2>Chào {displayName}</h2>
          <p>Theo dõi license, đơn hàng và hoàn tất thiết lập BIMAutomation cho Revit.</p>
        </div>
        <Link to="/download" className="secondary-button account-dashboard__download">
          <Download size={17} aria-hidden="true" /> Tải Add-in
        </Link>
      </header>

      {hasError ? (
        <div role="alert" className="account-error-banner">
          <span className="account-error-banner__label">Dữ liệu</span>
          <div>
            <strong>Chưa thể tải đầy đủ dữ liệu.</strong>
            <span>Hãy tải lại trang hoặc thử lại sau ít phút.</span>
          </div>
        </div>
      ) : null}

      <section className={`account-license-hero ${activeLicense ? 'is-active' : ''}`} aria-labelledby="license-summary-title">
        <div className="account-license-hero__grid" aria-hidden="true" />
        <div className="account-license-hero__main">
          <div className="account-license-hero__icon" aria-hidden="true">
            {activeLicense ? <ShieldCheck size={24} /> : <KeyRound size={24} />}
          </div>
          <div>
            <div className="account-license-hero__eyebrow">
              <p className="account-license-hero__label">License BIMAutomation</p>
              <span className={`account-status ${activeLicense ? 'is-active' : ''}`}><i />{licenseState}</span>
            </div>
            {activeLicense ? (
              <>
                <h3 id="license-summary-title">{activeLicense.planName}</h3>
                <p>License đang hoạt động và sẵn sàng nhận diện trên Autodesk Revit.</p>
              </>
            ) : user?.is_trial_registered ? (
              <>
                <h3 id="license-summary-title">Dùng thử 14 ngày đã sẵn sàng</h3>
                <p>Mở Revit và chọn “Đăng nhập Google” để bắt đầu phiên dùng thử.</p>
              </>
            ) : (
              <>
                <h3 id="license-summary-title">Bắt đầu với 14 ngày dùng thử</h3>
                <p>Hoàn tất thông tin kỹ sư để trải nghiệm toàn bộ bộ công cụ BIMAutomation.</p>
              </>
            )}
          </div>
        </div>

        <div className="account-license-hero__action">
          {activeLicense ? (
            <>
              <div className="account-license-expiry">
                <span>Hạn sử dụng</span>
                <strong>{activeLicense.expiresAt || 'Đang cập nhật'}</strong>
              </div>
              <Link to="/account/licenses" className="primary-button">
                Xem license <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </>
          ) : user?.is_trial_registered ? (
            <Link to="/download" className="primary-button">
              Tải Add-in <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" onClick={() => setIsTrialModalOpen(true)} className="primary-button">
              Đăng ký dùng thử <ArrowRight size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      <section className="account-metrics" aria-label="Tóm tắt tài khoản">
        <article>
          <div className="account-metric__icon" aria-hidden="true"><PackageCheck size={20} /></div>
          <div><span>License hoạt động</span><strong>{activeLicenses.length}</strong><small>Sẵn sàng trên Revit</small></div>
        </article>
        <article>
          <div className="account-metric__icon" aria-hidden="true"><ReceiptText size={20} /></div>
          <div><span>Tổng đơn hàng</span><strong>{orders.length}</strong><small>Trong toàn bộ tài khoản</small></div>
        </article>
        <article>
          <div className="account-metric__icon is-success" aria-hidden="true"><ShieldCheck size={20} /></div>
          <div><span>Tài khoản đã xác thực</span><strong className="account-metric__email">{user?.email || 'Đã liên kết'}</strong><small>Đăng nhập an toàn qua Google</small></div>
        </article>
      </section>

      <div className="account-dashboard__lower-grid">
        <section className="account-next-steps" aria-labelledby="next-steps-title">
          <div className="account-section-heading">
            <div>
              <p className="account-kicker">Thiết lập nhanh</p>
              <h3 id="next-steps-title">Kết nối với Revit</h3>
            </div>
            <span>3 bước</span>
          </div>
          <ol>
            <li><span>01</span><p><strong>Cài Add-in</strong><small>Tải đúng phiên bản Revit đang sử dụng.</small></p></li>
            <li><span>02</span><p><strong>Mở tab BIMAutomation</strong><small>Tìm tab BIMAutomation trên thanh Ribbon.</small></p></li>
            <li><span>03</span><p><strong>Đăng nhập Google</strong><small>Dùng đúng email của tài khoản này.</small></p></li>
          </ol>
          <Link to="/tutorials" className="account-text-link">
            Xem hướng dẫn chi tiết <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>

        <aside className="account-help-card">
          <div className="account-help-card__icon" aria-hidden="true"><KeyRound size={22} /></div>
          <p className="account-kicker">Bắt đầu ngay</p>
          <h3>{!activeLicense && !user?.is_trial_registered ? 'Trải nghiệm đầy đủ trong 14 ngày' : 'Cần hỗ trợ thiết lập?'}</h3>
          <p>{!activeLicense && !user?.is_trial_registered ? 'Không cần thẻ thanh toán. Bạn có thể kiểm tra toàn bộ công cụ trước khi chọn gói.' : 'Xem hướng dẫn cài đặt và đăng nhập Add-in trên Autodesk Revit.'}</p>
          {!activeLicense && !user?.is_trial_registered ? (
            <button type="button" onClick={() => setIsTrialModalOpen(true)}>Kích hoạt dùng thử <ArrowRight size={15} /></button>
          ) : (
            <Link to="/tutorials">Mở trung tâm hướng dẫn <ArrowRight size={15} /></Link>
          )}
        </aside>
      </div>

      <TrialRegistrationModal isOpen={isTrialModalOpen} onClose={() => setIsTrialModalOpen(false)} />
    </div>
  );
}
