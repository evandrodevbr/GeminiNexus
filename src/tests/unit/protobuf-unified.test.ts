import { describe, it, expect } from 'vitest';
import { ProtobufUtils } from '../../utils/protobuf';

describe('ProtobufUtils Unified OAuth', () => {
  it('should round-trip OAuthInfo payload', () => {
    const accessToken = 'access-token-123';
    const refreshToken = 'refresh-token-456';
    const expiry = 1700000000;

    const oauthInfo = ProtobufUtils.createOAuthInfo(accessToken, refreshToken, expiry);
    const parsed = ProtobufUtils.extractOAuthTokenInfoFromOAuthInfo(oauthInfo);

    expect(parsed).toEqual({
      accessToken,
      refreshToken,
    });
  });

  it('should round-trip unified oauth token', () => {
    const accessToken = 'access-token-abc';
    const refreshToken = 'refresh-token-def';
    const expiry = 1700001234;

    const unifiedB64 = ProtobufUtils.createUnifiedOAuthToken(accessToken, refreshToken, expiry);
    const unifiedBytes = new Uint8Array(Buffer.from(unifiedB64, 'base64'));
    const parsed = ProtobufUtils.extractOAuthTokenInfoFromUnifiedState(unifiedBytes);

    expect(parsed).toEqual({
      accessToken,
      refreshToken,
    });
  });

  it('should round-trip unified state entry with topic/row structure', () => {
    const payload = new Uint8Array([1, 2, 3, 4, 5]);
    const entry = ProtobufUtils.createUnifiedStateEntry('userStatusSentinelKey', payload);
    const decoded = ProtobufUtils.decodeUnifiedStateEntry(entry);

    expect(decoded.sentinelKey).toBe('userStatusSentinelKey');
    expect(Array.from(decoded.payload)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should parse legacy nested unified oauth payload', () => {
    const accessToken = 'legacy-access';
    const refreshToken = 'legacy-refresh';
    const oauthInfo = ProtobufUtils.createOAuthInfo(accessToken, refreshToken, 1700000000);
    const oauthInfoB64 = Buffer.from(oauthInfo).toString('base64');

    // Legacy nested structure:
    // Outer(F1) -> Inner(F1 sentinel, F2 Inner2), Inner2(F1 base64(oauthInfo))
    const inner2 = ProtobufUtils.encodeStringField(1, oauthInfoB64);
    const inner = new Uint8Array(
      ProtobufUtils.encodeStringField(1, 'oauthTokenInfoSentinelKey').length +
        ProtobufUtils.encodeLenDelimField(2, inner2).length,
    );
    const innerField1 = ProtobufUtils.encodeStringField(1, 'oauthTokenInfoSentinelKey');
    const innerField2 = ProtobufUtils.encodeLenDelimField(2, inner2);
    inner.set(innerField1, 0);
    inner.set(innerField2, innerField1.length);
    const legacyOuter = ProtobufUtils.encodeLenDelimField(1, inner);

    const parsed = ProtobufUtils.extractOAuthTokenInfoFromUnifiedState(legacyOuter);
    expect(parsed).toEqual({ accessToken, refreshToken });
  });
});
