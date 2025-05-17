// --- Variáveis Globais ---
let scoreNos = 0, scoreEles = 0;
let prevScoreNos = 0, prevScoreEles = 0;
let isInitialState = true;
const maxScore = 12;
let matchesWonNos = 0, matchesWonEles = 0;
let playerNames = []; // Modo 4: [J1, J2, J3, J4], Modo 2: [P1, P2]
let currentDealerIndex = 0; // Alterna entre 0-3 (4P) ou 0-1 (2P)
let timerIntervalId = null;
let gameStartTime = null;
let matchDurationHistory = [];
let undoState = null;
let teamNameNos = "Nós"; // Usado apenas no modo 4 jogadores para UI
let teamNameEles = "Eles"; // Usado apenas no modo 4 jogadores para UI
let currentTheme = 'dark';
let wakeLock = null;
let isSoundOn = true;
let gameMode = 4; // 4 para 4 jogadores, 2 para 2 jogadores. Padrão 4.

// --- Constantes Chaves localStorage ---
const STORAGE_KEYS = {
    SCORE_NOS: 'truco_acker_scoreNos',
    SCORE_ELES: 'truco_acker_scoreEles',
    PREV_SCORE_NOS: 'truco_acker_prevScoreNos',
    PREV_SCORE_ELES: 'truco_acker_prevScoreEles',
    IS_INITIAL: 'truco_acker_isInitial',
    MATCHES_NOS: 'truco_acker_matchesNos',
    MATCHES_ELES: 'truco_acker_matchesEles',
    PLAYER_NAMES: 'truco_acker_playerNames',
    DEALER_INDEX: 'truco_acker_dealerIndex',
    TEAM_NAME_NOS: 'truco_acker_teamNameNos',
    TEAM_NAME_ELES: 'truco_acker_teamNameEles',
    DURATION_HISTORY: 'truco_acker_durationHistory',
    THEME: 'truco_acker_theme',
    SOUND_ON: 'truco_acker_soundOn',
    GAME_MODE: 'truco_acker_gameMode'
};

// --- Elementos do DOM ---
let scoreNosElement, scoreElesElement, prevScoreNosElement, prevScoreElesElement,
    matchWinsNosElement, matchWinsElesElement, dealerNameElement, currentTimerElement,
    durationHistoryListElement, undoButton, teamNameNosElement, teamNameElesElement,
    themeToggleButton, soundToggleButton, bodyElement, themeMeta, mainTitleElement,
    editPlayersButton, editTeamsButton, changeGameModeButton, exportHistoryButton, footerCreditElement,
    dealerSectionElement, nextDealerButtonElement;

// --- Funções de Armazenamento Local ---
function saveData(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.error("Erro ao salvar dados:", key, e); }
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

function saveGameMode() {
    saveData(STORAGE_KEYS.GAME_MODE, gameMode);
}

function loadGameMode() {
    gameMode = loadData(STORAGE_KEYS.GAME_MODE, 4);
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
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex); // Salva dealer para ambos os modos
    if (gameMode === 4) { // Salva nomes de equipe apenas no modo 4
        saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
        saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    }
    saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory);
}

function loadGameSettings() {
    currentTheme = loadData(STORAGE_KEYS.THEME, 'dark');
    isSoundOn = loadData(STORAGE_KEYS.SOUND_ON, true);
    loadGameMode();
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
    currentDealerIndex = loadData(STORAGE_KEYS.DEALER_INDEX, 0); // Carrega dealer para ambos os modos

    if (gameMode === 4) {
        teamNameNos = loadData(STORAGE_KEYS.TEAM_NAME_NOS, "Nós");
        teamNameEles = loadData(STORAGE_KEYS.TEAM_NAME_ELES, "Eles");
    } else {
        // No modo 2, teamNameNos e teamNameEles não são usados para títulos de seção de placar.
        // Os nomes dos jogadores são usados diretamente.
    }
    matchDurationHistory = loadData(STORAGE_KEYS.DURATION_HISTORY, []);
}

function clearSavedGameData() {
    const keysToClear = Object.values(STORAGE_KEYS).filter(key =>
        key !== STORAGE_KEYS.THEME && key !== STORAGE_KEYS.SOUND_ON && key !== STORAGE_KEYS.GAME_MODE
    );
    keysToClear.forEach(key => localStorage.removeItem(key));
}

