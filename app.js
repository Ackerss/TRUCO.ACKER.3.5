// --- Variáveis Globais ---
let scoreNos = 0, scoreEles = 0;
let prevScoreNos = 0, prevScoreEles = 0; // Placar anterior do jogo atual
let isInitialState = true; // Controla se é a primeira ação de pontuação do jogo
const maxScore = 12; // Pontuação máxima para vencer uma partida
let matchesWonNos = 0, matchesWonEles = 0; // Contador de partidas ganhas
let playerNames = []; // Array para os nomes dos 4 jogadores
let currentDealerIndex = 0; // Índice do jogador que está embaralhando
let timerIntervalId = null; // ID do intervalo do cronômetro
let gameStartTime = null; // Timestamp do início do jogo atual
let matchDurationHistory = []; // Histórico da duração das partidas concluídas
let undoState = null; // Objeto para armazenar o estado anterior para o "Desfazer"
let teamNameNos = "Nós"; // Nome padrão da equipe 1
let teamNameEles = "Eles"; // Nome padrão da equipe 2
let currentTheme = 'dark'; // Tema atual (dark/light)
let wakeLock = null; // Referência para a API Wake Lock
let isSoundOn = true; // Controle de som para narração

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
    SOUND_ON: 'truco_acker_soundOn'
};

// --- Elementos do DOM (cacheados para performance) ---
let scoreNosElement, scoreElesElement, prevScoreNosElement, prevScoreElesElement,
    matchWinsNosElement, matchWinsElesElement, dealerNameElement, currentTimerElement,
    durationHistoryListElement, undoButton, teamNameNosElement, teamNameElesElement,
    themeToggleButton, soundToggleButton, bodyElement, themeMeta, mainTitleElement,
    editPlayersButton, changeGameModeButton, exportHistoryButton, footerCreditElement;

// --- Funções de Armazenamento Local (localStorage) ---
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Erro ao salvar dados no localStorage:", key, e);
    }
}

function loadData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error("Erro ao carregar dados do localStorage:", key, e);
        return defaultValue;
    }
}

function saveGameState() {
    // Salva o estado relevante do jogo no localStorage
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
}

function loadGameSettings() {
    const savedTheme = loadData(STORAGE_KEYS.THEME, 'dark');
    currentTheme = savedTheme;
    const savedSound = loadData(STORAGE_KEYS.SOUND_ON, true);
    isSoundOn = savedSound;
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
    const keysToClear = [
        STORAGE_KEYS.SCORE_NOS, STORAGE_KEYS.SCORE_ELES,
        STORAGE_KEYS.PREV_SCORE_NOS, STORAGE_KEYS.PREV_SCORE_ELES,
        STORAGE_KEYS.IS_INITIAL, STORAGE_KEYS.MATCHES_NOS,
        STORAGE_KEYS.MATCHES_ELES, STORAGE_KEYS.PLAYER_NAMES,
        STORAGE_KEYS.DEALER_INDEX, STORAGE_KEYS.TEAM_NAME_NOS,
        STORAGE_KEYS.TEAM_NAME_ELES, STORAGE_KEYS.DURATION_HISTORY
    ];
    keysToClear.forEach(key => localStorage.removeItem(key));
}

// --- Funções de Atualização da Interface do Usuário (Display) ---
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
    if (dealerNameElement) {
        dealerNameElement.textContent = (playerNames.length === 4 && playerNames[currentDealerIndex])
            ? playerNames[currentDealerIndex]
            : "-- Defina os Jogadores --";
    }
}

function updateDurationHistoryDisplay() {
    if (!durationHistoryListElement) return;
    durationHistoryListElement.innerHTML = '';
    if (matchDurationHistory.length === 0) {
        durationHistoryListElement.innerHTML = '<li>Nenhuma partida concluída nesta sessão.</li>';
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
        const winnerName = entry.winner === 'nos' ? teamNameNos : teamNameEles;
        listItem.textContent = `Partida ${i + 1} (${winnerName}): ${formattedTime} `;

        const winnerIcon = document.createElement('span');
        winnerIcon.classList.add('winner-icon', entry.winner);
        winnerIcon.textContent = 'V';
        winnerIcon.setAttribute('aria-label', `Vencedor: ${winnerName}`);
        listItem.appendChild(winnerIcon);
        durationHistoryListElement.appendChild(listItem);
    }
}

