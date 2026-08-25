import React, { useEffect, useState } from 'react';
import { ArrowUp, Headphones, PhoneCall } from 'lucide-react';

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
    <aside
      aria-label="Hỗ trợ & Liên hệ nhanh"
      className="support-dock"
    >
      <button
        onClick={onOpenConsultation}
        className="support-dock__primary"
        title="Đăng ký nhận tư vấn và dùng thử"
        aria-label="Nhận tư vấn và demo BIMAutomation"
      >
        <Headphones size={15} className="shrink-0" />
        <span>Tư vấn</span>
      </button>

      <div className="support-dock__links">
        <a
          href="https://zalo.me/g/euhwzpu6ouswooub16tl"
          target="_blank"
          rel="noopener noreferrer"
          className="support-dock__link"
          title="Nhóm Zalo hỗ trợ kỹ thuật (24/7)"
          aria-label="Tham gia nhóm Zalo hỗ trợ kỹ thuật"
        >
          <img
            src="/assets/brand/zalo-icon.png"
            alt="Zalo"
            width={18}
            height={18}
            className="shrink-0 rounded-[4px] object-contain shadow-xs"
            aria-hidden="true"
          />
          <span>Zalo</span>
        </a>

        <a
          href="tel:0799660737"
          className="support-dock__link"
          title="Hotline tư vấn: 0799 660 737"
          aria-label="Gọi hotline tư vấn"
        >
          <PhoneCall size={14} className="shrink-0 text-emerald-500" />
          <span>Hotline</span>
        </a>

        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="support-dock__link"
            title="Cuộn lên đầu trang"
            aria-label="Cuộn lên đầu trang"
          >
            <ArrowUp size={14} className="shrink-0" />
            <span>Lên đầu</span>
          </button>
        )}
      </div>
    </aside>
  );
}
