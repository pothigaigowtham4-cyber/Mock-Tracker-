let tests = [];
let chart = null;

/* ===============================
   MOTIVATIONAL QUOTES
   =============================== */

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

let quoteIndex = 0;

/* ===============================
   DOM READY
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  startQuoteRotation();
  renderTables();
  renderGraph();
});

/* ===============================
   QUOTE ROTATION – 10s
   =============================== */
function startQuoteRotation() {
  const quoteEl = document.getElementById("quote");
  if (!quoteEl) return;

  quoteEl.textContent = quotes[0];

  setInterval(() => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    quoteEl.textContent = quotes[quoteIndex];
  }, 10000);
}

/* ===============================
   DATE FORMAT – dd-mm-yyyy
   =============================== */
function formatDate(date) {
  const [y, m, d] = date.split("-");
  return `${d}-${m}-${y}`;
}

/* ===============================
   EXAM FILTER
   =============================== */
examFilter.addEventListener("change", () => {
  renderTables();
  renderGraph();
});

/* ===============================
   TABLE RENDER
   =============================== */
function renderTables() {
  tablesArea.innerHTML = "";

  const selectedExam = examFilter.value || "ALL";

  const grouped = {};
  tests.forEach(t => {
    if (selectedExam === "ALL" || t.exam === selectedExam) {
      grouped[t.exam] = grouped[t.exam] || [];
      grouped[t.exam].push(t);
    }
  });

  Object.keys(grouped).forEach(exam => {
    const wrapper = document.createElement("div");
    wrapper.className = "card";

    const title = document.createElement("h3");
    title.textContent = exam;
    wrapper.appendChild(title);

    const table = document.createElement("table");
    table.innerHTML = `
      <tr>
        <th>Test</th>
        <th>Date</th>
        <th>Total</th>
        <th>Correct</th>
        <th>Wrong</th>
        <th>Unattempted</th>
        <th>Accuracy</th>
      </tr>
    `;

    grouped[exam].forEach(t => {
      table.innerHTML += `
        <tr>
          <td>${t.test}</td>
          <td>${formatDate(t.date)}</td>
          <td>${t.total}</td>
          <td>${t.correct}</td>
          <td>${t.wrong}</td>
          <td>${t.unattempted}</td>
          <td>${t.accuracy}%</td>
        </tr>
      `;
    });

    wrapper.appendChild(table);
    tablesArea.appendChild(wrapper);
  });
}

/* ===============================
   GRAPH
   =============================== */
function renderGraph() {
  const selectedExam = examFilter.value || "ALL";

  const data = tests.filter(
    t => selectedExam === "ALL" || t.exam === selectedExam
  );

  if (!data.length) return;

  const labels = data.map(t => t.test);
  const scores = data.map(t => t.total);

  if (chart) chart.destroy();

  chart = new Chart(graphCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Score Trend",
        data: scores,
        borderColor: "#38bdf8",
        tension: 0.3
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb"
          }
        }
      },
      scales: {
        x: { ticks: { color: "#e5e7eb" } },
        y: { ticks: { color: "#e5e7eb" } }
      }
    }
  });
}
