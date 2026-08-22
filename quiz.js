const LETTERS = ["A", "B", "C", "D"];
const QUESTIONS_PER_RUN = 40;

function getSubjectFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get("subject");
  if (subject && window.QUESTIONS && window.QUESTIONS[subject]) return subject;
  return "math";
}

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildRun(subject) {
  const bank = window.QUESTIONS[subject];
  const picked = shuffle(bank).slice(0, QUESTIONS_PER_RUN);
  return {
    subject,
    questions: picked,
    current: 0,
    score: 0,
    answered: false,
  };
}

function loadState(subject) {
  const raw = sessionStorage.getItem("stormz_quiz_state");
  if (raw) {
    try {
      const state = JSON.parse(raw);
      if (state.subject === subject && Array.isArray(state.questions) && state.questions.length === QUESTIONS_PER_RUN) {
        return state;
      }
    } catch (e) {
      /* fall through to a fresh run */
    }
  }
  const fresh = buildRun(subject);
  saveState(fresh);
  return fresh;
}

function saveState(state) {
  sessionStorage.setItem("stormz_quiz_state", JSON.stringify(state));
}

(function initQuiz() {
  const subject = getSubjectFromUrl();
  let state = loadState(subject);

  const subjectNames = { math: "Math", english: "English", chemistry: "Chemistry" };

  const subjectTag = document.getElementById("subjectTag");
  const qCount = document.getElementById("qCount");
  const progressFill = document.getElementById("progressFill");
  const passageBox = document.getElementById("passageBox");
  const questionText = document.getElementById("questionText");
  const optionsList = document.getElementById("optionsList");
  const explanationBox = document.getElementById("explanationBox");
  const verdictText = document.getElementById("verdictText");
  const explanationText = document.getElementById("explanationText");
  const actionBtn = document.getElementById("actionBtn");
  const scoreChip = document.getElementById("scoreChip");

  subjectTag.textContent = subjectNames[subject] || subject;

  function currentQuestion() {
    return state.questions[state.current];
  }

  function render() {
    const total = state.questions.length;
    const q = currentQuestion();

    qCount.textContent = "Question " + (state.current + 1) + " / " + total;
    progressFill.style.width = (((state.current + (state.answered ? 1 : 0)) / total) * 100) + "%";
    scoreChip.textContent = "Score: " + state.score + " / " + total;

    if (q.passage) {
      passageBox.style.display = "block";
      passageBox.textContent = q.passage;
    } else {
      passageBox.style.display = "none";
      passageBox.textContent = "";
    }

    questionText.textContent = q.question;

    optionsList.innerHTML = "";
    q.options.forEach((optionText, idx) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.type = "button";
      btn.innerHTML = '<span class="letter">' + LETTERS[idx] + '</span><span>' + escapeHtml(optionText) + "</span>";
      btn.addEventListener("click", () => selectOption(idx));
      btn.dataset.idx = idx;
      optionsList.appendChild(btn);
    });

    explanationBox.classList.remove("show", "correct-verdict", "incorrect-verdict");
    actionBtn.textContent = "Check";
    actionBtn.disabled = true;
    state.selected = null;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function selectOption(idx) {
    if (state.answered) return;
    state.selected = idx;
    Array.from(optionsList.children).forEach((btn, i) => {
      btn.classList.toggle("selected", i === idx);
    });
    actionBtn.disabled = false;
  }

  function checkAnswer() {
    const q = currentQuestion();
    const selected = state.selected;
    if (selected === null || selected === undefined) return;

    state.answered = true;
    const correct = selected === q.answer;
    if (correct) state.score += 1;

    Array.from(optionsList.children).forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.answer) btn.classList.add("correct");
      if (i === selected && !correct) btn.classList.add("incorrect");
    });

    verdictText.textContent = correct ? "Correct" : "Incorrect";
    explanationBox.classList.add("show", correct ? "correct-verdict" : "incorrect-verdict");
    explanationText.textContent = q.explanation;

    scoreChip.textContent = "Score: " + state.score + " / " + state.questions.length;
    progressFill.style.width = (((state.current + 1) / state.questions.length) * 100) + "%";

    if (correct) {
      if (typeof playCorrectSound === "function") playCorrectSound();
    } else {
      if (typeof playIncorrectSound === "function") playIncorrectSound();
    }

    const isLast = state.current === state.questions.length - 1;
    actionBtn.textContent = isLast ? "See Results" : "Next Question";
    saveState(state);
  }

  function nextQuestion() {
    const isLast = state.current === state.questions.length - 1;
    if (isLast) {
      sessionStorage.setItem(
        "stormz_results",
        JSON.stringify({ subject: state.subject, score: state.score, total: state.questions.length })
      );
      sessionStorage.removeItem("stormz_quiz_state");
      window.location.href = "results.html";
      return;
    }
    state.current += 1;
    state.answered = false;
    saveState(state);
    render();
  }

  actionBtn.addEventListener("click", () => {
    if (!state.answered) {
      checkAnswer();
    } else {
      nextQuestion();
    }
  });

  render();

  if (state.answered) {
    const q = currentQuestion();
    render();
    Array.from(optionsList.children).forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.answer) btn.classList.add("correct");
    });
    verdictText.textContent = "Answered";
    explanationBox.classList.add("show");
    explanationText.textContent = q.explanation;
    const isLast = state.current === state.questions.length - 1;
    actionBtn.textContent = isLast ? "See Results" : "Next Question";
    actionBtn.disabled = false;
  }
})();
