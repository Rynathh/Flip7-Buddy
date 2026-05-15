/**
 * @module engine/scoring
 * @description Point calculation and scoring logic for Flip7.
 */

import { gameState } from '../state.js';

/**
 * Calculates the total number of cards remaining in the deck.
 * @returns {number} Total card count across all card types.
 */
export function getTotalCardsInDeck() {
    return Object.values(gameState.deck).reduce((a, b) => a + b, 0);
}

/**
 * Calculates the current turn points for a player based on their drawn cards.
 * Includes number card sums, plus-card bonuses, Flip7 bonus (+15),
 * and x2 multipliers.
 * @param {Object} player - The player object to calculate points for.
 * @returns {number} Total points for the current turn.
 */
export function calculateTurnPoints(player) {
    if (!player.currentCards.length && !player.specialCards.length) return 0;
    
    let sum = player.currentCards.reduce((a, b) => a + b, 0);
    
    // Add Plus Cards
    player.specialCards.forEach(c => {
        if(c.startsWith('+')) sum += parseInt(c.replace('+', ''));
    });
    
    // Add Flip7 Bonus (only if 7 different numbers)
    if (player.currentCards.length === 7 && (new Set(player.currentCards).size === 7)) {
        sum += 15;
    }
    
    // Add Multiplier
    const multipliers = player.specialCards.filter(c => c === 'x2').length;
    if (multipliers > 0) {
        sum *= Math.pow(2, multipliers);
    }
    
    return sum;
}
