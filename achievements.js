// FocusPath Achievements Notification Module
// Provides lightweight achievement checking outside stats page and toast notifications.
// Notifications only fire when explicitly invoked (e.g., dashboard/home render) — never during active study or test-run pages.
(function(){
  const TOAST_ID_PREFIX = 'fpToast_';
  const NOTIFIED_KEY = 'fpNotifiedBadges';
  const PERSIST_KEY = 'fpPersistedBadges';

  // Core (non-secret) achievement definitions aligned with stats.html
  function hours(h){ return h*3600; }
  function minutes(m){ return m*60; }
  const ACHIEVEMENTS = [
    {id:'test_first',check:c=>c.totalTests>=1,label:'Created first test'},
    {id:'test_5',check:c=>c.totalTests>=5,label:'5 tests created'},
    {id:'test_10',check:c=>c.totalTests>=10,label:'10 tests created'},
    {id:'test_25',check:c=>c.totalTests>=25,label:'25 tests created'},
    {id:'test_50',check:c=>c.totalTests>=50,label:'50 tests created'},
    {id:'q_10',check:c=>c.totalQuestions>=10,label:'Wrote 10 questions'},
    {id:'q_50',check:c=>c.totalQuestions>=50,label:'Wrote 50 questions'},
    {id:'q_100',check:c=>c.totalQuestions>=100,label:'Wrote 100 questions'},
    {id:'q_250',check:c=>c.totalQuestions>=250,label:'Wrote 250 questions'},
    {id:'q_500',check:c=>c.totalQuestions>=500,label:'Wrote 500 questions'},
    {id:'attempt_first',check:c=>c.totalAttempts>=1,label:'First test attempt'},
    {id:'attempt_5',check:c=>c.totalAttempts>=5,label:'5 test attempts'},
    {id:'attempt_10',check:c=>c.totalAttempts>=10,label:'10 test attempts'},
    {id:'attempt_25',check:c=>c.totalAttempts>=25,label:'25 test attempts'},
    {id:'attempt_50',check:c=>c.totalAttempts>=50,label:'50 test attempts'},
    {id:'score_80',check:c=>c.highestScoreAttempt && c.highestScoreAttempt.pct>=80,label:'Scored 80%+'},
    {id:'score_90',check:c=>c.highestScoreAttempt && c.highestScoreAttempt.pct>=90,label:'Scored 90%+'},
    {id:'score_100_once',check:c=>c.perfectScores>=1,label:'Perfect score!'},
    {id:'score_100_five',check:c=>c.perfectScores>=5,label:'5 perfect scores'},
    {id:'avg_85',check:c=>c.avgScore>=85 && c.totalAttempts>=5,label:'85% avg maintained'},
    {id:'trend_up',check:c=>c.trendDelta>=5,label:'Improving trend'},
    {id:'set_first',check:c=>c.totalSets>=1,label:'Created first set'},
    {id:'set_5',check:c=>c.totalSets>=5,label:'5 sets created'},
    {id:'set_10',check:c=>c.totalSets>=10,label:'10 sets created'},
    {id:'set_25',check:c=>c.totalSets>=25,label:'25 sets created'},
    {id:'set_50',check:c=>c.totalSets>=50,label:'50 sets created'},
    {id:'card_20',check:c=>c.totalCards>=20,label:'20 cards authored'},
    {id:'card_100',check:c=>c.totalCards>=100,label:'100 cards authored'},
    {id:'card_250',check:c=>c.totalCards>=250,label:'250 cards authored'},
    {id:'card_500',check:c=>c.totalCards>=500,label:'500 cards authored'},
    {id:'card_1000',check:c=>c.totalCards>=1000,label:'1000 cards authored'},
    {id:'session_first',check:c=>c.totalSessions>=1,label:'First study session'},
    {id:'session_10',check:c=>c.totalSessions>=10,label:'10 study sessions'},
    {id:'session_25',check:c=>c.totalSessions>=25,label:'25 study sessions'},
    {id:'session_50',check:c=>c.totalSessions>=50,label:'50 study sessions'},
    {id:'session_100',check:c=>c.totalSessions>=100,label:'100 study sessions'},
    {id:'study_10min',check:c=>c.totalStudySeconds>=minutes(10),label:'10 min studied'},
    {id:'study_1h',check:c=>c.totalStudySeconds>=hours(1),label:'1 hour studied'},
    {id:'study_5h',check:c=>c.totalStudySeconds>=hours(5),label:'5 hours studied'},
    {id:'study_10h',check:c=>c.totalStudySeconds>=hours(10),label:'10 hours studied'},
    {id:'cardsStudied_500',check:c=>c.totalCardsStudied>=500,label:'500 cards studied'},
    {id:'cardsStudied_2000',check:c=>c.totalCardsStudied>=2000,label:'2000 cards studied'},
    {id:'cardsStudied_5000',check:c=>c.totalCardsStudied>=5000,label:'5000 cards studied'},
    {id:'math_master',check:c=> (c.testBySubject['Math']?.avg||0) >=85 && (c.testBySubject['Math']?.count||0)>=3,label:'Math mastery'},
    {id:'science_scholar',check:c=> (c.flashBySubject['Science']?.sessions||0) >=5,label:'Science scholar'},
    {id:'language_lover',check:c=> (c.flashBySubject['English/Language']?.sessions||0) >=5,label:'Language lover'},
    {id:'art_aficionado',check:c=> (c.flashBySubject['Art']?.sessions||0) >=5,label:'Art aficionado'},
    {id:'social_strategist',check:c=> (c.flashBySubject['Social Studies']?.sessions||0) >=5,label:'Social strategist'},
    {id:'diversifier',check:c=> c.distinctFlashSubjects>=5,label:'Studied 5 subjects'},
    {id:'focus_balance',check:c=> c.balancedStudy && c.distinctFlashSubjects>=3,label:'Balanced study'},
    {id:'flash_marathon',check:c=> (c.maxCardsSession?.cardsSeen||0)>=100,label:'Flashcard marathon'},
    {id:'streak_3',check:c=> c.longestStreak>=3,label:'3-day streak'},
    {id:'streak_7',check:c=> c.longestStreak>=7,label:'7-day streak'}
  ];

  function dayKeyLocal(d){ const dt=new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }

  function loadJSON(key){ try { return JSON.parse(localStorage.getItem(key)||'[]'); } catch { return []; } }

  function buildContext(){
    const tests = loadJSON('tests');
    const attempts = loadJSON('testAttempts');
    const sets = loadJSON('flashcardSets');
    const sessions = loadJSON('flashcardSessions');
    const totalTests=tests.length;
    const totalQuestions=tests.reduce((s,t)=> s+(t.questions?.length||0),0);
    const totalAttempts=attempts.length;
    const totalSets=sets.length;
    const totalCards=sets.reduce((s,st)=> s+(st.cards?.length||0),0);
    const totalSessions=sessions.length;
    const totalCardsStudied=sessions.reduce((s,a)=> s+(a.cardsSeen||0),0);
    const totalStudySeconds=sessions.reduce((s,a)=> s+(a.durationSeconds||0),0);
    const highestScoreAttempt = attempts.reduce((m,a)=>{ const pct=a.total? (a.score/a.total)*100:0; return (!m||pct>m.pct)? {pct,attempt:a}:m; }, null);
    const perfectScores = attempts.filter(a=> a.total && (a.score/a.total)*100===100).length;
    const avgScore = attempts.length? attempts.reduce((s,a)=> s+(a.total? (a.score/a.total)*100:0),0)/attempts.length:0;
    const sortedAttempts=[...attempts].sort((a,b)=> new Date(a.date)-new Date(b.date));
    const last5=sortedAttempts.slice(-5); const prev5=sortedAttempts.slice(-10,-5);
    const avgPct=list=> list.length? list.reduce((s,a)=> s+(a.total? (a.score/a.total)*100:0),0)/list.length:0;
    const trendDelta=(last5.length&&prev5.length)? (avgPct(last5)-avgPct(prev5)):0;
    const testBySubject={}; attempts.forEach(a=>{ const t=tests.find(tt=> String(tt.id)===String(a.testId)); const subj=(t&&t.subject)||'(No Subject)'; const pct=a.total? (a.score/a.total)*100:0; if(!testBySubject[subj]) testBySubject[subj]={sum:0,count:0,avg:0}; testBySubject[subj].sum+=pct; testBySubject[subj].count++; }); Object.keys(testBySubject).forEach(s=>{ const o=testBySubject[s]; o.avg=o.count? o.sum/o.count:0; });
    const flashBySubject={}; sessions.forEach(s=>{ const subj=s.subject||'Other'; if(!flashBySubject[subj]) flashBySubject[subj]={sessions:0,cards:0}; flashBySubject[subj].sessions++; flashBySubject[subj].cards += (s.cardsSeen||0); });
    const distinctFlashSubjects=Object.keys(flashBySubject).length;
    const totalSubjectCards=Object.values(flashBySubject).reduce((s,o)=> s+o.cards,0); let balancedStudy=false; if(totalSubjectCards>0){ const shares=Object.values(flashBySubject).map(o=> o.cards/totalSubjectCards); const avgShare=shares.reduce((a,b)=>a+b,0)/shares.length; balancedStudy=shares.every(sh=> sh>=avgShare*0.4); }
    const maxCardsSession=sessions.reduce((m,s)=> (s.cardsSeen||0)>(m?.cardsSeen||0)?s:m,null);
    const daySet=new Set([...attempts.map(a=>dayKeyLocal(a.date)), ...sessions.map(s=>dayKeyLocal(s.date))]); const allDays=[...daySet].sort(); let longestStreak=0,currentStreak=0,prevDate=null; allDays.forEach(d=>{ const dt=new Date(d); if(prevDate){ const nx=new Date(prevDate); nx.setDate(nx.getDate()+1); const isConsecutive=dayKeyLocal(nx)===dayKeyLocal(dt); currentStreak=isConsecutive? currentStreak+1:1; } else currentStreak=1; if(currentStreak>longestStreak) longestStreak=currentStreak; prevDate=dt; });
    return {tests,attempts,sets,sessions,totalTests,totalQuestions,totalAttempts,totalSets,totalCards,totalSessions,totalCardsStudied,totalStudySeconds,highestScoreAttempt,perfectScores,avgScore,trendDelta,testBySubject,flashBySubject,distinctFlashSubjects,balancedStudy,maxCardsSession,longestStreak};
  }

  function ensureToastContainer(){ let c=document.getElementById('fpAchievementToasts'); if(!c){ c=document.createElement('div'); c.id='fpAchievementToasts'; c.style.position='fixed'; c.style.top='1rem'; c.style.right='1rem'; c.style.zIndex='2000'; c.style.display='flex'; c.style.flexDirection='column'; c.style.gap='0.75rem'; c.setAttribute('aria-live','polite'); document.body.appendChild(c); } return c; }

  function showToast(badge){ const c=ensureToastContainer(); const el=document.createElement('div'); el.id=TOAST_ID_PREFIX+badge.id; el.style.background='var(--white)'; el.style.border='1px solid var(--border-color)'; el.style.borderLeft='4px solid var(--primary-color)'; el.style.padding='12px 14px'; el.style.borderRadius='12px'; el.style.boxShadow='0 4px 14px -2px rgba(0,0,0,0.08)'; el.style.fontSize='13px'; el.style.display='flex'; el.style.alignItems='center'; el.style.gap='10px'; el.style.animation='fpToastIn .35s ease'; el.innerHTML=`<span style="font-size:18px">🏆</span><div><div style="font-weight:600;color:var(--text-primary);line-height:1.2">Achievement Unlocked</div><div style="color:var(--text-secondary);margin-top:2px;white-space:nowrap;">${badge.label}</div></div>`; c.appendChild(el); setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(-4px)'; el.style.transition='all .4s ease'; setTimeout(()=> el.remove(),400); },5000); }

  // Public safe trigger
  function checkAndNotify(){
    if(window.__FP_ACTIVE_STUDY) return; // suppressed
    const ctx=buildContext();
    let persisted=[]; try{ persisted=JSON.parse(localStorage.getItem(PERSIST_KEY)||'[]'); }catch{}
    let notified=[]; try{ notified=JSON.parse(localStorage.getItem(NOTIFIED_KEY)||'[]'); }catch{}
    const earned = ACHIEVEMENTS.filter(a=> a.check(ctx)).map(a=>a.id);
    const newEarned = earned.filter(id=> !persisted.includes(id));
    if(!newEarned.length) return;
    // Update persisted list (union) so resets preserve
    const union = Array.from(new Set([...persisted, ...newEarned]));
    localStorage.setItem(PERSIST_KEY, JSON.stringify(union));
    const toNotify = newEarned.filter(id=> !notified.includes(id));
    if(!toNotify.length) return;
    const newNotifiedUnion = Array.from(new Set([...notified, ...toNotify]));
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(newNotifiedUnion));
    // Show toasts sequentially (slight stagger)
    toNotify.forEach((id,i)=>{ const def=ACHIEVEMENTS.find(a=>a.id===id); setTimeout(()=> showToast(def), i*400); });
  }

  // Expose
  window.FPAchievementNotifySafe = checkAndNotify;
})();
