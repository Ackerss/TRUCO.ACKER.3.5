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
let gameMode = 4;

// --- Constantes Chaves localStorage ---
const STORAGE_KEYS = {
    SCORE_NOS: 'truco_acker_scoreNos_v2', // Adicionado _v2 para evitar conflito com versões antigas se necessário
    SCORE_ELES: 'truco_acker_scoreEles_v2',
    PREV_SCORE_NOS: 'truco_acker_prevScoreNos_v2',
    PREV_SCORE_ELES: 'truco_acker_prevScoreEles_v2',
    IS_INITIAL: 'truco_acker_isInitial_v2',
    MATCHES_NOS: 'truco_acker_matchesNos_v2',
    MATCHES_ELES: 'truco_acker_matchesEles_v2',
    PLAYER_NAMES: 'truco_acker_playerNames_v2',
    DEALER_INDEX: 'truco_acker_dealerIndex_v2',
    TEAM_NAME_NOS: 'truco_acker_teamNameNos_v2',
    TEAM_NAME_ELES: 'truco_acker_teamNameEles_v2',
    DURATION_HISTORY: 'truco_acker_durationHistory_v2',
    THEME: 'truco_acker_theme_v2',
    SOUND_ON: 'truco_acker_soundOn_v2',
    GAME_MODE: 'truco_acker_gameMode_v2'
};