function updateTeamNameDisplay() {
    if (teamNameNosElement) teamNameNosElement.textContent = teamNameNos;
    if (teamNameElesElement) teamNameElesElement.textContent = teamNameEles;
    updateDurationHistoryDisplay();
}

function updateSoundButtonIcon() {
    if (soundToggleButton) soundToggleButton.textContent = isSoundOn ? '🔊' : '🔇';
}

// --- Síntese de Voz (MODIFICADA para incluir callback) ---
function speakText(text, cancelPrevious = true, callback = null) {
    if (!isSoundOn || !('speechSynthesis' in window)) {
        if (callback) callback(); // Chama o callback mesmo se o som estiver desligado ou indisponível
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (callback) {
        utterance.onend = callback; // Executa o callback quando a fala terminar
        utterance.onerror = callback; // Executa o callback também em caso de erro, para não bloquear a próxima ação
    }

    if (cancelPrevious && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        // O cancelamento é assíncrono. Adicionar um pequeno delay antes de falar
        // pode ajudar, mas o onend no utterance anterior (se houvesse) seria mais robusto.
        // Para este caso, como estamos cancelando TUDO, podemos falar logo em seguida,
        // mas o ideal é que a lógica de encadeamento use os callbacks.
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 50); // Pequeno delay para o cancelamento processar
    } else {
        window.speechSynthesis.speak(utterance);
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
    return (hours > 0) ? `${String(hours).padStart(2, '0')}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
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
    if (gameStartTime) durationMs = Date.now() - gameStartTime;
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
            if (!wakeLock) {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => { wakeLock = null; });
            }
        } catch (err) { wakeLock = null; }
    }
}

async function releaseWakeLock() {
    if (wakeLock) {
        try { await wakeLock.release(); } catch (err) { /* Ignora */ }
        finally { wakeLock = null; }
    }
}

document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && gameStartTime) await requestWakeLock();
});

// --- Gerenciamento de Nomes ---
function getPlayerNames(isInitialSetup = false) {
    const oldPlayerNames = [...playerNames];
    const newPlayerNames = [];
    let msg = isInitialSetup ? "Vamos definir os 4 jogadores para o rodízio do embaralhador:" : "Editando nomes dos jogadores:";
    alert(msg);

    for (let i = 0; i < 4; i++) {
        let defaultName = (oldPlayerNames[i] && !isInitialSetup && oldPlayerNames[i] !== `Jogador ${i + 1}`) ? oldPlayerNames[i] : `Jogador ${i + 1}`;
        let playerName = prompt(`Nome do Jogador ${i + 1}:`, defaultName);

        if (playerName === null) {
            playerNames = isInitialSetup ? ["Jogador 1", "Jogador 2", "Jogador 3", "Jogador 4"] : oldPlayerNames;
            alert(isInitialSetup ? "Configuração cancelada. Usando nomes padrão." : "Edição cancelada.");
            updateDealerDisplay();
            if (isInitialSetup && !gameStartTime && playerNames.every(name => !name.startsWith("Jogador "))) startTimer();
            return;
        }
        while (!playerName.trim()) {
            alert("Nome inválido.");
            playerName = prompt(`Nome do Jogador ${i + 1}:`, defaultName);
            if (playerName === null) {
                playerNames = isInitialSetup ? ["Jogador 1", "Jogador 2", "Jogador 3", "Jogador 4"] : oldPlayerNames;
                alert(isInitialSetup ? "Configuração cancelada. Usando nomes padrão." : "Edição cancelada.");
                updateDealerDisplay();
                if (isInitialSetup && !gameStartTime && playerNames.every(name => !name.startsWith("Jogador "))) startTimer();
                return;
            }
        }
        newPlayerNames.push(playerName.trim());
    }
    playerNames = newPlayerNames;
    if (isInitialSetup) currentDealerIndex = 0;

    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay();
    speakText(isInitialSetup ? `Iniciando. Embaralhador: ${playerNames[currentDealerIndex]}` : "Nomes dos jogadores atualizados.");
    if (isInitialSetup && !gameStartTime && playerNames.every(name => !name.startsWith("Jogador "))) startTimer();
}

function editTeamNames() {
    let newNameNos = prompt("Novo nome para a Equipe 1 (Nós):", teamNameNos);
    if (newNameNos && newNameNos.trim()) teamNameNos = newNameNos.trim();
    let newNameEles = prompt("Novo nome para a Equipe 2 (Eles):", teamNameEles);
    if (newNameEles && newNameEles.trim()) teamNameEles = newNameEles.trim();
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    updateTeamNameDisplay();
    speakText("Nomes das equipes atualizados.");
}

// --- Lógica do Embaralhador ---
function advanceDealer(speakAnnounce = false, callback = null) {
    if (playerNames.length !== 4 || playerNames.some(name => name.startsWith("Jogador "))) {
        if (speakAnnounce) alert("Defina os 4 nomes dos jogadores primeiro para usar o rodízio.");
        if (callback) callback(); // Chama callback mesmo se não avançar
        return false;
    }
    currentDealerIndex = (currentDealerIndex + 1) % 4;
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay();
    if (speakAnnounce && playerNames[currentDealerIndex]) {
        speakText(`Próximo a embaralhar: ${playerNames[currentDealerIndex]}`, true, callback);
    } else if (callback) {
        callback(); // Chama o callback se não for anunciar
    }
    return true;
}

// --- Lógica Principal de Pontuação (MODIFICADA para usar callback na fala) ---
function changeScore(team, amount, speakPointText = null) {
    if (playerNames.length !== 4 || playerNames.some(name => name.startsWith("Jogador "))) {
        alert("Por favor, defina os nomes dos 4 jogadores antes de iniciar a pontuação.");
        getPlayerNames(true);
        return false;
    }

    if (isInitialState && amount > 0 && !gameStartTime) startTimer();

    let currentTargetScore = team === 'nos' ? scoreNos : scoreEles;
    if ((amount > 0 && currentTargetScore >= maxScore) || (amount < 0 && currentTargetScore <= 0 && amount !== -currentTargetScore)) {
        if (amount < 0 && currentTargetScore > 0 && (currentTargetScore + amount < 0)) { /* não faz nada */ }
        else if (!(amount > 0 && currentTargetScore >= maxScore)) return false;
    }

    undoState = {
        sN: scoreNos, sE: scoreEles, psN: prevScoreNos, psE: prevScoreEles,
        dI: currentDealerIndex, isI: isInitialState,
        gST: gameStartTime ? Date.now() - gameStartTime : null
    };
    if (undoButton) undoButton.disabled = false;

    prevScoreNos = scoreNos; prevScoreEles = scoreEles;
    isInitialState = false;
    let winner = null;

    if (team === 'nos') {
        scoreNos = Math.min(maxScore, Math.max(0, scoreNos + amount));
        if (scoreNos >= maxScore) winner = 'nos';
    } else {
        scoreEles = Math.min(maxScore, Math.max(0, scoreEles + amount));
        if (scoreEles >= maxScore) winner = 'eles';
    }

    updateCurrentGameDisplay();

    // Define a função que será chamada após a fala do ponto (ou imediatamente se não houver fala de ponto)
    const afterPointSpeechAction = () => {
        if (amount > 0) { // Avança dealer apenas se adicionou pontos
            advanceDealer(false, () => { // Passa um callback para advanceDealer se precisar de ações após a fala do dealer
                if (playerNames.length === 4 && playerNames[currentDealerIndex]) {
                     // A fala do dealer já está encadeada se speakAnnounce=true em advanceDealer
                     // Se advanceDealer não falou (speakAnnounce=false), e precisamos falar aqui:
                     if (!speakPointText) { // Se não teve fala de ponto, o dealer é a primeira fala da sequência.
                        speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, true, () => {
                            if (winner) processMatchEnd(winner); else saveGameState();
                        });
                        return; // Evita chamar processMatchEnd/saveGameState duas vezes
                     } else { // Se teve fala de ponto, a fala do dealer é a segunda.
                        speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, false, () => { // false para não cancelar a si mesma se chamada rapidamente
                           if (winner) processMatchEnd(winner); else saveGameState();
                        });
                        return;
                     }
                }
                // Se não avançou dealer ou não tem nome, vai direto para o fim do jogo/salvar
                if (winner) processMatchEnd(winner); else saveGameState();
            });
        } else { // Se não adicionou pontos (removeu ou zerou)
            if (winner) processMatchEnd(winner); else saveGameState();
        }
    };

    if (speakPointText && amount !== 0) {
        speakText(speakPointText, true, afterPointSpeechAction); // Fala o ponto e depois executa afterPointSpeechAction
    } else {
        afterPointSpeechAction(); // Executa diretamente se não houver fala de ponto
    }
    return true;
}

// --- Funcionalidade Desfazer ---
function undoLastAction() {
    if (undoState) {
        scoreNos = undoState.sN; scoreEles = undoState.sE;
        prevScoreNos = undoState.psN; prevScoreEles = undoState.psE;
        currentDealerIndex = undoState.dI; isInitialState = undoState.isI;

        if (undoState.gST !== null && !gameStartTime) {
            gameStartTime = Date.now() - undoState.gST;
            startTimer();
        } else if (undoState.gST === null && gameStartTime) {
            resetCurrentTimerDisplay();
        }

        updateCurrentGameDisplay(); updateDealerDisplay(); saveGameState();
        undoState = null; if (undoButton) undoButton.disabled = true;
        speakText("Ação desfeita.", true);
    } else {
        speakText("Nada para desfazer.", true);
        if (undoButton) undoButton.disabled = true;
    }
}

// --- Fim de Partida e Preparação para Próximo Jogo ---
function processMatchEnd(winnerTeam) {
    const durationMs = stopTimer();
    if (durationMs !== null) {
        matchDurationHistory.push({ duration: durationMs, winner: winnerTeam });
        saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory);
        updateDurationHistoryDisplay();
    }
    undoState = null; if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay();

    const winnerNameDisplay = winnerTeam === 'nos' ? teamNameNos : teamNameEles;
    const speechCallback = () => { // Callback após a fala da vitória
        alert(`${winnerNameDisplay} venceu a partida!\n\nDuração: ${formatTime(durationMs)}\nPlacar de Partidas: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`);
        updateMatchWinsDisplay();
        prepareNextGame();
    };
    
    // Atraso para o usuário ver o placar de 12 antes da fala e do alerta
    setTimeout(() => {
        if (winnerTeam === 'nos') matchesWonNos++; else matchesWonEles++;
        saveData(STORAGE_KEYS.MATCHES_NOS, matchesWonNos);
        saveData(STORAGE_KEYS.MATCHES_ELES, matchesWonEles);
        speakText(`${winnerNameDisplay} ${winnerTeam === 'nos' ? 'ganhou' : 'ganharam'} a partida!`, true, speechCallback);
    }, 850);
}

function prepareNextGame() {
    scoreNos = 0; scoreEles = 0; prevScoreNos = 0; prevScoreEles = 0;
    isInitialState = true; undoState = null;
    if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay(); saveGameState();
    resetCurrentTimerDisplay();
    if (playerNames.length === 4 && !playerNames.some(name => name.startsWith("Jogador "))) {
        setTimeout(startTimer, 150);
    }
}

// --- Funções de Reset ---
function resetCurrentGame() {
    if (confirm("Tem certeza que deseja reiniciar apenas o jogo atual (placar de 0 a 12)?\nIsso não afetará as partidas ganhas nem o embaralhador.")) {
        undoState = null; if (undoButton) undoButton.disabled = true;
        prepareNextGame();
        speakText("Jogo atual reiniciado.");
    }
}

function resetAllScores() {
    if (confirm("!!! ATENÇÃO !!!\n\nTem certeza que deseja ZERAR TODO o placar?\n\nIsso inclui:\n- Partidas ganhas\n- Jogo atual\n- Nomes dos jogadores e equipes\n- Histórico de tempos\n\nEsta ação não pode ser desfeita.")) {
        clearSavedGameData();
        matchesWonNos = 0; matchesWonEles = 0; playerNames = []; currentDealerIndex = 0;
        teamNameNos = "Nós"; teamNameEles = "Eles"; matchDurationHistory = [];
        undoState = null; if (undoButton) undoButton.disabled = true;
        updateMatchWinsDisplay(); updateDealerDisplay(); updateDurationHistoryDisplay();
        updateTeamNameDisplay(); prepareNextGame();
        getPlayerNames(true);
        speakText("Placar geral, nomes e histórico zerados. Começando de novo!");
    }
}

// --- Tema (Claro/Escuro) ---
function setTheme(themeName) {
    if (!bodyElement || !themeToggleButton || !themeMeta) return;
    bodyElement.className = themeName + '-theme'; currentTheme = themeName;
    saveData(STORAGE_KEYS.THEME, themeName);
    themeToggleButton.textContent = themeName === 'dark' ? '☀️' : '🌙';
    themeMeta.content = themeName === 'dark' ? '#1f1f1f' : '#f0f0f0';
}
function toggleTheme() { setTheme(currentTheme === 'dark' ? 'light' : 'dark'); }

// --- Som (Liga/Desliga Narração) ---
function setSound(soundOn) {
    isSoundOn = soundOn; saveData(STORAGE_KEYS.SOUND_ON, isSoundOn);
    updateSoundButtonIcon();
}
function toggleSound() {
    setSound(!isSoundOn);
    if (isSoundOn) speakText("Som ativado.", true);
    else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// --- Novas Funcionalidades ---
function handleChangeGameMode() {
    alert("Funcionalidade 'Trocar Modo de Jogo' ainda em desenvolvimento.");
    speakText("Trocar modo de jogo em desenvolvimento.", true);
}

function exportHistoryToWhatsApp() {
    if (playerNames.length !== 4 || playerNames.some(name => name.startsWith("Jogador "))) {
        alert("Defina os nomes dos jogadores e jogue algumas partidas antes de exportar.");
        return;
    }
    let historyText = `*Histórico do Marcador Truco Acker Pro*\n\n`;
    historyText += `*Equipes:*\n${teamNameNos} vs ${teamNameEles}\n\n`;
    historyText += `*Jogadores:*\n1. ${playerNames[0]}\n2. ${playerNames[1]}\n3. ${playerNames[2]}\n4. ${playerNames[3]}\n\n`;
    historyText += `*Placar Atual:*\n${teamNameNos}: ${scoreNos}\n${teamNameEles}: ${scoreEles}\n\n`;
    historyText += `*Partidas Ganhas:*\n${teamNameNos}: ${matchesWonNos}\n${teamNameEles}: ${matchesWonEles}\n\n`;
    if (matchDurationHistory.length > 0) {
        historyText += "*Histórico de Duração das Partidas:*\n";
        matchDurationHistory.forEach((entry, index) => {
            const winnerName = entry.winner === 'nos' ? teamNameNos : teamNameEles;
            historyText += `Partida ${index + 1} (${winnerName}): ${formatTime(entry.duration)}\n`;
        });
    } else {
        historyText += "Nenhuma partida concluída para exibir no histórico de durações.\n";
    }
    historyText += `\nEmbaralhador Atual: ${dealerNameElement.textContent}`;
    const encodedText = encodeURIComponent(historyText);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    speakText("Histórico pronto para compartilhar no WhatsApp.", true);
}

// --- Adicionar Event Listeners ---
function addEventListeners() {
    document.querySelector('.teams').addEventListener('click', event => {
        const button = event.target.closest('button');
        if (button && button.dataset.team && button.dataset.amount) {
            changeScore(button.dataset.team, parseInt(button.dataset.amount, 10), button.dataset.speak);
        }
    });
    themeToggleButton?.addEventListener('click', toggleTheme);
    soundToggleButton?.addEventListener('click', toggleSound);
    document.getElementById('next-dealer-btn')?.addEventListener('click', () => advanceDealer(true));
    undoButton?.addEventListener('click', undoLastAction);
    document.getElementById('edit-teams-btn')?.addEventListener('click', editTeamNames);
    editPlayersButton?.addEventListener('click', () => getPlayerNames(false));
    document.getElementById('reset-game-btn')?.addEventListener('click', resetCurrentGame);
    document.getElementById('reset-all-btn')?.addEventListener('click', resetAllScores);
    changeGameModeButton?.addEventListener('click', handleChangeGameMode);
    exportHistoryButton?.addEventListener('click', exportHistoryToWhatsApp);
}

// --- Inicialização do Aplicativo ---
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
    changeGameModeButton = document.getElementById('change-game-mode-btn');
    exportHistoryButton = document.getElementById('export-history-btn');
    footerCreditElement = document.querySelector('.footer-credit p');

    loadGameSettings(); setTheme(currentTheme); setSound(isSoundOn);
    loadGameData();
    updateMainTitle(); updateFooterCredit(); updateCurrentGameDisplay();
    updateMatchWinsDisplay(); updateTeamNameDisplay(); updateDealerDisplay();
    updateDurationHistoryDisplay();
    if (undoButton) undoButton.disabled = (undoState === null);
    addEventListeners();

    if (playerNames.length !== 4 || playerNames.some(name => name.startsWith("Jogador "))) {
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
