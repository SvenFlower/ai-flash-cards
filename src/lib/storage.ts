import { supabaseClient } from '../db/supabase.client';
import type { FlashCard, Session } from './types';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string | null> {
    const {
        data: { user },
    } = await supabaseClient.auth.getUser();
    return user?.id || null;
}

// ============================================================================
// FlashCard CRUD Operations
// ============================================================================

export async function saveFlashCard(
    flashCard: Omit<FlashCard, 'id' | 'createdAt'>,
): Promise<FlashCard> {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            throw new Error('Musisz być zalogowany, aby zapisać fiszkę');
        }

        const { data, error } = await supabaseClient
            .from('flash_cards')
            .insert({
                front: flashCard.front,
                back: flashCard.back,
                session_id: flashCard.sessionId || null,
                user_id: userId,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to save flashCard:', error);
            throw new Error(`Failed to save flashCard: ${error.message}`);
        }

        return {
            id: data.id,
            front: data.front,
            back: data.back,
            createdAt: data.created_at,
            sessionId: data.session_id,
        };
    } catch (error) {
        console.error('Failed to save flashCard:', error);
        throw error;
    }
}

export async function getFlashCards(): Promise<FlashCard[]> {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            // Return empty array if not authenticated
            return [];
        }

        const { data, error } = await supabaseClient
            .from('flash_cards')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to retrieve flashCards:', error);
            return [];
        }

        return (
            data?.map((card) => ({
                id: card.id,
                front: card.front,
                back: card.back,
                createdAt: card.created_at,
                sessionId: card.session_id,
            })) || []
        );
    } catch (error) {
        console.error('Failed to retrieve flashCards:', error);
        return [];
    }
}

export async function deleteFlashCard(id: string): Promise<void> {
    try {
        const { error } = await supabaseClient.from('flash_cards').delete().eq('id', id);

        if (error) {
            console.error('Failed to delete flashCard:', error);
            throw new Error(`Failed to delete flashCard: ${error.message}`);
        }
    } catch (error) {
        console.error('Failed to delete flashCard:', error);
        throw error;
    }
}

export async function updateFlashCard(
    id: string,
    updates: Partial<Omit<FlashCard, 'id' | 'createdAt'>>,
): Promise<void> {
    try {
        const updateData: {
            front?: string;
            back?: string;
            session_id?: string | null;
        } = {};

        if (updates.front !== undefined) updateData.front = updates.front;
        if (updates.back !== undefined) updateData.back = updates.back;
        if (updates.sessionId !== undefined) updateData.session_id = updates.sessionId;

        const { error } = await supabaseClient.from('flash_cards').update(updateData).eq('id', id);

        if (error) {
            console.error('Failed to update flashCard:', error);
            throw new Error(`Failed to update flashCard: ${error.message}`);
        }
    } catch (error) {
        console.error('Failed to update flashCard:', error);
        throw error;
    }
}

// ============================================================================
// Session CRUD Operations
// ============================================================================

export async function createSession(name: string): Promise<Session> {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            throw new Error('Musisz być zalogowany, aby utworzyć sesję');
        }

        const { data, error } = await supabaseClient
            .from('sessions')
            .insert({
                name,
                user_id: userId,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to create session:', error);
            throw new Error(`Failed to create session: ${error.message}`);
        }

        return {
            id: data.id,
            name: data.name,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    } catch (error) {
        console.error('Failed to create session:', error);
        throw error;
    }
}

export async function getSessions(): Promise<Session[]> {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            // Return empty array if not authenticated
            return [];
        }

        const { data, error } = await supabaseClient
            .from('sessions')
            .select(
                `
                *,
                flash_cards (count)
            `,
            )
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to retrieve sessions:', error);
            return [];
        }

        return (
            data?.map((session) => ({
                id: session.id,
                name: session.name,
                createdAt: session.created_at,
                updatedAt: session.updated_at,
                flashCardCount: session.flash_cards?.[0]?.count || 0,
            })) || []
        );
    } catch (error) {
        console.error('Failed to retrieve sessions:', error);
        return [];
    }
}

export async function getSessionWithFlashCards(sessionId: string): Promise<{
    session: Session;
    flashCards: FlashCard[];
} | null> {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            return null;
        }

        // Get session (will be filtered by RLS to current user)
        const { data: sessionData, error: sessionError } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        if (sessionError) {
            console.error('Failed to retrieve session:', sessionError);
            return null;
        }

        // Get flash cards for this session (will be filtered by RLS to current user)
        const { data: flashCardsData, error: flashCardsError } = await supabaseClient
            .from('flash_cards')
            .select('*')
            .eq('session_id', sessionId)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (flashCardsError) {
            console.error('Failed to retrieve session flash cards:', flashCardsError);
            return null;
        }

        return {
            session: {
                id: sessionData.id,
                name: sessionData.name,
                createdAt: sessionData.created_at,
                updatedAt: sessionData.updated_at,
                flashCardCount: flashCardsData?.length || 0,
            },
            flashCards:
                flashCardsData?.map((card) => ({
                    id: card.id,
                    front: card.front,
                    back: card.back,
                    createdAt: card.created_at,
                    sessionId: card.session_id,
                })) || [],
        };
    } catch (error) {
        console.error('Failed to retrieve session with flash cards:', error);
        return null;
    }
}

export async function renameSession(id: string, newName: string): Promise<void> {
    try {
        const { error } = await supabaseClient.from('sessions').update({ name: newName }).eq('id', id);

        if (error) {
            console.error('Failed to rename session:', error);
            throw new Error(`Failed to rename session: ${error.message}`);
        }
    } catch (error) {
        console.error('Failed to rename session:', error);
        throw error;
    }
}

export async function deleteSession(id: string): Promise<void> {
    try {
        // Cascade delete will handle flash cards
        const { error } = await supabaseClient.from('sessions').delete().eq('id', id);

        if (error) {
            console.error('Failed to delete session:', error);
            throw new Error(`Failed to delete session: ${error.message}`);
        }
    } catch (error) {
        console.error('Failed to delete session:', error);
        throw error;
    }
}

export async function saveFlashCardsToSession(
    flashCards: Omit<FlashCard, 'id' | 'createdAt' | 'sessionId'>[],
    sessionName: string,
): Promise<Session> {
    try {
        // Create session first
        const session = await createSession(sessionName);

        const userId = await getCurrentUserId();

        if (!userId) {
            throw new Error('Musisz być zalogowany, aby zapisać fiszki do sesji');
        }

        // Save all flash cards with session_id and user_id
        const flashCardsToInsert = flashCards.map((fc) => ({
            front: fc.front,
            back: fc.back,
            session_id: session.id,
            user_id: userId,
        }));

        const { error } = await supabaseClient.from('flash_cards').insert(flashCardsToInsert);

        if (error) {
            console.error('Failed to save flash cards to session:', error);
            // Clean up session if flash cards fail to save
            await deleteSession(session.id);
            throw new Error(`Failed to save flash cards to session: ${error.message}`);
        }

        return session;
    } catch (error) {
        console.error('Failed to save flash cards to session:', error);
        throw error;
    }
}
