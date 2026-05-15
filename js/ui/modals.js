import { gameState } from '../state.js';
import * as Engine from '../engine.js';
import { elements } from './dom.js';
import { updateUI } from './render.js';

let modalCallback = null;

export function openModal(title, desc, callback, filteredPlayers = null, confirmText = null) {
    elements.modalTitle.textContent = title;
    elements.modalDesc.textContent = desc;
    elements.modalDesc.style.whiteSpace = 'normal';
    
    elements.modalPlayers.innerHTML = '';
    elements.btnCancelModal.style.display = 'block';
    
    if (confirmText) {
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.style.width = '100%';
        btn.style.padding = '0.75rem';
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
            btn.className = 'btn-primary';
            btn.style.width = '100%';
            btn.style.marginBottom = '0.5rem';
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

export function closeModal() {
    elements.modal.style.display = 'none';
    modalCallback = null;
}

export function showAlert(message, title = "Hinweis", callback = null) {
    elements.modalTitle.textContent = title;
    elements.modalDesc.textContent = message;
    elements.modalDesc.style.whiteSpace = 'pre-wrap';
    
    elements.modalPlayers.innerHTML = '';
    elements.btnCancelModal.style.display = 'none';
    
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.style.width = '100%';
    btn.style.padding = '0.75rem';
    btn.textContent = "OK";
    btn.onclick = () => {
        closeModal();
        if (callback) callback();
    };
    elements.modalPlayers.appendChild(btn);
    
    elements.modal.style.display = 'flex';
}

export function showRoundEndModal(players) {
    elements.modalTitle.textContent = "Runde Beendet!";
    
    let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">';
    const sorted = [...players].sort((a,b) => b.score - a.score);
    sorted.forEach((p, index) => {
        let icon = '';
        if (index === 0) icon = '🥇';
        else if (index === 1) icon = '🥈';
        else if (index === 2) icon = '🥉';
        
        html += `<div style="animation: fadeInUp 0.4s ease forwards ${index * 0.1}s; opacity: 0; display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 0.4rem; border: 1px solid var(--panel-border);">
            <span>${icon} ${p.name}</span>
            <span style="font-weight: bold; color: #34d399;">${p.score}</span>
        </div>`;
    });
    html += '</div><div style="text-align: center; font-size: 0.9rem; color: var(--text-secondary);">Neue Runde startet in <strong id="round-countdown" style="color: white;">5</strong>...</div>';
    
    elements.modalDesc.innerHTML = html;
    elements.modalDesc.style.whiteSpace = 'normal';
    
    elements.modalPlayers.innerHTML = '';
    
    const btn = document.createElement('button');
    btn.className = 'btn-success';
    btn.style.width = '100%';
    btn.style.marginTop = '0.5rem';
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
