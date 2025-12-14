import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveFlashCard,
  getFlashCards,
  deleteFlashCard,
  updateFlashCard,
} from './storage';
import type { FlashCard } from './types';

describe('Storage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('saveFlashCard', () => {
    it('should save a new flashcard to localStorage', () => {
      const card = { front: 'Question', back: 'Answer' };
      const savedCard = saveFlashCard(card);

      expect(savedCard).toHaveProperty('id');
      expect(savedCard).toHaveProperty('createdAt');
      expect(savedCard.front).toBe('Question');
      expect(savedCard.back).toBe('Answer');
      expect(typeof savedCard.id).toBe('string');
      expect(savedCard.id.length).toBeGreaterThan(0);
    });

    it('should save multiple flashcards', () => {
      const card1 = saveFlashCard({ front: 'Q1', back: 'A1' });
      const card2 = saveFlashCard({ front: 'Q2', back: 'A2' });

      const cards = getFlashCards();
      expect(cards).toHaveLength(2);
      expect(cards[0].id).toBe(card1.id);
      expect(cards[1].id).toBe(card2.id);
    });

    it('should generate unique IDs for each flashcard', () => {
      const card1 = saveFlashCard({ front: 'Q1', back: 'A1' });
      const card2 = saveFlashCard({ front: 'Q2', back: 'A2' });

      expect(card1.id).not.toBe(card2.id);
    });

    it('should set createdAt timestamp', () => {
      const before = new Date();
      const card = saveFlashCard({ front: 'Q', back: 'A' });
      const after = new Date();

      const createdAt = new Date(card.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getFlashCards', () => {
    it('should return empty array when no flashcards exist', () => {
      const cards = getFlashCards();
      expect(cards).toEqual([]);
    });

    it('should return all saved flashcards', () => {
      saveFlashCard({ front: 'Q1', back: 'A1' });
      saveFlashCard({ front: 'Q2', back: 'A2' });

      const cards = getFlashCards();
      expect(cards).toHaveLength(2);
      expect(cards[0].front).toBe('Q1');
      expect(cards[1].front).toBe('Q2');
    });

    it('should return empty array when localStorage has invalid JSON', () => {
      localStorage.setItem('flashCards_poc', 'invalid json');
      const cards = getFlashCards();
      expect(cards).toEqual([]);
    });
  });

  describe('deleteFlashCard', () => {
    it('should delete a flashcard by id', () => {
      const card1 = saveFlashCard({ front: 'Q1', back: 'A1' });
      const card2 = saveFlashCard({ front: 'Q2', back: 'A2' });

      deleteFlashCard(card1.id);

      const cards = getFlashCards();
      expect(cards).toHaveLength(1);
      expect(cards[0].id).toBe(card2.id);
    });

    it('should not throw error when deleting non-existent flashcard', () => {
      saveFlashCard({ front: 'Q1', back: 'A1' });

      expect(() => deleteFlashCard('non-existent-id')).not.toThrow();

      const cards = getFlashCards();
      expect(cards).toHaveLength(1);
    });

    it('should delete all matching flashcards', () => {
      const card = saveFlashCard({ front: 'Q1', back: 'A1' });
      saveFlashCard({ front: 'Q2', back: 'A2' });
      saveFlashCard({ front: 'Q3', back: 'A3' });

      deleteFlashCard(card.id);

      const cards = getFlashCards();
      expect(cards).toHaveLength(2);
      expect(cards.find((c) => c.id === card.id)).toBeUndefined();
    });
  });

  describe('updateFlashCard', () => {
    it('should update flashcard front text', () => {
      const card = saveFlashCard({ front: 'Original', back: 'Answer' });

      updateFlashCard(card.id, { front: 'Updated' });

      const cards = getFlashCards();
      expect(cards[0].front).toBe('Updated');
      expect(cards[0].back).toBe('Answer');
      expect(cards[0].id).toBe(card.id);
    });

    it('should update flashcard back text', () => {
      const card = saveFlashCard({ front: 'Question', back: 'Original' });

      updateFlashCard(card.id, { back: 'Updated' });

      const cards = getFlashCards();
      expect(cards[0].back).toBe('Updated');
      expect(cards[0].front).toBe('Question');
    });

    it('should update both front and back', () => {
      const card = saveFlashCard({ front: 'Q', back: 'A' });

      updateFlashCard(card.id, { front: 'New Q', back: 'New A' });

      const cards = getFlashCards();
      expect(cards[0].front).toBe('New Q');
      expect(cards[0].back).toBe('New A');
    });

    it('should not update id or createdAt', () => {
      const card = saveFlashCard({ front: 'Q', back: 'A' });
      const originalId = card.id;
      const originalCreatedAt = card.createdAt;

      updateFlashCard(card.id, { front: 'Updated' });

      const cards = getFlashCards();
      expect(cards[0].id).toBe(originalId);
      expect(cards[0].createdAt).toBe(originalCreatedAt);
    });

    it('should only update the specified flashcard', () => {
      const card1 = saveFlashCard({ front: 'Q1', back: 'A1' });
      const card2 = saveFlashCard({ front: 'Q2', back: 'A2' });

      updateFlashCard(card1.id, { front: 'Updated' });

      const cards = getFlashCards();
      expect(cards[0].front).toBe('Updated');
      expect(cards[1].front).toBe('Q2');
    });

    it('should not throw error when updating non-existent flashcard', () => {
      saveFlashCard({ front: 'Q1', back: 'A1' });

      expect(() =>
        updateFlashCard('non-existent-id', { front: 'Updated' })
      ).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      const card = saveFlashCard({ front: '', back: '' });
      expect(card.front).toBe('');
      expect(card.back).toBe('');
    });

    it('should handle long strings', () => {
      const longString = 'a'.repeat(10000);
      const card = saveFlashCard({ front: longString, back: longString });
      expect(card.front).toBe(longString);
      expect(card.back).toBe(longString);
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\';
      const card = saveFlashCard({ front: specialChars, back: specialChars });
      expect(card.front).toBe(specialChars);
      expect(card.back).toBe(specialChars);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界 🎉 Привет مرحبا';
      const card = saveFlashCard({ front: unicode, back: unicode });
      expect(card.front).toBe(unicode);
      expect(card.back).toBe(unicode);
    });
  });
});
