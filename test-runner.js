// test-runner.js

window.startTestRunner = function (test) {
  const root = document.getElementById("testRunner");
  if (!root) {
    console.error('test-runner: #testRunner element not found.');
    return;
  }

  const titleEl = root.querySelector("#runnerTitle");
  const contentEl = root.querySelector("#runnerContent");
  const btnPrev = root.querySelector("#btnPrevQ");
  const btnNext = root.querySelector("#btnNextQ");

  if (!contentEl || !btnPrev || !btnNext || !titleEl) {
    console.error("test-runner: missing required runner elements.");
    return;
  }

  titleEl.textContent = test?.name || "";
  const questions = Array.isArray(test?.questions) ? test.questions : [];
  const total = questions.length;
  let index = 0;
  const answers = new Array(total).fill(null);

  // Timer
  const startTime = Date.now();

  function renderQuestion() {
    contentEl.innerHTML = "";

    if (total === 0) {
      contentEl.innerHTML = `<div class="italic text-gray-500">No questions in this test.</div>`;
      btnPrev.disabled = true;
      btnNext.disabled = true;
      return;
    }

    const q = questions[index];

    const wrapper = document.createElement("div");
    wrapper.className = "p-4 bg-white rounded shadow space-y-4";

    const qText = document.createElement("div");
    qText.className = "font-medium text-lg";
    qText.textContent = `${index + 1}. ${q.text || "(Untitled Question)"}`;
    wrapper.appendChild(qText);

    if (q.image) {
      const img = document.createElement('img');
      img.src = q.image;
      img.alt = 'Question image';
      img.className = 'max-h-64 rounded border border-gray-200';
      wrapper.appendChild(img);
    }

    const answersWrap = document.createElement("div");
    answersWrap.className = "space-y-2";

    if (q.type === "multiple") {
      (q.options || []).forEach(opt => {
        const label = document.createElement("label");
        label.className = "flex items-center gap-2";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "answer";
        input.value = opt;
        if (answers[index] !== null && answers[index] === opt) input.checked = true;
        const span = document.createElement("span");
        span.textContent = opt;
        label.appendChild(input);
        label.appendChild(span);
        answersWrap.appendChild(label);
      });
    } else if (q.type === "truefalse") {
      ["True", "False"].forEach(val => {
        const label = document.createElement("label");
        label.className = "flex items-center gap-2";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "answer";
        input.value = val;
        if (answers[index] !== null && answers[index] === val) input.checked = true;
        const span = document.createElement("span");
        span.textContent = val;
        label.appendChild(input);
        label.appendChild(span);
        answersWrap.appendChild(label);
      });
    } else if (q.type === "text") {
      const input = document.createElement("input");
      input.type = "text";
      input.name = "answer";
      input.placeholder = "Type your answer...";
      input.className = "w-full rounded border p-2";
      if (answers[index] !== null) input.value = answers[index];
      answersWrap.appendChild(input);
    } else {
      const txt = document.createElement("div");
      txt.className = "text-sm text-gray-500";
      txt.textContent = "Unknown question type.";
      answersWrap.appendChild(txt);
    }

    wrapper.appendChild(answersWrap);
    contentEl.appendChild(wrapper);

  // Ensure nav buttons are visible while taking the test
  btnPrev.style.display = "";
  btnNext.style.display = "";
  btnPrev.disabled = index === 0;
  btnNext.textContent = index === total - 1 ? "Submit" : "Next";
  btnNext.disabled = false;
  }

  function saveCurrentAnswer() {
    if (total === 0) return;
    const q = questions[index];
    if (!q) return;

    if (q.type === "text") {
      const input = contentEl.querySelector('input[name="answer"]');
      answers[index] = input ? input.value.trim() : null;
    } else {
      const checked = contentEl.querySelector('input[name="answer"]:checked');
      answers[index] = checked ? checked.value : null;
    }
  }

  btnPrev.onclick = function (e) {
    e.preventDefault();
    if (index === 0) return;
    saveCurrentAnswer();
    index--;
    renderQuestion();
  };

  btnNext.onclick = function (e) {
    e.preventDefault();
    if (index < total - 1) {
      saveCurrentAnswer();
      index++;
      renderQuestion();
      return;
    }
    saveCurrentAnswer();
    handleSubmit();
  };

  function handleSubmit() {
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000); // seconds

    // Grading
    let correctCount = 0;
    for (let i = 0; i < total; i++) {
      const q = questions[i];
      const ans = answers[i];
      if (!q) continue;

      if (q.type === "text") {
        const acceptable = q.answers || [];
        if (acceptable.some(a => a.toLowerCase() === (ans || "").toLowerCase())) {
          correctCount++;
        }
      } else if (q.type === "multiple" || q.type === "truefalse") {
        if (q.answer === ans) correctCount++;
      }
    }

  const score = correctCount;
  const percent = total === 0 ? 0 : Math.round((score / total) * 100);

    // Save attempt
    const attempt = {
      testId: test.id,
      testName: test.name,
      date: new Date().toISOString(),
      answers,
      score,
      total,
      timeTaken
    };

    let attempts = [];
    try {
      attempts = JSON.parse(localStorage.getItem("testAttempts") || "[]");
    } catch {}
    attempts.push(attempt);
    localStorage.setItem("testAttempts", JSON.stringify(attempts));
  // Show unified results view (hides nav and provides Home + Test Review)
  // (Do NOT call renderDashboard here; it would wipe the runner before results display.)
  showTestResults(test, answers, score, total, timeTaken);
  }

