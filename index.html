// ---------------- GLOBAL ----------------
let tests = JSON.parse(localStorage.getItem("tests")) || [];
let editIndex = null;

renderAll();
initializeForm();

// ---------------- INIT FORM ----------------
function initializeForm() {
  const sectionsDiv = document.getElementById("sections");
  if (!sectionsDiv) return;
  sectionsDiv.innerHTML = "";
  addSection();
  addSection();
  addSection();
}

// ---------------- ADD SECTION ----------------
function addSection(name = "", marks = 0) {
  const div = document.createElement("div");
  div.className = "sectionRow";
  div.innerHTML = `
    <input placeholder="Section Name" value="${name}">
    <input type="number" placeholder="Marks" value="${marks || 0}">
  `;
  document.getElementById("sections").appendChild(div);
}

// ---------------- SAVE TEST ----------------
function saveTest() {
  const exam = document.getElementById("examName").value.trim();
  const test = document.getElementById("testName").value.trim();
  const date = document.getElementById("testDate").value;

  if (!exam || !test || !date) {
    alert("Fill Exam, Test Name and Date");
    return;
  }

  const sectionDivs = document.querySelectorAll("#sections .sectionRow");
  if (sectionDivs.length === 0) {
    alert("Add at least one section");
    return;
  }

  let total = 0;
  const sections = [];

  sectionDivs.forEach(d => {
    const name = d.children[0].value.trim() || "Section";
    const marks = Number(d.children[1].value) || 0;
    total += marks;
    sections.push({ name, marks });
  });

  const data = { exam, test, date, total, sections };

  if (editIndex === null) tests.push(data);
  else tests[editIndex] = data;

  localStorage.setItem("tests", JSON.stringify(tests));
  editIndex = null;

  renderAll();
  initializeForm();
}

// ---------------- MAIN RENDER ----------------
function renderAll() {
  renderExamDropdown();
  renderTables();
}

// ---------------- DROPDOWN ----------------
function renderExamDropdown() {
  const select = document.getElementById("examFilter");
  if (!select) return;

  const exams = [...new Set(tests.map(t => t.exam))];

  select.innerHTML = `<option value="ALL">All Exams</option>`;
  exams.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e;
    opt.textContent = e;
    select.appendChild(opt);
  });
}

// ---------------- FILTER ----------------
function filterExam() {
  renderTables();
}

// ---------------- TABLE RENDER ----------------
function renderTables() {
  const area = document.getElementById("tablesArea");
  if (!area) return;

  area.innerHTML = "";

  // sort by date
  tests.sort((a, b) => new Date(a.date) - new Date(b.date));

  const filter = document.getElementById("examFilter")?.value || "ALL";

  const grouped = {};
  tests.forEach(t => {
    if (!grouped[t.exam]) grouped[t.exam] = [];
    grouped[t.exam].push(t);
  });

  for (const exam in grouped) {

    if (filter !== "ALL" && filter !== exam) continue;

    const examTests = grouped[exam];

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${exam} Tests</h2>
      <div class="tableWrapper">
        <table>
          <thead></thead>
          <tbody></tbody>
        </table>
      </div>
    `;

    area.appendChild(card);

    const sectionSet = new Set();
    examTests.forEach(t => t.sections.forEach(s => sectionSet.add(s.name)));
    const sectionNames = Array.from(sectionSet);

    const thead = card.querySelector("thead");
    let h = `<tr>
      <th>Sr</th>
      <th>Date</th>
      <th>Test</th>
      <th>Total</th>
      <th>Avg</th>`;
    sectionNames.forEach(n => h += `<th>${n}</th>`);
    h += `<th>Actions</th></tr>`;
    thead.innerHTML = h;

    const avg =
      examTests.reduce((a, t) => a + t.total, 0) / examTests.length;

    const tbody = card.querySelector("tbody");

    examTests.forEach((t, i) => {
      const d = new Date(t.date);
      const fd = `${String(d.getDate()).padStart(2, "0")}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}-${d.getFullYear()}`;

      let r = `<tr>
        <td>${i + 1}</td>
        <td>${fd}</td>
        <td>${t.test}</td>
        <td>${t.total}</td>
        <td>${avg.toFixed(1)}</td>`;

      sectionNames.forEach(s => {
        const sec = t.sections.find(x => x.name === s);
        r += `<td>${sec ? sec.marks : "-"}</td>`;
      });

      r += `<td>
        <button onclick="editTestByExam('${exam}', ${i})">✏</button>
        <button onclick="deleteTestByExam('${exam}', ${i})">🗑</button>
      </td></tr>`;

      tbody.innerHTML += r;
    });
  }
}

// ---------------- EDIT ----------------
function editTestByExam(examName, index) {
  const examTests = tests.filter(t => t.exam === examName);
  const test = examTests[index];
  editIndex = tests.indexOf(test);

  document.getElementById("examName").value = test.exam;
  document.getElementById("testName").value = test.test;
  document.getElementById("testDate").value = test.date;

  const secDiv = document.getElementById("sections");
  secDiv.innerHTML = "";
  test.sections.forEach(s => addSection(s.name, s.marks));
}

// ---------------- DELETE ----------------
function deleteTestByExam(examName, index) {
  const examTests = tests.filter(t => t.exam === examName);
  const test = examTests[index];
  const realIndex = tests.indexOf(test);

  if (!confirm("Delete this test?")) return;

  tests.splice(realIndex, 1);
  localStorage.setItem("tests", JSON.stringify(tests));
  renderAll();
}

// ---------------- GRAPH ----------------
function showGraph() {
  document.querySelector(".container").style.display = "none";
  document.getElementById("graphPage").style.display = "block";
  drawGraph();
}

function hideGraph() {
  document.querySelector(".container").style.display = "grid";
  document.getElementById("graphPage").style.display = "none";
}

function drawGraph() {
  const ctx = document.getElementById("graph");

  const sorted = [...tests].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(t => `${t.date} (${t.exam})`);
  const data = sorted.map(t => t.total);

  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Total Marks",
        data,
        borderColor: "#1976d2",
        backgroundColor: "rgba(25,118,210,0.2)",
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}
