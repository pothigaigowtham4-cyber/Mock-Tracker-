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

  qt.textContent = "";
  let text = quotes[quoteIndex];
  let i = 0;

  const typer = setInterval(() => {
    qt.textContent += text.charAt(i++);
    if (i >= text.length) clearInterval(typer);
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
      table.innerHTML += `
        <tr onclick="toggleDetails(this, ${tests.indexOf(t)})">
          <td>${i + 1}</td>
          <td>${formatDate(t.date)}</td>
          <td>${t.platform}</td>
          <td>${t.total}</td>
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
      ✔ Correct: ${c}<br>
      ✖ Wrong: ${w}<br>
      ⏸ Unattempted: ${u}<br>
      ➖ Negative Lost: ${negLoss}<br>
      🎯 Target: ${t.target}<br>
      📉 Marks Needed: <b>${need}</b>
    </td>`;
  row.after(tr);
}

/* ================= GRAPH ================= */
function showGraph() {
  $("graphPage").style.display = "block";
  renderGraph();
}

function hideGraph() {
  $("graphPage").style.display = "none";
}

function renderGraph() {
  const ctx = $("graph");
  if (chartInstance) chartInstance.destroy();

  const selected = $("examFilter").value;
  const data = selected === "ALL" ? tests : tests.filter(t => t.exam === selected);

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(t => `${t.exam} ${formatDate(t.date)}`),
      datasets: [{
        label: "Marks",
        data: data.map(t => t.total),
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: { min: 10, max: 300, ticks: { stepSize: 10 } }
      }
    }
  });
}

/* ================= EXPORT PDF ================= */
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 15;

  const grouped = {};
  tests.forEach(t => {
    grouped[t.exam] = grouped[t.exam] || [];
    grouped[t.exam].push(t);
  });

  Object.keys(grouped).forEach(exam => {
    doc.text(exam, 14, y); y += 6;
    grouped[exam].forEach(t => {
      doc.text(`• ${t.test} | ${t.total}`, 16, y);
      y += 5;
    });
    y += 8;
  });

  doc.save("mock-analysis.pdf");
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
    const data = grouped[exam].map(t => ({
      Test: t.test,
      Date: t.date,
      Platform: t.platform,
      Total: t.total,
      Target: t.target
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, exam);
  });

  XLSX.writeFile(wb, "mock-analysis.xlsx");
}

/* ================= DATE ================= */
function formatDate(d) {
  if (!d) return "";
  const [y,m,day] = d.split("-");
  return `${day}-${m}-${y}`;
}
