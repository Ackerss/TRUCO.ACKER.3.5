// --- Variáveis Globais ---
let scoreNos = 0, scoreEles = 0;
let prevScoreNos = 0, prevScoreEles = 0;
let isInitialState = true;
const maxScore = 12;
let matchesWonNos = 0, matchesWonEles = 0;
let playerNames = [];
let currentDealerIndex = 0;
let timerIntervalId = null;
let gameStartTime = null;
let matchDurationHistory = [];
let undoState = null;
let teamNameNos = "Nós";
let teamNameEles = "Eles";
let currentTheme = 'dark';
let wakeLock = null;
let isSoundOn = true;
let numberOfPlayers = 0;

// --- Novos sons ---
const soundEffects = {
    win: new Audio('https://cdn.jsdelivr.net/gh/jacsonduarte/sfx/win.mp3'),
    undo: new Audio('https://cdn.jsdelivr.net/gh/jacsonduarte/sfx/undo.mp3'),
    draw: new Audio('https://cdn.jsdelivr.net/gh/jacsonduarte/sfx/draw.mp3')
};

// --- Constantes Chaves localStorage ---
const STORAGE_KEYS = {
    SCORE_NOS: 'truco_scoreNos',
    SCORE_ELES: 'truco_scoreEles',
    PREV_SCORE_NOS: 'truco_prevScoreNos',
    PREV_SCORE_ELES: 'truco_prevScoreEles',
    IS_INITIAL: 'truco_isInitial',
    MATCHES_NOS: 'truco_matchesNos',
    MATCHES_ELES: 'truco_matchesEles',
    PLAYER_NAMES: 'truco_playerNames',
    DEALER_INDEX: 'truco_dealerIndex',
    TEAM_NAME_NOS: 'truco_teamNameNos',
    TEAM_NAME_ELES: 'truco_teamNameEles',
    DURATION_HISTORY: 'truco_durationHistory',
    THEME: 'truco_theme',
    SOUND_ON: 'truco_soundOn',
    NUMBER_OF_PLAYERS: 'truco_numberOfPlayers'
};

// --- Elementos do DOM ---
let scoreNosElement, scoreElesElement, prevScoreNosElement, prevScoreElesElement,
    matchWinsNosElement, matchWinsElesElement, dealerNameElement, currentTimerElement,
    durationHistoryListElement, undoButton, teamNameNosElement, teamNameElesElement,
    themeToggleButton, soundToggleButton, bodyElement, themeMeta,
    playerModeModal, select2PlayersBtn, select4PlayersBtn, changeGameModeBtn,
    editTeamsButtonElement, exportHistoryBtn;

// --- Funções de Armazenamento Local ---
function saveData(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { }
}
function loadData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) { return defaultValue; }
}
function saveGameState() {
    saveData(STORAGE_KEYS.SCORE_NOS, scoreNos);
    saveData(STORAGE_KEYS.SCORE_ELES, scoreEles);
    saveData(STORAGE_KEYS.PREV_SCORE_NOS, prevScoreNos);
    saveData(STORAGE_KEYS.PREV_SCORE_ELES, prevScoreEles);
    saveData(STORAGE_KEYS.IS_INITIAL, isInitialState);
    saveData(STORAGE_KEYS.MATCHES_NOS, matchesWonNos);
    saveData(STORAGE_KEYS.MATCHES_ELES, matchesWonEles);
    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory);
    saveData(STORAGE_KEYS.NUMBER_OF_PLAYERS, numberOfPlayers);
}
function loadGameSettings() {
    currentTheme = loadData(STORAGE_KEYS.THEME, 'dark');
    isSoundOn = loadData(STORAGE_KEYS.SOUND_ON, true);
    numberOfPlayers = loadData(STORAGE_KEYS.NUMBER_OF_PLAYERS, 0);
}
function loadGameData() {
    scoreNos = loadData(STORAGE_KEYS.SCORE_NOS, 0);
    scoreEles = loadData(STORAGE_KEYS.SCORE_ELES, 0);
    prevScoreNos = loadData(STORAGE_KEYS.PREV_SCORE_NOS, 0);
    prevScoreEles = loadData(STORAGE_KEYS.PREV_SCORE_ELES, 0);
    isInitialState = loadData(STORAGE_KEYS.IS_INITIAL, true);
    matchesWonNos = loadData(STORAGE_KEYS.MATCHES_NOS, 0);
    matchesWonEles = loadData(STORAGE_KEYS.MATCHES_ELES, 0);
    playerNames = loadData(STORAGE_KEYS.PLAYER_NAMES, []);
    currentDealerIndex = loadData(STORAGE_KEYS.DEALER_INDEX, 0);
    teamNameNos = loadData(STORAGE_KEYS.TEAM_NAME_NOS, "Nós");
    teamNameEles = loadData(STORAGE_KEYS.TEAM_NAME_ELES, "Eles");
    matchDurationHistory = loadData(STORAGE_KEYS.DURATION_HISTORY, []);
}
function clearSavedGameData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.THEME && key !== STORAGE_KEYS.SOUND_ON) {
            localStorage.removeItem(key);
        }
    });
    numberOfPlayers = 0;
}

