/* ---------- QUOTES (RANDOM + TYPEWRITER) ---------- */

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
let charIndex = 0;

function typeQuote() {
  if (charIndex === 0) quoteText.textContent = "";

  if (charIndex < quotes[quoteIndex].length) {
    quoteText.textContent += quotes[quoteIndex][charIndex];
    charIndex++;
    setTimeout(typeQuote, 70);
  } else {
    setTimeout(() => {
      charIndex = 0;
      quoteIndex = (quoteIndex + 1) % quotes.length;
      typeQuote();
    }, 10000);
  }
}

/* ---------- GLOBAL ---------- */

let tests = JSON.parse(localStorage.getItem("tests")) || [];
let targets = JSON.parse(localStorage.getItem("targets")) || {};
let examDates = JSON.parse(localStorage.getItem("examDates")) || {};
let editIndex = null;

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  typeQuote();
  initSections();
  buildFilter();
  renderTables();
  renderExamDates();
});

/* ---------- SECTIONS ---------- */

function initSections() {
  sections.innerHTML = `
    <div class="sectionLabels">
      <span>Section</span>
      <span>Marks</span>
      <span>C</span>
      <span>W</span>
      <span>U</span>
      <span></span>
    </div>`;
  for (let i = 0; i < 4; i++) addSection();
}

function addSection(data = {}) {
  sections.innerHTML += `
    <div class="sectionRow">
      <input class="sectionName" value="${data.name || ""}">
      <input class="sectionMarks" type="number" value="${data.marks || ""}">
      <input type="number">
      <input type="number">
      <input type="number">
      <button onclick="this.parentElement.remove()">🗑</button>
    </div>`;
}

/* ---------- SAVE TEST ---------- */

function saveTest() {
  if (!examName.value || !testName.value || !testDate.value)
    return alert("Fill all fields");

  const secs = [];
  let total = 0, tc = 0, tw = 0;

  document.querySelectorAll(".sectionRow").forEach(r => {
    const marks = +r.children[1].value || 0;
    total += marks;
    tc += +r.children[2].value || 0;
    tw += +r.children[3].value || 0;

    secs.push({
      name: r.children[0].value,
      marks
    });
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

  editIndex === null ? tests.push(t) : tests[editIndex] = t;
  editIndex = null;

  localStorage.setItem("tests", JSON.stringify(tests));
  localStorage.setItem("targets", JSON.stringify(targets));

  initSections();
  buildFilter();
  renderTables();
}

/* ---------- EDIT TEST ---------- */

function editTest(index) {
  const t = tests[index];
  editIndex = index;

  examName.value = t.exam;
  testName.value = t.test;
  testDate.value = t.date;
  platformName.value = t.platform;
  negativeMark.value = t.neg;

  sections.innerHTML = `
    <div class="sectionLabels">
      <span>Section</span>
      <span>Marks</span>
      <span>C</span>
      <span>W</span>
      <span>U</span>
      <span></span>
    </div>`;

  t.sections.forEach(s => addSection(s));
}

/* ---------- FILTER ---------- */

function buildFilter() {
  examFilter.innerHTML = `<option value="ALL">All Exams</option>`;
  [...new Set(tests.map(t => t.exam))].forEach(e => {
    examFilter.innerHTML += `<option value="${e}">${e}</option>`;
  });
  examFilter.onchange = renderTables;
}

/* ---------- TABLES ---------- */

function formatDate(d) {
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
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
    const avg = (arr.reduce((s, t) => s + t.total, 0) / arr.length).toFixed(1);
    const max = Math.max(...arr.map(t => t.total));
    const min = Math.min(...arr.map(t => t.total));

    let html = `
      <div class="examTableWrapper">
        <h3>${exam} | Average: ${avg}</h3>
        <table>
          <tr>
            <th>Test</th>
            <th>Date</th>
            <th>Platform</th>
            <th>Total</th>
            <th>Accuracy</th>
            ${arr[0].sections.map(s => `<th>${s.name}</th>`).join("")}
            <th>Edit</th>
          </tr>`;

    arr.forEach(t => {
      const cls = t.total === max ? "best" : t.total === min ? "worst" : "";
      html += `
        <tr class="${cls}">
          <td>${t.test}</td>
          <td>${formatDate(t.date)}</td>
          <td>${t.platform}</td>
          <td>${t.total}</td>
          <td>${t.accuracy}</td>
          ${t.sections.map(s => `<td>${s.marks}</td>`).join("")}
          <td><button onclick="editTest(${t._i})">✏ Edit</button></td>
        </tr>`;
    });

    html += `</table></div>`;
    tablesArea.innerHTML += html;
  });
}

/* ---------- EXAM DATE COUNTER ---------- */

function addExamDate() {
  if (!examCounterName.value || !examCounterDate.value) return;
  examDates[examCounterName.value] = examCounterDate.value;
  localStorage.setItem("examDates", JSON.stringify(examDates));
  renderExamDates();
}

function renderExamDates() {
  examCountdownList.innerHTML = "";
  const today = new Date();

  Object.entries(examDates).forEach(([exam, date]) => {
    const days = Math.ceil((new Date(date) - today) / 86400000);
    examCountdownList.innerHTML += `<div>${exam}: ${days} days</div>`;
  });
}

/* ---------- GRAPH ---------- */

function showGraph() {
  if (examFilter.value === "ALL") return alert("Select an exam");

  graphPage.style.display = "block";
  tablesArea.style.display = "none";

  const data = tests.filter(t => t.exam === examFilter.value);
  if (window.g) g.destroy();

  g = new Chart(graph, {
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

/* ---------- EXPORT ---------- */

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
