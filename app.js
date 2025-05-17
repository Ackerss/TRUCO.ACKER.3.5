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
let teamNameNos = "Nós"; // Nome da equipe 1
let teamNameEles = "Eles"; // Nome da equipe 2
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
    playerModeModal, select2PlayersBtn, select4PlayersBtn, changeGameModeBtn;

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
    // playerNames, currentDealerIndex, etc., serão resetados nas suas respectivas funções.
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

    // Cria uma cópia e inverte para mostrar o mais recente primeiro
    matchDurationHistory.slice().reverse().forEach((entry, index) => {
        const formattedTime = formatTime(entry.duration);
        const listItem = document.createElement('li');
        const matchNumber = matchDurationHistory.length - index; // Número da partida correto
        listItem.textContent = `Partida ${matchNumber}: ${formattedTime} `;

        const winnerIcon = document.createElement('span');
        winnerIcon.classList.add('winner-icon', entry.winner); // 'nos' ou 'eles'
        winnerIcon.textContent = 'V'; // Ícone de vencedor
        winnerIcon.setAttribute('aria-label', `Vencedor: ${entry.winner === 'nos' ? teamNameNos : teamNameEles}`);
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

// --- Modal de Seleção de Modo de Jogo ---
function showPlayerModeModal() {
    if (playerModeModal) playerModeModal.style.display = 'flex';
}

function hidePlayerModeModal() {
    if (playerModeModal) playerModeModal.style.display = 'none';
}

// Chamada quando o usuário seleciona 2 ou 4 jogadores no modal
function selectPlayerMode(selectedMode) {
    const newNumberOfPlayers = parseInt(selectedMode, 10);

    // Só processa se o modo realmente mudou ou se era o estado inicial (numberOfPlayers === 0)
    if (newNumberOfPlayers !== numberOfPlayers || numberOfPlayers === 0) {
        numberOfPlayers = newNumberOfPlayers;
        saveData(STORAGE_KEYS.NUMBER_OF_PLAYERS, numberOfPlayers);

        // Reseta informações dependentes do número de jogadores
        playerNames = [];
        currentDealerIndex = 0;
        saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames); // Salva a lista de nomes vazia
        saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex); // Salva o dealer resetado

        resetCurrentGameScoresAndState(); // Reseta placar, timer, etc., do jogo atual
        updateDealerDisplay(); // Atualiza o nome do dealer (deve mostrar "-- Defina os Nomes --")

        hidePlayerModeModal();
        // Pequeno atraso para garantir que o modal desapareça antes do prompt de nomes
        setTimeout(() => {
            getPlayerNames(); // Pede os nomes dos jogadores para o novo modo
        }, 100);
    } else {
        hidePlayerModeModal(); // Se o modo não mudou, apenas esconde o modal
    }
}

// --- Síntese de Voz ---
function speakText(text, cancelPrevious = true) {
    if (!isSoundOn || !('speechSynthesis' in window)) return;

    if (cancelPrevious && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    // Pequeno atraso para garantir que o cancelamento ocorra antes da nova fala
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0; // Velocidade normal
        utterance.pitch = 1.0; // Tom normal
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

    return (hours > 0)
        ? `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`
        : `${minutes}:${seconds}`;
}

function startTimer() {
    stopTimer(); // Garante que qualquer timer anterior seja limpo
    gameStartTime = Date.now();
    if (currentTimerElement) currentTimerElement.textContent = "00:00"; // Reseta display
    timerIntervalId = setInterval(() => {
        if (gameStartTime && currentTimerElement) {
            const elapsed = Date.now() - gameStartTime;
            currentTimerElement.textContent = formatTime(elapsed);
        } else {
            // Se gameStartTime for null (timer parado), limpa o intervalo
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
    }, 1000); // Atualiza a cada segundo
    requestWakeLock(); // Tenta manter a tela acesa
}

function stopTimer() {
    let durationMs = null;
    if (gameStartTime) {
        durationMs = Date.now() - gameStartTime; // Calcula duração
    }
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
    gameStartTime = null; // Reseta a hora de início
    releaseWakeLock(); // Libera o bloqueio de tela
    return durationMs; // Retorna a duração calculada
}

function resetCurrentTimerDisplay() {
    stopTimer(); // Para o timer e reseta variáveis relacionadas
    if (currentTimerElement) currentTimerElement.textContent = "00:00"; // Reseta display
}

// --- Wake Lock API (Manter a tela acesa) ---
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            if (wakeLock === null) { // Só pede se não tiver um ativo
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    // console.log('Wake Lock foi liberado.');
                    wakeLock = null;
                });
                // console.log('Wake Lock ativado.');
            }
        } catch (err) {
            // console.error(`Wake Lock falhou: ${err.name}, ${err.message}`);
            wakeLock = null;
        }
    }
}

