/* ================= SAFE SELECTOR ================= */
if (!window.$) {
  window.$ = id => document.getElementById(id);
}

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
let quoteTimer = null;

/* ================= STORAGE ================= */
let tests = JSON.parse(localStorage.getItem("tests")) || [];
let examDates = JSON.parse(localStorage.getItem("examDates")) || [];
let editIndex = null;
let graphChart = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  rotateQuote();
  setInterval(rotateQuote, 10000);
  initSections();
  buildFilter();
  renderTables();
  renderExamDates();
});

/* ================= QUOTE ================= */
function rotateQuote() {
  const qt = $("quoteText");
  if (!qt) return;

  clearInterval(quoteTimer);
  qt.textContent = "";
  const text = quotes[quoteIndex];
  let i = 0;

  quoteTimer = setInterval(() => {
    qt.textContent += text.charAt(i++);
    if (i >= text.length) clearInterval(quoteTimer);
  }, 40);

  quoteIndex = (quoteIndex + 1) % quotes.length;
}

/* ================= SECTIONS ================= */
function initSections() {
  const s = $("sections");
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

/* ================= EXAM COUNTER ================= */
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
  box.innerHTML = "";

  examDates.forEach((e, i) => {
    const days = Math.ceil((new Date(e.date) - new Date()) / 86400000);
    box.innerHTML += `
      <div class="countdownCard">
        <b>${e.name}</b><br>
        ${days >= 0 ? days + " days left" : "Expired"}
        <button onclick="deleteExamDate(${i})">🗑</button>
      </div>`;
  });
}

function deleteExamDate(i) {
  examDates.splice(i, 1);
  localStorage.setItem("examDates", JSON.stringify(examDates));
  renderExamDates();
}

/* ================= SAVE / EDIT TEST ================= */
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
    negative: +$("negativeMark").value || 0,
    target: +$("targetInput").value || 0,
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

function editTest(index) {
  const t = tests[index];
  editIndex = index;

  $("examName").value = t.exam;
  $("testName").value = t.test;
  $("testDate").value = t.date;
  $("platformName").value = t.platform;
  $("negativeMark").value = t.negative;
  $("targetInput").value = t.target;

  $("sections").innerHTML = `
    <div class="sectionLabels">
      <span>Section</span><span>Marks</span><span>C</span><span>W</span><span>U</span><span></span>
    </div>`;

  t.sections.forEach(s => {
    $("sections").innerHTML += `
      <div class="sectionRow">
        <input value="${s.name}">
        <input type="number" value="${s.marks}">
        <input type="number" value="${s.c}">
        <input type="number" value="${s.w}">
        <input type="number" value="${s.u}">
        <button onclick="this.parentElement.remove()">🗑</button>
      </div>`;
  });
}

/* ================= FILTER ================= */
function buildFilter() {
  const f = $("examFilter");
  const selected = f.value || "ALL";

  f.innerHTML = `<option value="ALL">All Exams</option>`;
  [...new Set(tests.map(t => t.exam))].forEach(e => {
    f.innerHTML += `<option value="${e}">${e}</option>`;
  });

  f.value = selected;
  f.onchange = renderTables;
}

/* ================= TABLE ================= */
function renderTables() {
  const area = $("tablesArea");
  area.innerHTML = "";
  const selected = $("examFilter").value;

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
    const avg = (totals.reduce((a,b)=>a+b,0)/totals.length).toFixed(1);

    const wrap = document.createElement("div");
    wrap.innerHTML = `<h3>${exam} | Avg: ${avg}</h3>`;

    const table = document.createElement("table");
    const headers = list[0].sections.map(s => `<th>${s.name}</th>`).join("");

    table.innerHTML = `
      <tr>
        <th>Test</th><th>Date</th><th>Platform</th><th>Total</th>
        ${headers}
        <th>Edit</th><th>Delete</th>
      </tr>`;

    list.forEach(t => {
      const cls = t.total === max ? "best" : t.total === min ? "worst" : "";
      const idx = tests.indexOf(t);

      table.innerHTML += `
        <tr onclick="toggleDetails(this, ${idx})">
          <td>${idx + 1}</td>
          <td>${formatDate(t.date)}</td>
          <td>${t.platform}</td>
          <td class="${cls}">${t.total}</td>
          ${t.sections.map(s => `<td>${s.marks}</td>`).join("")}
          <td><button onclick="event.stopPropagation();editTest(${idx})">✏️</button></td>
          <td><button onclick="event.stopPropagation();deleteTest(${idx})">🗑</button></td>
        </tr>`;
    });

    wrap.appendChild(table);
    area.appendChild(wrap);
  });
}

function deleteTest(i) {
  tests.splice(i, 1);
  localStorage.setItem("tests", JSON.stringify(tests));
  buildFilter();
  renderTables();
}

/* ================= GRAPH (FILTER AWARE) ================= */
function showGraph() {
  $("graphPage").style.display = "block";
  renderGraph();
}

function hideGraph() {
  $("graphPage").style.display = "none";
}

function renderGraph() {
  const canvas = $("graph");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (graphChart) graphChart.destroy();

  const selected = $("examFilter").value;
  const data = selected === "ALL"
    ? tests
    : tests.filter(t => t.exam === selected);

  if (data.length === 0) return;

  graphChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((_, i) => `Test ${i + 1}`),
      datasets: [{
        label: "Total Marks",
        data: data.map(t => t.total),
        borderWidth: 2,
        tension: 0.3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

/* ================= EXPORT EXCEL ================= */
function exportExcel() {
  const ws = XLSX.utils.json_to_sheet(
    tests.map(t => ({
      Exam: t.exam,
      Test: t.test,
      Date: formatDate(t.date),
      Platform: t.platform,
      Total: t.total
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tests");
  XLSX.writeFile(wb, "mock-tracker.xlsx");
}

/* ================= DATE ================= */
function formatDate(d) {
  if (!d) return "";
  const [y,m,day] = d.split("-");
  return `${day}-${m}-${y}`;
}
