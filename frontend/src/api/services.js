import { axiosClient } from './axiosClient';

export const getPlanPresentation = (durationMonths) => {
  const annual = durationMonths === 12;
  const enterprise = durationMonths >= 120;
  return {
    name: enterprise ? 'Gói Doanh nghiệp' : annual ? 'Gói Năm' : 'Gói Tháng',
    period: enterprise ? '/ giấy phép' : annual ? '/ năm' : '/ tháng',
    description: enterprise
      ? 'Cho đội ngũ cần quản lý giấy phép và hỗ trợ triển khai tập trung.'
      : annual
        ? 'Giá tốt nhất cho kỹ sư và kiến trúc sư sử dụng thường xuyên.'
        : 'Linh hoạt cho dự án ngắn hạn hoặc người mới bắt đầu.',
    features: enterprise
      ? ['Bản quyền sử dụng dài hạn', '30+ công cụ BIMAutomation', 'Quản lý giấy phép tập trung', 'Hỗ trợ triển khai doanh nghiệp']
      : annual
        ? ['Toàn bộ 30+ công cụ', 'Cập nhật miễn phí trong kỳ', 'Hỗ trợ ưu tiên', 'Đổi thiết bị linh hoạt']
        : ['Các công cụ thiết yếu', 'Cập nhật trong thời hạn gói', 'Hỗ trợ qua email', 'Kích hoạt trên 1 thiết bị'],
    isPopular: annual,
  };
};