async function releaseWakeLock() {
    if (wakeLock !== null) {
        try {
            await wakeLock.release();
        } catch (err) {
            // console.error(`Erro ao liberar Wake Lock: ${err.name}, ${err.message}`);
        } finally {
            wakeLock = null;
        }
    }
}

// Lida com a visibilidade da aba/app para gerenciar o WakeLock
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden' && wakeLock !== null) {
        await releaseWakeLock(); // Libera se ficar oculto e o wakelock estiver ativo
    } else if (document.visibilityState === 'visible' && gameStartTime) {
        // Se voltar a ficar visível e um jogo estava em andamento (timer rodando), tenta reativar
        await requestWakeLock();
    }
});

// --- Nomes dos Jogadores ---
function getPlayerNames() {
    if (numberOfPlayers === 0) {
        // console.warn("Tentativa de obter nomes sem definir o número de jogadores.");
        showPlayerModeModal(); // Se por algum motivo chegou aqui sem modo, mostra o modal
        return;
    }
    playerNames = []; // Limpa array de nomes anterior
    const promptMessage = `Defina os ${numberOfPlayers} jogadores para o rodízio do embaralhador...`;
    alert(promptMessage);

    for (let i = 1; i <= numberOfPlayers; i++) {
        let playerNameInput = prompt(`Nome do Jogador ${i}:`);
        // Loop até que um nome válido seja inserido
        while (!playerNameInput || playerNameInput.trim() === "") {
            alert("Nome inválido. Por favor, digite um nome.");
            playerNameInput = prompt(`Nome do Jogador ${i}:`);
        }
        playerNames.push(playerNameInput.trim());
    }
    currentDealerIndex = 0; // O primeiro jogador da lista começa embaralhando
    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay(); // Atualiza o nome do embaralhador na tela

    if (playerNames.length > 0) {
        speakText(`Iniciando novo jogo. O primeiro a embaralhar é ${playerNames[0]}`);
        // Se o timer não estiver rodando E for o estado inicial (acabamos de configurar)
        if (!gameStartTime && isInitialState) {
            startTimer(); // Inicia o cronômetro do jogo
        }
    }
}

// Verifica se os nomes dos jogadores precisam ser definidos para o modo atual
function ensurePlayerNamesAreSet() {
    if (numberOfPlayers > 0 && playerNames.length !== numberOfPlayers) {
        // Atraso para garantir que a interface do usuário esteja pronta
        setTimeout(() => {
            alert(`Por favor, defina os nomes para o modo de ${numberOfPlayers} jogadores.`);
            getPlayerNames();
        }, 150);
    } else if (numberOfPlayers > 0 && playerNames.length === numberOfPlayers && isInitialState && !gameStartTime) {
        // Nomes definidos, modo selecionado, estado inicial, timer não rodando -> iniciar timer
        startTimer();
    }
}

// --- Editar Nomes das Equipes ---
function editTeamNames() {
    let newNameNos = prompt("Novo nome para a Equipe 1 (Nós):", teamNameNos);
    if (newNameNos && newNameNos.trim() !== "") teamNameNos = newNameNos.trim();

    let newNameEles = prompt("Novo nome para a Equipe 2 (Eles):", teamNameEles);
    if (newNameEles && newNameEles.trim() !== "") teamNameEles = newNameEles.trim();

    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    updateTeamNameDisplay();
    updateDurationHistoryDisplay(); // Atualiza histórico que pode conter nomes de equipes
    speakText("Nomes das equipes atualizados.");
}

// --- Avançar Embaralhador ---
function advanceDealer(speakAnnounce = false) {
    if (numberOfPlayers === 0 || playerNames.length !== numberOfPlayers) {
        if (speakAnnounce) {
            alert(`Primeiro defina o modo de jogo e os ${numberOfPlayers || 'devidos'} nomes dos jogadores.`);
        }
        return false; // Não avança se não tem jogadores definidos corretamente
    }
    currentDealerIndex = (currentDealerIndex + 1) % numberOfPlayers; // Avança e volta pro 0 (circular)
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    updateDealerDisplay();
    if (speakAnnounce && playerNames.length > 0 && playerNames[currentDealerIndex]) {
        speakText(`Próximo a embaralhar: ${playerNames[currentDealerIndex]}`, true);
    }
    return true;
}

