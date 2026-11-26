"use strict";
const el = id => document.getElementById(id);
const canvas = el("board");
const ctx = canvas.getContext("2d");
const cols = 32, rows = 16, tile = 30;
let players, duel = false, result, food, timer, state, audio;
let bonus, bonusTicks, foodsEaten;
const campaign = typeof stages !== "undefined";
const recordKey = campaign ? "raster-tour-best" : "raster-snake-best";
const bonusLifetime = 36;
let muted = false, record = 0;
try { record = Number(localStorage.getItem(recordKey)) || 0; } catch {}
const pad = n => String(n).padStart(3, "0");
const level = () => campaign ? stageIndex+1 : 1 + Math.floor(Math.max(...players.map(player => player.points)) / 50);
const same = (a,b) => a.x === b.x && a.y === b.y;
function reset() {
  const green = campaign ? [[4,8],[3,8],[2,8],[1,8]] : duel ? [[7,7],[6,7],[5,7],[4,7]] :
    [[15,7],[14,7],[13,7],[12,7],[12,8],[12,9],[11,9],[10,9],[9,9]];
  function player(cells, dx) {
    return {snake: cells.map(([x,y]) => ({x,y})), dir:[dx,0], turns:[], points:0};
  }
  players = [player(green, 1)];
  if (duel) players.push(player([[24,8],[25,8],[26,8],[27,8]], -1));
  food = duel ? {x:16,y:8} : {x:21,y:6};
  if (campaign) {
    players[0].points = checkpoint;
    food = {x:7,y:8};
  }
  result = "";
  bonus = null;
  bonusTicks = 0;
  foodsEaten = 0;
  setState("ready");
}
const labels = {
  ready:["Bereit","▶　 Spiel starten"], running:["Im Spiel","Ⅱ　 Pause"],
  paused:["Pausiert","▶　 Weiterspielen"], lost:["Game over","↻　 Neu spielen"],
  cleared:["Level geschafft","▶　 Nächstes Level"],
  won:["Gewonnen","↻　 Neu spielen"]
};
function setState(next) {
  clearTimeout(timer);
  state = next;
  syncMusic();
  if (next === "lost") jingle([220, 165, 110]);
  if (next === "won" || next === "cleared") jingle([523, 659, 784, 1047]);
  el("status").textContent = result || labels[next][0];
  if (!campaign) el("mode").disabled = next === "running" || next === "paused";
  el("play").textContent = labels[next][1];
  if (campaign && next === "lost") el("play").textContent = "↻　 Level wiederholen";
  draw();
  if (next === "running") schedule();
}
function schedule() { timer = setTimeout(step, Math.max(75, 190 - 15 * (level()-1))); }
function openCell(exclude) {
  const free = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = {x, y};
      if (campaign && (wallAt(cell) || same(cell,exitCell))) continue;
      if (exclude && same(cell, exclude)) continue;
      if (!players.some(p => p.snake.some(segment => same(segment, cell)))) free.push(cell);
    }
  }
  return free[Math.floor(Math.random() * free.length)];
}

function step() {
  const moves = players.map(player => {
    const {snake, turns} = player;
    player.dir = turns.shift() || player.dir;
    const head = {x:snake[0].x + player.dir[0], y:snake[0].y + player.dir[1]};
    const golden = bonus && same(head, bonus);
    const eating = golden || (food && same(head, food));
    return {player, head, golden, eating, body:eating ? snake : snake.slice(0,-1)};
  });
  const crashed = moves.filter(({head}) =>
    (campaign && wallAt(head)) || head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows ||
    moves.some(move => move.body.some(cell => same(cell, head))) ||
    (duel && same(moves[0].head, moves[1].head))
  );
  if (crashed.length) {
    if (duel) result = crashed.length === 2 ? "Unentschieden" :
      crashed[0] === moves[0] ? "Blau gewinnt" : "Grün gewinnt";
    return setState("lost");
  }
  if (campaign && !food && same(moves[0].head, exitCell)) {
    const final = stageIndex === stages.length-1;
    result = final ? "Leveltour geschafft!" : "Level geschafft!";
    return setState(final ? "won" : "cleared");
  }
  const oldLevel = level();
  for (const {player, head, eating, golden} of moves) {
    player.snake.unshift(head);
    if (eating) player.points += golden ? 30 : 10;
    else player.snake.pop();
  }
  const ateGold = moves.some(move => move.golden);
  if (ateGold) bonus = null;
  if (moves.some(move => move.eating)) {
    if (ateGold) jingle([784, 988, 1175, 1568]);
    else jingle(level() > oldLevel ? [659, 784, 988, 1319] : [784, 1047]);
    if (!duel && players[0].points > record) {
      record = players[0].points;
      try { localStorage.setItem(recordKey, String(record)); } catch {}
    }
    if (food && moves.some(move => same(move.head,food))) {
      foodsEaten++;
      if (campaign && foodsEaten >= stages[stageIndex].goal) {
        food = null;
        jingle([523,784,1047]);
      } else {
        food = openCell(bonus);
        if (!food && bonus) {
          food = bonus;
          bonus = null;
        }
        if (!food) {
          if (duel) {
            const diff = players[0].points - players[1].points;
            result = diff === 0 ? "Unentschieden" : diff > 0 ? "Grün gewinnt" : "Blau gewinnt";
          }
          return setState("won");
        }
        if (foodsEaten % 3 === 0) {
          bonus = openCell(food);
          bonusTicks = bonusLifetime + 1;
        }
      }
    }
  }
  if (bonus && --bonusTicks === 0) bonus = null;
  draw();
  schedule();
}
const applePixels = [
  ".......s..ll..",
  ".......sslll..",
  ".......sll....",
  "...rrr.s.rrr..",
  "..rhhrrrrrrrd.",
  ".rhwwhrrrrrrdd",
  ".rhwhrrrrrrrdd",
  ".rhhrrrrrrrrdd",
  ".rrrrrrrrrrddd",
  "..rrrrrrrrddd.",
  "..drrrrrrdddd.",
  "...ddrrrdddd..",
  "....ddd.ddd...",
];
const appleColors = {s:"#bd8352", l:"#8dcc58", r:"#f65043", h:"#ff8470", w:"#fff0ce", d:"#b83543"};
function drawApple(context, x, y) {
  applePixels.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const color = appleColors[row[dx]];
      if (color) {
        context.fillStyle = color;
        context.fillRect(x + dx * 2, y + dy * 2, 2, 2);
      }
    }
  });
}

