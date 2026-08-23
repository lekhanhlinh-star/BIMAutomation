import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, Copy, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { customerApi, publicApi } from '../../api/services';
import { useAuthStore } from '../../store/useAuthStore';
import { savePendingIntent } from '../../utils/pendingIntent';
import AccessibleDialog from '../../components/AccessibleDialog';

const basePlans = [
  {
    id: 'p-trial', durationMonths: 0, name: 'Dùng thử 14 ngày', eyebrow: 'Bắt đầu không rủi ro', price: '0đ', period: '/ 14 ngày',
    description: 'Dùng trọn bộ BIMAutomation trên công việc thật trước khi quyết định.',
    features: ['Toàn bộ plugin và workflow AI', 'Không cần thẻ thanh toán', 'Dùng trên 1 máy cá nhân', 'Hỗ trợ cài đặt ban đầu'], cta: 'Bắt đầu dùng thử',
  },
  {
    id: 'p-month', durationMonths: 1, name: 'Gói cá nhân tháng', eyebrow: 'Linh hoạt theo dự án', price: '250.000đ', period: '/ tháng',
    description: 'Phù hợp khi bạn muốn bắt đầu gọn, thanh toán theo từng tháng.',
    features: ['Toàn bộ plugin BIMAutomation', 'Kết nối Codex, Claude và Cursor', 'Cập nhật tính năng trong thời hạn', 'Đổi máy làm việc linh hoạt'], cta: 'Chọn gói tháng',
  },
  {
    id: 'p-year', durationMonths: 12, name: 'Gói cá nhân năm', eyebrow: 'Tốt nhất cho người dùng thường xuyên', price: '2.500.000đ', period: '/ năm',
    equivalent: 'Tương đương 208.000đ/tháng', saving: 'Tiết kiệm 500.000đ',
    description: 'Một lần thanh toán cho cả năm, đủ thời gian để xây workflow làm việc ổn định.',
    features: ['Mọi quyền lợi của gói tháng', 'Tiết kiệm tương đương 2 tháng', 'Ưu tiên hỗ trợ qua Zalo', 'Nhận các bản cập nhật mới'], cta: 'Chọn gói năm', isPopular: true,
  },
];

const pricingFaqs = [
  { q: '14 ngày dùng thử có bị giới hạn tính năng không?', a: 'Không. Bạn có thể trải nghiệm trọn bộ plugin và workflow AI của BIMAutomation trên một máy trong 14 ngày, không cần nhập thông tin thẻ.' },
  { q: 'Gói tháng và gói năm khác nhau ở điểm nào?', a: 'Hai gói có cùng bộ tính năng. Gói tháng linh hoạt hơn; gói năm tiết kiệm 500.000đ và phù hợp nếu bạn dùng BIMAutomation thường xuyên.' },
  { q: 'Tôi có thể đổi sang máy tính khác không?', a: 'Có. Bạn có thể hủy liên kết thiết bị trong trang quản lý License rồi đăng nhập lại trên máy mới.' },
  { q: 'Sau khi thanh toán bao lâu thì được sử dụng?', a: 'License được kích hoạt tự động sau khi hệ thống xác nhận giao dịch VietQR, thường chỉ mất vài giây.' },
  { q: 'Tôi mua cá nhân nhưng cần hóa đơn VAT thì sao?', a: 'BIMAutomation hỗ trợ xuất hóa đơn điện tử hợp lệ. Bạn chỉ cần cung cấp thông tin xuất hóa đơn khi thanh toán.' },
];

