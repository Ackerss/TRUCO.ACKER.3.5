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

// --- Constantes Chaves localStorage ---
const STORAGE_KEYS = {
    SCORE_NOS: 'truco_scoreNos', SCORE_ELES: 'truco_scoreEles',
    PREV_SCORE_NOS: 'truco_prevScoreNos', PREV_SCORE_ELES: 'truco_prevScoreEles',
    IS_INITIAL: 'truco_isInitial', MATCHES_NOS: 'truco_matchesNos',
    MATCHES_ELES: 'truco_matchesEles', PLAYER_NAMES: 'truco_playerNames',
    DEALER_INDEX: 'truco_dealerIndex', TEAM_NAME_NOS: 'truco_teamNameNos',
    TEAM_NAME_ELES: 'truco_teamNameEles', DURATION_HISTORY: 'truco_durationHistory',
    THEME: 'truco_theme', SOUND_ON: 'truco_soundOn'
};

// --- Elementos do DOM ---
let scoreNosElement, scoreElesElement, prevScoreNosElement, prevScoreElesElement,
    matchWinsNosElement, matchWinsElesElement, dealerNameElement, currentTimerElement,
    durationHistoryListElement, undoButton, teamNameNosElement, teamNameElesElement,
    themeToggleButton, soundToggleButton, bodyElement, themeMeta;

// --- Funções de Armazenamento Local ---
function saveData(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.error("Erro ao salvar:", key, e); }
}
function loadData(key, defaultValue = null) {
    try {
        const d = localStorage.getItem(key);
        return d ? JSON.parse(d) : defaultValue;
    } catch (e) {
        console.error("Erro ao carregar:", key, e);
        return defaultValue;
    }
}
function saveGameState() {
    Object.keys(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.THEME && key !== STORAGE_KEYS.SOUND_ON) {
            // Constrói dinamicamente o nome da variável global a partir da chave
            const baseVarName = key.replace('truco_', ''); // Remove 'truco_'
            // Converte para camelCase (ex: SCORE_NOS -> scoreNos)
            const varName = baseVarName.toLowerCase().replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

            // Acessa a variável global correspondente e salva
            if (typeof window[varName] !== 'undefined') {
                saveData(key, window[varName]);
            } else {
                // Tenta lidar com nomes que não seguem o padrão direto (ex: IS_INITIAL -> isInitialState)
                if (key === STORAGE_KEYS.IS_INITIAL) saveData(key, window.isInitialState);
            }
        }
    });
}
function loadGameSettings() {
    const savedTheme = loadData(STORAGE_KEYS.THEME);
    currentTheme = savedTheme ? savedTheme : 'dark';
    const savedSound = loadData(STORAGE_KEYS.SOUND_ON);
    isSoundOn = savedSound !== null ? savedSound : true;
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
        if (key !== STORAGE_KEYS.THEME && key !== STORAGE_KEYS.SOUND_ON)
            localStorage.removeItem(key);
    });
}

// --- Funções de Display ---
function updateCurrentGameDisplay() {
    if (scoreNosElement) scoreNosElement.textContent = scoreNos;
    if (scoreElesElement) scoreElesElement.textContent = scoreEles;
    if (prevScoreNosElement)
        prevScoreNosElement.textContent = isInitialState ? '-' : prevScoreNos;
    if (prevScoreElesElement)
        prevScoreElesElement.textContent = isInitialState ? '-' : prevScoreEles;
}
function updateMatchWinsDisplay() {
    if (matchWinsNosElement) matchWinsNosElement.textContent = matchesWonNos;
    if (matchWinsElesElement) matchWinsElesElement.textContent = matchesWonEles;
}
function updateDealerDisplay() {
    if (dealerNameElement)
        dealerNameElement.textContent = (playerNames.length === 4)
            ? playerNames[currentDealerIndex]
            : "-- Digite os nomes --";
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
    for (let i = matchDurationHistory.length - 1; i >= 0; i--) {
        const entry = matchDurationHistory[i];
        const formattedTime = formatTime(entry.duration);
        const listItem = document.createElement('li');
        listItem.textContent = `Partida ${i + 1}: ${formattedTime} `;
        const winnerIcon = document.createElement('span');
        winnerIcon.classList.add('winner-icon', entry.winner);
        winnerIcon.textContent = 'V';
        winnerIcon.setAttribute('aria-label',
            `Vencedor: ${entry.winner === 'nos' ? teamNameNos : teamNameEles}`);
        listItem.appendChild(winnerIcon);
        durationHistoryListElement.appendChild(listItem);
    }
}
function updateTeamNameDisplay() {
    if (teamNameNosElement) teamNameNosElement.textContent = teamNameNos;
    if (teamNameElesElement) teamNameElesElement.textContent = teamNameEles;
}
function updateSoundButtonIcon() {
    if (soundToggleButton)
        soundToggleButton.textContent = isSoundOn ? '🔊' : '🔇';
}

