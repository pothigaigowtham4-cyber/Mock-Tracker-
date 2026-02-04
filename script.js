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

/* ---------------- DATE FORMAT ---------------- */

function formatDate(d) {
  if (!d) return "";
  const [y, m, da] = d.split("-");
  return `${da}-${m}-${y}`;
}

/* ---------------- EXAM DATE COUNTER ---------------- */

function getRemainingDays(date) {
  const today = new Date();
  const exam = new Date(date);
  return Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
}

/* ---------------- TABLES ---------------- */

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

    const sectionNames = Object.keys(arr[0].sectionsData || {});

    const avg =
      (arr.reduce((s, t) => s + t.total, 0) / arr.length).toFixed(1);

    let html = `
      <div class="examTableWrapper">
        <h3>
          ${exam} | Avg: ${avg}
          ${examDates[exam] ? ` | ${getRemainingDays(examDates[exam])} days left` : ""}
        </h3>
        <table>
          <tr>
            <th>Test</th><th>Date</th><th>Platform</th>
            <th>Total</th><th>Accuracy</th>
            ${sectionNames.map(s => `<th>${s}</th>`).join("")}
            <th>Edit</th><th>Delete</th>
          </tr>`;

    arr.forEach(t => {
      html += `
        <tr onclick="toggleStats(${t._i})">
          <td>${t.test}</td>
          <td>${formatDate(t.date)}</td>
          <td>${t.platform}</td>
          <td>${t.total}</td>
          <td>${t.accuracy}</td>
          ${sectionNames.map(
            s => `<td>${t.sectionsData?.[s]?.marks ?? 0}</td>`
          ).join("")}
          <td><button onclick="event.stopPropagation();editTest(${t._i})">✏</button></td>
          <td><button onclick="event.stopPropagation();deleteTest(${t._i})">🗑</button></td>
        </tr>`;

      if (openStatsIndex === t._i) {
        html += `
          <tr class="statsRow">
            <td colspan="${7 + sectionNames.length}">
              ${sectionNames.map(s => {
                const d = t.sectionsData[s] || {};
                return `<b>${s}</b> → C:${d.c || 0}, W:${d.w || 0}, U:${d.u || 0}`;
              }).join(" | ")}
            </td>
          </tr>`;
      }
    });

    html += `</table></div>`;
    tablesArea.innerHTML += html;
  });
}

/* ---------------- EDIT / DELETE ---------------- */

function editTest(i) {
  const t = tests[i];
  editIndex = i;

  examName.value = t.exam;
  testName.value = t.test;
  testDate.value = t.date;
  platformName.value = t.platform;

  initSections();
  Object.keys(t.sectionsData || {}).forEach(k =>
    addSection({ name: k, ...t.sectionsData[k] })
  );
}

function deleteTest(i) {
  if (!confirm("Delete test?")) return;
  tests.splice(i, 1);
  localStorage.setItem("tests", JSON.stringify(tests));
  openStatsIndex = null;
  buildFilter();
  renderTables();
}
