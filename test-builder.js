// test-builder.js

// ---------- Storage helpers ----------
function loadTestsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("tests") || "[]");
  } catch {
    return [];
  }
}
function saveTestsToStorage(tests) {
  localStorage.setItem("tests", JSON.stringify(tests));
}
function generateId() {
  return "test_" + Date.now();
}

// ---------- Global refs ----------
let currentTest = null;
let activeQuestionIndex = null;
let els = {};

// Expose init for tests.html loader
window.initTestBuilder = function () {
  // ---------- State ----------
  currentTest = {
    id: null,
    subject: "",
    name: "",
    desc: "",
    image: null,
    questions: []
  };
  activeQuestionIndex = null;

  // ---------- Element refs ----------
  els = {
  subject: document.getElementById("testSubject"),
    name: document.getElementById("testName"),
    desc: document.getElementById("testDesc"),

    questionsList: document.getElementById("questionsList"),
    activeQuestion: document.getElementById("activeQuestion"),

    btnAddQuestion: document.getElementById("btnAddQuestion"),
  btnBulkAddQuestions: document.getElementById("btnBulkAddQuestions"),
    btnSaveQuestion: document.getElementById("btnSaveQuestion"),
    btnSaveTest: document.getElementById("btnSaveTest"),
  btnMoveUp: document.getElementById("btnMoveUpQuestion"),
  btnMoveDown: document.getElementById("btnMoveDownQuestion"),
  btnDelete: document.getElementById("btnDeleteQuestion"),
  };

  if (!els.questionsList || !els.activeQuestion) {
    console.error("Test Builder: Missing DOM nodes — did the HTML load?");
    return;
  }

  // ---------- Button handlers ----------
  // Subject custom creation handler
  if(els.subject){
    els.subject.addEventListener('change',()=>{
      if(els.subject.value==='__create'){
        let name = prompt('Enter new subject name:');
        if(name){
          name = name.trim();
          if(name){
            // Assign color if not exists
            try{
              const map = JSON.parse(localStorage.getItem('fpSubjectColors')||'{}');
              const list = JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]');
              if(!list.includes(name)){ list.push(name); localStorage.setItem('fpCustomSubjects',JSON.stringify(list)); }
              if(!map[name]){
                const used = new Set(Object.values(map).map(v=>v.toLowerCase()));
                const palette = ['#ef4444','#f59e0b','#0d78f2','#22c55e','#8b5cf6','#14b8a6','#6366f1','#ec4899','#10b981','#eab308','#0ea5e9','#fb923c','#84cc16','#f472b6','#38bdf8','#a855f7','#dc2626','#2563eb','#9333ea','#047857','#ea580c'];
                let pick=null;
                // Try palette first
                for(const col of palette){ if(!used.has(col.toLowerCase())){ pick=col; break; } }
                // If still null generate random unique
                let guard=0; while(!pick && guard<50){
                  const cand = '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
                  if(!used.has(cand.toLowerCase())) pick=cand; guard++;
                }
                if(!pick) pick='#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
                map[name]=pick; localStorage.setItem('fpSubjectColors',JSON.stringify(map));
              }
            }catch{}
            // Insert option if missing
            const exists = Array.from(els.subject.options).some(o=>o.value===name||o.text===name);
            if(!exists){ const opt=document.createElement('option'); opt.value=name; opt.textContent=name; els.subject.insertBefore(opt, els.subject.querySelector('option[value="__create"]')); }
            els.subject.value=name;
            toggleRemoveBtn();
          } else { els.subject.value=''; }
        } else {
          els.subject.value='';
        }
      }
      toggleRemoveBtn();
    });
  }

  function loadCustomSubjects(){
    try{
      const list=JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]');
      const removed=JSON.parse(localStorage.getItem('fpRemovedDefaultSubjects')||'[]');
      if(els.subject){
        // Remove default subjects that were deleted previously
        [...els.subject.options].forEach(o=>{
          if(o.value && removed.includes(o.value)) o.remove();
        });
        // Insert customs
        list.forEach(sub=>{
          if(!Array.from(els.subject.options).some(o=>o.value===sub)){
            const opt=document.createElement('option'); opt.value=sub; opt.textContent=sub; els.subject.insertBefore(opt, els.subject.querySelector('option[value="__create"]'));
          }
        });
      }
    }catch{}
  }

  function removeCurrentSubject(){
    const val = els.subject.value;
    if(!val) return; if(!confirm('Remove subject "'+val+'" from dropdown? Existing tests keep the label; you can re-create later.')) return;
    try{
      let custom=JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]');
      if(custom.includes(val)){
        custom=custom.filter(s=>s!==val); localStorage.setItem('fpCustomSubjects',JSON.stringify(custom));
        const map=JSON.parse(localStorage.getItem('fpSubjectColors')||'{}'); delete map[val]; localStorage.setItem('fpSubjectColors',JSON.stringify(map));
      } else {
        // default subject removal tracking
        let rem=JSON.parse(localStorage.getItem('fpRemovedDefaultSubjects')||'[]'); if(!rem.includes(val)){ rem.push(val); localStorage.setItem('fpRemovedDefaultSubjects',JSON.stringify(rem)); }
      }
    }catch{}
    const opt=[...els.subject.options].find(o=>o.value===val); if(opt) opt.remove(); els.subject.value=''; toggleRemoveBtn();
  }

  function toggleRemoveBtn(){
    const btn=document.getElementById('btnRemoveSubjectTest'); if(!btn) return; const val=els.subject.value; if(!val || val==='__create'){ btn.classList.add('hidden'); return; }
    btn.classList.remove('hidden');
  }

  document.getElementById('btnManageSubjectsTest')?.addEventListener('click',()=>{
    const list = JSON.parse(localStorage.getItem('fpCustomSubjects')||'[]');
    alert(list.length? 'Custom Subjects:\n'+list.join('\n') : 'No custom subjects yet.');
  });
  document.getElementById('btnRemoveSubjectTest')?.addEventListener('click',removeCurrentSubject);

  loadCustomSubjects();
  toggleRemoveBtn();
  els.btnAddQuestion.addEventListener("click", () => {
    const newQ = { text: "", type: "multiple", options: ["", "", "", ""], answer: null };
    currentTest.questions.push(newQ);
    activeQuestionIndex = currentTest.questions.length - 1;
    renderQuestionsList();
    renderActiveQuestion();
  });

  // Bulk add dialog similar to flashcard bulk (simple textarea parse)
  if (els.btnBulkAddQuestions) {
    els.btnBulkAddQuestions.addEventListener('click', () => {
      const raw = prompt('Bulk Add Questions:\nEnter one question per line. Use | to separate multiple-choice options and * to mark the correct one.\nExample:\nWhat is 2+2?|3|*4|5|6\nThe earth is round|*True|False');
      if (!raw) return;
      const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
      let added = 0;
      lines.forEach(line => {
        // Determine if multiple choice style with options
        if (line.includes('|')) {
          const parts = line.split('|').map(s=>s.trim()).filter(Boolean);
          if (!parts.length) return;
          const qText = parts.shift();
          let answer = null;
          const opts = parts.map(p => {
            if (p.startsWith('*')) { answer = p.replace(/^\*/,'').trim(); return answer; }
            return p; });
          if (opts.length) {
            currentTest.questions.push({ text:qText, type:'multiple', options:opts, answer: answer && opts.includes(answer) ? answer : null });
            added++;
          }
        } else if (/^(true|false)/i.test(line)) {
          // if line starts with true/false treat as simple true/false statement (prefix not ideal so fallback)
          currentTest.questions.push({ text: line, type:'truefalse', options:['True','False'], answer:'True' });
          added++;
        } else {
          currentTest.questions.push({ text: line, type:'text', answers:[''] });
          added++;
        }
      });
      if (added) {
        activeQuestionIndex = currentTest.questions.length - 1;
        renderQuestionsList();
        renderActiveQuestion();
        alert('Added '+added+' question'+(added!==1?'s':'')+'.');
      } else {
        alert('No valid lines to add.');
      }
    });
  }

  els.btnSaveQuestion.addEventListener("click", () => {
    const q = currentTest.questions[activeQuestionIndex ?? -1];
    if (q && q.type === "multiple") {
      const cleaned = (q.options || []).map(o => o.trim()).filter(Boolean);
      q.options = cleaned;
      if (!cleaned.includes(q.answer)) q.answer = null;
    }
    if (q && q.type === "text") {
      q.answers = (q.answers || []).map(a => a.trim()).filter(Boolean);
    }
    renderQuestionsList();
  });

  els.btnSaveTest.addEventListener("click", () => {
  // Subject select stores value text
  currentTest.subject = (els.subject && els.subject.value) ? els.subject.value.trim() : "";
    currentTest.name = els.name.value.trim();
    currentTest.desc = els.desc.value.trim();

    currentTest.questions = currentTest.questions.map((q) => {
      if (q.type === "multiple") {
        const cleaned = (q.options || []).map(o => o.trim()).filter(Boolean);
        const ans = cleaned.includes(q.answer) ? q.answer : null;
        return { ...q, options: cleaned, answer: ans };
      }
      if (q.type === "text") {
        const answers = (q.answers || []).map(a => a.trim()).filter(Boolean);
        return { ...q, answers };
      }
      return q;
    });

  // No test-level image uploader anymore; persist immediately
  persistTestAndReset();
  });

  // Reorder & delete controls
  if (els.btnMoveUp) {
    els.btnMoveUp.addEventListener('click', () => {
      if (activeQuestionIndex===null || activeQuestionIndex<=0) return;
      const i = activeQuestionIndex;
      const arr = currentTest.questions;
      [arr[i-1], arr[i]] = [arr[i], arr[i-1]];
      activeQuestionIndex = i-1;
      renderQuestionsList();
      renderActiveQuestion();
    });
  }
  if (els.btnMoveDown) {
    els.btnMoveDown.addEventListener('click', () => {
      if (activeQuestionIndex===null || activeQuestionIndex>=currentTest.questions.length-1) return;
      const i = activeQuestionIndex;
      const arr = currentTest.questions;
      [arr[i+1], arr[i]] = [arr[i], arr[i+1]];
      activeQuestionIndex = i+1;
      renderQuestionsList();
      renderActiveQuestion();
    });
  }
  if (els.btnDelete) {
    els.btnDelete.addEventListener('click', () => {
      if (activeQuestionIndex===null) return;
      if (!confirm('Delete this question?')) return;
      currentTest.questions.splice(activeQuestionIndex,1);
      if (activeQuestionIndex >= currentTest.questions.length) activeQuestionIndex = currentTest.questions.length-1;
      if (activeQuestionIndex < 0) activeQuestionIndex = null;
      renderQuestionsList();
      renderActiveQuestion();
    });
  }

  function persistTestAndReset() {
    if (!currentTest.name) {
      alert("Please provide a Test Name before saving.");
      return;
    }
    let tests = loadTestsFromStorage();

    if (!currentTest.id) {
      currentTest.id = generateId();
      tests.push(currentTest);
    } else {
      const idx = tests.findIndex(t => t.id === currentTest.id);
      if (idx >= 0) tests[idx] = currentTest;
      else tests.push(currentTest);
    }

    saveTestsToStorage(tests);

    // ✅ Refresh the test list in the sidebar immediately
    if (typeof renderTestList === "function") {
      renderTestList();
    }
    // ✅ Refresh dashboard KPIs if available
    if (typeof renderDashboard === "function") {
      renderDashboard();
    }

    alert("Test saved successfully!");
  }

  // ---------- Initial render ----------
  renderQuestionsList();
  renderActiveQuestion();
  updateReorderState();
};

