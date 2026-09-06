import React, { useDeferredValue, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const normalizeSearchValue = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi-VN');

const getCellValue = (row, accessor) =>
  typeof accessor === 'function' ? accessor(row) : row?.[accessor];

const normalizeSortValue = (value) => {
  if (value == null) return '';
  if (typeof value === 'number' || value instanceof Date) return value;

  const text = String(value).trim();
  const vietnameseDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (vietnameseDate) {
    const [, day, month, year, hour = '0', minute = '0'] = vietnameseDate;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }

  if (/^-?[\d.,]+\s*đ$/i.test(text)) {
    return Number(text.replace(/[^\d-]/g, '')) || 0;
  }

  return text;
};

const compareSortValues = (left, right) => {
  const a = normalizeSortValue(left);
  const b = normalizeSortValue(right);
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'vi-VN', { numeric: true, sensitivity: 'base' });
};

export function useAdminTable({
  rows = [],
  searchAccessors = [],
  filterPredicates = {},
  initialFilters = {},
  sortColumns = [],
  initialSort = null,
  initialPageSize = 10,
}) {
  const [searchQuery, setSearchQueryState] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [filterValues, setFilterValues] = useState(initialFilters);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [sortConfig, setSortConfig] = useState(initialSort);

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(deferredSearchQuery.trim());
    const matches = rows.filter((row) => {
      const matchesSearch = !normalizedQuery || searchAccessors.some((accessor) =>
        normalizeSearchValue(getCellValue(row, accessor)).includes(normalizedQuery)
      );

      if (!matchesSearch) return false;

      return Object.entries(filterValues).every(([key, value]) => {
        if (!value || value === 'ALL') return true;
        const predicate = filterPredicates[key];
        return predicate ? predicate(row, value) : true;
      });
    });

    if (!sortConfig?.key) return matches;
    const column = sortColumns.find((item) => item.key === sortConfig.key);
    if (!column) return matches;
    const direction = sortConfig.direction === 'desc' ? -1 : 1;

    return matches
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const result = compareSortValues(
          getCellValue(left.row, column.value),
          getCellValue(right.row, column.value)
        );
        return result === 0 ? left.index - right.index : result * direction;
      })
      .map(({ row }) => row);
  }, [deferredSearchQuery, filterPredicates, filterValues, rows, searchAccessors, sortColumns, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRows.length);
  const pageRows = filteredRows.slice(startIndex, endIndex);

  const setSearchQuery = (value) => {
    setSearchQueryState(value);
    setPageState(1);
  };

  const setFilter = (key, value) => {
    setFilterValues((current) => ({ ...current, [key]: value }));
    setPageState(1);
  };

  const setPageSize = (value) => {
    setPageSizeState(Number(value));
    setPageState(1);
  };

  const setPage = (value) => {
    setPageState(Math.min(Math.max(1, value), totalPages));
  };

  const requestSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPageState(1);
  };

  const setSortKey = (key) => {
    setSortConfig((current) => key ? {
      key,
      direction: current?.key === key ? current.direction : 'asc',
    } : null);
    setPageState(1);
  };

  const toggleSortDirection = () => {
    setSortConfig((current) => current?.key ? {
      ...current,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    } : current);
    setPageState(1);
  };

  const reset = () => {
    setSearchQueryState('');
    setFilterValues(initialFilters);
    setSortConfig(initialSort);
    setPageState(1);
  };

  return {
    searchQuery,
    setSearchQuery,
    filterValues,
    setFilter,
    sortColumns,
    sortKey: sortConfig?.key || '',
    sortDirection: sortConfig?.direction || 'asc',
    requestSort,
    setSortKey,
    toggleSortDirection,
    filteredRows,
    pageRows,
    pageSize,
    setPageSize,
    currentPage,
    totalPages,
    setPage,
    startIndex,
    endIndex,
    reset,
  };
}

