import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

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
    <div className="portal-page portal-profile max-w-2xl space-y-6">
      <div>
        <p className="account-kicker">Thông tin tài khoản</p>
        <h2 className="mt-2 text-xl font-extrabold text-[var(--text-primary)]">Hồ sơ cá nhân</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Cập nhật thông tin tài khoản người dùng BIMAutomation.</p>
      </div>

      <div className="panel p-6 lg:p-8 bg-[var(--surface-raised)] border border-[var(--line)] rounded-[var(--radius-panel)] shadow-xs">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary)]">Email (liên kết Google OAuth)</label>
            <input
              type="text"
              disabled
              value={user?.email || 'user@bimautomation.com'}
              className="form-control text-sm font-mono text-[var(--text-muted)] bg-[var(--surface-subtle)] opacity-80 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary)]">Họ và tên</label>
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
              className="primary-button !min-h-10 !py-2 text-xs font-bold"
            >
              {saved ? (
                <>Đã lưu thông tin</>
              ) : (
                <>Lưu thay đổi</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