// --- Funções de UI ---
function updateMainTitle() {
    if (mainTitleElement) mainTitleElement.textContent = "Marcador Truco Acker Pro";
}
function updateFooterCredit() {
    if (footerCreditElement) footerCreditElement.textContent = "Desenvolvido por Jacson A Duarte";
}
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
    if (!dealerNameElement) return;
    const numExpectedPlayers = gameMode;
    if (playerNames.length === numExpectedPlayers && playerNames[currentDealerIndex]) {
        dealerNameElement.textContent = playerNames[currentDealerIndex];
    } else {
        dealerNameElement.textContent = `-- Defina os ${numExpectedPlayers} Jogadores --`;
    }
}

function updateScoreSectionTitles() {
    if (gameMode === 4) {
        if (teamNameNosElement) teamNameNosElement.textContent = teamNameNos;
        if (teamNameElesElement) teamNameElesElement.textContent = teamNameEles;
    } else { // Modo 2 jogadores
        if (teamNameNosElement) teamNameNosElement.textContent = playerNames[0] || "Jogador 1";
        if (teamNameElesElement) teamNameElesElement.textContent = playerNames[1] || "Jogador 2";
    }
    updateDurationHistoryDisplay();
}

function updateUIBasedOnMode() {
    if (!dealerSectionElement || !editTeamsButton || !changeGameModeButton || !editPlayersButton || !nextDealerButtonElement) return;

    // Seção do Embaralhador e botão Próximo Embaralhador ficam sempre visíveis
    dealerSectionElement.classList.remove('hidden');
    nextDealerButtonElement.classList.remove('hidden');
    // Opcional: Alterar o texto do título da seção do embaralhador se desejar
    // if(dealerSectionElement.querySelector('h3')) dealerSectionElement.querySelector('h3').textContent = gameMode === 4 ? "Embaralhador Atual:" : "Quem Embaralha:";


    if (gameMode === 4) {
        editTeamsButton.classList.remove('hidden');
        editPlayersButton.textContent = "Editar Nomes dos Jogadores (4)";
        changeGameModeButton.textContent = "Mudar para Modo 2 Jogadores";
    } else { // gameMode === 2
        editTeamsButton.classList.add('hidden'); // Oculta apenas no modo 2 jogadores
        editPlayersButton.textContent = "Editar Nomes dos Jogadores (2)";
        changeGameModeButton.textContent = "Mudar para Modo 4 Jogadores";
    }
    updateScoreSectionTitles();
    updateDealerDisplay();
}

function updateDurationHistoryDisplay() {
    if (!durationHistoryListElement) return;
    durationHistoryListElement.innerHTML = '';
    if (matchDurationHistory.length === 0) {
        durationHistoryListElement.innerHTML = '<li>Nenhuma partida concluída nesta sessão.</li>';
        return;
    }
    for (let i = matchDurationHistory.length - 1; i >= 0; i--) {
        const entry = matchDurationHistory[i];
        const formattedTime = formatTime(entry.duration);
        const listItem = document.createElement('li');
        let winnerDisplayName;
        // Usa nomes de equipe/jogador corretos com base no modo da partida registrada
        if (entry.mode === 4) {
            winnerDisplayName = entry.winner === 'nos' ? teamNameNos : teamNameEles;
        } else { // entry.mode === 2
            // Para partidas antigas de 2 jogadores, precisamos ter certeza que playerNames está carregado corretamente
            // ou ter uma forma de buscar os nomes daquele momento. Por simplicidade, usamos os atuais se disponíveis.
            const p1Name = (entry.playerNames && entry.playerNames[0]) ? entry.playerNames[0] : (playerNames[0] || "Jogador 1");
            const p2Name = (entry.playerNames && entry.playerNames[1]) ? entry.playerNames[1] : (playerNames[1] || "Jogador 2");
            winnerDisplayName = entry.winner === 'nos' ? p1Name : p2Name;
        }
        listItem.textContent = `Partida ${i + 1} (${winnerDisplayName} - ${entry.mode}P): ${formattedTime} `;
        const winnerIcon = document.createElement('span');
        winnerIcon.classList.add('winner-icon', entry.winner);
        winnerIcon.textContent = 'V';
        listItem.appendChild(winnerIcon);
        durationHistoryListElement.appendChild(listItem);
    }
}

