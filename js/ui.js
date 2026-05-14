import { gameState, saveState, clearState } from './state.js';
import { SPECIAL_LABELS } from './constants.js';
import * as Engine from './engine.js';

// --- DOM Elements ---
export const elements = {
    cardsRemaining: document.getElementById('cards-remaining'),
    btnResetDeck: document.getElementById('btn-reset-deck'),
    btnNewRound: document.getElementById('btn-new-round'),
    btnHardReset: document.getElementById('btn-hard-reset'),
    btnExport: document.getElementById('btn-export'),
    btnImportTrigger: document.getElementById('btn-import-trigger'),
    fileImport: document.getElementById('file-import'),
    playersList: document.getElementById('players-list'),
    formAddPlayer: document.getElementById('add-player-form'),
    inputNewPlayer: document.getElementById('new-player-name'),
    inputNewPlayerIsBot: document.getElementById('new-player-is-bot'),
    historyList: document.getElementById('history-list'),
    currentPlayerDisplay: document.getElementById('current-player-display'),
    drawnCards: document.getElementById('drawn-cards'),
    noCardsMsg: document.getElementById('no-cards-msg'),
    turnPoints: document.getElementById('turn-points'),
    turnCount: document.getElementById('turn-count'),
    bustProb: document.getElementById('bust-prob'),
    flip3Warning: document.getElementById('flip3-warning'),
    flip3Count: document.getElementById('flip3-count'),
    btnBank: document.getElementById('btn-bank'),
    btnBust: document.getElementById('btn-bust'),
    btnDrawRandom: document.getElementById('btn-draw-random'),
    numberButtons: document.getElementById('number-buttons'),
    actionButtons: document.getElementById('action-buttons'),
    bonusButtons: document.getElementById('bonus-buttons'),
    probList: document.getElementById('prob-list'),
    probStackedBar: document.getElementById('prob-stacked-bar'),
    modal: document.getElementById('player-select-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalDesc: document.getElementById('modal-desc'),
    modalPlayers: document.getElementById('modal-player-list'),
    btnCancelModal: document.getElementById('btn-cancel-modal')
};

// --- Modal Management ---
let modalCallback = null;

export function openModal(title, desc, callback, filteredPlayers = null) {
    elements.modalTitle.textContent = title;
    elements.modalDesc.textContent = desc;
    modalCallback = callback;
    
    elements.modalPlayers.innerHTML = '';
    const targets = filteredPlayers || gameState.players.filter(p => !p.frozen && !p.hasFinishedRound);
    
    targets.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.style.width = '100%';
        btn.style.marginBottom = '0.5rem';
        btn.textContent = p.name;
        btn.onclick = () => {
            closeModal();
            if (modalCallback) modalCallback(p.id);
        };
        elements.modalPlayers.appendChild(btn);
    });
    
    elements.modal.style.display = 'flex';
}

export function closeModal() {
    elements.modal.style.display = 'none';
    modalCallback = null;
}

// --- UI Rendering ---

