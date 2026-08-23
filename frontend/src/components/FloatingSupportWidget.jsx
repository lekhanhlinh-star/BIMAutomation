import React, { useEffect, useState } from 'react';

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
        Tư vấn
      </button>

      <div className="support-dock__links">
        <a
          href="https://zalo.me"
          target="_blank"
          rel="noopener noreferrer"
          className="support-dock__link"
          title="Chat Zalo Kỹ thuật (24/7)"
          aria-label="Chat Zalo hỗ trợ kỹ thuật"
        >
          Zalo
        </a>

        <a
          href="tel:0904885833"
          className="support-dock__link"
          title="Hotline tư vấn: 0904 885 833"
          aria-label="Gọi hotline tư vấn"
        >
          Hotline
        </a>

        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="support-dock__link"
            title="Cuộn lên đầu trang"
            aria-label="Cuộn lên đầu trang"
          >
            Lên đầu
          </button>
        )}
      </div>
    </aside>
  );
}
