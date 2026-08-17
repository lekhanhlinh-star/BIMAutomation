import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({ login: vi.fn(), loginWithGoogle: vi.fn(), isLoading: false, error: null }),
}));
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('associates labels and focuses the first Vietnamese validation error', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    const email = screen.getByLabelText('Email');
    expect(email).toHaveAttribute('id', 'login-email');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập', exact: true }));
    expect(screen.getByText('Vui lòng nhập địa chỉ email hợp lệ.')).toBeInTheDocument();
    expect(email).toHaveFocus();
  });
});
