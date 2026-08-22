import React, { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Award,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  Headphones,
  HelpCircle,
  Laptop,
  Loader2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap
} from 'lucide-react';
import { customerApi, publicApi } from '../../api/services';
import { useAuthStore } from '../../store/useAuthStore';
import { savePendingIntent } from '../../utils/pendingIntent';
import AccessibleDialog from '../../components/AccessibleDialog';

const pricingFaqs = [
  {
    q: 'Sau khi thanh toán qua VietQR thì mất bao lâu để kích hoạt License?',
    a: 'Hệ thống tự động quét giao dịch SePay 24/7. Ngay khi tiền vào tài khoản (khoảng 5-10 giây), hệ thống tự động kích hoạt License Key trong trang cá nhân của bạn và gửi email xác nhận.'
  },
  {
    q: 'BIMAutomation có xuất hóa đơn giá trị gia tăng (VAT) điện tử hợp lệ không?',
    a: 'Có. Chúng tôi hỗ trợ xuất hóa đơn điện tử GTGT đầy đủ và hợp lệ cho tất cả các gói bản quyền theo quy định của Bộ Tài chính.'
  },
  {
    q: 'Tôi có thể chuyển đổi sang máy tính khác sau khi đã kích hoạt không?',
    a: 'Hoàn toàn được. Trong trang Quản lý License (/account/licenses), bạn có thể tự do bấm "Hủy liên kết thiết bị" để giải phóng License và đăng nhập trên máy tính hoặc laptop mới bất kỳ lúc nào.'
  },
  {
    q: 'Doanh nghiệp mua cho phòng BIM từ 5 đến 50 máy có chính sách gì đặc biệt?',
    a: 'Chúng tôi có chính sách chiết khấu bậc thang hấp dẫn từ 15% đến 35% cho đơn vị mua số lượng lớn, kèm tài khoản Quản trị Admin phân quyền và chuyên viên hỗ trợ đào tạo 1-1.'
  },
  {
    q: 'Bản quyền có hỗ trợ tất cả các phiên bản Autodesk Revit từ 2022 đến 2027 không?',
    a: 'Có. Một License Key duy nhất có thể sử dụng đồng thời trên bất kỳ phiên bản Revit nào từ Revit 2022 đến Revit 2027 đã cài đặt trên máy tính của bạn.'
  }
];

