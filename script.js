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

/* ================= FILTER (FIXED) ================= */
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

/* ================= ANALYSIS ================= */
function toggleDetails(row, index) {
  const next = row.nextElementSibling;
  if (next && next.classList.contains("analysisRow")) {
    next.remove(); return;
  }

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

/* ================= EXPORT PDF (FIXED) ================= */
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p","mm","a4");
  let y = 15;

  const grouped = {};
  tests.forEach(t => {
    grouped[t.exam] = grouped[t.exam] || [];
    grouped[t.exam].push(t);
  });

  Object.keys(grouped).forEach(exam => {
    doc.setFontSize(14);
    doc.text(exam, 14, y);
    y += 6;

    const head = [[
      "Test",
      "Date",
      "Platform",
      "Total",
      ...grouped[exam][0].sections.map(s => s.name)
    ]];

    const body = grouped[exam].map((t,i)=>[
      i + 1,
      formatDate(t.date),
      t.platform,
      t.total,
      ...t.sections.map(s => s.marks)
    ]);

    doc.autoTable({
      startY: y,
      head,
      body,
      theme: "grid",
      styles: { fontSize: 8 }
    });

    y = doc.lastAutoTable.finalY + 10;
  });

  doc.save("mock-tracker.pdf");
}
/* ================= DATE ================= */
function formatDate(d) {
  if (!d) return "";
  const [y,m,day] = d.split("-");
  return `${day}-${m}-${y}`;
}
/* ================= GRAPH ================= */
function showGraph() {
  document.getElementById("graphPage").style.display = "block";
  renderGraph();   
}


function hideGraph() {
  document.getElementById("graphPage").style.display = "none";
}
let graphChart;

function renderGraph() {
  const ctx = document.getElementById("graph").getContext("2d");

  if (graphChart) graphChart.destroy();

  graphChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: exams.map(e => e.name),
      datasets: [{
        label: "Marks",
        data: exams.map(e => e.total),
        borderWidth: 2,
        fill: false
      }]
    }
  });
}
