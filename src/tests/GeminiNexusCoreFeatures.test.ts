import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transformClaudeRequestIn } from '../lib/geminiNexus/ClaudeRequestMapper';
import { ClaudeRequest } from '../lib/geminiNexus/types';
import { SignatureStore } from '../lib/geminiNexus/SignatureStore';

/**
 * Gemini Nexus Core Features Verification
 *
 * This test suite verifies the critical "Gemini Nexus" enhancements ported from the Manager project.
 * Primarily focuses on:
 * 1. Identity Injection (Safety & Branding)
 * 2. Gemini 3 Pro Compatibility (Stability Fixes)
 * 3. Model Routing Logic (Business Rules)
 */
describe('Gemini Nexus Core Features (Business Logic)', () => {
  beforeEach(() => {
    // Clear global signature store before each test
    SignatureStore.clear();
    vi.restoreAllMocks();
  });

  const BASE_REQUEST: ClaudeRequest = {
    model: 'claude-3-5-sonnet-20241022',
    messages: [{ role: 'user', content: 'Hello' }],
    max_tokens: 100,
    stream: true,
  };

  describe('Feature: Identity Injection (Branding & Safety)', () => {
    it('should inject Gemini Nexus identity when system prompt is missing', () => {
      const result = transformClaudeRequestIn({ ...BASE_REQUEST }, 'test-project');

      const parts = result.request.systemInstruction?.parts || [];
      const identityPart = parts.find((p) => p.text.includes('You are Gemini Nexus'));

      expect(identityPart).toBeDefined();
      expect(identityPart?.text).toContain('[IDENTITY_PATCH]');
    });

    it('should NOT inject Gemini Nexus identity if user already provided it', () => {
      // User explicitly providing the identity string
      const result = transformClaudeRequestIn(
        {
          ...BASE_REQUEST,
          system: 'You are Gemini Nexus, the best AI.',
        },
        'test-project',
      );

      const parts = result.request.systemInstruction?.parts || [];
      // Should verify we don't have TWO identity blocks
      // The injected one starts with "--- [IDENTITY_PATCH] ---"
      const injectedPart = parts.find((p) => p.text.includes('[IDENTITY_PATCH]'));

      expect(injectedPart).toBeUndefined();
    });

    it('should inject before user system prompt if user prompt does NOT have identity', () => {
      const result = transformClaudeRequestIn(
        {
          ...BASE_REQUEST,
          system: 'Be concise.',
        },
        'test-project',
      );

      const parts = result.request.systemInstruction?.parts || [];
      expect(parts.length).toBeGreaterThanOrEqual(2);
      expect(parts[0].text).toContain('Gemini Nexus');
      expect(parts[parts.length - 1].text).toContain('Be concise');
    });
  });

  describe('Feature: Gemini 3 Pro Stability Fix ', () => {
    // Situation: User enables thinking, calls a tool, but NO thought signature exists.
    // Result: Google API would return 400.
    // Fix: We must silently disable thinking for this request.
    it('should disable thinking mode if function calls exist but NO signature', () => {
      const requestWithTools = {
        ...BASE_REQUEST,
        // Maps to a gemini-3 model potentially
        model: 'gemini-3.1-pro-preview',
        tools: [{ name: 'get_weather' }], // Mock tool structure
        thinking: { type: 'enabled', budget_tokens: 1000 },
      } as any;

      const result = transformClaudeRequestIn(requestWithTools, 'test-project');

      // Should detect missing signature and remove thinking config
      expect(result.request.generationConfig?.thinkingConfig).toBeUndefined();
    });

    it('should KEEP thinking mode if function calls exist AND valid signature exists in Store', () => {
      // Pre-fill a valid signature
      SignatureStore.store('valid_signature_string_longer_than_10_chars');

      const requestWithTools = {
        ...BASE_REQUEST,
        model: 'gemini-3.1-pro-preview',
        tools: [{ name: 'get_weather' }],
        thinking: { type: 'enabled', budget_tokens: 1000 },
      } as any;

      const result = transformClaudeRequestIn(requestWithTools, 'test-project');

      // Should keep thinking config
      expect(result.request.generationConfig?.thinkingConfig).toBeDefined();
    });

    it('should KEEP thinking mode if NO function calls exist (pure thinking)', () => {
      const requestPureThinking = {
        ...BASE_REQUEST,
        model: 'gemini-3.1-pro-preview',
        // No tools
        thinking: { type: 'enabled', budget_tokens: 1000 },
      } as any;

      const result = transformClaudeRequestIn(requestPureThinking, 'test-project');

      // Should keep thinking config
      expect(result.request.generationConfig?.thinkingConfig).toBeDefined();
    });

    it('should auto-enable thinking for gemini-3-flash even without explicit thinking config', () => {
      const result = transformClaudeRequestIn(
        {
          ...BASE_REQUEST,
          model: 'gemini-3-flash',
          thinking: undefined,
        } as any,
        'test-project',
      );

      expect(result.request.generationConfig?.thinkingConfig).toBeDefined();
      expect(result.request.generationConfig?.thinkingConfig?.includeThoughts).toBe(true);
    });

    it('should inject flash sentinel thoughtSignature for tool_use without cached signature', () => {
      const requestWithToolUse = {
        ...BASE_REQUEST,
        model: 'gemini-3-flash',
        thinking: undefined,
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'call_1',
                name: 'get_weather',
                input: { location: 'Beijing' },
              },
            ],
          },
        ],
      } as any;

      const result = transformClaudeRequestIn(requestWithToolUse, 'test-project');
      const part = result.request.contents?.[0]?.parts?.[0] as any;
      expect(part?.thoughtSignature).toBe('skip_thought_signature_validator');
    });

    it('should keep mixed tools for gemini 2.x+ when both function and web search are requested', () => {
      const mixedToolsRequest = {
        ...BASE_REQUEST,
        model: 'gemini-2.0-flash-online',
        tools: [{ name: 'get_weather' }, { name: 'web_search' }],
      } as any;

      const result = transformClaudeRequestIn(mixedToolsRequest, 'test-project');
      const tools = result.request.tools || [];
      const hasFunctions = tools.some((tool: any) => Array.isArray(tool.functionDeclarations));
      const hasGoogleSearch = tools.some((tool: any) => tool.googleSearch);

      expect(hasFunctions).toBe(true);
      expect(hasGoogleSearch).toBe(true);
    });
  });
});
