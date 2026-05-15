import { gameState } from '../state.js';
import { SPECIAL_LABELS } from '../constants.js';
import * as Engine from '../engine.js';
import { showAlert, openModal } from './modals.js';
import { updateUI } from './render.js';

export function handleBotTurn(activePlayer) {
    if (activePlayer && activePlayer.isBot && !activePlayer.frozen && !activePlayer.hasFinishedRound) {
        if (!window.botActing) {
            window.botActing = true;
            setTimeout(() => {
                window.botActing = false;
                if (gameState.activePlayerId === activePlayer.id && !activePlayer.frozen && !activePlayer.hasFinishedRound) {
                    const result = Engine.executeBotAction(activePlayer);
                    if (result.action === 'draw') {
                        virtualDrawCard(activePlayer);
                    } else {
                        updateUI();
                    }
                }
            }, 1200);
        }
    } else {
        window.botActing = false;
    }
}

export function selectPlayer(id) {
    const p = gameState.players.find(p => p.id === id);
    if (p.frozen) return showAlert("Dieser Spieler ist eingefroren!");
    if (p.hasFinishedRound) return showAlert("Dieser Spieler hat die Runde bereits beendet!");
    gameState.activePlayerId = id;
    updateUI();
}

export function virtualDrawCard(playerOverride) {
    const player = playerOverride || Engine.getActivePlayer();
    if (!player) return showAlert("Bitte wähle zuerst einen Spieler aus.");
    
    const totalCards = Engine.getTotalCardsInDeck();
    if (totalCards === 0) {
        Engine.resetDeck();
    }
    
    const currentTotal = Engine.getTotalCardsInDeck();
    let rand = Math.random() * currentTotal;
    let sum = 0;
    let drawnKey = null;
    
    for (let key in gameState.deck) {
        sum += gameState.deck[key];
        if (rand <= sum && gameState.deck[key] > 0) {
            drawnKey = key;
            break;
        }
    }
    
    if (drawnKey !== null) {
        const isSpecial = isNaN(parseInt(drawnKey));
        // The calling function should handle the drawing logic
        drawCard(drawnKey, isSpecial);
    }
}

export function drawCard(key, isSpecial) {
    if(!gameState.activePlayerId) return showAlert("Bitte wähle zuerst einen Spieler aus.");
    
    const player = Engine.getActivePlayer();
    if(player.frozen || player.hasFinishedRound) return showAlert("Dieser Spieler ist für diese Runde ausgeschieden!");
    
    if(gameState.deck[key] > 0) {
        gameState.deck[key]--;
        
        if (isSpecial) {
            handleSpecialCard(player, key);
        } else {
            const result = Engine.handleNumberCard(player, parseInt(key));
            if (result.type === 'bust') {
                updateUI();
                setTimeout(() => {
                    showAlert(`Doppelte Karte gezogen (${result.value})! Fehlschlag für ${player.name}!`, "Fehlschlag!", () => {
                        Engine.bustTurn();
                        updateUI();
                    });
                }, 300);
            } else if (result.type === 'flip7') {
                updateUI();
                setTimeout(() => {
                    showAlert(`Flip7 für ${player.name}! 7 Karten ohne doppelte! +15 Bonuspunkte.`, "Flip7!", () => {
                        Engine.bankTurn();
                        updateUI();
                    });
                }, 300);
            } else if (result.type === 'saved') {
                updateUI();
                setTimeout(() => {
                    showAlert("Second Chance eingelöst! Die doppelte Karte wurde abgeworfen.", "Glück gehabt!", () => {
                        finishDrawTurn(player);
                    });
                }, 100);
            } else {
                finishDrawTurn(player);
            }
        }
    }
}

function finishDrawTurn(player) {
    if (player.flip3Count > 0) {
        player.flip3Count--;
        if (player.flip3Count > 0) {
            updateUI();
            return;
        }
    }
    Engine.nextPlayer();
    updateUI();
}

