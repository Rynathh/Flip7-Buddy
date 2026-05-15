/**
 * @module engine/bot
 * @description Bot AI decision logic for automated players.
 */

import { gameState } from '../state.js';
import { getTotalCardsInDeck } from './scoring.js';
import { bankTurn } from './turns.js';

/**
 * Executes the bot's decision for the current turn.
 * The bot evaluates bust probability against thresholds that vary based on
 * whether it has a Second Chance shield and how many cards it has drawn.
 * 
 * Decision rules:
 * - Without shield: banks if bust prob > 25%, or > 15% with 5+ cards
 * - With shield: more aggressive, banks only if bust prob > 45%
 * - At 6 cards: always draws (going for Flip7) unless bust prob is very high
 * - During Flip3 forced draws: always draws
 * 
 * @param {Object} bot - The bot player object.
 * @returns {{action: string}} Result with action: 'bank' or 'draw'.
 */
export function executeBotAction(bot) {
    const drawnSet = new Set(bot.currentCards);
    let bustCardsRemaining = 0;
    drawnSet.forEach(val => { bustCardsRemaining += gameState.deck[val]; });
    const totalCards = getTotalCardsInDeck();
    let bustProb = drawnSet.size > 0 ? (bustCardsRemaining / totalCards) * 100 : 0;
    
    let shouldBank = false;
    
    if (bot.secondChances === 0) {
        if (bustProb > 25) shouldBank = true;
        if (bot.currentCards.length >= 5 && bustProb > 15) shouldBank = true;
        if (bot.currentCards.length === 6 && bustProb < 30) shouldBank = false; 
    } else {
        if (bustProb > 45) shouldBank = true; 
        if (bot.currentCards.length === 6) shouldBank = false;
    }
    
    if (bot.flip3Count > 0) {
        shouldBank = false;
    }

    if (shouldBank && (bot.currentCards.length > 0 || bot.specialCards.length > 0)) {
        bankTurn(bot);
        return { action: 'bank' };
    } else {
        return { action: 'draw' };
    }
}
