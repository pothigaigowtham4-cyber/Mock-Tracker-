/* =========================
   STORAGE
========================= */
let tests = JSON.parse(localStorage.getItem("tests")) || [];
let examDates = JSON.parse(localStorage.getItem("examDates")) || [];
let editingId = null;

/* =========================
   QUOTES (UNCHANGED COUNT)
========================= */
const quotes = [
  "Discipline beats motivation.",
  "Small progress is still progress.",
  "Consistency creates confidence.",
  "Today’s effort is tomorrow’s rank.",
  "One mock closer to selection.",
  "Focus beats talent when talent sleeps.",
  "Your future self is watching.",
  "Every test is feedback.",
  "Pressure makes diamonds.",
  "No excuses. Just results."
];

/* =========================
   UTILITIES
========================= */
const qs = id => document.getElementById(id);

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

function daysLeft(date) {
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* =========================
   DARK MODE
========================= */
qs("darkModeBtn").onclick = () => {
  document.body.classList.toggle("dark");
};

/* =========================
   RANDOM TYPEWRITER QUOTE
========================= */
(function typeQuote() {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  const el = qs("quoteText");
  el.style.fontWeight = "600";
  let i = 0;
  el.textContent = "";
  const timer = setInterval(() => {
    el.textContent += q[i++];
    if (i === q.length) clearInterval(timer);
  }, 50);
})();

/* =========================
   EXAM DATE COUNTER
========================= */
function addExamDate() {
  const name = qs("examCounterName").value.trim();
  const date = qs("examCounterDate").value;
  if (!name || !date) return;

  examDates.push({ name, date });
  localStorage.setItem("examDates", JSON.stringify(examDates));

  qs("examCounterName").value = "";
  qs("examCounterDate").value = "";
  renderExamDates();
}

function renderExamDates() {
  const box = qs("examDateList");
  box.innerHTML = "";
  examDates.forEach((e, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${e.name}</strong> : ${daysLeft(e.date)} days
      <button onclick="removeExamDate(${i})">❌</button>
    `;
    box.appendChild(div);
  });
}

function removeExamDate(i) {
  examDates.splice(i, 1);
  localStorage.setItem("examDates", JSON.stringify(examDates));
  renderExamDates();
}

/* =========================
   SECTIONS
========================= */
function addSection() {
  const wrap = qs("sections");
  const row = document.createElement("div");
  row.className = "sectionRow";
  row.innerHTML = `
    <input placeholder="Section">
    <input type="number" placeholder="Correct">
    <input type="number" placeholder="Wrong">
    <input type="number" placeholder="Unattempted">
    <input type="number" placeholder="Marks">
    <button onclick="this.parentElement.remove()">❌</button>
  `;
  wrap.appendChild(row);
}

/* =========================
   SAVE / UPDATE TEST
========================= */
function saveTest() {
  const sections = {};
  document.querySelectorAll(".sectionRow").forEach(r => {
    const [name, c, w, u, m] = r.querySelectorAll("input");
    sections[name.value] = {
      correct: +c.value || 0,
      wrong: +w.value || 0,
      unattempted: +u.value || 0,
      marks: +m.value || 0
    };
  });

  const test = {
    id: editingId || Date.now(),
    exam: qs("examName").value,
    test: qs("testName").value,
    date: qs("testDate").value,
    platform: qs("platformName").value,
    target: +qs("targetInput").value || 0,
    sections
  };

  if (editingId) {
    tests = tests.map(t => t.id === editingId ? test : t);
    editingId = null;
  } else {
    tests.push(test);
  }

  localStorage.setItem("tests", JSON.stringify(tests));
  location.reload();
}

/* =========================
   TABLE RENDER
========================= */
function renderTables() {
  const area = qs("tablesArea");
  area.innerHTML = "";

  const byExam = {};
  tests.forEach(t => {
    if (!byExam[t.exam]) byExam[t.exam] = [];
    byExam[t.exam].push(t);
  });

  Object.keys(byExam).forEach(exam => {
    const list = byExam[exam];
    const avg = (
      list.reduce((s, t) =>
        s + Object.values(t.sections).reduce((a, b) => a + b.marks, 0), 0
      ) / list.length
    ).toFixed(1);

    const h = document.createElement("h3");
    h.textContent = `${exam} | Avg: ${avg}`;
    area.appendChild(h);

    const table = document.createElement("table");
    table.innerHTML = `
      <tr>
        <th>Test</th><th>Date</th><th>Platform</th>
        <th>Total</th><th>Edit</th><th>Delete</th>
      </tr>
    `;

    list.forEach((t, i) => {
      const total = Object.values(t.sections).reduce((a, b) => a + b.marks, 0);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${formatDate(t.date)}</td>
        <td>${t.platform}</td>
        <td>${total}</td>
        <td><button onclick="editTest(${t.id})">✏️</button></td>
        <td><button onclick="deleteTest(${t.id})">🗑</button></td>
      `;
      row.onclick = () => toggleDetails(row, t);
      table.appendChild(row);
    });

    area.appendChild(table);
  });
}

/* =========================
   DETAILS TOGGLE
========================= */
function toggleDetails(row, test) {
  if (row.nextSibling && row.nextSibling.classList?.contains("details")) {
    row.nextSibling.remove();
    return;
  }

  const d = document.createElement("tr");
  d.className = "details";
  let html = `<td colspan="6">`;
  Object.keys(test.sections).forEach(s => {
    const x = test.sections[s];
    html += `
      <b>${s}</b> →
      C:${x.correct}, W:${x.wrong}, U:${x.unattempted}, M:${x.marks}<br>
    `;
  });
  html += `</td>`;
  d.innerHTML = html;
  row.after(d);
}

/* =========================
   EDIT / DELETE
========================= */
function editTest(id) {
  const t = tests.find(x => x.id === id);
  editingId = id;

  qs("examName").value = t.exam;
  qs("testName").value = t.test;
  qs("testDate").value = t.date;
  qs("platformName").value = t.platform;
  qs("sections").innerHTML = "";

  Object.keys(t.sections).forEach(s => {
    addSection();
    const r = qs("sections").lastElementChild;
    const i = r.querySelectorAll("input");
    i[0].value = s;
    i[1].value = t.sections[s].correct;
    i[2].value = t.sections[s].wrong;
    i[3].value = t.sections[s].unattempted;
    i[4].value = t.sections[s].marks;
  });
}

function deleteTest(id) {
  if (!confirm("Delete test?")) return;
  tests = tests.filter(t => t.id !== id);
  localStorage.setItem("tests", JSON.stringify(tests));
  location.reload();
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  renderTables();
  renderExamDates();
});
