document.getElementById("dictSearch").addEventListener("click", lookupWord);
document.getElementById("dictInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") lookupWord();
});

// ---- Invisible Statistics Tracking (Dictionary) ----
// localStorage key: fpDictionaryStats
// Structure example:
// {
//   searches:{ total:0, byWord:{}, timeFocusedMs:0 },
//   lists:{ created:0, updated:0, deleted:0, bySubject:{} },
//   exports:{ listToFlashcards:0, cardsCreated:0, bySubject:{} },
//   lastUpdated: 0
// }
function loadDictStats(){
  try { return JSON.parse(localStorage.getItem('fpDictionaryStats')||'{}'); } catch { return {}; }
}
function saveDictStats(stats){
  stats.lastUpdated=Date.now();
  localStorage.setItem('fpDictionaryStats', JSON.stringify(stats));
}
function withDictStats(mutator){
  const stats=loadDictStats();
  if(!stats.searches) stats.searches={ total:0, byWord:{}, timeFocusedMs:0 };
  if(!stats.lists) stats.lists={ created:0, updated:0, deleted:0, bySubject:{} };
  if(!stats.exports) stats.exports={ listToFlashcards:0, cardsCreated:0, bySubject:{} };
  mutator(stats);
  saveDictStats(stats);
}
// Track focus time on search input as "time spent searching"
let __dictSearchFocusStart=null;
const dictInputEl=document.getElementById('dictInput');
dictInputEl.addEventListener('focus', ()=>{ if(__dictSearchFocusStart==null) __dictSearchFocusStart=performance.now(); });
dictInputEl.addEventListener('blur', ()=>{
  if(__dictSearchFocusStart!=null){
    const delta=performance.now()-__dictSearchFocusStart; __dictSearchFocusStart=null;
    withDictStats(s=>{ s.searches.timeFocusedMs += Math.round(delta); });
  }
});
window.addEventListener('beforeunload', ()=>{
  if(__dictSearchFocusStart!=null){
    const delta=performance.now()-__dictSearchFocusStart; __dictSearchFocusStart=null;
    withDictStats(s=>{ s.searches.timeFocusedMs += Math.round(delta); });
  }
});

async function lookupWord() {
  const word = document.getElementById("dictInput").value.trim().toLowerCase();
  const resultEl = document.getElementById("dictResult");
  resultEl.innerHTML = "";

  if (!word) {
    resultEl.innerHTML = `<div class="text-red-600">Please enter a word.</div>`;
    return;
  }

  // Record search attempt
  if(word){
    withDictStats(s=>{
      s.searches.total += 1;
      s.searches.byWord[word] = (s.searches.byWord[word]||0)+1;
    });
  }

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) throw new Error("Word not found");

  const data = await res.json();
  const entry = data[0];
  window.__dictLastEntry = entry; // cache for Add button integration

    const header = document.createElement("div");
    header.className = "font-semibold text-lg";
    header.textContent = entry.word;
    resultEl.appendChild(header);

    entry.meanings.forEach(m => {
      const block = document.createElement("div");
      block.className = "p-2 border-l-4 border-blue-600 bg-gray-50 rounded";

      const partOfSpeech = document.createElement("div");
      partOfSpeech.className = "italic text-gray-600";
      partOfSpeech.textContent = m.partOfSpeech;

      block.appendChild(partOfSpeech);

      m.definitions.slice(0, 2).forEach(def => {
        const defText = document.createElement("div");
        defText.textContent = `- ${def.definition}`;
        block.appendChild(defText);
      });

      resultEl.appendChild(block);
    });
  } catch (err) {
    console.error(err);
    resultEl.innerHTML = `<div class="text-red-600">No definition found for "${word}".</div>`;
    window.__dictLastEntry = null;
  }
}
