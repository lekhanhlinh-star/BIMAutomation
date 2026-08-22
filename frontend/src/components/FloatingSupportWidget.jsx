import React, { useEffect, useState } from 'react';
import { ArrowUp, Headphones, MessageCircle, PhoneCall, Sparkles } from 'lucide-react';

export default function FloatingSupportWidget({ onOpenConsultation }) {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside aria-label="Hỗ trợ & Liên hệ nhanh" className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
      {/* Consultation & Trial Quick Trigger Button */}
      <div className="pointer-events-auto flex items-center gap-2 group">
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-[var(--surface-raised)] border border-[var(--line)] shadow-md text-xs font-semibold text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
          Nhận tư vấn & Demo 15p
        </div>
        <button
          onClick={onOpenConsultation}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--brand)] text-[var(--brand-text)] font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-hidden"
          title="Đăng ký nhận tư vấn & Dùng thử"
        >
          <Headphones size={16} />
          <span>Nhận tư vấn</span>
        </button>
      </div>

      {/* Quick Contact Buttons Group */}
      <div className="pointer-events-auto flex flex-col gap-2.5 items-end">
        {/* Zalo Button */}
        <a
          href="https://zalo.me"
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 rounded-full bg-[#0068FF] text-white flex items-center justify-center shadow-md hover:scale-110 hover:shadow-lg transition-all"
          title="Chat Zalo Kỹ thuật (24/7)"
          aria-label="Chat Zalo hỗ trợ kỹ thuật"
        >
          <MessageCircle size={20} />
        </a>

        {/* Hotline Call Button */}
        <a
          href="tel:0904885833"
          className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:scale-110 hover:shadow-lg transition-all relative group"
          title="Hotline tư vấn: 0904 885 833"
          aria-label="Gọi hotline tư vấn"
        >
          <PhoneCall size={19} className="animate-pulse" />
          <span className="sr-only">0904 885 833</span>
        </a>

        {/* Back To Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-[var(--surface-raised)] border border-[var(--line)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand)] flex items-center justify-center shadow-md transition-all animate-fade-in"
            title="Cuộn lên đầu trang"
            aria-label="Cuộn lên đầu trang"
          >
            <ArrowUp size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}
