import type { FlashCard } from './types';

const STORAGE_KEY = 'flashCards_poc';

// Check if localStorage is available (client-side only)
const isLocalStorageAvailable = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export function saveFlashCard(flashCard: Omit<FlashCard, 'id' | 'createdAt'>): FlashCard {
    const newFlashCard: FlashCard = {
        id: Math.random().toString(36).substring(7),
        front: flashCard.front,
        back: flashCard.back,
        createdAt: new Date().toISOString(),
    };

    if (!isLocalStorageAvailable) {
        throw new Error('localStorage is not available');
    }

    try {
        const existing = getFlashCards();
        const updated = [...existing, newFlashCard];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newFlashCard;
    } catch (error) {
        console.error('Failed to save flashCard:', error);
        throw new Error('Storage limit exceeded or unavailable');
    }
}

export function getFlashCards(): FlashCard[] {
    if (!isLocalStorageAvailable) {
        return [];
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to retrieve flashCards:', error);
        return [];
    }
}

export function deleteFlashCard(id: string): void {
    if (!isLocalStorageAvailable) {
        throw new Error('localStorage is not available');
    }

    try {
        const existing = getFlashCards();
        const updated = existing.filter((fc) => fc.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to delete flashCard:', error);
        throw error;
    }
}

export function updateFlashCard(id: string, updates: Partial<Omit<FlashCard, 'id' | 'createdAt'>>): void {
    if (!isLocalStorageAvailable) {
        throw new Error('localStorage is not available');
    }

    try {
        const existing = getFlashCards();
        const updated = existing.map((fc) => (fc.id === id ? { ...fc, ...updates } : fc));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to update flashCard:', error);
        throw error;
    }
}