// Public Services
export const publicApi = {
  getPlans: async () => {
    try {
      const res = await axiosClient.get('/plans');
      if (res.data && res.data.length > 0) {
        return res.data.map(p => {
          const presentation = getPlanPresentation(p.duration_months);
          return ({
          id: p.id,
          name: presentation.name,
          price: typeof p.price === 'number' ? `${p.price.toLocaleString('vi-VN')}đ` : p.price,
          period: presentation.period,
          description: presentation.description,
          features: presentation.features,
          isPopular: presentation.isPopular,
        });
        });
      }
      throw new Error("No plans");
    } catch {
      return [
        { id: 'p1', name: 'Gói Tháng', price: '290.000đ', period: '/ tháng', description: 'Linh hoạt cho dự án ngắn hạn hoặc người mới bắt đầu.', features: ['Các công cụ thiết yếu', 'Cập nhật trong thời hạn gói', 'Hỗ trợ qua email', 'Kích hoạt trên 1 thiết bị'], isPopular: false },
        { id: 'p2', name: 'Gói Năm', price: '2.490.000đ', period: '/ năm', description: 'Giá tốt nhất cho kỹ sư và kiến trúc sư sử dụng thường xuyên.', features: ['Toàn bộ 30+ công cụ', 'Cập nhật miễn phí trong kỳ', 'Hỗ trợ ưu tiên', 'Đổi thiết bị linh hoạt'], isPopular: true },
        { id: 'p3', name: 'Gói Doanh nghiệp', price: '6.900.000đ', period: '/ giấy phép', description: 'Cho đội ngũ cần quản lý giấy phép và hỗ trợ triển khai tập trung.', features: ['Bản quyền sử dụng dài hạn', '30+ công cụ BIMAutomation', 'Quản lý giấy phép tập trung', 'Hỗ trợ triển khai doanh nghiệp'], isPopular: false }
      ];
    }
  },

  getFeatures: async () => {
    try {
      const res = await axiosClient.get('/public/features');
      return res.data;
    } catch {
      return [
        { id: 'batch-rename', title: 'Đổi tên hàng loạt', category: 'Quản lý dữ liệu', description: 'Đổi tên hàng loạt View, Sheet và Family theo quy tắc.', image: '/assets/product/batch-rename.webp' },
        { id: 'auto-dimension', title: 'Ghi kích thước tự động', category: 'Khai triển bản vẽ', description: 'Tạo kích thước theo tiêu chuẩn dự án.', image: '/assets/product/auto-dimension.webp' },
        { id: 'parameter-manager', title: 'Quản lý tham số', category: 'Quản lý dữ liệu', description: 'Kiểm tra và đồng bộ tham số mô hình.', image: '/assets/product/parameter-manager.webp' },
        { id: 'sheet-automation', title: 'Xuất bản bản vẽ', category: 'Hồ sơ', description: 'Xuất bản nhiều Sheet theo cấu hình.', image: '/assets/product/sheet-publisher.webp' },
        { id: 'export-tools', title: 'Xuất file hàng loạt', category: 'Trao đổi dữ liệu', description: 'Xuất PDF, DWG và IFC theo quy tắc tên.', image: '/assets/product/batch-exporter.webp' }
      ];
    }
  },

  getTutorials: async () => {
    try {
      const res = await axiosClient.get('/public/tutorials');
      return res.data;
    } catch {
      return [
        { id: 1, title: 'Hướng dẫn Cài đặt & Kích hoạt License BIMAutomation trong Revit', duration: '05:20', level: 'Cơ bản', views: '1.2k', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 2, title: 'Sử dụng Batch Rename để đổi tên 500 Sheet trong 10 giây', duration: '08:45', level: 'Trung cấp', views: '3.4k', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 3, title: 'Tự động đánh Dimension Cấu kiện Kết cấu với Auto Dimension', duration: '12:10', level: 'Nâng cao', views: '2.8k', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 4, title: 'Quy trình Xuất PDF/DWG hàng loạt chuẩn hồ sơ thi công', duration: '06:30', level: 'Cơ bản', views: '4.1k', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
      ];
    }
  },

  getReleases: async () => {
    try {
      const res = await axiosClient.get('/download/latest');
      if (res.data) {
        return {
          latestVersion: res.data.version || 'v2.4.1',
          releaseDate: '2026-08-01',
          fileSize: '45.2 MB',
          revitVersions: `Revit ${res.data.minimum_revit_version || 2022} - ${res.data.maximum_revit_version || 2027}`,
          downloadUrl: res.data.download_url || '#download-link',
          changelog: [
            res.data.release_notes || 'Tối ưu tốc độ xử lý Auto Dimension nhanh hơn 40%',
            'Hỗ trợ chính thức Autodesk Revit 2027 & 2026',
            'Thêm tính năng tự động ghi nhớ cấu hình Parameter'
          ]
        };
      }
      throw new Error("No release");
    } catch {
      return {
        latestVersion: 'v2.5.0',
        releaseDate: '2026-08-15',
        fileSize: '48.6 MB',
        revitVersions: 'Revit 2022, 2023, 2024, 2025, 2026, 2027',
        downloadUrl: '#download-link',
        changelog: [
          'Hỗ trợ chính thức Autodesk Revit 2027 & 2026',
          'Tối ưu tốc độ xử lý Auto Dimension nhanh hơn 40%',
          'Thêm tính năng tự động ghi nhớ cấu hình Parameter',
          'Cải tiến giao diện Ribbon trực quan hơn'
        ]
      };
    }
  },

  sendFeedback: async (payload) => {
    const categoryToType = {
      'Gợi ý tính năng mới': 'FEATURE',
      'Báo lỗi Add-in (Bug Report)': 'BUG',
      'Hỗ trợ License / Thanh toán': 'OTHER',
      'Góp ý khác': 'OTHER'
    };
    return await axiosClient.post('/feedback', {
      name: payload.name,
      email: payload.email,
      type: categoryToType[payload.category] || 'OTHER',
      title: payload.category,
      content: payload.content
    });
  }
};

// Customer Account Services
export const customerApi = {
  getLicenses: async () => {
    try {
      const res = await axiosClient.get('/account/licenses');
      if (Array.isArray(res.data)) {
        return res.data.map(lic => ({
          id: lic.id,
          key: lic.license_key,
          planName: lic.plan?.name || 'Gói BIMAutomation',
          status: lic.status || 'ACTIVE',
          activatedAt: lic.activated_at ? new Date(lic.activated_at).toLocaleDateString('vi-VN') : 'Chưa kích hoạt',
          expiresAt: lic.expires_at ? new Date(lic.expires_at).toLocaleDateString('vi-VN') : 'Vĩnh viễn',
          hardwareId: lic.device_id || 'Chưa liên kết máy',
          activeDevices: lic.device_id ? 1 : 0,
          maxDevices: 1
        }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching customer licenses:', err);
      return [];
    }
  },

  getOrders: async () => {
    try {
      const res = await axiosClient.get('/account/orders');
      if (Array.isArray(res.data)) {
        return res.data.map(ord => ({
          id: ord.order_code || (typeof ord.id === 'string' ? ord.id.substring(0, 8).toUpperCase() : ord.id),
          date: ord.created_at ? new Date(ord.created_at).toLocaleDateString('vi-VN') : 'Mới đây',
          planName: ord.plan?.name || 'Gói bản quyền',
          amount: typeof ord.amount === 'number' ? `${ord.amount.toLocaleString('vi-VN')}đ` : (ord.amount || '0đ'),
          paymentMethod: ord.status === 'PAID' ? 'Chuyển khoản QR (VietQR)' : 'Chờ thanh toán',
          status: ord.status || 'PENDING',
          invoiceUrl: '#'
        }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      return [];
    }
  },

  createOrder: async (planId) => {
    return await axiosClient.post('/orders', { plan_id: planId });
  },
  getOrder: async (orderId) => (await axiosClient.get(`/orders/${orderId}`)).data,
  getOrderQr: async (orderId) => (await axiosClient.get(`/orders/${orderId}/qr`)).data,
};

export const authApi = {
  forgotPassword: async (email) => axiosClient.post('/auth/reset-password/forgot-password', { email }),
  resetPassword: async (token, password) => axiosClient.post('/auth/reset-password/reset-password', { token, password }),
};

// Admin Services
export const adminApi = {
  getStats: async () => {
    const res = await axiosClient.get('/admin/dashboard/stats');
    const d = res.data || {};
    return {
      totalRevenue: typeof d.total_revenue === 'number' ? `${d.total_revenue.toLocaleString('vi-VN')}đ` : '0đ',
      totalCustomers: d.total_users || 0,
      activeLicenses: d.active_licenses || 0,
      pendingOrders: d.pending_orders || 0,
      recentGrowth: typeof d.revenue_growth_pct === 'number' ? `${d.revenue_growth_pct > 0 ? '+' : ''}${d.revenue_growth_pct}%` : '—'
    };
  },

  getCustomers: async () => {
    const res = await axiosClient.get('/admin/customers');
    if (!Array.isArray(res.data)) return [];
    return res.data.map(c => ({
      id: c.id,
      fullName: c.name || 'Chưa cập nhật',
      email: c.email,
      phone: c.phone || '—',
      jobTitle: c.job_title || '—',
      revitVersion: c.revit_version || '—',
      useCase: c.use_case || '—',
      isTrialRegistered: !!c.is_trial_registered,
      totalSpent: typeof c.total_spent === 'number' ? `${c.total_spent.toLocaleString('vi-VN')}đ` : '0đ',
      status: c.is_active ? 'Active' : 'Inactive',
      joinedAt: c.joined_at ? new Date(c.joined_at).toLocaleDateString('vi-VN') : '—'
    }));
  },

  getLicenses: async () => {
    const res = await axiosClient.get('/admin/licenses');
    if (!Array.isArray(res.data)) return [];
    return res.data.map(lic => ({
      id: lic.id,
      key: lic.license_key,
      customer: lic.user?.name || 'Chưa cập nhật',
      email: lic.user?.email || '—',
      plan: lic.plan_name || lic.plan?.name || 'Gói BIMAutomation',
      expiresAt: lic.expires_at ? new Date(lic.expires_at).toLocaleDateString('vi-VN') : 'Vĩnh viễn',
      status: lic.status,
      device: lic.device_id || 'Chưa liên kết máy'
    }));
  },

  getDeviceTrials: async () => {
    const res = await axiosClient.get('/admin/device-trials');
    if (!Array.isArray(res.data)) return [];
    return res.data.map(t => {
      const expires = new Date(t.trial_expires_at);
      const now = new Date();
      const remainingDays = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));
      return {
        id: t.id,
        fingerprintHash: t.fingerprint_hash,
        displayName: t.display_name || 'PC-BIM',
        platform: t.platform || 'Windows',
        revitVersion: t.revit_version || 'Revit',
        appVersion: t.app_version || 'v2.4.1',
        firstTrialAt: t.first_trial_at ? new Date(t.first_trial_at).toLocaleDateString('vi-VN') : '—',
        trialExpiresAt: t.trial_expires_at ? new Date(t.trial_expires_at).toLocaleDateString('vi-VN') : '—',
        remainingDays,
        status: t.status,
        resetCount: t.reset_count || 0,
        userEmail: t.last_user_email || t.initial_user_email || '—'
      };
    });
  },

  resetDeviceTrial: async (trialId, days = 14) =>
    (await axiosClient.post(`/admin/device-trials/${trialId}/reset?days=${days}`)).data,

  blockDeviceTrial: async (trialId) =>
    (await axiosClient.post(`/admin/device-trials/${trialId}/block`)).data,

  resetLicenseDevice: async (licenseId) =>
    (await axiosClient.post(`/admin/licenses/${licenseId}/reset-device`)).data,

  updateLicenseStatus: async (licenseId, status) =>
    (await axiosClient.post(`/admin/licenses/${licenseId}/status`, { status })).data,

  getOrders: async () => {
    const res = await axiosClient.get('/admin/orders');
    if (!Array.isArray(res.data)) return [];
    return res.data.map(ord => ({
      id: ord.order_code,
      customer: ord.user?.name || 'Chưa cập nhật',
      email: ord.user?.email || '—',
      plan: ord.plan?.name || 'Gói bản quyền',
      amount: typeof ord.amount === 'number' ? `${ord.amount.toLocaleString('vi-VN')}đ` : '0đ',
      date: ord.created_at ? new Date(ord.created_at).toLocaleDateString('vi-VN') : '—',
      status: ord.status
    }));
  },

  getPayments: async () => {
    const res = await axiosClient.get('/admin/payments');
    if (!Array.isArray(res.data)) return [];
    return res.data.map(p => ({
      id: p.id,
      orderId: p.order_code,
      provider: p.provider,
      txHash: p.transaction_id || '—',
      amount: typeof p.amount === 'number' ? `${p.amount.toLocaleString('vi-VN')}đ` : '0đ',
      time: p.created_at ? new Date(p.created_at).toLocaleString('vi-VN') : '—',
      status: p.status
    }));
  },

  getRevenue: async () => {
    const res = await axiosClient.get('/admin/revenue');
    if (!Array.isArray(res.data)) return [];
    return res.data.map(r => ({
      month: r.period,
      revenue: r.revenue,
      revenueLabel: `${r.revenue.toLocaleString('vi-VN')}đ`,
      orders: r.orders
    }));
  },

  getFeedbacks: async () => {
    const res = await axiosClient.get('/admin/feedbacks');
    if (!Array.isArray(res.data)) return [];
    return res.data.map(f => ({
      id: f.id,
      name: f.name || 'Người dùng ẩn danh',
      email: f.email || '—',
      category: f.type,
      title: f.title,
      content: f.content,
      date: f.created_at ? new Date(f.created_at).toLocaleDateString('vi-VN') : '—'
    }));
  },

  getReleases: async () => {
    const res = await axiosClient.get('/admin/releases');
    if (!Array.isArray(res.data)) return [];
    return res.data.map(r => ({
      id: r.id,
      version: r.version,
      downloadUrl: r.download_url,
      releaseNotes: r.release_notes,
      isActive: r.is_active,
      releasedAt: r.released_at ? new Date(r.released_at).toLocaleDateString('vi-VN') : '—'
    }));
  },

  createRelease: async (payload) =>
    (await axiosClient.post('/admin/releases', payload)).data
};
