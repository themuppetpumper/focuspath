// card-builder.js

// ---- Storage Helpers ----
function loadCardSets() {
  try { return JSON.parse(localStorage.getItem('flashcardSets') || '[]'); } catch { return []; }
}
function saveCardSets(sets) {
  localStorage.setItem('flashcardSets', JSON.stringify(sets));
}
function generateSetId() { return 'fcset_' + Date.now() + '_' + Math.random().toString(36).slice(2,7); }
function generateCardId() { return 'fccard_' + Date.now() + '_' + Math.random().toString(36).slice(2,7); }

// ---- State ----
let currentSet = null; // { id, subject, name, desc, cards: [{id, front, back, tags:[], hint:null, image:null}] }
let activeCardIndex = null;
let fcEls = {};

// ---- Init ----
window.initCardBuilder = function () {
  currentSet = { id: null, subject: '', name: '', desc: '', cards: [] };
  activeCardIndex = null;

  fcEls = {
    subject: document.getElementById('fcSubject'),
    name: document.getElementById('fcName'),
    desc: document.getElementById('fcDesc'),
    btnSaveSet: document.getElementById('btnSaveSet'),
    btnAddCard: document.getElementById('btnAddCard'),
    btnBulkAdd: document.getElementById('btnBulkAdd'),
    btnSaveCard: document.getElementById('btnSaveCard'),
    btnMoveUp: document.getElementById('btnMoveUp'),
    btnMoveDown: document.getElementById('btnMoveDown'),
    btnDeleteCard: document.getElementById('btnDeleteCard'),
    cardsList: document.getElementById('cardsList'),
    activeCard: document.getElementById('activeCard')
  };

  if (!fcEls.cardsList || !fcEls.activeCard) {
    console.error('Card Builder: missing required DOM nodes');
    return;
  }

  fcEls.btnAddCard?.addEventListener('click', () => {
    const newCard = { id: generateCardId(), front: '', back: '', tags: [], hint: '', image: null };
    currentSet.cards.push(newCard);
    activeCardIndex = currentSet.cards.length - 1;
    renderCardsList();
    renderActiveCard();
  });

  fcEls.btnBulkAdd?.addEventListener('click', () => {
    const example = 'Term 1 :: Definition 1\nTerm 2 :: Definition 2';
    const text = prompt('Bulk Add (format: Front :: Back per line):', example);
    if (!text) return;
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    lines.forEach(line => {
      const [front, back=''] = line.split('::').map(s => s.trim());
      if (front) currentSet.cards.push({ id: generateCardId(), front, back, tags: [], hint: '', image: null });
    });
    if (currentSet.cards.length && activeCardIndex == null) activeCardIndex = 0;
    renderCardsList();
    renderActiveCard();
  });

  fcEls.btnSaveCard?.addEventListener('click', () => {
    // Clean tags by trimming
    const card = currentSet.cards[activeCardIndex ?? -1];
    if (card) {
      card.tags = (card.tags || []).map(t => t.trim()).filter(Boolean);
    }
    renderCardsList();
  });

  fcEls.btnMoveUp?.addEventListener('click', () => {
    if (activeCardIndex == null || activeCardIndex <= 0) return;
    const i = activeCardIndex;
    [currentSet.cards[i-1], currentSet.cards[i]] = [currentSet.cards[i], currentSet.cards[i-1]];
    activeCardIndex = i - 1;
    renderCardsList();
    renderActiveCard();
  });
  fcEls.btnMoveDown?.addEventListener('click', () => {
    if (activeCardIndex == null || activeCardIndex >= currentSet.cards.length - 1) return;
    const i = activeCardIndex;
    [currentSet.cards[i+1], currentSet.cards[i]] = [currentSet.cards[i], currentSet.cards[i+1]];
    activeCardIndex = i + 1;
    renderCardsList();
    renderActiveCard();
  });
  fcEls.btnDeleteCard?.addEventListener('click', () => {
    if (activeCardIndex == null) return;
    currentSet.cards.splice(activeCardIndex, 1);
    if (activeCardIndex >= currentSet.cards.length) activeCardIndex = currentSet.cards.length - 1;
    if (currentSet.cards.length === 0) activeCardIndex = null;
    renderCardsList();
    renderActiveCard();
  });

  fcEls.btnSaveSet?.addEventListener('click', () => {
    currentSet.subject = fcEls.subject?.value?.trim() || '';
    currentSet.name = fcEls.name?.value?.trim() || '';
    currentSet.desc = fcEls.desc?.value?.trim() || '';
    if (!currentSet.name) { alert('Please provide a Subject Component (Set Name).'); return; }
    let sets = loadCardSets();
    if (!currentSet.id) {
      currentSet.id = generateSetId();
      sets.push(currentSet);
    } else {
      const idx = sets.findIndex(s => s.id === currentSet.id);
      if (idx >= 0) sets[idx] = currentSet; else sets.push(currentSet);
    }
    saveCardSets(sets);
    if (typeof renderFlashcardSets === 'function') renderFlashcardSets();
    alert('Flashcard set saved!');
  });

  renderCardsList();
  renderActiveCard();
  // Subject custom creation handler
  if(fcEls.subject){
    // --- Subject Management Helpers (mirrors loadSetIntoBuilder logic) ---
    function toggleRemoveBtnFC(){ const btn=document.getElementById('btnRemoveSubjectFC'); if(!btn) return; const val=fcEls.subject.value; if(!val || val==='__create'){ btn.classList.add('hidden'); return;} btn.classList.remove('hidden'); }
    function loadCustomSubjectsFC(){
      try { 
        const list=JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]');
        const removed=JSON.parse(localStorage.getItem('fpRemovedDefaultSubjects')||'[]');
        // prune removed defaults from current select
        [...fcEls.subject.options].forEach(o=>{ if(o.value && removed.includes(o.value)) o.remove(); });
        list.forEach(sub=>{ if(!Array.from(fcEls.subject.options).some(o=>o.value===sub)){ const opt=document.createElement('option'); opt.value=sub; opt.textContent=sub; fcEls.subject.insertBefore(opt, fcEls.subject.querySelector('option[value="__create"]')); } });
      } catch {}
    }
    function removeCurrentSubjectFC(){
      const val=fcEls.subject.value; if(!val) return; if(!confirm('Remove subject "'+val+'" from dropdown? Existing sets keep the label.')) return;
      try{
        let list=JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]');
        if(list.includes(val)){
          list=list.filter(s=>s!==val); localStorage.setItem('fpCustomSubjects',JSON.stringify(list));
          const map=JSON.parse(localStorage.getItem('fpSubjectColors')||'{}'); delete map[val]; localStorage.setItem('fpSubjectColors',JSON.stringify(map));
        } else {
          let rem=JSON.parse(localStorage.getItem('fpRemovedDefaultSubjects')||'[]'); if(!rem.includes(val)){ rem.push(val); localStorage.setItem('fpRemovedDefaultSubjects',JSON.stringify(rem)); }
        }
      }catch{}
      const opt=[...fcEls.subject.options].find(o=>o.value===val); if(opt) opt.remove(); fcEls.subject.value=''; toggleRemoveBtnFC();
    }
    // Attach manage/remove button handlers
    document.getElementById('btnManageSubjectsFC')?.addEventListener('click',()=>{ const list=JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]'); alert(list.length? 'Custom Subjects:\n'+list.join('\n') : 'No custom subjects yet.'); });
    document.getElementById('btnRemoveSubjectFC')?.addEventListener('click', removeCurrentSubjectFC);

    // Creation handler (add to both color map AND fpCustomSubjects)
    fcEls.subject.addEventListener('change',()=>{
      if(fcEls.subject.value==='__create'){
        let name=prompt('Enter new subject name:');
        if(name){
          name=name.trim();
          if(name){
            try {
              const map=JSON.parse(localStorage.getItem('fpSubjectColors')||'{}');
              const list=JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]');
              if(!list.includes(name)){ list.push(name); localStorage.setItem('fpCustomSubjects',JSON.stringify(list)); }
              if(!map[name]){
                const used=new Set(Object.values(map).map(v=>v.toLowerCase()));
                const palette=['#ef4444','#f59e0b','#0d78f2','#22c55e','#8b5cf6','#14b8a6','#6366f1','#ec4899','#10b981','#eab308','#0ea5e9','#fb923c','#84cc16','#f472b6','#38bdf8','#a855f7','#dc2626','#2563eb','#9333ea','#047857','#ea580c'];
                let pick=null; for(const col of palette){ if(!used.has(col.toLowerCase())) { pick=col; break; } }
                let guard=0; while(!pick && guard<50){ const cand='#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'); if(!used.has(cand.toLowerCase())) pick=cand; guard++; }
                if(!pick) pick='#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
                map[name]=pick; localStorage.setItem('fpSubjectColors',JSON.stringify(map));
              }
            }catch{}
            const exists=Array.from(fcEls.subject.options).some(o=>o.value===name||o.text===name);
            if(!exists){ const opt=document.createElement('option'); opt.value=name; opt.textContent=name; fcEls.subject.insertBefore(opt, fcEls.subject.querySelector('option[value="__create"]')); }
            fcEls.subject.value=name; toggleRemoveBtnFC();
          } else { fcEls.subject.value=''; }
        } else { fcEls.subject.value=''; }
      }
      toggleRemoveBtnFC();
    });
    // Initial population & pruning
    loadCustomSubjectsFC();
    try { const rem=JSON.parse(localStorage.getItem('fpRemovedDefaultSubjects')||'[]'); if(rem.length){ [...fcEls.subject.options].forEach(o=>{ if(rem.includes(o.value)) o.remove(); }); } } catch {}
    toggleRemoveBtnFC();
  }
};

