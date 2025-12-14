export interface FlashCard {
    id: string;
    front: string;
    back: string;
    createdAt: string;
}

export interface GeneratedFlashCard {
    front: string;
    back: string;
}

export interface FlashCardWithStatus extends GeneratedFlashCard {
    id: string;
    status: 'pending' | 'accepted' | 'rejected';
}
