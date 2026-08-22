import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, CheckCircle, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/services';

export default function AdminReleasesPage() {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [changelog, setChangelog] = useState('');
  const [error, setError] = useState('');

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['adminReleases'],
    queryFn: adminApi.getReleases,
  });

  const createRelease = useMutation({
    mutationFn: () =>
      adminApi.createRelease({
        version,
        download_url: downloadUrl,
        release_notes: changelog || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReleases'] });
      setVersion('');
      setDownloadUrl('');
      setChangelog('');
      setError('');
    },
    onError: (err) => {
      setError(err?.response?.data?.detail || 'Không thể phát hành phiên bản này.');
    },
  });

  const handleUpload = (e) => {
    e.preventDefault();
    createRelease.mutate();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Quản lý phiên bản Add-in (Releases)</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Đăng ký phiên bản mới và đường dẫn tải cho khách hàng.</p>
      </div>

      <div className="panel p-6 lg:p-8 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary)]">Phiên bản (version)</label>
            <input
              type="text"
              required
              placeholder="v2.4.2"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="form-control text-sm font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary)]">Đường dẫn tải file cài đặt (URL)</label>
            <input
              type="url"
              required
              placeholder="https://cdn.bimpilot.vn/releases/v2.4.2/setup.exe"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="form-control text-sm font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary)]">Nhật ký thay đổi (changelog)</label>
            <textarea
              rows={4}
              placeholder="Ghi chú những tính năng mới hoặc sửa lỗi trong bản này..."
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              className="form-control text-sm"
            ></textarea>
          </div>

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <button type="submit" disabled={createRelease.isPending} className="primary-button w-full justify-center">
            {createRelease.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : createRelease.isSuccess ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            {createRelease.isPending ? 'Đang phát hành...' : createRelease.isSuccess ? 'Đã phát hành thành công' : 'Phát hành phiên bản mới'}
          </button>
        </form>
      </div>

      <div className="panel overflow-x-auto bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
            <tr>
              <th className="px-4 py-3.5">Phiên bản</th>
              <th className="px-4 py-3.5">Ngày phát hành</th>
              <th className="px-4 py-3.5">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {isLoading ? (
              <tr>
                <td className="px-4 py-3.5 text-[var(--text-secondary)]" colSpan={3}>
                  <Loader2 className="animate-spin inline mr-2" size={14} /> Đang tải...
                </td>
              </tr>
            ) : releases.length === 0 ? (
              <tr>
                <td className="px-4 py-3.5 text-[var(--text-muted)]" colSpan={3}>
                  Chưa có phiên bản nào.
                </td>
              </tr>
            ) : (
              releases.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-[var(--brand)]">{r.version}</td>
                  <td className="px-4 py-3.5 text-[var(--text-secondary)]">{r.releasedAt}</td>
                  <td className="px-4 py-3.5">
                    <span className={`status-tag ${r.isActive ? 'status-tag--ok' : 'status-tag--pending'}`}>{r.isActive ? 'Đang phát hành' : 'Đã ẩn'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
