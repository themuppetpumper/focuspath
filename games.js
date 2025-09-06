// games.js - logic for games.html
(function(){
  // Public helpers expected from flashcards: loadCardSets()
  function safeLoadSets(){
    try { return typeof loadCardSets==='function'? loadCardSets(): JSON.parse(localStorage.getItem('flashcardSets')||'[]'); }
    catch { return []; }
  }
  function pickRandomSet(allowedSubjects){
    const sets=safeLoadSets().filter(s=> Array.isArray(s.cards) && s.cards.length);
    let pool=sets;
    if(Array.isArray(allowedSubjects) && allowedSubjects.length){
      pool = sets.filter(s=> allowedSubjects.includes(s.subject||'Uncategorized'));
    }
    if(!pool.length) return null;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()* (i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  function createModal(){
    let m=document.getElementById('gameModal');
    if(m) return m;
    m=document.createElement('div');
    m.id='gameModal';
    m.className='fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50';
  m.innerHTML=`<div class='bg-white w-full max-w-4xl min-h-[600px] rounded-lg shadow-lg p-10 space-y-6 relative flex flex-col justify-center items-center'>
      <button id='gmClose' class='absolute top-2 right-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'>&times;</button>
      <div id='gmContent' class='space-y-4 text-sm text-[var(--text-secondary)]'></div>
    </div>`;
    document.body.appendChild(m);
    // Remove click-outside-to-close behavior
    // m.addEventListener('click',e=>{ if(e.target===m) closeModal(); });
    m.querySelector('#gmClose').addEventListener('click',closeModal);
    // Allow closing only via X button or Esc key
    function closeModal(){ m.remove(); }
    // Listen for Esc key to close
    m.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
    // Focus modal for Esc key
    setTimeout(() => { m.tabIndex = -1; m.focus(); }, 10);
    return m;
  }
  function openModal(node){ const m=createModal(); const c=m.querySelector('#gmContent'); c.innerHTML=''; c.appendChild(node); }

  // Flash Card Sprint (pulls random user deck)
  // Exposed settings panels (can be opened from game cards before starting game)
  function showSprintSettings(){
    if(!window.__fpSprintConfig) window.__fpSprintConfig={ time:60, subjects:null };
    const cfg=window.__fpSprintConfig;
    const allSets=safeLoadSets();
    const subjects=Array.from(new Set(allSets.map(s=> s.subject||'Uncategorized'))).sort();
    const currentSel = cfg.subjects? cfg.subjects.slice(): subjects.slice();
    const panel=document.createElement('div');
    panel.className='fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50';
    panel.innerHTML=`<div class='bg-white w-full max-w-md rounded-lg shadow-lg p-5 space-y-4 relative'>
      <button class='absolute top-2 right-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]' data-close>&times;</button>
      <h3 class='text-lg font-semibold text-[var(--text-primary)]'>Flash Card Sprint Settings</h3>
      <div class='space-y-4'>
        <div>
          <label class='block text-[10px] font-semibold text-[var(--text-secondary)] mb-1'>Total Time (seconds)</label>
          <input id='fsTime' type='number' min='10' max='600' value='${cfg.time}' class='w-32 rounded border border-[var(--border-color)] p-2 text-sm'/>
        </div>
        <div>
          <div class='flex items-center justify-between mb-1'>
            <label class='block text-[10px] font-semibold text-[var(--text-secondary)]'>Subjects (${subjects.length})</label>
            <div class='flex gap-2 text-[10px]'>
              <button type='button' data-all class='text-[var(--primary-color)] hover:underline'>All</button>
              <button type='button' data-none class='text-[var(--primary-color)] hover:underline'>Clear</button>
            </div>
          </div>
          <div id='fsSubList' class='max-h-48 overflow-auto border rounded p-2 space-y-1'>
            ${subjects.map(s=>`<label class='flex items-center gap-2 text-[11px]'><input type='checkbox' value='${s.replace(/'/g,"&#39;")}' ${currentSel.includes(s)?'checked':''}/> <span>${s}</span></label>`).join('')}
          </div>
        </div>
      </div>
      <div class='flex gap-2 justify-end pt-1'>
        <button data-close class='px-3 py-2 rounded bg-gray-200 text-[var(--text-primary)] text-xs'>Close</button>
        <button id='fsApply' class='px-4 py-2 rounded bg-[var(--primary-color)] text-white text-xs font-medium'>Apply</button>
      </div>
    </div>`;
    document.body.appendChild(panel);
    const subList=panel.querySelector('#fsSubList');
    panel.querySelectorAll('[data-close]').forEach(b=> b.addEventListener('click',()=> panel.remove()));
    panel.addEventListener('click',e=>{ if(e.target===panel) panel.remove(); });
    panel.querySelector('[data-all]').addEventListener('click',()=> subList.querySelectorAll('input[type=checkbox]').forEach(c=> c.checked=true));
    panel.querySelector('[data-none]').addEventListener('click',()=> subList.querySelectorAll('input[type=checkbox]').forEach(c=> c.checked=false));
    panel.querySelector('#fsApply').addEventListener('click',()=>{
      const t=Number(panel.querySelector('#fsTime').value)||cfg.time;
      const chosen=[...subList.querySelectorAll('input[type=checkbox]:checked')].map(i=>i.value);
      if(!chosen.length){ alert('Select at least one subject.'); return; }
      cfg.time=Math.min(600, Math.max(10,t));
      cfg.subjects = (chosen.length===subjects.length)? null : chosen;
      panel.remove();
    });
  }

  function showDrillSettings(){
    if(!window.__fpDrillCfg) window.__fpDrillCfg={ perQuestion:8, ops:['+','-','×','÷'] };
    const dc=window.__fpDrillCfg;
    const allOps=['+','-','×','÷'];
    const sel= (dc.ops && dc.ops.length)? dc.ops.slice(): allOps.slice();
    const panel=document.createElement('div');
    panel.className='fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50';
    panel.innerHTML=`<div class='bg-white w-full max-w-md rounded-lg shadow-lg p-5 space-y-4 relative'>
      <button class='absolute top-2 right-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]' data-close>&times;</button>
      <h3 class='text-lg font-semibold text-[var(--text-primary)]'>Quick Math Drill Settings</h3>
      <div class='space-y-4'>
        <div>
          <label class='block text-[10px] font-semibold text-[var(--text-secondary)] mb-1'>Per-Question Time (seconds)</label>
          <input id='qmTime' type='number' min='3' max='60' value='${dc.perQuestion||8}' class='w-32 rounded border border-[var(--border-color)] p-2 text-sm'/>
        </div>
        <div>
          <div class='flex items-center justify-between mb-1'>
            <label class='block text-[10px] font-semibold text-[var(--text-secondary)]'>Operations</label>
            <div class='flex gap-2 text-[10px]'>
              <button type='button' data-all class='text-[var(--primary-color)] hover:underline'>All</button>
              <button type='button' data-none class='text-[var(--primary-color)] hover:underline'>Clear</button>
            </div>
          </div>
          <div id='qmOpList' class='flex flex-wrap gap-4 pt-1'>
            ${allOps.map(op=>`<label class='flex items-center gap-2 text-sm font-medium px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--background-color)] hover:bg-white transition-colors'>
              <input type='checkbox' class='w-4 h-4 accent-[var(--primary-color)]' value='${op}' ${sel.includes(op)?'checked':''}/>
              <span class='tracking-wide'>${op}</span>
            </label>`).join('')}
          </div>
        </div>
      </div>
      <div class='flex gap-2 justify-end pt-1'>
        <button data-close class='px-3 py-2 rounded bg-gray-200 text-[var(--text-primary)] text-xs'>Close</button>
        <button id='qmApply' class='px-4 py-2 rounded bg-[var(--primary-color)] text-white text-xs font-medium'>Apply</button>
      </div>
    </div>`;
    document.body.appendChild(panel);
    const list=panel.querySelector('#qmOpList');
    panel.querySelectorAll('[data-close]').forEach(b=> b.addEventListener('click',()=> panel.remove()));
    panel.addEventListener('click',e=>{ if(e.target===panel) panel.remove(); });
    panel.querySelector('[data-all]').addEventListener('click',()=> list.querySelectorAll('input[type=checkbox]').forEach(c=> c.checked=true));
    panel.querySelector('[data-none]').addEventListener('click',()=> list.querySelectorAll('input[type=checkbox]').forEach(c=> c.checked=false));
    panel.querySelector('#qmApply').addEventListener('click',()=>{
      const nt=Number(panel.querySelector('#qmTime').value)||dc.perQuestion;
      const chosen=[...list.querySelectorAll('input[type=checkbox]:checked')].map(i=>i.value);
      if(!chosen.length){ alert('Select at least one operation.'); return; }
      dc.perQuestion=Math.min(60, Math.max(3, nt));
      dc.ops = (chosen.length===allOps.length)? allOps.slice(): chosen;
      panel.remove();
    });
  }

  function startFlashCardSprint(){
  if(!window.__fpSprintConfig) window.__fpSprintConfig={ time:60, subjects:null }; // subjects null => all
  const cfg=window.__fpSprintConfig;
  const selectedSet = pickRandomSet(cfg.subjects);
  if(!selectedSet){ alert('No flashcard sets with cards found (check subject filters in settings).'); return; }
  // Flatten cards; each card: {front, back}
  const cards = shuffle([...selectedSet.cards]);
  const TOTAL_TIME = cfg.time || 60; // seconds
  let timeLeft = TOTAL_TIME;
  let index = 0;
  let correct = 0; let attempted = 0;
  const responses=[]; // {front, expected, given, correct}

  // Start page modal
  const startPage = document.createElement('div');
  startPage.innerHTML = `
    <h2 class='text-2xl font-bold text-[var(--text-primary)] mb-4'>Flash Card Sprint</h2>
    <p class='text-lg mb-6'>Test your speed and accuracy! Answer as many flashcards as you can before time runs out.<br>Deck: <strong>${selectedSet.name||'Untitled'}</strong> • ${cards.length} cards • ${TOTAL_TIME}s.</p>
    <ul class='text-base mb-6 text-[var(--text-secondary)] list-disc pl-6 text-left'>
      <li>Type the answer (card back) for each prompt.</li>
      <li>Press Enter or click Enter to submit.</li>
      <li>Esc to end early.</li>
    </ul>
    <button id='fsStart' class='px-8 py-4 rounded bg-[var(--primary-color)] text-white text-xl font-semibold'>Start</button>
  `;
  // Show onboarding modal and only start game after Start is clicked
  let started = false;
  startPage.querySelector('#fsStart').addEventListener('click', () => {
    if (started) return;
    started = true;
    openModal(wrap);
    showCard();
  });
  setTimeout(() => openModal(startPage), 0);

  const wrap=document.createElement('div');
  wrap.innerHTML=`<h2 class='text-xl font-semibold text-[var(--text-primary)] mb-1'>Flash Card Sprint</h2>
      <div class='w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[500px]'>
  <h2 class='text-3xl font-bold text-[var(--text-primary)] mb-2'>Flash Card Sprint</h2>
  <p class='text-lg mb-4'>Deck: <strong>${selectedSet.name||'Untitled'}</strong> • ${cards.length} cards • ${TOTAL_TIME}s. Type the answer (card back) for each prompt.</p>
  <div class='flex items-center justify-between text-lg mb-4 w-full'><span id='fsTimer' class='font-semibold text-[var(--text-primary)]'>Time: ${timeLeft}s</span><span id='fsProgress' class='text-[var(--text-secondary)]'>Card 1/${cards.length}</span></div>
  <div id='fsPrompt' class='text-2xl font-semibold text-[var(--text-primary)] mb-6 w-full'></div>
  <div class='flex gap-2 w-full'><input id='fsInput' autocomplete='off' class='flex-1 rounded border border-[var(--border-color)] p-4 text-xl' placeholder='Type answer...' /><button id='fsSubmit' class='px-6 py-4 rounded bg-[var(--primary-color)] text-white text-lg font-medium'>Enter</button></div>
  <div id='fsFeedback' class='text-base mt-4 h-6 w-full'></div>
  <div class='mt-6 text-base text-[var(--text-secondary)] w-full'>Esc to end early.</div>
      </div>`;

  function showCard(){
      if(index>=cards.length){ endGame(); return; }
      const card=cards[index];
      promptEl.textContent = card.front || '(blank)';
      progressEl.textContent = `Card ${index+1}/${cards.length}`;
      inputEl.value=''; inputEl.focus();
    }
    function submit(){
      if(index>=cards.length) return;
      const card=cards[index];
      const given=inputEl.value.trim();
      const expected=(card.back||'').trim();
      const ok = given.toLowerCase()===expected.toLowerCase();
      attempted++; if(ok) correct++;
      responses.push({front:card.front, expected, given, correct:ok});
      feedbackEl.innerHTML = ok? "<span class='text-green-600'>Correct</span>" : `<span class='text-red-600'>Ans: ${expected}</span>`;
      index++;
      setTimeout(()=>{ feedbackEl.textContent=''; showCard(); }, 650);
    }
    function endGame(){
      clearInterval(timerId);
      // Build review
      const review=document.createElement('div');
      review.innerHTML=`<h2 class='text-xl font-semibold text-[var(--text-primary)] mb-2'>Sprint Results</h2>
        <div class='text-xl mb-6'>Score: <strong>${correct}/${attempted}</strong> • Accuracy: ${attempted? ((correct/attempted)*100).toFixed(1):'0.0'}%</div>
        <div class='max-h-[350px] overflow-auto border rounded p-6 text-lg space-y-4 bg-[var(--background-color)] w-full'>
          ${responses.map(r=>`<div class='p-4 rounded bg-white shadow-sm border border-[var(--border-color)]'><div class='font-semibold text-[var(--text-primary)] mb-2'>${r.front}</div><div>${r.correct?"<span class='text-green-600'>✔</span>":"<span class='text-red-600'>✗</span>"} <span class='ml-2'>${r.correct? r.expected: r.given+' → '+r.expected}</span></div></div>`).join('')||'<div>No attempts.</div>'}
        </div>
        <div class='flex gap-4 mt-8 justify-center'>
          <button id='fsRestart' class='px-6 py-3 rounded bg-[var(--primary-color)] text-white text-lg font-semibold'>Play Again</button>
          <button id='fsClose' class='px-6 py-3 rounded bg-gray-300 text-[var(--text-primary)] text-lg font-semibold'>Close</button>
        </div>`;
      openModal(review);
      review.querySelector('#fsRestart').addEventListener('click',()=>{ openModal(wrap); reset(); });
      review.querySelector('#fsClose').addEventListener('click',()=>{ document.getElementById('gameModal')?.remove(); });
    }
    function reset(){
      timeLeft=TOTAL_TIME; index=0; correct=0; attempted=0; responses.length=0; timerEl.textContent=`Time: ${timeLeft}s`; progressEl.textContent=`Card 1/${cards.length}`; showCard(); inputEl.focus();
    }

    openModal(wrap);
    const promptEl=wrap.querySelector('#fsPrompt');
    const progressEl=wrap.querySelector('#fsProgress');
    const inputEl=wrap.querySelector('#fsInput');
    const feedbackEl=wrap.querySelector('#fsFeedback');
    const timerEl=wrap.querySelector('#fsTimer');
    wrap.querySelector('#fsSubmit').addEventListener('click',submit);
    inputEl.addEventListener('keydown',e=>{ if(e.key==='Enter'){ submit(); } else if(e.key==='Escape'){ endGame(); } });

    const timerId=setInterval(()=>{
      timeLeft--; timerEl.textContent=`Time: ${timeLeft}s`;
      if(timeLeft<=0){ endGame(); }
    },1000);

    showCard();
  }

  function quickMathDrill(){
    if(!window.__fpDrillCfg) window.__fpDrillCfg={ perQuestion:8, ops:['+','-','×','÷'] };
    const dc=window.__fpDrillCfg;
    let QUESTION_TIME=dc.perQuestion||8; // seconds per question
    let timerId=null; let timeLeft=QUESTION_TIME; let active=true;
    const attempts=[]; // {q, given, expected, correct, timeLeft}
    let current=null; let questionIndex=0;


    // Start page modal
    const startPage = document.createElement('div');
    startPage.innerHTML = `
      <h2 class='text-2xl font-bold text-[var(--text-primary)] mb-4'>Quick Math Drill</h2>
      <p class='text-lg mb-6'>Test your mental math speed! Answer each arithmetic problem before the timer hits 0.<br>One mistake or timeout ends the game.</p>
      <ul class='text-base mb-6 text-[var(--text-secondary)] list-disc pl-6 text-left'>
        <li>Press Enter or click Enter to submit.</li>
        <li>Esc to give up.</li>
      </ul>
      <button id='qmStart' class='px-8 py-4 rounded bg-[var(--primary-color)] text-white text-xl font-semibold'>Start</button>
    `;
    // Show onboarding modal and only start game after Start is clicked
    let started = false;
    startPage.querySelector('#qmStart').addEventListener('click', () => {
      if (started) return;
      started = true;
      openModal(wrap);
      gen();
    });
    setTimeout(() => openModal(startPage), 0);

    const wrap=document.createElement('div');
  wrap.innerHTML=`<h2 class='text-xl font-semibold text-[var(--text-primary)] mb-1'>Quick Math Drill</h2>
      <div class='w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[500px]'>
  <h2 class='text-3xl font-bold text-[var(--text-primary)] mb-2'>Quick Math Drill</h2>
  <p class='text-lg mb-4'>Answer each arithmetic problem before the timer hits 0. One mistake or timeout ends the game.</p>
  <div class='flex items-center justify-between text-lg mb-4 w-full'><span id='qmTimer' class='font-semibold text-[var(--text-primary)]'>Time: ${QUESTION_TIME}s</span><span id='qmProgress' class='text-[var(--text-secondary)]'>Question 1</span></div>
  <div id='qmPrompt' class='text-2xl font-semibold text-[var(--text-primary)] mb-6 w-full'></div>
  <div class='flex gap-2 mb-2 w-full'><input id='qmInput' type='number' class='flex-1 rounded border border-[var(--border-color)] p-4 text-xl' placeholder='Answer...' /><button id='qmSubmit' class='px-6 py-4 rounded bg-[var(--primary-color)] text-white text-lg font-medium'>Enter</button></div>
  <div id='qmFeedback' class='text-base h-6 w-full'></div>
  <div class='text-base text-[var(--text-secondary)] mt-6 w-full'>Press Enter to submit. Esc to give up.</div>
      </div>`;

    const promptEl=wrap.querySelector('#qmPrompt');
    const inputEl=wrap.querySelector('#qmInput');
    const submitBtn=wrap.querySelector('#qmSubmit');
    const timerEl=wrap.querySelector('#qmTimer');
    const progressEl=wrap.querySelector('#qmProgress');
    const feedbackEl=wrap.querySelector('#qmFeedback');

    function gen(){
      timeLeft=QUESTION_TIME;
      updateTimer();
      const ops=(dc.ops && dc.ops.length)? dc.ops:['+','-','×','÷'];
      const op=ops[Math.floor(Math.random()*ops.length)];
      let a=Math.floor(Math.random()*30)+1, b=Math.floor(Math.random()*30)+1; let ans=0;
      if(op==='-'){ if(a<b)[a,b]=[b,a]; ans=a-b; } else if(op==='+'){ ans=a+b; } else if(op==='×'){ ans=a*b; } else { // division => clean
        ans=Math.floor(Math.random()*12)+2; b=Math.floor(Math.random()*12)+2; a=ans*b; // a ÷ b = ans
      }
      current={ans,disp:`${a} ${op} ${b}`};
      questionIndex++;
      promptEl.textContent=current.disp + ' = ?';
      progressEl.textContent=`Question ${questionIndex}`;
      inputEl.value=''; inputEl.focus();
      if(timerId) clearInterval(timerId);
      timerId=setInterval(()=>{ if(!active) return; timeLeft--; updateTimer(); if(timeLeft<=0){ recordAttempt(''); endGame('Time up'); } },1000);
    }
    function updateTimer(){ timerEl.textContent=`Time: ${timeLeft}s`; }
    function recordAttempt(given){ attempts.push({ q: current.disp, given, expected:String(current.ans), correct: Number(given)===current.ans, timeLeft }); }
    function submit(){ if(!active) return; const val=inputEl.value.trim(); if(val==='') return; const correct = Number(val)===current.ans; recordAttempt(val); if(!correct){ endGame('Incorrect'); return; } // correct -> next
      feedbackEl.innerHTML='<span class="text-green-600">Correct</span>'; setTimeout(()=>{ feedbackEl.textContent=''; gen(); },350); }
    function endGame(reason){
      if(!active) return;
      active=false;
      if(timerId) clearInterval(timerId);
      submitBtn.disabled=true;
      inputEl.disabled=true;
      showReview(reason);
    }

    // Ensure game is killed if modal is closed via X or Esc
    function killGameEarly() {
      if (active) endGame('Exited early');
    }
    // Patch modal close button to kill game
    setTimeout(() => {
      const modal = document.getElementById('gameModal');
      if (modal) {
        const closeBtn = modal.querySelector('#gmClose');
        if (closeBtn) {
          closeBtn.addEventListener('click', killGameEarly);
        }
        modal.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') killGameEarly();
        });
      }
    }, 100);
    function showReview(reason){
      const review=document.createElement('div');
      const score=attempts.filter(a=>a.correct).length;
      review.innerHTML=`<h2 class='text-xl font-semibold text-[var(--text-primary)] mb-2'>Drill Over</h2>
        <div class='text-xl mb-6'>Reason: <strong>${reason}</strong></div>
        <div class='text-xl mb-6'>Score: <strong>${score}/${attempts.length}</strong> • Accuracy: ${attempts.length?((score/attempts.length)*100).toFixed(1):'0.0'}%</div>
        <div class='max-h-[350px] overflow-auto border rounded p-6 text-lg bg-[var(--background-color)] space-y-4 w-full'>
          ${attempts.map(a=>`<div class='p-4 bg-white rounded border border-[var(--border-color)]'><div class='font-semibold text-[var(--text-primary)] mb-2'>${a.q}</div><div>${a.correct?"<span class='text-green-600'>✔</span>":"<span class='text-red-600'>✗</span>"} <span class='ml-2'>${a.correct? a.given : (a.given||'∅')+' → '+a.expected}</span> <span class='ml-4 text-base text-[var(--text-secondary)]'>t:${QUESTION_TIME - a.timeLeft}s</span></div></div>`).join('')||'<div>No attempts.</div>'}
        </div>
        <div class='flex gap-4 mt-8 justify-center'>
          <button id='qmRestart' class='px-6 py-3 rounded bg-[var(--primary-color)] text-white text-lg font-semibold'>Play Again</button>
          <button id='qmClose' class='px-6 py-3 rounded bg-gray-300 text-[var(--text-primary)] text-lg font-semibold'>Close</button>
        </div>`;
      openModal(review);
      review.querySelector('#qmRestart').addEventListener('click',()=>{ document.getElementById('gameModal')?.remove(); quickMathDrill(); });
      review.querySelector('#qmClose').addEventListener('click',()=>{ document.getElementById('gameModal')?.remove(); });
    }

    submitBtn.addEventListener('click',submit);
    inputEl.addEventListener('keydown',e=>{ if(e.key==='Enter') submit(); else if(e.key==='Escape') endGame('Gave up'); });

  openModal(wrap);
  gen();
  }

  function wireGameButtons(){
    document.querySelectorAll('[data-game]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id=btn.getAttribute('data-game');
        if(btn.classList.contains('cursor-not-allowed')) return;
        if(id==='flash-sprint') startFlashCardSprint();
        if(id==='quick-math') quickMathDrill();
        if(id==='concept-typer') conceptTyperGame();
      });
    });
  }

  // Expose for future extension
    function conceptTyperGame() {
    // --- Concept Typer stat tracking ---
    function saveConceptTyperStats(stats) {
      let all = [];
      try { all = JSON.parse(localStorage.getItem('fpConceptTyperStats')||'[]'); } catch {}
      all.push(stats);
      localStorage.setItem('fpConceptTyperStats', JSON.stringify(all));
    }
    // Typing accuracy game: present random sentences, user must type exactly
    const sentences = [
      "The quick brown fox jumps over the lazy dog.",
      "Pack my box with five dozen liquor jugs.",
      "How razorback-jumping frogs can level six piqued gymnasts!",
      "Sphinx of black quartz, judge my vow.",
      "The five boxing wizards jump quickly.",
      "Jackdaws love my big sphinx of quartz.",
      "Waltz, nymph, for quick jigs vex Bud.",
      "Glib jocks quiz nymph to vex dwarf.",
      "Bright vixens jump; dozy fowl quack.",
      "Quick zephyrs blow, vexing daft Jim."
    ];
    let rounds = 10;
    let current = 0, correct = 0, total = 0, times = [], startTime = 0;
    let used = [];
    function getRandomSentence() {
      if (used.length === sentences.length) used = [];
      let idx;
      do { idx = Math.floor(Math.random() * sentences.length); } while (used.includes(idx));
      used.push(idx);
      return sentences[idx];
    }
    // Start page modal
    const startPage = document.createElement('div');
    startPage.innerHTML = `
      <h2 class='text-2xl font-bold text-[var(--text-primary)] mb-4'>Concept Typer</h2>
      <p class='text-lg mb-6'>Test your typing accuracy! Type the sentence exactly as shown.<br>Try to get as many correct as possible in ${rounds} rounds.</p>
      <ul class='text-base mb-6 text-[var(--text-secondary)] list-disc pl-6 text-left'>
        <li>Press Enter to submit each sentence.</li>
        <li>Accuracy and speed are tracked.</li>
      </ul>
      <button id='ctStart' class='px-8 py-4 rounded bg-[var(--primary-color)] text-white text-xl font-semibold'>Start</button>
    `;
    // Show onboarding modal and only start game after Start is clicked
    let started = false;
    startPage.querySelector('#ctStart').addEventListener('click', () => {
      if (started) return;
      started = true;
      openModal(wrap);
      showSentence();
      showStats();
    });
    setTimeout(() => openModal(startPage), 0);

    const wrap = document.createElement('div');
    wrap.innerHTML = `<h2 class='text-xl font-semibold text-[var(--text-primary)] mb-1'>Concept Typer</h2>
      <div class='w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[500px]'>
  <h2 class='text-3xl font-bold text-[var(--text-primary)] mb-2'>Concept Typer</h2>
  <p class='text-lg mb-4'>Type the sentence exactly as shown. Press Enter to submit.</p>
  <div class='flex items-center justify-between text-lg mb-4 w-full'><span id='ctProgress' class='text-[var(--text-secondary)]'>Round 1/${rounds}</span></div>
  <div id='ctPrompt' class='typer-word mb-6 w-full text-2xl font-semibold'></div>
  <input type='text' class='typer-input mb-6 w-full p-4 text-xl rounded border border-[var(--border-color)]' id='ctInput' autocomplete='off' placeholder='Type here...' />
  <div class='typer-result text-base mb-4' id='ctResult'></div>
  <div class='mt-6 text-base text-gray-500' id='ctStats'></div>
      </div>`;
    let currentSentence = "";
    function showSentence() {
      if (current >= rounds) { endGame(); return; }
      currentSentence = getRandomSentence();
      wrap.querySelector('#ctPrompt').textContent = currentSentence;
      wrap.querySelector('#ctInput').value = '';
      wrap.querySelector('#ctResult').textContent = '';
      wrap.querySelector('#ctInput').disabled = false;
      wrap.querySelector('#ctInput').focus();
      wrap.querySelector('#ctProgress').textContent = `Round ${current+1}/${rounds}`;
      startTime = Date.now();
    }
    function showStats() {
      let avg = times.length ? (times.reduce((a,b)=>a+b,0)/times.length/1000).toFixed(2) : 0;
      wrap.querySelector('#ctStats').textContent = `Correct: ${correct}/${total} | Avg Time: ${avg}s`;
    }
    function checkInput(e) {
      if (e.key === 'Enter') {
        let input = wrap.querySelector('#ctInput').value;
        total++;
        let timeTaken = Date.now() - startTime;
        times.push(timeTaken);
        if (input === currentSentence) {
          correct++;
          wrap.querySelector('#ctResult').textContent = 'Correct!';
        } else {
          wrap.querySelector('#ctResult').textContent = `Incorrect.`;
        }
        wrap.querySelector('#ctInput').disabled = true;
        setTimeout(() => { current++; showSentence(); showStats(); }, 700);
        showStats();
      }
    }
    function endGame() {
      // Save stats invisibly
      saveConceptTyperStats({
        date: Date.now(),
        correct,
        total,
        avgTime: times.length ? (times.reduce((a,b)=>a+b,0)/times.length/1000) : 0,
        bestStreak: correct, // for now, correct answers in a session
      });
      wrap.innerHTML = `<h2 class='text-xl font-semibold text-[var(--text-primary)] mb-2'>Game Over!</h2>
        <div class='text-2xl mb-6'>Final Score: ${correct}/${total}</div>
        <div class='text-2xl mb-6'>Avg Time: ${times.length ? (times.reduce((a,b)=>a+b,0)/times.length/1000).toFixed(2) : 0}s</div>
        <div class='flex gap-4 mt-8 justify-center'>
          <button id='ctClose' class='px-6 py-3 rounded bg-gray-300 text-[var(--text-primary)] text-lg font-semibold'>Close</button>
        </div>`;
      wrap.querySelector('#ctClose').addEventListener('click',()=>{ document.getElementById('gameModal')?.remove(); });
    }
    wrap.querySelector('#ctInput').addEventListener('keydown', checkInput);
    openModal(wrap);
    showSentence();
    showStats();
  }
  window.FPGames = { startFlashCardSprint, quickMathDrill, showSprintSettings, showDrillSettings, conceptTyperGame };
})();
