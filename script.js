/* ---------------- QUOTES ---------------- */

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

let qi = Math.floor(Math.random() * quotes.length);
let ci = 0;

function typeQuote() {
  if (ci === 0) quoteText.textContent = "";
  if (ci < quotes[qi].length) {
    quoteText.textContent += quotes[qi][ci++];
    setTimeout(typeQuote, 70);
  } else {
    setTimeout(() => {
      ci = 0;
      qi = (qi + 1) % quotes.length;
      typeQuote();
    }, 10000);
  }
}

/* ---------------- STORAGE ---------------- */

let tests = JSON.parse(localStorage.getItem("tests")) || [];
let targets = JSON.parse(localStorage.getItem("targets")) || {};
let examDates = JSON.parse(localStorage.getItem("examDates")) || {};

let editIndex = null;
let openStatsIndex = null;

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  typeQuote();
  initSections();
  buildFilter();
  renderTables();
});

/* ---------------- SECTIONS ---------------- */

function initSections() {
  sections.innerHTML = `
    <div class="sectionLabels">
      <span>Section</span><span>Marks</span><span>C</span><span>W</span><span>U</span><span></span>
    </div>`;
  for (let i = 0; i < 4; i++) addSection();
}

function addSection(d = {}) {
  sections.innerHTML += `
    <div class="sectionRow">
      <input value="${d.name || ""}">
      <input type="number" value="${d.marks || 0}">
      <input type="number" value="${d.c || 0}">
      <input type="number" value="${d.w || 0}">
      <input type="number" value="${d.u || 0}">
      <button onclick="this.parentElement.remove()">🗑</button>
    </div>`;
}

/* ---------------- SAVE TEST ---------------- */

function saveTest() {
  if (!examName.value || !testName.value || !testDate.value)
    return alert("Fill all fields");

  const sectionsData = {};
  let total = 0, tc = 0, tw = 0;

  document.querySelectorAll(".sectionRow").forEach(r => {
    const name = r.children[0].value.trim();
    if (!name) return;

    const marks = +r.children[1].value || 0;
    const c = +r.children[2].value || 0;
    const w = +r.children[3].value || 0;
    const u = +r.children[4].value || 0;

    sectionsData[name] = { marks, c, w, u };
    total += marks;
    tc += c;
    tw += w;
  });

  const t = {
    exam: examName.value,
    test: testName.value,
    date: testDate.value,
    platform: platformName.value,
    neg: +negativeMark.value || 0,
    total,
    accuracy: tc + tw ? ((tc / (tc + tw)) * 100).toFixed(1) : 0,
    sectionsData
  };

  editIndex === null ? tests.push(t) : tests[editIndex] = t;
  editIndex = null;
  openStatsIndex = null;

  localStorage.setItem("tests", JSON.stringify(tests));
  initSections();
  buildFilter();
  renderTables();
}

/* ---------------- EDIT / DELETE ---------------- */

function editTest(i) {
  const t = tests[i];
  editIndex = i;

  examName.value = t.exam;
  testName.value = t.test;
  testDate.value = t.date;
  platformName.value = t.platform;
  negativeMark.value = t.neg;

  initSections();

  const data = t.sectionsData || {};
  Object.keys(data).forEach(k => addSection({ name: k, ...data[k] }));
}

function deleteTest(i) {
  if (!confirm("Delete test?")) return;
  tests.splice(i, 1);
  localStorage.setItem("tests", JSON.stringify(tests));
  openStatsIndex = null;
  buildFilter();
  renderTables();
}

/* ---------------- FILTER ---------------- */

function buildFilter() {
  examFilter.innerHTML = `<option value="ALL">All Exams</option>`;
  [...new Set(tests.map(t => t.exam))].forEach(e => {
    examFilter.innerHTML += `<option value="${e}">${e}</option>`;
  });
  examFilter.onchange = () => {
    openStatsIndex = null;
    renderTables();
  };
}

/* ---------------- TABLES ---------------- */

function formatDate(d) {
  if (!d) return "";
  const [y, m, da] = d.split("-");
  return `${da}-${m}-${y}`;
}

function toggleStats(i) {
  openStatsIndex = openStatsIndex === i ? null : i;
  renderTables();
}

function renderTables() {
  tablesArea.innerHTML = "";
  const selected = examFilter.value || "ALL";

  const grouped = {};
  tests.forEach((t, i) => {
    if (selected === "ALL" || t.exam === selected) {
      grouped[t.exam] = grouped[t.exam] || [];
      grouped[t.exam].push({ ...t, _i: i });
    }
  });

  Object.keys(grouped).forEach(exam => {
    const arr = grouped[exam];

    const sectionOrder =
      Object.keys(arr[0].sectionsData || {});

    const max = Math.max(...arr.map(t => t.total));
    const min = Math.min(...arr.map(t => t.total));

    let html = `
      <div class="examTableWrapper">
        <h3>${exam}</h3>
        <table>
          <tr>
            <th>Test</th><th>Date</th><th>Platform</th><th>Total</th><th>Accuracy</th>
            ${sectionOrder.map(s => `<th>${s}</th>`).join("")}
            <th>Edit</th><th>Delete</th>
          </tr>`;

    arr.forEach(t => {
      const cls = t.total === max ? "best" : t.total === min ? "worst" : "";
      html += `
        <tr class="${cls}" onclick="toggleStats(${t._i})">
          <td>${t.test}</td>
          <td>${formatDate(t.date)}</td>
          <td>${t.platform}</td>
          <td>${t.total}</td>
          <td>${t.accuracy}</td>
          ${sectionOrder.map(
            s => `<td>${(t.sectionsData || {})[s]?.marks || 0}</td>`
          ).join("")}
          <td><button onclick="event.stopPropagation();editTest(${t._i})">✏</button></td>
          <td><button onclick="event.stopPropagation();deleteTest(${t._i})">🗑</button></td>
        </tr>`;

      if (openStatsIndex === t._i) {
        html += `
          <tr class="statsRow">
            <td colspan="${7 + sectionOrder.length}">
              ${sectionOrder.map(
                s => {
                  const d = (t.sectionsData || {})[s] || {};
                  return `<b>${s}</b> → C:${d.c || 0}, W:${d.w || 0}, U:${d.u || 0}`;
                }
              ).join(" | ")}
            </td>
          </tr>`;
      }
    });

    html += `</table></div>`;
    tablesArea.innerHTML += html;
  });
}

/* ---------------- GRAPH ---------------- */

function showGraph() {
  if (examFilter.value === "ALL") return alert("Select an exam");
  graphPage.style.display = "block";
  tablesArea.style.display = "none";

  const data = tests.filter(t => t.exam === examFilter.value);
  const ctx = graph.getContext("2d");

  if (window.g) window.g.destroy();
  window.g = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(t => t.test),
      datasets: [{ label: "Marks", data: data.map(t => t.total) }]
    }
  });
}

function hideGraph() {
  graphPage.style.display = "none";
  tablesArea.style.display = "block";
}

/* ---------------- EXAM DATE ---------------- */

function addExamDate(name, date) {
  examDates[name] = date;
  localStorage.setItem("examDates", JSON.stringify(examDates));
}

/* ---------------- EXPORT ---------------- */

function exportExcel() {
  const ws = XLSX.utils.json_to_sheet(tests);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tests");
  XLSX.writeFile(wb, "MockTracker.xlsx");
}

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  tests.forEach(t => {
    doc.text(`${t.exam} - ${t.test} : ${t.total}`, 10, y);
    y += 8;
  });
  doc.save("MockTracker.pdf");
}