export function updateUI() {
    const totalCards = Engine.getTotalCardsInDeck();
    elements.cardsRemaining.textContent = totalCards;
    
    // Players List
    elements.playersList.innerHTML = '';
    gameState.players.forEach(p => {
        const div = document.createElement('div');
        div.className = `player-item ${p.id === gameState.activePlayerId ? 'active' : ''} ${p.frozen ? 'frozen' : ''}`;
        div.onclick = () => selectPlayer(p.id);
        
        let cardsText = [];
        if(p.currentCards.length > 0) cardsText.push(p.currentCards.join(', '));
        if(p.specialCards.length > 0) cardsText.push(p.specialCards.map(s => SPECIAL_LABELS[s]).join(', '));
        
        const cardsHtml = cardsText.length > 0 
            ? `<div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Tisch: ${cardsText.join(' | ')}</div>` 
            : '';

        let buffs = '';
        if(p.frozen) buffs += '❄️ ';
        else if(p.hasFinishedRound) buffs += '🏁 ';
        if(p.secondChances > 0) buffs += `🛡️x${p.secondChances} `;

        const botIcon = p.isBot ? ' 🤖' : '';
        const statusText = p.frozen ? ' (Eingefroren)' : (p.hasFinishedRound ? ' (Fertig)' : '');

        div.innerHTML = `
            <div style="flex: 1">
                <div style="display: flex; justify-content: space-between;">
                    <span class="player-name">${p.name}${botIcon}${statusText}</span>
                    <span class="player-score">${p.score}</span>
                </div>
                <div class="player-buffs">${buffs}</div>
                ${cardsHtml}
            </div>
        `;
        elements.playersList.appendChild(div);
    });

    const activePlayer = Engine.getActivePlayer();
    if(activePlayer) {
        elements.currentPlayerDisplay.textContent = activePlayer.name;
        
        if (activePlayer.flip3Count > 0) {
            elements.flip3Warning.style.display = 'block';
            elements.flip3Count.textContent = activePlayer.flip3Count;
        } else {
            elements.flip3Warning.style.display = 'none';
        }
    } else {
        elements.currentPlayerDisplay.textContent = "Kein Spieler ausgewählt";
        elements.flip3Warning.style.display = 'none';
    }

    const currentCards = activePlayer ? activePlayer.currentCards : [];
    const specialCards = activePlayer ? activePlayer.specialCards : [];

    // Current Turn Display
    if (currentCards.length === 0 && specialCards.length === 0) {
        elements.drawnCards.innerHTML = '';
        elements.noCardsMsg.style.display = 'block';
        elements.btnBank.disabled = true;
        elements.btnBust.disabled = true;
    } else {
        elements.noCardsMsg.style.display = 'none';
        elements.drawnCards.innerHTML = '';
        currentCards.forEach(val => {
            const card = document.createElement('div');
            card.className = 'playing-card';
            card.textContent = val;
            elements.drawnCards.appendChild(card);
        });
        specialCards.forEach(val => {
            const card = document.createElement('div');
            card.className = 'playing-card bonus';
            card.textContent = SPECIAL_LABELS[val];
            elements.drawnCards.appendChild(card);
        });
        elements.btnBank.disabled = activePlayer && activePlayer.flip3Count > 0;
        elements.btnBust.disabled = false;
    }
    
    elements.turnPoints.textContent = activePlayer ? Engine.calculateTurnPoints(activePlayer) : 0;
    elements.turnCount.textContent = currentCards.length;

    // History
    elements.historyList.innerHTML = '';
    gameState.history.forEach(h => {
        const div = document.createElement('div');
        div.className = `history-item ${h.type}`;
        const timeStr = h.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        div.innerHTML = `
            <div class="history-header">
                <span>${h.playerName}</span>
                <span style="font-size: 0.8rem; font-weight: normal">${timeStr}</span>
            </div>
            <div class="history-details">${h.details}</div>
        `;
        elements.historyList.appendChild(div);
    });

    // Card Buttons State
    updateButtonStates(activePlayer);
    
    updateProbabilities(totalCards, currentCards);
    saveState();
    
    checkWinner();
    handleBotTurn(activePlayer);
}

function updateButtonStates(activePlayer) {
    const allButtons = [
        ...elements.numberButtons.children, 
        ...elements.actionButtons.children, 
        ...elements.bonusButtons.children
    ];
    
    allButtons.forEach(btn => {
        const key = btn.textContent;
        let originalKey = key;
        for(let k in SPECIAL_LABELS) if(SPECIAL_LABELS[k] === key) originalKey = k;
        
        if(gameState.deck[originalKey] === 0) {
            btn.classList.add('empty');
            btn.disabled = true;
        } else {
            btn.classList.remove('empty');
            btn.disabled = (!gameState.activePlayerId || (activePlayer && (activePlayer.frozen || activePlayer.isBot)));
        }
    });
    
    if (activePlayer && activePlayer.isBot) {
        elements.btnBank.disabled = true;
        elements.btnBust.disabled = true;
        if(elements.btnDrawRandom) elements.btnDrawRandom.disabled = true;
    } else {
        if(elements.btnDrawRandom) {
            elements.btnDrawRandom.disabled = (!gameState.activePlayerId || (activePlayer && activePlayer.frozen));
        }
    }
}

