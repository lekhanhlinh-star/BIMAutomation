import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/services';
import { RefreshCw, Lock } from 'lucide-react';

export default function AdminLicensesPage() {
  const queryClient = useQueryClient();
  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['adminLicenses'],
    queryFn: adminApi.getLicenses
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminLicenses'] });

  const resetDevice = useMutation({
    mutationFn: (licenseId) => adminApi.resetLicenseDevice(licenseId),
    onSuccess: invalidate
  });

  const revoke = useMutation({
    mutationFn: (licenseId) => adminApi.updateLicenseStatus(licenseId, 'REVOKED'),
    onSuccess: invalidate
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Quản lý License Key & thiết bị</h2>
        <p className="text-xs text-slate-500 mt-1">Reset thiết bị kích hoạt hoặc thu hồi License key của khách hàng.</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-slate-400">Đang tải danh sách bản quyền...</div>
      ) : licenses.length === 0 ? (
        <div className="py-12 text-slate-500 text-sm">Chưa có license nào.</div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-slate-500 uppercase font-mono border-b border-[var(--line)]">
              <tr>
                <th className="px-4 py-3">License Key</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Gói dịch vụ</th>
                <th className="px-4 py-3">Thiết bị (HWID)</th>
                <th className="px-4 py-3">Ngày hết hạn</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-soft)]">
              {licenses.map((lic) => (
                <tr key={lic.id}>
                  <td className="px-4 py-3.5 font-mono text-cyan-300 font-bold">{lic.key}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-white">{lic.customer}</p>
                    <p className="text-[11px] text-slate-500">{lic.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-200">{lic.plan}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-400">{lic.device}</td>
                  <td className="px-4 py-3.5 text-slate-300">{lic.expiresAt}</td>
                  <td className="px-4 py-3.5"><span className={`status-tag ${lic.status === 'ACTIVE' ? 'status-tag--ok' : 'status-tag--pending'}`}>{lic.status}</span></td>
                  <td className="px-4 py-3.5 flex items-center gap-1">
                    <button
                      onClick={() => resetDevice.mutate(lic.id)}
                      disabled={resetDevice.isPending}
                      className="p-1.5 text-slate-400 hover:text-white disabled:opacity-40"
                      title="Reset thiết bị kích hoạt"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => revoke.mutate(lic.id)}
                      disabled={revoke.isPending || lic.status === 'REVOKED'}
                      className="p-1.5 text-slate-400 hover:text-red-300 disabled:opacity-40"
                      title="Khóa/Thu hồi license"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
