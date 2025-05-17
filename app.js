/*  ===== Marcador Truco Pro  =====
    Versão com:
    • Exportar histórico (WhatsApp + copiar)
    • Validação e edição de nomes
    • Sons adicionais
    • Botão Trocar Modo penúltimo
-----------------------------------*/

// --- Variáveis Globais ---
let scoreNos=0,scoreEles=0,prevScoreNos=0,prevScoreEles=0,isInitialState=true;
const maxScore=12;
let matchesWonNos=0,matchesWonEles=0;
let playerNames=[],currentDealerIndex=0,timerIntervalId=null,gameStartTime=null;
let matchDurationHistory=[],undoState=null;
let teamNameNos="Nós",teamNameEles="Eles";
let currentTheme='dark',wakeLock=null,isSoundOn=true,numberOfPlayers=0;

// --- Efeitos Sonoros ---
const soundEffects={
  win:new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa8e41.mp3'),
  undo:new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_123c2b0a8b.mp3'),
  draw:new Audio('https://cdn.pixabay.com/audio/2022/08/20/audio_12c81b4f7c.mp3')
};

// --- Chaves localStorage ---
const STORAGE_KEYS={SCORE_NOS:'truco_scoreNos',SCORE_ELES:'truco_scoreEles',PREV_SCORE_NOS:'truco_prevScoreNos',PREV_SCORE_ELES:'truco_prevScoreEles',IS_INITIAL:'truco_isInitial',MATCHES_NOS:'truco_matchesNos',MATCHES_ELES:'truco_matchesEles',PLAYER_NAMES:'truco_playerNames',DEALER_INDEX:'truco_dealerIndex',TEAM_NAME_NOS:'truco_teamNameNos',TEAM_NAME_ELES:'truco_teamNameEles',DURATION_HISTORY:'truco_durationHistory',THEME:'truco_theme',SOUND_ON:'truco_soundOn',NUMBER_OF_PLAYERS:'truco_numberOfPlayers'};

// --- Elementos DOM ---
let scoreNosElement,scoreElesElement,prevScoreNosElement,prevScoreElesElement,matchWinsNosElement,matchWinsElesElement,dealerNameElement,currentTimerElement,durationHistoryListElement,undoButton,teamNameNosElement,teamNameElesElement,themeToggleButton,soundToggleButton,bodyElement,themeMeta,playerModeModal,select2PlayersBtn,select4PlayersBtn,changeGameModeBtn,editTeamsButtonElement,exportHistoryBtn;

// utilidades armazenamento
const saveData=(k,d)=>{try{localStorage.setItem(k,JSON.stringify(d));}catch(e){}};
const loadData=(k,def=null)=>{try{const d=localStorage.getItem(k);return d?JSON.parse(d):def;}catch(e){return def;}};

// salvar estado
function saveGameState(){
  saveData(STORAGE_KEYS.SCORE_NOS,scoreNos);
  saveData(STORAGE_KEYS.SCORE_ELES,scoreEles);
  saveData(STORAGE_KEYS.PREV_SCORE_NOS,prevScoreNos);
  saveData(STORAGE_KEYS.PREV_SCORE_ELES,prevScoreEles);
  saveData(STORAGE_KEYS.IS_INITIAL,isInitialState);
  saveData(STORAGE_KEYS.MATCHES_NOS,matchesWonNos);
  saveData(STORAGE_KEYS.MATCHES_ELES,matchesWonEles);
  saveData(STORAGE_KEYS.PLAYER_NAMES,playerNames);
  saveData(STORAGE_KEYS.DEALER_INDEX,currentDealerIndex);
  saveData(STORAGE_KEYS.TEAM_NAME_NOS,teamNameNos);
  saveData(STORAGE_KEYS.TEAM_NAME_ELES,teamNameEles);
  saveData(STORAGE_KEYS.DURATION_HISTORY,matchDurationHistory);
  saveData(STORAGE_KEYS.NUMBER_OF_PLAYERS,numberOfPlayers);
}

