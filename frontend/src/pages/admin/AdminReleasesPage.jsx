import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  UploadCloud, 
  CheckCircle, 
  Loader2, 
  ShieldCheck, 
  HardDrive, 
  ExternalLink,
  FileCode,
  Package,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Layers,
  Code2
} from 'lucide-react';
import { adminApi } from '../../api/services';

export default function AdminReleasesPage() {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [fileSizeLabel, setFileSizeLabel] = useState('71.4 MB');
  const [sha256Hash, setSha256Hash] = useState('');
  const [minRevit, setMinRevit] = useState(2022);
  const [maxRevit, setMaxRevit] = useState(2027);
  const [changelog, setChangelog] = useState('');
  const [packages, setPackages] = useState([
    { revit_version: 2022, url: '', sha256: '', file_size_bytes: 5621400 },
    { revit_version: 2023, url: '', sha256: '', file_size_bytes: 5648900 },
    { revit_version: 2024, url: '', sha256: '', file_size_bytes: 5689100 },
    { revit_version: 2025, url: '', sha256: '', file_size_bytes: 5704044 },
    { revit_version: 2026, url: '', sha256: '', file_size_bytes: 5732100 },
  ]);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [error, setError] = useState('');

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['adminReleases'],
    queryFn: adminApi.getReleases,
  });

  const createRelease = useMutation({
    mutationFn: () =>
      adminApi.createRelease({
        version: version.trim(),
        download_url: downloadUrl.trim(),
        file_size_label: fileSizeLabel || '71.4 MB',
        sha256_hash: sha256Hash.trim() || null,
        minimum_revit_version: parseInt(minRevit) || 2022,
        maximum_revit_version: parseInt(maxRevit) || 2027,
        release_notes: changelog || null,
        packages: packages
          .filter(p => p.url && p.sha256)
          .map(p => ({
            revit_version: parseInt(p.revit_version),
            url: p.url.trim(),
            sha256: p.sha256.trim(),
            file_size_bytes: p.file_size_bytes ? parseInt(p.file_size_bytes) : null
          }))
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReleases'] });
      setVersion('');
      setDownloadUrl('');
      setFileSizeLabel('71.4 MB');
      setSha256Hash('');
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

  const handlePasteJson = () => {
    try {
      if (!jsonInput.trim()) return;
      const data = JSON.parse(jsonInput);

      if (data.version) setVersion(data.version);
      if (data.download_url || data.installer_url) setDownloadUrl(data.download_url || data.installer_url);
      if (data.sha256_hash || data.setup_sha256 || data.sha256) setSha256Hash(data.sha256_hash || data.setup_sha256 || data.sha256);
      if (data.file_size_label || data.file_size) setFileSizeLabel(data.file_size_label || data.file_size);
      if (data.minimum_revit_version) setMinRevit(data.minimum_revit_version);
      if (data.maximum_revit_version) setMaxRevit(data.maximum_revit_version);
      if (data.release_notes || data.changelog) {
        setChangelog(typeof data.release_notes === 'string' ? data.release_notes : (Array.isArray(data.release_notes) ? data.release_notes.join('\n') : ''));
      }

      if (Array.isArray(data.packages) && data.packages.length > 0) {
        setPackages(data.packages.map(p => ({
          revit_version: p.revit_version || p.revitVersion || 2025,
          url: p.url || '',
          sha256: p.sha256 || p.sha256_hash || '',
          file_size_bytes: p.file_size_bytes || p.fileSizeBytes || null
        })));
      }

      setShowJsonModal(false);
      setJsonInput('');
      setError('');
    } catch (err) {
      setError('JSON không hợp lệ: ' + err.message);
    }
  };

  const addPackageRow = () => {
    setPackages([
      ...packages,
      { revit_version: 2026, url: '', sha256: '', file_size_bytes: 5700000 }
    ]);
  };

  const removePackageRow = (idx) => {
    setPackages(packages.filter((_, i) => i !== idx));
  };

  const updatePackageField = (idx, field, value) => {
    const next = [...packages];
    next[idx][field] = value;
    setPackages(next);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--brand)]/20">
              In-Place Auto Update
            </span>
            <span className="text-xs text-[var(--text-muted)] font-medium">RFC Contract v1.0.1</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight">
            Quản lý Phiên bản & Cập nhật Add-in
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Cung cấp manifest phát hành cho Add-in Revit qua endpoint <code className="font-mono text-[var(--brand)]">/api/v1/public/release/latest</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowJsonModal(true)}
          className="h-8.5 px-3.5 rounded-xl border border-[var(--brand)]/40 bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all text-xs font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer self-start"
        >
          <FileCode className="w-4 h-4" />
          <span>Dán nhanh release-packages.json</span>
        </button>
      </div>

      {/* JSON Import Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--surface-raised)] border border-[var(--line)] rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[var(--brand)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Nhập số liệu từ release-packages.json
                </h3>
              </div>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Dán toàn bộ nội dung file <code className="font-mono text-[var(--brand)]">installer\Output\release-packages.json</code> được sinh tự động bởi script <code className="font-mono text-[var(--text-primary)]">build-installer.ps1</code>:
            </p>

            <textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`{\n  "version": "v1.0.1",\n  "download_url": "https://downloads.bimautomation.solutions/release/BIMAutomation_v1.0.1_Setup.exe",\n  "sha256_hash": "F55BD5EA...",\n  "release_notes": "...",\n  "packages": [\n    {\n      "revit_version": 2025,\n      "url": "https://downloads.bimautomation.solutions/release/BIMAutomation_R25_v1.0.1.zip",\n      "sha256": "5857951F...",\n      "file_size_bytes": 5704044\n    }\n  ]\n}`}
              className="w-full p-3 font-mono text-xs bg-[var(--surface)] border border-[var(--line)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handlePasteJson}
                className="px-4 py-1.5 bg-[var(--brand)] text-white text-xs font-bold rounded-lg shadow-xs hover:opacity-90 cursor-pointer"
              >
                Tự động điền biểu mẫu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Release Form Panel */}
      <div className="panel p-6 bg-[var(--surface-raised)] border border-[var(--line)] rounded-2xl shadow-xs space-y-6">
        <form onSubmit={handleUpload} className="space-y-5">
          {/* Section 1: Full Setup Installer (.exe) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
              <Package className="w-4 h-4 text-[var(--brand)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                1. Bộ cài đặt đầy đủ (Full Setup .exe)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Phiên bản (version) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="v1.0.1"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Dung lượng hiển thị
                </label>
                <input
                  type="text"
                  placeholder="71.4 MB"
                  value={fileSizeLabel}
                  onChange={(e) => setFileSizeLabel(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Tương thích Revit (Min - Max)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="2022"
                    value={minRevit}
                    onChange={(e) => setMinRevit(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
                  />
                  <input
                    type="number"
                    placeholder="2027"
                    value={maxRevit}
                    onChange={(e) => setMaxRevit(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)]">
                URL tải bộ cài Setup.exe <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://downloads.bimautomation.solutions/release/BIMAutomation_v1.0.1_Setup.exe"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Mã băm SHA-256 của Setup.exe (Bắt buộc để kiểm chứng) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="F55BD5EA48F825DF51B5A96A000A17537F51E5C1B258AE0D235F88EEAE9B6631"
                value={sha256Hash}
                onChange={(e) => setSha256Hash(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
              />
            </div>
          </div>

          {/* Section 2: In-Place Update Packages (ZIP) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  2. Gói Cập nhật tại chỗ (In-Place Packages ZIP ~ 5-7 MB)
                </h3>
              </div>
              <button
                type="button"
                onClick={addPackageRow}
                className="h-6.5 px-2 rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] hover:border-[var(--brand)] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Thêm phiên bản Revit
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Mỗi file ZIP chứa <code className="font-mono text-[var(--brand)]">RevitAPP.dll</code> và cấu hình để Updater tự động giải nén đè lên <code className="font-mono text-[var(--text-muted)]">%APPDATA%\Autodesk\Revit\Addins\{'{năm}'}\RevitAPP\</code> mà không cần chạy lại installer.
            </p>

            <div className="space-y-2.5">
              {packages.map((pkg, idx) => (
                <div key={idx} className="p-3 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--brand)]/20">
                        Revit {pkg.revit_version}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {pkg.file_size_bytes ? `${(pkg.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : '5.7 MB'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePackageRow(idx)}
                      className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                      title="Xóa gói này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        placeholder="2025"
                        value={pkg.revit_version}
                        onChange={(e) => updatePackageField(idx, 'revit_version', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-mono bg-[var(--surface)] border border-[var(--line)] rounded-md text-[var(--text-primary)]"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <input
                        type="url"
                        placeholder="https://downloads.bimautomation.solutions/release/BIMAutomation_R25_v1.0.1.zip"
                        value={pkg.url}
                        onChange={(e) => updatePackageField(idx, 'url', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-mono bg-[var(--surface)] border border-[var(--line)] rounded-md text-[var(--text-primary)]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="SHA-256 hash (64 hex characters)"
                        value={pkg.sha256}
                        onChange={(e) => updatePackageField(idx, 'sha256', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-mono bg-[var(--surface)] border border-[var(--line)] rounded-md text-[var(--text-primary)]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        placeholder="Bytes (vd: 5704044)"
                        value={pkg.file_size_bytes || ''}
                        onChange={(e) => updatePackageField(idx, 'file_size_bytes', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-mono bg-[var(--surface)] border border-[var(--line)] rounded-md text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Release Notes */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Nội dung hiển thị cho người dùng (release_notes)
            </label>
            <textarea
              rows={3}
              placeholder="Bản cập nhật tối ưu hóa hiệu năng Rebar Engine và tương thích Revit 2025..."
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
            />
          </div>

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={createRelease.isPending}
            className="w-full py-2.5 rounded-xl bg-[var(--brand)] hover:opacity-90 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {createRelease.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : createRelease.isSuccess ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            {createRelease.isPending ? 'Đang phát hành...' : 'Phát hành phiên bản Add-in mới'}
          </button>
        </form>
      </div>

      {/* History Releases Table */}
      <div className="panel overflow-hidden bg-[var(--surface-raised)] border border-[var(--line)] rounded-2xl shadow-xs">
        <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[var(--brand)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Lịch sử các bản phát hành
            </h3>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-mono">{releases.length} bản ghi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-[var(--text-secondary)] uppercase font-mono bg-[var(--surface-subtle)] border-b border-[var(--line)] font-bold">
              <tr>
                <th className="px-4 py-3.5">Phiên bản</th>
                <th className="px-4 py-3.5">Bộ cài Full .exe</th>
                <th className="px-4 py-3.5">Gói Cập nhật In-Place (ZIP)</th>
                <th className="px-4 py-3.5">Ngày phát hành</th>
                <th className="px-4 py-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[var(--text-secondary)]" colSpan={5}>
                    <Loader2 className="animate-spin inline mr-2" size={14} /> Đang tải lịch sử...
                  </td>
                </tr>
              ) : releases.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[var(--text-muted)]" colSpan={5}>
                    Chưa có phiên bản nào được phát hành.
                  </td>
                </tr>
              ) : (
                releases.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--surface-subtle)]/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono">
                      <span className="font-bold text-[var(--brand)] text-xs block">{r.version}</span>
                      {r.sha256Hash && (
                        <span className="text-[10px] text-[var(--text-muted)] block truncate max-w-[130px]" title={r.sha256Hash}>
                          SHA: {r.sha256Hash.substring(0, 10)}...
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <a
                          href={r.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--brand)] hover:underline inline-flex items-center gap-1 font-semibold text-xs"
                        >
                          Tải Setup.exe <ExternalLink size={11} />
                        </a>
                        <span className="text-[10px] text-[var(--text-muted)] block font-mono">
                          {r.fileSizeLabel || '71.4 MB'} • Revit {r.minimumRevitVersion || 2022}-{r.maximumRevitVersion || 2027}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {Array.isArray(r.packages) && r.packages.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.packages.map((pkg, pIdx) => (
                            <span
                              key={pIdx}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20"
                              title={`${pkg.url}\nSHA256: ${pkg.sha256}`}
                            >
                              R{pkg.revit_version?.toString().slice(-2) || pkg.revit_version}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)]">Chỉ có Setup.exe</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-[var(--text-secondary)] font-mono text-[11px]">
                      {r.releasedAt}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        r.isActive 
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-500/15 text-[var(--text-secondary)] border border-[var(--line)]'
                      }`}>
                        {r.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                        {r.isActive ? 'Đang phát hành' : 'Đã ẩn'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