// Load existing set into builder
window.loadSetIntoBuilder = function(setObj) {
  if (!setObj) return;
  currentSet = JSON.parse(JSON.stringify(setObj));
  activeCardIndex = 0;
  if (fcEls.subject && currentSet.subject) {
    const exists = Array.from(fcEls.subject.options).some(o => o.value === currentSet.subject || o.text === currentSet.subject);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = currentSet.subject; opt.textContent = currentSet.subject;
      fcEls.subject.insertBefore(opt, fcEls.subject.firstChild);
    }
    fcEls.subject.value = currentSet.subject;
  }
  fcEls.name.value = currentSet.name || '';
  fcEls.desc.value = currentSet.desc || '';
  renderCardsList();
  renderActiveCard();
  // Subject custom creation handler
  if(fcEls.subject){
    fcEls.subject.addEventListener('change',()=>{
      if(fcEls.subject.value==='__create'){
        let name=prompt('Enter new subject name:');
        if(name){
          name=name.trim();
          if(name){
            try{
              const map=JSON.parse(localStorage.getItem('fpSubjectColors')||'{}');
              const list=JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]');
              if(!list.includes(name)){ list.push(name); localStorage.setItem('fpCustomSubjects',JSON.stringify(list)); }
              if(!map[name]){
                const used=new Set(Object.values(map).map(v=>v.toLowerCase()));
                const palette=['#ef4444','#f59e0b','#0d78f2','#22c55e','#8b5cf6','#14b8a6','#6366f1','#ec4899','#10b981','#eab308','#0ea5e9','#fb923c','#84cc16','#f472b6','#38bdf8','#a855f7','#dc2626','#2563eb','#9333ea','#047857','#ea580c'];
                let pick=null; for(const col of palette){ if(!used.has(col.toLowerCase())){ pick=col; break; } }
                let guard=0; while(!pick && guard<50){ const cand='#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'); if(!used.has(cand.toLowerCase())) pick=cand; guard++; }
                if(!pick) pick='#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
                map[name]=pick; localStorage.setItem('fpSubjectColors',JSON.stringify(map));
              }
            }catch{}
            const exists=Array.from(fcEls.subject.options).some(o=>o.value===name||o.text===name);
            if(!exists){ const opt=document.createElement('option'); opt.value=name; opt.textContent=name; fcEls.subject.insertBefore(opt, fcEls.subject.querySelector('option[value="__create"]')); }
            fcEls.subject.value=name; toggleRemoveBtnFC();
          } else { fcEls.subject.value=''; }
        } else { fcEls.subject.value=''; }
      }
      toggleRemoveBtnFC();
    });
  }
  function loadCustomSubjectsFC(){
    try{ const list=JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]'); const removed=JSON.parse(localStorage.getItem('fpRemovedDefaultSubjects')||'[]'); if(fcEls.subject){
      // prune removed defaults
      [...fcEls.subject.options].forEach(o=>{ if(o.value && removed.includes(o.value)) o.remove(); });
      list.forEach(sub=>{ if(!Array.from(fcEls.subject.options).some(o=>o.value===sub)){ const opt=document.createElement('option'); opt.value=sub; opt.textContent=sub; fcEls.subject.insertBefore(opt, fcEls.subject.querySelector('option[value="__create"]')); } });
    }}catch{}
  }
  function removeCurrentSubjectFC(){
    const val=fcEls.subject.value; if(!val) return; if(!confirm('Remove subject "'+val+'" from dropdown? Existing sets keep the label.')) return;
    try{ let list=JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]'); if(list.includes(val)){ list=list.filter(s=>s!==val); localStorage.setItem('fpCustomSubjects',JSON.stringify(list)); const map=JSON.parse(localStorage.getItem('fpSubjectColors')||'{}'); delete map[val]; localStorage.setItem('fpSubjectColors',JSON.stringify(map)); } else { let rem=JSON.parse(localStorage.getItem('fpRemovedDefaultSubjects')||'[]'); if(!rem.includes(val)){ rem.push(val); localStorage.setItem('fpRemovedDefaultSubjects',JSON.stringify(rem)); } } }catch{}
    const opt=[...fcEls.subject.options].find(o=>o.value===val); if(opt) opt.remove(); fcEls.subject.value=''; toggleRemoveBtnFC();
  }
  function toggleRemoveBtnFC(){ const btn=document.getElementById('btnRemoveSubjectFC'); if(!btn) return; const val=fcEls.subject.value; if(!val || val==='__create'){ btn.classList.add('hidden'); return; } btn.classList.remove('hidden'); }
  document.getElementById('btnManageSubjectsFC')?.addEventListener('click',()=>{ const list=JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]'); alert(list.length? 'Custom Subjects:\n'+list.join('\n') : 'No custom subjects yet.'); });
  document.getElementById('btnRemoveSubjectFC')?.addEventListener('click',removeCurrentSubjectFC);
  loadCustomSubjectsFC(); toggleRemoveBtnFC();
  // If editing existing, ensure any previously removed default subjects not shown
  try{ const rem=JSON.parse(localStorage.getItem('fpRemovedDefaultSubjects')||'[]'); if(rem.length && fcEls.subject){ [...fcEls.subject.options].forEach(o=>{ if(rem.includes(o.value)) o.remove(); }); } }catch{}
};

