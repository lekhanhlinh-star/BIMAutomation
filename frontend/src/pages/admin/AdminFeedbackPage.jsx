import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';

export default function AdminFeedbackPage() {
  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['adminFeedbacks'],
    queryFn: adminApi.getFeedbacks
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Quản lý phản hồi góp ý</h2>
        <p className="text-xs text-slate-500 mt-1">Ý kiến đóng góp và báo lỗi từ người dùng Add-in BIMAutomation.</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-slate-400">Đang tải phản hồi...</div>
      ) : feedbacks.length === 0 ? (
        <div className="py-12 text-slate-500 text-sm">Chưa có phản hồi nào.</div>
      ) : (
        <div className="border-t border-[var(--line)]">
          {feedbacks.map((f) => (
            <div key={f.id} className="py-6 border-b border-[var(--line)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-white text-sm">{f.name}</span>
                  <span className="text-xs text-cyan-300 ml-2 font-mono">{f.email}</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wide">{f.title || f.category}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-[var(--line)] pl-3">
                {f.content}
              </p>
              <p className="text-[10px] text-slate-500">Gửi lúc: {f.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
