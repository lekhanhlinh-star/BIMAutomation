import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { Loader2 } from 'lucide-react';

export default function AdminRevenuePage() {
  const { data: revenueData = [], isLoading } = useQuery({
    queryKey: ['adminRevenue'],
    queryFn: adminApi.getRevenue,
  });

  const maxRevenue = Math.max(1, ...revenueData.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Báo cáo doanh thu</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Thống kê doanh thu theo thời gian và tăng trưởng kinh doanh BIMAutomation.</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải báo cáo doanh thu...
        </div>
      ) : (
        <>
          <div className="panel p-6 space-y-4 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Doanh thu {revenueData.length} tháng gần nhất</h3>
            <div className="h-48 flex items-stretch justify-between gap-4 pt-8 pb-2 border-b border-[var(--line)]">
              {revenueData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full gap-2 group">
                  <span className="text-[10px] font-mono text-[var(--brand)] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.revenueLabel}
                  </span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-[var(--brand)]/80 hover:bg-[var(--brand)] transition-colors rounded-t"
                      style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono font-medium">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel overflow-x-auto bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
                <tr>
                  <th className="px-4 py-3.5">Tháng / kỳ báo cáo</th>
                  <th className="px-4 py-3.5">Số lượng đơn hàng</th>
                  <th className="px-4 py-3.5">Tổng doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {[...revenueData].reverse().map((r, i) => (
                  <tr key={i} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[var(--text-primary)]">Tháng {r.month}</td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">{r.orders} đơn hàng</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-[var(--brand)]">{r.revenueLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