// ---------- Expose loadTestIntoBuilder ----------
window.loadTestIntoBuilder = function (testObj) {
  if (!testObj) return;

  currentTest = JSON.parse(JSON.stringify(testObj)); // deep copy
  activeQuestionIndex = null;

  // Fill form fields
  // If current test's subject is not in the fixed list, inject it as a temporary option
  if (els.subject && currentTest.subject) {
    const exists = Array.from(els.subject.options).some(o => o.text === currentTest.subject || o.value === currentTest.subject);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = currentTest.subject;
      opt.textContent = currentTest.subject;
      els.subject.insertBefore(opt, els.subject.firstChild);
    }
  }
  els.subject.value = currentTest.subject || "";
  els.name.value = currentTest.name || "";
  els.desc.value = currentTest.desc || "";

  // Render UI
  renderQuestionsList();
  renderActiveQuestion();
};

// ---------- Rendering ----------
function renderQuestionsList() {
  const list = els.questionsList;
  list.innerHTML = "";

  if (!currentTest || currentTest.questions.length === 0) {
    list.innerHTML = `<div class="text-[var(--text-secondary)] italic">No questions yet. Use "Add New Question".</div>`;
    return;
  }

  currentTest.questions.forEach((q, i) => {
    const item = document.createElement("div");
    item.className =
      "p-2 rounded-md bg-white shadow cursor-pointer hover:bg-gray-100 flex items-start gap-2";
    item.innerHTML = `
      <div class="flex-1">
        <div class="font-medium">${i + 1}. ${q.text?.trim() || "(Untitled Question)"}</div>
        <div class="text-xs text-[var(--text-secondary)]">
          ${q.type === "multiple" ? "Multiple Choice" : q.type === "truefalse" ? "True / False" : "Typing Answer"}
        </div>
      </div>
      <button title="Delete" data-del="${i}" class="text-red-600 text-sm px-1.5 rounded hover:bg-red-50">✕</button>
    `;
    item.addEventListener("click", (e) => {
      if (e.target && e.target.matches("[data-del]")) return;
      activeQuestionIndex = i;
      renderActiveQuestion();
      [...list.children].forEach(el => el.classList.remove("ring-2","ring-blue-200"));
      item.classList.add("ring-2","ring-blue-200");
  updateReorderState();
    });
    item.querySelector("[data-del]").addEventListener("click", () => {
      if (activeQuestionIndex === i) activeQuestionIndex = null;
      currentTest.questions.splice(i, 1);
      renderQuestionsList();
      renderActiveQuestion();
  updateReorderState();
    });
    list.appendChild(item);
  });
}

