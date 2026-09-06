import { describe, expect, it } from 'vitest';
import { formatAdminDateTime, getPlanPresentation } from './services';

describe('pricing presentation', () => {
  it('presents simple trial, monthly, and annual plans for individuals', () => {
    const trial = getPlanPresentation({ name: 'Trial', duration_months: 0 });
    const monthly = getPlanPresentation(1);
    const annual = getPlanPresentation(12);

    expect(trial.name).toBe('Dùng thử 14 ngày');
    expect(monthly.name).toBe('Gói cá nhân tháng');
    expect(annual.name).toBe('Gói cá nhân năm');
    expect(annual.isPopular).toBe(true);
    expect(new Set([trial.description, monthly.description, annual.description]).size).toBe(3);
  });
});

describe('admin date-time presentation', () => {
  it('formats customer join time through minutes without seconds', () => {
    expect(formatAdminDateTime('2026-08-25T13:47:59')).toBe('25/08/2026 13:47');
    expect(formatAdminDateTime('not-a-date')).toBe('—');
  });
});
