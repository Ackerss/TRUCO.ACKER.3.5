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

// --- Efeitos Sonoros ---
const soundEffects = {
    win: null,
    undo: null,
    point: null
};

// --- Constantes Chaves localStorage ---
const STORAGE_KEYS = {
    SCORE_NOS: 'truco_scoreNos', SCORE_ELES: 'truco_scoreEles',
    PREV_SCORE_NOS: 'truco_prevScoreNos', PREV_SCORE_ELES: 'truco_prevScoreEles',
    IS_INITIAL: 'truco_isInitial', MATCHES_NOS: 'truco_matchesNos',
    MATCHES_ELES: 'truco_matchesEles', PLAYER_NAMES: 'truco_playerNames',
    DEALER_INDEX: 'truco_dealerIndex', TEAM_NAME_NOS: 'truco_teamNameNos',
    TEAM_NAME_ELES: 'truco_teamNameEles', DURATION_HISTORY: 'truco_durationHistory',
    THEME: 'truco_theme', SOUND_ON: 'truco_soundOn',
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
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.error("Erro ao salvar dados:", key, e); }
}
function loadData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) { console.error("Erro ao carregar dados:", key, e); return defaultValue; }
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
    // A seção 'history-section' agora é a única responsável por mostrar o placar anterior
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
    if (matchDurationHistory.length === 0 && matchesWonNos === 0 && matchesWonEles === 0) {
        alert("Não há histórico ou placar geral para exportar.");
        return;
    }

    let texto = "📊 *Histórico de Partidas - Marcador Truco Pro*\n\n";
    if (matchDurationHistory.length > 0) {
        texto += "*Detalhes das Partidas:*\n";
        matchDurationHistory.forEach((entry, idx) => {
            let n = idx + 1;
            let time = formatTime(entry.duration);
            let winner = entry.winner === 'nos' ? teamNameNos : teamNameEles;
            texto += `*Partida ${n}:* Duração: ${time} - Vencedor: *${winner}*\n`;
        });
        texto += "\n";
    }

    texto += `*Placar Geral de Partidas Ganhas:*\n`;
    texto += `*${teamNameNos}:* ${matchesWonNos} partida(s)\n`;
    texto += `*${teamNameEles}:* ${matchesWonEles} partida(s)\n\n`;
    texto += `Jogo atual: ${teamNameNos} ${scoreNos} x ${scoreEles} ${teamNameEles}\n`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto)
            .then(() => {
                speakText("Histórico copiado para a área de transferência.", true);
                if (confirm("Histórico copiado! Deseja tentar compartilhar via WhatsApp?")) {
                    const whatsappMsg = encodeURIComponent(texto);
                    // Usar wa.me para link universal do WhatsApp
                    const whatsappUrl = `https://wa.me/?text=${whatsappMsg}`;
                    window.open(whatsappUrl, '_blank');
                }
            })
            .catch(err => {
                console.error('Falha ao copiar histórico: ', err);
                speakText("Falha ao copiar. Tente manualmente.", true);
                alert("Falha ao copiar o histórico. Você pode tentar selecionar e copiar manualmente o texto abaixo:\n\n" + texto);
            });
    } else {
        alert("Seu navegador não suporta a cópia automática. Por favor, copie o texto manualmente quando ele aparecer.");
        console.log("Histórico para cópia manual:\n" + texto);
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
        setTimeout(() => { getPlayerNames(); }, 100);
    } else {
        hidePlayerModeModal();
    }
}

