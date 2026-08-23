import React from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockLoginWithGoogle = vi.fn();
const mockLogin = vi.fn();

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    loginWithGoogle: mockLoginWithGoogle,
    login: mockLogin,
    isLoading: false,
    error: null,
  }),
}));
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Google OAuth login button and triggers login on click', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Đăng nhập hệ thống')).toBeInTheDocument();
    const googleButton = screen.getByRole('button', { name: /Tiếp tục với Google/i });
    expect(googleButton).toBeInTheDocument();

    fireEvent.click(googleButton);
    expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('renders fallback email/password login form and triggers login with credentials', async () => {
    mockLogin.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('hoặc')).toBeInTheDocument();
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Mật khẩu/i);
    const emailSubmitButton = screen.getByRole('button', { name: /Đăng nhập với Email/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(emailSubmitButton).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: 'engineer@bimautomation.vn' } });
    fireEvent.change(passwordInput, { target: { value: 'SecretPassword123!' } });
    fireEvent.click(emailSubmitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('engineer@bimautomation.vn', 'SecretPassword123!');
    });
  });

  it('renders clickable links for Terms of Service and Privacy Policy', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const termsLink = screen.getByRole('link', { name: /Điều khoản dịch vụ/i });
    const privacyLink = screen.getByRole('link', { name: /Chính sách bảo vệ dữ liệu/i });

    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/feedback');
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/feedback');
  });
});

