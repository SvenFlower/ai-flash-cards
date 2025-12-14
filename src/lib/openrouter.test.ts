import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateFlashCards } from './openrouter';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('OpenRouter API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateFlashCards - Success Cases', () => {
    it('should successfully generate flashcards from AI response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashCards: [
                  { front: 'What is TypeScript?', back: 'A typed superset of JavaScript' },
                  { front: 'What is React?', back: 'A JavaScript library for building UIs' },
                ],
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateFlashCards('Sample text about programming');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        front: 'What is TypeScript?',
        back: 'A typed superset of JavaScript',
      });
      expect(result[1]).toEqual({
        front: 'What is React?',
        back: 'A JavaScript library for building UIs',
      });
    });

    it('should filter out flashcards without front or back', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashCards: [
                  { front: 'Valid question', back: 'Valid answer' },
                  { front: 'Missing back' }, // Invalid
                  { back: 'Missing front' }, // Invalid
                  { front: '', back: 'Empty front' }, // Invalid
                  { front: 'Valid 2', back: 'Valid answer 2' },
                ],
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateFlashCards('Sample text');

      expect(result).toHaveLength(2);
      expect(result[0].front).toBe('Valid question');
      expect(result[1].front).toBe('Valid 2');
    });

    it('should make correct API call with proper configuration', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashCards: [{ front: 'Q', back: 'A' }],
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await generateFlashCards('Test input');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toContain('Bearer ');
      expect(options.headers['X-Title']).toBe('10x-cards-poc');
    });

    it('should include user text in the prompt', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashCards: [{ front: 'Q', back: 'A' }],
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const userText = 'Important learning material';
      await generateFlashCards(userText);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.messages[0].content).toContain(userText);
      expect(body.model).toBe('openai/gpt-4o-mini');
      expect(body.temperature).toBe(0.7);
    });
  });

  describe('generateFlashCards - Error Cases', () => {
    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: 'Invalid API key' },
        }),
      });

      await expect(generateFlashCards('test')).rejects.toThrow(
        'API error: 401 - Invalid API key'
      );
    });

    it('should handle API error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(generateFlashCards('test')).rejects.toThrow(
        'API error: 500 - Unknown error'
      );
    });

    it('should handle malformed JSON in API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(generateFlashCards('test')).rejects.toThrow('API error: 500 - Unknown error');
    });

    it('should handle missing content in API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {},
            },
          ],
        }),
      });

      await expect(generateFlashCards('test')).rejects.toThrow(
        'Invalid response format from API'
      );
    });

    it('should handle invalid JSON in AI response content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'This is not valid JSON',
              },
            },
          ],
        }),
      });

      await expect(generateFlashCards('test')).rejects.toThrow();
    });

    it('should handle missing flashCards array in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ data: 'something else' }),
              },
            },
          ],
        }),
      });

      await expect(generateFlashCards('test')).rejects.toThrow(
        'Invalid flashCards format in response'
      );
    });

    it('should handle non-array flashCards in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ flashCards: 'not an array' }),
              },
            },
          ],
        }),
      });

      await expect(generateFlashCards('test')).rejects.toThrow(
        'Invalid flashCards format in response'
      );
    });

    it('should handle network timeout', async () => {
      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const abortError = new Error('Request aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          }, 100);
        });
      });

      await expect(generateFlashCards('test')).rejects.toThrow(
        'Request timeout: AI service took too long to respond'
      );
    }, 10000);

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      await expect(generateFlashCards('test')).rejects.toThrow('Network connection failed');
    });

    it('should return empty array when AI returns empty flashCards array', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashCards: [],
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateFlashCards('test');
      expect(result).toEqual([]);
    });
  });

  describe('generateFlashCards - Edge Cases', () => {
    it('should handle very long input text', async () => {
      const longText = 'a'.repeat(10000);
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashCards: [{ front: 'Q', back: 'A' }],
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateFlashCards(longText);
      expect(result).toHaveLength(1);
    });

    it('should handle special characters in input', async () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashCards: [{ front: 'Q', back: 'A' }],
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await generateFlashCards(specialText);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle unicode characters in input', async () => {
      const unicodeText = '你好世界 🎉 Привет مرحبا';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashCards: [{ front: 'Q', back: 'A' }],
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await generateFlashCards(unicodeText);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: { message: 'Rate limit exceeded' },
        }),
      });

      await expect(generateFlashCards('test')).rejects.toThrow(
        'API error: 429 - Rate limit exceeded'
      );
    });
  });
});