// --- Síntese de Voz e Efeitos Sonoros ---
function speakText(text, cancelPrevious = true) {
    if (!isSoundOn || !('speechSynthesis' in window)) return;
    if (cancelPrevious && window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR'; utterance.rate = 1.0; utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }, cancelPrevious ? 50 : 0);
}
function playEffect(soundName) {
    if (isSoundOn && soundEffects[soundName] && soundEffects[soundName].src) {
        soundEffects[soundName].currentTime = 0;
        soundEffects[soundName].play().catch(e => console.warn("Erro ao tocar efeito sonoro:", e));
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

// --- Nomes dos Jogadores ---
function getPlayerNames() {
    if (numberOfPlayers === 0) { showPlayerModeModal(); return; }
    playerNames = [];
    alert(`Defina os ${numberOfPlayers} jogadores para o rodízio do embaralhador... (Nomes não podem ser repetidos)`);
    for (let i = 1; i <= numberOfPlayers; i++) {
        let playerNameInput;
        let isValidName = false;
        while(!isValidName) {
            playerNameInput = prompt(`Nome do Jogador ${i}:`);
            if (!playerNameInput || playerNameInput.trim() === "") {
                alert("Nome inválido. Por favor, digite um nome.");
            } else if (playerNames.includes(playerNameInput.trim())) {
                alert("Nome já utilizado. Escolha outro nome.");
            } else {
                isValidName = true;
            }
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
        if (numberOfPlayers === 4) { // Garante que em 4p, os nomes não sejam os de jogadores de um modo 2p anterior
            const p1IsTeamName = playerNames.length > 0 && teamNameNos === playerNames[0];
            const p2IsTeamName = playerNames.length > 1 && teamNameEles === playerNames[1];
            if ((p1IsTeamName && playerNames.length < 3) || (p2IsTeamName && playerNames.length < 3) || teamNameNos === teamNameEles) {
                 teamNameNos = "Nós";
                 teamNameEles = "Eles";
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
        showPlayerModeModal(); return;
    }
    if (numberOfPlayers === 2) {
        if (playerNames.length !== 2) {
            alert("Os nomes dos 2 jogadores ainda não foram definidos. Por favor, defina-os primeiro.");
            getPlayerNames(); return;
        }
        let newNameP1 = prompt("Novo nome para Jogador 1:", playerNames[0] || "Jogador 1");
        let newNameP2;
        if (newNameP1 && newNameP1.trim() !== "") {
            do {
                newNameP2 = prompt("Novo nome para Jogador 2:", playerNames[1] || "Jogador 2");
                if (newNameP2 && newNameP2.trim() !== "" && newNameP1.trim().toLowerCase() === newNameP2.trim().toLowerCase()) {
                    alert("Os nomes dos jogadores não podem ser iguais. Escolha outro nome para o Jogador 2.");
                } else if (!newNameP2 || newNameP2.trim() === "") {
                    alert("Nome inválido para Jogador 2. A alteração não será aplicada."); newNameP2 = null; break;
                } else {
                    break;
                }
            } while (true);

            if (newNameP2 && newNameP2.trim() !== "") {
                 playerNames[0] = newNameP1.trim();
                 teamNameNos = playerNames[0];
                 playerNames[1] = newNameP2.trim();
                 teamNameEles = playerNames[1];
            } else if (newNameP2 === null && newNameP1) { /* Cancelou o segundo nome, mas o primeiro foi alterado */
                 playerNames[0] = newNameP1.trim();
                 teamNameNos = playerNames[0];
                 // Mantém o nome antigo do jogador 2
                 teamNameEles = playerNames[1];
                 alert("Apenas o nome do Jogador 1 foi alterado.");
            } else { /* Cancelou tudo ou nome inválido */
                 alert("Alteração de nomes cancelada ou nomes inválidos."); return;
            }
        } else if (newNameP1 === null) { alert("Alteração cancelada."); return; }
        saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    } else { // Modo 4 jogadores
        let newTeamNameNos = prompt("Novo nome para a Equipe 1:", teamNameNos);
        if (newTeamNameNos && newTeamNameNos.trim() !== "") teamNameNos = newTeamNameNos.trim();
        let newTeamNameEles;
        do {
            newTeamNameEles = prompt("Novo nome para a Equipe 2:", teamNameEles);
            if (newTeamNameEles && newTeamNameEles.trim() !== "" && teamNameNos.trim().toLowerCase() === newTeamNameEles.trim().toLowerCase()) {
                 alert("Os nomes das equipes não podem ser iguais.");
            } else if (!newTeamNameEles || newTeamNameEles.trim() === "") {
                alert("Nome inválido para Equipe 2. A alteração não será aplicada para esta equipe."); newTeamNameEles = null; break;
            } else {
                break;
            }
        } while(true);
        if (newTeamNameEles && newTeamNameEles.trim() !== "") teamNameEles = newTeamNameEles.trim();
    }
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    updateTeamNameDisplay(); updateDealerDisplay(); updateDurationHistoryDisplay();
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
        if (speakPointText && speakPointText.trim() !== "") {
             speakText(speakPointText, true);
        } else if (soundEffects.point) {
            playEffect('point');
        }
        const dealerAdvanced = advanceDealer(false);
        if (dealerAdvanced && playerNames.length > 0 && playerNames[currentDealerIndex]) {
            setTimeout(() => speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, true), 800);
        }
    } else if (amount < 0 && soundEffects.point) {
        playEffect('point');
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
        playEffect('undo'); speakText("Última ação desfeita", true);
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
            playEffect('win');
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
    exportHistoryBtn?.addEventListener('click', exportHistory);
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
    exportHistoryBtn = document.getElementById('export-history-btn');

    try {
        soundEffects.win = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_7420d86135.mp3');
        soundEffects.undo = new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_b7c8f709c5.mp3');
        soundEffects.point = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_599f0c6980.mp3');
    } catch (e) { console.warn("Não foi possível carregar efeitos sonoros:", e); }

    loadGameSettings();
    loadGameData();

    if (numberOfPlayers === 2 && playerNames.length === 2) {
        teamNameNos = playerNames[0];
        teamNameEles = playerNames[1];
    } else if (numberOfPlayers === 4) {
        // Se os nomes carregados para as equipes são os mesmos que os nomes dos jogadores (de um modo 2p anterior)
        // ou se os nomes das equipes são idênticos, reseta para "Nós" e "Eles".
        if ((playerNames.includes(teamNameNos) && playerNames.includes(teamNameEles) && playerNames.length < 3) || teamNameNos === teamNameEles) {
            teamNameNos = "Nós";
            teamNameEles = "Eles";
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
        if (!gameStartTime && !isInitialState) {
             resetCurrentTimerDisplay();
        } else if (isInitialState) {
            resetCurrentTimerDisplay();
        }
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