// --- Lógica Principal de Pontuação ---
function changeScore(team, amount, speakPointText = null) {
    // Verifica se o jogo está configurado (modo e nomes)
    if (numberOfPlayers === 0 || playerNames.length !== numberOfPlayers) {
        alert("Por favor, configure o modo de jogo e os nomes dos jogadores antes de pontuar.");
        if (numberOfPlayers === 0) {
            showPlayerModeModal();
        } else {
            getPlayerNames();
        }
        return false; // Impede a pontuação
    }

    // Inicia o timer na primeira pontuação válida, se não estiver rodando e os nomes estiverem definidos
    if (isInitialState && amount > 0 && !gameStartTime && playerNames.length === numberOfPlayers) {
        startTimer();
    }

    let currentTargetScore = team === 'nos' ? scoreNos : scoreEles;
    // Impede pontuação se já ganhou ou se vai ficar negativo (exceto se for -1 e score > 0)
    if ((amount > 0 && currentTargetScore >= maxScore) || (amount < 0 && currentTargetScore <= 0)) {
        return false; // Não altera a pontuação
    }

    // Salva o estado atual para um possível "Desfazer"
    undoState = {
        sN: scoreNos, sE: scoreEles,
        psN: prevScoreNos, psE: prevScoreEles,
        dI: currentDealerIndex, isI: isInitialState,
        gST_elapsed: gameStartTime ? (Date.now() - gameStartTime) : null // Salva tempo decorrido
    };
    if (undoButton) undoButton.disabled = false; // Habilita o botão Desfazer

    // Atualiza os placares anteriores ANTES de mudar os atuais
    prevScoreNos = scoreNos;
    prevScoreEles = scoreEles;
    isInitialState = false; // Marca que uma ação já foi feita neste jogo
    let winner = null; // Variável para verificar se houve vencedor

    // Aplica a mudança de pontuação
    if (team === 'nos') {
        scoreNos = Math.min(maxScore, Math.max(0, scoreNos + amount));
        if (scoreNos === maxScore) winner = 'nos';
    } else {
        scoreEles = Math.min(maxScore, Math.max(0, scoreEles + amount));
        if (scoreEles === maxScore) winner = 'eles';
    }
    updateCurrentGameDisplay(); // Atualiza a exibição do placar

    // Gira o embaralhador e anuncia por voz apenas se pontos foram ADICIONADOS
    if (amount > 0) {
        if (speakPointText) speakText(speakPointText, true);
        const dealerAdvanced = advanceDealer(false); // Avança o dealer sem anunciar agora
        if (dealerAdvanced && playerNames.length > 0 && playerNames[currentDealerIndex]) {
            // Adiciona um pequeno atraso para anunciar o novo embaralhador
            setTimeout(() => speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, true), 800);
        }
    }
    // Se houve vencedor, processa o fim da partida
    if (winner) {
        processMatchEnd(winner);
    } else {
        // Se o jogo continua, salva o novo estado
        saveGameState();
    }
    return true; // Indica que a pontuação foi (potencialmente) alterada
}

// --- Desfazer Última Ação ---
function undoLastAction() {
    if (undoState) {
        scoreNos = undoState.sN; scoreEles = undoState.sE;
        prevScoreNos = undoState.psN; prevScoreEles = undoState.psE;
        currentDealerIndex = undoState.dI; isInitialState = undoState.isI;

        // Restaura o estado do timer
        if (undoState.gST_elapsed !== null && !isInitialState) { // Se havia tempo e não voltou ao estado inicial
            stopTimer(); // Para qualquer timer atual
            gameStartTime = Date.now() - undoState.gST_elapsed; // Recalcula o início baseado no tempo decorrido salvo
            startTimer(); // Reinicia o timer
            if (currentTimerElement) currentTimerElement.textContent = formatTime(undoState.gST_elapsed); // Atualiza display
        } else if (isInitialState) { // Se desfez para o estado inicial absoluto, para e reseta o timer
            resetCurrentTimerDisplay();
        }
        // Se undoState.gST_elapsed é null, significa que o timer não estava rodando, então não faz nada com ele.

        updateCurrentGameDisplay();
        updateDealerDisplay();
        saveGameState(); // Salva o estado restaurado

        undoState = null; // Limpa o estado de desfazer
        if (undoButton) undoButton.disabled = true; // Desabilita o botão
        speakText("Última ação desfeita", true);
    } else {
        speakText("Nada para desfazer", true);
        if (undoButton) undoButton.disabled = true;
    }
}

