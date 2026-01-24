let tests = JSON.parse(localStorage.getItem("tests")) || [];
let editIndex = null;

initializeForm();
renderAll();

/* ---------------- FORM INIT ---------------- */
function initializeForm() {
  const sec = document.getElementById("sections");
  sec.innerHTML = "";
  addSection();
  addSection();
  addSection();
}

/* ---------------- ADD SECTION ---------------- */
function addSection(name = "", marks = 0) {
  const div = document.createElement("div");
  div.className = "sectionRow";
  div.innerHTML = `
    <input placeholder="Section Name" value="${name}">
    <input type="number" placeholder="Marks" value="${marks || 0}">
  `;
  document.getElementById("sections").appendChild(div);
}

/* ---------------- SAVE TEST ---------------- */
function saveTest() {

  const exam = document.getElementById("examName").value.trim();
  const test = document.getElementById("testName").value.trim();
  const date = document.getElementById("testDate").value;

  if (!exam || !test || !date) {
    alert("Please fill Exam, Test Name and Date");
    return;
  }

  const sectionRows = document.querySelectorAll(".sectionRow");
  if (sectionRows.length === 0) {
    alert("Add at least one section");
    return;
  }

  let total = 0;
  const sections = [];

  sectionRows.forEach(r => {
    const name = r.children[0].value.trim() || "Section";
    const marks = Number(r.children[1].value) || 0;
    total += marks;
    sections.push({ name, marks });
  });

  const obj = { exam, test, date, total, sections };

  if (editIndex === null) tests.push(obj);
  else tests[editIndex] = obj;

  localStorage.setItem("tests", JSON.stringify(tests));

  editIndex = null;
  initializeForm();
  renderAll();
}

/* ---------------- DROPDOWN ---------------- */
function renderExamDropdown() {
  const select = document.getElementById("examFilter");
  const exams = [...new Set(tests.map(t => t.exam))];

  select.innerHTML = `<option value="ALL">All Exams</option>`;
  exams.forEach(e => {
    const o = document.createElement("option");
    o.value = e;
    o.textContent = e;
    select.appendChild(o);
  });
}

/* ---------------- FILTER ---------------- */
function filterExam() {
  renderTables();
}

/* ---------------- MAIN RENDER ---------------- */
function renderAll() {
  renderExamDropdown();
  renderTables();
}

/* ---------------- TABLE RENDER ---------------- */
function renderTables() {

  const area = document.getElementById("tablesArea");
  area.innerHTML = "";

  tests.sort((a, b) => new Date(a.date) - new Date(b.date));

  const filter = document.getElementById("examFilter").value;

  const grouped = {};
  tests.forEach(t => {
    if (!grouped[t.exam]) grouped[t.exam] = [];
    grouped[t.exam].push(t);
  });

  for (const exam in grouped) {

    if (filter !== "ALL" && filter !== exam) continue;

    const examTests = grouped[exam];

    const best = Math.max(...examTests.map(t => t.total));
    const worst = Math.min(...examTests.map(t => t.total));
    const avg = examTests.reduce((a, t) => a + t.total, 0) / examTests.length;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${exam} Tests (Avg: ${avg.toFixed(1)})</h2>
      <div class="tableWrapper">
        <table>
          <thead></thead>
          <tbody></tbody>
        </table>
      </div>
      <p><span style="color:#2e7d32;font-weight:bold;">Green</span> = Best Score,
         <span style="color:#c62828;font-weight:bold;">Red</span> = Worst Score</p>
    `;

    area.appendChild(card);

    const sectionSet = new Set();
    examTests.forEach(t => t.sections.forEach(s => sectionSet.add(s.name)));
    const sectionNames = Array.from(sectionSet);

    const thead = card.querySelector("thead");
    let h = `<tr>
      <th>Sr</th><th>Date</th><th>Test</th><th>Total</th>`;
    sectionNames.forEach(s => h += `<th>${s}</th>`);
    h += `<th>Actions</th></tr>`;
    thead.innerHTML = h;

    const tbody = card.querySelector("tbody");

    examTests.forEach((t, i) => {

      const d = new Date(t.date);
      const fd = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth()+1).padStart(2, "0")}-${d.getFullYear()}`;

      let cls = "";
      if (t.total === best) cls = "bestScore";
      if (t.total === worst) cls = "worstScore";

      let r = `<tr class="${cls}">
        <td>${i + 1}</td>
        <td>${fd}</td>
        <td>${t.test}</td>
        <td>${t.total}</td>`;

      sectionNames.forEach(s => {
        const sec = t.sections.find(x => x.name === s);
        r += `<td>${sec ? sec.marks : "-"}</td>`;
      });

      r += `<td>
        <button onclick="editTest('${exam}', ${i})">✏</button>
        <button onclick="deleteTest('${exam}', ${i})">🗑</button>
      </td></tr>`;

      tbody.innerHTML += r;
    });
  }
}

/* ---------------- EDIT ---------------- */
function editTest(exam, index) {
  const examTests = tests.filter(t => t.exam === exam);
  const test = examTests[index];
  editIndex = tests.indexOf(test);

  document.getElementById("examName").value = test.exam;
  document.getElementById("testName").value = test.test;
  document.getElementById("testDate").value = test.date;

  const sec = document.getElementById("sections");
  sec.innerHTML = "";
  test.sections.forEach(s => addSection(s.name, s.marks));
}

/* ---------------- DELETE ---------------- */
function deleteTest(exam, index) {

  if (!confirm("Delete this test?")) return;

  const examTests = tests.filter(t => t.exam === exam);
  const test = examTests[index];
  const realIndex = tests.indexOf(test);

  tests.splice(realIndex, 1);
  localStorage.setItem("tests", JSON.stringify(tests));
  renderAll();
}

/* ---------------- GRAPH ---------------- */
function showGraph() {
  document.querySelector(".container").style.display = "none";
  document.getElementById("tablesArea").style.display = "none";
  document.getElementById("graphPage").style.display = "block";
  drawGraph();
}

function hideGraph() {
  document.querySelector(".container").style.display = "block";
  document.getElementById("tablesArea").style.display = "block";
  document.getElementById("graphPage").style.display = "none";
}

function drawGraph() {

  const ctx = document.getElementById("graph");

  const sorted = [...tests].sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = sorted.map(t => `${t.exam} - ${t.test}`);
  const data = sorted.map(t => t.total);

  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Total Marks",
        data,
        borderColor: "#1e88e5",
        backgroundColor: "rgba(30,136,229,0.2)",
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}
