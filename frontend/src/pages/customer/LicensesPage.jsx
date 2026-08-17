import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../../api/services';
import { Key, Copy, Check, Monitor, RefreshCw } from 'lucide-react';

export default function LicensesPage() {
  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['myLicenses'],
    queryFn: customerApi.getLicenses
  });

  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">License bản quyền đã mua</h2>
        <p className="text-xs text-slate-400 mt-1">Sao chép Key và nhập vào Ribbon Add-in trên Revit để kích hoạt.</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-slate-400">Đang tải danh sách bản quyền...</div>
      ) : licenses.length === 0 ? (
        <div className="panel p-8 text-center space-y-3">
          <Key className="w-9 h-9 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-white">Bạn chưa sở hữu License Key nào.</p>
          <p className="text-xs text-slate-400">Hãy mua gói bản quyền Add-in Revit để nhận License Key tự động.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {licenses.map((lic) => (
            <div key={lic.id} className="panel p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-[var(--line)]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-white">{lic.planName}</span>
                    <span className={`status-tag ${lic.status === 'ACTIVE' ? 'status-tag--ok' : 'status-tag--off'}`}>{lic.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Kích hoạt: {lic.activatedAt} · Hết hạn: {lic.expiresAt}</p>
                </div>

                <button
                  onClick={() => alert(`Đã gửi yêu cầu Reset thiết bị cho Key ${lic.key}`)}
                  className="secondary-button !min-h-9 !py-1.5 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset thiết bị
                </button>
              </div>

              {/* Key display box */}
              <div className="p-3 bg-[var(--surface)] border border-[var(--line)] flex items-center justify-between gap-4 font-mono">
                <span className="text-cyan-300 font-bold text-sm sm:text-base tracking-widest truncate">{lic.key}</span>
                <button
                  onClick={() => handleCopyKey(lic.key)}
                  className="secondary-button !min-h-9 !py-1.5 text-xs shrink-0"
                >
                  {copiedKey === lic.key ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã copy
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Key
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Monitor className="w-3.5 h-3.5 text-slate-500" />
                <span>Thiết bị đang gắn: <strong className="text-slate-200 font-mono">{lic.hardwareId}</strong> ({lic.activeDevices}/{lic.maxDevices} máy)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
