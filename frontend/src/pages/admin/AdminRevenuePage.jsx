import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { Loader2 } from 'lucide-react';
import { AdminSortableHeader, AdminTablePagination, AdminTableToolbar, useAdminTable } from '../../components/AdminTableTools';

const REVENUE_SEARCH_ACCESSORS = ['month', 'orders', 'revenueLabel'];
const REVENUE_FILTER_PREDICATES = {
  activity: (item, value) => value === 'WITH_ORDERS' ? item.orders > 0 : item.orders === 0,
};
const REVENUE_FILTERS = [{
  key: 'activity',
  label: 'Lọc kỳ doanh thu',
  options: [
    { value: 'ALL', label: 'Mọi kỳ báo cáo' },
    { value: 'WITH_ORDERS', label: 'Có đơn hàng' },
    { value: 'NO_ORDERS', label: 'Chưa có đơn' },
  ],
}];
const REVENUE_EXPORT_COLUMNS = [
  { label: 'Tháng / kỳ báo cáo', value: 'month' },
  { label: 'Số lượng đơn hàng', value: 'orders' },
  { label: 'Tổng doanh thu', value: 'revenueLabel' },
];
const REVENUE_SORT_COLUMNS = [
  { key: 'month', label: 'Tháng / kỳ báo cáo', value: 'month' },
  { key: 'orders', label: 'Số lượng đơn hàng', value: 'orders' },
  { key: 'revenue', label: 'Tổng doanh thu', value: 'revenue' },
];

export default function AdminRevenuePage() {
  const { data: revenueData = [], isLoading } = useQuery({
    queryKey: ['adminRevenue'],
    queryFn: adminApi.getRevenue,
  });

  const maxRevenue = Math.max(1, ...revenueData.map((d) => d.revenue));
  const orderedRevenue = [...revenueData].reverse();
  const table = useAdminTable({
    rows: orderedRevenue,
    searchAccessors: REVENUE_SEARCH_ACCESSORS,
    filterPredicates: REVENUE_FILTER_PREDICATES,
    initialFilters: { activity: 'ALL' },
    sortColumns: REVENUE_SORT_COLUMNS,
  });

  return (
    <div className="admin-page space-y-6">
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

          <div className="space-y-3">
            <AdminTableToolbar
              searchQuery={table.searchQuery}
              onSearchChange={table.setSearchQuery}
              searchPlaceholder="Tìm tháng, số đơn hoặc doanh thu..."
              filters={REVENUE_FILTERS}
              filterValues={table.filterValues}
              onFilterChange={table.setFilter}
              sortOptions={table.sortColumns}
              sortKey={table.sortKey}
              sortDirection={table.sortDirection}
              onSortChange={table.setSortKey}
              onSortDirectionToggle={table.toggleSortDirection}
              onReset={table.reset}
              resultCount={table.filteredRows.length}
              exportRows={table.filteredRows}
              exportColumns={REVENUE_EXPORT_COLUMNS}
              exportFilename="bao-cao-doanh-thu"
            />
            <div className="panel overflow-hidden bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
              <div className="overflow-x-auto">
                <table className="admin-responsive-table w-full text-left text-xs">
              <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
                <tr>
                  {REVENUE_SORT_COLUMNS.map((column) => (
                    <AdminSortableHeader key={column.key} label={column.label} columnKey={column.key} activeSortKey={table.sortKey} sortDirection={table.sortDirection} onSort={table.requestSort} />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {table.pageRows.map((r, i) => (
                  <tr key={i} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                    <td data-label="Kỳ báo cáo" className="px-4 py-3.5 font-bold text-[var(--text-primary)]">Tháng {r.month}</td>
                    <td data-label="Số đơn hàng" className="px-4 py-3.5 text-[var(--text-secondary)]">{r.orders} đơn hàng</td>
                    <td data-label="Tổng doanh thu" data-span="full" className="px-4 py-3.5 font-mono font-bold text-[var(--brand)]">{r.revenueLabel}</td>
                  </tr>
                ))}
                {table.pageRows.length === 0 ? (
                  <tr><td data-label="Kết quả" colSpan={3} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">Không tìm thấy kỳ báo cáo phù hợp.</td></tr>
                ) : null}
              </tbody>
                </table>
              </div>
              <AdminTablePagination
                currentPage={table.currentPage}
                totalPages={table.totalPages}
                pageSize={table.pageSize}
                totalRows={table.filteredRows.length}
                startIndex={table.startIndex}
                endIndex={table.endIndex}
                onPageChange={table.setPage}
                onPageSizeChange={table.setPageSize}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