function drawMarquee() {
  const title = el("titleArt").getContext("2d");
  const letters = [
    ["01111","11000","01110","00011","11110"],
    ["11001","11101","11111","10111","10011"],
    ["01110","11011","11111","11011","11011"],
    ["11011","11110","11100","11110","11011"],
    ["11111","11000","11110","11000","11111"],
  ];
  for (const [offset, color] of [[4,"#a94646"],[2,"#ff935c"],[0,"#ffe6ac"]]) {
    title.fillStyle = color;
    letters.forEach((letter, i) => letter.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === "1") title.fillRect(2 + i*24 + x*4 + 4-y, 4 + y*4 + offset, 4, 4);
      }
    }));
  }
}

function draw() {
  ctx.fillStyle = campaign ? themes[stageIndex].floor : "#101710";
  ctx.fillRect(0,0,960,480);
  ctx.strokeStyle = campaign ? themes[stageIndex].grid : "#232d22"; ctx.lineWidth=1;
  ctx.beginPath();
  for(let x=0;x<=960;x+=tile){ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,480);}
  for(let y=0;y<=480;y+=tile){ctx.moveTo(0,y+.5);ctx.lineTo(960,y+.5);}
  ctx.stroke();
  if (campaign) drawStage();
  players.forEach(({snake, dir}, index) => {
    const scale = index ? "#66add4" : "#95c956";
    const shine = index ? "#c6eaff" : "#daed93";
    const edge = index ? "#39749d" : "#608d42";
    snake.forEach(({x,y},i) => {
      const left = x * tile, top = y * tile;
      ctx.fillStyle = edge;
      ctx.fillRect(left+3, top+2, 24, 26);
      ctx.fillRect(left+1, top+5, 28, 20);
      ctx.fillStyle = scale;
      ctx.fillRect(left+3, top+4, 24, 20);
      ctx.fillStyle = shine;
      ctx.fillRect(left+5, top+3, 18, 3);
      if (i) {
        ctx.fillStyle = edge;
        ctx.fillRect(left+9, top+11, 4, 3);
        ctx.fillRect(left+13, top+14, 4, 3);
      }
    });
    const hx=snake[0].x*tile+15+dir[0]*6, hy=snake[0].y*tile+15+dir[1]*6;
    for(const side of [-7,7]) {
      const x=hx+dir[1]*side, y=hy+dir[0]*side;
      ctx.fillStyle="#fff1c7";
      ctx.fillRect(x-4,y-4,8,8);
      ctx.fillStyle="#22272a";
      ctx.fillRect(x-2+dir[0],y-2+dir[1],4,4);
    }
  });
  if (food) drawApple(ctx, food.x*tile+1, food.y*tile+2);
  if (bonus) {
    const x = bonus.x * tile + tile / 2;
    const y = bonus.y * tile + tile / 2;
    ctx.fillStyle = "#ffd15b";
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 9);
    ctx.lineTo(x - 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff5c2";
    ctx.fillRect(x-3,y-3,4,3);
    ctx.fillStyle = "#d99535";
    ctx.fillRect(x,y+3,3,3);
    ctx.strokeStyle = "#ffd15b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 13, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * bonusTicks / bonusLifetime);
    ctx.stroke();
  }
  if(["lost","paused","won","cleared"].includes(state)){
    ctx.fillStyle="#101710d9";ctx.fillRect(0,0,960,480);
    ctx.fillStyle="#d2ff88";ctx.textAlign="center";ctx.font="bold 48px monospace";
    ctx.fillText(result || labels[state][0],480,240);
    if (state !== "paused") {
      ctx.font = "22px monospace";
      ctx.fillStyle = "#eef1e9";
      ctx.fillText(duel ? "Grün " + players[0].points + "　·　Blau " + players[1].points : players[0].points + " Punkte　·　Rekord " + record, 480, 284);
    }
  }
  el("score").textContent=pad(players[0].points);el("best").textContent=pad(duel ? players[1].points : record);
  el("speed").textContent="TEMPO "+String(level()).padStart(2,"0");
}
function toggle(){
  if(state==="running") return setState("paused");
  if (campaign && state === "cleared") {
    checkpoint = players[0].points;
    stageIndex++;
    reset();
  }
  if (campaign && state === "won") { stageIndex = 0; checkpoint = 0; }
  if(state==="lost" || state==="won") reset();
  if (!muted) enableAudio();
  setState("running");
}
function turn(x,y,player = players[0]){
  const {turns,dir} = player;
  if(state!=="running" || turns.length>=2) return;
  const last=turns.at(-1)||dir;
  if(last[0]*x+last[1]*y===0) turns.push([x,y]);
}
const keys={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
document.addEventListener("keydown", e=>{
  if(e.altKey || e.ctrlKey || e.metaKey) return;
  if(e.target === el("mode")) return;
  const move=keys[e.key.toLowerCase()];
  if(move){e.preventDefault();turn(...move, duel && e.key.startsWith("Arrow") ? players[1] : players[0]);}
  if(e.code==="Space" && e.target!==el("sound")){
    e.preventDefault();if(!e.repeat) toggle();
  }
});
let touch;
canvas.onpointerdown=e=>{touch=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};
canvas.onpointercancel=()=>{touch=null;};
canvas.onpointerup=e=>{
  if(!touch || duel)return;
  const x=e.clientX-touch[0],y=e.clientY-touch[1];touch=null;
  if(Math.max(Math.abs(x),Math.abs(y))<8)return;
  if(Math.abs(x)>Math.abs(y)) turn(Math.sign(x),0); else turn(0,Math.sign(y));
};
const bass = [130.81, 103.83, 155.56, 116.54];
const melody = [12, 0, 7, 10, 3, 0, 7, 15];
let beat = 0, musicTimer, output;

function enableAudio() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  if (!audio) audio = new Context();
  audio.resume().catch(() => {});
}

