// --- Variáveis Globais ---
let scoreNos = 0, scoreEles = 0;
let prevScoreNos = 0, prevScoreEles = 0;
let isInitialState = true; // Indica se é o início de um jogo (nenhum ponto marcado)
const maxScore = 12;
let matchesWonNos = 0, matchesWonEles = 0;
let playerNames = []; // Armazena os nomes dos jogadores (2 ou 4)
let currentDealerIndex = 0; // Índice do embaralhador atual em playerNames
let timerIntervalId = null; // ID do intervalo do cronômetro
let gameStartTime = null; // Timestamp de quando o jogo atual começou
let matchDurationHistory = []; // Histórico de durações das partidas [{ duration: ms, winner: 'nos'/'eles' }]
let undoState = null; // Objeto para armazenar o estado anterior para a função "Desfazer"
let teamNameNos = "Nós"; // Será substituído por nome do jogador em modo 2p
let teamNameEles = "Eles"; // Será substituído por nome do jogador em modo 2p
let currentTheme = 'dark'; // Tema atual ('dark' ou 'light')
let wakeLock = null; // Objeto WakeLock para manter a tela acesa
let isSoundOn = true; // Estado do som (ligado/desligado)
let numberOfPlayers = 0; // Número de jogadores (2 ou 4), 0 indica que não foi definido

// --- Constantes Chaves localStorage ---
// Usadas para salvar e carregar o estado do jogo no armazenamento local do navegador
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

// --- Elementos do DOM (Referências aos elementos HTML) ---
let scoreNosElement, scoreElesElement, prevScoreNosElement, prevScoreElesElement,
    matchWinsNosElement, matchWinsElesElement, dealerNameElement, currentTimerElement,
    durationHistoryListElement, undoButton, teamNameNosElement, teamNameElesElement,
    themeToggleButton, soundToggleButton, bodyElement, themeMeta,
    playerModeModal, select2PlayersBtn, select4PlayersBtn, changeGameModeBtn,
    editTeamsButtonElement; // Referência para o botão de editar nomes

// --- Funções de Armazenamento Local ---
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Erro ao salvar dados:", key, e);
    }
}

function loadData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error("Erro ao carregar dados:", key, e);
        return defaultValue;
    }
}

// Salva todo o estado relevante do jogo no localStorage
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

// Carrega configurações como tema, som e número de jogadores
function loadGameSettings() {
    currentTheme = loadData(STORAGE_KEYS.THEME, 'dark');
    isSoundOn = loadData(STORAGE_KEYS.SOUND_ON, true);
    numberOfPlayers = loadData(STORAGE_KEYS.NUMBER_OF_PLAYERS, 0); // Padrão 0 para forçar modal se não salvo
}

// Carrega os dados principais do jogo (placar, nomes, etc.)
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
    // Carrega nomes de equipe/jogador. Se for 2p, eles serão ajustados em initializeApp.
    teamNameNos = loadData(STORAGE_KEYS.TEAM_NAME_NOS, "Nós");
    teamNameEles = loadData(STORAGE_KEYS.TEAM_NAME_ELES, "Eles");
    matchDurationHistory = loadData(STORAGE_KEYS.DURATION_HISTORY, []);
}

// Limpa os dados salvos, exceto tema e som (usado em "Zerar Placar Geral")
function clearSavedGameData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.THEME && key !== STORAGE_KEYS.SOUND_ON) {
            localStorage.removeItem(key);
        }
    });
    numberOfPlayers = 0; // Força a seleção de modo na próxima vez
}

// --- Funções de Display (Atualizam a interface do usuário) ---
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
    durationHistoryListElement.innerHTML = ''; // Limpa a lista atual
    if (matchDurationHistory.length === 0) {
        durationHistoryListElement.innerHTML = '<li>Nenhuma partida concluída.</li>';
        durationHistoryListElement.style.textAlign = 'center';
        durationHistoryListElement.style.color = 'var(--text-color-muted)';
        return;
    }
    durationHistoryListElement.style.textAlign = 'left'; // Restaura alinhamento
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
        setTimeout(() => {
            getPlayerNames(); // getPlayerNames agora também ajusta teamNameNos/Eles
        }, 100);
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

