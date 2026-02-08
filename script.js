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
let quoteTimer = null;

/* ================= STORAGE ================= */
let tests = JSON.parse(localStorage.getItem("tests")) || [];
let examDates = JSON.parse(localStorage.getItem("examDates")) || [];
let editIndex = null;
let chartInstance = null;

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

/* ================= FILTER ================= */
function buildFilter() {
  const f = $("examFilter");
  f.innerHTML = `<option value="ALL">All Exams</option>`;
  [...new Set(tests.map(t => t.exam))].forEach(e => {
    f.innerHTML += `<option value="${e}">${e}</option>`;
  });
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

    list.forEach((t, i) => {
      const cls = t.total === max ? "best" : t.total === min ? "worst" : "";
      table.innerHTML += `
        <tr onclick="toggleDetails(this, ${tests.indexOf(t)})">
          <td>${i+1}</td>
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
function toggleDetails(row, index) {
  document.querySelectorAll(".analysisRow").forEach(r => r.remove());
  const t = tests[index];

  let c=0,w=0,u=0;
  t.sections.forEach(s => { c+=s.c; w+=s.w; u+=s.u; });

  const negLoss = (w * (t.negative||0)).toFixed(2);
  const need = Math.max(0, t.target - t.total).toFixed(2);

  const tr = document.createElement("tr");
  tr.className = "analysisRow";
  tr.innerHTML = `
    <td colspan="100%">
      <div class="analysisBox" style="text-align:left">
        ✔ Correct: ${c}<br>
        ✖ Wrong: ${w}<br>
        ⏸ Unattempted: ${u}<br>
        ➖ Negative Lost: ${negLoss}<br>
        🎯 Target: ${t.target}<br>
        📉 Marks Needed: <b>${need}</b>
      </div>
    </td>`;
  row.after(tr);
}

/* ================= GRAPH ================= */
function showGraph() {
  $("graphPage").style.display = "block";
  $("tablesArea").style.display = "none";

  const exam = $("examFilter").value;
  const data = tests.filter(t => exam === "ALL" ? false : t.exam === exam);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart($("graph"), {
    type: "line",
    data: {
      labels: data.map((_,i)=>`Test ${i+1}`),
      datasets: [{
        label: exam,
        data: data.map(t=>t.total),
        borderWidth: 2
      }]
    },
    options: {
      scales: {
        y: {
          min: 10,
          max: 300,
          ticks: { stepSize: 10 }
        }
      }
    }
  });
}

function hideGraph() {
  $("graphPage").style.display = "none";
  $("tablesArea").style.display = "block";
}

/* ================= EXPORT EXCEL ================= */
function exportExcel() {
  const wb = XLSX.utils.book_new();
  const grouped = {};

  tests.forEach(t => {
    grouped[t.exam] = grouped[t.exam] || [];
    grouped[t.exam].push(t);
  });

  Object.keys(grouped).forEach(exam => {
    const rows = grouped[exam].map(t => ({
      Date: formatDate(t.date),
      Platform: t.platform,
      Total: t.total
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, exam.substring(0,31));
  });

  XLSX.writeFile(wb, "mock-tracker.xlsx");
}

/* ================= EDIT / DELETE ================= */
function editTest(i) {
  editIndex = i;
  const t = tests[i];
  $("examName").value = t.exam;
  $("testName").value = t.test;
  $("testDate").value = t.date;
  $("platformName").value = t.platform;
  $("negativeMark").value = t.negative;
  $("targetInput").value = t.target;

  $("sections").innerHTML = "";
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

function deleteTest(i) {
  if (!confirm("Delete this test?")) return;
  tests.splice(i, 1);
  localStorage.setItem("tests", JSON.stringify(tests));
  renderTables();
}

/* ================= DATE ================= */
function formatDate(d) {
  if (!d) return "";
  const [y,m,day] = d.split("-");
  return `${day}-${m}-${y}`;
}