// --- Funções de Display ---
function updateCurrentGameDisplay() {
    if (scoreNosElement) scoreNosElement.textContent = scoreNos;
    if (scoreElesElement) scoreElesElement.textContent = scoreEles;
    if (prevScoreNosElement) prevScoreNosElement.textContent = isInitialState ? '-' : prevScoreNos;
    if (prevScoreElesElement) prevScoreElesElement.textContent = isInitialState ? '-' : prevScoreEles;
}
function updateMatchWinsDisplay() {
    if (matchWinsNosElement) matchWinsNosElement.textContent = matchesWonNos;
    if (matchWinsElesElement) matchWinsElesElement.textContent = matchesWonEles;
}
function updateDealerDisplay() {
    if (dealerNameElement) {
        if (numberOfPlayers > 0 && playerNames.length === numberOfPlayers && playerNames[currentDealerIndex]) {
            dealerNameElement.textContent = playerNames[currentDealerIndex];
        } else if (numberOfPlayers === 0) {
            dealerNameElement.textContent = "-- Selecione o Modo --";
        } else {
            dealerNameElement.textContent = "-- Defina os Nomes --";
        }
    }
}
function updateDurationHistoryDisplay() {
    if (!durationHistoryListElement) return;
    durationHistoryListElement.innerHTML = '';
    if (matchDurationHistory.length === 0) {
        durationHistoryListElement.innerHTML = '<li>Nenhuma partida concluída.</li>';
        durationHistoryListElement.style.textAlign = 'center';
        durationHistoryListElement.style.color = 'var(--text-color-muted)';
        return;
    }
    durationHistoryListElement.style.textAlign = 'left';
    durationHistoryListElement.style.color = 'var(--text-color-light)';
    matchDurationHistory.slice().reverse().forEach((entry, index) => {
        const formattedTime = formatTime(entry.duration);
        const listItem = document.createElement('li');
        const matchNumber = matchDurationHistory.length - index;
        const winnerDisplayName = entry.winner === 'nos' ? teamNameNos : teamNameEles;
        listItem.textContent = `Partida ${matchNumber}: ${formattedTime} `;
        const winnerIcon = document.createElement('span');
        winnerIcon.classList.add('winner-icon', entry.winner);
        winnerIcon.textContent = 'V';
        winnerIcon.setAttribute('aria-label', `Vencedor: ${winnerDisplayName}`);
        listItem.appendChild(winnerIcon);
        durationHistoryListElement.appendChild(listItem);
    });
}
function updateTeamNameDisplay() {
    if (teamNameNosElement) teamNameNosElement.textContent = teamNameNos;
    if (teamNameElesElement) teamNameElesElement.textContent = teamNameEles;
}
function updateSoundButtonIcon() {
    if (soundToggleButton) soundToggleButton.textContent = isSoundOn ? '🔊' : '🔇';
}
function updateEditButtonText() {
    if (editTeamsButtonElement) {
        editTeamsButtonElement.textContent = (numberOfPlayers === 2) ? "Editar Nomes dos Jogadores" : "Editar Nomes das Equipes";
    }
}

