import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Download, LogIn, PlayCircle, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { savePendingIntent } from '../../utils/pendingIntent';

export default function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const startTrial = () => {
    if (isAuthenticated) return navigate('/download');
    savePendingIntent({ type: 'download', returnTo: '/download' });
    navigate('/login');
  };
  return (
    <div className="pb-20">
      <section className="page-shell grid lg:grid-cols-[.88fr_1.12fr] gap-10 lg:gap-14 items-center pt-14 lg:pt-20 pb-14">
        <div className="text-center lg:text-left">
          <p className="flex justify-center lg:justify-start items-center gap-2 text-sm font-semibold text-cyan-300"><Zap size={15} /> Add-in tự động hóa cho Revit</p>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.7rem] leading-[1.03] tracking-tight font-extrabold text-white text-balance">Làm BIM nhanh hơn.<br/>Dễ hơn mỗi ngày.</h1>
          <p className="mt-5 text-base lg:text-lg leading-relaxed text-slate-400 max-w-xl mx-auto lg:mx-0">BIMAutomation giúp kỹ sư và kiến trúc sư tự động hóa những thao tác Revit lặp lại, từ ghi kích thước đến xuất hàng trăm bản vẽ.</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
            <button onClick={startTrial} className="primary-button"><Download size={19}/> Dùng thử miễn phí</button>
            <Link to="/features" className="secondary-button">Xem tính năng <ArrowRight size={18}/></Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">Đăng nhập để tải Add-in · Hỗ trợ Revit 2021–2025</p>
        </div>
        <figure><div className="product-frame"><img src="/assets/product/bimautomation-hero.webp" width="1586" height="992" fetchPriority="high" alt="Mockup giao diện BIMAutomation kiểm tra bản vẽ Revit" /></div><figcaption className="illustration-note">Hình minh họa giao diện BIMAutomation</figcaption></figure>
      </section>
      <section className="border-y border-[var(--line)]"><div className="page-shell py-8 grid grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--line-soft)]">{[['30+', 'công cụ Revit'], ['80%', 'thời gian tiết kiệm'], ['2021–2025', 'phiên bản tương thích'], ['24/7', 'hỗ trợ kỹ thuật']].map(([value,label]) => <div key={label} className="text-center lg:text-left px-4 first:pl-0"><strong className="block text-2xl font-mono font-bold text-white">{value}</strong><span className="text-xs text-slate-500">{label}</span></div>)}</div></section>
      <section className="page-shell py-16">
        <div className="max-w-2xl"><h2 className="text-3xl font-bold text-white">Một hành trình rõ ràng từ dùng thử đến làm việc</h2></div>
        <ol className="mt-9 grid md:grid-cols-3 border-t border-l border-[var(--line)]">{[[Download, '01', 'Tải Add-in', 'Đăng nhập và tải đúng bộ cài cho phiên bản Revit của bạn.'],[LogIn, '02', 'Kích hoạt tài khoản', 'Đăng nhập ngay trong BIMAutomation để bắt đầu thời gian dùng thử.'],[PlayCircle, '03', 'Tự động hóa', 'Chọn công cụ trên Ribbon và xử lý tác vụ chỉ bằng vài thao tác.']].map(([Icon,n,title,body]) => <li key={n} className="p-6 border-r border-b border-[var(--line)]"><div className="flex items-center justify-between"><Icon className="text-cyan-300" size={20}/><span className="font-mono text-sm text-slate-600">{n}</span></div><h3 className="mt-5 font-bold text-white">{title}</h3><p className="mt-2 text-sm text-slate-400 leading-relaxed">{body}</p></li>)}</ol>
      </section>
      <section className="page-shell border-t border-[var(--line)] pt-12 flex flex-col md:flex-row gap-6 items-center justify-between"><div><h2 className="text-2xl font-bold text-white">Bắt đầu dùng thử BIMAutomation hôm nay</h2><p className="mt-2 text-sm text-slate-400 flex items-center gap-2"><Check size={16} className="text-cyan-300"/> Không cần thẻ thanh toán để tải bản dùng thử.</p></div><button onClick={startTrial} className="primary-button shrink-0">Dùng thử ngay <ArrowRight size={18}/></button></section>
    </div>
  );
}
