import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let authState;

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: () => authState,
}));

vi.mock('../components/BrandLogo', () => ({
  default: () => <span>BIMAutomation</span>,
}));

vi.mock('../components/ThemeToggle', () => ({
  default: () => <button type="button">Đổi giao diện</button>,
}));

vi.mock('../components/ConsultationModal', () => ({
  default: () => null,
}));

vi.mock('../components/FloatingSupportWidget', () => ({
  default: () => null,
}));

import PublicLayout from './PublicLayout';

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<div>Nội dung trang</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('PublicLayout admin navigation', () => {
  beforeEach(() => {
    authState = {
      isAuthenticated: true,
      user: { name: 'Nguyễn Admin', email: 'admin@example.com', role: 'ADMIN' },
      logout: vi.fn(),
    };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the admin portal link in desktop and mobile navigation for admins', () => {
    renderLayout();

    const desktopAdminLink = screen.getByRole('link', { name: 'Quản trị' });
    expect(desktopAdminLink).toHaveAttribute('href', '/admin');

    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }));

    const adminLinks = screen.getAllByRole('link', { name: 'Quản trị' });
    expect(adminLinks).toHaveLength(2);
    expect(adminLinks.every((link) => link.getAttribute('href') === '/admin')).toBe(true);
  });

  it('does not show the admin portal link for a regular account', () => {
    authState = {
      ...authState,
      user: { name: 'Nguyễn User', email: 'user@example.com', role: 'USER' },
    };

    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }));

    expect(screen.queryByRole('link', { name: 'Quản trị' })).not.toBeInTheDocument();
  });
});
