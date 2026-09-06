import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getStats: vi.fn(),
  getRevenue: vi.fn(),
  getOrders: vi.fn(),
  getLicenses: vi.fn(),
  getDeviceTrials: vi.fn(),
}));

vi.mock('../../api/services', () => ({ adminApi: api }));

import AdminDashboardPage from './AdminDashboardPage';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AdminDashboardPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    api.getStats.mockResolvedValue({ totalRevenue: '3.750.000đ', totalCustomers: 24, activeLicenses: 2, pendingOrders: 1, recentGrowth: '+12%' });
    api.getRevenue.mockResolvedValue([
      { month: '05/2026', revenue: 500000, revenueLabel: '500.000đ', orders: 2 },
      { month: '06/2026', revenue: 750000, revenueLabel: '750.000đ', orders: 3 },
      { month: '07/2026', revenue: 1000000, revenueLabel: '1.000.000đ', orders: 4 },
      { month: '08/2026', revenue: 1500000, revenueLabel: '1.500.000đ', orders: 6 },
    ]);
    api.getOrders.mockResolvedValue([
      { id: 'ORD-1024', customer: 'Nguyễn Văn An', amount: '250.000đ', date: '27/08/2026', status: 'PENDING' },
    ]);
    api.getLicenses.mockResolvedValue([
      { id: 'lic-1', status: 'ACTIVE', remainingDays: 5, isOnline: true },
      { id: 'lic-2', status: 'REVOKED', remainingDays: 0, isOnline: false },
    ]);
    api.getDeviceTrials.mockResolvedValue([
      { id: 'trial-1', status: 'ACTIVE', isOnline: true },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('combines business trend, operational queue, and recent activity', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Dashboard quản trị hệ thống' })).toBeInTheDocument();
    expect(screen.getByText('3.750.000đ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /1 license sắp hết hạn/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /2 thiết bị online/ })).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '08/2026: 1.500.000đ, 6 đơn hàng' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem tất cả/ })).toHaveAttribute('href', '/admin/orders');
  });
});
