// Nova widget (shared)
// Loads a floating "Ask Nova" button and a chat modal. Lazy-loads ./aiAssistant.js on demand.
(function(){
  const css = `
#fp-nova-modal{position:fixed;right:18px;bottom:78px;width:360px;max-width:92vw;z-index:100000;display:none;font-family:Lexend,system-ui,Arial,sans-serif}
#fp-nova-backdrop{position:fixed;inset:0;background:transparent;display:none;z-index:99999}
#fp-nova-card{background:var(--white,#fff);border-radius:12px;box-shadow:0 12px 40px rgba(2,6,23,0.2);overflow:hidden;border:1px solid rgba(0,0,0,0.06);display:flex;flex-direction:column;height:480px}
#fp-nova-header{padding:10px 12px;background:linear-gradient(90deg,var(--primary-color,#0d78f2),#4f8cff);color:#fff;display:flex;align-items:center;justify-content:space-between}
#fp-nova-title{font-weight:700}
#fp-nova-body{padding:12px;flex:1;overflow:auto;background:linear-gradient(180deg,#f8fafc,#fff);display:flex;flex-direction:column;gap:8px}
#fp-nova-input{display:flex;border-top:1px solid rgba(0,0,0,0.06);padding:8px;gap:8px}
#fp-nova-input textarea{flex:1;min-height:40px;max-height:120px;padding:8px;border-radius:10px;border:1px solid #e5e7eb;resize:none}
#fp-nova-input button{background:var(--primary-color,#0d78f2);color:#fff;border:none;padding:8px 12px;border-radius:10px}
.fp-nova-msg{display:flex;align-items:flex-end;gap:8px}
.fp-nova-msg.nova{justify-content:flex-start}
.fp-nova-msg.user{justify-content:flex-end}
.fp-nova-avatar{width:32px;height:32px;border-radius:50%;flex:0 0 32px;display:inline-block}
.fp-nova-bubble{display:inline-block;padding:10px 14px;border-radius:16px;max-width:78%;font-size:0.95rem;line-height:1.3;box-shadow:0 6px 18px rgba(2,6,23,0.06)}
.fp-nova-bubble.nova{background:#f1f5f9;color:#042;border-bottom-left-radius:4px}
.fp-nova-bubble.user{background:linear-gradient(90deg,#0d78f2,#4f8cff);color:#fff;border-bottom-right-radius:4px}
.fp-nova-meta{font-size:11px;color:#94a3b8;margin-top:4px}
.fp-nova-row{display:flex;flex-direction:column}
`;
  try{ document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`); }catch(e){ console.error('Nova: failed to inject CSS', e); }

  function ensureDom(){
    if(document.getElementById('fp-nova-modal')) return;
    const backdrop = document.createElement('div'); backdrop.id = 'fp-nova-backdrop'; backdrop.setAttribute('aria-hidden','true');
    const modal = document.createElement('div'); modal.id = 'fp-nova-modal'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-label','Nova Assistant');
    modal.innerHTML = `
      <div id="fp-nova-card">
        <div id="fp-nova-header"><div id="fp-nova-title">Nova</div><div style="display:flex;gap:6px"><button id="fp-nova-clear" title="Clear" style="background:transparent;border:none;color:#fff">Clear</button><button id="fp-nova-close" title="Close" style="background:transparent;border:none;color:#fff">✕</button></div></div>
        <div id="fp-nova-body" tabindex="0"></div>
        <div id="fp-nova-input">
          <textarea id="fp-nova-text" placeholder="Ask Nova a question about this page..."></textarea>
          <button id="fp-nova-send">Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // ensure fab
    if(!document.getElementById('fp-nova-fab')){
      const btnWrap = document.createElement('div'); btnWrap.id='fp-nova-fab'; btnWrap.style.cssText='position:fixed;right:18px;bottom:18px;z-index:100001;';
      btnWrap.innerHTML = '<button id="fp-nova-open" style="padding:10px 14px;border-radius:12px;background:var(--primary-color,#0d78f2);color:#fff;border:none;box-shadow:0 8px 26px rgba(13,120,242,0.18);font-weight:600">Ask Nova</button>';
      document.body.appendChild(btnWrap);
    }

    // wire events
    const modalEl = document.getElementById('fp-nova-modal');
    const backdropEl = document.getElementById('fp-nova-backdrop');
    const bodyEl = document.getElementById('fp-nova-body');
    const textEl = document.getElementById('fp-nova-text');
    const sendEl = document.getElementById('fp-nova-send');
    const openEl = document.getElementById('fp-nova-open');
    const closeEl = document.getElementById('fp-nova-close');
    const clearEl = document.getElementById('fp-nova-clear');

    function formatTime(date){ return date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }

    function appendMessage(kind, txt){
      const row = document.createElement('div'); row.className = 'fp-nova-msg ' + (kind==='nova'? 'nova':'user');
      const rowInner = document.createElement('div'); rowInner.className = 'fp-nova-row';
      if(kind === 'nova'){
        const avatar = document.createElement('div'); avatar.className = 'fp-nova-avatar'; avatar.style.background = '#dbeafe';
        const bubble = document.createElement('div'); bubble.className = 'fp-nova-bubble nova'; bubble.textContent = txt;
        const meta = document.createElement('div'); meta.className = 'fp-nova-meta'; meta.textContent = formatTime(new Date());
        row.appendChild(avatar);
        rowInner.appendChild(bubble);
        rowInner.appendChild(meta);
        row.appendChild(rowInner);
      } else {
        const bubble = document.createElement('div'); bubble.className = 'fp-nova-bubble user'; bubble.textContent = txt;
        const meta = document.createElement('div'); meta.className = 'fp-nova-meta'; meta.textContent = formatTime(new Date());
        row.appendChild(rowInner);
        rowInner.appendChild(bubble);
        rowInner.appendChild(meta);
      }
      bodyEl.appendChild(row);
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }

    async function ensureAssistant(){
      if(!window.readPageAndAsk){
        try{ const mod = await import('./aiAssistant.js'); window.readPageAndAsk = mod.readPageAndAsk; }catch(e){ console.error('Nova failed to load aiAssistant', e); appendMessage('nova','Unable to load Nova.'); throw e; }
      }
    }

    async function sendMessage(msg){
      if(!msg) return;
      appendMessage('user', msg);
      appendMessage('nova', 'Nova is thinking...');
      try{
        await ensureAssistant();
        const res = await window.readPageAndAsk(msg);
        const bubbles = bodyEl.querySelectorAll('.fp-nova-msg.nova .fp-nova-bubble');
        const last = bubbles[bubbles.length-1];
        if(last) last.textContent = (res && (res.answer || res)) || 'No response.';
      }catch(err){
        console.error(err);
        const bubbles = bodyEl.querySelectorAll('.fp-nova-msg.nova .fp-nova-bubble');
        const last = bubbles[bubbles.length-1]; if(last) last.textContent = 'Error: ' + (err.message||String(err));
      }
    }

    openEl?.addEventListener('click', ()=>{ modalEl.style.display='block'; backdropEl.style.display='block'; textEl.focus(); });
    closeEl?.addEventListener('click', ()=>{ modalEl.style.display='none'; backdropEl.style.display='none'; });
    backdropEl?.addEventListener('click', ()=>{ modalEl.style.display='none'; backdropEl.style.display='none'; });
    clearEl?.addEventListener('click', ()=>{ bodyEl.innerHTML=''; textEl.value=''; textEl.focus(); });
    sendEl?.addEventListener('click', async ()=>{ const v = textEl.value.trim(); if(!v) return; sendEl.disabled=true; await sendMessage(v); textEl.value=''; textEl.focus(); sendEl.disabled=false; });
    textEl?.addEventListener('keydown', async (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendEl.click(); } });

    // expose helpers
    window.startAssistant = window.startAssistant || (async function(){ document.getElementById('fp-nova-open')?.click(); });
    window.fpNovaSend = window.fpNovaSend || (async function(m){ await sendMessage(m); });
  }

  // init on DOM ready
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureDom); else ensureDom();
})();