// --- Elementos do DOM ---
let scoreNosElement, scoreElesElement, prevScoreNosElement, prevScoreElesElement,
    matchWinsNosElement, matchWinsElesElement, dealerNameElement, currentTimerElement,
    durationHistoryListElement, undoButton, teamNameNosElement, teamNameElesElement,
    themeToggleButton, soundToggleButton, bodyElement, themeMeta, mainTitleElement,
    editPlayersButton, editTeamsButton, changeGameModeButton, exportHistoryButton, footerTextElement, // Renomeado para footerTextElement
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
function saveGameMode() { saveData(STORAGE_KEYS.GAME_MODE, gameMode); }
function loadGameMode() { gameMode = loadData(STORAGE_KEYS.GAME_MODE, 4); }

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
    if (gameMode === 4) {
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
    currentDealerIndex = loadData(STORAGE_KEYS.DEALER_INDEX, 0);
    if (gameMode === 4) {
        teamNameNos = loadData(STORAGE_KEYS.TEAM_NAME_NOS, "Nós");
        teamNameEles = loadData(STORAGE_KEYS.TEAM_NAME_ELES, "Eles");
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
    if (mainTitleElement) mainTitleElement.textContent = "Marcador Truco Acker"; // NOME ALTERADO
}
function updateFooterCredit() {
    if (footerTextElement) footerTextElement.textContent = "Desenvolvido por Jacson A Duarte"; // TEXTO ALTERADO
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
    if (playerNames.length === numExpectedPlayers && playerNames[currentDealerIndex] && playerNames[currentDealerIndex].trim() !== "") {
        dealerNameElement.textContent = playerNames[currentDealerIndex];
    } else {
        dealerNameElement.textContent = `-- Defina os ${numExpectedPlayers} Jogadores --`;
    }
}
function updateScoreSectionTitles() {
    if (gameMode === 4) {
        if (teamNameNosElement) teamNameNosElement.textContent = teamNameNos;
        if (teamNameElesElement) teamNameElesElement.textContent = teamNameEles;
    } else {
        if (teamNameNosElement) teamNameNosElement.textContent = playerNames[0] || "Jogador 1";
        if (teamNameElesElement) teamNameElesElement.textContent = playerNames[1] || "Jogador 2";
    }
    updateDurationHistoryDisplay();
}
function updateUIBasedOnMode() {
    if (!dealerSectionElement || !editTeamsButton || !changeGameModeButton || !editPlayersButton || !nextDealerButtonElement) return;
    dealerSectionElement.classList.remove('hidden');
    nextDealerButtonElement.classList.remove('hidden');
    if (gameMode === 4) {
        editTeamsButton.classList.remove('hidden');
        editPlayersButton.textContent = "Editar Nomes dos Jogadores (4)";
        changeGameModeButton.textContent = "Mudar para Modo 2 Jogadores";
    } else {
        editTeamsButton.classList.add('hidden');
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
        const entryPlayerNames = entry.playerNames || []; // Nomes da partida, se salvos

        if (entry.mode === 4) {
            winnerDisplayName = entry.winner === 'nos' ? (entry.teamNameNos || teamNameNos) : (entry.teamNameEles || teamNameEles);
        } else {
            winnerDisplayName = entry.winner === 'nos' ? (entryPlayerNames[0] || "Jogador 1") : (entryPlayerNames[1] || "Jogador 2");
        }
        // REMOVIDO O "- XP" DA EXIBIÇÃO
        listItem.textContent = `Partida ${i + 1} (${winnerDisplayName}): ${formattedTime} `;
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
        if (callback) callback(); return;
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
        let currentNameForPrompt = (oldPlayerNames[i] && !isModeChangeOrInitialSetup && oldPlayerNames.length === numPlayersToDefine) ? oldPlayerNames[i] : defaultNameSuggestion;
        let playerName = prompt(`Nome do Jogador ${i + 1}:`, currentNameForPrompt);

        if (playerName === null) { // Usuário clicou em "Cancelar" no prompt
            if (isModeChangeOrInitialSetup || oldPlayerNames.length !== numPlayersToDefine || !oldPlayerNames.every(name => name && name.trim() !== "")) {
                // Se é setup inicial/mudança de modo OU se os nomes antigos não são válidos para o modo atual, usa padrão.
                playerNames = Array(numPlayersToDefine).fill(null).map((_, j) => `Jogador ${j + 1}`);
                alert("Configuração cancelada/inválida. Usando nomes padrão.");
            } else { // Cancelou edição, mas nomes antigos eram válidos, então mantém.
                playerNames = oldPlayerNames;
                alert("Edição cancelada. Nomes anteriores mantidos.");
            }
            updateScoreSectionTitles(); updateDealerDisplay(); return;
        }

        // Se o usuário pressionou OK sem alterar (ou limpou e pressionou OK), playerName será o default ou ""
        // Se playerName.trim() for vazio, significa que o usuário limpou o campo ou inseriu apenas espaços.
        // Nesse caso, usamos o defaultNameSuggestion. Caso contrário, usamos o que ele digitou (ou deixou).
        newPlayerNames.push(playerName.trim() === "" ? defaultNameSuggestion : playerName.trim());
    }
    playerNames = newPlayerNames;
    updateScoreSectionTitles();

    if (isModeChangeOrInitialSetup) currentDealerIndex = 0;
    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay();
    speakText(isModeChangeOrInitialSetup ? `Modo de ${gameMode} jogadores configurado. ${playerNames[currentDealerIndex] || `Jogador ${currentDealerIndex + 1}`} embaralha.` : "Nomes dos jogadores atualizados.");

    // Inicia o timer se for setup inicial/mudança de modo, o timer não estiver rodando,
    // e os nomes foram definidos (não são mais os "Jogador X" genéricos se o usuário os editou)
    if (isModeChangeOrInitialSetup && !gameStartTime && playerNames.length === numPlayersToDefine) {
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
    // Permite avançar mesmo com nomes padrão "Jogador X"
    if (playerNames.length !== numExpectedPlayers) {
        if (speakAnnounce) alert(`Defina os ${numExpectedPlayers} nomes dos jogadores primeiro.`);
        if (callback) callback(); return false;
    }
    currentDealerIndex = (currentDealerIndex + 1) % numExpectedPlayers;
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
    // REMOVIDA A VALIDAÇÃO playerNames.some(name => name.startsWith("Jogador "))
    // para permitir jogar com nomes padrão.
    if (playerNames.length !== numExpectedPlayers) {
        alert(`Por favor, defina os nomes dos ${numExpectedPlayers} jogadores antes de pontuar.`);
        getPlayerNames(true); return false;
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
        gST: gameStartTime ? Date.now() - gameStartTime : null, mde: gameMode
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
        if (amount > 0) {
            advanceDealer(false, () => {
                if (playerNames.length === gameMode && playerNames[currentDealerIndex]) {
                    speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, false, finalAction);
                } else { finalAction(); }
            });
        } else { finalAction(); }
    };

    if (speakPointText && amount !== 0) {
        let fullSpeakText = speakPointText;
        let targetName;
        if (team === 'nos') {
            targetName = gameMode === 4 ? teamNameNos : playerNames[0];
        } else {
            targetName = gameMode === 4 ? teamNameEles : playerNames[1];
        }
        fullSpeakText += ` para ${targetName}`;
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
        isInitialState = undoState.isI; currentDealerIndex = undoState.dI;
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
        matchDurationHistory.push({
            duration: durationMs,
            winner: winnerTeam,
            mode: gameMode,
            playerNames: [...playerNames], // Salva cópia dos nomes da partida
            teamNameNos: gameMode === 4 ? teamNameNos : null, // Salva nomes das equipes se modo 4
            teamNameEles: gameMode === 4 ? teamNameEles : null
        });
        saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory);
        updateDurationHistoryDisplay();
    }
    undoState = null; if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay();

    let winnerNameDisplay, winningTerm = "ganhou";
    if (gameMode === 4) {
        winnerNameDisplay = winnerTeam === 'nos' ? teamNameNos : teamNameEles;
        // winningTerm já é "ganhou" ou "ganharam" dependendo do pronome da equipe, mas para simplificar:
        // Se quiser diferenciar "Nós ganhamos" de "Eles ganharam"
        // winningTerm = winnerTeam === 'nos' ? "ganhamos" : "ganharam";
    } else {
        winnerNameDisplay = winnerTeam === 'nos' ? (playerNames[0] || "Jogador 1") : (playerNames[1] || "Jogador 2");
    }

    const speechCallback = () => {
        let alertMsg = `${winnerNameDisplay} venceu a partida!\n\nDuração: ${formatTime(durationMs)}\nPlacar de Partidas:\n`;
        const p1Display = gameMode === 4 ? teamNameNos : (playerNames[0] || "J1");
        const p2Display = gameMode === 4 ? teamNameEles : (playerNames[1] || "J2");
        alertMsg += `${p1Display}: ${matchesWonNos}\n${p2Display}: ${matchesWonEles}`;
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
        playerNames = [];
        if (gameMode === 4) { teamNameNos = "Nós"; teamNameEles = "Eles"; }
        getPlayerNames(true);
    }
    saveGameState();
    if (!isModeChange && playerNames.length === gameMode) { // Não verifica mais se começa com "Jogador"
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
        prepareNextGame(true);
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
    // Permite exportar mesmo com nomes padrão "Jogador X"
    if (playerNames.length !== numExpectedPlayers) {
        alert(`Defina os nomes dos ${numExpectedPlayers} jogadores antes de exportar.`); return;
    }
    let historyText = `*Histórico - Marcador Truco Acker (${gameMode} Jogadores)*\n\n`;
    const currentP1Name = playerNames[0] || "Jogador 1";
    const currentP2Name = playerNames[1] || "Jogador 2";
    const currentP3Name = playerNames[2] || "Jogador 3";
    const currentP4Name = playerNames[3] || "Jogador 4";

    if (gameMode === 4) {
        historyText += `*Equipes:*\n${teamNameNos} vs ${teamNameEles}\n`;
        historyText += `*Jogadores ${teamNameNos}:* ${currentP1Name}, ${currentP3Name}\n`;
        historyText += `*Jogadores ${teamNameEles}:* ${currentP2Name}, ${currentP4Name}\n\n`;
    } else {
        historyText += `*Jogadores:*\n${currentP1Name} vs ${currentP2Name}\n\n`;
    }
    const scoreTeam1Name = gameMode === 4 ? teamNameNos : currentP1Name;
    const scoreTeam2Name = gameMode === 4 ? teamNameEles : currentP2Name;
    historyText += `*Placar Atual:*\n${scoreTeam1Name}: ${scoreNos}\n${scoreTeam2Name}: ${scoreEles}\n\n`;
    historyText += `*Partidas Ganhas (Sessão):*\n${scoreTeam1Name}: ${matchesWonNos}\n${scoreTeam2Name}: ${matchesWonEles}\n\n`;

    // Filtra histórico de duração para o modo de jogo ATUAL
    const filteredDurationHistory = matchDurationHistory.filter(entry => entry.mode === gameMode);

    if (filteredDurationHistory.length > 0) {
        historyText += `*Histórico de Duração (Modo ${gameMode}P):*\n`;
        filteredDurationHistory.forEach((entry, index) => {
            let winnerDisplayNameExport;
            const entryPNames = entry.playerNames || [];
            const entryTNameNos = entry.teamNameNos;
            const entryTNameEles = entry.teamNameEles;

            if (entry.mode === 4) {
                winnerDisplayNameExport = entry.winner === 'nos' ? (entryTNameNos || "Equipe 1") : (entryTNameEles || "Equipe 2");
            } else { // entry.mode === 2
                winnerDisplayNameExport = entry.winner === 'nos' ? (entryPNames[0] || "Jogador 1") : (entryPNames[1] || "Jogador 2");
            }
            historyText += `Partida ${index + 1} (${winnerDisplayNameExport}): ${formatTime(entry.duration)}\n`;
        });
    } else { historyText += `Nenhuma partida concluída neste modo (${gameMode}P) para exibir no histórico de durações.\n`; }
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
    mainTitleElement = document.getElementById('main-title'); // Usando ID
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
    footerTextElement = document.getElementById('footer-text'); // Usando ID
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
    if (playerNames.length !== numExpectedPlayers || !playerNames.every(name => name && name.trim() !== "")) { // Verifica se todos os nomes estão preenchidos
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
