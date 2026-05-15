/**
 * @module ui/modals
 * @description Modal dialogs: confirmation prompts, alerts, player selection, and round-end summaries.
 */

import { gameState } from '../state.js';
import * as Engine from '../engine.js';
import { elements } from './dom.js';
import { updateUI } from './render.js';

/** @type {Function|null} Currently active modal callback (unused but kept for potential future use). */
let modalCallback = null;

/**
 * Opens a modal dialog with either a confirm button or a list of player buttons.
 * @param {string} title - Modal heading text.
 * @param {string} desc - Modal description text.
 * @param {Function} callback - Called with true (confirm) or player ID (selection).
 * @param {Array|null} [filteredPlayers=null] - Specific player list to show. Defaults to all eligible players.
 * @param {string|null} [confirmText=null] - If provided, shows a single confirm button instead of player list.
 */
export function openModal(title, desc, callback, filteredPlayers = null, confirmText = null) {
    elements.modalTitle.textContent = title;
    elements.modalDesc.textContent = desc;
    elements.modalDesc.style.whiteSpace = 'normal';
    
    elements.modalPlayers.innerHTML = '';
    elements.btnCancelModal.style.display = 'block';
    
    if (confirmText) {
        const btn = document.createElement('button');
        btn.className = 'btn-primary modal-action-btn';
        btn.textContent = confirmText;
        btn.onclick = () => {
            closeModal();
            if (callback) callback(true);
        };
        elements.modalPlayers.appendChild(btn);
    } else {
        const targets = filteredPlayers || gameState.players.filter(p => !p.frozen && !p.hasFinishedRound);
        
        targets.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'btn-primary modal-select-btn';
            btn.textContent = p.name;
            btn.onclick = () => {
                closeModal();
                if (callback) callback(p.id);
            };
            elements.modalPlayers.appendChild(btn);
        });
    }
    
    elements.modal.style.display = 'flex';
}

/**
 * Closes the currently open modal and clears the callback reference.
 */
export function closeModal() {
    elements.modal.style.display = 'none';
    modalCallback = null;
}

/**
 * Displays a simple alert modal with an OK button.
 * @param {string} message - Alert message (supports newlines with pre-wrap).
 * @param {string} [title="Hinweis"] - Alert heading.
 * @param {Function|null} [callback=null] - Optional callback fired after OK is clicked.
 */
export function showAlert(message, title = "Hinweis", callback = null) {
    elements.modalTitle.textContent = title;
    elements.modalDesc.textContent = message;
    elements.modalDesc.style.whiteSpace = 'pre-wrap';
    
    elements.modalPlayers.innerHTML = '';
    elements.btnCancelModal.style.display = 'none';
    
    const btn = document.createElement('button');
    btn.className = 'btn-primary modal-action-btn';
    btn.textContent = "OK";
    btn.onclick = () => {
        closeModal();
        if (callback) callback();
    };
    elements.modalPlayers.appendChild(btn);
    
    elements.modal.style.display = 'flex';
}

/**
 * Shows an animated round-end summary modal with player scores and a countdown
 * that auto-starts a new round after 5 seconds.
 * @param {Array} players - Array of player objects to display in the ranking.
 */
export function showRoundEndModal(players) {
    elements.modalTitle.textContent = "Runde Beendet!";
    
    let html = '<div class="round-end-scores">';
    const sorted = [...players].sort((a,b) => b.score - a.score);
    sorted.forEach((p, index) => {
        let icon = '';
        if (index === 0) icon = '🥇';
        else if (index === 1) icon = '🥈';
        else if (index === 2) icon = '🥉';
        
        html += `<div class="round-end-row" style="animation-delay: ${index * 0.1}s">
            <span>${icon} ${p.name}</span>
            <span class="round-end-score">${p.score}</span>
        </div>`;
    });
    html += '</div><div class="round-end-countdown">Neue Runde startet in <strong id="round-countdown">5</strong>...</div>';
    
    elements.modalDesc.innerHTML = html;
    elements.modalDesc.style.whiteSpace = 'normal';
    
    elements.modalPlayers.innerHTML = '';
    
    const btn = document.createElement('button');
    btn.className = 'btn-success modal-action-btn modal-action-btn--start';
    btn.textContent = "Jetzt starten";
    btn.onclick = () => {
        if(window.roundEndTimer) clearInterval(window.roundEndTimer);
        closeModal();
        Engine.startNewRound();
        updateUI();
    };
    elements.modalPlayers.appendChild(btn);
    
    elements.btnCancelModal.style.display = 'none';
    elements.modal.style.display = 'flex';
    
    let timeLeft = 5;
    if (window.roundEndTimer) clearInterval(window.roundEndTimer);
    window.roundEndTimer = setInterval(() => {
        timeLeft--;
        const el = document.getElementById('round-countdown');
        if (el) el.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(window.roundEndTimer);
            closeModal();
            Engine.startNewRound();
            updateUI();
        }
    }, 1000);
}
