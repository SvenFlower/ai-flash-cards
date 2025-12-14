import { describe, it, expect } from 'vitest';
import type { FlashCard, GeneratedFlashCard, FlashCardWithStatus } from './types';

describe('Types', () => {
  describe('FlashCard', () => {
    it('should have all required properties', () => {
      const flashCard: FlashCard = {
        id: 'test-id',
        front: 'Question',
        back: 'Answer',
        createdAt: new Date().toISOString(),
      };

      expect(flashCard).toHaveProperty('id');
      expect(flashCard).toHaveProperty('front');
      expect(flashCard).toHaveProperty('back');
      expect(flashCard).toHaveProperty('createdAt');
      expect(typeof flashCard.id).toBe('string');
      expect(typeof flashCard.front).toBe('string');
      expect(typeof flashCard.back).toBe('string');
      expect(typeof flashCard.createdAt).toBe('string');
    });

    it('should validate ISO date string for createdAt', () => {
      const flashCard: FlashCard = {
        id: 'test-id',
        front: 'Question',
        back: 'Answer',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      expect(new Date(flashCard.createdAt).toISOString()).toBe(flashCard.createdAt);
    });
  });

  describe('GeneratedFlashCard', () => {
    it('should have front and back properties', () => {
      const generatedCard: GeneratedFlashCard = {
        front: 'What is TypeScript?',
        back: 'A typed superset of JavaScript',
      };

      expect(generatedCard).toHaveProperty('front');
      expect(generatedCard).toHaveProperty('back');
      expect(typeof generatedCard.front).toBe('string');
      expect(typeof generatedCard.back).toBe('string');
    });
  });

  describe('FlashCardWithStatus', () => {
    it('should have all properties including status', () => {
      const cardWithStatus: FlashCardWithStatus = {
        id: 'test-id',
        front: 'Question',
        back: 'Answer',
        status: 'pending',
      };

      expect(cardWithStatus).toHaveProperty('id');
      expect(cardWithStatus).toHaveProperty('front');
      expect(cardWithStatus).toHaveProperty('back');
      expect(cardWithStatus).toHaveProperty('status');
      expect(['pending', 'accepted', 'rejected']).toContain(cardWithStatus.status);
    });

    it('should allow all valid status values', () => {
      const statuses: Array<FlashCardWithStatus['status']> = [
        'pending',
        'accepted',
        'rejected',
      ];

      statuses.forEach((status) => {
        const card: FlashCardWithStatus = {
          id: 'test',
          front: 'Q',
          back: 'A',
          status,
        };
        expect(card.status).toBe(status);
      });
    });
  });
});
