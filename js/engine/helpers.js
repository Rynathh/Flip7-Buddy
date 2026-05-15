/**
 * @module engine/helpers
 * @description Shared helper functions: history logging, player lookup, deck reset, round/player management.
 */

import { gameState } from '../state.js';
import { INITIAL_DECK } from '../constants.js';
import { calculateTurnPoints } from './scoring.js';

/**
 * Adds an entry to the game history log. Keeps a maximum of 50 entries.
 * @param {string} playerName - Name of the player (or "System").
 * @param {string} details - Description of the event.
 * @param {string} type - Event type for styling: 'success', 'fail', 'warning', or 'neutral'.
 */
export function addHistory(playerName, details, type) {
    gameState.history.unshift({ playerName, details, type, time: new Date() });
    if(gameState.history.length > 50) gameState.history.pop();
}

/**
 * Returns the currently active player object from the players array.
 * @returns {Object|undefined} The active player, or undefined if none is set.
 */
export function getActivePlayer() {
    return gameState.players.find(p => p.id === gameState.activePlayerId);
}

/**
 * Resets the deck to its initial card distribution.
 */
export function resetDeck() {
    gameState.deck = { ...INITIAL_DECK };
    addHistory("System", "Deck wurde neu gemischt.", "neutral");
}

/**
 * Starts a new round: banks all remaining hands, resets player flags
 * (frozen, finished, flip3, secondChances), rotates the starting player,
 * and marks the game as started.
 */
export function startNewRound() {
    // 1. Bank all active players
    gameState.players.forEach(p => {
        if (p.currentCards.length > 0 || p.specialCards.length > 0) {
            // Silently bank (without UI update here)
            const points = calculateTurnPoints(p);
            p.score += points;
            p.currentCards = [];
            p.specialCards = [];
        }
    });

    // 2. Reset flags
    gameState.players.forEach(p => {
        p.frozen = false;
        p.hasFinishedRound = false;
        p.flip3Count = 0;
        
        if (p.secondChances > 0) {
            addHistory(p.name, "Second Chance wurde abgeworfen.", "neutral");
        }
        p.secondChances = 0; 
    });

    addHistory("System", "Neue Runde gestartet (Alle entfroren, Second Chances abgeworfen).", "success");
    
    if (gameState.players.length > 0) {
        let starterIndex = gameState.players.findIndex(p => p.id === gameState.roundStarterId);
        if (starterIndex !== -1) {
            starterIndex = (starterIndex + 1) % gameState.players.length;
            gameState.roundStarterId = gameState.players[starterIndex].id;
            gameState.activePlayerId = gameState.roundStarterId;
        } else {
            gameState.roundStarterId = gameState.players[0].id;
            gameState.activePlayerId = gameState.roundStarterId;
        }
    }
    
    gameState.gameEnded = false;
    gameState.gameStarted = true;
}

/**
 * Adds a new player to the game.
 * @param {string} name - Display name of the player.
 * @param {boolean} isBot - Whether this player is controlled by the bot AI.
 * @returns {Object} The newly created player object.
 */
export function addPlayer(name, isBot) {
    const newPlayer = { 
        id: Date.now(), 
        name, 
        isBot,
        score: 0, 
        currentCards: [], 
        specialCards: [],
        secondChances: 0,
        frozen: false,
        hasFinishedRound: false,
        flip3Count: 0
    };
    gameState.players.push(newPlayer);
    if(!gameState.activePlayerId) gameState.activePlayerId = newPlayer.id;
    if(!gameState.roundStarterId) gameState.roundStarterId = newPlayer.id;
    addHistory("System", `Spieler ${name} ${isBot ? '(🤖 Bot)' : ''} ist beigetreten.`, "neutral");
    return newPlayer;
}
