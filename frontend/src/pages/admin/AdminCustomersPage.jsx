import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { CheckCircle2, Loader2, ShieldCheck, ShieldPlus } from 'lucide-react';
import AccessibleDialog from '../../components/AccessibleDialog';
import { AdminSortableHeader, AdminTablePagination, AdminTableToolbar, useAdminTable } from '../../components/AdminTableTools';

const CUSTOMER_SEARCH_ACCESSORS = [
  'fullName', 'email', 'phone', 'jobTitle', 'revitVersion', 'activePlan', 'totalSpent', 'joinedAt', 'status', 'role',
];

const CUSTOMER_FILTER_PREDICATES = {
  status: (customer, value) => customer.status.toUpperCase() === value,
  role: (customer, value) => customer.role === value,
  account: (customer, value) => {
    if (value === 'PAID') return Boolean(customer.activePlan) || customer.totalSpent !== '0đ';
    if (value === 'TRIAL') return customer.isTrialRegistered && !customer.activePlan;
    return !customer.activePlan && !customer.isTrialRegistered && customer.totalSpent === '0đ';
  },
};

const CUSTOMER_FILTERS = [
  {
    key: 'status',
    label: 'Lọc trạng thái khách hàng',
    options: [
      { value: 'ALL', label: 'Mọi trạng thái' },
      { value: 'ACTIVE', label: 'Đang hoạt động' },
      { value: 'INACTIVE', label: 'Ngừng hoạt động' },
    ],
  },
  {
    key: 'account',
    label: 'Lọc loại tài khoản',
    options: [
      { value: 'ALL', label: 'Mọi loại tài khoản' },
      { value: 'PAID', label: 'Đã thanh toán' },
      { value: 'TRIAL', label: 'Dùng thử' },
      { value: 'STANDARD', label: 'Standard' },
    ],
  },
  {
    key: 'role',
    label: 'Lọc quyền hệ thống',
    options: [
      { value: 'ALL', label: 'Mọi quyền' },
      { value: 'ADMIN', label: 'Admin' },
      { value: 'USER', label: 'User' },
    ],
  },
];