// --- Fim de Partida ---
function processMatchEnd(winnerTeam) {
    const durationMs = stopTimer(); // Para o cronômetro e pega a duração
    if (durationMs !== null) {
        matchDurationHistory.push({ duration: durationMs, winner: winnerTeam });
        saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory);
        updateDurationHistoryDisplay();
    }
    undoState = null; // Limpa estado de desfazer
    if (undoButton) undoButton.disabled = true; // Desabilita desfazer
    updateCurrentGameDisplay(); // Mostra o placar final (ex: 12 pontos)

    // Atraso para permitir que o usuário veja o placar final
    setTimeout(() => {
        const winnerNameDisplay = winnerTeam === 'nos' ? teamNameNos : teamNameEles;
        if (winnerTeam === 'nos') matchesWonNos++; else matchesWonEles++;
        saveData(STORAGE_KEYS.MATCHES_NOS, matchesWonNos);
        saveData(STORAGE_KEYS.MATCHES_ELES, matchesWonEles);

        // Pequeno atraso antes do alerta para o som de vitória tocar
        setTimeout(() => {
            speakText(`${winnerNameDisplay} ${winnerTeam === 'nos' ? 'ganhou' : 'ganharam'} a partida!`, true);
            alert(`${winnerNameDisplay} venceu a partida!\n\nDuração: ${formatTime(durationMs)}\nPlacar de partidas: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`);
            updateMatchWinsDisplay();
            prepareNextGame(); // Prepara para o próximo jogo
        }, 300);
    }, 850);
}

// --- Prepara Próximo Jogo (zera placares do jogo atual, reseta timer, etc.) ---
function prepareNextGame() {
    scoreNos = 0; scoreEles = 0;
    prevScoreNos = 0; prevScoreEles = 0;
    isInitialState = true; // Marca como início de um novo jogo
    undoState = null;
    if (undoButton) undoButton.disabled = true;
    updateCurrentGameDisplay(); // Mostra 0 a 0

    resetCurrentTimerDisplay(); // Para e reseta o display do timer

    // Se os jogadores já estão definidos para o modo atual, inicia o timer para o novo jogo
    if (numberOfPlayers > 0 && playerNames.length === numberOfPlayers) {
        setTimeout(() => {
            startTimer();
            saveGameState(); // Salva o estado agora que o timer (potencialmente) começou
        }, 100);
    } else {
        saveGameState(); // Salva o estado zerado mesmo sem timer (ex: se ainda não definiu nomes)
    }
}

// Função auxiliar para resetar o jogo atual sem pedir confirmação ao usuário
function resetCurrentGameScoresAndState() {
    undoState = null;
    if (undoButton) undoButton.disabled = true;
    prepareNextGame(); // Zera placares, reseta timer, etc.
}

// --- Funções de Reset ---
function resetCurrentGame() {
    // Verifica se o jogo está configurado antes de resetar
    if (numberOfPlayers === 0 || playerNames.length !== numberOfPlayers) {
        alert("Configure o modo de jogo e os nomes dos jogadores primeiro.");
        if (numberOfPlayers === 0) showPlayerModeModal(); else getPlayerNames();
        return;
    }
    if (confirm("Tem certeza que deseja reiniciar apenas o jogo atual (placar de 0 a 12)?")) {
        resetCurrentGameScoresAndState();
        speakText("Jogo atual reiniciado.");
    }
}

function resetAllScores() {
    if (confirm("!!! ATENÇÃO !!!\n\nTem certeza que deseja ZERAR TODO o placar?\n\nIsso inclui:\n- Partidas ganhas\n- Jogo atual\n- Nomes dos jogadores e modo de jogo\n- Histórico de tempos\n\nEsta ação não pode ser desfeita.")) {
        clearSavedGameData(); // Limpa TUDO do localStorage (exceto tema/som)

        // Reseta variáveis de estado para o padrão
        matchesWonNos = 0; matchesWonEles = 0;
        playerNames = []; currentDealerIndex = 0;
        teamNameNos = "Nós"; teamNameEles = "Eles";
        matchDurationHistory = [];
        // numberOfPlayers já foi resetado para 0 em clearSavedGameData()

        undoState = null; if (undoButton) undoButton.disabled = true;

        updateMatchWinsDisplay();
        updateDealerDisplay(); // Mostrará "-- Selecione o Modo --"
        updateDurationHistoryDisplay();
        updateTeamNameDisplay();
        resetCurrentGameScoresAndState(); // Zera o placar atual na tela e para o timer

        speakText("Placar geral e configurações zerados.");
        showPlayerModeModal(); // Força a seleção do modo de jogo novamente
    }
}