export default function PricingPage() {
  const { data: apiPlans = [], isLoading } = useQuery({ queryKey: ['plans'], queryFn: publicApi.getPlans });
  const authenticated = useAuthStore((state) => state.isAuthenticated);
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

  const plans = useMemo(() => basePlans.map((plan) => {
    if (plan.durationMonths === 0) return plan;
    const apiPlan = apiPlans.find((candidate) => candidate.durationMonths === plan.durationMonths)
      || apiPlans.find((candidate) => candidate.period === plan.period);
    return { ...plan, checkoutId: apiPlan?.id || plan.id };
  }), [apiPlans]);

  const choose = useCallback((plan) => {
    setSelected(plan);
    setError('');
    if (plan.durationMonths === 0) {
      if (!authenticated) {
        savePendingIntent({ type: 'download', returnTo: '/download' });
        navigate('/login');
      } else navigate('/download');
      return;
    }
    if (!authenticated) setAuthPrompt(true);
    else setCheckout(true);
  }, [authenticated, navigate]);

  useEffect(() => {
    const planId = params.get('plan');
    if (authenticated && params.get('checkout') === '1' && planId) {
      const plan = plans.find((item) => String(item.checkoutId || item.id) === planId);
      if (plan) {
        choose(plan);
        setParams({}, { replace: true });
      }
    }
  }, [authenticated, params, plans, choose, setParams]);

  useEffect(() => {
    if (!order?.id || order.status === 'PAID') return undefined;
    const intervalId = setInterval(async () => {
      try { setOrder(await customerApi.getOrder(order.id)); } catch {}
    }, 3000);
    return () => clearInterval(intervalId);
  }, [order?.id, order?.status]);

  const auth = (path) => {
    savePendingIntent({ type: 'checkout', planId: selected.checkoutId || selected.id, returnTo: '/pricing' });
    navigate(path);
  };

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const created = (await customerApi.createOrder(selected.checkoutId || selected.id)).data;
      setOrder(created);
      setQr(await customerApi.getOrderQr(created.id));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally { setBusy(false); }
  };

  const close = () => {
    setAuthPrompt(false); setCheckout(false); setOrder(null); setQr(null); setError(''); setCopiedField('');
  };

  const copyText = (value, field) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  return (
    <div className="pricing-page pb-24 sm:pb-32">
      <section className="pricing-hero relative overflow-hidden border-b border-[var(--line)]">
        <div className="home-grid-pattern absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="page-shell relative py-16 text-center sm:py-24">
          <span className="home-kicker">Giá đơn giản cho kỹ sư Revit</span>
          <h1 className="mx-auto mt-6 max-w-4xl text-[clamp(2.75rem,6vw,5.5rem)] font-extrabold leading-[0.98] tracking-[-0.065em] text-balance">
            Một bộ công cụ. <span className="text-[var(--brand)]">Chọn thời gian phù hợp.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
            Không chia nhỏ tính năng, không bắt bạn chọn module. Mỗi gói cá nhân đều mở toàn bộ plugin BIMAutomation và workflow cùng AI.
          </p>
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-[var(--text-secondary)]">
            <span className="pricing-assurance">Không cần thẻ khi dùng thử</span>
            <span className="pricing-assurance">Gia hạn khi bạn cần</span>
            <span className="pricing-assurance">Revit 2022–2027</span>
          </div>
        </div>
      </section>

      <div className="page-shell">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm text-[var(--text-secondary)]"><Loader2 className="animate-spin text-[var(--brand)]" size={22} /> Đang chuẩn bị bảng giá…</div>
        ) : (
          <section className="pricing-personal-grid" aria-label="Các gói BIMAutomation dành cho cá nhân">
            {plans.map((plan) => (
              <article key={plan.id} className={`pricing-personal-card ${plan.isPopular ? 'is-popular' : ''}`}>
                {plan.isPopular && <div className="pricing-popular-label">Đáng chọn nhất</div>}
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand)]">{plan.eyebrow}</span>
                  <h2 className="mt-3 text-xl font-extrabold tracking-[-0.03em]">{plan.name}</h2>
                  <p className="mt-3 min-h-14 text-sm leading-6 text-[var(--text-secondary)]">{plan.description}</p>
                </div>
                <div className="mt-7 border-y border-[var(--line)] py-6">
                  <div className="flex flex-wrap items-end gap-2"><strong className="font-mono text-3xl font-extrabold tracking-[-0.06em] sm:text-4xl">{plan.price}</strong><span className="pb-1 text-xs text-[var(--text-muted)]">{plan.period}</span></div>
                  {plan.equivalent && <p className="mt-2 text-xs font-semibold text-[var(--text-secondary)]">{plan.equivalent}</p>}
                  {plan.saving && <span className="mt-3 inline-flex bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{plan.saving}</span>}
                </div>
                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((feature) => <li key={feature} className="pricing-feature-item">{feature}</li>)}
                </ul>
                <button onClick={() => choose(plan)} className={plan.isPopular ? 'primary-button mt-8 w-full justify-center' : 'secondary-button mt-8 w-full justify-center'}>{plan.cta} <ArrowRight size={16} /></button>
              </article>
            ))}
          </section>
        )}

        <section className="pricing-solo-proof">
          <div>
            <span className="home-kicker">Được thiết kế cho một người làm việc hiệu quả hơn</span>
            <h2 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl text-balance">Không cần mua từng plugin. Không cần tự ghép từng công cụ.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[[ 'Một tài khoản cá nhân', 'Đăng nhập và quản lý license của bạn ở một nơi.'], ['Một bộ cài', 'Dùng cùng các phiên bản Revit 2022 đến 2027 trên máy.'], ['Có người hỗ trợ', 'Nhận trợ giúp khi cài đặt hoặc chuyển sang workflow mới.']].map(([title, description]) => (
              <article key={title}><h3>{title}</h3><p>{description}</p></article>
            ))}
          </div>
        </section>

        <section className="pricing-faq-grid">
          <div>
            <span className="home-kicker">Cần biết trước khi bắt đầu</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Câu hỏi về gói cá nhân</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--text-secondary)]">Nếu công việc của bạn có yêu cầu riêng, hãy gửi một file mẫu để đội ngũ BIMAutomation tư vấn đúng workflow.</p>
            <button onClick={onOpenConsultation} className="home-arrow-link mt-6">Trao đổi với chúng tôi <ArrowRight size={16} /></button>
          </div>
          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {pricingFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return <article key={faq.q}>
                <button onClick={() => setOpenFaq(isOpen ? -1 : index)} className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-bold"><span>{faq.q}</span><ChevronDown size={17} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[var(--brand)]' : 'text-[var(--text-muted)]'}`} /></button>
                {isOpen && <p className="pb-6 pr-8 text-sm leading-7 text-[var(--text-secondary)]">{faq.a}</p>}
              </article>;
            })}
          </div>
        </section>

        <section className="pricing-team-note">
          <div><strong>Mua cho đội BIM hoặc doanh nghiệp?</strong><span>Chúng tôi vẫn có chính sách nhiều máy, đào tạo và hỗ trợ riêng.</span></div>
          <button onClick={onOpenConsultation}>Nhận báo giá đội nhóm <ArrowRight size={15} /></button>
        </section>
      </div>

      <AccessibleDialog open={authPrompt} onClose={close} title={`Tiếp tục với ${selected?.name || 'gói đã chọn'}`} description="Đăng nhập hoặc tạo tài khoản để thanh toán. Gói đã chọn sẽ được giữ lại.">
        <div className="grid gap-3 pt-2"><button onClick={() => auth('/login')} className="primary-button justify-center font-bold !py-3">Đăng nhập bằng Google</button><button onClick={() => auth('/register')} className="secondary-button justify-center font-semibold !py-3">Tạo tài khoản mới</button></div>
      </AccessibleDialog>

      <AccessibleDialog open={checkout} onClose={close} title={order?.status === 'PAID' ? 'Thanh toán thành công' : 'Thanh toán đơn hàng'} description={!order ? `${selected?.name} · ${selected?.price}` : undefined}>
        {order?.status === 'PAID' ? (
          <div className="py-4 text-center"><ShieldCheck size={56} className="mx-auto text-emerald-500" /><h3 className="mt-4 text-lg font-bold">Giao dịch thành công!</h3><p className="mt-2 text-sm text-[var(--text-secondary)]">License đã được kích hoạt trong tài khoản của bạn.</p><button onClick={() => navigate('/account/licenses')} className="primary-button mt-6 w-full justify-center">Xem License của tôi</button></div>
        ) : !order ? (
          <div className="pt-2"><div className="flex items-center justify-between border border-[var(--line)] bg-[var(--surface-subtle)] p-4 text-sm"><span className="text-[var(--text-secondary)]">Tổng thanh toán</span><strong className="font-mono text-lg text-[var(--brand)]">{selected?.price}</strong></div>{error && <p role="alert" className="mt-3 text-sm font-medium text-rose-500">{error}</p>}<button onClick={create} disabled={busy} className="primary-button mt-5 w-full justify-center">{busy ? <Loader2 className="animate-spin" /> : <CreditCard size={18} />} Tạo mã thanh toán VietQR</button></div>
        ) : (
          <div className="pt-2 text-center"><div className="mb-3 inline-flex items-center gap-2 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600"><Loader2 size={13} className="animate-spin" /> Đang chờ thanh toán VietQR</div>{qr && <><div className="mx-auto mt-2 h-56 w-56 border border-[var(--line)] bg-white p-3"><img className="h-full w-full object-contain" src={qr.qr_code_url} alt={`Mã QR thanh toán đơn ${qr.order_code}`} /></div><div className="mt-4 space-y-2 border border-[var(--line)] bg-[var(--surface-subtle)] p-3.5 text-left text-sm"><div className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">Số tiền:</span><strong className="font-mono text-[var(--brand)]">{Number(qr.amount).toLocaleString('vi-VN')}đ</strong></div><div className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">Nội dung CK:</span><div className="flex items-center gap-1"><strong className="font-mono">{qr.payment_content}</strong><button onClick={() => copyText(qr.payment_content, 'memo')} title="Sao chép nội dung"><Copy size={14} /></button></div></div>{copiedField === 'memo' && <p className="text-right text-[11px] font-semibold text-emerald-500">Đã sao chép!</p>}</div></>}<p className="mt-5 text-xs text-[var(--text-muted)]">License được kích hoạt tự động ngay khi giao dịch hoàn tất.</p></div>
        )}
      </AccessibleDialog>
    </div>
  );
}
