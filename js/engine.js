import { gameState, saveState } from './state.js';
import { INITIAL_DECK, SPECIAL_LABELS } from './constants.js';

// --- Helper Functions ---

export function getTotalCardsInDeck() {
    return Object.values(gameState.deck).reduce((a, b) => a + b, 0);
}

export function addHistory(playerName, details, type) {
    gameState.history.unshift({ playerName, details, type, time: new Date() });
    if(gameState.history.length > 50) gameState.history.pop();
}

export function getActivePlayer() {
    return gameState.players.find(p => p.id === gameState.activePlayerId);
}

// --- Core Game Logic ---

export function resetDeck() {
    gameState.deck = { ...INITIAL_DECK };
    addHistory("System", "Deck wurde neu gemischt.", "neutral");
}

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

// Bot AI Logic
export function executeBotAction(bot, drawCallback) {
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
