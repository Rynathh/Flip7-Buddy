import { gameState, saveState } from '../state.js';
import { SPECIAL_LABELS } from '../constants.js';
import * as Engine from '../engine.js';
import { elements } from './dom.js';
import { showRoundEndModal, showAlert } from './modals.js';
import { handleBotTurn, selectPlayer } from './actions.js';
import { updateProbabilities } from './probabilities.js';

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
    
    if (gameState.gameStarted) {
        elements.btnNewRound.textContent = "Neue Runde";
        elements.btnNewRound.classList.remove('btn-primary');
        elements.btnNewRound.classList.add('btn-success');
        handleBotTurn(activePlayer);
    } else {
        elements.btnNewRound.textContent = "Spiel starten";
        elements.btnNewRound.classList.remove('btn-success');
        elements.btnNewRound.classList.add('btn-primary');
    }
    
    const allFinished = gameState.players.length > 0 && gameState.players.every(p => p.frozen || p.hasFinishedRound);
    if (gameState.gameStarted && allFinished && !window.roundEndPopupShown && !gameState.gameEnded) {
        window.roundEndPopupShown = true;
        setTimeout(() => showRoundEndModal(gameState.players), 500);
    } else if (!allFinished) {
        window.roundEndPopupShown = false;
    }
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
            btn.disabled = (!gameState.gameStarted || !gameState.activePlayerId || (activePlayer && (activePlayer.frozen || activePlayer.isBot)));
        }
    });
    
    if (!gameState.gameStarted || (activePlayer && activePlayer.isBot)) {
        elements.btnBank.disabled = true;
        elements.btnBust.disabled = true;
        if(elements.btnDrawRandom) elements.btnDrawRandom.disabled = true;
    } else {
        if(elements.btnDrawRandom) {
            elements.btnDrawRandom.disabled = (!gameState.gameStarted || !gameState.activePlayerId || (activePlayer && activePlayer.frozen));
        }
    }
}

function checkWinner() {
    const winner = gameState.players.find(p => p.score >= 200);
    if (winner && !gameState.gameEnded) {
        gameState.gameEnded = true;
        if (window.roundEndTimer) clearInterval(window.roundEndTimer);
        setTimeout(() => {
            showAlert(`🎉 Das Spiel ist vorbei! 🎉\n\n${winner.name} hat ${winner.score} Punkte erreicht und somit gewonnen!`, "Spielende");
        }, 500);
    }
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
