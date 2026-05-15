/**
 * @module state
 * @description Central game state management with localStorage persistence.
 */

import { INITIAL_DECK } from './constants.js';

/**
 * The global game state object. All game data lives here and is mutated in-place.
 * @type {{
 *   deck: Object.<string, number>,
 *   players: Array.<Object>,
 *   activePlayerId: number|null,
 *   roundStarterId: number|null,
 *   history: Array.<Object>,
 *   gameEnded: boolean,
 *   gameStarted: boolean
 * }}
 */
export const gameState = {
    deck: { ...INITIAL_DECK },
    players: [],
    activePlayerId: null,
    roundStarterId: null,
    history: [],
    gameEnded: false,
    gameStarted: false
};

/**
 * Persists the current game state to localStorage as JSON.
 */
export function saveState() {
    const state = {
        deck: gameState.deck,
        players: gameState.players,
        activePlayerId: gameState.activePlayerId,
        roundStarterId: gameState.roundStarterId,
        history: gameState.history,
        gameStarted: gameState.gameStarted
    };
    localStorage.setItem('flip7_buddy_state', JSON.stringify(state));
}

/**
 * Loads game state from localStorage. Applies defaults for any missing player fields
 * to ensure backward compatibility with older save formats.
 * @returns {boolean} True if state was successfully loaded, false otherwise.
 */
export function loadState() {
    const saved = localStorage.getItem('flip7_buddy_state');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            gameState.deck = state.deck || { ...INITIAL_DECK };
            gameState.players = state.players || [];
            gameState.players.forEach(p => {
                p.hasFinishedRound = p.hasFinishedRound || false;
                p.secondChances = p.secondChances || 0;
                p.frozen = p.frozen || false;
                p.flip3Count = p.flip3Count || 0;
            });
            gameState.activePlayerId = state.activePlayerId || null;
            gameState.roundStarterId = state.roundStarterId || null;
            gameState.history = state.history || [];
            gameState.history.forEach(h => h.time = new Date(h.time));
            gameState.gameStarted = state.gameStarted || false;
            return true;
        } catch (e) {
            console.error("Could not load state", e);
        }
    }
    return false;
}

/**
 * Clears the saved state from localStorage and reloads the page.
 */
export function clearState() {
    localStorage.removeItem('flip7_buddy_state');
    location.reload();
}