// --- Síntese de Voz ---
function speakText(text, cancelPrevious = true) {
    if (!isSoundOn) return;
    if ('speechSynthesis' in window) {
        if (cancelPrevious && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setTimeout(() => {
                const u = new SpeechSynthesisUtterance(text);
                u.lang = 'pt-BR'; u.rate = 1.0; u.pitch = 1.0;
                window.speechSynthesis.speak(u);
            }, 50);
        } else {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'pt-BR'; u.rate = 1.0; u.pitch = 1.0;
            window.speechSynthesis.speak(u);
        }
    }
}

// --- Cronômetro ---
function formatTime(ms) {
    if (ms === null || ms < 0) return "--:--";
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');

    return (hours > 0)
        ? `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`
        : `${minutes}:${seconds}`;
}
function startTimer() {
    stopTimer(); 
    gameStartTime = Date.now();
    if (currentTimerElement) currentTimerElement.textContent = "00:00"; 
    timerIntervalId = setInterval(() => {
        if (gameStartTime && currentTimerElement) {
            const elapsed = Date.now() - gameStartTime;
            currentTimerElement.textContent = formatTime(elapsed);
        } else {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
    }, 1000); 
    requestWakeLock(); 
}
function stopTimer() {
    let durationMs = null;
    if (gameStartTime) {
        durationMs = Date.now() - gameStartTime; 
    }
    if (timerIntervalId) {
        clearInterval(timerIntervalId); 
        timerIntervalId = null;
    }
    gameStartTime = null; 
    releaseWakeLock(); 
    return durationMs; 
}
function resetCurrentTimerDisplay() {
    stopTimer(); 
    if (currentTimerElement) currentTimerElement.textContent = "00:00"; 
}

// --- Wake Lock API ---
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            if (wakeLock === null) { 
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => { wakeLock = null; }); 
            }
        } catch (err) {
            console.error(`Wake Lock falhou: ${err.name}, ${err.message}`);
            wakeLock = null; 
        }
    }
}
async function releaseWakeLock() {
    if (wakeLock !== null) {
        try { await wakeLock.release(); }
        catch { /* Ignora erros na liberação */ }
        finally { wakeLock = null; } 
    }
}
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
        await releaseWakeLock(); 
    } else if (document.visibilityState === 'visible' && gameStartTime) {
        await requestWakeLock();
    }
});

// --- Nomes dos Jogadores ---
function getPlayerNames() {
    playerNames = []; 
    alert("Vamos definir os jogadores para o rodízio do embaralhador...");
    for (let i = 1; i <= 4; i++) {
        let playerName = prompt(`Nome do Jogador ${i}:`);
        while (!playerName?.trim()) { 
            alert("Nome inválido. Por favor, digite um nome.");
            playerName = prompt(`Nome do Jogador ${i}:`);
        }
        playerNames.push(playerName.trim()); 
    }
    currentDealerIndex = 0; 
    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay(); 
    speakText(`Iniciando novo jogo. O primeiro a embaralhar é ${playerNames[0]}`);
    startTimer(); 
}

