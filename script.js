/* ---------------- QUOTES ROTATION ---------------- */
const quotes = [
  "Don’t stop when you’re tired; stop when you are finally done. The discipline you find today builds the freedom you enjoy tomorrow.",
  "A mountain of books is just a series of single pages waiting to be turned. Focus on the progress of the hour, not the pressure of the exam.",
  "Be the person your future self will look back on and thank for not quitting. The work is temporary, but the result stays forever.",
  "Motivation gets you to the desk, but habit is what keeps the pen moving.",
  "You aren't just studying a subject; you are upgrading your own mind.",
  "Suffer the boredom of study now, or suffer the sting of regret later.",
  "While you are resting, someone else is working to take your spot.",
  "Consistency means letting your schedule run your day, not your mood.",
  "Winning the day is the only way to win the year.",
  "Greatness is built in silence."
];

let qIndex = Math.floor(Math.random() * quotes.length);

/* ---------------- DATA ---------------- */
let tests = JSON.parse(localStorage.getItem("tests")) || [];
let editIndex = null;
let targets = JSON.parse(localStorage.getItem("targets")) || {};
let feedbackHistory = JSON.parse(localStorage.getItem("feedbackHistory")) || {};
let countdowns = JSON.parse(localStorage.getItem("countdowns")) || [];

/* ===== FIXED SECTION ORDER ===== */
const FIXED_ORDER = ["APTITUDE", "REASONING", "ENGLISH", "GENERAL AWARENESS"];
function norm(s){ return s.trim().toUpperCase(); }

/* ---------------- DOM READY ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  window.quoteEl = document.getElementById("quoteText");
  window.sections = document.getElementById("sections");
  window.examFilter = document.getElementById("examFilter");
  window.examName = document.getElementById("examName");
  window.testName = document.getElementById("testName");
  window.testDate = document.getElementById("testDate");
  window.platformName = document.getElementById("platformName");
  window.negativeMark = document.getElementById("negativeMark");
  window.tablesArea = document.getElementById("tablesArea");
  window.graphPage = document.getElementById("graphPage");
  window.graph = document.getElementById("graph");

  rotateQuotes();
  setInterval(rotateQuotes, 30000); // 30 seconds
  init();
});

/* ---------------- QUOTES ---------------- */
function rotateQuotes(){
  if(!quoteEl) return;
  quoteEl.classList.remove("show");
  setTimeout(()=>{
    quoteEl.textContent = quotes[qIndex];
    quoteEl.classList.add("show");
    qIndex = (qIndex + 1) % quotes.length;
  }, 400);
}

/* ---------------- INIT ---------------- */
function init(){
  initSections();
  renderAll();
  addTargetUI();
  addCountdownUI();
  addDarkModeToggle();
}

/* -------- TARGET PER EXAM -------- */
function addTargetUI(){
  const box = document.createElement("div");
  box.innerHTML = `
    <h4>Set Target for Selected Exam 🎯</h4>
    <input id="targetInput" type="number" placeholder="Enter Target Marks">
    <button onclick="saveTarget()">Save Target</button>
  `;
  document.querySelector(".card").appendChild(box);
}

function saveTarget(){
  const exam = examFilter.value;
  if(exam==="ALL"){
    alert("Select an exam first");
    return;
  }
  const val = Number(document.getElementById("targetInput").value);
  if(!val){
    alert("Enter valid target");
    return;
  }
  targets[exam] = val;
  localStorage.setItem("targets", JSON.stringify(targets));
  alert("Target saved for " + exam);
  drawGraph();
}

/* -------- SECTIONS -------- */
function initSections(){
  sections.innerHTML="";
  const labelRow = document.createElement("div");
  labelRow.className="sectionLabels";
  labelRow.innerHTML=`
    <span>Section</span><span>Marks</span><span>Correct</span><span>Wrong</span><span>Unattempted</span><span></span>
  `;
  sections.appendChild(labelRow);
  addSection();
  addSection();
  addSection();
}

function addSection(name="", marks=0, c=0, w=0, u=0){
  const d=document.createElement("div");
  d.className="sectionRow";
  d.innerHTML=`
    <input class="sectionName" value="${name}" placeholder="Section">
    <input type="number" class="sectionMarks" value="${marks}">
    <input type="number" value="${c}">
    <input type="number" value="${w}">
    <input type="number" value="${u}">
    <button onclick="deleteSection(this)">🗑</button>
  `;
  sections.appendChild(d);
}

function deleteSection(btn){
  const rows = document.querySelectorAll(".sectionRow");
  if(rows.length <= 1){
    alert("At least one section is required.");
    return;
  }
  btn.parentElement.remove();
}

