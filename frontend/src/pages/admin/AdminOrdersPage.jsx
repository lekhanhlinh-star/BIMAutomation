import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { Loader2 } from 'lucide-react';
import { AdminSortableHeader, AdminTablePagination, AdminTableToolbar, useAdminTable } from '../../components/AdminTableTools';

const ORDER_SEARCH_ACCESSORS = ['id', 'customer', 'email', 'plan', 'amount', 'date', 'status'];
const ORDER_FILTER_PREDICATES = { status: (order, value) => order.status === value };
const ORDER_FILTERS = [{
  key: 'status',
  label: 'Lọc trạng thái đơn hàng',
  options: [
    { value: 'ALL', label: 'Mọi trạng thái' },
    { value: 'PAID', label: 'Đã thanh toán' },
    { value: 'PENDING', label: 'Đang chờ' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'EXPIRED', label: 'Đã hết hạn' },
  ],
}];
const ORDER_EXPORT_COLUMNS = [
  { label: 'Mã đơn', value: 'id' },
  { label: 'Khách hàng', value: 'customer' },
  { label: 'Email', value: 'email' },
  { label: 'Gói dịch vụ', value: 'plan' },
  { label: 'Thành tiền', value: 'amount' },
  { label: 'Ngày tạo', value: 'date' },
  { label: 'Trạng thái', value: 'status' },
];
const ORDER_SORT_COLUMNS = [
  { key: 'id', label: 'Mã đơn', value: 'id' },
  { key: 'customer', label: 'Khách hàng', value: 'customer' },
  { key: 'plan', label: 'Gói dịch vụ', value: 'plan' },
  { key: 'amount', label: 'Thành tiền', value: 'amount' },
  { key: 'date', label: 'Ngày tạo', value: 'date' },
  { key: 'status', label: 'Trạng thái', value: 'status' },
];

export default function AdminOrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: adminApi.getOrders,
  });
  const table = useAdminTable({
    rows: orders,
    searchAccessors: ORDER_SEARCH_ACCESSORS,
    filterPredicates: ORDER_FILTER_PREDICATES,
    initialFilters: { status: 'ALL' },
    sortColumns: ORDER_SORT_COLUMNS,
  });

  return (
    <div className="admin-page space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Quản lý đơn hàng</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Theo dõi giao dịch mua bản quyền Add-in và trạng thái thanh toán tự động qua webhook.</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải danh sách đơn hàng...
        </div>
      ) : (
        <div className="space-y-3">
          <AdminTableToolbar
            searchQuery={table.searchQuery}
            onSearchChange={table.setSearchQuery}
            searchPlaceholder="Tìm mã đơn, khách hàng, email, gói..."
            filters={ORDER_FILTERS}
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
            exportColumns={ORDER_EXPORT_COLUMNS}
            exportFilename="danh-sach-don-hang"
          />
          <div className="panel overflow-hidden bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
            <div className="overflow-x-auto">
              <table className="admin-responsive-table w-full text-left text-xs">
            <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
              <tr>
                {ORDER_SORT_COLUMNS.map((column) => (
                  <AdminSortableHeader key={column.key} label={column.label} columnKey={column.key} activeSortKey={table.sortKey} sortDirection={table.sortDirection} onSort={table.requestSort} />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {table.pageRows.map((ord) => (
                <tr key={ord.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                  <td data-label="Mã đơn" data-span="full" className="px-4 py-3.5 font-mono text-[var(--text-muted)] font-bold">{ord.id}</td>
                  <td data-label="Khách hàng" data-span="full" className="px-4 py-3.5">
                    <p className="font-bold text-[var(--text-primary)]">{ord.customer}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{ord.email}</p>
                  </td>
                  <td data-label="Gói dịch vụ" className="px-4 py-3.5 text-[var(--text-secondary)] font-medium">{ord.plan}</td>
                  <td data-label="Thành tiền" className="px-4 py-3.5 font-mono font-bold text-[var(--brand)]">{ord.amount}</td>
                  <td data-label="Ngày tạo" className="px-4 py-3.5 text-[var(--text-secondary)]">{ord.date}</td>
                  <td data-label="Trạng thái" className="px-4 py-3.5">
                    <span
                      className={`status-tag ${
                        ord.status === 'PAID'
                          ? 'status-tag--ok'
                          : ord.status === 'PENDING'
                          ? 'status-tag--pending'
                          : 'status-tag--off'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
              {table.pageRows.length === 0 ? (
                <tr><td data-label="Kết quả" colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">Không tìm thấy đơn hàng phù hợp. Hãy thử từ khóa hoặc bộ lọc khác.</td></tr>
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
