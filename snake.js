(function(){
  const CELL = 24; // board cell size in px
  const GRID = 30; // 30x30 grid (canvas is 720x720)
  const SPEEDS = [140, 110, 90, 70, 55]; // ms per tick by difficulty/level
  const USE_EMOJI = true; // render books/pages as emoji

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayMsg = document.getElementById('overlayMsg');
  const elScore = document.getElementById('score');
  const elHigh = document.getElementById('high');
  const elSpeed = document.getElementById('speed');

  let state = {
    running: false,
    paused: false,
    stepMs: SPEEDS[0],
    score: 0,
    high: 0,
    dir: {x:1,y:0}, // start moving right
    nextDir: {x:1,y:0},
    body: [], // segments: head first; each {x,y}
    prevBody: [], // previous positions for interpolation
    food: null, // {x,y}
  gridOn: false,
    accum: 0,
    lastTs: 0
  };

  // Load high score
  try { state.high = parseInt(localStorage.getItem('bookSnakeHigh')||'0',10) || 0; } catch {}
  elHigh.textContent = state.high;

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

  function reset(){
    state.score = 0; elScore.textContent = '0';
    state.stepMs = SPEEDS[0]; elSpeed.textContent = '1x';
    state.dir = {x:1,y:0};
    state.nextDir = {x:1,y:0};
    // Start as a single book at center
    const cx = Math.floor(GRID/2), cy = Math.floor(GRID/2);
    state.body = [ {x:cx, y:cy} ];
    state.prevBody = state.body.map(s=>({x:s.x,y:s.y}));
    placeFood();
    state.accum = 0; state.lastTs = 0;
  }

  function placeFood(){
    // Find all free interior cells; if none, player wins (classic fill-the-board)
    const occupied = new Set(state.body.map(s=> `${s.x},${s.y}`));
    const free = [];
    for(let y=1; y<GRID-1; y++){
      for(let x=1; x<GRID-1; x++){
        const key = `${x},${y}`;
        if(!occupied.has(key)) free.push({x,y});
      }
    }
    if(free.length === 0){
      winGame();
      return;
    }
    const i = Math.floor(Math.random()*free.length);
    state.food = free[i];
  }

  function step(){
    // discrete update; prepare prevBody for interpolation
    state.prevBody = state.body.map(s=>({x:s.x,y:s.y}));
    state.dir = state.nextDir;
    const head = {x: state.body[0].x + state.dir.x, y: state.body[0].y + state.dir.y};

    // Border collision ends game
    if(head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID){
      gameOver();
      return;
    }

    // Self collision
    if(state.body.some((s,i)=> i>0 && s.x===head.x && s.y===head.y)){
      gameOver();
      return;
    }

    // Move
    state.body.unshift(head);

    // Eat page
    if(state.food && head.x === state.food.x && head.y === state.food.y){
      state.score += 1; elScore.textContent = state.score;
      // Increase speed every few pages
      const level = Math.min(4, Math.floor(state.score/5));
      state.stepMs = SPEEDS[level]; elSpeed.textContent = (1+level)+'x';
      placeFood();
      // Do NOT pop tail to grow: new segment added
    } else {
      state.body.pop();
    }
  }

  function gameLoop(ts){
    if(!state.running){ return; }
    if(!state.lastTs) state.lastTs = ts;
    const dt = ts - state.lastTs; state.lastTs = ts;
    if(!state.paused){
      state.accum += dt;
      // perform fixed steps
      while(state.accum >= state.stepMs){
        // reduce accumulator but keep remainder for interpolation
        state.accum -= state.stepMs;
        step();
        if(!state.running) break;
      }
    }
    draw();
    requestAnimationFrame(gameLoop);
  }

  function draw(){
    // bg
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // subtle board
    if(state.gridOn){
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      for(let i=0;i<=GRID;i++){
        ctx.beginPath(); ctx.moveTo(i*CELL,0); ctx.lineTo(i*CELL, GRID*CELL); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i*CELL); ctx.lineTo(GRID*CELL, i*CELL); ctx.stroke();
      }
    }

  // Draw food as a single page (emoji or vector)
  if(state.food){ drawPageSymbol(state.food.x, state.food.y); }

    // Draw snake with interpolation between prevBody and body
    const t = state.paused ? 0 : Math.max(0, Math.min(1, state.accum / state.stepMs));
    for(let i=state.body.length-1;i>=0;i--){
      const cur = state.body[i];
      const prev = state.prevBody[i] || cur;
      const fx = lerpWrap(prev.x, cur.x, t, GRID);
      const fy = lerpWrap(prev.y, cur.y, t, GRID);
      const isHead = i===0;
      drawBookSymbol(fx, fy, isHead);
    }
  }

  function lerpWrap(a,b,t,mod){
    let d = b - a;
    if(d > mod/2) d -= mod;
    if(d < -mod/2) d += mod;
    let v = a + d * t;
    // wrap into [0,mod)
    if(v < 0) v = (v % mod + mod) % mod; else if(v >= mod) v = v % mod;
    return v;
  }

  // Emoji rendering
  function drawEmojiAtCell(x,y, emoji){
    const px = x*CELL, py = y*CELL;
    ctx.save();
    const size = Math.floor(CELL*0.88);
    ctx.font = `${size}px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji','Twemoji Mozilla', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, px + CELL/2, py + CELL/2 + 1);
    ctx.restore();
  }

  function drawPageEmoji(x,y){
    // 📄 page facing up
    drawEmojiAtCell(x,y,'📄');
  }

  function drawBookEmoji(x,y,isHead){
    // Head green book 📗, body red book 📕
    drawEmojiAtCell(x,y, isHead? '📗':'📕');
  }

  // Vector fallback (previous implementation)
  function drawPageVector(x,y){
    const px = x*CELL, py = y*CELL;
    const pad = 4;
    ctx.save();
    // paper
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    roundRect(px+pad, py+pad, CELL-2*pad, CELL-2*pad, 4, true, true);
    // curl corner
    ctx.beginPath();
    ctx.moveTo(px+CELL-pad, py+pad);
    ctx.lineTo(px+CELL-pad-8, py+pad);
    ctx.lineTo(px+CELL-pad, py+pad+8);
    ctx.closePath();
    ctx.fillStyle = '#f3f3f3';
    ctx.fill();
    ctx.restore();
  }

  function drawBookVector(x,y, isHead){
    const px = x*CELL, py = y*CELL;
    ctx.save();
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(px+2, py+CELL-4, CELL-4, 3);

    // cover
    const cover = isHead ? '#175c2c' : '#d90429'; // head green, body red
    const edge = '#8b5c2a'; // page edge leather
    const paper = '#fff';

    // book body
    roundRect(px+3, py+4, CELL-6, CELL-8, 4, true, false, cover);

    // spine
    ctx.fillStyle = edge;
    ctx.fillRect(px+3, py+4, 5, CELL-8);

    // page block lines
    ctx.fillStyle = paper;
    ctx.fillRect(px+8, py+6, CELL-13, CELL-12);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    for(let i=0;i<4;i++){
      ctx.beginPath();
      ctx.moveTo(px+9, py+8+i*4);
      ctx.lineTo(px+CELL-7, py+8+i*4);
      ctx.stroke();
    }

    // Head marker (bookmark)
    if(isHead){
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(px+CELL-10, py+6, 4, 10);
      ctx.beginPath(); ctx.moveTo(px+CELL-10, py+16); ctx.lineTo(px+CELL-6, py+16); ctx.lineTo(px+CELL-8, py+19); ctx.closePath(); ctx.fill();
    }

    ctx.restore();
  }

  function drawBookSymbol(x,y,isHead){
    if(USE_EMOJI){ drawBookEmoji(x,y,isHead); } else { drawBookVector(x,y,isHead); }
  }
  function drawPageSymbol(x,y){
    if(USE_EMOJI){ drawPageEmoji(x,y); } else { drawPageVector(x,y); }
  }

  function roundRect(x, y, w, h, r, fill, stroke, fillStyle){
    const rs = Math.min(r, Math.min(w,h)/2);
    ctx.beginPath();
    ctx.moveTo(x+rs, y);
    ctx.arcTo(x+w, y, x+w, y+h, rs);
    ctx.arcTo(x+w, y+h, x, y+h, rs);
    ctx.arcTo(x, y+h, x, y, rs);
    ctx.arcTo(x, y, x+w, y, rs);
    ctx.closePath();
    if(fill){ ctx.fillStyle = fillStyle || ctx.fillStyle; ctx.fill(); }
    if(stroke){ ctx.stroke(); }
  }

  function start(){
    if(state.running) return; reset(); state.running=true; state.paused=false; overlay.style.display='none'; state.lastTs=0; state.accum=0; draw(); requestAnimationFrame(gameLoop);
  }
  function pause(){ if(!state.running) return; state.paused=!state.paused; overlay.style.display = state.paused? 'flex':'none'; overlayTitle.textContent = state.paused? 'Paused' : 'Resumed'; overlayMsg.textContent = state.paused? 'Press Space to resume.' : 'Press Space to pause.'; }
  function restart(){ state.running=false; start(); }

  // Controls
  document.getElementById('btnStart').addEventListener('click', start);
  document.getElementById('btnPause').addEventListener('click', pause);
  document.getElementById('btnRestart').addEventListener('click', restart);
  const btnGrid = document.getElementById('btnGrid');
  if(btnGrid){ btnGrid.addEventListener('click', function(){ state.gridOn=!state.gridOn; draw(); }); }

  window.addEventListener('keydown', (e)=>{
    const k=e.key.toLowerCase();
    if(k===' '){ e.preventDefault(); if(state.running){ pause(); } else { start(); } return; }
    if(k==='r'){ restart(); return; }
    if(['arrowup','w'].includes(k) && state.dir.y!==1){ state.nextDir={x:0,y:-1}; }
    else if(['arrowdown','s'].includes(k) && state.dir.y!==-1){ state.nextDir={x:0,y:1}; }
    else if(['arrowleft','a'].includes(k) && state.dir.x!==1){ state.nextDir={x:-1,y:0}; }
    else if(['arrowright','d'].includes(k) && state.dir.x!==-1){ state.nextDir={x:1,y:0}; }
  });

  function gameOver(){
    state.running=false;
    overlay.style.display='flex';
    overlayTitle.textContent = 'Game Over';
    overlayMsg.textContent = 'Press R to restart or Space to play again.';
    if(state.score > state.high){ state.high = state.score; elHigh.textContent = state.high; try { localStorage.setItem('bookSnakeHigh', String(state.high)); } catch {} }
  }
  function winGame(){
    state.running=false;
    overlay.style.display='flex';
    overlayTitle.textContent = 'You Win!';
    overlayMsg.textContent = 'Filled the library! Press R to play again.';
    if(state.score > state.high){ state.high = state.score; elHigh.textContent = state.high; try { localStorage.setItem('bookSnakeHigh', String(state.high)); } catch {} }
    // Record a win for achievements/stats
    try {
      const wins = parseInt(localStorage.getItem('bookSnakeWins')||'0',10) || 0;
      localStorage.setItem('bookSnakeWins', String(wins+1));
      localStorage.setItem('bookSnakeWin','1'); // legacy boolean flag
    } catch {}
  }

  // Auto focus canvas for keyboard
  canvas.tabIndex = 0; canvas.focus();
})();
