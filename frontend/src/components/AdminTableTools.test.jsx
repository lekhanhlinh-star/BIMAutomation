import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AdminTablePagination,
  AdminSortableHeader,
  AdminTableToolbar,
  exportTableToExcel,
  useAdminTable,
} from './AdminTableTools';

const rows = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `Kỹ sư ${index + 1}`,
  status: index % 2 === 0 ? 'ACTIVE' : 'INACTIVE',
}));

const searchAccessors = ['name', 'status'];
const filterPredicates = { status: (row, value) => row.status === value };
const filters = [{
  key: 'status',
  label: 'Lọc trạng thái',
  options: [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'INACTIVE', label: 'Ngừng hoạt động' },
  ],
}];
const exportColumns = [
  { label: 'Tên', value: 'name' },
  { label: 'Trạng thái', value: 'status' },
];
const sortColumns = [
  { key: 'name', label: 'Tên', value: 'name' },
  { key: 'id', label: 'Mã', value: 'id' },
];

function TableHarness() {
  const table = useAdminTable({
    rows,
    searchAccessors,
    filterPredicates,
    initialFilters: { status: 'ALL' },
    sortColumns,
  });

  return (
    <>
      <AdminTableToolbar
        searchQuery={table.searchQuery}
        onSearchChange={table.setSearchQuery}
        filters={filters}
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
        exportColumns={exportColumns}
      />
      <ul>{table.pageRows.map((row) => <li key={row.id}>{row.name}</li>)}</ul>
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
    </>
  );
}

describe('AdminTableTools', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('searches, filters and paginates local table rows', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);

    expect(screen.getByText('Kỹ sư 10')).toBeInTheDocument();
    expect(screen.queryByText('Kỹ sư 11')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    expect(screen.getByText('Kỹ sư 11')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'Kỹ sư 12');
    expect(await screen.findByText('Kỹ sư 12')).toBeInTheDocument();
    expect(screen.queryByText('Kỹ sư 11')).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc trạng thái' }), 'ACTIVE');
    expect(screen.getByRole('status')).toHaveTextContent('6 kết quả');
    expect(screen.queryByText('Kỹ sư 2')).not.toBeInTheDocument();
  });

  it('exports the filtered data as an Excel-compatible CSV file', () => {
    const createObjectURL = vi.fn(() => 'blob:table-export');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    exportTableToExcel(
      [{ name: '=CMD()', status: 'ACTIVE' }],
      exportColumns,
      'khach-hang'
    );

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:table-export');
  });

  it('sorts before pagination and toggles the selected direction', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sắp xếp theo' }), 'name');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Kỹ sư 1');

    await user.click(screen.getByRole('button', { name: 'Đổi sang sắp xếp giảm dần' }));
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Kỹ sư 12');
    expect(screen.queryByText('Kỹ sư 1')).not.toBeInTheDocument();
  });

  it('exposes the active sort direction on desktop column headers', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    const { rerender } = render(
      <table><thead><tr><AdminSortableHeader label="Khách hàng" columnKey="name" activeSortKey="" sortDirection="asc" onSort={onSort} /></tr></thead></table>
    );

    await user.click(screen.getByRole('button', { name: 'Sắp xếp theo Khách hàng' }));
    expect(onSort).toHaveBeenCalledWith('name');

    rerender(
      <table><thead><tr><AdminSortableHeader label="Khách hàng" columnKey="name" activeSortKey="name" sortDirection="desc" onSort={onSort} /></tr></thead></table>
    );
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'descending');
  });
});