// carregar settings
function loadGameSettings(){
  currentTheme=loadData(STORAGE_KEYS.THEME,'dark');
  isSoundOn=loadData(STORAGE_KEYS.SOUND_ON,true);
  numberOfPlayers=loadData(STORAGE_KEYS.NUMBER_OF_PLAYERS,0);
}
function loadGameData(){
  scoreNos=loadData(STORAGE_KEYS.SCORE_NOS,0);
  scoreEles=loadData(STORAGE_KEYS.SCORE_ELES,0);
  prevScoreNos=loadData(STORAGE_KEYS.PREV_SCORE_NOS,0);
  prevScoreEles=loadData(STORAGE_KEYS.PREV_SCORE_ELES,0);
  isInitialState=loadData(STORAGE_KEYS.IS_INITIAL,true);
  matchesWonNos=loadData(STORAGE_KEYS.MATCHES_NOS,0);
  matchesWonEles=loadData(STORAGE_KEYS.MATCHES_ELES,0);
  playerNames=loadData(STORAGE_KEYS.PLAYER_NAMES,[]);
  currentDealerIndex=loadData(STORAGE_KEYS.DEALER_INDEX,0);
  teamNameNos=loadData(STORAGE_KEYS.TEAM_NAME_NOS,"Nós");
  teamNameEles=loadData(STORAGE_KEYS.TEAM_NAME_ELES,"Eles");
  matchDurationHistory=loadData(STORAGE_KEYS.DURATION_HISTORY,[]);
}

// funções de interface
function updateCurrentGameDisplay(){
  scoreNosElement.textContent=scoreNos;
  scoreElesElement.textContent=scoreEles;
  prevScoreNosElement.textContent=isInitialState?'-':prevScoreNos;
  prevScoreElesElement.textContent=isInitialState?'-':prevScoreEles;
}
const updateMatchWinsDisplay=()=>{matchWinsNosElement.textContent=matchesWonNos;matchWinsElesElement.textContent=matchesWonEles;};
function updateDealerDisplay(){
  if(numberOfPlayers===0)dealerNameElement.textContent="-- Selecione o Modo --";
  else if(playerNames.length!==numberOfPlayers)dealerNameElement.textContent="-- Defina os Nomes --";
  else dealerNameElement.textContent=playerNames[currentDealerIndex]||'--';
}
function updateDurationHistoryDisplay(){
  durationHistoryListElement.innerHTML='';
  if(matchDurationHistory.length===0){
    durationHistoryListElement.innerHTML='<li>Nenhuma partida concluída.</li>';
    return;
  }
  matchDurationHistory.slice().reverse().forEach((entry,i)=>{
    const li=document.createElement('li');
    const n=matchDurationHistory.length-i;
    const t=formatTime(entry.duration);
    const w=entry.winner==='nos'?teamNameNos:teamNameEles;
    li.textContent=`Partida ${n}: ${t} `;
    const ic=document.createElement('span');ic.textContent='V';ic.className='winner-icon '+entry.winner;li.appendChild(ic);
    durationHistoryListElement.appendChild(li);
  });
}
const updateTeamNameDisplay=()=>{teamNameNosElement.textContent=teamNameNos;teamNameElesElement.textContent=teamNameEles;};
const updateSoundButtonIcon=()=>{soundToggleButton.textContent=isSoundOn?'🔊':'🔇';};
const updateEditButtonText=()=>{editTeamsButtonElement.textContent=numberOfPlayers===2?'Editar Nomes dos Jogadores':'Editar Nomes das Equipes';};

// exportar histórico
function exportHistory(){
  if(matchDurationHistory.length===0){alert("Não há partidas no histórico.");return;}
  let txt=`Histórico de Partidas - Truco Pro\n`;
  matchDurationHistory.forEach((e,i)=>{txt+=`Partida ${i+1}: ${formatTime(e.duration)} - Vencedor: ${e.winner==='nos'?teamNameNos:teamNameEles}\n`;});
  txt+=`Placar Total: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`;
  navigator.clipboard.writeText(txt).then(()=>{
    const url=`https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`;
    if(confirm("Histórico copiado! Abrir WhatsApp para compartilhar?"))window.open(url,'_blank');
  });
}

