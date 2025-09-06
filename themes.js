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
    sunset: {
  '--primary-color': '#ea580c', /* deeper orange */
  '--background-color': '#ffe7d3',
  '--text-primary': '#1a2532',
  '--text-secondary': '#4b5563',
  '--white': '#fff5ed',
  '--border-color': '#f7c8a3',
  '--surface-hover': '#ffd9ba'
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
  // Broadcast theme change for listeners (e.g., quotes)
  try { window.dispatchEvent(new CustomEvent('fpThemeChanged',{detail:{theme:key}})); } catch {}
  }

  function setTheme(key){
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
    const selected = getTheme();
    applyThemeKey(selected);
    // Update on system changes if using system
    if (selected === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', () => applyThemeKey('system'));
      } else if (typeof mq.addListener === 'function') { // legacy
        mq.addListener(() => applyThemeKey('system'));
      }
    }
  }

  window.ThemeManager = {
    init,
    setTheme,
    getTheme,
    listThemes: () => {
  const base=['system','light','dark','ocean','forest','sunset','high-contrast']; // secret theme disabled
      return base;
    }
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
