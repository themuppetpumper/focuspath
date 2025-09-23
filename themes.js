(function(){
  const THEMES = {
    light: {
      '--primary-color': '#0d78f2',
      '--background-color': '#f0f2f5',
      '--text-primary': '#111418',
      '--text-secondary': '#60748a',
      '--white': '#ffffff',
  '--border-color': '#e5e7eb',
  '--surface-hover': '#f3f4f6'
    },
    dark: {
      '--primary-color': '#60a5fa',
      '--background-color': '#0b1220',
      '--text-primary': '#e5e7eb',
      '--text-secondary': '#a1a9b8',
      '--white': '#111827',
  '--border-color': '#334155',
  '--surface-hover': '#1f2937'
    },
    ocean: {
  '--primary-color': '#0369a1', /* deeper ocean blue */
  '--background-color': '#c2dceb', /* darker base */
  '--text-primary': '#0d1724',
  '--text-secondary': '#2c3e50', /* stronger contrast */
  '--white': '#edf5f8', /* panel color slightly lighter than bg */
  '--border-color': '#94c3d4',
  '--surface-hover': '#b5d6e2'
    },
    forest: {
  '--primary-color': '#166534', /* richer forest green */
  '--background-color': '#d4e9df', /* darker backdrop */
  '--text-primary': '#072616',
  '--text-secondary': '#254231',
  '--white': '#eef7f2',
  '--border-color': '#a6ccb8',
  '--surface-hover': '#c2ddcf'
    },
    halloween: {
      /* Spooky seasonal palette */
      '--primary-color': '#ff7518', /* pumpkin orange */
      '--background-color': '#1b0f20', /* deep night purple */
      '--text-primary': '#ffe9d6',
      '--text-secondary': '#ffb870',
      '--white': '#2a1f2f', /* panel surfaces */
      '--border-color': '#ff9e42',
      '--surface-hover': '#3a253d'
    },
  sunset: {
  '--primary-color': '#ea580c', /* deeper orange */
  '--background-color': '#ffe7d3',
  '--text-primary': '#1a2532',
  '--text-secondary': '#4b5563',
  '--white': '#fff5ed',
  '--border-color': '#f7c8a3',
  '--surface-hover': '#ffd9ba'
    },
    christmas: {
      '--primary-color': '#d90429', // Christmas red
      '--background-color': '#ffffff', // snowy white
      '--text-primary': '#175c2c', // Christmas green
      '--text-secondary': '#d90429', // accent red
      '--white': '#ffffff', // pure white
      '--border-color': '#175c2c', // green border
      '--surface-hover': '#f7f7f7' // light snow
    },
    'high-contrast': {
      '--primary-color': '#000000',
      '--background-color': '#ffffff',
      '--text-primary': '#000000',
      '--text-secondary': '#222222',
      '--white': '#ffffff',
  '--border-color': '#000000',
  '--surface-hover': '#e5e5e5'
    },
    // Special secret theme (Star Wars inspired) - only selectable when unlocked via achievements
    'star-wars': {
      '--primary-color': '#ffe81f', /* crawl yellow for highlights */
      '--background-color': '#03060c', /* deeper space */
      '--text-primary': '#ffe81f', /* all main lettering yellow */
      '--text-secondary': '#d1d5db',
      '--white': '#14181e', /* panels / header dark grey */
      '--border-color': '#1f2933',
      '--surface-hover': '#1a232c'
    }
  };

  // -------- Developer Mode (global) --------
  const DEV_STORAGE_KEY = 'fpDevMode';
  const DEV_DEFAULT_CODE = 'focusdev'; // simple local code; change by setting localStorage.fpDevCode
  function devIsOn(){
    try { return localStorage.getItem(DEV_STORAGE_KEY) === '1'; } catch { return false; }
  }
  function devEnable(){ try { localStorage.setItem(DEV_STORAGE_KEY, '1'); } catch {} ensureDevBadge(); alert('Developer Mode enabled'); }
  function devDisable(){ try { localStorage.removeItem(DEV_STORAGE_KEY); } catch {} removeDevBadge(); alert('Developer Mode disabled');
    // If a seasonal theme is active out-of-season, revert to system on disable
    const key = document.documentElement.getAttribute('data-theme');
    const m = new Date().getMonth();
    if(key==='halloween' && m!==9) applyThemeKey('system');
    if(key==='christmas' && m!==11) applyThemeKey('system');
  }
  function ensureDevBadge(){
    if(!devIsOn()) return;
    let b = document.getElementById('fp-dev-badge');
    if(!b){
      b = document.createElement('div');
      b.id='fp-dev-badge';
      b.textContent='DEV';
      b.style.cssText='position:fixed;left:8px;bottom:8px;z-index:2000;background:rgba(16,185,129,0.15);color:#065f46;border:1px solid rgba(16,185,129,0.4);font:600 10px/1.2 system-ui, sans-serif;letter-spacing:.08em;padding:6px 8px;border-radius:8px;backdrop-filter:blur(4px);cursor:pointer;';
      b.title = 'Developer Mode — click to manage';
      b.addEventListener('click', showDevModal);
      document.body.appendChild(b);
    }
  }
  function removeDevBadge(){ document.getElementById('fp-dev-badge')?.remove(); }
  function showDevModal(){
    // Basic modal for enabling/disabling dev mode
    if(document.getElementById('fp-dev-modal')) return;
    const wrap=document.createElement('div');
    wrap.id='fp-dev-modal';
    wrap.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;';
    const card=document.createElement('div');
    card.style.cssText='background:var(--white);color:var(--text-primary);border:1px solid var(--border-color);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.15);padding:16px;min-width:280px;max-width:90vw;';
    const isOn=devIsOn();
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div style="font-weight:700;">Developer Mode</div>
        <button id="fpDevClose" style="font-size:18px;line-height:1;background:transparent;border:none;color:var(--text-secondary);">×</button>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">${isOn? 'Disable Developer Mode or keep it on for unrestricted theming and achievements debug.' : 'Enter the developer code to enable unrestricted theming and achievements debug.'}</div>
      <div ${isOn? 'style="display:none"':''}>
        <input id="fpDevCode" type="password" placeholder="Developer code" class="modern-input" style="width:100%;margin-bottom:10px;" />
        <button id="fpDevEnable" class="bg-[var(--primary-color)] text-black hover:bg-[var(--primary-color)]" style="width:100%;padding:8px 10px;border-radius:10px;font-weight:600;">Enable</button>
      </div>
      <div ${isOn? '':'style="display:none"'}>
        <button id="fpDevDisable" class="hover:bg-[var(--background-color)]" style="width:100%;padding:8px 10px;border-radius:10px;border:1px solid var(--border-color);font-weight:600;">Disable</button>
      </div>
    `;
    wrap.appendChild(card);
    document.body.appendChild(wrap);
    function close(){ wrap.remove(); }
    card.querySelector('#fpDevClose')?.addEventListener('click', close);
    wrap.addEventListener('click', (e)=>{ if(e.target===wrap) close(); });
    const enableBtn=card.querySelector('#fpDevEnable');
    if(enableBtn){ enableBtn.addEventListener('click', ()=>{
      const input = card.querySelector('#fpDevCode');
      const userCode = (input && input.value) || '';
      let ok=false; try { const stored = localStorage.getItem('fpDevCode'); ok = (userCode && stored && userCode===stored) || (!stored && userCode===DEV_DEFAULT_CODE); } catch { ok = (userCode===DEV_DEFAULT_CODE); }
      if(ok){ devEnable(); ensureDevBadge(); close(); } else { alert('Invalid developer code'); }
    }); }
    const disableBtn=card.querySelector('#fpDevDisable');
    if(disableBtn){ disableBtn.addEventListener('click', ()=>{ devDisable(); close(); }); }
  }

  const STORAGE_KEY = 'fpTheme';
  const isDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  function computeSystemTheme(){
    return isDark() ? THEMES.dark : THEMES.light;
  }

  function applyVars(vars){
    const root = document.documentElement;
    Object.entries(vars).forEach(([k,v]) => root.style.setProperty(k, v));
  }

  function applyStarWarsExtras(active){
    // Starfield canvas
    const existingCanvas=document.getElementById('fp-sw-canvas');
    if(!active && existingCanvas){ existingCanvas.remove(); }
    if(active && !existingCanvas){
      const canvas=document.createElement('canvas');
      canvas.id='fp-sw-canvas';
      canvas.width=window.innerWidth; canvas.height=window.innerHeight;
      canvas.style.cssText='position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(circle at 50% 50%, rgba(255,232,31,0.04), transparent 60%);';
      document.body.prepend(canvas);
      const ctx=canvas.getContext('2d');
      const STAR_COUNT=180; const stars=[]; const maxSpeed=0.25; const minSpeed=0.05;
      function init(){
        stars.length=0;
        for(let i=0;i<STAR_COUNT;i++){
          stars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.2+0.3,s:Math.random()*(maxSpeed-minSpeed)+minSpeed});
        }
      }
      function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; init(); }
      window.addEventListener('resize',resize);
      init();
      function step(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='#fff';
        for(const st of stars){
          st.y += st.s; if(st.y>canvas.height){ st.y=0; st.x=Math.random()*canvas.width; }
          ctx.beginPath(); ctx.arc(st.x,st.y,st.r,0,Math.PI*2); ctx.fillStyle = (Math.random()<0.02? '#ffe81f':'#ffffff'); ctx.fill();
        }
        if(document.documentElement.getAttribute('data-theme')==='star-wars') requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    // Dynamic glow (lightsaber colors) on hover/focus
    const glowColors=['#ff2f2f','#1f8bff','#19ff6a','#a855f7','#ffffff','#f97316','#ffe81f']; // red, blue, green, purple, white, orange, yellow
    function overHandler(e){
      const el=e.target.closest('button, a, [role=\"button\"], input, select, textarea, .nav-group');
      if(!el) return;
      const c=glowColors[Math.floor(Math.random()*glowColors.length)];
      if(!el.dataset.swGlow){
        el.dataset.origBoxShadow=el.style.boxShadow||'';
        el.dataset.origBg=el.style.background||'';
      }
      const computedBg = getComputedStyle(el).backgroundColor||'';
      const isPrimaryYellow = /255\s*,\s*232\s*,\s*31/.test(computedBg); // rgb(255, 232, 31)
      if(!isPrimaryYellow){
        el.style.background='transparent';
      } else {
        // Ensure good contrast on yellow buttons
        el.style.color='#000';
      }
      el.style.setProperty('--sw-glow-c',c);
      el.style.boxShadow=`0 0 0 1px ${c}, 0 0 6px 2px ${c}, 0 0 14px 4px ${c}`;
      el.classList.add('fp-sw-pulse');
      el.dataset.swGlow='1';
    }
    function outHandler(e){
      const el=e.target.closest('[data-sw-glow]');
      if(!el) return;
      el.style.boxShadow=el.dataset.origBoxShadow||'';
      el.style.background=el.dataset.origBg||'';
      el.classList.remove('fp-sw-pulse');
      el.style.removeProperty('--sw-glow-c');
      delete el.dataset.swGlow; delete el.dataset.origBoxShadow; delete el.dataset.origBg;
    }
    if(active){
      if(!window.__fpSWGlow){
        document.addEventListener('mouseover',overHandler,true);
        document.addEventListener('mouseout',outHandler,true);
        window.__fpSWGlow={overHandler,outHandler};
      }
      // Inject style overrides for star-wars theme specifics (text on primary buttons)
      if(!document.getElementById('fp-sw-style')){
        const style=document.createElement('style');
        style.id='fp-sw-style';
        style.textContent=`
          [data-theme='star-wars'] .bg-\\[var\\(--primary-color\\)\\]{color:#000 !important;}
          [data-theme='star-wars'] .hover\\:bg-\\[var\\(--background-color\\)\\]:hover{background:transparent !important;}
          [data-theme='star-wars'] input, [data-theme='star-wars'] textarea, [data-theme='star-wars'] select { background: var(--white) !important; color: var(--text-primary) !important; border-color: var(--border-color) !important; }
          [data-theme='star-wars'] input::placeholder, [data-theme='star-wars'] textarea::placeholder { color: #ffe81f !important; opacity:0.7; }
          @keyframes fp-sw-pulse { 0%,100% { box-shadow: 0 0 0 1px var(--sw-glow-c), 0 0 6px 2px var(--sw-glow-c), 0 0 14px 4px var(--sw-glow-c); } 50% { box-shadow: 0 0 0 1px var(--sw-glow-c), 0 0 10px 3px var(--sw-glow-c), 0 0 26px 8px var(--sw-glow-c); } }
          .fp-sw-pulse { animation: fp-sw-pulse 1.6s ease-in-out infinite; transition: box-shadow .25s linear; }
        `;
        document.head.appendChild(style);
      }
    } else if(window.__fpSWGlow){
      document.removeEventListener('mouseover',window.__fpSWGlow.overHandler,true);
      document.removeEventListener('mouseout',window.__fpSWGlow.outHandler,true);
      delete window.__fpSWGlow;
      const swStyle=document.getElementById('fp-sw-style'); swStyle?.remove();
    }
  }

  /* ---------- Halloween Seasonal Extras (October) ---------- */
  function applyHalloweenExtras(active){
    const existing = document.getElementById('fp-halloween-overlay');
    if(!active){
      // Restore original heading logos if we swapped them for Halloween
      document.querySelectorAll('[data-halloween-logo]')?.forEach(h=>{
        if(h.dataset.origHtml){
          h.innerHTML = h.dataset.origHtml;
          delete h.dataset.origHtml;
        }
        h.removeAttribute('data-halloween-logo');
      });
      existing?.remove();
      document.getElementById('fp-halloween-style')?.remove();
      document.getElementById('fp-halloween-decor')?.remove();
      window.removeEventListener('resize', window.__fpHalloweenResize||(()=>{}));
      delete window.__fpHalloweenResize;
      return;
    }
    // Create overlay & style once
    if(active && !existing){
      const overlay=document.createElement('div');
      overlay.id='fp-halloween-overlay';
      overlay.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.35;mix-blend-mode:normal;';
      const pumpkinPattern = encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path fill='%23ff7518' d='M16 4c-1.1 0-2 .9-2 2v1.1c-1.3-.4-2.7-.6-4-.3-2.3.5-4.4 2-5.5 4.1C2 13 1.7 15.7 2.3 18.2c.6 2.5 2 4.9 4.3 6.2 2.2 1.2 4.9 1.3 7.3.7.7-.2 1.4-.4 2.1-.7.7.3 1.4.5 2.1.7 2.4.6 5.1.5 7.3-.7 2.3-1.3 3.7-3.7 4.3-6.2.6-2.5.3-5.2-1.2-7.3-1.1-2.1-3.2-3.6-5.5-4.1-1.3-.3-2.7-.1-4 .3V6c0-1.1-.9-2-2-2h-2Z'/><path fill='%23cc5e12' d='M14 6.1c-3.8 6.5-3.8 13.3 0 20-2.1-.1-4.2-.5-5.9-1.5C6 23.4 4.8 21.6 4.2 19.3 3.6 17 3.8 14.4 5 12.4c1-1.7 2.7-3 4.5-3.5 1.5-.4 3-.2 4.5.2Z'/><path fill='%23cc5e12' d='M18 6.1c3.8 6.5 3.8 13.3 0 20 2.1-.1 4.2-.5 5.9-1.5 2.1-1.2 3.3-3 3.9-5.3.6-2.3.4-4.9-.8-6.9-1-1.7-2.7-3-4.5-3.5-1.5-.4-3-.2-4.5.2Z'/><path fill='%232a1f2f' d='M13 17c0 .6-.4 1-1 1s-1-.4-1-1 .4-1 1-1 1 .4 1 1Zm8 0c0 .6-.4 1-1 1s-1-.4-1-1 .4-1 1-1 1 .4 1 1Zm-4.9 4.6c.6.5 1.6.5 2.2 0 .4-.3 1 .3.6.7-1 .9-2.4.9-3.4 0-.4-.4.2-1 .6-.7Z'/></svg>");
      overlay.style.background = `radial-gradient(circle at 30% 40%, rgba(255,117,24,0.12), transparent 60%),radial-gradient(circle at 70% 65%, rgba(255,158,66,0.10), transparent 65%), #1b0f20`;
      overlay.style.backgroundImage += `, url("data:image/svg+xml,${pumpkinPattern}")`;
      overlay.style.backgroundSize='cover, cover, 120px 120px';
      overlay.style.backgroundRepeat='no-repeat, no-repeat, repeat';
      document.body.prepend(overlay);
      // Floating decor container
      const decor=document.createElement('div');
      decor.id='fp-halloween-decor';
      decor.setAttribute('aria-hidden','true');
  decor.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:-1;';
      document.body.appendChild(decor);
      if(!document.getElementById('fp-halloween-style')){
        const style=document.createElement('style');
        style.id='fp-halloween-style';
        style.textContent=`
        [data-theme='halloween'] .bg-\[var\(--primary-color\)\]{color:#1b0f20 !important; font-weight:600;}
        [data-theme='halloween'] .pumpkin-accent{background:linear-gradient(135deg,#ff7518,#ff9e42);color:#2a1f2f;border:1px solid #ffb870;}
        [data-theme='halloween'] .shadow-card{box-shadow:0 4px 14px -2px rgba(255,117,24,0.35),0 2px 4px rgba(0,0,0,0.4);}
        [data-theme='halloween'] .text-spooky{color:#ffb870;}
        @keyframes fp-halloween-float{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-16px) scale(1.05);}}
        [data-theme='halloween'] .spooky-fx{position:absolute;width:72px;height:72px;display:flex;align-items:center;justify-content:center;opacity:.85;animation:fp-halloween-float 6.5s ease-in-out infinite;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));}
        [data-theme='halloween'] .spooky-fx.ghost{width:80px;height:80px;animation-duration:7.2s;}
        [data-theme='halloween'] .spooky-fx svg{width:100%;height:100%;}
        [data-theme='halloween'] .spooky-fx:nth-child(3n){animation-duration:5.8s;}
        [data-theme='halloween'] .spooky-fx:nth-child(4n){animation-direction:alternate;}
        /* Ghost fade in/out animation */
        @keyframes fp-ghost-fade {
          0% { opacity: 0.15; }
          10% { opacity: 0.85; }
          80% { opacity: 0.85; }
          100% { opacity: 0.15; }
        }
        [data-theme='halloween'] .ghost-fade {
          animation: fp-ghost-fade 4.5s cubic-bezier(.4,.2,.6,1) infinite;
        }
        /* Spider logo dangle animation */
        @keyframes fp-spider-dangle {0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(4px) rotate(3deg);}}
        [data-theme='halloween'] .fp-spider-logo{position:relative;display:inline-flex;width:28px;height:28px;vertical-align:middle;animation:fp-spider-dangle 5.5s ease-in-out infinite;margin-right:6px;}
        [data-theme='halloween'] .fp-spider-logo:before{content:'';position:absolute;top:-18px;left:50%;width:1px;height:18px;background:linear-gradient(to bottom, rgba(255,184,112,.85), rgba(255,184,112,0));transform:translateX(-50%);}
        [data-theme='halloween'] .fp-spider-logo svg{width:100%;height:100%;filter:drop-shadow(0 2px 4px rgba(0,0,0,.55));}
        `;
        document.head.appendChild(style);
      }
      // Insert spider logo before FocusPath text (store original markup for restore)
      function applyHalloweenLogo(){
        if(document.documentElement.getAttribute('data-theme')!=='halloween') return;
        const spiderSVG = "<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><circle cx='32' cy='32' r='11' fill='#2a1f2f'/><circle cx='28' cy='30' r='3' fill='#ffb870'/><circle cx='36' cy='30' r='3' fill='#ffb870'/><path stroke='#2a1f2f' stroke-linecap='round' stroke-width='4' fill='none' d='M32 21V8M22 28 10 20M42 28 54 20M22 38 10 46M42 38 54 46M28 42 24 56M36 42 40 56'/><path fill='#ffb870' d='M30 37c0 .6.4 1 1 1h2c.6 0 1-.4 1-1 0-2-4-2-4 0Z'/></svg>";
        const headings = Array.from(document.querySelectorAll('h1')).filter(h=>h.textContent.trim()==='FocusPath');
        headings.forEach(h=>{
          if(h.dataset.halloweenLogo) return;
          h.dataset.origHtml = h.innerHTML;
          h.dataset.halloweenLogo = '1';
          h.innerHTML = `<span class="fp-spider-logo" aria-hidden="true">${spiderSVG}</span><span class="fp-logo-text">FocusPath</span>`;
        });
      }
      applyHalloweenLogo();
      // Only ghosts move; pumpkins are stationary in header
      function spawnGhosts(){
        if(document.documentElement.getAttribute('data-theme')!=='halloween') return;
        decor.innerHTML='';
        const W=window.innerWidth, H=window.innerHeight;
        const sidebarW = 256; // left panel width
        const headerH = 64;   // top header height
        const margin = 16;
        const area = {
          left: sidebarW + margin,
          top: headerH + margin,
          right: W - margin,
          bottom: H - margin
        };
        const ghostSVG = "<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><path fill='#ffe9d6' d='M32 6c-9.9 0-18 8.1-18 18v24.6c0 2 .9 3.9 2.5 5.2 1.6 1.3 3.6 1.7 5.6 1.1l4.4-1.2c1-.3 2.1-.2 3 .3l4.8 2.4c1.7.8 3.6.8 5.3 0l4.8-2.4c.9-.4 2-.5 3-.3l4.4 1.2c2 .6 4 .1 5.6-1.1 1.6-1.3 2.5-3.2 2.5-5.2V24C50 14.1 41.9 6 32 6Z'/><circle cx='24' cy='28' r='4' fill='#2a1f2f'/><circle cx='40' cy='28' r='4' fill='#2a1f2f'/><path fill='#2a1f2f' d='M26 38c1.9 2 5.1 2 7 0 1.1-1.2 2.9 0 2.2 1.4-1.5 2.9-5.3 3.6-7.9 1.4-.4-.3-.5-1 0-1.4Z'/></svg>";
        const greenGhostSVG = "<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><path fill='#19ff6a' d='M32 6c-9.9 0-18 8.1-18 18v24.6c0 2 .9 3.9 2.5 5.2 1.6 1.3 3.6 1.7 5.6 1.1l4.4-1.2c1-.3 2.1-.2 3 .3l4.8 2.4c1.7.8 3.6.8 5.3 0l4.8-2.4c.9-.4 2-.5 3-.3l4.4 1.2c2 .6 4 .1 5.6-1.1 1.6-1.3 2.5-3.2 2.5-5.2V24C50 14.1 41.9 6 32 6Z'/><circle cx='24' cy='28' r='4' fill='#2a1f2f'/><circle cx='40' cy='28' r='4' fill='#2a1f2f'/><path fill='#2a1f2f' d='M26 38c1.9 2 5.1 2 7 0 1.1-1.2 2.9 0 2.2 1.4-1.5 2.9-5.3 3.6-7.9 1.4-.4-.3-.5-1 0-1.4Z'/></svg>";
        // Setup moving ghost objects
        const ghostItems = [
          {s:1}, {s:.85}, {s:1.15}, {s:.95}, {s:1.05}
        ];
        ghostItems.forEach((it,i)=>{
          const el=document.createElement('div');
          el.className='spooky-fx ghost';
          el.innerHTML= ghostSVG;
          el.style.position='absolute';
          el.style.width='80px';
          el.style.height='80px';
          el.style.transform=`scale(${it.s})`;
          el.style.animationDelay=(i*0.7)+'s';
          // Add fade in/out effect with random delay and duration
          el.classList.add('ghost-fade');
          el.style.animationDelay = (i*0.7 + Math.random()*2.5) + 's';
          el.style.animationDuration = (4.5 + Math.random()*2.5) + 's';
          it.el = el;
          it.x = Math.random()*(area.right-area.left-80)+area.left;
          it.y = Math.random()*(area.bottom-area.top-80)+area.top;
          const speed = 32 + Math.random()*32;
          const angle = Math.random()*2*Math.PI;
          it.vx = Math.cos(angle)*speed;
          it.vy = Math.sin(angle)*speed;
          decor.appendChild(el);
        });

        // Rare green ghost logic
        let greenGhost = null, greenGhostTimeout = null;
        function spawnGreenGhost() {
          if (greenGhost) return;
          greenGhost = document.createElement('div');
          greenGhost.className = 'spooky-fx ghost';
          greenGhost.innerHTML = greenGhostSVG;
          greenGhost.style.position = 'absolute';
          greenGhost.style.width = '80px';
          greenGhost.style.height = '80px';
          greenGhost.style.transform = `scale(${1.2 + Math.random()*0.3})`;
          greenGhost.classList.add('ghost-fade');
          greenGhost.style.animationDelay = (Math.random()*2.5) + 's';
          greenGhost.style.animationDuration = (5.5 + Math.random()*3) + 's';
          greenGhost.style.opacity = '1';
          // Random position and movement
          greenGhost.x = Math.random()*(area.right-area.left-80)+area.left;
          greenGhost.y = Math.random()*(area.bottom-area.top-80)+area.top;
          const speed = 28 + Math.random()*28;
          const angle = Math.random()*2*Math.PI;
          greenGhost.vx = Math.cos(angle)*speed;
          greenGhost.vy = Math.sin(angle)*speed;
          greenGhost.style.left = greenGhost.x+'px';
          greenGhost.style.top = greenGhost.y+'px';
          decor.appendChild(greenGhost);
          // Set up disappearance after a random time
          greenGhostTimeout = setTimeout(removeGreenGhost, 3500 + Math.random()*4000);
        }
        function removeGreenGhost() {
          if (greenGhost) {
            greenGhost.remove();
            greenGhost = null;
          }
          // Schedule next appearance randomly (rare)
          greenGhostTimeout = setTimeout(spawnGreenGhost, 8000 + Math.random()*12000);
        }
        // Start the first green ghost after a random delay
        greenGhostTimeout = setTimeout(spawnGreenGhost, 6000 + Math.random()*12000);
        let lastTime = performance.now();
        function animate(){
          const now = performance.now();
          const dt = (now-lastTime)/1000;
          lastTime = now;
          ghostItems.forEach(it=>{
            it.x += it.vx*dt;
            it.y += it.vy*dt;
            if(it.x < area.left){ it.x=area.left; it.vx*=-1; }
            if(it.x > area.right-80){ it.x=area.right-80; it.vx*=-1; }
            if(it.y < area.top){ it.y=area.top; it.vy*=-1; }
            if(it.y > area.bottom-80){ it.y=area.bottom-80; it.vy*=-1; }
            it.el.style.left = it.x+'px';
            it.el.style.top = it.y+'px';
          });
          // Move green ghost if present
          if (typeof greenGhost === 'object' && greenGhost && greenGhost.parentNode === decor) {
            greenGhost.x += greenGhost.vx*dt;
            greenGhost.y += greenGhost.vy*dt;
            if(greenGhost.x < area.left){ greenGhost.x=area.left; greenGhost.vx*=-1; }
            if(greenGhost.x > area.right-80){ greenGhost.x=area.right-80; greenGhost.vx*=-1; }
            if(greenGhost.y < area.top){ greenGhost.y=area.top; greenGhost.vy*=-1; }
            if(greenGhost.y > area.bottom-80){ greenGhost.y=area.bottom-80; greenGhost.vy*=-1; }
            greenGhost.style.left = greenGhost.x+'px';
            greenGhost.style.top = greenGhost.y+'px';
          }
          if(document.documentElement.getAttribute('data-theme')==='halloween'){
            requestAnimationFrame(animate);
          }
        }
        animate();
      }
      // Inject pumpkins into header
      function injectHeaderPumpkins(){
        // Find header element
        const header = document.querySelector('header');
        if(!header) return;
        // Remove any previous pumpkins
        header.querySelectorAll('.fp-header-pumpkin').forEach(e=>e.remove());
        // Calculate available width and safe zones
        const headerRect = header.getBoundingClientRect();
        const btns = Array.from(header.querySelectorAll('button, .text-2xl, .text-sm, .text-center, .font-bold'));
        // Find left/right bounds for pumpkins
        let left = 0, right = header.offsetWidth;
        // Avoid left menu button
        if(btns.length){
          left = btns[0].offsetLeft + btns[0].offsetWidth + 8;
          // Use header width for right edge to ensure pumpkins stay inside
          right = header.offsetWidth;
        }
        // Place 5 pumpkins evenly spaced along the bottom edge
        const pumpkinSVG = "<svg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'><path fill='#ff7518' d='M16 4c-1.1 0-2 .9-2 2v1.1c-1.3-.4-2.7-.6-4-.3-2.3.5-4.4 2-5.5 4.1C2 13 1.7 15.7 2.3 18.2c.6 2.5 2 4.9 4.3 6.2 2.2 1.2 4.9 1.3 7.3.7.7-.2 1.4-.4 2.1-.7.7.3 1.4.5 2.1.7 2.4.6 5.1.5 7.3-.7 2.3-1.3 3.7-3.7 4.3-6.2.6-2.5.3-5.2-1.2-7.3-1.1-2.1-3.2-3.6-5.5-4.1-1.3-.3-2.7-.1-4 .3V6c0-1.1-.9-2-2-2h-2Z'/><path fill='#cc5e12' d='M14 6.1c-3.8 6.5-3.8 13.3 0 20-2.1-.1-4.2-.5-5.9-1.5C6 23.4 4.8 21.6 4.2 19.3 3.6 17 3.8 14.4 5 12.4c1-1.7 2.7-3 4.5-3.5 1.5-.4 3-.2 4.5.2Z'/><path fill='#cc5e12' d='M18 6.1c3.8 6.5 3.8 13.3 0 20 2.1-.1 4.2-.5 5.9-1.5 2.1-1.2 3.3-3 3.9-5.3.6-2.3.4-4.9-.8-6.9-1-1.7-2.7-3-4.5-3.5-1.5-.4-3-.2-4.5.2Z'/><path fill='#2a1f2f' d='M13 17c0 .6-.4 1-1 1s-1-.4-1-1 .4-1 1-1 1 .4 1 1Zm8 0c0 .6-.4 1-1 1s-1-.4-1-1 .4-1 1-1 1 .4 1 1Zm-4.9 4.6c.6.5 1.6.5 2.2 0 .4-.3 1 .3.6.7-1 .9-2.4.9-3.4 0-.4-.4.2-1 .6-.7Z'/></svg>";
  const count = 4;
        // Match test.html: bring last pumpkin in further from right edge
        const rightMargin = 64; // increased margin for home page
        const gap = (right-left-32-rightMargin)/(count-1);
        for(let i=0;i<count;i++){
          const p = document.createElement('div');
          p.className = 'fp-header-pumpkin';
          p.style.position = 'absolute';
          p.style.bottom = '0px';
          let px = left + i*gap;
          // Clamp rightmost pumpkin so it is always fully inside the header
          if (i === count-1) px = Math.min(px, right - 32); // 32px from right edge for safety
          p.style.left = px + 'px';
          p.style.width = '32px';
          p.style.height = '32px';
          p.style.zIndex = '10';
          p.style.pointerEvents = 'none';
          p.innerHTML = pumpkinSVG;
          header.appendChild(p);
        }
        header.style.position = 'relative';
      }
      spawnGhosts();
      injectHeaderPumpkins();
      // Resize handler
      window.__fpHalloweenResize = function(){
        if(document.documentElement.getAttribute('data-theme')==='halloween'){
          spawnGhosts();
          injectHeaderPumpkins();
          applyHalloweenLogo(); // reaffirm logo after layout shifts
        }
      };
      window.addEventListener('resize', window.__fpHalloweenResize);
    } else if(active){
      // If overlay exists but decor cleared (edge case), repopulate
      const decor=document.getElementById('fp-halloween-decor');
      if(decor && !decor.children.length){
        const evt=new Event('resize'); window.dispatchEvent(evt);
      }
      // Ensure logo present if user navigated without full reload
      const needLogo = Array.from(document.querySelectorAll('h1')).some(h=>h.textContent.trim()==='FocusPath' && !h.dataset.halloweenLogo);
      if(needLogo){
        const spiderSVG = "<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><circle cx='32' cy='32' r='11' fill='#2a1f2f'/><circle cx='28' cy='30' r='3' fill='#ffb870'/><circle cx='36' cy='30' r='3' fill='#ffb870'/><path stroke='#2a1f2f' stroke-linecap='round' stroke-width='4' fill='none' d='M32 21V8M22 28 10 20M42 28 54 20M22 38 10 46M42 38 54 46M28 42 24 56M36 42 40 56'/><path fill='#ffb870' d='M30 37c0 .6.4 1 1 1h2c.6 0 1-.4 1-1 0-2-4-2-4 0Z'/></svg>";
        document.querySelectorAll('h1').forEach(h=>{
          if(h.textContent.trim()==='FocusPath' && !h.dataset.halloweenLogo){
            h.dataset.origHtml = h.innerHTML;
            h.dataset.halloweenLogo='1';
            h.innerHTML = `<span class=\"fp-spider-logo\" aria-hidden=\"true\">${spiderSVG}</span><span class=\"fp-logo-text\">FocusPath</span>`;
          }
        });
      }
    }
  }

  /* ---------- Christmas Seasonal Extras (global) ---------- */
  function applyChristmasExtras(active){
    // Ensure global style for Christmas gradient exists
    if(!document.getElementById('fp-christmas-style')){
      const style = document.createElement('style');
      style.id = 'fp-christmas-style';
      style.textContent = `
        .christmas-primary-area { background: linear-gradient(to bottom, #05070d 0%, #0a1830 80%, #0a2340 100%); }
        @keyframes fpSnowFall { 0% { transform: translate3d(0, -10px, 0); opacity: 0.85; } 60% { transform: translate3d(var(--drift), 60vh, 0); opacity: 0.92; } 100% { transform: translate3d(calc(var(--drift) * 1.4), 100vh, 0); opacity: 0.8; } }
        @keyframes fpSnowSway { 0% { margin-left: 0; } 100% { margin-left: var(--sway); } }
      `;
      document.head.appendChild(style);
    }
    // Pick the main container: prefer #primaryArea, fallback to first <main>
    const area = document.getElementById('primaryArea') || document.querySelector('main');
    if(!area) return;
    // Toggle gradient class
    if(active){ area.classList.add('christmas-primary-area'); }
    else { area.classList.remove('christmas-primary-area'); }

    // Manage snowfall overlay
    let overlay = area.querySelector('#fpSnowOverlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'fpSnowOverlay';
      overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;display:none;z-index:5;';
      // Ensure area is positioned to anchor overlay
      const pos = getComputedStyle(area).position;
      if(pos === 'static' || !pos){ area.style.position = 'relative'; }
      area.appendChild(overlay);
    }
    overlay.style.display = active ? 'block' : 'none';
    if(!active) return;
    // If overlay already has flakes (e.g., home.html), do not duplicate
    if(overlay.childElementCount > 0) return;
    const layers = [
      { count: 30, sizeMin: 2, sizeMax: 5, durMin: 10, durMax: 18, blur: 1.2, opacity: 0.6, z: 1 },
      { count: 40, sizeMin: 3, sizeMax: 7, durMin: 8,  durMax: 14, blur: 0.8, opacity: 0.8, z: 2 },
      { count: 30, sizeMin: 5, sizeMax: 10,durMin: 6,  durMax: 10, blur: 0.2, opacity: 0.95, z: 3 }
    ];
    layers.forEach(layer => {
      const layerEl = document.createElement('div');
      layerEl.style.cssText = `position:absolute; inset:0; pointer-events:none; z-index:${layer.z};`;
      overlay.appendChild(layerEl);
      for(let i=0;i<layer.count;i++){
        const flake = document.createElement('span');
        const size = layer.sizeMin + Math.random()*(layer.sizeMax-layer.sizeMin);
        const left = Math.random()*100;
        const dur = layer.durMin + Math.random()*(layer.durMax-layer.durMin);
        const delay = Math.random()*6;
        const drift = (Math.random()*60 - 30);
        const sway = (Math.random()*30 + 10);
        flake.style.cssText = `position:absolute; top:-12px; left:${left}%; width:${size}px; height:${size}px; border-radius:50%; background: rgba(255,255,255,${layer.opacity}); box-shadow:0 0 ${Math.max(4,size)}px rgba(255,255,255,0.6); filter: blur(${layer.blur}px); will-change: transform, opacity; animation: fpSnowFall ${dur}s linear ${delay}s infinite, fpSnowSway ${dur*0.7}s ease-in-out ${Math.random()*5}s infinite alternate;`;
        flake.style.setProperty('--drift', drift+'px');
        flake.style.setProperty('--sway', sway+'px');
        layerEl.appendChild(flake);
      }
    });
  }

  function applyThemeKey(key){
    let vars;
    if (key === 'system') {
      vars = computeSystemTheme();
      document.documentElement.setAttribute('data-theme', 'system');
    } else {
      vars = THEMES[key] || THEMES.light;
      document.documentElement.setAttribute('data-theme', key);
    }
    applyVars(vars);
    // Layering: bump main layout above canvas
    document.body.style.position='relative';
    document.body.style.zIndex='1';
    // Apply or remove Star Wars extras
  applyStarWarsExtras(key==='star-wars');
  applyHalloweenExtras(key==='halloween');
  applyChristmasExtras(key==='christmas');
  // Broadcast theme change for listeners (e.g., quotes)
  try { window.dispatchEvent(new CustomEvent('fpThemeChanged',{detail:{theme:key}})); } catch {}
  }

  function setTheme(key){
    // Only allow Halloween theme in October (unless Dev Mode)
    if(key === 'halloween' && !devIsOn()) {
      const now = new Date();
      const month = now.getMonth(); // 0-indexed: October is 9
      if(month !== 9) {
        // If not October, fallback to system theme and show a notice
        applyThemeKey('system');
        alert('Halloween theme is only available in October!');
        return;
      }
    }
    // Only allow Christmas theme in December (month 11) unless Dev Mode
    if(key === 'christmas' && !devIsOn()){
      const now = new Date();
      const month = now.getMonth(); // 0-indexed: December is 11
      if(month !== 11){
        applyThemeKey('system');
        alert('Christmas theme is only available in December!');
        return;
      }
    }
    try { localStorage.setItem(STORAGE_KEY, key); } catch {}
    applyThemeKey(key);
  }

  function getTheme(){
    try { return localStorage.getItem(STORAGE_KEY) || 'system'; } catch { return 'system'; }
  }

  function init(){
    // Inject a small CSS bridge so common Tailwind utility colors defer to theme variables
    if (!document.getElementById('fp-theme-bridge')) {
      const style = document.createElement('style');
      style.id = 'fp-theme-bridge';
      style.textContent = `
        /* Theme variable bridge */
        html, body { background: var(--background-color); color: var(--text-primary); }
        .bg-white { background-color: var(--white) !important; }
        .bg-gray-50 { background-color: var(--white) !important; }
        .bg-gray-100 { background-color: var(--surface-hover) !important; }
        .hover\\:bg-gray-100:hover { background-color: var(--surface-hover) !important; }
        .bg-gray-200 { background-color: var(--surface-hover) !important; }
        .hover\\:bg-gray-300:hover { background-color: var(--surface-hover) !important; }
        .hover\\:bg-red-50:hover { background-color: var(--surface-hover) !important; }
        .bg-blue-600 { background-color: var(--primary-color) !important; }
        .hover\\:bg-blue-700:hover { background-color: var(--primary-color) !important; }
        .border-gray-300 { border-color: var(--border-color) !important; }
        .text-gray-800, .text-gray-900, .text-black { color: var(--text-primary) !important; }
        .text-gray-400, .text-gray-500, .text-gray-600, .text-gray-700 { color: var(--text-secondary) !important; }
          /* Modern input styling */
    input[type=text], input[type=search], input[type=number], input[type=email], input[type=password], input[type=date], input[type=time], textarea, select, .modern-input {
            border-radius: 14px !important;
            background: var(--white) !important;
            border: 1px solid var(--border-color) !important;
            padding: 0.65rem 0.9rem !important;
            font-family: inherit; font-size: 0.9rem; line-height:1.3;
            color: var(--text-primary) !important;
            transition: border-color .18s ease, box-shadow .18s ease, background-color .25s ease;
          }
          input:focus, textarea:focus, select:focus {
            outline: none !important;
            border-color: var(--primary-color) !important;
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 35%, transparent) !important;
          }
          input[disabled], textarea[disabled], select[disabled] { opacity:.55; cursor:not-allowed; }
          /* Subtle inner background for textareas */
          textarea { min-height: 110px; resize: vertical; }
          /* Placeholder color alignment */
          ::placeholder { color: var(--text-secondary); opacity:.7; }
          /* Remove number input spinners (webkit) */
          input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          /* Dark theme adjustments auto rely on variables */
          @media (prefers-color-scheme: dark) {
            input[type=text], input[type=search], input[type=number], input[type=email], input[type=password], input[type=date], input[type=time], textarea, select {
              background: var(--white) !important; /* dark theme 'white' variable is a dark panel color */
              color: var(--text-primary) !important;
            }
          [data-theme='dark'] input[type=date], [data-theme='dark'] input[type=time]{ background: var(--white) !important; color: var(--text-primary) !important; }
          }
      `;
      document.head.appendChild(style);
    }
  let selected = getTheme();
  // Guard stored Christmas outside December unless Dev Mode
  const isDecember = new Date().getMonth() === 11;
  if(selected === 'christmas' && !isDecember && !devIsOn()){ selected = 'system'; try { localStorage.setItem(STORAGE_KEY, selected); } catch {} }
    // Seasonal override: Use Halloween as ephemeral default in October if user hasn't explicitly chosen something else
    let storedRaw=null; try { storedRaw = localStorage.getItem(STORAGE_KEY); } catch {}
  const isOctober = new Date().getMonth() === 9; // 0=Jan
    if(isOctober && (!storedRaw || storedRaw==='system')) {
      applyThemeKey('halloween');
    } else {
  applyThemeKey(selected);
    }
    // Update on system changes if using system
    if (selected === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', () => applyThemeKey('system'));
      } else if (typeof mq.addListener === 'function') { // legacy
        mq.addListener(() => applyThemeKey('system'));
      }
    }
    // Dev mode: keyboard shortcut and badge
    try {
      ensureDevBadge();
      window.addEventListener('keydown', (e)=>{
        // Ctrl+Shift+D opens Dev modal
        if((e.ctrlKey||e.metaKey) && e.shiftKey && (e.key==='D' || e.key==='d')){
          e.preventDefault(); showDevModal();
        }
      });
    } catch {}
  }

  window.ThemeManager = {
    init,
    setTheme,
    getTheme,
    listThemes: () => {
      // In Developer Mode, reveal all themes (including seasonal and secret) regardless of month
      if (devIsOn()) {
        const all = ['system', ...Object.keys(THEMES)];
        // Ensure unique ordering, keep system first
        return Array.from(new Set(all));
      }
      const base=['system','light','dark','ocean','forest','sunset','high-contrast'];
      const month = new Date().getMonth();
      // Halloween only in October
      if(month === 9) base.splice(6,0,'halloween'); // insert before high-contrast
      // Christmas only in December
      if(month === 11) base.splice(base.length-0,0,'christmas');
      return base;
    }
  };

  // Expose Dev API (optional use by pages)
  window.FPDev = {
    isDev: devIsOn,
    enable: devEnable,
    disable: devDisable,
    prompt: showDevModal
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
