/* ================= STORAGE ================= */
let tests = [];
try {
  tests = JSON.parse(localStorage.getItem("tests")) || [];
} catch {
  tests = [];
}

let sections = [];

/* ================= SAVE ================= */
function save() {
  localStorage.setItem("tests", JSON.stringify(tests));
}

/* ================= QUOTES ================= */
const quotes = [
  "While you are resting, someone else is working to take your spot.",
  "Discipline beats motivation every single time.",
  "You don't need more time, you need more focus.",
  "Consistency today creates confidence tomorrow.",
  "Average today is the enemy of success tomorrow.",
  "The pain of study is temporary, regret lasts forever.",
  "Small progress every day adds up to big results."
];

let quoteIndex = 0;

function rotateQuote() {
  const el =
    document.getElementById("quoteBox") ||
    document.getElementById("quoteText");

  if (!el) return;

  el.innerText = quotes[quoteIndex];
  quoteIndex = (quoteIndex + 1) % quotes.length;
}

setInterval(rotateQuote, 6000);
rotateQuote();

/* ================= SECTION ================= */
function addSection() {
  sections.push({
    name: "",
    marks: 0,
    correct: 0,
    wrong: 0,
    unattempted: 0
  });
  renderSections();
}

function renderSections() {
  const box = document.getElementById("sections");
  box.innerHTML = "";

  sections.forEach((s, i) => {
    box.innerHTML += `
      <div class="sectionBox">
        <input placeholder="Section Name"
               oninput="sections[${i}].name=this.value">
        <input type="number" placeholder="Marks"
               oninput="sections[${i}].marks=+this.value">
        <input type="number" placeholder="Correct"
               oninput="sections[${i}].correct=+this.value">
        <input type="number" placeholder="Wrong"
               oninput="sections[${i}].wrong=+this.value">
        <input type="number" placeholder="Unattempted"
               oninput="sections[${i}].unattempted=+this.value">
      </div>
    `;
  });
}

/* ================= ADD TEST ================= */
function addTest() {
  const test = {
    exam: examName.value.trim(),
    target: +targetMarks.value || 0,
    name: testName.value.trim(),
    date: testDate.value,
    platform: platform.value.trim(),
    negative: +negative.value || 0,
    sections: JSON.parse(JSON.stringify(sections))
  };

  if (!test.exam || !test.name || !test.date) {
    alert("Exam name, test name and date are required");
    return;
  }

  tests.push(test);
  sections = [];
  renderSections();
  save();
  renderAll();
}

/* ================= FILTER ================= */
function renderFilter() {
  const f = document.getElementById("examFilter");
  const exams = [...new Set(tests.map(t => t.exam))];

  f.innerHTML = "<option value=''>All Exams</option>";
  exams.forEach(e => {
    f.innerHTML += `<option value="${e}">${e}</option>`;
  });
}

document.getElementById("examFilter").addEventListener("change", () => {
  renderTable();
  updateCountdown();
});

/* ================= TABLE ================= */
function renderTable() {
  const tbl = document.getElementById("table");
  const filter = examFilter.value;

  const rows = tests.filter(t => !filter || t.exam === filter);
  if (!rows.length) {
    tbl.innerHTML = "";
    return;
  }

  const totals = rows.map(t => totalMarks(t));
  const max = Math.max(...totals);
  const min = Math.min(...totals);

  tbl.innerHTML = `
    <tr>
      <th>Exam</th>
      <th>Test</th>
      <th>Date</th>
      <th>Total</th>
      <th>Average</th>
    </tr>
  `;

  rows.forEach(t => {
    const tot = totalMarks(t);
    const avg = (tot / t.sections.length || 0).toFixed(1);
    const cls = tot === max ? "best" : tot === min ? "worst" : "";

    tbl.innerHTML += `
      <tr class="${cls}">
        <td>${t.exam}</td>
        <td>${t.name}</td>
        <td>${formatDate(t.date)}</td>
        <td>${tot}</td>
        <td>${avg}</td>
      </tr>
    `;
  });
}

/* ================= HELPERS ================= */
function totalMarks(t) {
  return t.sections.reduce((a, s) => a + (+s.marks || 0), 0);
}

function formatDate(d) {
  if (!d) return "";
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, "0")}-${String(
    x.getMonth() + 1
  ).padStart(2, "0")}-${x.getFullYear()}`;
}

/* ================= COUNTDOWN ================= */
function updateCountdown() {
  const exam = examFilter.value;
  const t = tests.find(x => x.exam === exam && x.date);

  const el = document.getElementById("countdown");
  if (!t) {
    el.innerText = "Select an exam";
    return;
  }

  const days = Math.ceil((new Date(t.date) - new Date()) / 86400000);
  el.innerText = days > 0 ? `${days} days remaining` : "Exam passed";
}

/* ================= RENDER ================= */
function renderAll() {
  renderFilter();
  renderTable();
  updateCountdown();
}

renderAll();
