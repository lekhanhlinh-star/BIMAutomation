import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';

export default function AdminRevenuePage() {
  const { data: revenueData = [], isLoading } = useQuery({
    queryKey: ['adminRevenue'],
    queryFn: adminApi.getRevenue
  });

  const maxRevenue = Math.max(1, ...revenueData.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Báo cáo doanh thu</h2>
        <p className="text-xs text-slate-500 mt-1">Thống kê doanh thu theo thời gian và tăng trưởng kinh doanh BIMAutomation.</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-slate-400">Đang tải báo cáo doanh thu...</div>
      ) : (
        <>
          <div className="panel p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Doanh thu {revenueData.length} tháng gần nhất</h3>
            <div className="h-48 flex items-stretch justify-between gap-4 pt-8 pb-2 border-b border-[var(--line)]">
              {revenueData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full gap-2 group">
                  <span className="text-[10px] font-mono text-cyan-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{d.revenueLabel}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-cyan-400/70 group-hover:bg-cyan-300 transition-colors"
                      style={{ height: `${Math.max(2, (d.revenue / maxRevenue) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-slate-500 uppercase font-mono border-b border-[var(--line)]">
                <tr>
                  <th className="px-4 py-3">Tháng / kỳ báo cáo</th>
                  <th className="px-4 py-3">Số lượng đơn hàng</th>
                  <th className="px-4 py-3">Tổng doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)]">
                {[...revenueData].reverse().map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5 font-semibold text-white">Tháng {r.month}</td>
                    <td className="px-4 py-3.5 text-slate-300">{r.orders} đơn hàng</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-cyan-300">{r.revenueLabel}</td>
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