function tone(freq, start, duration, wave, volume) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(output);
  osc.start(start);
  osc.stop(start + duration);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}

function jingle(notes) {
  if (!output) return;
  const now = audio.currentTime;
  notes.forEach((freq, i) => tone(freq, now + i * 0.075, 0.14, "triangle", 0.15));
}

function playBeat() {
  const now = audio.currentTime;
  const root = bass[Math.floor(beat / 8)];
  const note = melody[beat % 8];
  if (note) tone(root * 2 ** (1 + note / 12), now, 0.16, "square", 0.027);
  if (beat % 2 === 0) tone(root, now, 0.22, "triangle", 0.13);
  beat = (beat + 1) % 32;
  musicTimer = setTimeout(playBeat, Math.max(130, 170 - 4 * (level() - 1)));
}

function syncMusic() {
  clearTimeout(musicTimer);
  if (output) output.disconnect();
  output = null;
  if (state === "ready") beat = 0;
  if (muted || !audio || state === "paused" || state === "ready") return;
  output = audio.createGain();
  output.connect(audio.destination);
  if (state === "running") playBeat();
}

el("sound").onclick = () => {
  muted = !muted;
  if (!muted) enableAudio();
  el("sound").textContent = muted ? "♪　 Ton aus" : "♫　 Ton an";
  el("sound").setAttribute("aria-pressed", String(!muted));
  syncMusic();
};
if (!campaign) el("mode").onchange = () => {
  duel = el("mode").value === "duel";
  document.body.classList.toggle("duel", duel);
  el("duelHelp").hidden = !duel;
  el("firstLabel").textContent = duel ? "GRÜN" : "PUNKTE";
  el("secondLabel").textContent = duel ? "BLAU" : "REKORD";
  reset();
  el("play").focus();
};
el("play").onclick=toggle;
document.addEventListener("visibilitychange",()=>{if(document.hidden && state==="running")setState("paused");});
drawMarquee();
drawApple(el("appleIcon").getContext("2d"),1,2);
reset();
