/* ============================================================
   StormzQuiz — boards.js
   Drives boards.html. With no ?board= param, shows the 6 exam
   boards. With ?board=X, shows the subjects available for that
   board, each linking into quiz.html.
   ============================================================ */

function getBoardFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const board = params.get("board");
  if (board && window.BOARDS && window.BOARDS[board]) return board;
  return null;
}

function escapeHtmlText(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

(function renderBoardsPage() {
  const cardGrid = document.getElementById("cardGrid");
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const backLink = document.getElementById("backLink");
  if (!cardGrid || !window.BOARDS) return;

  const boardKey = getBoardFromUrl();

  if (!boardKey) {
    // Board picker
    pageTitle.textContent = "Choose your board";
    pageSubtitle.textContent = "Pick the exam board you're studying for, then pick a subject.";
    backLink.classList.add("is-hidden");

    cardGrid.innerHTML = "";
    Object.keys(window.BOARDS).forEach((key) => {
      const board = window.BOARDS[key];
      const subjectCount = Object.keys(board.subjects).length;
      const card = document.createElement("a");
      card.href = "boards.html?board=" + encodeURIComponent(key);
      card.className = "subject-card";
      card.innerHTML =
        '<span class="icon">' + board.icon + "</span>" +
        "<h3>" + escapeHtmlText(board.name) + "</h3>" +
        "<p>" + escapeHtmlText(board.tagline) + "</p>" +
        '<div class="meta"><span>' + subjectCount + (subjectCount === 1 ? " subject" : " subjects") + "</span></div>";
      cardGrid.appendChild(card);
    });
    return;
  }

  // Subject picker for a specific board
  const board = window.BOARDS[boardKey];
  pageTitle.textContent = board.name + " subjects";
  pageSubtitle.textContent = board.tagline + " — pick a subject to start practicing.";
  backLink.classList.remove("is-hidden");

  cardGrid.innerHTML = "";
  Object.keys(board.subjects).forEach((subjectKey) => {
    const subject = board.subjects[subjectKey];
    const total = subject.questions.length;
    const card = document.createElement("a");
    card.href = "quiz.html?board=" + encodeURIComponent(boardKey) + "&subject=" + encodeURIComponent(subjectKey);
    card.className = "subject-card";
    card.innerHTML =
      '<span class="icon">' + subject.icon + "</span>" +
      "<h3>" + escapeHtmlText(subject.name) + "</h3>" +
      "<p>" + escapeHtmlText(subject.description) + "</p>" +
      '<div class="meta"><span>' + total + " questions</span><span>25 per run</span></div>";
    cardGrid.appendChild(card);
  });
})();
