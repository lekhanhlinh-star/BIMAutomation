import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const requestUse = vi.fn();
  const responseUse = vi.fn();
  const mainClient = vi.fn((config) => Promise.resolve({ data: 'retried', config }));
  mainClient.interceptors = {
    request: { use: requestUse },
    response: { use: responseUse },
  };
  const refreshClient = { post: vi.fn() };
  const create = vi.fn()
    .mockReturnValueOnce(refreshClient)
    .mockReturnValueOnce(mainClient);
  return { create, mainClient, refreshClient, requestUse, responseUse };
});

vi.mock('axios', () => ({
  default: { create: mocks.create },
}));

import { ACCESS_TOKEN_KEY } from './axiosClient';

const requestInterceptor = () => mocks.requestUse.mock.calls[0][0];
const responseErrorInterceptor = () => mocks.responseUse.mock.calls[0][1];

describe('axiosClient token refresh', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.mainClient.mockClear();
    mocks.refreshClient.post.mockReset();
  });

  it('attaches the current access token to API requests', () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'access-v1');
    const config = requestInterceptor()({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer access-v1');
  });

  it('uses one refresh request for concurrent 401 responses and retries both', async () => {
    let resolveRefresh;
    mocks.refreshClient.post.mockReturnValue(new Promise((resolve) => {
      resolveRefresh = resolve;
    }));
    const handleError = responseErrorInterceptor();
    const first = handleError({ response: { status: 401 }, config: { url: '/users/me', headers: {} } });
    const second = handleError({ response: { status: 401 }, config: { url: '/orders', headers: {} } });

    expect(mocks.refreshClient.post).toHaveBeenCalledTimes(1);
    resolveRefresh({ data: { access_token: 'access-v2' } });
    await Promise.all([first, second]);

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('access-v2');
    expect(mocks.mainClient).toHaveBeenCalledTimes(2);
    expect(mocks.mainClient.mock.calls[0][0].headers.Authorization).toBe('Bearer access-v2');
    expect(mocks.mainClient.mock.calls[1][0].headers.Authorization).toBe('Bearer access-v2');
  });

  it('does not recursively refresh the refresh endpoint', async () => {
    const error = {
      response: { status: 401 },
      config: { url: '/auth/jwt/refresh', headers: {} },
    };
    await expect(responseErrorInterceptor()(error)).rejects.toBe(error);
    expect(mocks.refreshClient.post).not.toHaveBeenCalled();
  });
});
