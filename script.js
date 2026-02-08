/* ================= SAFE SELECTOR ================= */
const $ = id => document.getElementById(id);

/* ================= QUOTES ================= */
const quotes = [
  "Be the person your future self will thank.",
  "Discipline beats motivation.",
  "Small progress is still progress.",
  "Consistency creates confidence.",
  "Your competition is your past self.",
  "Focus on the process, not the outcome.",
  "Dreams don’t work unless you do.",
  "Hard work compounds silently.",
  "Success is built daily.",
  "You are one habit away from change.",
  "Work now, relax later.",
  "Pressure makes diamonds.",
  "No excuses. Just execution.",
  "Train your mind to stay strong.",
  "Do it even when you don’t feel like it.",
  "Comfort is the enemy of growth.",
  "Every mock makes you sharper.",
  "Stay patient. Stay consistent.",
  "Results follow discipline.",
  "Future you is watching."
];

let quoteIndex = Math.floor(Math.random() * quotes.length);
let typingInterval;

/* ================= STORAGE ================= */
let tests = JSON.parse(localStorage.getItem("tests")) || [];
let examDates = JSON.parse(localStorage.getItem("examDates")) || [];
let editIndex = null;
let chartInstance = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  typeQuote();
  setInterval(typeQuote, 10000);

  initSections();
  buildFilter();
  renderTables();
  renderExamDates();
});

/* ================= TYPEWRITER QUOTE ================= */
function typeQuote() {
  const el = $("quoteText");
  if (!el) return;

  clearInterval(typingInterval);
  el.textContent = "";

  const text = quotes[quoteIndex];
  let i = 0;

  typingInterval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(typingInterval);
  }, 50);

  quoteIndex = (quoteIndex + 1) % quotes.length;
}

/* ================= SECTIONS ================= */
function initSections() {
  const s = $("sections");
  if (!s) return;
  s.innerHTML = `
    <div class="sectionLabels">
      <span>Section</span><span>Marks</span><span>C</span><span>W</span><span>U</span><span></span>
    </div>`;
  for (let i = 0; i < 4; i++) addSection();
}

function addSection() {
  $("sections").innerHTML += `
    <div class="sectionRow">
      <input>
      <input type="number">
      <input type="number">
      <input type="number">
      <input type="number">
      <button onclick="this.parentElement.remove()">🗑</button>
    </div>`;
}

/* ================= EXAM COUNTDOWN ================= */
function addExamDate() {
  const name = $("examCounterName").value;
  const date = $("examCounterDate").value;

  if (!name || !date) return alert("Enter exam name and date");

  examDates.push({ name, date });
  localStorage.setItem("examDates", JSON.stringify(examDates));

  $("examCounterName").value = "";
  $("examCounterDate").value = "";

  renderExamDates();
}

function renderExamDates() {
  const box = $("examCountdownList");
  if (!box) return;

  box.innerHTML = "";

  examDates.forEach((e, i) => {
    const days = Math.ceil(
      (new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    box.innerHTML += `
      <div class="countdownCard">
        <b>${e.name}</b><br>
        <span>${days >= 0 ? days + " days left" : "Expired"}</span>
        <button onclick="deleteExamDate(${i})">🗑</button>
      </div>`;
  });
}

function deleteExamDate(i) {
  examDates.splice(i, 1);
  localStorage.setItem("examDates", JSON.stringify(examDates));
  renderExamDates();
}

/* ================= SAVE TEST ================= */
function saveTest() {
  const rows = document.querySelectorAll(".sectionRow");
  let sections = [];
  let total = 0;

  rows.forEach(r => {
    const sec = {
      name: r.children[0].value,
      marks: +r.children[1].value || 0,
      c: +r.children[2].value || 0,
      w: +r.children[3].value || 0,
      u: +r.children[4].value || 0
    };
    total += sec.marks;
    sections.push(sec);
  });

  const test = {
    exam: $("examName").value,
    test: $("testName").value,
    date: $("testDate").value,
    platform: $("platformName").value,
    negative: +$("negativeMark")?.value || 0,
    total,
    sections
  };

  editIndex === null ? tests.push(test) : tests[editIndex] = test;
  editIndex = null;

  localStorage.setItem("tests", JSON.stringify(tests));
  initSections();
  buildFilter();
  renderTables();
}

/* ================= FILTER ================= */
function buildFilter() {
  const f = $("examFilter");
  if (!f) return;

  f.innerHTML = `<option value="ALL">All Exams</option>`;
  [...new Set(tests.map(t => t.exam))].forEach(e => {
    f.innerHTML += `<option value="${e}">${e}</option>`;
  });

  f.onchange = renderTables;
}

/* ================= TABLE (BEST / WORST HIGHLIGHT) ================= */
function renderTables() {
  const area = $("tablesArea");
  if (!area) return;

  area.innerHTML = "";
  const selected = $("examFilter")?.value || "ALL";

  const grouped = {};
  tests.forEach(t => {
    if (selected === "ALL" || t.exam === selected) {
      grouped[t.exam] = grouped[t.exam] || [];
      grouped[t.exam].push(t);
    }
  });

  Object.keys(grouped).forEach(exam => {
    const list = grouped[exam];
    const totals = list.map(t => t.total);
    const max = Math.max(...totals);
    const min = Math.min(...totals);

    const wrap = document.createElement("div");
    wrap.innerHTML = `<h3>${exam}</h3>`;

    const table = document.createElement("table");
    const headers = list[0].sections.map(s => `<th>${s.name}</th>`).join("");

    table.innerHTML = `
      <tr>
        <th>Test</th><th>Date</th><th>Platform</th><th>Total</th>
        ${headers}
        <th>Edit</th><th>Delete</th>
      </tr>`;

    list.forEach((t, i) => {
      const cls = t.total === max ? "best" : t.total === min ? "worst" : "";

      table.innerHTML += `
        <tr onclick="toggleDetails(this, ${tests.indexOf(t)})">
          <td>${i + 1}</td>
          <td>${formatDate(t.date)}</td>
          <td>${t.platform}</td>
          <td class="${cls}">${t.total}</td>
          ${t.sections.map(s => `<td>${s.marks}</td>`).join("")}
          <td><button onclick="event.stopPropagation();editTest(${tests.indexOf(t)})">✏️</button></td>
          <td><button onclick="event.stopPropagation();deleteTest(${tests.indexOf(t)})">🗑</button></td>
        </tr>`;
    });

    wrap.appendChild(table);
    area.appendChild(wrap);
  });
}

/* ================= ANALYSIS ================= */
function toggleDetails(row, i) {
  if (row.nextSibling && row.nextSibling.classList.contains("details")) {
    row.nextSibling.remove();
    return;
  }

  const t = tests[i];
  let negativeLoss = 0;

  t.sections.forEach(s => {
    negativeLoss += (s.w || 0) * (t.negative || 0);
  });

  const d = document.createElement("tr");
  d.className = "details";
  d.innerHTML = `
    <td colspan="100%">
      <div class="analysisBox">
        ${t.sections.map(s =>
          `<b>${s.name}</b> → C:${s.c} W:${s.w} U:${s.u}`
        ).join("<br>")}
        <br><br>
        <b>Negative Marks Lost:</b> ${negativeLoss.toFixed(2)}
      </div>
    </td>`;

  row.after(d);
}

/* ================= DATE ================= */
function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}