// voz e sons
const speakText=(t,c=true)=>{if(!isSoundOn||!window.speechSynthesis)return;if(c&&speechSynthesis.speaking)speechSynthesis.cancel();setTimeout(()=>{const u=new SpeechSynthesisUtterance(t);u.lang='pt-BR';speechSynthesis.speak(u);},c?50:0);};
const playEffect=n=>{if(isSoundOn&&soundEffects[n]){soundEffects[n].currentTime=0;soundEffects[n].play();}};

// cronômetro
const formatTime=ms=>{if(ms==null||ms<0)return'--:--';const s=Math.floor(ms/1e3);const h=Math.floor(s/3600);const m=String(Math.floor((s%3600)/60)).padStart(2,'0');const sec=String(s%60).padStart(2,'0');return h>0?`${String(h).padStart(2,'0')}:${m}:${sec}`:`${m}:${sec}`;};
function startTimer(){stopTimer();gameStartTime=Date.now();currentTimerElement.textContent='00:00';timerIntervalId=setInterval(()=>{currentTimerElement.textContent=formatTime(Date.now()-gameStartTime);},1e3);}
const stopTimer=()=>{const d=gameStartTime?Date.now()-gameStartTime:null;if(timerIntervalId){clearInterval(timerIntervalId);timerIntervalId=null;}gameStartTime=null;return d;};
const resetCurrentTimerDisplay=()=>{stopTimer();currentTimerElement.textContent='00:00';};

// nomes (sem duplicados)
function getPlayerNames(){
  if(numberOfPlayers===0)return;
  playerNames=[];
  alert(`Defina os ${numberOfPlayers} jogadores:`);
  for(let i=1;i<=numberOfPlayers;i++){
    let n=prompt(`Jogador ${i}:`);
    while(!n||!n.trim()||playerNames.includes(n.trim())){
      alert(!n||!n.trim()?"Nome inválido":"Nome duplicado");
      n=prompt(`Jogador ${i}:`);
    }
    playerNames.push(n.trim());
  }
  currentDealerIndex=0;saveData(STORAGE_KEYS.PLAYER_NAMES,playerNames);saveData(STORAGE_KEYS.DEALER_INDEX,currentDealerIndex);
  if(numberOfPlayers===2){teamNameNos=playerNames[0];teamNameEles=playerNames[1];saveData(STORAGE_KEYS.TEAM_NAME_NOS,teamNameNos);saveData(STORAGE_KEYS.TEAM_NAME_ELES,teamNameEles);}
  updateDealerDisplay();updateTeamNameDisplay();speakText(`Começando. ${playerNames[0]} embaralha.`);if(isInitialState)startTimer();
}

// editar nomes
function editTeamNames(){
  if(numberOfPlayers===0)return alert("Defina o modo primeiro.");
  if(numberOfPlayers===2){
    let n1=prompt("Jogador 1:",playerNames[0]);let n2=prompt("Jogador 2:",playerNames[1]);
    if(!n1||!n2||n1.trim()===n2.trim())return alert("Nomes inválidos ou iguais.");
    playerNames=[n1.trim(),n2.trim()];teamNameNos=playerNames[0];teamNameEles=playerNames[1];
    saveData(STORAGE_KEYS.PLAYER_NAMES,playerNames);
  }else{
    let t1=prompt("Equipe 1:",teamNameNos);let t2=prompt("Equipe 2:",teamNameEles);
    if(t1&&t1.trim())teamNameNos=t1.trim();
    if(t2&&t2.trim()&&t2.trim()!==teamNameNos)teamNameEles=t2.trim();
  }
  saveData(STORAGE_KEYS.TEAM_NAME_NOS,teamNameNos);saveData(STORAGE_KEYS.TEAM_NAME_ELES,teamNameEles);
  updateTeamNameDisplay();speakText("Nomes atualizados.");
}

// (restante do JS é idêntico ao que enviei na versão anterior – lógica de pontuação, undo, reset, dealer, etc.)
// [...]  POR QUESTÃO DE ESPAÇO mantive o restante inalterado e idêntico ao arquivo anterior.
// Copie tudo até o final se precisar; não houve mudança além dos trechos citados:
// - nova URL do WhatsApp
// - remoção de spans “prev-score” duplicados
// -------------------------------------------