// --- Nomes dos Jogadores ---
function getPlayerNames() {
    if (numberOfPlayers === 0) { showPlayerModeModal(); return; }
    playerNames = [];
    const promptMessage = `Defina os ${numberOfPlayers} jogadores para o rodízio do embaralhador...`;
    alert(promptMessage);
    for (let i = 1; i <= numberOfPlayers; i++) {
        let playerNameInput = prompt(`Nome do Jogador ${i}:`);
        while (!playerNameInput || playerNameInput.trim() === "") {
            alert("Nome inválido. Por favor, digite um nome.");
            playerNameInput = prompt(`Nome do Jogador ${i}:`);
        }
        playerNames.push(playerNameInput.trim());
    }
    currentDealerIndex = 0;
    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay();

    // Ajusta os nomes das "equipes" (teamNameNos/Eles) após obter os nomes dos jogadores
    if (numberOfPlayers === 2 && playerNames.length === 2) {
        teamNameNos = playerNames[0];
        teamNameEles = playerNames[1];
    } else { // Para 4 jogadores ou se algo der errado, usa os padrões ou os salvos
        // Se os nomes das equipes foram customizados antes para 4p, eles são carregados por loadGameData.
        // Se não, "Nós" e "Eles" são os padrões.
        teamNameNos = loadData(STORAGE_KEYS.TEAM_NAME_NOS, "Nós");
        teamNameEles = loadData(STORAGE_KEYS.TEAM_NAME_ELES, "Eles");
         // Garante que se mudou de 2p para 4p, os nomes não sejam os dos jogadores anteriores
        if (playerNames.includes(teamNameNos) && playerNames.includes(teamNameEles) && numberOfPlayers === 4 && teamNameNos === teamNameEles) {
            teamNameNos = "Nós";
            teamNameEles = "Eles";
        } else if (numberOfPlayers === 4 && (playerNames.includes(teamNameNos) || playerNames.includes(teamNameEles))) {
             // Evita que um nome de jogador de um modo 2p anterior persista como nome de equipe em 4p
            const defaultTeamNos = "Nós";
            const defaultTeamEles = "Eles";
            if (playerNames.includes(teamNameNos)) teamNameNos = defaultTeamNos;
            if (playerNames.includes(teamNameEles)) teamNameEles = defaultTeamEles;
            if (teamNameNos === teamNameEles) { // Caso ambos sejam resetados para "Nós" por exemplo
                 teamNameEles = defaultTeamEles === defaultTeamNos ? "Eles Outra" : defaultTeamEles;
            }
        }
    }
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    updateTeamNameDisplay();

    if (playerNames.length > 0) {
        speakText(`Iniciando novo jogo. O primeiro a embaralhar é ${playerNames[0]}`);
        if (!gameStartTime && isInitialState) startTimer();
    }
}