function renderActiveQuestion() {
  const editor = els.activeQuestion;
  editor.innerHTML = "";

  if (!currentTest || activeQuestionIndex === null) {
    editor.innerHTML = `<div class="text-[var(--text-secondary)] italic">No active question. Click "Add New Question" to begin editing.</div>`;
  updateReorderState();
    return;
  }

  const q = currentTest.questions[activeQuestionIndex];
  const wrap = document.createElement("div");
  wrap.className = "space-y-4";

  // Question Text
  const qTextLabel = document.createElement("label");
  qTextLabel.className = "block font-medium text-[var(--text-primary)] mb-1";
  qTextLabel.textContent = "Question Text";
  const qText = document.createElement("textarea");
  qText.rows = 3;
  qText.className = "w-full rounded-md border-gray-300 p-2";
  qText.placeholder = "Enter your question...";
  qText.value = q.text || "";
  qText.addEventListener("input", (e) => {
    q.text = e.target.value;
  });

  // Type Select
  const typeLabel = document.createElement("label");
  typeLabel.className = "block font-medium text-[var(--text-primary)] mb-1";
  typeLabel.textContent = "Type";
  const typeSelect = document.createElement("select");
  typeSelect.className = "w-full rounded-md border-gray-300 p-2";
  typeSelect.innerHTML = `
    <option value="multiple">Multiple Choice</option>
    <option value="truefalse">True / False</option>
    <option value="text">Typing Answer</option>
  `;
  typeSelect.value = q.type || "multiple";
  typeSelect.addEventListener("change", (e) => {
    q.type = e.target.value;
    if (q.type === "multiple") {
      q.options = q.options && q.options.length ? q.options : ["", "", "", ""];
      q.answer = q.answer ?? null;
      delete q.answers;
    } else if (q.type === "truefalse") {
      q.options = ["True", "False"];
      q.answer = q.answer || "True";
      delete q.answers;
    } else if (q.type === "text") {
      delete q.options;
      q.answers = Array.isArray(q.answers) && q.answers.length ? q.answers : [""];
      q.answer = undefined;
    }
    renderActiveQuestion();
  });

  wrap.appendChild(qTextLabel);
  wrap.appendChild(qText);
  wrap.appendChild(typeLabel);
  wrap.appendChild(typeSelect);

  // Question Image uploader
  const imgBlock = document.createElement('div');
  imgBlock.className = 'space-y-2';
  const imgLbl = document.createElement('label');
  imgLbl.className = 'block font-medium text-[var(--text-primary)] mb-1';
  imgLbl.textContent = 'Question Image (optional)';
  const imgRow = document.createElement('div');
  imgRow.className = 'flex items-center gap-3 flex-wrap';

  const imgInput = document.createElement('input');
  imgInput.type = 'file';
  imgInput.accept = 'image/*';
  imgInput.className = 'block text-sm';
  imgInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      q.image = ev.target.result; // data URL
      // Update preview without full re-render
      if (preview) {
        preview.src = q.image;
        preview.classList.remove('hidden');
      }
      if (btnRemove) btnRemove.disabled = false;
    };
    reader.readAsDataURL(file);
  });

  const preview = document.createElement('img');
  preview.className = 'max-h-40 rounded border border-[var(--border-color)] ' + (q.image ? '' : 'hidden');
  preview.alt = 'Question image preview';
  if (q.image) preview.src = q.image;

  const btnRemove = document.createElement('button');
  btnRemove.type = 'button';
  btnRemove.textContent = 'Remove Image';
  btnRemove.className = 'px-2 py-1 text-sm rounded border border-[var(--border-color)] hover:bg-gray-100 disabled:opacity-50';
  btnRemove.disabled = !q.image;
  btnRemove.addEventListener('click', () => {
    q.image = null;
    if (preview) {
      preview.src = '';
      preview.classList.add('hidden');
    }
    btnRemove.disabled = true;
  });

  imgRow.appendChild(imgInput);
  imgRow.appendChild(btnRemove);
  imgBlock.appendChild(imgLbl);
  imgBlock.appendChild(imgRow);
  imgBlock.appendChild(preview);

  // Options/Answers block
  const optionsBlock = document.createElement("div");
  optionsBlock.className = "space-y-2";
  optionsBlock.id = "qOptionsWrapper";

  if (q.type === "multiple") {
    const lbl = document.createElement("label");
    lbl.className = "block font-medium text-[var(--text-primary)] mb-1";
    lbl.textContent = "Options (select the correct one)";
    optionsBlock.appendChild(lbl);

    (q.options || ["", "", "", ""]).forEach((opt, idx) => {
      const row = document.createElement("div");
      row.className = "flex items-center gap-2";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "qCorrect";
      radio.checked = q.answer === opt && opt !== "";
      radio.addEventListener("change", () => {
        q.answer = opt;
      });

      const input = document.createElement("input");
      input.type = "text";
      input.className = "flex-1 rounded-md border-gray-300 p-2";
      input.placeholder = `Option ${idx + 1}`;
      input.value = opt || "";
      input.addEventListener("input", (e) => {
        q.options[idx] = e.target.value;
        if (q.answer === opt && e.target.value.trim() === "") {
          q.answer = null;
        }
      });

      row.appendChild(radio);
      row.appendChild(input);
      optionsBlock.appendChild(row);
    });
  } else if (q.type === "truefalse") {
    const lbl = document.createElement("label");
    lbl.className = "block font-medium text-[var(--text-primary)] mb-1";
    lbl.textContent = "Correct Answer";
    optionsBlock.appendChild(lbl);

    ["True", "False"].forEach((val) => {
      const row = document.createElement("label");
      row.className = "flex items-center gap-2";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "qTrueFalse";
      radio.value = val.toLowerCase();
      radio.checked = (q.answer || "True") === val;
      radio.addEventListener("change", () => {
        q.answer = val;
      });
      const span = document.createElement("span");
      span.textContent = val;
      row.appendChild(radio);
      row.appendChild(span);
      optionsBlock.appendChild(row);
    });
  } else if (q.type === "text") {
    const lbl = document.createElement("label");
    lbl.className = "block font-medium text-[var(--text-primary)] mb-1";
    lbl.textContent = "Acceptable Answers (not case sensitive)";
    optionsBlock.appendChild(lbl);

    const answersWrap = document.createElement("div");
    answersWrap.className = "space-y-2";
    (q.answers || [""]).forEach((ans, i) => {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "w-full rounded-md border-gray-300 p-2 qTextAnswer";
      input.placeholder = `Answer ${i + 1}`;
      input.value = ans;
      input.addEventListener("input", (e) => {
        q.answers[i] = e.target.value;
      });
      answersWrap.appendChild(input);
    });

    const btnAddAns = document.createElement("button");
    btnAddAns.type = "button";
    btnAddAns.className = "mt-1 px-2 py-1 text-xs rounded border";
    btnAddAns.textContent = "+ Add Another";
    btnAddAns.addEventListener("click", () => {
      q.answers = (q.answers || []).concat([""]);
      renderActiveQuestion();
    });

    optionsBlock.appendChild(answersWrap);
    optionsBlock.appendChild(btnAddAns);
  }

  wrap.appendChild(optionsBlock);
  wrap.appendChild(imgBlock);
  els.activeQuestion.appendChild(wrap);
  updateReorderState();
}

function updateReorderState(){
  if(!els.btnMoveUp||!els.btnMoveDown||!els.btnDelete) return;
  const len = currentTest?.questions?.length||0;
  const idx = activeQuestionIndex;
  const disabled = idx===null;
  els.btnMoveUp.disabled = disabled || idx<=0;
  els.btnMoveDown.disabled = disabled || idx>=len-1;
  els.btnDelete.disabled = disabled;
}
