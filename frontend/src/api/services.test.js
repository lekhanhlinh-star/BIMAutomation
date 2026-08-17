import { describe, expect, it } from 'vitest';
import { getPlanPresentation } from './services';

describe('pricing presentation', () => {
  it('differentiates plans by duration', () => {
    const monthly = getPlanPresentation(1);
    const annual = getPlanPresentation(12);
    const enterprise = getPlanPresentation(120);
    expect([monthly.name, annual.name, enterprise.name]).toEqual(['Gói Tháng', 'Gói Năm', 'Gói Doanh nghiệp']);
    expect(annual.isPopular).toBe(true);
    expect(new Set([monthly.description, annual.description, enterprise.description]).size).toBe(3);
  });
});