// --- Editar Nomes das Equipes ---
function editTeamNames() {
    let newNameNos = prompt("Novo nome para a Equipe 1:", teamNameNos);
    if (newNameNos?.trim()) { 
        teamNameNos = newNameNos.trim();
    }
    let newNameEles = prompt("Novo nome para a Equipe 2:", teamNameEles);
    if (newNameEles?.trim()) { 
        teamNameEles = newNameEles.trim();
    }
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    updateTeamNameDisplay(); 
    updateDurationHistoryDisplay(); 
    speakText("Nomes das equipes atualizados.");
}

// --- Avançar Embaralhador ---
function advanceDealer(speakAnnounce = false) {
    if (playerNames.length !== 4) {
        if (speakAnnounce) { 
            alert("Defina os 4 nomes dos jogadores primeiro para usar o rodízio.");
        }
        return false; 
    }
    currentDealerIndex = (currentDealerIndex + 1) % 4; 
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex); 
    updateDealerDisplay(); 
    if (speakAnnounce) { 
        speakText(`Próximo a embaralhar: ${playerNames[currentDealerIndex]}`, true);
    }
    return true; 
}


// --- Lógica Principal de Pontuação (COM A CORREÇÃO DO BOTÃO DESFAZER) ---
function changeScore(team, amount, speakPointText = null) {
    if (isInitialState && amount > 0) startTimer();

    let currentScore = team === 'nos' ? scoreNos : scoreEles;
    if ((amount > 0 && currentScore >= maxScore) || (amount < 0 && currentScore <= 0)) {
         return false; 
    }

    undoState = {
        sN: scoreNos, sE: scoreEles,         
        psN: prevScoreNos, psE: prevScoreEles, 
        dI: currentDealerIndex,             
        isI: isInitialState                 
    };
    if (undoButton) undoButton.disabled = false;

    prevScoreNos = scoreNos;
    prevScoreEles = scoreEles;
    isInitialState = false; 
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
        if (dealerAdvanced && playerNames.length === 4) {
            setTimeout(() => speakText(
                `Embaralhador: ${playerNames[currentDealerIndex]}`, true
            ), 800); 
        }
    } else if (amount < 0) { 
        // Opcional: Falar algo ao remover pontos?
        // speakText("Ponto removido.", true);
    }

    if (winner) {
        processMatchEnd(winner);
    } else {
        saveGameState();
    }
    return true;
}


