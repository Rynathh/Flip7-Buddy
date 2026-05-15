/**
 * @module main
 * @description Application entry point. Initializes state, renders the UI, and binds all event listeners.
 */

import { gameState, loadState, saveState, clearState } from './state.js';
import * as Engine from './engine.js';
import * as UI from './ui.js';

/**
 * Bootstraps the application: loads persisted state, renders card buttons,
 * updates the UI, and attaches all DOM event listeners.
 */
function init() {
    loadState();
    UI.renderCardButtons((key, isSpecial) => UI.drawCard(key, isSpecial));
    UI.updateUI();
    
    // Event Listeners
    UI.elements.btnResetDeck.addEventListener('click', () => {
        UI.openModal("Deck mischen", "Bist du sicher, dass du das Deck neu mischen möchtest?", (confirmed) => {
            if (confirmed) {
                Engine.resetDeck();
                UI.updateUI();
            }
        }, null, "Mischen");
    });

    UI.elements.btnNewRound.addEventListener('click', () => {
        Engine.startNewRound();
        UI.updateUI();
    });

    UI.elements.btnHardReset.addEventListener('click', () => {
        UI.openModal("Spiel zurücksetzen", "ACHTUNG: Möchtest du das aktuelle Spiel komplett löschen?", (confirmed) => {
            if (confirmed) {
                clearState();
            }
        }, null, "Löschen");
    });

    UI.elements.btnExport.addEventListener('click', exportState);
    UI.elements.btnImportTrigger.addEventListener('click', () => UI.elements.fileImport.click());
    UI.elements.fileImport.addEventListener('change', importState);

    UI.elements.formAddPlayer.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = UI.elements.inputNewPlayer.value.trim();
        const isBot = UI.elements.inputNewPlayerIsBot.checked;
        if(name) {
            Engine.addPlayer(name, isBot);
            UI.elements.inputNewPlayer.value = '';
            UI.elements.inputNewPlayerIsBot.checked = false;
            UI.updateUI();
        }
    });

    UI.elements.btnBank.addEventListener('click', () => {
        Engine.bankTurn();
        UI.updateUI();
    });

    UI.elements.btnBust.addEventListener('click', () => {
        Engine.bustTurn();
        UI.updateUI();
    });

    UI.elements.btnDrawRandom.addEventListener('click', () => {
        UI.virtualDrawCard();
    });

    UI.elements.btnCancelModal.addEventListener('click', () => UI.closeModal());
}

/**
 * Exports the current game state as a downloadable JSON file.
 */
function exportState() {
    const state = { 
        deck: gameState.deck, 
        players: gameState.players, 
        activePlayerId: gameState.activePlayerId, 
        roundStarterId: gameState.roundStarterId, 
        history: gameState.history 
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "flip7_buddy_spielstand.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Imports a game state from a user-selected JSON file. Validates the data,
 * restores all state fields, and refreshes the UI.
 * @param {Event} event - The file input change event.
 */
function importState(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const state = JSON.parse(e.target.result);
            gameState.deck = state.deck;
            gameState.players = state.players;
            gameState.activePlayerId = state.activePlayerId;
            gameState.roundStarterId = state.roundStarterId;
            gameState.history = state.history;
            gameState.history.forEach(h => h.time = new Date(h.time));
            saveState();
            UI.updateUI();
            UI.showAlert("Spielstand erfolgreich geladen!");
        } catch (error) {
            console.error("Error parsing JSON:", error);
            UI.showAlert("Fehler beim Laden der Datei.", "Fehler");
        }
        UI.elements.fileImport.value = '';
    };
    reader.readAsText(file);
}

// Start the app
init();
