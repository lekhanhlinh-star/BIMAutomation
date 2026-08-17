import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Save, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Hồ sơ cá nhân</h2>
        <p className="text-xs text-slate-400 mt-1">Cập nhật thông tin tài khoản người dùng BIMAutomation.</p>
      </div>

      <div className="panel p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email (không thể thay đổi)</label>
            <input
              type="text"
              disabled
              value={user?.email || 'user@bimautomation.com'}
              className="form-control text-sm font-mono text-slate-400 bg-[var(--surface)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="form-control text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="primary-button !min-h-10 !py-2 text-xs"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" /> Đã lưu thông tin
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
