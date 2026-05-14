import { INITIAL_DECK } from './constants.js';

export const gameState = {
    deck: { ...INITIAL_DECK },
    players: [],
    activePlayerId: null,
    roundStarterId: null,
    history: [],
    gameEnded: false
};

export function saveState() {
    const state = {
        deck: gameState.deck,
        players: gameState.players,
        activePlayerId: gameState.activePlayerId,
        roundStarterId: gameState.roundStarterId,
        history: gameState.history
    };
    localStorage.setItem('flip7_buddy_state', JSON.stringify(state));
}

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
            return true;
        } catch (e) {
            console.error("Could not load state", e);
        }
    }
    return false;
}

export function clearState() {
    localStorage.removeItem('flip7_buddy_state');
    location.reload();
}