// --- Desfazer ---
function undoLastAction() {
    if (undoState) { 
        scoreNos = undoState.sN;
        scoreEles = undoState.sE;
        prevScoreNos = undoState.psN;
        prevScoreEles = undoState.psE;
        currentDealerIndex = undoState.dI;
        isInitialState = undoState.isI;

        updateCurrentGameDisplay();
        updateDealerDisplay();
        saveGameState();

        undoState = null;
        if (undoButton) undoButton.disabled = true;
        speakText("Última ação desfeita", true);
    } else {
        speakText("Nada para desfazer", true);
        if (undoButton) undoButton.disabled = true; 
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
    undoState = null;
    if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay();

    setTimeout(() => {
        const winnerName = winnerTeam === 'nos' ? teamNameNos : teamNameEles;
        if (winnerTeam === 'nos') matchesWonNos++;
        else matchesWonEles++;
        saveData(STORAGE_KEYS.MATCHES_NOS, matchesWonNos);
        saveData(STORAGE_KEYS.MATCHES_ELES, matchesWonEles);

        setTimeout(() => {
            speakText(`${winnerName} ${winnerTeam === 'nos' ? 'ganhou' : 'ganharam'} a partida!`, true);
            alert(`${winnerName} venceu a partida!\n\nDuração: ${formatTime(durationMs)}\nPlacar de partidas: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`);
            updateMatchWinsDisplay(); 
            prepareNextGame(); 
        }, 300); 
    }, 850); 
}

// --- Prepara Próximo Jogo ---
function prepareNextGame() {
    scoreNos = 0; scoreEles = 0;
    prevScoreNos = 0; prevScoreEles = 0;
    isInitialState = true; 
    undoState = null;
    if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay();
    saveGameState();
    stopTimer();
    if (currentTimerElement) currentTimerElement.textContent = "00:00";
    if (playerNames.length === 4) {
        setTimeout(startTimer, 100); 
    }
}

// --- Reset ---
function resetCurrentGame() {
    if (confirm("Tem certeza que deseja reiniciar apenas o jogo atual (placar de 0 a 12)?")) {
        undoState = null;
        if (undoButton) undoButton.disabled = true;
        prepareNextGame();
        speakText("Jogo atual reiniciado.");
    }
}
function resetAllScores() {
    if (confirm("!!! ATENÇÃO !!!\n\nTem certeza que deseja ZERAR TODO o placar?\n\nIsso inclui:\n- Partidas ganhas\n- Jogo atual\n- Nomes dos jogadores\n- Histórico de tempos\n\nEsta ação não pode ser desfeita.")) {
        clearSavedGameData(); 
        matchesWonNos = 0; matchesWonEles = 0;
        playerNames = []; currentDealerIndex = 0;
        stopTimer(); matchDurationHistory = [];
        teamNameNos = "Nós"; teamNameEles = "Eles"; 
        undoState = null;
        if (undoButton) undoButton.disabled = true;
        updateMatchWinsDisplay();
        updateDealerDisplay();
        updateDurationHistoryDisplay();
        resetCurrentTimerDisplay();
        updateTeamNameDisplay();
        prepareNextGame(); 
        getPlayerNames();
        speakText("Placar geral, nomes e histórico zerados. Começando de novo!");
    }
}

// --- Tema ---
function setTheme(themeName) {
    if (!bodyElement || !themeToggleButton || !themeMeta) return; 
    bodyElement.className = themeName + '-theme'; 
    currentTheme = themeName;
    saveData(STORAGE_KEYS.THEME, themeName); 
    themeToggleButton.textContent = themeName === 'dark' ? '☀️' : '🌙';
    themeMeta.content = themeName === 'dark' ? '#1f1f1f' : '#f0f0f0';
}
function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark'); 
}

// --- Som ---
function setSound(soundOn) {
    isSoundOn = soundOn;
    saveData(STORAGE_KEYS.SOUND_ON, isSoundOn); 
    updateSoundButtonIcon(); 
}
function toggleSound() {
    setSound(!isSoundOn); 
    if (isSoundOn) {
        speakText("Som ativado.", true); 
    } else {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
}

// --- Listeners ---
function addEventListeners() {
    document.querySelector('.teams').addEventListener('click', event => {
        const button = event.target.closest('button'); 
        if (button && button.dataset.team && button.dataset.amount) { 
            const team = button.dataset.team;
            const amount = parseInt(button.dataset.amount, 10);
            const speakPointText = button.dataset.speak; 
            changeScore(team, amount, speakPointText); 
        }
    });

    document.getElementById('next-dealer-btn')?.addEventListener('click', () => advanceDealer(true)); 
    document.getElementById('undo-button')?.addEventListener('click', undoLastAction);
    document.getElementById('edit-teams-btn')?.addEventListener('click', editTeamNames);
    document.getElementById('reset-game-btn')?.addEventListener('click', resetCurrentGame);
    document.getElementById('reset-all-btn')?.addEventListener('click', resetAllScores);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('sound-toggle-btn')?.addEventListener('click', toggleSound);
}

// --- Inicialização ---
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

    loadGameSettings();
    loadGameData();
    setTheme(currentTheme);
    setSound(isSoundOn);

    updateCurrentGameDisplay();
    updateMatchWinsDisplay();
    updateTeamNameDisplay();
    updateDealerDisplay();
    updateDurationHistoryDisplay();
    if (undoButton) undoButton.disabled = (undoState === null);

    addEventListeners();

    if (playerNames.length !== 4) {
        setTimeout(getPlayerNames, 300);
    } else {
        resetCurrentTimerDisplay();
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
