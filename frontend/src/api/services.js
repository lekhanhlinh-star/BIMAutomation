import { axiosClient } from './axiosClient';

export const getPlanPresentation = (durationMonthsOrPlan) => {
  let duration = typeof durationMonthsOrPlan === 'number' ? durationMonthsOrPlan : durationMonthsOrPlan?.duration_months;
  let name = typeof durationMonthsOrPlan === 'object' ? durationMonthsOrPlan?.name : null;

  if (name?.toLowerCase().includes('trial') || name?.toLowerCase().includes('dùng thử') || duration === 0) {
    return {
      name: 'Dùng thử 14 ngày',
      period: '/ 14 ngày',
      description: 'Dùng trọn bộ BIMAutomation trên công việc thật trước khi quyết định.',
      features: [
        'Toàn bộ plugin và workflow AI',
        'Không cần thẻ thanh toán',
        'Tương thích Revit 2022–2027',
        'Hỗ trợ cài đặt ban đầu'
      ],
      isPopular: false,
    };
  }

  if (name?.toLowerCase().includes('tháng') || name?.toLowerCase().includes('monthly') || duration === 1) {
    return {
      name: 'Gói cá nhân tháng',
      period: '/ tháng',
      description: 'Toàn bộ BIMAutomation với lựa chọn thanh toán linh hoạt theo tháng.',
      features: [
        'Toàn bộ plugin BIMAutomation',
        'Kết nối Codex, Claude và Cursor',
        'Cập nhật tính năng trong thời hạn',
        'Đổi máy làm việc linh hoạt'
      ],
      isPopular: false,
    };
  }

  if (name?.toLowerCase().includes('năm') || name?.toLowerCase().includes('annual') || duration === 12) {
    return {
      name: 'Gói cá nhân năm',
      period: '/ năm',
      description: 'Trọn bộ BIMAutomation cả năm với chi phí tốt hơn cho người dùng thường xuyên.',
      features: [
        'Mọi quyền lợi của gói tháng',
        'Tiết kiệm tương đương 2 tháng',
        'Ưu tiên hỗ trợ qua Zalo',
        'Nhận các bản cập nhật mới'
      ],
      isPopular: true,
    };
  }

  return {
    name: 'Gói Doanh nghiệp (Enterprise)',
    period: '/ giấy phép',
    description: 'Giải pháp hoàn chỉnh cho phòng BIM & doanh nghiệp: Quản lý thiết bị tập trung, tùy biến Preset & đào tạo 1-1.',
    features: [
      'Toàn bộ 13 Feature Codes & 57 MCP Tools',
      'Cổng Quản trị License tập trung cho Team',
      'Tùy biến thư viện Preset & quy chuẩn nét vẽ công ty',
      'Chuyên viên hỗ trợ kỹ thuật và đào tạo 1-1'
    ],
    isPopular: false,
  };
};

