/**
 * @module engine/turns
 * @description Turn management: advancing players, banking, busting, and card handling.
 */

import { gameState } from '../state.js';
import { addHistory, getActivePlayer } from './helpers.js';
import { calculateTurnPoints } from './scoring.js';

/**
 * Advances the active player to the next eligible (not frozen, not finished) player.
 * Sets activePlayerId to null if no eligible player is found.
 */
export function nextPlayer() {
    if(gameState.players.length === 0) return;
    
    let startIndex = gameState.players.findIndex(p => p.id === gameState.activePlayerId);
    let checks = 0;
    let found = false;
    
    while(checks < gameState.players.length) {
        startIndex = (startIndex + 1) % gameState.players.length;
        if (!gameState.players[startIndex].frozen && !gameState.players[startIndex].hasFinishedRound) {
            gameState.activePlayerId = gameState.players[startIndex].id;
            found = true;
            break;
        }
        checks++;
    }
    
    if (!found) {
        gameState.activePlayerId = null;
    }
}

/**
 * Banks (secures) the current turn for a player, adding their calculated points to their score.
 * Clears their hand and marks them as finished for the round.
 * @param {Object} [playerOverride] - Optional specific player to bank. Uses active player if omitted.
 * @returns {boolean} True if banking was successful, false if no cards to bank.
 */
export function bankTurn(playerOverride) {
    const player = playerOverride || getActivePlayer();
    if(!player) return false;
    
    if (player.currentCards.length === 0 && player.specialCards.length === 0) return false;
    
    const points = calculateTurnPoints(player);
    player.score += points;
    
    let isFlip7 = player.currentCards.length === 7;
    let details = `Sicherte ${points} Punkte.`;
    if(isFlip7) details += " (Flip7 Bonus!)";
    
    addHistory(player.name, details, "success");
    
    player.currentCards = [];
    player.specialCards = [];
    player.flip3Count = 0; 
    player.hasFinishedRound = true;
    
    if (!playerOverride) nextPlayer();
    return true;
}

/**
 * Busts the current turn for a player. They lose all drawn cards and score 0.
 * @param {Object} [playerOverride] - Optional specific player to bust. Uses active player if omitted.
 * @returns {boolean} True if bust was processed, false if no active player.
 */
export function bustTurn(playerOverride) {
    const player = playerOverride || getActivePlayer();
    if(!player) return false;
    
    if(player.currentCards.length > 0) {
        addHistory(player.name, `Zog doppelt. Fehlschlag! 0 Punkte.`, "fail");
    }
    
    player.currentCards = [];
    player.specialCards = [];
    player.flip3Count = 0; 
    player.hasFinishedRound = true;
    
    if (!playerOverride) nextPlayer();
    return true;
}

/**
 * Handles drawing a number card for a player.
 * Checks for duplicates, applies Second Chance if available, and detects Flip7.
 * @param {Object} player - The player drawing the card.
 * @param {number} value - The numeric value of the drawn card (0–12).
 * @returns {{type: string, value: number}} Result object with type: 'continue', 'bust', 'saved', or 'flip7'.
 */
export function handleNumberCard(player, value) {
    const isDuplicate = player.currentCards.includes(value);
    
    if (isDuplicate) {
        if (player.secondChances > 0) {
            player.secondChances--;
            addHistory(player.name, `Zog ${value} (doppelt). Gerettet durch Second Chance! 🛡️`, "success");
            return { type: 'saved', value };
        } else {
            player.currentCards.push(value); 
            return { type: 'bust', value };
        }
    } else {
        player.currentCards.push(value);
        if (player.currentCards.length === 7) {
            return { type: 'flip7', value };
        }
        return { type: 'continue', value };
    }
}
