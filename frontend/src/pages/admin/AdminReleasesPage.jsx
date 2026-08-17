import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/services';

export default function AdminReleasesPage() {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [changelog, setChangelog] = useState('');
  const [error, setError] = useState('');

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['adminReleases'],
    queryFn: adminApi.getReleases
  });

  const createRelease = useMutation({
    mutationFn: () => adminApi.createRelease({
      version,
      download_url: downloadUrl,
      release_notes: changelog || null
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
    }
  });

  const handleUpload = (e) => {
    e.preventDefault();
    createRelease.mutate();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Quản lý phiên bản Add-in (Releases)</h2>
        <p className="text-xs text-slate-500 mt-1">Đăng ký phiên bản mới và đường dẫn tải cho khách hàng.</p>
      </div>

      <div className="panel p-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Phiên bản (version)</label>
            <input
              type="text"
              required
              placeholder="v2.4.2"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="form-control text-sm font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Đường dẫn tải file cài đặt (URL)</label>
            <input
              type="url"
              required
              placeholder="https://cdn.bimpilot.vn/releases/v2.4.2/setup.exe"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="form-control text-sm font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Nhật ký thay đổi (changelog)</label>
            <textarea
              rows={4}
              placeholder="Ghi chú những tính năng mới hoặc sửa lỗi trong bản này..."
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              className="form-control text-sm"
            ></textarea>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" disabled={createRelease.isPending} className="primary-button w-full">
            {createRelease.isSuccess ? <CheckCircle className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
            {createRelease.isPending ? 'Đang phát hành...' : createRelease.isSuccess ? 'Đã phát hành thành công' : 'Phát hành phiên bản mới'}
          </button>
        </form>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="text-slate-500 uppercase font-mono border-b border-[var(--line)]">
            <tr>
              <th className="px-4 py-3">Phiên bản</th>
              <th className="px-4 py-3">Ngày phát hành</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line-soft)]">
            {isLoading ? (
              <tr><td className="px-4 py-3.5 text-slate-500" colSpan={3}>Đang tải...</td></tr>
            ) : releases.length === 0 ? (
              <tr><td className="px-4 py-3.5 text-slate-500" colSpan={3}>Chưa có phiên bản nào.</td></tr>
            ) : releases.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3.5 font-mono font-bold text-cyan-300">{r.version}</td>
                <td className="px-4 py-3.5 text-slate-400">{r.releasedAt}</td>
                <td className="px-4 py-3.5">
                  <span className={`status-tag ${r.isActive ? 'status-tag--ok' : 'status-tag--pending'}`}>{r.isActive ? 'Đang phát hành' : 'Đã ẩn'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
