let tests = JSON.parse(localStorage.getItem("tests")) || [];
let editIndex = null;

renderTable();

// ------------------- ADD SECTION -------------------
function addSection(name = "", marks = "") {
  const div = document.createElement("div");
  div.className = "sectionRow";
  div.innerHTML = `
    <input placeholder="Section Name" value="${name}">
    <input type="number" placeholder="Marks" value="${marks}">
  `;
  document.getElementById("sections").appendChild(div);
}

// ------------------- SAVE TEST -------------------
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

  const sections = [];
  let total = 0;

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
  clearForm();
  renderTable();
}

// ------------------- RENDER TABLE -------------------
function renderTable() {
  tests.sort((a, b) => new Date(b.date) - new Date(a.date));

  const tbody = document.getElementById("tableBody");
  const thead = document.querySelector("table thead");
  tbody.innerHTML = "";

  // Collect unique section names
  const sectionSet = new Set();
  tests.forEach(t => t.sections.forEach(s => sectionSet.add(s.name)));
  const sectionNames = Array.from(sectionSet);

  // Table headers
  let headerHTML = `<tr>
      <th>Date</th>
      <th>Exam</th>
      <th>Test</th>
      <th>Total</th>
      <th>Avg</th>`;
  sectionNames.forEach(name => headerHTML += `<th>${name}</th>`);
  headerHTML += `<th>Actions</th></tr>`;
  thead.innerHTML = headerHTML;

  // Average per test = sum of total marks / number of tests
  const totalAllTests = tests.reduce((acc, t) => acc + t.total, 0);
  const avgAllTests = tests.length ? totalAllTests / tests.length : 0;

  tests.forEach((t, i) => {
    let rowHTML = `<tr>
      <td>${t.date}</td>
      <td>${t.exam}</td>
      <td>${t.test}</td>
      <td>${t.total}</td>
      <td>${avgAllTests.toFixed(1)}</td>`;

    sectionNames.forEach(secName => {
      const sec = t.sections.find(s => s.name === secName);
      rowHTML += `<td>${sec ? sec.marks : "-"}</td>`;
    });

    rowHTML += `<td>
      <button onclick="editTest(${i})">✏</button>
      <button onclick="deleteTest(${i})">🗑</button>
    </td></tr>`;

    tbody.innerHTML += rowHTML;
  });
}

// ------------------- EDIT / DELETE -------------------
function editTest(i) {
  const t = tests[i];
  editIndex = i;

  document.getElementById("examName").value = t.exam;
  document.getElementById("testName").value = t.test;
  document.getElementById("testDate").value = t.date;

  const secDiv = document.getElementById("sections");
  secDiv.innerHTML = "";
  t.sections.forEach(s => addSection(s.name, s.marks));

  document.getElementById("formTitle").innerText = "Edit Test";
}

function deleteTest(i) {
  if (!confirm("Delete this test?")) return;
  tests.splice(i, 1);
  localStorage.setItem("tests", JSON.stringify(tests));
  renderTable();
}

// ------------------- CLEAR FORM -------------------
function clearForm() {
  document.getElementById("examName").value = "";
  document.getElementById("testName").value = "";
  document.getElementById("testDate").value = "";
  document.getElementById("sections").innerHTML = "";
  editIndex = null;
  document.getElementById("formTitle").innerText = "Add Test";
}

// ------------------- GRAPH -------------------
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
  const sortedTests = tests.sort((a,b)=>new Date(a.date)-new Date(b.date));
  const labels = sortedTests.map(t => t.date);
  const data = sortedTests.map(t => t.total);

  if(window.chart) window.chart.destroy();
  window.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Total Marks",
        data: data,
        borderColor: "#1976d2",
        backgroundColor: "rgba(25,118,210,0.2)"
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}
