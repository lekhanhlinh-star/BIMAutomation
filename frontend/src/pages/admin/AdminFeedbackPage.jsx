import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { Loader2 } from 'lucide-react';

export default function AdminFeedbackPage() {
  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['adminFeedbacks'],
    queryFn: adminApi.getFeedbacks,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Quản lý phản hồi góp ý</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Ý kiến đóng góp và báo lỗi từ người dùng Add-in BIMAutomation.</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải phản hồi...
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="py-12 text-[var(--text-muted)] text-sm">Chưa có phản hồi nào.</div>
      ) : (
        <div className="border-t border-[var(--line)]">
          {feedbacks.map((f) => (
            <div key={f.id} className="py-6 border-b border-[var(--line)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-[var(--text-primary)] text-sm">{f.name}</span>
                  <span className="text-xs text-[var(--brand)] ml-2 font-mono font-medium">{f.email}</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-[var(--brand)] px-2.5 py-0.5 rounded bg-[var(--brand-soft)] border border-[var(--line)] uppercase tracking-wider">
                  {f.title || f.category}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed border-l-2 border-[var(--brand)] pl-3">
                {f.content}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">Gửi lúc: {f.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