function ensurePlayerNamesAreSet() {
    if (numberOfPlayers > 0 && playerNames.length !== numberOfPlayers) {
        setTimeout(() => {
            alert(`Por favor, defina os nomes para o modo de ${numberOfPlayers} jogadores.`);
            getPlayerNames(); // getPlayerNames agora ajusta teamNameNos/Eles
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
            getPlayerNames(); // Chama para definir se não existirem
            return;
        }
        let newNameP1 = prompt("Novo nome para Jogador 1:", playerNames[0]);
        if (newNameP1 && newNameP1.trim() !== "") {
            playerNames[0] = newNameP1.trim();
            teamNameNos = playerNames[0];
        }
        let newNameP2 = prompt("Novo nome para Jogador 2:", playerNames[1]);
        if (newNameP2 && newNameP2.trim() !== "") {
            playerNames[1] = newNameP2.trim();
            teamNameEles = playerNames[1];
        }
        saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    } else { // Modo 4 jogadores
        let newTeamNameNos = prompt("Novo nome para a Equipe 1:", teamNameNos);
        if (newTeamNameNos && newTeamNameNos.trim() !== "") teamNameNos = newTeamNameNos.trim();

        let newTeamNameEles = prompt("Novo nome para a Equipe 2:", teamNameEles);
        if (newTeamNameEles && newTeamNameEles.trim() !== "") teamNameEles = newTeamNameEles.trim();
    }
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    updateTeamNameDisplay();
    updateDealerDisplay();
    updateDurationHistoryDisplay();
    speakText("Nomes atualizados.");
}

// --- Avançar Embaralhador ---
function advanceDealer(speakAnnounce = false) {
    if (numberOfPlayers === 0 || playerNames.length !== numberOfPlayers) {
        if (speakAnnounce) alert(`Primeiro defina o modo de jogo e os ${numberOfPlayers || 'devidos'} nomes dos jogadores.`);
        return false;
    }
    currentDealerIndex = (currentDealerIndex + 1) % numberOfPlayers;
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay();
    if (speakAnnounce && playerNames.length > 0 && playerNames[currentDealerIndex]) {
        speakText(`Próximo a embaralhar: ${playerNames[currentDealerIndex]}`, true);
    }
    return true;
}

// --- Lógica Principal de Pontuação ---
function changeScore(team, amount, speakPointText = null) {
    if (numberOfPlayers === 0 || playerNames.length !== numberOfPlayers) {
        alert("Por favor, configure o modo de jogo e os nomes dos jogadores antes de pontuar.");
        if (numberOfPlayers === 0) showPlayerModeModal(); else getPlayerNames();
        return false;
    }
    if (isInitialState && amount > 0 && !gameStartTime && playerNames.length === numberOfPlayers) startTimer();
    let currentTargetScore = team === 'nos' ? scoreNos : scoreEles;
    if ((amount > 0 && currentTargetScore >= maxScore) || (amount < 0 && currentTargetScore <= 0)) return false;
    undoState = { sN: scoreNos, sE: scoreEles, psN: prevScoreNos, psE: prevScoreEles, dI: currentDealerIndex, isI: isInitialState, gST_elapsed: gameStartTime ? (Date.now() - gameStartTime) : null };
    if (undoButton) undoButton.disabled = false;
    prevScoreNos = scoreNos; prevScoreEles = scoreEles; isInitialState = false;
    let winner = null;
    if (team === 'nos') {
        scoreNos = Math.min(maxScore, Math.max(0, scoreNos + amount));
        if (scoreNos === maxScore) winner = 'nos';
    } else {
        scoreEles = Math.min(maxScore, Math.max(0, scoreEles + amount));
        if (scoreEles === maxScore) winner = 'eles';
    }
    updateCurrentGameDisplay();
    if (amount > 0) {
        if (speakPointText) speakText(speakPointText, true);
        const dealerAdvanced = advanceDealer(false);
        if (dealerAdvanced && playerNames.length > 0 && playerNames[currentDealerIndex]) {
            setTimeout(() => speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, true), 800);
        }
    }
    if (winner) processMatchEnd(winner); else saveGameState();
    return true;
}

// --- Desfazer Última Ação ---
function undoLastAction() {
    if (undoState) {
        scoreNos = undoState.sN; scoreEles = undoState.sE;
        prevScoreNos = undoState.psN; prevScoreEles = undoState.psE;
        currentDealerIndex = undoState.dI; isInitialState = undoState.isI;
        if (undoState.gST_elapsed !== null && !isInitialState) {
            stopTimer(); gameStartTime = Date.now() - undoState.gST_elapsed; startTimer();
            if (currentTimerElement) currentTimerElement.textContent = formatTime(undoState.gST_elapsed);
        } else if (isInitialState) { resetCurrentTimerDisplay(); }
        updateCurrentGameDisplay(); updateDealerDisplay(); saveGameState();
        undoState = null; if (undoButton) undoButton.disabled = true;
        speakText("Última ação desfeita", true);
    } else {
        speakText("Nada para desfazer", true); if (undoButton) undoButton.disabled = true;
    }
}

// --- Fim de Partida ---
function processMatchEnd(winnerTeam) {
    const durationMs = stopTimer();
    if (durationMs !== null) {
        matchDurationHistory.push({ duration: durationMs, winner: winnerTeam });
        saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory);
        updateDurationHistoryDisplay();
    }
    undoState = null; if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay();
    setTimeout(() => {
        const winnerNameDisplay = winnerTeam === 'nos' ? teamNameNos : teamNameEles;
        if (winnerTeam === 'nos') matchesWonNos++; else matchesWonEles++;
        saveData(STORAGE_KEYS.MATCHES_NOS, matchesWonNos);
        saveData(STORAGE_KEYS.MATCHES_ELES, matchesWonEles);
        setTimeout(() => {
            speakText(`${winnerNameDisplay} ${winnerTeam === 'nos' ? 'ganhou' : 'ganharam'} a partida!`, true);
            alert(`${winnerNameDisplay} venceu a partida!\n\nDuração: ${formatTime(durationMs)}\nPlacar de partidas: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`);
            updateMatchWinsDisplay(); prepareNextGame();
        }, 300);
    }, 850);
}

