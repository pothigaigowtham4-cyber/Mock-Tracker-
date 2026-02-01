/******** STATE ********/
let tests = JSON.parse(localStorage.getItem("tests") || "[]");
let examDates = JSON.parse(localStorage.getItem("examDates") || "{}");
let editIndex = null;

/******** QUOTES ********/
const quotes = [
  "Consistency beats intensity.",
  "Mocks reveal, not judge.",
  "Every test is feedback.",
  "Small improvements compound."
];

let q = 0;
function rotateQuote() {
  document.getElementById("quoteText").textContent = quotes[q];
  q = (q + 1) % quotes.length;
}
setInterval(rotateQuote, 4000);
rotateQuote();

/******** DARK MODE ********/
const darkToggle = document.getElementById("darkToggle");
if (localStorage.getItem("dark") === "true") {
  document.body.classList.add("dark");
}

darkToggle.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark"));
};

/******** ADD / EDIT ********/
function addTest() {
  const exam = examInput.value.trim();
  const test = testNameInput.value.trim();
  const score = Number(scoreInput.value);
  const negative = Number(negativeInput.value) || 0;

  if (!exam || !test) return;

  const obj = { exam, test, score, negative };

  if (editIndex !== null) {
    tests[editIndex] = obj;
    editIndex = null;
  } else {
    tests.push(obj);
  }

  localStorage.setItem("tests", JSON.stringify(tests));
  clearInputs();
  renderTables();
}

function clearInputs() {
  examInput.value = "";
  testNameInput.value = "";
  scoreInput.value = "";
  negativeInput.value = "";
}

function editTest(i) {
  const t = tests[i];
  examInput.value = t.exam;
  testNameInput.value = t.test;
  scoreInput.value = t.score;
  negativeInput.value = t.negative;
  editIndex = i;
}

/******** TABLES ********/
function renderTables() {
  const container = document.getElementById("tablesContainer");
  container.innerHTML = "";

  if (!tests.length) return;

  const grouped = {};
  tests.forEach(t => {
    grouped[t.exam] = grouped[t.exam] || [];
    grouped[t.exam].push(t);
  });

  Object.keys(grouped).forEach(exam => {
    const list = grouped[exam];
    const scores = list.map(t => t.score);
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    let html = `<h2 style="text-align:center">${exam}</h2>`;
    html += `<table><tr>
      <th>Test</th><th>Marks</th><th>Negative</th><th>Edit</th>
    </tr>`;

    list.forEach(t => {
      const idx = tests.indexOf(t);
      const cls = t.score === max ? "best" : t.score === min ? "worst" : "";
      html += `<tr class="${cls}">
        <td>${t.test}</td>
        <td>${t.score}</td>
        <td>${t.negative}</td>
        <td><button onclick="editTest(${idx})">Edit</button></td>
      </tr>`;
    });

    html += "</table>";
    container.innerHTML += html;
  });
}

renderTables();

/******** COUNTDOWN ********/
function saveExamDate() {
  const name = examName.value.trim();
  const date = examDate.value;
  if (!name || !date) return;

  examDates[name] = date;
  localStorage.setItem("examDates", JSON.stringify(examDates));
  updateCountdown();
}

function updateCountdown() {
  const keys = Object.keys(examDates);
  if (!keys.length) return;

  const name = keys[keys.length - 1];
  const target = new Date(examDates[name]);
  const today = new Date();

  const diff = Math.ceil((target - today) / 86400000);
  countdownText.textContent =
    diff >= 0 ? `${name}: ${diff} days remaining` : `${name}: Exam over`;
}

updateCountdown();