export default function PricingPage() {
  const { data: plans = [], isLoading } = useQuery({ queryKey: ['plans'], queryFn: publicApi.getPlans });
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const onOpenConsultation = outletContext?.onOpenConsultation || (() => {});

  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [order, setOrder] = useState(null);
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const [copiedField, setCopiedField] = useState('');

  const choose = useCallback((plan) => {
    setSelected(plan);
    setError('');
    if (!authenticated) {
      setAuthPrompt(true);
    } else {
      setCheckout(true);
    }
  }, [authenticated]);

  useEffect(() => {
    const planId = params.get('plan');
    if (authenticated && params.get('checkout') === '1' && plans.length && planId) {
      const plan = plans.find((p) => String(p.id) === planId);
      if (plan) {
        choose(plan);
        setParams({}, { replace: true });
      }
    }
  }, [authenticated, plans, params, choose, setParams]);

  useEffect(() => {
    if (!order?.id || order.status === 'PAID') return;
    const id = setInterval(async () => {
      try {
        const next = await customerApi.getOrder(order.id);
        setOrder(next);
      } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, [order?.id, order?.status]);

  const auth = (path) => {
    savePendingIntent({ type: 'checkout', planId: selected.id, returnTo: '/pricing' });
    navigate(path);
  };

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const created = (await customerApi.createOrder(selected.id)).data;
      setOrder(created);
      setQr(await customerApi.getOrderQr(created.id));
    } catch (e) {
      setError(e.response?.data?.detail || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setAuthPrompt(false);
    setCheckout(false);
    setOrder(null);
    setQr(null);
    setError('');
    setCopiedField('');
  };

  const copyText = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  return (
    <div className="relative overflow-hidden pb-28">
      {/* Subtle Ambient Radial Glow for Glassmorphism Light Depth */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-[var(--brand)]/12 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="page-shell pt-14 lg:pt-20">
        {/* Header */}
        <header className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-raised)] border border-[var(--line)] shadow-xs text-xs font-semibold text-[var(--text-secondary)] mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Báo giá minh bạch · Kích hoạt tức thì sau thanh toán VietQR</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--text-primary)] tracking-tight text-balance">
            Bảng giá Bản quyền BIMAutomation
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
            Đầu tư một lần, tối ưu hàng trăm giờ mô hình hóa và triển khai hồ sơ mỗi tháng. Tương thích toàn bộ Autodesk Revit 2022–2027.
          </p>
        </header>

        {/* Pricing Cards Grid */}
        {isLoading ? (
          <div className="py-24 flex justify-center items-center gap-3 text-[var(--text-secondary)]">
            <Loader2 className="animate-spin text-[var(--brand)]" size={24} /> Đang tải dữ liệu bảng giá…
          </div>
        ) : (
          <div className="mt-14 grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
            {plans.map((plan) => {
              const isPopular = plan.isPopular;
              return (
                <article
                  key={plan.id}
                  className={`relative p-8 flex flex-col rounded-[var(--radius-panel)] transition-all duration-300 ${
                    isPopular
                      ? 'glass-panel !border-[var(--brand)]/60 shadow-xl ring-2 ring-[var(--brand)]/25 md:-translate-y-2'
                      : 'glass-panel hover:border-[var(--brand)]/50 shadow-sm'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-[var(--brand)] to-cyan-400 text-white px-3.5 py-1 text-[11px] font-extrabold rounded-full flex items-center gap-1 shadow-md tracking-wider uppercase">
                        <Star size={12} fill="currentColor" /> Được chọn nhiều nhất
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-[var(--text-primary)]">{plan.name}</h2>
                    {isPopular && (
                      <span className="text-xs font-mono font-bold text-[var(--brand)] bg-[var(--brand-soft)] border border-[var(--brand)]/30 px-2.5 py-0.5 rounded-full">
                        Tiết kiệm 30%
                      </span>
                    )}
                  </div>

                  <p className="mt-2 min-h-10 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {plan.description}
                  </p>
                  
                  <div className="mt-6 pt-6 border-t border-[var(--line)]">
                    <div className="flex items-baseline gap-1.5">
                      <strong className="text-3xl lg:text-4xl font-mono font-extrabold text-[var(--text-primary)]">
                        {plan.price}
                      </strong>
                      <span className="text-xs sm:text-sm font-medium text-[var(--text-muted)]"> {plan.period}</span>
                    </div>
                    {isPopular && (
                      <p className="text-xs text-[var(--brand)] font-semibold mt-1">
                        ~207.000đ / tháng (tiết kiệm hơn 1.000.000đ)
                      </p>
                    )}
                  </div>

                  <ul className="mt-7 space-y-3 flex-1">
                    {plan.features.map((featureItem) => (
                      <li key={featureItem} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text-primary)] font-medium">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={13} strokeWidth={2.5} />
                        </div>
                        <span>{featureItem}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => choose(plan)}
                    className={
                      isPopular
                        ? 'primary-button mt-8 w-full justify-center !py-3.5 text-sm font-bold shadow-md'
                        : 'secondary-button mt-8 w-full justify-center !py-3.5 text-sm font-bold'
                    }
                  >
                    Chọn gói {plan.name}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {/* Glass Trust & Guarantee Strip */}
        <div className="mt-14 max-w-4xl mx-auto glass-panel p-5 rounded-[var(--radius-panel)] flex flex-wrap items-center justify-around gap-6 text-xs text-[var(--text-secondary)] font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span>Thanh toán quét mã VietQR bảo mật</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span>Cấp License tự động sau 10 giây</span>
          </div>
          <div className="flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            <span>Xuất hóa đơn GTGT điện tử hợp lệ</span>
          </div>
          <div className="flex items-center gap-2">
            <Laptop size={18} className="text-blue-500" />
            <span>Tương thích Revit 2022–2027</span>
          </div>
        </div>

        {/* Custom Enterprise Quote Callout (Glass Card) */}
        <section className="mt-16 max-w-5xl mx-auto glass-panel p-8 lg:p-12 rounded-[var(--radius-panel)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--brand)] mb-2.5">
              <Building2 size={16} /> Gói Doanh nghiệp & Studio lớn
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Trang bị cho phòng BIM từ 5 đến 50+ máy tính?
            </h3>
            <p className="mt-2.5 text-sm text-[var(--text-secondary)] leading-relaxed">
              Liên hệ với chúng tôi để nhận bảng báo giá chiết khấu riêng (15% - 35%), tùy biến bộ tiện ích theo chuẩn công ty và hỗ trợ đào tạo chuyển giao trực tiếp cho kỹ sư.
            </p>
          </div>
          <button
            onClick={onOpenConsultation}
            className="primary-button shrink-0 text-sm sm:text-base font-bold !py-3.5 !px-7 shadow-md"
          >
            <Building2 size={17} /> Nhận báo giá Doanh nghiệp
          </button>
        </section>

        {/* Pricing FAQs (Glass Accordion) */}
        <section className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Câu hỏi thường gặp về Bảng giá & Thanh toán
            </h3>
          </div>

          <div className="space-y-3.5">
            {pricingFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-raised)] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full p-4 sm:p-5 text-left font-bold text-sm text-[var(--text-primary)] flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[var(--brand)]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--line)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Auth Prompt Dialog */}
        <AccessibleDialog
          open={authPrompt}
          onClose={close}
          title={`Tiếp tục với ${selected?.name || 'gói đã chọn'}`}
          description="Đăng nhập hoặc tạo tài khoản để thanh toán. Gói đã chọn sẽ được giữ lại."
        >
          <div className="grid gap-3 pt-2">
            <button onClick={() => auth('/login')} className="primary-button justify-center font-bold !py-3">
              Đăng nhập bằng Google
            </button>
            <button onClick={() => auth('/register')} className="secondary-button justify-center font-semibold !py-3">
              Tạo tài khoản mới
            </button>
          </div>
        </AccessibleDialog>

        {/* Checkout Dialog */}
        <AccessibleDialog
          open={checkout}
          onClose={close}
          title={order?.status === 'PAID' ? 'Thanh toán thành công' : 'Thanh toán đơn hàng'}
          description={!order ? `${selected?.name} · ${selected?.price}` : undefined}
        >
          {order?.status === 'PAID' ? (
            <div className="text-center py-4">
              <ShieldCheck size={56} className="mx-auto text-emerald-500 animate-fade-in" />
              <h3 className="mt-4 font-bold text-lg text-[var(--text-primary)]">Giao dịch thành công!</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Đơn hàng đã được xác nhận và License đã được kích hoạt trong tài khoản của bạn.
              </p>
              <button onClick={() => navigate('/account/licenses')} className="primary-button mt-6 w-full justify-center !py-3 font-bold">
                Xem License của tôi
              </button>
            </div>
          ) : !order ? (
            <div className="pt-2">
              <div className="border border-[var(--line)] bg-[var(--surface-subtle)] p-4 rounded-[var(--radius-panel)] flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)] font-medium">Tổng thanh toán</span>
                <strong className="font-mono text-lg font-bold text-[var(--brand)]">{selected?.price}</strong>
              </div>
              {error && (
                <p role="alert" className="mt-3 text-sm text-rose-500 font-medium">
                  {error}
                </p>
              )}
              <button onClick={create} disabled={busy} className="primary-button mt-5 w-full justify-center !py-3 text-sm font-bold">
                {busy ? <Loader2 className="animate-spin" /> : <CreditCard size={18} />} Tạo mã thanh toán VietQR
              </button>
            </div>
          ) : (
            <div className="text-center pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-3">
                <Loader2 size={13} className="animate-spin" /> Đang chờ quét mã thanh toán VietQR
              </div>

              {qr && (
                <>
                  <div className="bg-white p-3 w-56 h-56 mx-auto mt-2 rounded-xl border border-[var(--line)] shadow-md">
                    <img
                      className="w-full h-full object-contain"
                      src={qr.qr_code_url}
                      alt={`Mã QR thanh toán đơn ${qr.order_code}`}
                    />
                  </div>

                  <div className="mt-4 p-3.5 rounded-[var(--radius-panel)] bg-[var(--surface-subtle)] border border-[var(--line)] text-left space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Số tiền:</span>
                      <strong className="font-mono font-extrabold text-[var(--brand)] text-base">
                        {Number(qr.amount).toLocaleString('vi-VN')} đ
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Nội dung CK:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="font-mono font-bold text-[var(--text-primary)]">{qr.payment_content}</strong>
                        <button
                          onClick={() => copyText(qr.payment_content, 'memo')}
                          className="text-[var(--brand)] hover:opacity-80 p-1 cursor-pointer"
                          title="Sao chép nội dung"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    {copiedField === 'memo' && (
                      <p className="text-[11px] text-emerald-500 font-semibold text-right">Đã sao chép nội dung!</p>
                    )}
                  </div>
                </>
              )}

              <p className="mt-5 text-xs text-[var(--text-muted)] font-medium">
                Hệ thống tự động kích hoạt License ngay khi nhận được tiền (5–10 giây).
              </p>
            </div>
          )}
        </AccessibleDialog>
      </div>
    </div>
  );
}
