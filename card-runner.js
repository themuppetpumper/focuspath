// card-runner.js
(function(){
  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
  function escapeHTML(s){ return (s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
  function loadCardSets(){ try { return JSON.parse(localStorage.getItem('flashcardSets')||'[]'); } catch { return []; } }
  function getSet(id){ return loadCardSets().find(s=>String(s.id)===String(id)) || null; }
  function ensureStyles(){ if(document.getElementById('card-runner-styles')) return; const st=document.createElement('style'); st.id='card-runner-styles'; st.textContent=`
    .fc-study-wrapper { max-width:640px; margin:0 auto; }
    .fc-card-stage { position:relative; height:300px; }
    .fc-card-shell { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
    .fc-card-persp { perspective:1400px; width:100%; height:100%; }
    .fc-flip { position:relative; width:100%; height:100%; transform-style:preserve-3d; cursor:pointer; transition: transform .55s ease; }
    .fc-flip.flipped { transform: rotateY(180deg); }
  .fc-face { position:absolute; inset:0; backface-visibility:hidden; border:1px solid var(--border-color); border-radius:1rem; padding:1.5rem 1.25rem; background:var(--white); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; font-size:.98rem; line-height:1.38; }
  .fc-face-content { width:100%; }
  .fc-card-img-wrap { width:100%; display:flex; justify-content:center; margin-bottom:.75rem; }
  .fc-card-img-wrap img { max-height:220px; max-width:100%; object-fit:contain; border-radius:.75rem; box-shadow:0 3px 10px rgba(0,0,0,.10); }
    .fc-face.fc-back { transform: rotateY(180deg); }
    .fc-hint-pop { position:absolute; top:0; left:100%; margin-left:1rem; width:210px; background:var(--white); border:1px solid var(--border-color); border-radius:.8rem; padding:.7rem .75rem; box-shadow:0 4px 16px rgba(0,0,0,.08); font-size:.7rem; line-height:1.2; }
    @media (max-width:900px){ .fc-hint-pop { position:static; width:100%; margin:1rem 0 0 0; } }
  `; document.head.appendChild(st); }

  window.startCardRunner = function(setId){
    const set=getSet(setId); const container=document.getElementById('primaryArea'); if(!container) return;
    if(!set){ container.innerHTML='<div class="p-8 text-center text-[var(--text-secondary)]">Set not found.</div>'; return; }
    if(!set.cards || !set.cards.length){ container.innerHTML='<div class="p-8 text-center text-[var(--text-secondary)]">No cards to study.</div>'; return; }
    ensureStyles();
    fetch('card-runner.html').then(r=>r.text()).then(html=>{
      container.innerHTML=html;
      const stage=document.getElementById('fcStage');
      const meta=document.getElementById('fcMeta');
      const hintPop=document.getElementById('fcHintPop');
      let order=shuffle(set.cards.map((_,i)=>i));
      const state={ idx:0, flipped:false, hint:false };
      const sessionStart=Date.now();
      const seen=new Set();
      let sessionLogged=false;
      function logSession(){
        if(sessionLogged) return; sessionLogged=true;
        const durationSeconds=Math.max(1, Math.round((Date.now()-sessionStart)/1000));
        const payload={ setId:set.id, setName:set.name, subject:set.subject||'', date:new Date().toISOString(), cardsSeen:seen.size, uniqueCardIds:[...seen], totalCards:set.cards.length, durationSeconds };
        let sessions=[]; try{ sessions=JSON.parse(localStorage.getItem('flashcardSessions')||'[]'); }catch{}
        sessions.push(payload);
        localStorage.setItem('flashcardSessions', JSON.stringify(sessions));
      }
      window.addEventListener('beforeunload', logSession, { once:true });
      function finishSession(){
        logSession();
        try { window.removeEventListener('beforeunload', logSession); } catch {}
        window.__selectedSetId=null;
        // Clear selection highlight in list
        document.querySelectorAll('#cardList .test-item').forEach(n=>n.classList.remove('selected'));
        if(typeof renderFlashcardDashboard==='function'){
          try { renderFlashcardDashboard(); } catch{}
        } else {
          const primary=document.getElementById('primaryArea');
          if(primary) primary.innerHTML='<div class="min-h-[46vh] flex items-center justify-center text-[var(--text-secondary)]">Session finished.</div>';
        }
      }
      function updateMeta(){ meta.innerHTML=`<span>${escapeHTML(set.subject||'(No Subject)')}</span><span>Card ${state.idx+1} / ${order.length}</span>`; }
      function buildCard(card){
        const wrap=document.createElement('div'); wrap.className='fc-card-anim';
        const shell=document.createElement('div'); shell.className='fc-card-shell';
        const persp=document.createElement('div'); persp.className='fc-card-persp';
        const flip=document.createElement('div'); flip.className='fc-flip'; flip.id='fcFlipCurrent';
        // Build front content with optional image
        let frontHTML = '';
        if(card.image){ frontHTML += `<div class="fc-card-img-wrap"><img src="${card.image}" alt="Card image" loading="lazy"/></div>`; }
        frontHTML += `<div class="fc-face-content">${escapeHTML(card.front||'(Front)')}</div>`;
        // Back content (text only for now; could also show image if desired)
        let backHTML = `<div class="fc-face-content">${escapeHTML(card.back||'(Back)')}</div>`;
        flip.innerHTML = `<div class="fc-face fc-front">${frontHTML}</div><div class="fc-face fc-back">${backHTML}</div>`;
        flip.addEventListener('click',()=>{ state.flipped=!state.flipped; flip.classList.toggle('flipped', state.flipped); });
        persp.appendChild(flip); shell.appendChild(persp); wrap.appendChild(shell); return wrap;
      }
      function showCard(){
        const card=set.cards[order[state.idx]];
  if(card) seen.add(card.id || order[state.idx]);
        updateMeta();
        hintPop.style.display=(state.hint && card.hint)?'':'none';
        hintPop.textContent=card.hint||'';
        stage.innerHTML='';
        stage.appendChild(buildCard(card));
        // Toggle Next vs Finish buttons
        if(state.idx === order.length -1){
          nextBtn.classList.add('hidden');
          finishBtn.classList.remove('hidden');
        } else {
          finishBtn.classList.add('hidden');
          nextBtn.classList.remove('hidden');
        }
      }
  document.getElementById('btnPrevCard').addEventListener('click',()=>{ if(state.idx===0) return; state.idx--; state.flipped=false; state.hint=false; showCard(); prevBtn.disabled = state.idx===0; });
      const prevBtn=document.getElementById('btnPrevCard');
      const nextBtn=document.getElementById('btnNextCard');
      const finishBtn=document.getElementById('btnFinishSession');
  nextBtn.addEventListener('click',()=>{ if(state.idx<order.length-1){ state.idx++; state.flipped=false; state.hint=false; prevBtn.disabled = state.idx===0; showCard(); } else { finishSession(); } });
      finishBtn.addEventListener('click', finishSession);
      document.getElementById('btnHint').addEventListener('click',()=>{ state.hint=!state.hint; const card=set.cards[order[state.idx]]; hintPop.style.display=(state.hint && card.hint)?'':'none'; hintPop.textContent=card.hint||''; });
  document.getElementById('btnReturnSet').addEventListener('click',()=>{ logSession(); const node=document.querySelector(`#cardList .test-item[data-id="${set.id}"] div`); if(node) node.click(); else if(typeof renderFlashcardSets==='function') renderFlashcardSets(); if(typeof renderFlashcardDashboard==='function') try{ renderFlashcardDashboard(); }catch{} });
  prevBtn.disabled=true; showCard();
    });
  };
})();