import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { Loader2 } from 'lucide-react';
import { AdminSortableHeader, AdminTablePagination, AdminTableToolbar, useAdminTable } from '../../components/AdminTableTools';

const PAYMENT_SEARCH_ACCESSORS = ['orderId', 'provider', 'txHash', 'amount', 'time', 'status'];
const PAYMENT_FILTER_PREDICATES = {
  status: (payment, value) => payment.status === value,
  provider: (payment, value) => String(payment.provider || '').toUpperCase() === value,
};
const PAYMENT_FILTERS = [
  {
    key: 'status',
    label: 'Lọc trạng thái giao dịch',
    options: [
      { value: 'ALL', label: 'Mọi trạng thái' },
      { value: 'SUCCESS', label: 'Thành công' },
      { value: 'PAID', label: 'Đã thanh toán' },
      { value: 'PENDING', label: 'Đang chờ' },
      { value: 'FAILED', label: 'Thất bại' },
    ],
  },
  {
    key: 'provider',
    label: 'Lọc kênh thanh toán',
    options: [
      { value: 'ALL', label: 'Mọi kênh' },
      { value: 'SEPAY', label: 'SePay' },
      { value: 'VIETQR', label: 'VietQR' },
      { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
    ],
  },
];
const PAYMENT_EXPORT_COLUMNS = [
  { label: 'Mã đơn hàng', value: 'orderId' },
  { label: 'Kênh thanh toán', value: 'provider' },
  { label: 'Mã giao dịch ngân hàng', value: 'txHash' },
  { label: 'Số tiền', value: 'amount' },
  { label: 'Thời gian', value: 'time' },
  { label: 'Trạng thái', value: 'status' },
];
const PAYMENT_SORT_COLUMNS = [
  { key: 'orderId', label: 'Mã đơn hàng', value: 'orderId' },
  { key: 'provider', label: 'Kênh thanh toán', value: 'provider' },
  { key: 'txHash', label: 'Mã GD ngân hàng', value: 'txHash' },
  { key: 'amount', label: 'Số tiền', value: 'amount' },
  { key: 'time', label: 'Thời gian', value: 'time' },
  { key: 'status', label: 'Trạng thái', value: 'status' },
];

export default function AdminPaymentsPage() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['adminPayments'],
    queryFn: adminApi.getPayments,
  });
  const table = useAdminTable({
    rows: payments,
    searchAccessors: PAYMENT_SEARCH_ACCESSORS,
    filterPredicates: PAYMENT_FILTER_PREDICATES,
    initialFilters: { status: 'ALL', provider: 'ALL' },
    sortColumns: PAYMENT_SORT_COLUMNS,
  });

  return (
    <div className="admin-page space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Quản lý giao dịch thanh toán</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Lịch sử biến động số dư và sao kê ngân hàng chuyển khoản tự động.</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải lịch sử giao dịch...
        </div>
      ) : (
        <div className="space-y-3">
          <AdminTableToolbar
            searchQuery={table.searchQuery}
            onSearchChange={table.setSearchQuery}
            searchPlaceholder="Tìm mã đơn, mã giao dịch, số tiền..."
            filters={PAYMENT_FILTERS}
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
            exportColumns={PAYMENT_EXPORT_COLUMNS}
            exportFilename="lich-su-thanh-toan"
          />
          <div className="panel overflow-hidden bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
            <div className="overflow-x-auto">
              <table className="admin-responsive-table w-full text-left text-xs">
            <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
              <tr>
                {PAYMENT_SORT_COLUMNS.map((column) => (
                  <AdminSortableHeader key={column.key} label={column.label} columnKey={column.key} activeSortKey={table.sortKey} sortDirection={table.sortDirection} onSort={table.requestSort} />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {table.pageRows.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                  <td data-label="Mã đơn hàng" className="px-4 py-3.5 font-mono font-bold text-[var(--brand)]">{p.orderId}</td>
                  <td data-label="Kênh thanh toán" className="px-4 py-3.5 font-medium text-[var(--text-primary)]">{p.provider}</td>
                  <td data-label="Mã giao dịch" data-span="full" className="px-4 py-3.5 font-mono text-[var(--text-muted)] break-all">{p.txHash}</td>
                  <td data-label="Số tiền" className="px-4 py-3.5 font-mono font-bold text-[var(--text-primary)]">{p.amount}</td>
                  <td data-label="Thời gian" className="px-4 py-3.5 text-[var(--text-secondary)]">{p.time}</td>
                  <td data-label="Trạng thái" className="px-4 py-3.5">
                    <span className={`status-tag ${p.status === 'SUCCESS' || p.status === 'PAID' ? 'status-tag--ok' : 'status-tag--pending'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {table.pageRows.length === 0 ? (
                <tr><td data-label="Kết quả" colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">Không tìm thấy giao dịch phù hợp. Hãy thử từ khóa hoặc bộ lọc khác.</td></tr>
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
      )}
    </div>
  );
}
