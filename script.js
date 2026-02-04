/* ---------------- GLOBAL ---------------- */
const quotes = [
  "Don’t stop when you’re tired; stop when you are finally done.",
  "Be the person your future self will thank."
];

let tests = JSON.parse(localStorage.getItem("tests")) || [];
let targets = JSON.parse(localStorage.getItem("targets")) || {};
let examDates = JSON.parse(localStorage.getItem("examDates")) || {};
let editIndex = null;

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("dark"); // force dark mode
  quoteText.textContent = quotes[Math.floor(Math.random() * quotes.length)];
  initSections();
  buildFilter();
  renderExamCounter();
  renderTables();
});

/* ---------------- SECTIONS ---------------- */
function initSections() {
  sections.innerHTML = "";
  addSectionHeader();
  for (let i = 0; i < 4; i++) addSection();
}

function addSectionHeader() {
  sections.innerHTML += `
    <div class="sectionLabels">
      <span>Section</span><span>Marks</span><span>C</span><span>W</span><span>U</span><span></span>
    </div>`;
}

function addSection(n = "", m = 0, c = 0, w = 0, u = 0) {
  sections.innerHTML += `
    <div class="sectionRow">
      <input class="sectionName" value="${n}">
      <input class="sectionMarks" type="number" value="${m}">
      <input type="number" value="${c}">
      <input type="number" value="${w}">
      <input type="number" value="${u}">
      <button onclick="this.parentElement.remove()">🗑</button>
    </div>`;
}

/* ---------------- SAVE ---------------- */
function saveTest() {
  if (!examName.value || !testName.value || !testDate.value)
    return alert("Fill all fields");

  const secs = [];
  let total = 0, tc = 0, tw = 0;

  document.querySelectorAll(".sectionRow").forEach(r => {
    const s = {
      name: r.children[0].value,
      marks: +r.children[1].value || 0,
      c: +r.children[2].value || 0,
      w: +r.children[3].value || 0,
      u: +r.children[4].value || 0
    };
    total += s.marks;
    tc += s.c;
    tw += s.w;
    secs.push(s);
  });

  const t = {
    exam: examName.value,
    test: testName.value,
    date: testDate.value,
    platform: platformName.value,
    neg: +negativeMark.value || 0,
    total,
    accuracy: tc + tw ? ((tc / (tc + tw)) * 100).toFixed(1) : 0,
    sections: secs
  };

  if (targetInput.value) targets[t.exam] = +targetInput.value;

  editIndex === null ? tests.push(t) : tests[editIndex] = t;
  editIndex = null;

  localStorage.setItem("tests", JSON.stringify(tests));
  localStorage.setItem("targets", JSON.stringify(targets));

  initSections();
  buildFilter();
  renderTables();
}

/* ---------------- FILTER ---------------- */
function buildFilter() {
  examFilter.innerHTML = `<option value="ALL">All Exams</option>`;
  [...new Set(tests.map(t => t.exam))]
    .forEach(e => examFilter.innerHTML += `<option>${e}</option>`);
  examFilter.onchange = renderTables;
}

/* ---------------- EXAM DATE COUNTER ---------------- */
function renderExamCounter() {
  let card = document.querySelector(".examCounterCard");
  if (!card) {
    card = document.createElement("div");
    card.className = "examCounterCard";
    card.innerHTML = `
      <h3>📅 Exam Countdown</h3>
      <div class="counterRow">
        <input id="examCounterName" placeholder="Exam Name">
        <input id="examCounterDate" type="date">
        <button onclick="saveExamDate()">Save</button>
      </div>
      <div id="counterList"></div>`;
    document.body.insertBefore(card, tablesArea);
  }

  const list = card.querySelector("#counterList");
  list.innerHTML = "";

  Object.entries(examDates).forEach(([e, d]) => {
    const days = Math.ceil((new Date(d) - new Date()) / 86400000);
    list.innerHTML += `<p><b>${e}</b> : ${days} days</p>`;
  });
}

function saveExamDate() {
  const n = examCounterName.value;
  const d = examCounterDate.value;
  if (!n || !d) return;
  examDates[n] = d;
  localStorage.setItem("examDates", JSON.stringify(examDates));
  renderExamCounter();
}

/* ---------------- TABLES ---------------- */
function renderTables() {
  tablesArea.innerHTML = "";
  const sel = examFilter.value || "ALL";
  const grouped = {};

  tests.forEach(t => {
    if (sel === "ALL" || t.exam === sel) {
      grouped[t.exam] = grouped[t.exam] || [];
      grouped[t.exam].push(t);
    }
  });

  Object.keys(grouped).forEach(exam => {
    const wrap = document.createElement("div");
    wrap.className = "examTableWrapper";
    wrap.innerHTML = `<h3>${exam} | Target: ${targets[exam] || "-"}</h3>`;

    const table = document.createElement("table");
    table.innerHTML = `
      <tr>
        <th>Test</th><th>Date</th><th>Platform</th><th>Total</th><th>Accuracy</th>
        ${grouped[exam][0].sections.map(s => `<th>${s.name}</th>`).join("")}
      </tr>`;

    grouped[exam].forEach(t => {
      table.innerHTML += `
        <tr>
          <td>${t.test}</td>
          <td>${t.date}</td>
          <td>${t.platform}</td>
          <td>${t.total}</td>
          <td>${t.accuracy}</td>
          ${t.sections.map(s => `<td>${s.marks}</td>`).join("")}
        </tr>`;
    });

    wrap.appendChild(table);
    tablesArea.appendChild(wrap);
  });
}
