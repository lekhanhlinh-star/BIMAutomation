import React, { useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  KeyRound,
  Loader2,
  MonitorCheck,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import { adminApi } from '../../api/services';

const DASHBOARD_QUERIES = [
  { queryKey: ['adminStats'], queryFn: adminApi.getStats },
  { queryKey: ['adminRevenue'], queryFn: adminApi.getRevenue },
  { queryKey: ['adminOrders'], queryFn: adminApi.getOrders },
  { queryKey: ['adminLicenses'], queryFn: adminApi.getLicenses },
  { queryKey: ['adminDeviceTrials'], queryFn: adminApi.getDeviceTrials },
];

const STATUS_LABELS = {
  PAID: 'Đã thanh toán',
  SUCCESS: 'Thành công',
  PENDING: 'Đang chờ',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
  ACTIVE: 'Hoạt động',
  REVOKED: 'Đã thu hồi',
  SUSPENDED: 'Tạm khóa',
};

const getStatusTone = (status) => {
  if (status === 'PAID' || status === 'SUCCESS' || status === 'ACTIVE') return 'ok';
  if (status === 'PENDING') return 'pending';
  return 'off';
};

function DashboardSkeleton() {
  return (
    <div className="admin-dashboard-skeleton" aria-label="Đang tải Dashboard">
      <div className="admin-dashboard-skeleton__heading skeleton-block" />
      <div className="admin-dashboard-skeleton__metrics">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton-block" />)}
      </div>
      <div className="admin-dashboard-skeleton__main skeleton-block" />
    </div>
  );
}

function RevenueChart({ data }) {
  const chart = useMemo(() => {
    if (!data.length) return null;
    const width = 720;
    const height = 240;
    const padding = { top: 24, right: 18, bottom: 42, left: 56 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(1, ...data.map((item) => item.revenue));
    const points = data.map((item, index) => {
      const x = padding.left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
      const y = padding.top + plotHeight - (item.revenue / maxValue) * plotHeight;
      return { ...item, x, y };
    });
    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const area = `${line} L ${points.at(-1).x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`;
    return { width, height, padding, plotHeight, maxValue, points, line, area };
  }, [data]);

  if (!chart) {
    return <div className="admin-dashboard-empty">Chưa có dữ liệu doanh thu để hiển thị.</div>;
  }

  return (
    <>
      <div className="admin-revenue-chart" aria-label="Biểu đồ doanh thu theo thời gian">
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-labelledby="revenue-chart-title revenue-chart-desc">
          <title id="revenue-chart-title">Xu hướng doanh thu</title>
          <desc id="revenue-chart-desc">Doanh thu theo từng kỳ, từ {data[0].month} đến {data.at(-1).month}.</desc>
          {[0, 0.5, 1].map((ratio) => {
            const y = chart.padding.top + chart.plotHeight - ratio * chart.plotHeight;
            const value = Math.round(chart.maxValue * ratio);
            return (
              <g key={ratio}>
                <line x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={y} y2={y} className="admin-revenue-chart__grid" />
                <text x={chart.padding.left - 10} y={y + 4} textAnchor="end" className="admin-revenue-chart__axis">
                  {value >= 1_000_000 ? `${(value / 1_000_000).toLocaleString('vi-VN')}tr` : value.toLocaleString('vi-VN')}
                </text>
              </g>
            );
          })}
          <path d={chart.area} className="admin-revenue-chart__area" />
          <path d={chart.line} className="admin-revenue-chart__line" />
          {chart.points.map((point, index) => (
            <g key={`${point.month}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                className="admin-revenue-chart__point"
                tabIndex="0"
                role="img"
                aria-label={`${point.month}: ${point.revenueLabel}, ${point.orders} đơn hàng`}
              />
              <text x={point.x} y={chart.height - 14} textAnchor="middle" className="admin-revenue-chart__axis">
                {point.month}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <ol className="admin-revenue-mobile" aria-label="Doanh thu theo kỳ">
        {data.slice(-6).map((item) => (
          <li key={item.month}>
            <div><span>{item.month}</span><strong>{item.revenueLabel}</strong></div>
            <div className="admin-revenue-mobile__track" aria-hidden="true">
              <span style={{ width: `${Math.max(3, (item.revenue / chart.maxValue) * 100)}%` }} />
            </div>
            <small>{item.orders} đơn hàng</small>
          </li>
        ))}
      </ol>

      <details className="admin-dashboard-data-table">
        <summary>Xem dữ liệu chi tiết</summary>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Kỳ</th><th>Đơn hàng</th><th>Doanh thu</th></tr></thead>
            <tbody>{data.map((item) => (
              <tr key={item.month}><td>{item.month}</td><td>{item.orders}</td><td>{item.revenueLabel}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </details>
    </>
  );
}

function Metric({ label, value, note, icon: Icon, tone = 'brand' }) {
  return (
    <article className="admin-dashboard-metric">
      <div className={`admin-dashboard-metric__icon is-${tone}`}><Icon size={17} aria-hidden="true" /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [statsQuery, revenueQuery, ordersQuery, licensesQuery, trialsQuery] = useQueries({ queries: DASHBOARD_QUERIES });
  const queries = [statsQuery, revenueQuery, ordersQuery, licensesQuery, trialsQuery];
  const isLoading = queries.some((query) => query.isLoading);
  const isFetching = queries.some((query) => query.isFetching);
  const hasError = queries.some((query) => query.isError);

  const stats = statsQuery.data || {};
  const revenue = revenueQuery.data || [];
  const orders = ordersQuery.data || [];
  const licenses = licensesQuery.data || [];
  const trials = trialsQuery.data || [];

  const operations = useMemo(() => {
    const pendingOrders = orders.filter((order) => order.status === 'PENDING').length;
    const activeLicenses = licenses.filter((license) => license.status === 'ACTIVE').length;
    const expiringLicenses = licenses.filter((license) => license.status === 'ACTIVE' && license.remainingDays <= 7).length;
    const blockedLicenses = licenses.filter((license) => license.status === 'REVOKED' || license.status === 'SUSPENDED').length;
    const activeTrials = trials.filter((trial) => trial.status === 'ACTIVE').length;
    const onlineDevices = [...licenses, ...trials].filter((item) => item.isOnline).length;
    const expiredLicenses = Math.max(0, licenses.length - activeLicenses - blockedLicenses);
    return { pendingOrders, activeLicenses, expiringLicenses, blockedLicenses, activeTrials, onlineDevices, expiredLicenses };
  }, [licenses, orders, trials]);

  const latestRevenue = revenue.at(-1);
  const lastUpdated = Math.max(...queries.map((query) => query.dataUpdatedAt || 0));
  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : 'Chưa cập nhật';

  const refreshDashboard = () => {
    DASHBOARD_QUERIES.forEach(({ queryKey }) => queryClient.invalidateQueries({ queryKey }));
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="admin-page admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__kicker">Trung tâm điều hành</p>
          <h2>Dashboard quản trị hệ thống</h2>
          <p>Theo dõi doanh thu, đơn hàng và sức khỏe cấp phát bản quyền BIMAutomation trên một màn hình.</p>
        </div>
        <div className="admin-dashboard__freshness">
          <span><i className={hasError ? 'is-warning' : ''} /> {hasError ? 'Dữ liệu chưa đầy đủ' : 'Dữ liệu hệ thống'}</span>
          <small>Cập nhật lúc {updatedLabel}</small>
          <button type="button" onClick={refreshDashboard} disabled={isFetching} aria-label="Làm mới Dashboard">
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} aria-hidden="true" /> Làm mới
          </button>
        </div>
      </header>

      {hasError ? (
        <div className="admin-dashboard__warning" role="status">
          <CircleAlert size={17} aria-hidden="true" />
          Một phần dữ liệu chưa tải được. Các số liệu còn lại vẫn được giữ để tiếp tục theo dõi.
        </div>
      ) : null}

      <section className="admin-dashboard-metrics" aria-label="Chỉ số vận hành chính">
        <Metric label="Tổng doanh thu" value={stats.totalRevenue || '0đ'} note={`${stats.recentGrowth || '—'} so với tháng trước`} icon={TrendingUp} />
        <Metric label="Khách hàng" value={stats.totalCustomers || 0} note="Tài khoản đã đăng ký" icon={Users} />
        <Metric label="License hoạt động" value={stats.activeLicenses ?? operations.activeLicenses} note={`${operations.onlineDevices} thiết bị đang online`} icon={KeyRound} tone="success" />
        <Metric label="Đơn hàng chờ" value={stats.pendingOrders ?? operations.pendingOrders} note="Cần xử lý thanh toán" icon={ShoppingBag} tone={operations.pendingOrders > 0 ? 'warning' : 'brand'} />
      </section>

      <div className="admin-dashboard__primary-grid">
        <section className="admin-dashboard-panel admin-dashboard-panel--revenue" aria-labelledby="revenue-heading">
          <div className="admin-dashboard-panel__heading">
            <div>
              <span>Hiệu suất kinh doanh</span>
              <h3 id="revenue-heading">Xu hướng doanh thu</h3>
            </div>
            <div className="admin-dashboard-panel__headline">
              <strong>{latestRevenue?.revenueLabel || '0đ'}</strong>
              <small>{latestRevenue ? `${latestRevenue.orders} đơn trong kỳ ${latestRevenue.month}` : 'Chưa có kỳ báo cáo'}</small>
            </div>
          </div>
          <RevenueChart data={revenue} />
        </section>

        <aside className="admin-dashboard-panel admin-dashboard-queue" aria-labelledby="queue-heading">
          <div className="admin-dashboard-panel__heading">
            <div><span>Cần chú ý</span><h3 id="queue-heading">Hàng đợi vận hành</h3></div>
          </div>
          <div className="admin-dashboard-queue__list">
            <Link to="/admin/orders"><ShoppingBag aria-hidden="true" /><span><strong>{operations.pendingOrders}</strong> đơn hàng chờ</span><ArrowRight aria-hidden="true" /></Link>
            <Link to="/admin/licenses"><Clock3 aria-hidden="true" /><span><strong>{operations.expiringLicenses}</strong> license sắp hết hạn</span><ArrowRight aria-hidden="true" /></Link>
            <Link to="/admin/licenses"><MonitorCheck aria-hidden="true" /><span><strong>{operations.onlineDevices}</strong> thiết bị online</span><ArrowRight aria-hidden="true" /></Link>
            <Link to="/admin/licenses"><CheckCircle2 aria-hidden="true" /><span><strong>{operations.activeTrials}</strong> thiết bị còn trial</span><ArrowRight aria-hidden="true" /></Link>
          </div>
          <p className="admin-dashboard-queue__note">License sắp hết hạn được tính trong 7 ngày tới.</p>
        </aside>
      </div>

      <div className="admin-dashboard__secondary-grid">
        <section className="admin-dashboard-panel admin-dashboard-orders" aria-labelledby="orders-heading">
          <div className="admin-dashboard-panel__heading">
            <div><span>Dòng giao dịch</span><h3 id="orders-heading">Đơn hàng gần đây</h3></div>
            <Link to="/admin/orders">Xem tất cả <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
          {orders.length ? (
            <div className="admin-dashboard-orders__list">
              {orders.slice(0, 5).map((order) => (
                <article key={order.id}>
                  <div><strong>{order.customer}</strong><span>{order.id} · {order.date}</span></div>
                  <div><strong>{order.amount}</strong><span className={`status-tag status-tag--${getStatusTone(order.status)}`}>{STATUS_LABELS[order.status] || order.status}</span></div>
                </article>
              ))}
            </div>
          ) : <div className="admin-dashboard-empty">Chưa có đơn hàng nào.</div>}
        </section>

        <section className="admin-dashboard-panel admin-dashboard-license" aria-labelledby="license-heading">
          <div className="admin-dashboard-panel__heading">
            <div><span>Quyền sử dụng</span><h3 id="license-heading">Tình trạng bản quyền</h3></div>
            <Link to="/admin/licenses">Quản lý <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
          <div className="admin-dashboard-license__total">
            <strong>{licenses.length}</strong><span>license trả phí</span>
          </div>
          <div className="admin-dashboard-license__bar" aria-label={`${operations.activeLicenses} hoạt động, ${operations.blockedLicenses} đã khóa, ${operations.expiredLicenses} hết hạn`}>
            <span className="is-active" style={{ flex: operations.activeLicenses || 0 }} />
            <span className="is-blocked" style={{ flex: operations.blockedLicenses || 0 }} />
            <span className="is-expired" style={{ flex: operations.expiredLicenses || 0 }} />
          </div>
          <dl className="admin-dashboard-license__legend">
            <div><dt><i className="is-active" /> Hoạt động</dt><dd>{operations.activeLicenses}</dd></div>
            <div><dt><i className="is-blocked" /> Đã khóa</dt><dd>{operations.blockedLicenses}</dd></div>
            <div><dt><i className="is-expired" /> Hết hạn</dt><dd>{operations.expiredLicenses}</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