export function AdminSortableHeader({
  label,
  columnKey,
  activeSortKey,
  sortDirection,
  onSort,
  className = '',
}) {
  const isActive = activeSortKey === columnKey;
  const Icon = isActive ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      className={`px-4 py-3.5 ${className}`}
      aria-sort={isActive ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        className={`admin-sort-button ${isActive ? 'admin-sort-button--active' : ''}`}
        onClick={() => onSort(columnKey)}
        aria-label={`Sắp xếp theo ${label}${isActive ? `, hiện đang ${sortDirection === 'asc' ? 'tăng dần' : 'giảm dần'}` : ''}`}
      >
        <span>{label}</span>
        <Icon size={13} aria-hidden="true" />
      </button>
    </th>
  );
}

const protectSpreadsheetCell = (value) => {
  const text = String(value ?? '');
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const escapeCsvCell = (value) => `"${protectSpreadsheetCell(value).replace(/"/g, '""')}"`;

export function exportTableToExcel(rows, columns, filename) {
  const header = columns.map((column) => escapeCsvCell(column.label)).join(',');
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvCell(getCellValue(row, column.value))).join(',')
  );
  const csv = `\uFEFF${[header, ...body].join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminTableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm trong bảng...',
  filters = [],
  filterValues = {},
  onFilterChange,
  sortOptions = [],
  sortKey = '',
  sortDirection = 'asc',
  onSortChange,
  onSortDirectionToggle,
  onReset,
  resultCount,
  exportRows = [],
  exportColumns = [],
  exportFilename = 'du-lieu',
}) {
  const hasActiveControls = searchQuery.trim() || sortKey || filters.some((filter) => {
    const value = filterValues[filter.key];
    return value && value !== 'ALL';
  });

  return (
    <div className="admin-table-toolbar">
      <div className="admin-table-toolbar__controls">
        <label className="admin-table-search">
          <span className="sr-only">Tìm kiếm</span>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>

        {filters.map((filter) => (
          <label key={filter.key} className="admin-table-filter">
            <span className="sr-only">{filter.label}</span>
            <SlidersHorizontal size={15} aria-hidden="true" />
            <select
              aria-label={filter.label}
              value={filterValues[filter.key] ?? 'ALL'}
              onChange={(event) => onFilterChange(filter.key, event.target.value)}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        ))}

        {sortOptions.length > 0 ? (
          <div className="admin-table-sort-controls">
            <label className="admin-table-filter admin-table-sort-picker">
              <span className="sr-only">Chọn cột sắp xếp</span>
              <ArrowUpDown size={15} aria-hidden="true" />
              <select
                aria-label="Sắp xếp theo"
                value={sortKey}
                onChange={(event) => onSortChange(event.target.value)}
              >
                <option value="">Sắp xếp</option>
                {sortOptions.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="admin-table-sort-direction"
              onClick={onSortDirectionToggle}
              disabled={!sortKey}
              aria-label={`Đổi sang sắp xếp ${sortDirection === 'asc' ? 'giảm dần' : 'tăng dần'}`}
              title={sortDirection === 'asc' ? 'Đang tăng dần' : 'Đang giảm dần'}
            >
              {sortDirection === 'asc'
                ? <ArrowUp size={15} aria-hidden="true" />
                : <ArrowDown size={15} aria-hidden="true" />}
            </button>
          </div>
        ) : null}

        {hasActiveControls ? (
          <button type="button" onClick={onReset} className="admin-table-reset">
            <RotateCcw size={14} aria-hidden="true" /> Xóa lọc
          </button>
        ) : null}
      </div>

      <div className="admin-table-toolbar__meta">
        <span role="status">{resultCount} kết quả</span>
        <button
          type="button"
          onClick={() => exportTableToExcel(exportRows, exportColumns, exportFilename)}
          disabled={exportRows.length === 0}
          className="admin-table-export"
        >
          <Download size={16} aria-hidden="true" /> Xuất Excel
        </button>
      </div>
    </div>
  );
}

export function AdminTablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalRows,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalRows === 0) return null;

  return (
    <div className="admin-table-pagination" aria-label="Phân trang bảng">
      <p>
        Hiển thị <strong>{startIndex + 1}–{endIndex}</strong> trên <strong>{totalRows}</strong>
      </p>
      <div>
        <label>
          <span>Số dòng</span>
          <select
            aria-label="Số dòng mỗi trang"
            value={pageSize}
            onChange={(event) => onPageSizeChange(event.target.value)}
          >
            {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span>Trang <strong>{currentPage}</strong> / {totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Trang sau"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