const CUSTOMER_EXPORT_COLUMNS = [
  { label: 'Khách hàng', value: 'fullName' },
  { label: 'Email', value: 'email' },
  { label: 'Số điện thoại', value: 'phone' },
  { label: 'Chức danh', value: 'jobTitle' },
  { label: 'Phiên bản Revit', value: (customer) => customer.revitVersion === '—' ? '—' : `Revit ${customer.revitVersion}` },
  { label: 'Gói hiện tại', value: (customer) => customer.activePlan || (customer.isTrialRegistered ? '14-Day Trial' : 'Standard') },
  { label: 'Tổng chi tiêu', value: 'totalSpent' },
  { label: 'Ngày tham gia', value: 'joinedAt' },
  { label: 'Trạng thái', value: 'status' },
  { label: 'Quyền hệ thống', value: 'role' },
];
const CUSTOMER_SORT_COLUMNS = [
  { key: 'name', label: 'Khách hàng', value: 'fullName' },
  { key: 'environment', label: 'Môi trường', value: 'revitVersion' },
  { key: 'plan', label: 'Gói & chi tiêu', value: (customer) => customer.totalSpent },
  { key: 'joinedAt', label: 'Ngày tham gia', value: 'joinedAt' },
  { key: 'status', label: 'Trạng thái', value: 'status' },
  { key: 'role', label: 'Quyền hệ thống', value: 'role' },
];

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['adminCustomers'],
    queryFn: adminApi.getCustomers,
  });

  const table = useAdminTable({
    rows: customers,
    searchAccessors: CUSTOMER_SEARCH_ACCESSORS,
    filterPredicates: CUSTOMER_FILTER_PREDICATES,
    initialFilters: { status: 'ALL', account: 'ALL', role: 'ALL' },
    sortColumns: CUSTOMER_SORT_COLUMNS,
  });

  const grantAdmin = useMutation({
    mutationFn: (customer) => adminApi.grantAdminRole(customer.id),
    onSuccess: (_, customer) => {
      queryClient.setQueryData(['adminCustomers'], (current = []) =>
        current.map((item) => item.id === customer.id ? { ...item, role: 'ADMIN' } : item)
      );
      queryClient.invalidateQueries({ queryKey: ['adminCustomers'] });
      setSelectedCustomer(null);
      setSuccessMessage(`Đã cấp quyền admin cho ${customer.email}.`);
    },
  });

  const openGrantDialog = (customer) => {
    grantAdmin.reset();
    setSuccessMessage('');
    setSelectedCustomer(customer);
  };

  const closeGrantDialog = () => {
    if (!grantAdmin.isPending) setSelectedCustomer(null);
  };

  return (
    <div className="admin-page space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Quản lý khách hàng</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Danh sách tài khoản kỹ sư & công ty đã đăng ký trên hệ thống.</p>
      </div>

      {successMessage && (
        <div role="status" className="flex items-center gap-2.5 rounded-[var(--radius-control)] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={18} aria-hidden="true" />
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải danh sách khách hàng...
        </div>
      ) : (
        <div className="admin-table-section space-y-3">
          <AdminTableToolbar
            searchQuery={table.searchQuery}
            onSearchChange={table.setSearchQuery}
            searchPlaceholder="Tìm tên, email, điện thoại, Revit..."
            filters={CUSTOMER_FILTERS}
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
            exportColumns={CUSTOMER_EXPORT_COLUMNS}
            exportFilename="danh-sach-khach-hang"
          />
          <div className="panel overflow-hidden bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
            <div className="admin-table-scroll">
              <table className="admin-responsive-table customer-admin-table w-full text-left text-xs">
            <colgroup>
              <col className="customer-admin-table__index" />
              <col className="customer-admin-table__customer" />
              <col className="customer-admin-table__environment" />
              <col className="customer-admin-table__account" />
              <col className="customer-admin-table__joined" />
              <col className="customer-admin-table__status" />
              <col className="customer-admin-table__role" />
            </colgroup>
            <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
              <tr>
                <th className="px-4 py-3.5">#</th>
                <AdminSortableHeader label="Khách hàng & liên hệ" columnKey="name" activeSortKey={table.sortKey} sortDirection={table.sortDirection} onSort={table.requestSort} />
                <AdminSortableHeader label="Môi trường" columnKey="environment" activeSortKey={table.sortKey} sortDirection={table.sortDirection} onSort={table.requestSort} />
                <AdminSortableHeader label="Gói & chi tiêu" columnKey="plan" activeSortKey={table.sortKey} sortDirection={table.sortDirection} onSort={table.requestSort} />
                <AdminSortableHeader label="Ngày tham gia" columnKey="joinedAt" activeSortKey={table.sortKey} sortDirection={table.sortDirection} onSort={table.requestSort} />
                <AdminSortableHeader label="Trạng thái" columnKey="status" activeSortKey={table.sortKey} sortDirection={table.sortDirection} onSort={table.requestSort} />
                <AdminSortableHeader label="Quyền hệ thống" columnKey="role" activeSortKey={table.sortKey} sortDirection={table.sortDirection} onSort={table.requestSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {table.pageRows.map((c, i) => (
                <tr key={c.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                  <td data-label="Bản ghi" className="px-4 py-3.5 font-mono text-[var(--text-muted)] font-bold">{table.startIndex + i + 1}</td>
                  <td data-label="Khách hàng & liên hệ" data-span="full" className="px-4 py-3.5">
                    <p className="font-bold text-[var(--text-primary)]">{c.fullName}</p>
                    {c.jobTitle && c.jobTitle !== '—' && (
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{c.jobTitle}</p>
                    )}
                    <p className="mt-1 truncate text-[11px] font-medium text-[var(--brand)]" title={c.email}>{c.email}</p>
                  </td>
                  <td data-label="Môi trường" className="px-4 py-3.5 text-[var(--text-secondary)]">
                    <p className="font-mono">{c.revitVersion !== '—' ? `Revit ${c.revitVersion}` : 'Chưa có Revit'}</p>
                    <p className="mt-1 text-[11px]">{c.phone}</p>
                  </td>
                  <td data-label="Gói & chi tiêu" className="px-4 py-3.5">
                    {c.activePlan ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        {c.activePlan}
                      </span>
                    ) : c.totalSpent !== '0đ' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                        Đã thanh toán
                      </span>
                    ) : c.isTrialRegistered ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                        14-Day Trial
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-[var(--text-secondary)] border border-[var(--line)]">
                        Standard
                      </span>
                    )}
                    <p className="mt-2 font-mono font-bold text-[var(--text-primary)]">{c.totalSpent}</p>
                  </td>
                  <td data-label="Ngày tham gia" className="px-4 py-3.5 whitespace-nowrap text-[11px] text-[var(--text-secondary)]">{c.joinedAt}</td>
                  <td data-label="Trạng thái" className="px-4 py-3.5"><span className="status-tag status-tag--ok">{c.status}</span></td>
                  <td data-label="Quyền hệ thống" data-span="full" className="px-4 py-3.5">
                    {c.role === 'ADMIN' ? (
                      <span className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] border border-amber-500/30 bg-amber-500/10 px-3 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                        <ShieldCheck size={15} aria-hidden="true" />
                        Admin
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openGrantDialog(c)}
                        className="secondary-button whitespace-nowrap !min-h-9 !px-3 !py-1.5 !text-[11px]"
                        aria-label={`Cấp quyền admin cho ${c.email}`}
                      >
                        <ShieldPlus size={15} aria-hidden="true" />
                        Cấp quyền admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {table.pageRows.length === 0 ? (
                <tr>
                  <td data-label="Kết quả" colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Không tìm thấy khách hàng phù hợp. Hãy thử từ khóa hoặc bộ lọc khác.
                  </td>
                </tr>
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

      <AccessibleDialog
        open={!!selectedCustomer}
        onClose={closeGrantDialog}
        title="Xác nhận cấp quyền admin"
        description="Tài khoản admin có thể truy cập và quản lý toàn bộ khu vực quản trị. Hành động này sẽ được lưu vào nhật ký hệ thống."
      >
        {selectedCustomer && (
          <div className="space-y-5">
            <div className="rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm font-bold text-[var(--text-primary)]">{selectedCustomer.fullName}</p>
              <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{selectedCustomer.email}</p>
            </div>

            {grantAdmin.isError && (
              <p role="alert" className="rounded-[var(--radius-control)] border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-medium text-rose-600 dark:text-rose-300">
                {grantAdmin.error?.response?.data?.detail || 'Không thể cấp quyền admin. Vui lòng thử lại.'}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeGrantDialog} disabled={grantAdmin.isPending} className="secondary-button">
                Hủy
              </button>
              <button
                type="button"
                onClick={() => grantAdmin.mutate(selectedCustomer)}
                disabled={grantAdmin.isPending}
                className="primary-button"
              >
                {grantAdmin.isPending ? (
                  <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                ) : (
                  <ShieldPlus size={18} aria-hidden="true" />
                )}
                {grantAdmin.isPending ? 'Đang cấp quyền...' : 'Xác nhận cấp quyền'}
              </button>
            </div>
          </div>
        )}
      </AccessibleDialog>
    </div>
  );
}
