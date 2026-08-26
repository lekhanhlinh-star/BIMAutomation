import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './HomePage';
import FeaturesPage from './FeaturesPage';
import PricingPage from './PricingPage';
import DownloadPage from './DownloadPage';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Public Pages Integration', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders the marketing homepage with real Revit product evidence', () => {
    const Wrapper = createWrapper();
    render(<HomePage />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { name: /Ít thao tác.*Nhiều việc hoàn thành/i })).toBeInTheDocument();
    expect(screen.getByText(/Tự động hóa bố trí cốt thép, vẽ thép, kiểm tra/i)).toBeInTheDocument();
    expect(screen.getByText(/Từ cốt thép đến hồ sơ, trong một hệ công cụ/i)).toBeInTheDocument();
    expect(screen.getByAltText(/MCP Server đang chạy trực tiếp trong Autodesk Revit 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/Ảnh chụp sản phẩm thực tế/i)).toBeInTheDocument();
    expect(screen.getByText(/Tôi có cần biết viết prompt phức tạp không/i)).toBeInTheDocument();
    expect(screen.getByText(/Có thể dùng Codex, Claude hoặc Cursor không/i)).toBeInTheDocument();
  });

  it('renders the benefit-led FeaturesPage', () => {
    const Wrapper = createWrapper();
    render(<FeaturesPage />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { name: /Nhiều giờ thao tác.*Được trả lại cho kỹ sư/i })).toBeInTheDocument();
    expect(screen.getByText(/Bắt đầu từ kết quả bạn cần, không phải từ tên công cụ/i)).toBeInTheDocument();
    expect(screen.getByText(/Kết thúc việc vẽ từng thanh thép bằng tay/i)).toBeInTheDocument();
    expect(screen.getByText(/Từ một câu lệnh đến một kết quả có thể kiểm tra/i)).toBeInTheDocument();
  });

  it('renders the individual-focused trial, monthly, and annual pricing', async () => {
    const Wrapper = createWrapper();
    render(<PricingPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Một bộ công cụ.*Chọn thời gian phù hợp/i })).toBeInTheDocument();
      expect(screen.getByText(/Dùng thử 14 ngày/i)).toBeInTheDocument();
      expect(screen.getByText(/Gói cá nhân tháng/i)).toBeInTheDocument();
      expect(screen.getByText(/250\.000đ/i)).toBeInTheDocument();
      expect(screen.getByText(/Gói cá nhân năm/i)).toBeInTheDocument();
      expect(screen.getByText(/Tiết kiệm 500\.000đ/i)).toBeInTheDocument();
    });
  });

  it('renders DownloadPage with BIMAutomation.Installer.exe and 3-step guide', async () => {
    const Wrapper = createWrapper();
    render(<DownloadPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Tải phần mềm BIMAutomation/i)).toBeInTheDocument();
      expect(screen.getAllByText(/BIMAutomation\.Installer\.exe/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Mở Revit & Đăng nhập Google/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Yêu cầu hệ thống/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Điểm mới trong bản cập nhật/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Bản cài đang được đồng bộ/i })).toBeDisabled();
    });
  });
});