// ---- Rendering ----
function renderCardsList() {
  const list = fcEls.cardsList;
  list.innerHTML = '';
  if (!currentSet.cards.length) {
    list.innerHTML = '<div class="text-[var(--text-secondary)] italic">No cards yet. Use "+ Card".</div>';
    return;
  }
  currentSet.cards.forEach((c,i) => {
    const div = document.createElement('div');
    div.className = 'p-2 rounded-md bg-white shadow cursor-pointer hover:bg-gray-100 flex items-start gap-2 text-xs';
    div.innerHTML = `
      <div class="flex-1">
        <div class="font-medium line-clamp-1">${(c.front || '(Front)')}</div>
        <div class="text-[var(--text-secondary)] line-clamp-1">${(c.back || '(Back)')}</div>
      </div>
    `;
    div.addEventListener('click', () => {
      activeCardIndex = i;
      renderActiveCard();
      [...list.children].forEach(el => el.classList.remove('ring-2','ring-blue-200'));
      div.classList.add('ring-2','ring-blue-200');
    });
    if (i === activeCardIndex) div.classList.add('ring-2','ring-blue-200');
    list.appendChild(div);
  });
}

function renderActiveCard() {
  const wrap = fcEls.activeCard;
  wrap.innerHTML = '';
  const up = fcEls.btnMoveUp, down = fcEls.btnMoveDown, del = fcEls.btnDeleteCard;
  if (activeCardIndex == null) {
    wrap.innerHTML = '<div class="text-[var(--text-secondary)] italic">No active card. Add one to begin editing.</div>';
    if (up) up.disabled = true; if (down) down.disabled = true; if (del) del.disabled = true;
    return;
  }
  const card = currentSet.cards[activeCardIndex];
  if (up) up.disabled = activeCardIndex === 0;
  if (down) down.disabled = activeCardIndex === currentSet.cards.length - 1;
  if (del) del.disabled = false;

  const frontLbl = document.createElement('label'); frontLbl.className='block font-medium text-[var(--text-primary)] mb-1'; frontLbl.textContent='Front (Prompt / Term)';
  const frontTxt = document.createElement('textarea'); frontTxt.rows=3; frontTxt.className='w-full rounded-md border-gray-300 p-2'; frontTxt.placeholder='Enter front text...'; frontTxt.value = card.front || ''; frontTxt.addEventListener('input', e => { card.front = e.target.value; });

  const backLbl = document.createElement('label'); backLbl.className='block font-medium text-[var(--text-primary)] mb-1 mt-4'; backLbl.textContent='Back (Answer / Definition)';
  const backTxt = document.createElement('textarea'); backTxt.rows=4; backTxt.className='w-full rounded-md border-gray-300 p-2'; backTxt.placeholder='Enter back text...'; backTxt.value = card.back || ''; backTxt.addEventListener('input', e => { card.back = e.target.value; });

  const hintLbl = document.createElement('label'); hintLbl.className='block font-medium text-[var(--text-primary)] mb-1 mt-4'; hintLbl.textContent='Hint (optional)';
  const hintTxt = document.createElement('input'); hintTxt.type='text'; hintTxt.className='w-full rounded-md border-gray-300 p-2'; hintTxt.placeholder='Short hint...'; hintTxt.value = card.hint || ''; hintTxt.addEventListener('input', e => { card.hint = e.target.value; });

  const tagsLbl = document.createElement('label'); tagsLbl.className='block font-medium text-[var(--text-primary)] mb-1 mt-4'; tagsLbl.textContent='Tags (comma separated)';
  const tagsInput = document.createElement('input'); tagsInput.type='text'; tagsInput.className='w-full rounded-md border-gray-300 p-2'; tagsInput.placeholder='e.g. chapter 1, key term'; tagsInput.value = (card.tags || []).join(', '); tagsInput.addEventListener('input', e => { card.tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean); });

  // Optional future: image upload per card
  const imageBlock = document.createElement('div'); imageBlock.className='mt-4 space-y-2';
  const imgLbl = document.createElement('div'); imgLbl.className='font-medium text-[var(--text-primary)]'; imgLbl.textContent='Image (optional)';
  const imgRow = document.createElement('div'); imgRow.className='flex items-center gap-3 flex-wrap';
  const imgInput = document.createElement('input'); imgInput.type='file'; imgInput.accept='image/*'; imgInput.className='text-sm';
  const preview = document.createElement('img'); preview.className='max-h-32 rounded border border-[var(--border-color)] ' + (card.image ? '' : 'hidden'); preview.alt='Card image'; if (card.image) preview.src = card.image;
  const btnRemove = document.createElement('button'); btnRemove.type='button'; btnRemove.textContent='Remove'; btnRemove.className='px-2 py-1 text-xs rounded border border-[var(--border-color)] hover:bg-gray-100 disabled:opacity-50'; btnRemove.disabled = !card.image; btnRemove.addEventListener('click', () => { card.image = null; preview.src=''; preview.classList.add('hidden'); btnRemove.disabled = true; });
  imgInput.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (!f) return; const rdr = new FileReader(); rdr.onload = ev => { card.image = ev.target.result; preview.src = card.image; preview.classList.remove('hidden'); btnRemove.disabled = false; }; rdr.readAsDataURL(f); });
  imgRow.appendChild(imgInput); imgRow.appendChild(btnRemove); imageBlock.appendChild(imgLbl); imageBlock.appendChild(imgRow); imageBlock.appendChild(preview);

  wrap.appendChild(frontLbl); wrap.appendChild(frontTxt);
  wrap.appendChild(backLbl); wrap.appendChild(backTxt);
  wrap.appendChild(hintLbl); wrap.appendChild(hintTxt);
  wrap.appendChild(tagsLbl); wrap.appendChild(tagsInput);
  wrap.appendChild(imageBlock);
}
