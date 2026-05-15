/**
 * @module engine
 * @description Barrel file — re-exports all engine sub-modules for backward compatibility.
 */

export { getTotalCardsInDeck, calculateTurnPoints } from './engine/scoring.js';
export { nextPlayer, bankTurn, bustTurn, handleNumberCard } from './engine/turns.js';
export { addHistory, getActivePlayer, resetDeck, startNewRound, addPlayer } from './engine/helpers.js';
export { executeBotAction } from './engine/bot.js';
