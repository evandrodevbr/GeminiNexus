export class ProtobufUtils {
  private static concatBytes(...parts: Uint8Array[]): Uint8Array {
    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      merged.set(part, offset);
      offset += part.length;
    }
    return merged;
  }

  static encodeVarint(value: number): Uint8Array {
    // Note: Javascript bitwise operators treat operands as 32-bit integers.
    // However, for typical token lengths and small field IDs, this is fine.
    // Expiry timestamp (seconds) fits in 32-bit (until 2038) but might exceed if it's milliseconds.
    // If value is larger than 2^32, we need BigInt.

    const buf: number[] = [];
    let val = BigInt(value);

    while (val >= 128n) {
      buf.push(Number((val & 127n) | 128n));
      val >>= 7n;
    }
    buf.push(Number(val));
    return new Uint8Array(buf);
  }

  static readVarint(data: Uint8Array, offset: number): { value: bigint; nextOffset: number } {
    let result = 0n;
    let shift = 0n;
    let pos = offset;

    while (pos < data.length) {
      const byte = BigInt(data[pos]);
      result |= (byte & 127n) << shift;
      pos++;
      if ((byte & 128n) === 0n) {
        return { value: result, nextOffset: pos };
      }
      shift += 7n;
    }
    throw new Error('Incomplete varint data');
  }

  // Skip a field based on wire type
  static skipField(data: Uint8Array, offset: number, wireType: number): number {
    switch (wireType) {
      case 0: // Varint
        return this.readVarint(data, offset).nextOffset;
      case 1: // 64-bit
        return offset + 8;
      case 2: {
        // Length-delimited
        const { value: length, nextOffset } = this.readVarint(data, offset);
        return nextOffset + Number(length);
      }
      case 5: // 32-bit
        return offset + 4;
      default:
        throw new Error(`Unknown wire type: ${wireType}`);
    }
  }

  static removeField(data: Uint8Array, fieldNum: number): Uint8Array {
    const result: number[] = [];
    let offset = 0;

    while (offset < data.length) {
      const startOffset = offset;
      const { value: tag, nextOffset } = this.readVarint(data, offset);
      const wireType = Number(tag & 7n);
      const currentField = Number(tag >> 3n);

      if (currentField === fieldNum) {
        // Skip
        offset = this.skipField(data, nextOffset, wireType);
      } else {
        // Copy
        const endOffset = this.skipField(data, nextOffset, wireType);
        for (let i = startOffset; i < endOffset; i++) {
          result.push(data[i]);
        }
        offset = endOffset;
      }
    }
    return new Uint8Array(result);
  }

  // Create string field (WireType 2)
  static createStringField(fieldNum: number, value: string): Uint8Array {
    const tag = (fieldNum << 3) | 2;
    const utf8Encode = new TextEncoder();
    const bytes = utf8Encode.encode(value);

    const tagBytes = this.encodeVarint(tag);
    const lenBytes = this.encodeVarint(bytes.length);

    const result = new Uint8Array(tagBytes.length + lenBytes.length + bytes.length);
    result.set(tagBytes, 0);
    result.set(lenBytes, tagBytes.length);
    result.set(bytes, tagBytes.length + lenBytes.length);
    return result;
  }

  static encodeLenDelimField(fieldNum: number, data: Uint8Array): Uint8Array {
    const tag = (fieldNum << 3) | 2;
    const tagBytes = this.encodeVarint(tag);
    const lenBytes = this.encodeVarint(data.length);

    const result = new Uint8Array(tagBytes.length + lenBytes.length + data.length);
    result.set(tagBytes, 0);
    result.set(lenBytes, tagBytes.length);
    result.set(data, tagBytes.length + lenBytes.length);
    return result;
  }

  static encodeStringField(fieldNum: number, value: string): Uint8Array {
    const utf8Encode = new TextEncoder();
    const bytes = utf8Encode.encode(value);
    return this.encodeLenDelimField(fieldNum, bytes);
  }

  static encodeVarintField(fieldNum: number, value: number): Uint8Array {
    const tag = (fieldNum << 3) | 0;
    const tagBytes = this.encodeVarint(tag);
    const valueBytes = this.encodeVarint(value);
    return this.concatBytes(tagBytes, valueBytes);
  }

  // Create timestamp field (Field 4 -> Field 1 varint)
  static createTimestampField(fieldNum: number, seconds: number): Uint8Array {
    // Timestamp message format: Field 1 (seconds) as varint
    const innerTag = (1 << 3) | 0;
    const innerTagBytes = this.encodeVarint(innerTag);
    const secondsBytes = this.encodeVarint(seconds);

    const innerMsg = new Uint8Array(innerTagBytes.length + secondsBytes.length);
    innerMsg.set(innerTagBytes, 0);
    innerMsg.set(secondsBytes, innerTagBytes.length);

    // Wrap in length delimited
    const tag = (fieldNum << 3) | 2;
    const tagBytes = this.encodeVarint(tag);
    const lenBytes = this.encodeVarint(innerMsg.length);

    const result = new Uint8Array(tagBytes.length + lenBytes.length + innerMsg.length);
    result.set(tagBytes, 0);
    result.set(lenBytes, tagBytes.length);
    result.set(innerMsg, tagBytes.length + lenBytes.length);
    return result;
  }

  // Extract field by ID
  static getField(data: Uint8Array, fieldNum: number): Uint8Array | null {
    let offset = 0;
    while (offset < data.length) {
      const { value: tag, nextOffset } = this.readVarint(data, offset);
      const wireType = Number(tag & 7n);
      const currentField = Number(tag >> 3n);

      if (currentField === fieldNum) {
        if (wireType === 2) {
          // Length delimited
          const { value: length, nextOffset: dataStart } = this.readVarint(data, nextOffset);
          return data.slice(dataStart, dataStart + Number(length));
        }
        // For sync feature, we mainly care about wireType 2 (string/bytes)
        return null;
      }

      offset = this.skipField(data, nextOffset, wireType);
    }
    return null;
  }

  static readString(data: Uint8Array): string {
    const dec = new TextDecoder();
    return dec.decode(data);
  }

  static extractOAuthTokenInfo(
    data: Uint8Array,
  ): { accessToken: string; refreshToken: string } | null {
    // 1. Find Field 6 (OAuthTokenInfo)
    const field6Data = this.getField(data, 6);
    if (!field6Data) return null;

    // 2. Parse Field 6 content
    // Field 1: Access Token (String)
    // Field 2: Type (String, "Bearer")
    // Field 3: Refresh Token (String)
    // Field 4: Expiry (Varint? Timestamp?) - In create we used createTimestampField which effectively makes it Field 4 -> Field 1.
    // But here we just need Access/Refresh.

    const accessTokenBytes = this.getField(field6Data, 1);
    const refreshTokenBytes = this.getField(field6Data, 3);

    if (accessTokenBytes && refreshTokenBytes) {
      return {
        accessToken: this.readString(accessTokenBytes),
        refreshToken: this.readString(refreshTokenBytes),
      };
    }
    return null;
  }

  static createOAuthTokenInfo(
    accessToken: string,
    refreshToken: string,
    expiry: number,
  ): Uint8Array {
    const f1 = this.createStringField(1, accessToken);
    const f2 = this.createStringField(2, 'Bearer');
    const f3 = this.createStringField(3, refreshToken);
    const f4 = this.createTimestampField(4, expiry);

    const combined = new Uint8Array(f1.length + f2.length + f3.length + f4.length);
    combined.set(f1, 0);
    combined.set(f2, f1.length);
    combined.set(f3, f1.length + f2.length);
    combined.set(f4, f1.length + f2.length + f3.length);

    // Wrap as Field 6
    const tag6 = (6 << 3) | 2;
    const tag6Bytes = this.encodeVarint(tag6);
    const lenBytes = this.encodeVarint(combined.length);

    const result = new Uint8Array(tag6Bytes.length + lenBytes.length + combined.length);
    result.set(tag6Bytes, 0);
    result.set(lenBytes, tag6Bytes.length);
    result.set(combined, tag6Bytes.length + lenBytes.length);

    return result;
  }

  static createOAuthInfo(
    accessToken: string,
    refreshToken: string,
    expiry: number,
    isGcpTos = true,
  ): Uint8Array {
    const field1 = this.encodeStringField(1, accessToken);
    const field2 = this.encodeStringField(2, 'Bearer');
    const field3 = this.encodeStringField(3, refreshToken);

    const timestampTag = (1 << 3) | 0;
    const tagBytes = this.encodeVarint(timestampTag);
    const secondsBytes = this.encodeVarint(expiry);
    const timestampMsg = new Uint8Array(tagBytes.length + secondsBytes.length);
    timestampMsg.set(tagBytes, 0);
    timestampMsg.set(secondsBytes, tagBytes.length);

    const field4 = this.encodeLenDelimField(4, timestampMsg);
    const field6 = isGcpTos ? this.encodeVarintField(6, 1) : new Uint8Array();

    const combined = new Uint8Array(
      field1.length + field2.length + field3.length + field4.length + field6.length,
    );
    combined.set(field1, 0);
    combined.set(field2, field1.length);
    combined.set(field3, field1.length + field2.length);
    combined.set(field4, field1.length + field2.length + field3.length);
    combined.set(field6, field1.length + field2.length + field3.length + field4.length);
    return combined;
  }

  static createUnifiedOAuthToken(
    accessToken: string,
    refreshToken: string,
    expiry: number,
    isGcpTos = true,
  ): string {
    const oauthInfo = this.createOAuthInfo(accessToken, refreshToken, expiry, isGcpTos);
    return this.createUnifiedStateEntry('oauthTokenInfoSentinelKey', oauthInfo);
  }

  static extractOAuthTokenInfoFromOAuthInfo(
    data: Uint8Array,
  ): { accessToken: string; refreshToken: string } | null {
    const accessTokenBytes = this.getField(data, 1);
    const refreshTokenBytes = this.getField(data, 3);

    if (accessTokenBytes && refreshTokenBytes) {
      return {
        accessToken: this.readString(accessTokenBytes),
        refreshToken: this.readString(refreshTokenBytes),
      };
    }
    return null;
  }

  static extractOAuthTokenInfoFromUnifiedState(
    data: Uint8Array,
  ): { accessToken: string; refreshToken: string } | null {
    let decoded: { sentinelKey: string; payload: Uint8Array };
    try {
      decoded = this.decodeTopicRowPayload(data);
    } catch {
      try {
        decoded = this.decodeLegacyUnifiedStateEntry(data);
      } catch {
        return null;
      }
    }

    if (decoded.sentinelKey !== 'oauthTokenInfoSentinelKey') {
      return null;
    }

    const directParsed = this.extractOAuthTokenInfoFromOAuthInfo(decoded.payload);
    if (directParsed) {
      return directParsed;
    }
    const nestedOauthInfoB64Bytes = this.getField(decoded.payload, 1);
    if (!nestedOauthInfoB64Bytes) {
      return null;
    }

    try {
      const nestedOauthInfoBytes = new Uint8Array(
        Buffer.from(this.readString(nestedOauthInfoB64Bytes), 'base64'),
      );
      return this.extractOAuthTokenInfoFromOAuthInfo(nestedOauthInfoBytes);
    } catch {
      return null;
    }
  }

  private static decodeLegacyBase64PayloadIfNeeded(payload: Uint8Array): Uint8Array {
    if (payload.length === 0 || payload.length % 4 !== 0) {
      return payload;
    }

    let looksLikeBase64 = true;
    for (const byte of payload) {
      const isBase64Byte =
        (byte >= 65 && byte <= 90) ||
        (byte >= 97 && byte <= 122) ||
        (byte >= 48 && byte <= 57) ||
        byte === 43 ||
        byte === 47 ||
        byte === 61;
      if (!isBase64Byte) {
        looksLikeBase64 = false;
        break;
      }
    }

    if (!looksLikeBase64) {
      return payload;
    }

    try {
      const encoded = Buffer.from(payload).toString('utf8');
      const decoded = new Uint8Array(Buffer.from(encoded, 'base64'));
      if (decoded.length === 0) {
        return payload;
      }
      return decoded;
    } catch {
      return payload;
    }
  }

  private static decodeTopicRowPayload(topicBlob: Uint8Array): {
    sentinelKey: string;
    payload: Uint8Array;
  } {
    const dataEntry = this.getField(topicBlob, 1);
    if (!dataEntry) {
      throw new Error('Topic data entry not found');
    }

    const sentinelKeyBytes = this.getField(dataEntry, 1);
    if (!sentinelKeyBytes) {
      throw new Error('Topic data entry key not found');
    }

    const rowBlob = this.getField(dataEntry, 2);
    if (!rowBlob) {
      throw new Error('Topic row not found');
    }

    const encodedPayloadBytes = this.getField(rowBlob, 1);
    if (!encodedPayloadBytes) {
      throw new Error('Topic row value not found');
    }

    const sentinelKey = this.readString(sentinelKeyBytes);
    const encodedPayload = this.readString(encodedPayloadBytes);
    const payload = new Uint8Array(Buffer.from(encodedPayload, 'base64'));

    return { sentinelKey, payload };
  }

  private static decodeLegacyUnifiedStateEntry(outerBlob: Uint8Array): {
    sentinelKey: string;
    payload: Uint8Array;
  } {
    const innerBlob = this.getField(outerBlob, 1);
    if (!innerBlob) {
      throw new Error('Outer Field 1 not found');
    }

    const sentinelKeyBytes = this.getField(innerBlob, 1);
    if (!sentinelKeyBytes) {
      throw new Error('Inner Field 1 not found');
    }

    const payload = this.getField(innerBlob, 2);
    if (!payload) {
      throw new Error('Inner Field 2 not found');
    }

    return {
      sentinelKey: this.readString(sentinelKeyBytes),
      payload: this.decodeLegacyBase64PayloadIfNeeded(payload),
    };
  }

  static createUnifiedStateEntry(sentinelKey: string, payload: Uint8Array): string {
    const row = this.encodeStringField(1, Buffer.from(payload).toString('base64'));
    const dataEntry = this.concatBytes(
      this.encodeStringField(1, sentinelKey),
      this.encodeLenDelimField(2, row),
    );
    const topic = this.encodeLenDelimField(1, dataEntry);
    return Buffer.from(topic).toString('base64');
  }

  static decodeUnifiedStateEntry(outerB64: string): { sentinelKey: string; payload: Uint8Array } {
    const outerBlob = new Uint8Array(Buffer.from(outerB64, 'base64'));

    try {
      return this.decodeTopicRowPayload(outerBlob);
    } catch {
      return this.decodeLegacyUnifiedStateEntry(outerBlob);
    }
  }

  static findVarintField(data: Uint8Array, targetField: number): number | null {
    let offset = 0;
    while (offset < data.length) {
      const { value: tag, nextOffset } = this.readVarint(data, offset);
      const wireType = Number(tag & 7n);
      const currentField = Number(tag >> 3n);

      if (currentField === targetField && wireType === 0) {
        const { value } = this.readVarint(data, nextOffset);
        return Number(value);
      }

      offset = this.skipField(data, nextOffset, wireType);
    }

    return null;
  }

  static createStringValuePayload(value: string): Uint8Array {
    return this.encodeStringField(3, value);
  }

  static createMinimalUserStatusPayload(email: string): Uint8Array {
    return this.concatBytes(this.encodeStringField(3, email), this.encodeStringField(7, email));
  }

  static extractOAuthTokenInfoFromUnifiedStateEntry(
    outerB64: string,
  ): { accessToken: string; refreshToken: string } | null {
    return this.extractOAuthTokenInfoFromUnifiedState(
      new Uint8Array(Buffer.from(outerB64, 'base64')),
    );
  }
}
