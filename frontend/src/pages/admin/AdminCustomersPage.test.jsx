import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getCustomers, grantAdminRole } = vi.hoisted(() => ({
  getCustomers: vi.fn(),
  grantAdminRole: vi.fn(),
}));

vi.mock('../../api/services', () => ({
  adminApi: {
    getCustomers,
    grantAdminRole,
  },
}));

import AdminCustomersPage from './AdminCustomersPage';

const customer = {
  id: 'customer-1',
  fullName: 'Nguyễn Văn An',
  email: 'an@example.com',
  phone: '—',
  jobTitle: 'Kỹ sư BIM',
  revitVersion: '2025',
  activePlan: null,
  totalSpent: '0đ',
  isTrialRegistered: false,
  joinedAt: '25/08/2026',
  status: 'Active',
  role: 'USER',
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminCustomersPage />
    </QueryClientProvider>
  );
}

describe('AdminCustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCustomers.mockResolvedValue([customer]);
    grantAdminRole.mockImplementation(async () => {
      getCustomers.mockResolvedValue([{ ...customer, role: 'ADMIN' }]);
      return { id: customer.id, role: 'ADMIN' };
    });
  });

  afterEach(() => cleanup());

  it('confirms and grants admin access to another account', async () => {
    const user = userEvent.setup();
    renderPage();

    const grantButton = await screen.findByRole('button', {
      name: `Cấp quyền admin cho ${customer.email}`,
    });
    await user.click(grantButton);

    const dialog = screen.getByRole('dialog', { name: 'Xác nhận cấp quyền admin' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(customer.email)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xác nhận cấp quyền' }));

    await waitFor(() => expect(grantAdminRole).toHaveBeenCalledWith(customer.id));
    expect(await screen.findByRole('status')).toHaveTextContent(
      `Đã cấp quyền admin cho ${customer.email}.`
    );
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});