function showTestResults(test, userAnswers, score, total, timeTaken) {
  contentEl.innerHTML = "";
  // Hide Prev/Next (Submit) on results screen
  btnPrev.style.display = "none";
  btnNext.style.display = "none";

  const resultsBlock = document.createElement("div");
  resultsBlock.className = "p-6 bg-white rounded-xl shadow space-y-4 text-center";

  const title = document.createElement("h2");
  title.className = "text-xl font-semibold";
  title.textContent = "Test Completed!";
  resultsBlock.appendChild(title);

  const scoreEl = document.createElement("div");
  scoreEl.className = "text-gray-700";
  scoreEl.innerHTML = `Score: ${score} / ${total} <br>Percentage: ${((score/total)*100).toFixed(1)}%`;
  resultsBlock.appendChild(scoreEl);

  if (typeof timeTaken === "number") {
    const timeEl = document.createElement("div");
    timeEl.className = "text-gray-500";
    timeEl.textContent = `Time taken: ${timeTaken} seconds`;
    resultsBlock.appendChild(timeEl);
  }

  // Buttons container
  const btnContainer = document.createElement("div");
  btnContainer.className = "flex justify-center gap-4 mt-4";

  // Test Review button
  const reviewBtn = document.createElement("button");
  reviewBtn.textContent = "Test Review";
  reviewBtn.className = "px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700";
  reviewBtn.addEventListener("click", () => {
    showReview(test, userAnswers);
  });

  // Home button
  const homeBtn = document.createElement("button");
  homeBtn.textContent = "Home";
  homeBtn.className = "px-4 py-2 bg-gray-200 text-[var(--text-primary)] rounded shadow hover:bg-gray-300";
  homeBtn.addEventListener("click", () => {
    if (typeof renderTestList === "function") {
      renderTestList();
      const primary = document.getElementById("primaryArea");
      if (typeof renderDashboard === 'function') {
        renderDashboard();
      } else {
        primary.innerHTML = `<div class=\"min-h-[46vh] flex items-center justify-center text-gray-500\">Select a test from the list to begin.</div>`;
      }
    }
  });

  btnContainer.appendChild(reviewBtn);
  btnContainer.appendChild(homeBtn);
  resultsBlock.appendChild(btnContainer);
  contentEl.appendChild(resultsBlock);
}

function showReview(test, userAnswers) {
  contentEl.innerHTML = "";
  // Hide Prev/Next (Submit) on review screen
  btnPrev.style.display = "none";
  btnNext.style.display = "none";

  test.questions.forEach((q, i) => {
    const block = document.createElement("div");
    block.className = "p-4 mb-3 bg-white rounded shadow space-y-2";

    const qText = document.createElement("div");
    qText.className = "font-medium";
    qText.textContent = `${i + 1}. ${q.text || "(Untitled Question)"}`;
    block.appendChild(qText);

    const userAns = userAnswers[i];
    const correctAns = q.type === "text" ? q.answers : q.answer;

    const ansWrap = document.createElement("div");
    ansWrap.className = "space-y-1";

    if (q.type === "multiple" || q.type === "truefalse") {
      (q.options || ["True", "False"]).forEach(opt => {
        const span = document.createElement("div");
        span.textContent = opt;
        if (opt === correctAns) span.className = "font-semibold text-green-600";
        if (opt === userAns && opt !== correctAns) span.className = "line-through text-red-600";
        ansWrap.appendChild(span);
      });
    } else if (q.type === "text") {
      const span = document.createElement("div");
      span.textContent = `Your answer: ${userAns || "(No answer)"}`;
      span.className = userAns && (q.answers || []).some(a => a.toLowerCase() === userAns.toLowerCase()) ? "text-green-600" : "text-red-600";
      ansWrap.appendChild(span);

      const correctSpan = document.createElement("div");
      correctSpan.textContent = `Correct answer(s): ${q.answers.join(", ")}`;
      correctSpan.className = "text-green-600";
      ansWrap.appendChild(correctSpan);
    }

    block.appendChild(ansWrap);
    contentEl.appendChild(block);
  });

  // Buttons container for review
  const btnContainer = document.createElement("div");
  btnContainer.className = "flex justify-center gap-4 mt-4";

  // Back button (go back to test results)
  const backBtn = document.createElement("button");
  backBtn.textContent = "Back";
  backBtn.className = "px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700";
  backBtn.addEventListener("click", () => {
    const score = userAnswers.filter((a, i) => {
      const q = test.questions[i];
      if (q.type === "text") {
        return (q.answers || []).some(ans => ans.toLowerCase() === (a || "").toLowerCase());
      } else {
        return a === q.answer;
      }
    }).length;
    showTestResults(test, userAnswers, score, test.questions.length);
  });

  // Home button
  const homeBtn = document.createElement("button");
  homeBtn.textContent = "Home";
  homeBtn.className = "px-4 py-2 bg-gray-200 text-[var(--text-primary)] rounded shadow hover:bg-gray-300";
  homeBtn.addEventListener("click", () => {
    if (typeof renderTestList === "function") {
      renderTestList();
      const primary = document.getElementById("primaryArea");
      if (typeof renderDashboard === 'function') {
        renderDashboard();
      } else {
        primary.innerHTML = `<div class=\"min-h-[46vh] flex items-center justify-center text-gray-500\">Select a test from the list to begin.</div>`;
      }
    }
  });

  btnContainer.appendChild(backBtn);
  btnContainer.appendChild(homeBtn);
  contentEl.appendChild(btnContainer);
}

  renderQuestion();
};