// --- Exportação do Histórico ---
function exportHistory() {
    if (matchDurationHistory.length === 0) {
        alert("Não há partidas no histórico para exportar.");
        return;
    }
    let texto = `Histórico de Partidas Truco Pro:\n`;
    matchDurationHistory.forEach((entry, idx) => {
        let n = idx + 1;
        let time = formatTime(entry.duration);
        let winner = entry.winner === 'nos' ? teamNameNos : teamNameEles;
        texto += `Partida ${n}: Tempo: ${time} - Vencedor: ${winner}\n`;
    });
    texto += `Placar Total: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`;
    // Opção: Copiar para área de transferência
    navigator.clipboard.writeText(texto).then(() => {
        let whatsappMsg = encodeURIComponent(texto);
        let url = `https://wa.me/?text=${whatsappMsg}`;
        if (confirm("Histórico copiado! Deseja abrir o WhatsApp para compartilhar?")) {
            window.open(url, '_blank');
        }
    });
}

// --- Modal de Seleção de Modo de Jogo ---
function showPlayerModeModal() {
    if (playerModeModal) playerModeModal.style.display = 'flex';
}
function hidePlayerModeModal() {
    if (playerModeModal) playerModeModal.style.display = 'none';
}
function selectPlayerMode(selectedMode) {
    const newNumberOfPlayers = parseInt(selectedMode, 10);
    if (newNumberOfPlayers !== numberOfPlayers || numberOfPlayers === 0) {
        numberOfPlayers = newNumberOfPlayers;
        saveData(STORAGE_KEYS.NUMBER_OF_PLAYERS, numberOfPlayers);
        playerNames = [];
        currentDealerIndex = 0;
        saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
        saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
        resetCurrentGameScoresAndState();
        updateDealerDisplay();
        updateEditButtonText();
        hidePlayerModeModal();
        setTimeout(() => { getPlayerNames(); }, 100);
    } else {
        hidePlayerModeModal();
    }
}

