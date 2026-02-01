/************* GLOBAL STATE *************/
let tests = JSON.parse(localStorage.getItem("tests")) || [];
let examDates = JSON.parse(localStorage.getItem("examDates")) || {};
let editIndex = null;

/************* QUOTES *************/
const quotes = [
  "Consistency beats intensity.",
  "Mocks don't judge — they reveal.",
  "Improve every test by 1%.",
  "Discipline > Motivation."
  "While you are resting, someone else is working to take your spot.",   "Discipline beats motivation every single time.",   "You don't need more time, you need more focus.",   "Consistency today creates confidence tomorrow.",   "Average today is the enemy of success tomorrow.",   "The pain of study is temporary, regret lasts forever.",   "Small progress every day adds up to big results."
];

let qIndex = 0;
function rotateQuote() {
  document.getElementById("quoteText").innerText = quotes[qIndex];
  qIndex = (qIndex + 1) % quotes.length;
}
setInterval(rotateQuote, 4000);

/************* DARK MODE *************/
const toggle = document.getElementById("darkToggle");
if (localStorage.getItem("dark") === "true") {
  document.body.classList.add("dark");
}
toggle.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark"));
};

/************* ADD / EDIT TEST *************/
function addOrUpdateTest() {
  const exam = examInput.value.trim();
  const test = testNameInput.value.trim();
  const score = +scoreInput.value;
  const negative = +negativeInput.value || 0;

  if (!exam || !test) return;

  const data = { exam, test, score, negative };

  if (editIndex !== null) {
    tests[editIndex] = data;
    editIndex = null;
  } else {
    tests.push(data);
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

/************* EDIT *************/
function editTest(index) {
  const t = tests[index];
  examInput.value = t.exam;
  testNameInput.value = t.test;
  scoreInput.value = t.score;
  negativeInput.value = t.negative;
  editIndex = index;
}

/************* GROUPED TABLES *************/
function renderTables() {
  const container = document.getElementById("tablesContainer");
  container.innerHTML = "";

  const grouped = {};
  tests.forEach(t => {
    if (!grouped[t.exam]) grouped[t.exam] = [];
    grouped[t.exam].push(t);
  });

  for (let exam in grouped) {
    const list = grouped[exam];
    const scores = list.map(t => t.score);
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    let html = `<h2 style="text-align:center">${exam}</h2>`;
    html += `<table><tr>
      <th>Test</th><th>Score</th><th>Negative</th><th>Edit</th>
    </tr>`;

    list.forEach((t, i) => {
      let cls = t.score === max ? "best" : t.score === min ? "worst" : "";
      html += `<tr class="${cls}">
        <td>${t.test}</td>
        <td>${t.score}</td>
        <td>${t.negative}</td>
        <td><button onclick="editTest(${tests.indexOf(t)})">✏️</button></td>
      </tr>`;
    });

    html += "</table>";
    container.innerHTML += html;
  }
}

/************* EXAM COUNTDOWN *************/
function saveExamDate() {
  const name = examName.value;
  const date = examDate.value;
  if (!name || !date) return;
  examDates[name] = date;
  localStorage.setItem("examDates", JSON.stringify(examDates));
  updateCountdown();
}

function updateCountdown() {
  const entries = Object.entries(examDates);
  if (!entries.length) return;

  const [name, date] = entries[entries.length - 1];
  const diff = Math.ceil(
    (new Date(date) - new Date()) / (1000 * 60 * 60 * 24)
  );

  countdownText.innerText =
    diff >= 0 ? `${name}: ${diff} days remaining` : `${name}: Exam over`;
}

updateCountdown();
rotateQuote();
renderTables();
