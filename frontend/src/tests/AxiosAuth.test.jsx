import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('API axios auth configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('uses localhost API base URL', async () => {
    const { default: API } = await import('../api/axios');
    expect(API.defaults.baseURL).toBe('http://localhost:5000/api');
  });

  it('attaches Bearer token from localStorage', async () => {
    localStorage.setItem('token', 'test-token');
    const { default: API } = await import('../api/axios');
    const [interceptor] = API.interceptors.request.handlers;
    const config = await interceptor.fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer test-token');
  });
});
