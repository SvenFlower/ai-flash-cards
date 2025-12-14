import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    saveFlashCard,
    getFlashCards,
    deleteFlashCard,
    updateFlashCard,
    createSession,
    getSessions,
    getSessionWithFlashCards,
    saveFlashCardsToSession,
} from './storage';
import { supabaseClient } from '../db/supabase.client';

// Mock Supabase client
vi.mock('../db/supabase.client', () => ({
    supabaseClient: {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(),
    },
}));

describe('Storage utilities', () => {
    const mockUserId = 'user-123';
    const mockUser = { id: mockUserId, email: 'test@example.com' };

    beforeEach(() => {
        vi.clearAllMocks();
        // Default: user is authenticated
        vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
    });

    describe('saveFlashCard', () => {
        it('should save a flashcard when user is authenticated', async () => {
            const mockFlashCard = {
                id: 'fc-123',
                front: 'Question',
                back: 'Answer',
                created_at: '2024-01-01',
                session_id: null,
                user_id: mockUserId,
            };

            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: mockFlashCard,
                        error: null,
                    }),
                }),
            });

            vi.mocked(supabaseClient.from).mockReturnValue({
                insert: insertMock,
            } as any);

            const result = await saveFlashCard({ front: 'Question', back: 'Answer' });

            expect(result).toEqual({
                id: 'fc-123',
                front: 'Question',
                back: 'Answer',
                createdAt: '2024-01-01',
                sessionId: null,
            });
            expect(insertMock).toHaveBeenCalledWith({
                front: 'Question',
                back: 'Answer',
                session_id: undefined,
                user_id: mockUserId,
            });
        });

        it('should throw error when user is not authenticated', async () => {
            vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
                data: { user: null },
                error: null,
            });

            await expect(
                saveFlashCard({ front: 'Question', back: 'Answer' }),
            ).rejects.toThrow('Musisz być zalogowany, aby zapisać fiszkę');
        });
    });

    describe('getFlashCards', () => {
        it('should return flashcards for authenticated user', async () => {
            const mockFlashCards = [
                {
                    id: 'fc-1',
                    front: 'Q1',
                    back: 'A1',
                    created_at: '2024-01-01',
                    session_id: null,
                    user_id: mockUserId,
                },
            ];

            const orderMock = vi.fn().mockResolvedValue({
                data: mockFlashCards,
                error: null,
            });

            const eqMock = vi.fn().mockReturnValue({ order: orderMock });
            const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

            vi.mocked(supabaseClient.from).mockReturnValue({
                select: selectMock,
            } as any);

            const result = await getFlashCards();

            expect(result).toHaveLength(1);
            expect(result[0].front).toBe('Q1');
            expect(eqMock).toHaveBeenCalledWith('user_id', mockUserId);
        });

        it('should return empty array when user is not authenticated', async () => {
            vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
                data: { user: null },
                error: null,
            });

            const result = await getFlashCards();

            expect(result).toEqual([]);
        });
    });

    describe('deleteFlashCard', () => {
        it('should delete a flashcard', async () => {
            const eqMock = vi.fn().mockResolvedValue({
                error: null,
            });

            const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });

            vi.mocked(supabaseClient.from).mockReturnValue({
                delete: deleteMock,
            } as any);

            await deleteFlashCard('fc-123');

            expect(deleteMock).toHaveBeenCalled();
            expect(eqMock).toHaveBeenCalledWith('id', 'fc-123');
        });
    });

    describe('updateFlashCard', () => {
        it('should update a flashcard', async () => {
            const eqMock = vi.fn().mockResolvedValue({
                error: null,
            });

            const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

            vi.mocked(supabaseClient.from).mockReturnValue({
                update: updateMock,
            } as any);

            await updateFlashCard('fc-123', { front: 'Updated Question' });

            expect(updateMock).toHaveBeenCalledWith({ front: 'Updated Question' });
            expect(eqMock).toHaveBeenCalledWith('id', 'fc-123');
        });
    });

    describe('createSession', () => {
        it('should create a session when user is authenticated', async () => {
            const mockSession = {
                id: 'session-123',
                name: 'Test Session',
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
                user_id: mockUserId,
            };

            const singleMock = vi.fn().mockResolvedValue({
                data: mockSession,
                error: null,
            });

            const selectMock = vi.fn().mockReturnValue({ single: singleMock });
            const insertMock = vi.fn().mockReturnValue({ select: selectMock });

            vi.mocked(supabaseClient.from).mockReturnValue({
                insert: insertMock,
            } as any);

            const result = await createSession('Test Session');

            expect(result).toEqual({
                id: 'session-123',
                name: 'Test Session',
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            });
            expect(insertMock).toHaveBeenCalledWith({
                name: 'Test Session',
                user_id: mockUserId,
            });
        });

        it('should throw error when user is not authenticated', async () => {
            vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
                data: { user: null },
                error: null,
            });

            await expect(createSession('Test Session')).rejects.toThrow(
                'Musisz być zalogowany, aby utworzyć sesję',
            );
        });
    });

    describe('getSessions', () => {
        it('should return sessions for authenticated user', async () => {
            const mockSessions = [
                {
                    id: 'session-1',
                    name: 'Session 1',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                    user_id: mockUserId,
                    flash_cards: [{ count: 5 }],
                },
            ];

            const orderMock = vi.fn().mockResolvedValue({
                data: mockSessions,
                error: null,
            });

            const eqMock = vi.fn().mockReturnValue({ order: orderMock });
            const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

            vi.mocked(supabaseClient.from).mockReturnValue({
                select: selectMock,
            } as any);

            const result = await getSessions();

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Session 1');
            expect(result[0].flashCardCount).toBe(5);
        });

        it('should return empty array when user is not authenticated', async () => {
            vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
                data: { user: null },
                error: null,
            });

            const result = await getSessions();

            expect(result).toEqual([]);
        });
    });

    describe('saveFlashCardsToSession', () => {
        it('should save multiple flashcards to a session', async () => {
            const mockSession = {
                id: 'session-123',
                name: 'Test Session',
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
                user_id: mockUserId,
            };

            // Mock createSession
            const singleMock = vi.fn().mockResolvedValue({
                data: mockSession,
                error: null,
            });

            const selectMock = vi.fn().mockReturnValue({ single: singleMock });
            const insertMock = vi.fn().mockResolvedValue({ error: null });

            vi.mocked(supabaseClient.from).mockReturnValue({
                insert: insertMock,
                select: selectMock,
            } as any);

            const flashCards = [
                { front: 'Q1', back: 'A1' },
                { front: 'Q2', back: 'A2' },
            ];

            const result = await saveFlashCardsToSession(flashCards, 'Test Session');

            expect(result.id).toBe('session-123');
            expect(insertMock).toHaveBeenCalled();
        });
    });
});
