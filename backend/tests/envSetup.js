// These env vars must be set before any application modules are loaded
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-jest-runs';
