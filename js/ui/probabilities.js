/**
 * @module ui/probabilities
 * @description Probability visualization: bust risk calculation, stacked bar chart,
 * and per-card probability list with color-coded segments.
 */

import { gameState } from '../state.js';
import * as Engine from '../engine.js';
import { elements } from './dom.js';

/**
 * Recalculates and renders the probability display:
 * - Bust probability percentage (with shield awareness)
 * - Horizontal stacked bar showing card distribution
 * - Vertical list of individual card probabilities with fill bars
 * 
 * Color scheme:
 * - Red: duplicate (danger) cards
 * - Purple: special action cards (Flip3, Freeze, Second Chance)
 * - Gold: bonus cards (x2, +2..+10)
 * - Blue gradient: safe number cards (darker = higher number)
 * 
 * @param {number} totalCards - Total cards remaining in the deck.
 * @param {number[]} currentCards - Array of number cards the active player has drawn.
 */
export function updateProbabilities(totalCards, currentCards) {
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
        if (isDanger) return 'var(--danger-color)'; 
        if (type === 'special') return 'var(--special-color)'; 
        if (type === 'bonus') return 'var(--bonus-color)'; 
        const num = parseInt(key);
        return `hsl(217, 90%, ${35 + ((12 - num) * 3)}%)`;
    };

    // Calculate all probabilities first to find max for scaling
    const probs = [];
    const addProbData = (label, count, isDanger, type) => {
        if (count === 0) return;
        const prob = (count / totalCards) * 100;
        probs.push({ label, count, isDanger, type, prob });
    };

    drawnSet.forEach(val => addProbData(val, gameState.deck[val], true, 'number'));
    for(let i=0; i<=12; i++) if(!drawnSet.has(i)) addProbData(i, gameState.deck[i], false, 'number');
    addProbData('F3', gameState.deck['flip3'], false, 'special');
    addProbData('Frz', gameState.deck['freeze'], false, 'special');
    addProbData('SC', gameState.deck['second_chance'], false, 'special');
    ['x2', '+2', '+4', '+6', '+8', '+10'].forEach(k => addProbData(k, gameState.deck[k], false, 'bonus'));

    const maxProb = Math.max(...probs.map(p => p.prob), 1);

    probs.forEach(p => {
        const color = getSegmentColor(p.label, p.isDanger, p.type);
        
        // Horizontal stacked bar segment
        const segment = document.createElement('div');
        segment.className = 'bar-segment';
        segment.style.width = `${p.prob}%`;
        segment.style.backgroundColor = color;
        segment.title = `${p.label}: ${p.prob.toFixed(1)}%`;
        stackedBar.appendChild(segment);

        // Detailed probability row
        const item = document.createElement('div');
        item.className = `prob-item ${p.isDanger ? 'danger' : ''} ${p.type === 'special' ? 'special-prob' : ''} ${p.type === 'bonus' ? 'bonus-prob' : ''}`;
        
        const displayHeight = (p.prob / maxProb) * 100;

        item.innerHTML = `
            <div class="prob-card-val" title="${p.label}">${p.label}</div>
            <div class="prob-bar-bg">
                <div class="prob-bar-fill" style="width: ${displayHeight}%; background-color: ${color}"></div>
            </div>
            <div class="prob-text">${p.prob.toFixed(1)}%</div>
        `;
        elements.probList.appendChild(item);
    });

    if(elements.probStackedBar) elements.probStackedBar.appendChild(stackedBar);
}
