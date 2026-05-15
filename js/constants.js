/**
 * @module constants
 * @description Game constants for Flip7: initial deck composition and card label mappings.
 */

/**
 * Initial deck composition. Keys are card identifiers (numbers 0–12 or special card names),
 * values are the count of that card in a fresh deck. Total: 94 cards.
 * @type {Object.<string, number>}
 */
export const INITIAL_DECK = {
    // Number Cards (count equals the card value, except 0 which has 1)
    0: 1, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 
    7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12,
    // Special Cards
    'x2': 1, 'flip3': 3, 'freeze': 3, 'second_chance': 3,
    '+2': 1, '+4': 1, '+6': 1, '+8': 1, '+10': 1
};

/**
 * Human-readable display labels for special cards.
 * Used in card buttons and history messages.
 * @type {Object.<string, string>}
 */
export const SPECIAL_LABELS = {
    'x2': 'x2', 'flip3': 'Flip 3', 'freeze': 'Freeze', 'second_chance': 'Second Chance',
    '+2': '+2', '+4': '+4', '+6': '+6', '+8': '+8', '+10': '+10'
};