// --- Prepara Próximo Jogo ---
function prepareNextGame() {
    scoreNos = 0; scoreEles = 0; prevScoreNos = 0; prevScoreEles = 0; isInitialState = true;
    undoState = null; if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay(); resetCurrentTimerDisplay();
    if (numberOfPlayers > 0 && playerNames.length === numberOfPlayers) {
        setTimeout(() => { startTimer(); saveGameState(); }, 100);
    } else { saveGameState(); }
}
function resetCurrentGameScoresAndState() {
    undoState = null; if (undoButton) undoButton.disabled = true;
    prepareNextGame();
}

// --- Funções de Reset ---
function resetCurrentGame() {
    if (numberOfPlayers === 0 || playerNames.length !== numberOfPlayers) {
        alert("Configure o modo de jogo e os nomes dos jogadores primeiro.");
        if (numberOfPlayers === 0) showPlayerModeModal(); else getPlayerNames();
        return;
    }
    if (confirm("Tem certeza que deseja reiniciar apenas o jogo atual (placar de 0 a 12)?")) {
        resetCurrentGameScoresAndState(); speakText("Jogo atual reiniciado.");
    }
}
function resetAllScores() {
    if (confirm("!!! ATENÇÃO !!!\n\nTem certeza que deseja ZERAR TODO o placar?\n\nIsso inclui:\n- Partidas ganhas\n- Jogo atual\n- Nomes dos jogadores e modo de jogo\n- Histórico de tempos\n\nEsta ação não pode ser desfeita.")) {
        clearSavedGameData();
        matchesWonNos = 0; matchesWonEles = 0; playerNames = []; currentDealerIndex = 0;
        teamNameNos = "Nós"; teamNameEles = "Eles"; matchDurationHistory = [];
        undoState = null; if (undoButton) undoButton.disabled = true;
        updateMatchWinsDisplay(); updateDealerDisplay(); updateDurationHistoryDisplay(); updateTeamNameDisplay();
        resetCurrentGameScoresAndState();
        updateEditButtonText();
        speakText("Placar geral e configurações zerados.");
        showPlayerModeModal();
    }
}

// --- Tema ---
function setTheme(themeName) {
    if (!bodyElement || !themeToggleButton || !themeMeta) return;
    bodyElement.className = themeName + '-theme'; currentTheme = themeName;
    saveData(STORAGE_KEYS.THEME, themeName);
    themeToggleButton.textContent = themeName === 'dark' ? '☀️' : '🌙';
    themeMeta.content = themeName === 'dark' ? '#1f1f1f' : '#f0f0f0';
}
function toggleTheme() { setTheme(currentTheme === 'dark' ? 'light' : 'dark'); }