/* -------- SAVE TEST -------- */
function saveTest(){
  const exam=examName.value.trim();
  const test=testName.value.trim();
  const date=testDate.value;
  const platform=platformName.value.trim();
  const neg=Number(negativeMark.value)||0;

  if(!exam||!test||!date||!platform){
    alert("Fill all details");
    return;
  }

  let sectionsArr=[], total=0, tc=0, tw=0, tu=0;
  document.querySelectorAll(".sectionRow").forEach(r=>{
    const name=r.querySelector(".sectionName").value||"Section";
    const marks=Number(r.querySelector(".sectionMarks").value)||0;
    const c=Number(r.children[2].value)||0;
    const w=Number(r.children[3].value)||0;
    const u=Number(r.children[4].value)||0;
    total+=marks; tc+=c; tw+=w; tu+=u;
    sectionsArr.push({name,marks,c,w,u});
  });

  const negLoss = tw * neg;
  const accuracy = tc + tw > 0 ? ((tc/(tc+tw))*100).toFixed(1) : 0;

  const obj={exam,test,date,platform,neg,total,negLoss,tc,tw,tu,accuracy,sections:sectionsArr};

  if(editIndex==null) tests.push(obj);
  else tests[editIndex]=obj;

  localStorage.setItem("tests",JSON.stringify(tests));
  editIndex=null;
  initSections();
  renderAll();
}

/* ---------------- RENDER ALL ---------------- */
function renderAll(){
  renderDropdown();
  renderTables();
}

/* -------- DROPDOWN -------- */
function renderDropdown(){
  const exams = ["ALL", ...new Set(tests.map(t=>t.exam))];
  examFilter.innerHTML = "";
  exams.forEach(e=>{
    const opt = document.createElement("option");
    opt.value = e;
    opt.textContent = e;
    examFilter.appendChild(opt);
  });
}

