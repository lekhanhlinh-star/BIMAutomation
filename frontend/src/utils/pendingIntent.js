const KEY = 'bimautomation_pending_intent';
const ALLOWED_ROUTES = new Set(['/pricing', '/download', '/account']);

export function safeReturnTo(value, fallback = '/account') {
  if (typeof value !== 'string') return fallback;
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin && ALLOWED_ROUTES.has(url.pathname)
      ? `${url.pathname}${url.search}`
      : fallback;
  } catch {
    return fallback;
  }
}

export function savePendingIntent(intent) {
  if (!intent || !['checkout', 'download'].includes(intent.type)) return false;
  const value = {
    type: intent.type,
    returnTo: safeReturnTo(intent.returnTo, intent.type === 'download' ? '/download' : '/pricing'),
  };
  if (intent.type === 'checkout' && intent.planId) value.planId = String(intent.planId);
  sessionStorage.setItem(KEY, JSON.stringify(value));
  return true;
}

export function peekPendingIntent() {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY));
    if (!value || !['checkout', 'download'].includes(value.type)) return null;
    return { ...value, returnTo: safeReturnTo(value.returnTo) };
  } catch {
    return null;
  }
}

export function consumePendingIntent() {
  const value = peekPendingIntent();
  sessionStorage.removeItem(KEY);
  return value;
}

export function destinationAfterAuth() {
  const intent = consumePendingIntent();
  if (!intent) return '/account';
  if (intent.type === 'checkout' && intent.planId) {
    return `/pricing?plan=${encodeURIComponent(intent.planId)}&checkout=1`;
  }
  return safeReturnTo(intent.returnTo, '/account');
}