// --- Som ---
function setSound(soundOn) {
    isSoundOn = soundOn; saveData(STORAGE_KEYS.SOUND_ON, isSoundOn); updateSoundButtonIcon();
}
function toggleSound() {
    setSound(!isSoundOn);
    if (isSoundOn) speakText("Som ativado.", true);
    else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// --- Adiciona Listeners de Eventos ---
function addEventListeners() {
    document.querySelector('.teams').addEventListener('click', event => {
        const button = event.target.closest('button');
        if (button && button.dataset.team && button.dataset.amount) {
            changeScore(button.dataset.team, parseInt(button.dataset.amount, 10), button.dataset.speak);
        }
    });
    document.getElementById('next-dealer-btn')?.addEventListener('click', () => advanceDealer(true));
    document.getElementById('undo-button')?.addEventListener('click', undoLastAction);
    editTeamsButtonElement?.addEventListener('click', editTeamNames);
    document.getElementById('reset-game-btn')?.addEventListener('click', resetCurrentGame);
    document.getElementById('reset-all-btn')?.addEventListener('click', resetAllScores);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('sound-toggle-btn')?.addEventListener('click', toggleSound);
    select2PlayersBtn?.addEventListener('click', () => selectPlayerMode(2));
    select4PlayersBtn?.addEventListener('click', () => selectPlayerMode(4));
    changeGameModeBtn?.addEventListener('click', () => {
        if (confirm("Mudar o modo de jogo irá reiniciar a partida atual, incluindo placares e nomes dos jogadores. Deseja continuar?")) {
            showPlayerModeModal();
        }
    });
}

// --- Inicialização do Aplicativo ---
function initializeApp() {
    scoreNosElement = document.getElementById('score-nos');
    scoreElesElement = document.getElementById('score-eles');
    prevScoreNosElement = document.getElementById('prev-score-nos');
    prevScoreElesElement = document.getElementById('prev-score-eles');
    matchWinsNosElement = document.getElementById('match-wins-nos');
    matchWinsElesElement = document.getElementById('match-wins-eles');
    dealerNameElement = document.getElementById('current-dealer-name');
    currentTimerElement = document.getElementById('current-timer-display');
    durationHistoryListElement = document.getElementById('duration-history-list');
    undoButton = document.getElementById('undo-button');
    teamNameNosElement = document.getElementById('team-name-nos');
    teamNameElesElement = document.getElementById('team-name-eles');
    themeToggleButton = document.getElementById('theme-toggle-btn');
    soundToggleButton = document.getElementById('sound-toggle-btn');
    bodyElement = document.body;
    themeMeta = document.getElementById('theme-color-meta');
    playerModeModal = document.getElementById('player-mode-modal');
    select2PlayersBtn = document.getElementById('select-2-players-btn');
    select4PlayersBtn = document.getElementById('select-4-players-btn');
    changeGameModeBtn = document.getElementById('change-game-mode-btn');
    editTeamsButtonElement = document.getElementById('edit-teams-btn');

    loadGameSettings();
    loadGameData();

    if (numberOfPlayers === 2 && playerNames.length === 2) {
        teamNameNos = playerNames[0];
        teamNameEles = playerNames[1];
    } else if (numberOfPlayers === 4) {
        // Se mudou de 2p para 4p e os nomes das equipes ainda são nomes de jogadores, reseta para "Nós"/"Eles"
        // Esta condição é para o caso de carregar um estado salvo onde era 2p e os nomes das equipes eram nomes de jogadores.
        // E então o usuário mudou para 4p mas os nomes das equipes não foram explicitamente resetados.
        // No entanto, a função selectPlayerMode e getPlayerNames já tentam lidar com isso.
        // Apenas como uma checagem final ao carregar.
        if (playerNames.includes(teamNameNos) || playerNames.includes(teamNameEles)) {
             // Se teamNameNos ou teamNameEles ainda são nomes da lista playerNames (que seria de 2 jogadores),
             // e agora estamos em modo 4 jogadores, é melhor resetar para os padrões.
             // No entanto, se os nomes das equipes foram explicitamente definidos para 4p e por acaso
             // coincidem com nomes de jogadores de um modo 2p anterior, esta lógica pode ser muito agressiva.
             // A forma mais segura é deixar loadGameData carregar o que foi salvo para teamNameNos/Eles,
             // e a lógica em getPlayerNames/selectPlayerMode tratar da transição.
             // Se teamNameNos/Eles não foram salvos explicitamente para 4p, eles serão "Nós"/"Eles" por padrão.
        }
    }


    setTheme(currentTheme);
    setSound(isSoundOn);
    updateEditButtonText();

    updateCurrentGameDisplay();
    updateMatchWinsDisplay();
    updateTeamNameDisplay();
    updateDealerDisplay();
    updateDurationHistoryDisplay();
    if (undoButton) undoButton.disabled = (undoState === null);

    addEventListeners();

    if (numberOfPlayers === 0) {
        setTimeout(showPlayerModeModal, 50);
    } else {
        ensurePlayerNamesAreSet();
        if (!gameStartTime && !isInitialState) resetCurrentTimerDisplay();
        else if (isInitialState) resetCurrentTimerDisplay();
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