// --- Tema ---
function setTheme(themeName) {
    if (!bodyElement || !themeToggleButton || !themeMeta) return;
    bodyElement.className = themeName + '-theme'; // Aplica classe ao body
    currentTheme = themeName;
    saveData(STORAGE_KEYS.THEME, themeName);
    themeToggleButton.textContent = themeName === 'dark' ? '☀️' : '🌙'; // Atualiza ícone
    themeMeta.content = themeName === 'dark' ? '#1f1f1f' : '#f0f0f0'; // Cor da barra de status do navegador
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
        // Se desligou, cancela qualquer fala em andamento
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
}

// --- Adiciona Listeners de Eventos ---
function addEventListeners() {
    // Delegação de eventos para botões de pontuação (+1, -1, +3, etc.)
    document.querySelector('.teams').addEventListener('click', event => {
        const button = event.target.closest('button');
        if (button && button.dataset.team && button.dataset.amount) {
            changeScore(button.dataset.team, parseInt(button.dataset.amount, 10), button.dataset.speak);
        }
    });

    // Listeners para os outros botões
    document.getElementById('next-dealer-btn')?.addEventListener('click', () => advanceDealer(true));
    document.getElementById('undo-button')?.addEventListener('click', undoLastAction);
    document.getElementById('edit-teams-btn')?.addEventListener('click', editTeamNames);
    document.getElementById('reset-game-btn')?.addEventListener('click', resetCurrentGame);
    document.getElementById('reset-all-btn')?.addEventListener('click', resetAllScores);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('sound-toggle-btn')?.addEventListener('click', toggleSound);

    // Listeners do Modal de Seleção de Modo
    select2PlayersBtn?.addEventListener('click', () => selectPlayerMode(2));
    select4PlayersBtn?.addEventListener('click', () => selectPlayerMode(4));

    // Listener para o botão "Alterar Modo de Jogo"
    changeGameModeBtn?.addEventListener('click', () => {
        if (confirm("Mudar o modo de jogo irá reiniciar a partida atual, incluindo placares e nomes dos jogadores. Deseja continuar?")) {
            // Não precisa resetar numberOfPlayers aqui, pois selectPlayerMode fará isso se o modo mudar.
            // Apenas mostra o modal para nova seleção.
            showPlayerModeModal();
        }
    });
}

// --- Inicialização do Aplicativo ---
function initializeApp() {
    // Pega referências para os elementos do DOM uma vez
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

    // Carrega configurações e dados salvos
    loadGameSettings(); // Carrega tema, som, e numberOfPlayers (pode ser 0 se não salvo)
    loadGameData();     // Carrega o resto dos dados do jogo

    // Aplica tema e estado do som carregados
    setTheme(currentTheme);
    setSound(isSoundOn);

    // Atualiza todos os displays com os dados carregados
    updateCurrentGameDisplay();
    updateMatchWinsDisplay();
    updateTeamNameDisplay();
    updateDealerDisplay(); // Chamado antes de potencialmente pedir nomes
    updateDurationHistoryDisplay();
    if (undoButton) undoButton.disabled = (undoState === null); // Estado inicial do botão Desfazer

    addEventListeners(); // Adiciona os listeners aos botões e outros elementos

    // Lógica de inicialização do modo de jogo e nomes dos jogadores
    if (numberOfPlayers === 0) { // Se nenhum modo foi salvo/definido antes (primeira vez ou após reset total)
        setTimeout(showPlayerModeModal, 50); // Mostra o modal para seleção inicial com um pequeno delay
    } else {
        // Modo já definido (ex: 2 ou 4), verifica se os nomes correspondentes estão definidos
        ensurePlayerNamesAreSet();
        // Se o jogo não era inicial (isInitialState === false) e o timer não está rodando (ex: recarregou a página)
        // o timer é reiniciado pela primeira pontuação válida ou em prepareNextGame.
        // Apenas garante que o display do timer esteja correto se não houver jogo ativo.
        if (!gameStartTime && !isInitialState) {
             resetCurrentTimerDisplay();
        } else if (isInitialState) { // Se é o estado inicial (novo jogo), reseta o display do timer.
            resetCurrentTimerDisplay();
        }
    }
}

// Inicia tudo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);
