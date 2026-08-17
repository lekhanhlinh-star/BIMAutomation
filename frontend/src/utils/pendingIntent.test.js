import { beforeEach, describe, expect, it } from 'vitest';
import { consumePendingIntent, destinationAfterAuth, savePendingIntent } from './pendingIntent';

describe('pending intent', () => {
  beforeEach(() => sessionStorage.clear());
  it('is consumed exactly once', () => {
    savePendingIntent({ type: 'download', returnTo: '/download' });
    expect(consumePendingIntent()).toMatchObject({ type: 'download', returnTo: '/download' });
    expect(consumePendingIntent()).toBeNull();
  });
  it('restores the selected checkout plan', () => {
    savePendingIntent({ type: 'checkout', planId: 'annual', returnTo: '/pricing' });
    expect(destinationAfterAuth()).toBe('/pricing?plan=annual&checkout=1');
  });
  it('rejects an external return URL', () => {
    savePendingIntent({ type: 'download', returnTo: 'https://evil.example/phish' });
    expect(consumePendingIntent().returnTo).toBe('/download');
  });
});