/* -------- TABLES PER EXAM -------- */
function renderTables(){
  tablesArea.innerHTML = "";
  const selected = examFilter.value;
  const grouped = {};

  tests.forEach(t=>{
    if(selected==="ALL" || selected===t.exam){
      if(!grouped[t.exam]) grouped[t.exam]=[];
      grouped[t.exam].push(t);
    }
  });

  Object.keys(grouped).forEach(exam=>{
    const tableWrapper = document.createElement("div");
    tableWrapper.className = "examTableWrapper";
    tableWrapper.innerHTML = `<h3>${exam}</h3>`;
    const table = document.createElement("table");
    table.innerHTML = `
      <tr>
        <th>Test</th><th>Date</th><th>Platform</th><th>Total</th><th>Accuracy %</th><th>Feedback</th><th>Edit</th><th>Delete</th>
      </tr>
    `;
    grouped[exam].forEach((t,i)=>{
      const feedback = autoFeedback(t);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.test}</td>
        <td>${t.date}</td>
        <td>${t.platform}</td>
        <td>${t.total}</td>
        <td>${t.accuracy}</td>
        <td>${feedback}</td>
        <td><button onclick="editTest(${tests.indexOf(t)})">✏️</button></td>
        <td><button onclick="deleteTest(${tests.indexOf(t)})">🗑</button></td>
      `;
      table.appendChild(tr);
    });
    tableWrapper.appendChild(table);
    tablesArea.appendChild(tableWrapper);
  });
}

/* -------- EDIT / DELETE TEST -------- */
function editTest(idx){
  const t = tests[idx];
  examName.value = t.exam;
  testName.value = t.test;
  testDate.value = t.date;
  platformName.value = t.platform;
  negativeMark.value = t.neg;
  initSections();
  t.sections.forEach((s,i)=>{
    if(i<document.querySelectorAll(".sectionRow").length){
      const row = document.querySelectorAll(".sectionRow")[i];
      row.querySelector(".sectionName").value = s.name;
      row.querySelector(".sectionMarks").value = s.marks;
      row.children[2].value = s.c;
      row.children[3].value = s.w;
      row.children[4].value = s.u;
    } else addSection(s.name,s.marks,s.c,s.w,s.u);
  });
  editIndex = idx;
}

function deleteTest(idx){
  if(confirm("Delete this test?")){
    tests.splice(idx,1);
    localStorage.setItem("tests",JSON.stringify(tests));
    renderAll();
  }
}

/* ---------------- SMART FEEDBACK ---------------- */
function autoFeedback(t){
  const examTests = tests
    .filter(x => x.exam === t.exam)
    .sort((a,b)=>new Date(a.date)-new Date(b.date));
  const idx = examTests.indexOf(t);
  const prev = idx > 0 ? examTests[idx-1] : null;

  let feedbackPool = [];
  if(!prev){
    feedbackPool.push("🧪 First test for this exam. This becomes your baseline.");
  } else {
    if(t.total > prev.total) feedbackPool.push("📈 Score improved from previous test. Strategy is moving in right direction.");
    else if(t.total < prev.total) feedbackPool.push("📉 Score dropped compared to last test. Analyse mistakes deeply.");
    else feedbackPool.push("➖ Score stagnant. Push either attempts or accuracy consciously.");
  }

  if(t.accuracy < 60) feedbackPool.push("🎯 Accuracy is risky. Reduce guesses and focus on concepts.");
  else if(t.accuracy > 80) feedbackPool.push("✅ Accuracy is strong. You can safely increase attempts.");
  else feedbackPool.push("⚖ Accuracy balanced. Maintain same approach.");

  if(t.negLoss > t.total * 0.15) feedbackPool.push("❗ Negative marks are hurting your score badly.");
  else feedbackPool.push("🛡 Negative marks are under control.");

  const target = targets[t.exam];
  if(target){
    const diff = t.total - target;
    if(diff >= 10) feedbackPool.push("🔥 Well above target. Raise difficulty level.");
    else if(diff >= 0) feedbackPool.push("🎯 Target achieved. Focus on consistency.");
    else if(diff > -10) feedbackPool.push("🟡 Very close to target. Minor corrections needed.");
    else feedbackPool.push("🚨 Far below target. Revise basics before next mock.");
  }

  const weak = t.sections.reduce((a,b)=>a.marks<b.marks?a:b).name;
  feedbackPool.push(`🧱 Weakest section: ${weak}. Fix this first for quick gains.`);

  if(!feedbackHistory[t.exam]) feedbackHistory[t.exam] = [];
  let finalFeedback = feedbackPool.find(f => !feedbackHistory[t.exam].includes(f)) || feedbackPool[0];
  feedbackHistory[t.exam].push(finalFeedback);
  if(feedbackHistory[t.exam].length > 6) feedbackHistory[t.exam].shift();
  localStorage.setItem("feedbackHistory", JSON.stringify(feedbackHistory));
  return finalFeedback;
}

/* ---------------- GRAPH ---------------- */
function showGraph(){
  graphPage.style.display="block";
  tablesArea.style.display="none";
  drawGraph();
}

function hideGraph(){
  graphPage.style.display="none";
  tablesArea.style.display="block";
}

function drawGraph(){
  const ctx = graph.getContext('2d');
  const selected = examFilter.value;
  const examTests = selected==="ALL"?tests:tests.filter(t=>t.exam===selected);
  const labels = examTests.map(t=>t.test);
  const data = examTests.map(t=>t.total);
  if(window.graphInstance) window.graphInstance.destroy();
  window.graphInstance = new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{label:'Total Marks',data,fill:false,borderColor:'blue'}]},
    options:{responsive:true}
  });
}

/* ---------------- DARK MODE TOGGLE ---------------- */
function addDarkModeToggle(){
  const btn = document.createElement("button");
  btn.textContent = "🌙 Dark Mode";
  btn.style.position = "absolute";
  btn.style.right="20px";
  btn.style.top="10px";
  btn.onclick = ()=>{
    document.body.classList.toggle("dark");
    btn.textContent = document.body.classList.contains("dark")?"☀ Light Mode":"🌙 Dark Mode";
  };
  document.body.appendChild(btn);
}

/* ---------------- COUNTDOWN ---------------- */
function addCountdownUI(){
  const box = document.createElement("div");
  box.innerHTML=`
    <h4>Exam Countdown ⏳</h4>
    <input id="countdownExamName" placeholder="Exam Name">
    <input id="countdownExamDate" type="date">
    <button onclick="saveCountdown()">Add / Update</button>
    <div id="countdownList"></div>
  `;
  document.querySelector(".card").appendChild(box);
  renderCountdowns();
}

function saveCountdown(){
  const name = document.getElementById("countdownExamName").value.trim();
  const date = document.getElementById("countdownExamDate").value;
  if(!name || !date){ alert("Fill all fields"); return; }
  const idx = countdowns.findIndex(c=>c.name===name);
  if(idx>=0) countdowns[idx].date=date;
  else countdowns.push({name,date});
  localStorage.setItem("countdowns",JSON.stringify(countdowns));
  renderCountdowns();
}

function renderCountdowns(){
  const div = document.getElementById("countdownList");
  div.innerHTML="";
  countdowns.forEach((c,i)=>{
    const d = document.createElement("div");
    const remaining = Math.ceil((new Date(c.date)-new Date())/86400000);
    d.innerHTML=`${c.name} - ${c.date} - ${remaining} days <button onclick="deleteCountdown(${i})">🗑</button>`;
    div.appendChild(d);
  });
}

function deleteCountdown(idx){
  countdowns.splice(idx,1);
  localStorage.setItem("countdowns",JSON.stringify(countdowns));
  renderCountdowns();
}

/* ---------------- EXPORT BUTTON PLACEHOLDER ---------------- */
function addExportButtons(){
  // implement PDF / Excel export if needed
}
