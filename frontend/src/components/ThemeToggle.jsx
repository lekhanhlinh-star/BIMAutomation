import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

export default function ThemeToggle({ className = '', size = 'md' }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  const sizeClasses = size === 'sm' 
    ? 'w-8 h-8 text-xs' 
    : 'w-10 h-10 text-sm';

  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className={`relative inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${sizeClasses} ${className}`}
    >
      {isDark ? (
        <Sun size={iconSize} className="text-amber-400 transition-transform rotate-0 hover:rotate-45" />
      ) : (
        <Moon size={iconSize} className="text-slate-600 transition-transform rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