function updateSoundButtonIcon() {
    if (soundToggleButton) soundToggleButton.textContent = isSoundOn ? '🔊' : '🔇';
}

// --- Síntese de Voz ---
function speakText(text, cancelPrevious = true, callback = null) {
    if (!isSoundOn || !('speechSynthesis' in window)) {
        if (callback) callback();
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR'; utterance.rate = 1.0; utterance.pitch = 1.0;
    if (callback) {
        utterance.onend = callback;
        utterance.onerror = () => { console.warn("Erro na síntese de voz."); if (callback) callback(); };
    }
    if (cancelPrevious && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setTimeout(() => window.speechSynthesis.speak(utterance), 50);
    } else {
        window.speechSynthesis.speak(utterance);
    }
}

// --- Cronômetro ---
function formatTime(ms) {
    if (ms === null || ms < 0) return "--:--";
    let s = Math.floor(ms / 1000), h = Math.floor(s / 3600);
    s %= 3600; let m = Math.floor(s / 60); s %= 60;
    return `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function startTimer() {
    stopTimer(); gameStartTime = Date.now();
    if (currentTimerElement) currentTimerElement.textContent = formatTime(0);
    timerIntervalId = setInterval(() => {
        if (gameStartTime && currentTimerElement) currentTimerElement.textContent = formatTime(Date.now() - gameStartTime);
        else { clearInterval(timerIntervalId); timerIntervalId = null; }
    }, 1000);
    requestWakeLock();
}
function stopTimer() {
    let d = null; if (gameStartTime) d = Date.now() - gameStartTime;
    if (timerIntervalId) { clearInterval(timerIntervalId); timerIntervalId = null; }
    gameStartTime = null; releaseWakeLock(); return d;
}
function resetCurrentTimerDisplay() { stopTimer(); if (currentTimerElement) currentTimerElement.textContent = formatTime(0); }

// --- Wake Lock API ---
async function requestWakeLock() {
    if ('wakeLock' in navigator) try { if (!wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => wakeLock = null); } } catch (e) { wakeLock = null; }
}
async function releaseWakeLock() { if (wakeLock) try { await wakeLock.release(); } catch (e) { /*Ignora*/ } finally { wakeLock = null; } }
document.addEventListener('visibilitychange', async () => { if (document.visibilityState === 'visible' && gameStartTime) await requestWakeLock(); });

// --- Gerenciamento de Nomes ---
function getPlayerNames(isModeChangeOrInitialSetup = false) {
    const oldPlayerNames = [...playerNames];
    const numPlayersToDefine = gameMode;
    const newPlayerNames = [];
    let msgAction = isModeChangeOrInitialSetup ? `Definindo jogadores para o modo de ${numPlayersToDefine} jogadores:` : `Editando nomes dos jogadores (${numPlayersToDefine}):`;
    alert(msgAction);

    for (let i = 0; i < numPlayersToDefine; i++) {
        let defaultNameSuggestion = `Jogador ${i + 1}`;
        // Se está editando e já existe um nome válido, sugere ele.
        // Se é mudança de modo ou setup inicial e oldPlayerNames tem algo (de um modo anterior), não usa.
        let currentNameForPrompt = (oldPlayerNames[i] && !isModeChangeOrInitialSetup && oldPlayerNames[i] !== defaultNameSuggestion && oldPlayerNames.length === numPlayersToDefine) ? oldPlayerNames[i] : defaultNameSuggestion;

        let playerName = prompt(`Nome do Jogador ${i + 1}:`, currentNameForPrompt);

        if (playerName === null) {
            if (isModeChangeOrInitialSetup || oldPlayerNames.length !== numPlayersToDefine) { // Se cancelou durante setup de novo modo ou se o array antigo não bate com o modo atual
                playerNames = Array(numPlayersToDefine).fill(null).map((_, j) => `Jogador ${j + 1}`);
                alert("Configuração cancelada. Usando nomes padrão.");
            } else { // Cancelou edição, mantém nomes antigos
                playerNames = oldPlayerNames;
                alert("Edição cancelada.");
            }
            updateScoreSectionTitles(); updateDealerDisplay(); return;
        }
        while (!playerName.trim()) {
            alert("Nome inválido.");
            playerName = prompt(`Nome do Jogador ${i + 1}:`, defaultNameSuggestion); // Volta para sugestão genérica
            if (playerName === null) {
                 if (isModeChangeOrInitialSetup || oldPlayerNames.length !== numPlayersToDefine) {
                    playerNames = Array(numPlayersToDefine).fill(null).map((_, j) => `Jogador ${j + 1}`);
                    alert("Configuração cancelada. Usando nomes padrão.");
                } else {
                    playerNames = oldPlayerNames;
                    alert("Edição cancelada.");
                }
                updateScoreSectionTitles(); updateDealerDisplay(); return;
            }
        }
        newPlayerNames.push(playerName.trim());
    }
    playerNames = newPlayerNames;
    updateScoreSectionTitles();

    if (isModeChangeOrInitialSetup) { // Sempre reseta dealer no setup de modo/inicial
        currentDealerIndex = 0;
    }
    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex); // Salva dealer para ambos os modos

    updateDealerDisplay();
    speakText(isModeChangeOrInitialSetup ? `Modo de ${gameMode} jogadores configurado. ${playerNames[currentDealerIndex] || `Jogador ${currentDealerIndex+1}`} embaralha.` : "Nomes dos jogadores atualizados.");

    if (isModeChangeOrInitialSetup && !gameStartTime && playerNames.length === numPlayersToDefine && playerNames.every(name => !name.startsWith("Jogador "))) {
        startTimer();
    }
}

function editTeamNames() {
    if (gameMode !== 4) return;
    let newNameNos = prompt("Novo nome para a Equipe 1 (Nós):", teamNameNos);
    if (newNameNos && newNameNos.trim()) teamNameNos = newNameNos.trim();
    let newNameEles = prompt("Novo nome para a Equipe 2 (Eles):", teamNameEles);
    if (newNameEles && newNameEles.trim()) teamNameEles = newNameEles.trim();
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    updateScoreSectionTitles();
    speakText("Nomes das equipes atualizados.");
}

// --- Lógica do Embaralhador ---
function advanceDealer(speakAnnounce = false, callback = null) {
    const numExpectedPlayers = gameMode;
    if (playerNames.length !== numExpectedPlayers || playerNames.some(name => name.startsWith("Jogador "))) {
        if (speakAnnounce) alert(`Defina os ${numExpectedPlayers} nomes dos jogadores primeiro.`);
        if (callback) callback();
        return false;
    }
    currentDealerIndex = (currentDealerIndex + 1) % numExpectedPlayers; // Modulo 2 ou 4
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay();
    if (speakAnnounce && playerNames[currentDealerIndex]) {
        speakText(`Próximo a embaralhar: ${playerNames[currentDealerIndex]}`, true, callback);
    } else if (callback) {
        callback();
    }
    return true;
}

// --- Lógica Principal de Pontuação ---
function changeScore(team, amount, speakPointText = null) {
    const numExpectedPlayers = gameMode;
    if (playerNames.length !== numExpectedPlayers || playerNames.some(name => name.startsWith("Jogador "))) {
        alert(`Por favor, defina os nomes dos ${numExpectedPlayers} jogadores antes de pontuar.`);
        getPlayerNames(true);
        return false;
    }

    if (isInitialState && amount > 0 && !gameStartTime) startTimer();

    let currentTargetScore = team === 'nos' ? scoreNos : scoreEles;
    if ((amount > 0 && currentTargetScore >= maxScore) || (amount < 0 && currentTargetScore <= 0 && amount !== -currentTargetScore)) {
        if (amount < 0 && currentTargetScore > 0 && (currentTargetScore + amount < 0)) {}
        else if (!(amount > 0 && currentTargetScore >= maxScore)) return false;
    }

    undoState = {
        sN: scoreNos, sE: scoreEles, psN: prevScoreNos, psE: prevScoreEles,
        dI: currentDealerIndex, isI: isInitialState,
        gST: gameStartTime ? Date.now() - gameStartTime : null,
        mde: gameMode
    };
    if (undoButton) undoButton.disabled = false;

    prevScoreNos = scoreNos; prevScoreEles = scoreEles; isInitialState = false;
    let winner = null;

    if (team === 'nos') {
        scoreNos = Math.min(maxScore, Math.max(0, scoreNos + amount));
        if (scoreNos >= maxScore) winner = 'nos';
    } else {
        scoreEles = Math.min(maxScore, Math.max(0, scoreEles + amount));
        if (scoreEles >= maxScore) winner = 'eles';
    }
    updateCurrentGameDisplay();

    const afterPointSpeechAction = () => {
        const finalAction = () => { if (winner) processMatchEnd(winner); else saveGameState(); };

        if (amount > 0) { // Avança dealer apenas se adicionou pontos
            advanceDealer(false, () => { // Callback do advanceDealer
                if (playerNames.length === gameMode && playerNames[currentDealerIndex]) {
                    speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, false, finalAction);
                } else {
                    finalAction();
                }
            });
        } else {
             finalAction();
        }
    };

    if (speakPointText && amount !== 0) {
        let fullSpeakText = speakPointText;
        if (gameMode === 4) { // Adiciona "para Nós/Eles" apenas no modo 4
            fullSpeakText += (team === 'nos' ? ` para ${teamNameNos}` : ` para ${teamNameEles}`);
        } else { // Modo 2 jogadores, "para [Nome do Jogador]"
            fullSpeakText += (team === 'nos' ? ` para ${playerNames[0]}` : ` para ${playerNames[1]}`);
        }
        speakText(fullSpeakText, true, afterPointSpeechAction);
    } else {
        afterPointSpeechAction();
    }
    return true;
}

// --- Funcionalidade Desfazer ---
function undoLastAction() {
    if (undoState) {
        if (undoState.mde !== undefined && undoState.mde !== gameMode) {
            alert("Não é possível desfazer após trocar o modo de jogo.");
            speakText("Não é possível desfazer após trocar o modo de jogo.", true);
            undoState = null; if (undoButton) undoButton.disabled = true; return;
        }
        scoreNos = undoState.sN; scoreEles = undoState.sE;
        prevScoreNos = undoState.psN; prevScoreEles = undoState.psE;
        isInitialState = undoState.isI;
        currentDealerIndex = undoState.dI; // Restaura dealer para o modo que estava

        if (undoState.gST !== null && !gameStartTime) {
            gameStartTime = Date.now() - undoState.gST; startTimer();
        } else if (undoState.gST === null && gameStartTime) {
            resetCurrentTimerDisplay();
        }
        updateCurrentGameDisplay(); updateDealerDisplay(); updateScoreSectionTitles(); saveGameState();
        undoState = null; if (undoButton) undoButton.disabled = true;
        speakText("Ação desfeita.", true);
    } else {
        speakText("Nada para desfazer.", true); if (undoButton) undoButton.disabled = true;
    }
}

// --- Fim de Partida e Preparação para Próximo Jogo ---
function processMatchEnd(winnerTeam) {
    const durationMs = stopTimer();
    if (durationMs !== null) {
        matchDurationHistory.push({ duration: durationMs, winner: winnerTeam, mode: gameMode, playerNames: [...playerNames] }); // Salva nomes da partida
        saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory);
        updateDurationHistoryDisplay();
    }
    undoState = null; if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay();

    let winnerNameDisplay;
    let winningTerm = "ganhou"; // Padrão para singular (modo 2P)
    if (gameMode === 4) {
        winnerNameDisplay = winnerTeam === 'nos' ? teamNameNos : teamNameEles;
        winningTerm = winnerTeam === 'nos' ? "ganhou" : "ganharam"; // Ajusta para Nós/Eles
    } else {
        winnerNameDisplay = winnerTeam === 'nos' ? (playerNames[0] || "Jogador 1") : (playerNames[1] || "Jogador 2");
    }

    const speechCallback = () => {
        let alertMsg = `${winnerNameDisplay} venceu a partida!\n\nDuração: ${formatTime(durationMs)}\nPlacar de Partidas:\n`;
        if (gameMode === 4) {
            alertMsg += `${teamNameNos}: ${matchesWonNos}\n${teamNameEles}: ${matchesWonEles}`;
        } else {
            alertMsg += `${playerNames[0] || "J1"}: ${matchesWonNos}\n${playerNames[1] || "J2"}: ${matchesWonEles}`;
        }
        alert(alertMsg);
        updateMatchWinsDisplay();
        prepareNextGame();
    };

    setTimeout(() => {
        if (winnerTeam === 'nos') matchesWonNos++; else matchesWonEles++;
        saveData(STORAGE_KEYS.MATCHES_NOS, matchesWonNos);
        saveData(STORAGE_KEYS.MATCHES_ELES, matchesWonEles);
        speakText(`${winnerNameDisplay} ${winningTerm} a partida!`, true, speechCallback);
    }, 850);
}

function prepareNextGame(isModeChange = false) {
    scoreNos = 0; scoreEles = 0; prevScoreNos = 0; prevScoreEles = 0;
    isInitialState = true; undoState = null;
    if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay(); resetCurrentTimerDisplay();

    if (isModeChange) {
        matchesWonNos = 0; matchesWonEles = 0; updateMatchWinsDisplay();
        playerNames = []; // Limpa para redefinição
        if (gameMode === 4) { teamNameNos = "Nós"; teamNameEles = "Eles"; }
        getPlayerNames(true); // true para setup de modo
    }
    saveGameState();
    if (!isModeChange && playerNames.length === gameMode && playerNames.every(name => !name.startsWith("Jogador "))) {
        setTimeout(startTimer, 150);
    }
}

// --- Funções de Reset ---
function resetCurrentGame(isModeChange = false) {
    if (isModeChange || confirm("Tem certeza que deseja reiniciar apenas o jogo atual (placar de 0 a 12)?")) {
        undoState = null; if (undoButton) undoButton.disabled = true;
        prepareNextGame(isModeChange);
        if (!isModeChange) speakText("Jogo atual reiniciado.");
    }
}

function resetAllScores() {
    if (confirm("!!! ATENÇÃO !!!\n\nZerar TODO o placar?")) {
        clearSavedGameData();
        matchesWonNos = 0; matchesWonEles = 0;
        if (gameMode === 4) { teamNameNos = "Nós"; teamNameEles = "Eles"; }
        playerNames = []; currentDealerIndex = 0; matchDurationHistory = [];
        undoState = null; if (undoButton) undoButton.disabled = true;
        updateMatchWinsDisplay(); updateScoreSectionTitles(); updateDealerDisplay();
        updateDurationHistoryDisplay();
        prepareNextGame(true); // Força redefinição de nomes para o modo atual
        speakText("Placar geral zerado. Configure os nomes.");
    }
}

// --- Tema e Som ---
function setTheme(themeName) {
    if (!bodyElement || !themeToggleButton || !themeMeta) return;
    bodyElement.className = themeName + '-theme'; currentTheme = themeName;
    saveData(STORAGE_KEYS.THEME, themeName);
    themeToggleButton.textContent = themeName === 'dark' ? '☀️' : '🌙';
    themeMeta.content = themeName === 'dark' ? '#1f1f1f' : '#f0f0f0';
}
function toggleTheme() { setTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
function setSound(soundOn) { isSoundOn = soundOn; saveData(STORAGE_KEYS.SOUND_ON, isSoundOn); updateSoundButtonIcon(); }
function toggleSound() { setSound(!isSoundOn); if (isSoundOn) speakText("Som ativado.", true); else if (window.speechSynthesis) window.speechSynthesis.cancel(); }

// --- Funcionalidades Adicionais ---
function toggleGameMode() {
    if (confirm(`Deseja mudar para o modo de ${gameMode === 4 ? 2 : 4} jogadores?\nO jogo atual e o placar de partidas ganhas serão reiniciados.`)) {
        gameMode = (gameMode === 4 ? 2 : 4);
        saveGameMode();
        updateUIBasedOnMode();
        resetCurrentGame(true);
        speakText(`Modo alterado para ${gameMode} jogadores. Configure os nomes.`, true);
    }
}

function exportHistoryToWhatsApp() {
    const numExpectedPlayers = gameMode;
    if (playerNames.length !== numExpectedPlayers || playerNames.some(name => name.startsWith("Jogador "))) {
        alert(`Defina os nomes dos ${numExpectedPlayers} jogadores e jogue algumas partidas antes de exportar.`); return;
    }
    let historyText = `*Histórico - Marcador Truco Acker Pro (${gameMode} Jogadores)*\n\n`;
    if (gameMode === 4) {
        historyText += `*Equipes:*\n${teamNameNos} vs ${teamNameEles}\n`;
        historyText += `*Jogadores ${teamNameNos}:* ${playerNames[0]}, ${playerNames[2]}\n`;
        historyText += `*Jogadores ${teamNameEles}:* ${playerNames[1]}, ${playerNames[3]}\n\n`;
    } else {
        historyText += `*Jogadores:*\n${playerNames[0]} vs ${playerNames[1]}\n\n`;
    }
    const scoreTeam1Name = gameMode === 4 ? teamNameNos : (playerNames[0] || "J1");
    const scoreTeam2Name = gameMode === 4 ? teamNameEles : (playerNames[1] || "J2");
    historyText += `*Placar Atual:*\n${scoreTeam1Name}: ${scoreNos}\n${scoreTeam2Name}: ${scoreEles}\n\n`;
    historyText += `*Partidas Ganhas:*\n${scoreTeam1Name}: ${matchesWonNos}\n${scoreTeam2Name}: ${matchesWonEles}\n\n`;

    if (matchDurationHistory.length > 0) {
        historyText += "*Histórico de Duração das Partidas:*\n";
        matchDurationHistory.forEach((entry, index) => {
            let winnerDisplayNameExport;
            if (entry.mode === 4) {
                winnerDisplayNameExport = entry.winner === 'nos' ? (entry.playerNames && entry.playerNames.length === 4 ? teamNameNos : "Equipe 1") : (entry.playerNames && entry.playerNames.length === 4 ? teamNameEles : "Equipe 2");
            } else {
                winnerDisplayNameExport = entry.winner === 'nos' ? (entry.playerNames && entry.playerNames[0] ? entry.playerNames[0] : "Jogador 1") : (entry.playerNames && entry.playerNames[1] ? entry.playerNames[1] : "Jogador 2");
            }
            historyText += `Partida ${index + 1} (${winnerDisplayNameExport} - ${entry.mode}P): ${formatTime(entry.duration)}\n`;
        });
    } else { historyText += "Nenhuma partida concluída para exibir no histórico de durações.\n"; }
    historyText += `\nEmbaralhador Atual: ${dealerNameElement.textContent}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(historyText)}`, '_blank');
    speakText("Histórico pronto para compartilhar.", true);
}

// --- Event Listeners ---
function addEventListeners() {
    document.querySelector('.teams').addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (btn?.dataset.team && btn.dataset.amount) changeScore(btn.dataset.team, parseInt(btn.dataset.amount), btn.dataset.speak);
    });
    themeToggleButton?.addEventListener('click', toggleTheme);
    soundToggleButton?.addEventListener('click', toggleSound);
    nextDealerButtonElement?.addEventListener('click', () => advanceDealer(true));
    undoButton?.addEventListener('click', undoLastAction);
    editTeamsButton?.addEventListener('click', editTeamNames);
    editPlayersButton?.addEventListener('click', () => getPlayerNames(false));
    document.getElementById('reset-game-btn')?.addEventListener('click', () => resetCurrentGame(false));
    document.getElementById('reset-all-btn')?.addEventListener('click', resetAllScores);
    changeGameModeButton?.addEventListener('click', toggleGameMode);
    exportHistoryButton?.addEventListener('click', exportHistoryToWhatsApp);
}

// --- Inicialização ---
function initializeApp() {
    mainTitleElement = document.querySelector('h1');
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
    editPlayersButton = document.getElementById('edit-players-btn');
    editTeamsButton = document.getElementById('edit-teams-btn');
    changeGameModeButton = document.getElementById('change-game-mode-btn');
    exportHistoryButton = document.getElementById('export-history-btn');
    footerCreditElement = document.querySelector('.footer-credit p');
    dealerSectionElement = document.querySelector('.dealer-section');
    nextDealerButtonElement = document.getElementById('next-dealer-btn');

    loadGameSettings(); setTheme(currentTheme); setSound(isSoundOn);
    loadGameData();
    updateUIBasedOnMode();
    updateMainTitle(); updateFooterCredit(); updateCurrentGameDisplay();
    updateMatchWinsDisplay();
    updateDurationHistoryDisplay();
    if (undoButton) undoButton.disabled = (undoState === null);
    addEventListeners();

    const numExpectedPlayers = gameMode;
    if (playerNames.length !== numExpectedPlayers || playerNames.some(name => name.startsWith("Jogador "))) {
        setTimeout(() => getPlayerNames(true), 300);
    } else {
        resetCurrentTimerDisplay();
        if (gameStartTime) {
            const elapsed = Date.now() - gameStartTime;
            currentTimerElement.textContent = formatTime(elapsed);
            startTimer();
        }
    }
}
document.addEventListener('DOMContentLoaded', initializeApp);