// Public Services
export const publicApi = {
  getPlans: async () => {
    try {
      const res = await axiosClient.get('/plans');
      if (res.data && res.data.length > 0) {
        return res.data.map(p => {
          const presentation = getPlanPresentation(p);
          return {
            id: p.id,
            durationMonths: p.duration_months,
            name: presentation.name,
            price: typeof p.price === 'number' ? `${p.price.toLocaleString('vi-VN')}đ` : p.price,
            period: presentation.period,
            description: presentation.description,
            features: presentation.features,
            isPopular: presentation.isPopular,
          };
        });
      }
      throw new Error("No plans");
    } catch {
      return [
        {
          id: 'p-trial',
          durationMonths: 0,
          name: 'Dùng thử 14 ngày',
          price: '0đ',
          period: '/ 14 ngày',
          description: 'Dùng trọn bộ BIMAutomation trên công việc thật trước khi quyết định.',
          features: ['Toàn bộ plugin và workflow AI', 'Không cần thẻ thanh toán', 'Tương thích Revit 2022–2027', 'Hỗ trợ cài đặt ban đầu'],
          isPopular: false
        },
        {
          id: 'p-month',
          durationMonths: 1,
          name: 'Gói cá nhân tháng',
          price: '250.000đ',
          period: '/ tháng',
          description: 'Toàn bộ BIMAutomation với lựa chọn thanh toán linh hoạt theo tháng.',
          features: ['Toàn bộ plugin BIMAutomation', 'Kết nối Codex, Claude và Cursor', 'Cập nhật tính năng trong thời hạn', 'Đổi máy làm việc linh hoạt'],
          isPopular: false
        },
        {
          id: 'p-year',
          durationMonths: 12,
          name: 'Gói cá nhân năm',
          price: '2.500.000đ',
          period: '/ năm',
          description: 'Trọn bộ BIMAutomation cả năm với chi phí tốt hơn cho người dùng thường xuyên.',
          features: ['Mọi quyền lợi của gói tháng', 'Tiết kiệm tương đương 2 tháng', 'Ưu tiên hỗ trợ qua Zalo', 'Nhận các bản cập nhật mới'],
          isPopular: true
        }
      ];
    }
  },

  getFeatures: async () => {
    try {
      const res = await axiosClient.get('/public/features');
      return res.data;
    } catch {
      return [
        { id: 'rebar-ai', title: 'AI Mô hình hóa Cốt thép 3D', category: 'Kết cấu & Cốt thép', description: 'Tự động bố trí thép Cột, Dầm, Móng, Vách, Sàn theo TCVN 5574:2018.', image: '/assets/product/real/column-rebar-revit-2025.jpg' },
        { id: 'drawing-rebar', title: 'Tự động Triển khai Bản vẽ Lên Sheet', category: 'Triển khai Bản vẽ', description: 'Tạo Sheet dầm liên tục, đài móng, tự động cắt mặt cắt và gắn Rebar Tag.', image: '/assets/product/real/beam-rebar-revit-2025.jpg' },
        { id: 'mcp-hub', title: 'Hệ thống 57 MCP Tools', category: 'AI & Giao thức MCP', description: 'Kết nối trực tiếp Claude Desktop và Cursor IDE vào Revit qua giao thức MCP chuẩn.', image: '/assets/product/real/mcp-server-revit-2025.jpg' },
        { id: 'wall-rebar', title: 'Bố trí thép Vách', category: 'Kết cấu & Cốt thép', description: 'Thiết lập thép dọc, thép ngang, thép giằng và kiểm tra mô hình bằng review 3D.', image: '/assets/product/real/wall-rebar-revit-2025.jpg' }
      ];
    }
  },

  getTutorials: async () => {
    try {
      const res = await axiosClient.get('/public/tutorials');
      return res.data;
    } catch {
      return [
        { id: 1, title: 'Hướng dẫn Cài đặt BIMAutomation & Kích hoạt 1-Click qua Google OAuth', duration: '04:15', level: 'Cơ bản', views: '2.5k', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 2, title: 'Ra lệnh AI vẽ thép Dầm liên tục từ Bảng tính Excel', duration: '08:30', level: 'Nâng cao', views: '4.8k', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 3, title: 'Kết nối Claude Desktop & Cursor IDE vào Revit qua giao thức MCP 57 Tools', duration: '11:45', level: 'Chuyên gia', views: '3.9k', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 4, title: 'Quy trình Tự động Triển khai Sheet Dầm & Đài móng kèm Thống kê thép', duration: '07:20', level: 'Trung cấp', views: '5.1k', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
      ];
    }
  },

  getReleases: async () => {
    try {
      const res = await axiosClient.get('/download/latest');
      if (res.data) {
        return {
          latestVersion: res.data.version || 'v2.5.0',
          releaseDate: '2026-08-20',
          fileSize: '48.2 MB',
          revitVersions: `Revit ${res.data.minimum_revit_version || 2022} - ${res.data.maximum_revit_version || 2027}`,
          downloadUrl: res.data.download_url || '#download-link',
          changelog: [
            res.data.release_notes || 'Tích hợp 57 MCP Tools và hệ thống AI Rebar Engine thế hệ mới',
            'Hỗ trợ chính thức Autodesk Revit 2022, 2023, 2024, 2025, 2026, 2027',
            'Cơ chế kích hoạt 1-click qua Google OAuth PKCE Server-Authoritative',
            'Bổ sung bộ 18 lệnh Ribbon trên tab LDL-STRUCTURAL'
          ]
        };
      }
      throw new Error("No release");
    } catch {
      return {
        latestVersion: 'v2.5.0',
        releaseDate: '2026-08-20',
        fileSize: '48.2 MB',
        revitVersions: 'Revit 2022, 2023, 2024, 2025, 2026, 2027',
        downloadUrl: '#download-link',
        changelog: [
          'Tích hợp 57 MCP Tools và hệ sinh thái AI Rebar Engine',
          'Bổ sung 18 lệnh Ribbon chuyên dụng trên tab LDL-STRUCTURAL',
          'Hỗ trợ chính thức Autodesk Revit 2022–2027 (64-bit)',
          'Tự động triển khai bản vẽ dầm và đài móng liên tục lên Sheet'
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
        userEmail: t.last_user_email || t.initial_user_email || '—',
        isCurrentlyActive: t.is_currently_active || false,
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