function handleSpecialCard(player, type) {
    updateUI(); // reflect deck count
    
    if (type === 'second_chance') {
        if (player.secondChances >= 1) {
            const availableTargets = gameState.players.filter(p => 
                p.id !== player.id && !p.frozen && !p.hasFinishedRound && p.secondChances === 0
            );
            
            if (availableTargets.length === 0) {
                Engine.addHistory(player.name, `Zog Second Chance, hat aber schon eine. Keine Mitspieler verfügbar – abgelegt.`, "neutral");
                finishDrawTurn(player);
            } else if (player.isBot) {
                const target = availableTargets.reduce((prev, current) => (prev.score < current.score) ? prev : current);
                target.secondChances++;
                Engine.addHistory(player.name, `Zog Second Chance und gab sie an ${target.name} weiter! 🛡️`, "neutral");
                finishDrawTurn(player);
            } else {
                openModal('Second Chance weitergeben', 'Du hast bereits eine Second Chance! Wähle einen Mitspieler:', (targetId) => {
                    const target = gameState.players.find(p => p.id === targetId);
                    target.secondChances++;
                    Engine.addHistory(player.name, `Gab Second Chance an ${target.name} weiter! 🛡️`, "neutral");
                    finishDrawTurn(player);
                }, availableTargets);
            }
        } else {
            player.secondChances++;
            Engine.addHistory(player.name, `Zog Second Chance! 🛡️`, "neutral");
            finishDrawTurn(player);
        }
    } else if (type === 'x2' || type.startsWith('+')) {
        player.specialCards.push(type);
        Engine.addHistory(player.name, `Zog Bonuskarte: ${SPECIAL_LABELS[type]}`, "neutral");
        finishDrawTurn(player);
    } else if (type === 'freeze') {
        if (player.isBot) {
            botSelectTarget(player, 'freeze');
        } else {
            openModal('Freeze', 'Wen möchtest du einfrieren?', (targetId) => {
                const target = gameState.players.find(p => p.id === targetId);
                target.frozen = true;
                target.hasFinishedRound = true;
                Engine.bankTurn(target);
                Engine.addHistory(player.name, `Hat ${target.name} eingefroren ❄️!`, "warning");
                finishDrawTurn(player);
            });
        }
    } else if (type === 'flip3') {
        if (player.isBot) {
            botSelectTarget(player, 'flip3');
        } else {
            openModal('Flip 3', 'Wer muss 3 Karten ziehen?', (targetId) => {
                const target = gameState.players.find(p => p.id === targetId);
                target.flip3Count = 3;
                Engine.addHistory(player.name, `Zwingt ${target.name}, 3 Karten zu ziehen!`, "warning");
                gameState.activePlayerId = target.id;
                updateUI();
            });
        }
    }
}

function botSelectTarget(bot, action) {
    const availableTargets = gameState.players.filter(p => !p.frozen && !p.hasFinishedRound && p.id !== bot.id);
    if (availableTargets.length === 0) {
        Engine.addHistory(bot.name, `Zog ${SPECIAL_LABELS[action]}, aber niemand ist ein gültiges Ziel.`, "neutral");
        finishDrawTurn(bot);
        return;
    }
    
    let target;
    if (action === 'freeze') {
        target = availableTargets.reduce((prev, current) => (prev.score > current.score) ? prev : current);
        target.frozen = true;
        target.hasFinishedRound = true;
        Engine.bankTurn(target);
        Engine.addHistory(bot.name, `Hat ${target.name} eingefroren ❄️!`, "warning");
        finishDrawTurn(bot);
    } else if (action === 'flip3') {
        target = availableTargets.reduce((prev, current) => (prev.currentCards.length > current.currentCards.length) ? prev : current);
        target.flip3Count = 3;
        Engine.addHistory(bot.name, `Zwingt ${target.name}, 3 Karten zu ziehen!`, "warning");
        gameState.activePlayerId = target.id;
        updateUI();
    }
}