function checkWinner() {
    const winner = gameState.players.find(p => p.score >= 200);
    if (winner && !gameState.gameEnded) {
        gameState.gameEnded = true;
        setTimeout(() => {
            alert(`🎉 Das Spiel ist vorbei! 🎉\n\n${winner.name} hat ${winner.score} Punkte erreicht und somit gewonnen!`);
        }, 500);
    }
}

function handleBotTurn(activePlayer) {
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

function selectPlayer(id) {
    const p = gameState.players.find(p => p.id === id);
    if (p.frozen) return alert("Dieser Spieler ist eingefroren!");
    if (p.hasFinishedRound) return alert("Dieser Spieler hat die Runde bereits beendet!");
    gameState.activePlayerId = id;
    updateUI();
}

export function renderCardButtons(onDraw) {
    elements.numberButtons.innerHTML = '';
    for(let i = 0; i <= 12; i++) {
        const btn = document.createElement('button');
        btn.className = 'card-btn';
        btn.textContent = i;
        btn.onclick = () => onDraw(i, false);
        elements.numberButtons.appendChild(btn);
    }
    
    elements.actionButtons.innerHTML = '';
    const actions = ['flip3', 'freeze', 'second_chance'];
    actions.forEach(sp => {
        const btn = document.createElement('button');
        btn.className = 'card-btn btn-special';
        btn.textContent = SPECIAL_LABELS[sp];
        btn.onclick = () => onDraw(sp, true);
        elements.actionButtons.appendChild(btn);
    });

    elements.bonusButtons.innerHTML = '';
    const bonuses = ['x2', '+2', '+4', '+6', '+8', '+10'];
    bonuses.forEach(sp => {
        const btn = document.createElement('button');
        btn.className = 'card-btn btn-bonus';
        btn.textContent = SPECIAL_LABELS[sp];
        btn.onclick = () => onDraw(sp, true);
        elements.bonusButtons.appendChild(btn);
    });
}

export function virtualDrawCard(playerOverride) {
    const player = playerOverride || Engine.getActivePlayer();
    if (!player) return alert("Bitte wähle zuerst einen Spieler aus.");
    
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
    if(!gameState.activePlayerId) return alert("Bitte wähle zuerst einen Spieler aus.");
    
    const player = Engine.getActivePlayer();
    if(player.frozen || player.hasFinishedRound) return alert("Dieser Spieler ist für diese Runde ausgeschieden!");
    
    if(gameState.deck[key] > 0) {
        gameState.deck[key]--;
        
        if (isSpecial) {
            handleSpecialCard(player, key);
        } else {
            const result = Engine.handleNumberCard(player, parseInt(key));
            if (result.type === 'bust') {
                updateUI();
                setTimeout(() => {
                    alert(`Doppelte Karte gezogen (${result.value})! Fehlschlag für ${player.name}!`);
                    Engine.bustTurn(player);
                    updateUI();
                }, 300);
            } else if (result.type === 'flip7') {
                updateUI();
                setTimeout(() => {
                    alert(`Flip7 für ${player.name}! 7 Karten ohne doppelte! +15 Bonuspunkte.`);
                    Engine.bankTurn(player);
                    updateUI();
                }, 300);
            } else if (result.type === 'saved') {
                updateUI();
                setTimeout(() => alert("Second Chance eingelöst! Die doppelte Karte wurde abgeworfen."), 100);
                Engine.nextPlayer();
                updateUI();
            } else {
                Engine.nextPlayer(); // Should we end turn after number card? Original code did finishDrawTurn
                // Wait, original finishDrawTurn was more complex
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
                Engine.bankTurn(target); // silent bank in UI sense? No, Engine.bankTurn adds history
                Engine.addHistory(player.name, `Hat ${target.name} eingefroren ❄️!`, "fail");
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
    const availableTargets = gameState.players.filter(p => !p.frozen && p.id !== bot.id);
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
        Engine.addHistory(bot.name, `Hat ${target.name} eingefroren ❄️!`, "fail");
        finishDrawTurn(bot);
    } else if (action === 'flip3') {
        target = availableTargets.reduce((prev, current) => (prev.currentCards.length > current.currentCards.length) ? prev : current);
        target.flip3Count = 3;
        Engine.addHistory(bot.name, `Zwingt ${target.name}, 3 Karten zu ziehen!`, "warning");
        gameState.activePlayerId = target.id;
        updateUI();
    }
}

function updateProbabilities(totalCards, currentCards) {
    elements.probList.innerHTML = '';
    if(elements.probStackedBar) elements.probStackedBar.innerHTML = '';
    if (totalCards === 0) return;

    // Bust probability
    const drawnSet = new Set(currentCards);
    let bustCardsRemaining = 0;
    drawnSet.forEach(val => { bustCardsRemaining += gameState.deck[val]; });
    
    const activePlayer = Engine.getActivePlayer();
    let hasShield = activePlayer && activePlayer.secondChances > 0;
    
    let bustProb = drawnSet.size > 0 ? (bustCardsRemaining / totalCards) * 100 : 0;
    if (hasShield) bustProb = 0; 
    
    elements.bustProb.textContent = hasShield ? '0% 🛡️' : bustProb.toFixed(1) + '%';
    if(!hasShield) {
        if(bustProb > 30) elements.bustProb.style.color = 'var(--danger-color)';
        else if(bustProb > 15) elements.bustProb.style.color = '#f59e0b';
        else elements.bustProb.style.color = 'var(--text-primary)';
    } else {
        elements.bustProb.style.color = 'var(--success-color)';
    }

    // Stacked Bar
    const stackedBar = document.createElement('div');
    stackedBar.className = 'stacked-bar';

    const getSegmentColor = (key, isDanger, type) => {
        if (isDanger) return '#ef4444'; 
        if (type === 'special') return '#8b5cf6'; 
        if (type === 'bonus') return '#eab308'; 
        const num = parseInt(key);
        return `hsl(217, 90%, ${40 + ((12 - num) * 3)}%)`;
    };

    const addSegment = (label, count, isDanger, type) => {
        if (count === 0) return;
        const prob = (count / totalCards) * 100;
        const color = getSegmentColor(label, isDanger, type);
        
        const segment = document.createElement('div');
        segment.className = 'bar-segment';
        segment.style.width = `${prob}%`;
        segment.style.backgroundColor = color;
        segment.title = `${label}: ${prob.toFixed(1)}%`;
        stackedBar.appendChild(segment);

        // List Row
        const row = document.createElement('div');
        row.className = 'prob-row';
        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem">
                <div class="prob-dot" style="background: ${color}"></div>
                <span>${label}</span>
            </div>
            <span style="font-weight: 600; ${isDanger ? 'color: var(--danger-color)' : ''}">${prob.toFixed(1)}%</span>
        `;
        elements.probList.appendChild(row);
    };

    // 1. Danger cards
    drawnSet.forEach(val => addSegment(val, gameState.deck[val], true, 'number'));
    // 2. Safe numbers
    for(let i=0; i<=12; i++) if(!drawnSet.has(i)) addSegment(i, gameState.deck[i], false, 'number');
    // 3. Special
    addSegment('Flip 3', gameState.deck['flip3'], false, 'special');
    addSegment('Freeze', gameState.deck['freeze'], false, 'special');
    addSegment('2nd Chance', gameState.deck['second_chance'], false, 'special');
    // 4. Bonus
    ['x2', '+2', '+4', '+6', '+8', '+10'].forEach(k => addSegment(k, gameState.deck[k], false, 'bonus'));

    if(elements.probStackedBar) elements.probStackedBar.appendChild(stackedBar);
}
