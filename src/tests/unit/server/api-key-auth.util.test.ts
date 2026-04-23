import { describe, it, expect } from 'vitest';
import {
  hasConfiguredApiKey,
  extractApiKeyToken,
  type RequestHeaders,
} from '@/server/guards/api-key-auth.util';

describe('api-key-auth.util', () => {
  describe('hasConfiguredApiKey', () => {
    it('should return true for non-empty string', () => {
      expect(hasConfiguredApiKey('test-key')).toBe(true);
      expect(hasConfiguredApiKey('  key  ')).toBe(true);
    });

    it('should return false for empty or whitespace-only strings', () => {
      expect(hasConfiguredApiKey('')).toBe(false);
      expect(hasConfiguredApiKey('   ')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasConfiguredApiKey(undefined)).toBe(false);
    });
  });

  describe('extractApiKeyToken', () => {
    it('should extract Bearer token from Authorization header', () => {
      const headers: RequestHeaders = { authorization: 'Bearer test-token-123' };
      expect(extractApiKeyToken(headers)).toBe('test-token-123');
    });

    it('should handle Authorization header with extra spaces', () => {
      const headers: RequestHeaders = { authorization: '  Bearer   token-456  ' };
      expect(extractApiKeyToken(headers)).toBe('token-456');
    });

    it('should reject malformed Bearer tokens with extra parts', () => {
      const headers: RequestHeaders = { authorization: 'Bearer token extra' };
      expect(extractApiKeyToken(headers)).toBeNull();
    });

    it('should be case-insensitive for Bearer scheme', () => {
      const headers: RequestHeaders = { authorization: 'bearer lower-case-token' };
      expect(extractApiKeyToken(headers)).toBe('lower-case-token');
    });

    it('should extract x-api-key header', () => {
      const headers: RequestHeaders = { 'x-api-key': 'api-key-value' };
      expect(extractApiKeyToken(headers)).toBe('api-key-value');
    });

    it('should extract x-goog-api-key header', () => {
      const headers: RequestHeaders = { 'x-goog-api-key': 'goog-key-value' };
      expect(extractApiKeyToken(headers)).toBe('goog-key-value');
    });

    it('should prefer Authorization over x-api-key', () => {
      const headers: RequestHeaders = {
        authorization: 'Bearer auth-token',
        'x-api-key': 'api-token',
      };
      expect(extractApiKeyToken(headers)).toBe('auth-token');
    });

    it('should handle array header values', () => {
      const headers: RequestHeaders = { authorization: ['Bearer token-1', 'Bearer token-2'] };
      expect(extractApiKeyToken(headers)).toBe('token-1');
    });

    it('should skip empty strings in array values', () => {
      const headers: RequestHeaders = { authorization: ['', '  ', 'Bearer valid-token'] };
      expect(extractApiKeyToken(headers)).toBe('valid-token');
    });

    it('should return null when no auth header present', () => {
      const headers: RequestHeaders = {};
      expect(extractApiKeyToken(headers)).toBeNull();
    });

    it('should return null for unsupported scheme', () => {
      const headers: RequestHeaders = { authorization: 'Basic dXNlcjpwYXNz' };
      expect(extractApiKeyToken(headers)).toBeNull();
    });
  });
});