// --- Síntese de Voz ---
function speakText(text, cancelPrevious = true) {
    if (!isSoundOn || !('speechSynthesis' in window)) return;
    if (cancelPrevious && window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR'; utterance.rate = 1.0; utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }, cancelPrevious ? 50 : 0);
}

// --- Sons Extras ---
function playEffect(name) {
    if (isSoundOn && soundEffects[name]) {
        soundEffects[name].currentTime = 0;
        soundEffects[name].play();
    }
}

// --- Cronômetro ---
function formatTime(milliseconds) {
    if (milliseconds === null || milliseconds < 0) return "--:--";
    let totalSeconds = Math.floor(milliseconds / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');
    return (hours > 0) ? `${String(hours).padStart(2, '0')}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}
function startTimer() {
    stopTimer(); gameStartTime = Date.now();
    if (currentTimerElement) currentTimerElement.textContent = "00:00";
    timerIntervalId = setInterval(() => {
        if (gameStartTime && currentTimerElement) currentTimerElement.textContent = formatTime(Date.now() - gameStartTime);
        else { clearInterval(timerIntervalId); timerIntervalId = null; }
    }, 1000);
    requestWakeLock();
}
function stopTimer() {
    let durationMs = null;
    if (gameStartTime) durationMs = Date.now() - gameStartTime;
    if (timerIntervalId) { clearInterval(timerIntervalId); timerIntervalId = null; }
    gameStartTime = null; releaseWakeLock(); return durationMs;
}
function resetCurrentTimerDisplay() {
    stopTimer(); if (currentTimerElement) currentTimerElement.textContent = "00:00";
}

// --- Wake Lock API ---
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            if (wakeLock === null) {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => { wakeLock = null; });
            }
        } catch (err) { wakeLock = null; }
    }
}
async function releaseWakeLock() {
    if (wakeLock !== null) {
        try { await wakeLock.release(); } catch {} finally { wakeLock = null; }
    }
}
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden' && wakeLock !== null) await releaseWakeLock();
    else if (document.visibilityState === 'visible' && gameStartTime) await requestWakeLock();
});

// --- Nomes dos Jogadores (Validação de duplicados) ---
function getPlayerNames() {
    if (numberOfPlayers === 0) { showPlayerModeModal(); return; }
    playerNames = [];
    const promptMessage = `Defina os ${numberOfPlayers} jogadores para o rodízio do embaralhador...`;
    alert(promptMessage);
    for (let i = 1; i <= numberOfPlayers; i++) {
        let playerNameInput = prompt(`Nome do Jogador ${i}:`);
        while (!playerNameInput || playerNameInput.trim() === "" ||
            playerNames.includes(playerNameInput.trim())) {
            if (!playerNameInput || playerNameInput.trim() === "") {
                alert("Nome inválido. Por favor, digite um nome.");
            } else if (playerNames.includes(playerNameInput.trim())) {
                alert("Nome já utilizado. Escolha outro nome.");
            }
            playerNameInput = prompt(`Nome do Jogador ${i}:`);
        }
        playerNames.push(playerNameInput.trim());
    }
    currentDealerIndex = 0;
    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay();
    if (numberOfPlayers === 2 && playerNames.length === 2) {
        teamNameNos = playerNames[0];
        teamNameEles = playerNames[1];
    } else {
        teamNameNos = loadData(STORAGE_KEYS.TEAM_NAME_NOS, "Nós");
        teamNameEles = loadData(STORAGE_KEYS.TEAM_NAME_ELES, "Eles");
    }
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    updateTeamNameDisplay();
    if (playerNames.length > 0) {
        speakText(`Iniciando novo jogo. O primeiro a embaralhar é ${playerNames[0]}`);
        if (!gameStartTime && isInitialState) startTimer();
    }
}

// --- Checar se nomes estão corretos ---
function ensurePlayerNamesAreSet() {
    if (numberOfPlayers > 0 && playerNames.length !== numberOfPlayers) {
        setTimeout(() => {
            alert(`Por favor, defina os nomes para o modo de ${numberOfPlayers} jogadores.`);
            getPlayerNames();
        }, 150);
    } else if (numberOfPlayers > 0 && playerNames.length === numberOfPlayers && isInitialState && !gameStartTime) {
        startTimer();
    }
}

// --- Editar Nomes das Equipes/Jogadores ---
function editTeamNames() {
    if (numberOfPlayers === 0) {
        alert("Primeiro selecione o modo de jogo.");
        showPlayerModeModal();
        return;
    }
    if (numberOfPlayers === 2) {
        if (playerNames.length !== 2) {
            alert("Os nomes dos 2 jogadores ainda não foram definidos. Por favor, defina-os primeiro.");
            getPlayerNames();
            return;
        }
        let newNameP1 = prompt("Novo nome para Jogador 1:", playerNames[0]);
        if (newNameP1 && newNameP1.trim() !== "" && newNameP1.trim() !== playerNames[1]) {
            playerNames[0] = newNameP1.trim();
            teamNameNos = playerNames[0];
        }
        let newNameP2 = prompt("Novo nome para Jogador 2:", playerNames[1]);
        if (newNameP2 && newNameP2.trim() !== "" && newNameP2.trim() !== playerNames[0]) {
            playerNames[1] = newNameP2.trim();
            teamNameEles = playerNames[1];
        }
        saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    } else {
        let newTeamNameNos = prompt("Novo nome para a Equipe 1:", teamNameNos);
        if (newTeamNameNos && newTeamNameNos.trim() !== "") teamNameNos = newTeamNameNos.trim();
        let newTeamNameEles = prompt("Novo nome para a Equipe 2:", teamNameEles);
        if (newTeamNameEles && newTeamNameEles.trim() !== "") teamNameEles = newTeamNameEles.trim();
    }
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    updateTeamNameDisplay();
    updateDealerDisplay();
    updateDurationHistory
