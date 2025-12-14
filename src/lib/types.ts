export interface FlashCard {
    id: string;
    front: string;
    back: string;
    createdAt: string;
    sessionId?: string | null;
}

export interface GeneratedFlashCard {
    front: string;
    back: string;
}

export interface FlashCardWithStatus extends GeneratedFlashCard {
    id: string;
    status: 'pending' | 'accepted' | 'rejected';
}

export interface Session {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    flashCardCount?: number;
}

export interface SessionWithFlashCards extends Session {
    flashCards: FlashCard[];
}
