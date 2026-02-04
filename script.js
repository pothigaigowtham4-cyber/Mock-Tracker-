/* ---------------- GLOBAL DATA ---------------- */
let tests = JSON.parse(localStorage.getItem("tests")) || [];
let examDates = JSON.parse(localStorage.getItem("examDates")) || {};
let editIndex = null;

const quotes = [
  "Discipline beats motivation.",
  "One test closer to success.",
  "Consistency creates rank.",
  "Mocks today, merit tomorrow."
];

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  quoteText.textContent = quotes[Math.floor(Math.random() * quotes.length)];
  initSections();
  buildFilter();
  renderTables();
  renderExamDates();
});

/* ---------------- SECTIONS ---------------- */
function initSections() {
  sections.innerHTML = "";
  for (let i = 0; i < 4; i++) addSection();
}

function addSection() {
  const row = document.createElement("div");
  row.className = "sectionRow";
  row.innerHTML = `
    <input placeholder="Section">
    <input type="number" value="0">
    <input type="number" value="0">
    <input type="number" value="0">
    <input type="number" value="0">
    <button onclick="this.parentElement.remove()">🗑</button>
  `;
  sections.appendChild(row);
}

/* ---------------- SAVE TEST ---------------- */
function saveTest() {
  const sectionRows = document.querySelectorAll(".sectionRow");
  const sectionData = [];

  sectionRows.forEach(r => {
    const i = r.querySelectorAll("input");
    sectionData.push({
      name: i[0].value,
      marks: +i[1].value,
      c: +i[2].value,
      w: +i[3].value,
      u: +i[4].value
    });
  });

  const test = {
    exam: examName.value,
    test: testName.value,
    date: testDate.value,
    platform: platformName.value,
    negative: negativeMark.value,
    target: targetInput.value,
    sections: sectionData
  };

  if (editIndex !== null) {
    tests[editIndex] = test;
    editIndex = null;
  } else {
    tests.push(test);
  }

  localStorage.setItem("tests", JSON.stringify(tests));
  renderTables();
}

/* ---------------- FILTER ---------------- */
function buildFilter() {
  examFilter.innerHTML = "<option value=''>Select Exam</option>";
  [...new Set(tests.map(t => t.exam))].forEach(e => {
    const o = document.createElement("option");
    o.value = o.textContent = e;
    examFilter.appendChild(o);
  });
}

/* ---------------- TABLES ---------------- */
function renderTables() {
  tablesArea.innerHTML = "";
  buildFilter();

  const grouped = {};
  tests.forEach(t => {
    if (!grouped[t.exam]) grouped[t.exam] = [];
    grouped[t.exam].push(t);
  });

  Object.keys(grouped).forEach(exam => {
    const table = document.createElement("table");
    table.innerHTML = `
      <caption>${exam}</caption>
      <tr>
        <th>Test</th><th>Date</th><th>Marks</th><th>Target</th><th>Action</th>
      </tr>
    `;

    grouped[exam].forEach((t, i) => {
      const total = t.sections.reduce((s, x) => s + x.marks, 0);
      table.innerHTML += `
        <tr>
          <td>${t.test}</td>
          <td>${t.date}</td>
          <td>${total}</td>
          <td>${t.target}</td>
          <td>
            <button onclick="editIndex=${i}">✏</button>
            <button onclick="tests.splice(${i},1);localStorage.setItem('tests',JSON.stringify(tests));renderTables()">🗑</button>
          </td>
        </tr>
      `;
    });

    tablesArea.appendChild(table);
  });
}

/* ---------------- EXAM DATE COUNTER ---------------- */
function saveExamDate() {
  if (!examCounterName.value || !examCounterDate.value) return;
  examDates[examCounterName.value] = examCounterDate.value;
  localStorage.setItem("examDates", JSON.stringify(examDates));
  examCounterName.value = "";
  examCounterDate.value = "";
  renderExamDates();
}

function renderExamDates() {
  examCounterList.innerHTML = "";
  const today = new Date();

  Object.keys(examDates).forEach(exam => {
    const d = new Date(examDates[exam]);
    const days = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    const div = document.createElement("div");
    div.textContent = `${exam} : ${days >= 0 ? days + " days left" : "Expired"}`;
    examCounterList.appendChild(div);
  });
}
