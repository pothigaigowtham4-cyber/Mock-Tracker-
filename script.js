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
let examCountdowns = JSON.parse(localStorage.getItem("examCountdowns")) || [];
let darkMode = JSON.parse(localStorage.getItem("darkMode")) || false;

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
  initCountdowns();
  applyDarkMode();
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
  addExportButtons();
  addCountdownUI();
  addDarkModeToggle();
}

/* -------- DARK MODE -------- */
function applyDarkMode(){
  if(darkMode) document.body.classList.add("dark");
  else document.body.classList.remove("dark");
}

function toggleDarkMode(){
  darkMode = !darkMode;
  localStorage.setItem("darkMode", JSON.stringify(darkMode));
  applyDarkMode();
}

function addDarkModeToggle(){
  const btn = document.createElement("button");
  btn.innerHTML = darkMode ? "☀ Light Mode" : "🌙 Dark Mode";
  btn.onclick = () => { toggleDarkMode(); btn.innerHTML = darkMode ? "☀ Light Mode" : "🌙 Dark Mode"; };
  document.querySelector(".topHeader").appendChild(btn);
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
  if(exam==="ALL"){ alert("Select an exam first"); return; }
  const val = Number(document.getElementById("targetInput").value);
  if(!val){ alert("Enter valid target"); return; }
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
  addSection(); addSection(); addSection();
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
  if(rows.length <= 1){ alert("At least one section is required."); return; }
  btn.parentElement.remove();
}

/* -------- SAVE TEST -------- */
function saveTest(){
  const exam=examName.value.trim();
  const test=testName.value.trim();
  const date=testDate.value;
  const platform=platformName.value.trim();
  const neg=Number(negativeMark.value)||0;

  if(!exam||!test||!date||!platform){ alert("Fill all details"); return; }

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

/* ================== SMART FEEDBACK ================== */
function autoFeedback(t){
  const examTests = tests.filter(x => x.exam === t.exam).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const idx = examTests.indexOf(t);
  const prev = idx>0 ? examTests[idx-1] : null;
  let feedbackPool=[];

  if(!prev){ feedbackPool.push("🧪 First test for this exam. This becomes your baseline."); }
  else{
    if(t.total>prev.total) feedbackPool.push("📈 Score improved from previous test. Strategy is moving in right direction.");
    else if(t.total<prev.total) feedbackPool.push("📉 Score dropped compared to last test. Analyse mistakes deeply.");
    else feedbackPool.push("➖ Score stagnant. Push either attempts or accuracy consciously.");
  }

  if(t.accuracy<60) feedbackPool.push("🎯 Accuracy is risky. Reduce guesses and focus on concepts.");
  else if(t.accuracy>80) feedbackPool.push("✅ Accuracy is strong. You can safely increase attempts.");
  else feedbackPool.push("⚖ Accuracy balanced. Maintain same approach.");

  if(t.negLoss>t.total*0.15) feedbackPool.push("❗ Negative marks are hurting your score badly.");
  else feedbackPool.push("🛡 Negative marks are under control.");

  const target = targets[t.exam];
  if(target){
    const diff = t.total - target;
    if(diff>=10) feedbackPool.push("🔥 Well above target. Raise difficulty level.");
    else if(diff>=0) feedbackPool.push("🎯 Target achieved. Focus on consistency.");
    else if(diff>-10) feedbackPool.push("🟡 Very close to target. Minor corrections needed.");
    else feedbackPool.push("🚨 Far below target. Revise basics before next mock.");
  }

  const weak = t.sections.reduce((a,b)=>a.marks<b.marks?a:b).name;
  feedbackPool.push(`🧱 Weakest section: ${weak}. Fix this first for quick gains.`);

  // Strategy insights (randomized)
  const strategies = [
    "You lose more from negatives than you gain from attempts. Attempt 6–8 fewer questions.",
    "Focus on accuracy over attempts for better score.",
    "Prioritize weak sections first; don’t spend too long on strong sections.",
    "Adjust time allocation to reduce rushed mistakes.",
    "Maintain consistency; skipping sections may hurt your overall trend."
  ];
  feedbackPool.push(strategies[Math.floor(Math.random()*strategies.length)]);

  if(!feedbackHistory[t.exam]) feedbackHistory[t.exam]=[];
  let finalFeedback = feedbackPool.find(f => !feedbackHistory[t.exam].includes(f)) || feedbackPool[0];
  feedbackHistory[t.exam].push(finalFeedback);
  if(feedbackHistory[t.exam].length>6) feedbackHistory[t.exam].shift();
  localStorage.setItem("feedbackHistory", JSON.stringify(feedbackHistory));
  return finalFeedback;
}

/* -------- EXAM COUNTDOWN FEATURE -------- */
function addCountdownUI(){
  const box = document.createElement("div");
  box.id="examCountdownBox";
  box.innerHTML=`
    <h4>Exam Countdown ⏳</h4>
    <input id="countdownName" placeholder="Exam Name">
    <input id="countdownDate" type="date">
    <button onclick="addCountdown()">Add</button>
    <div id="countdownList"></div>
  `;
  document.querySelector(".card").appendChild(box);
  renderCountdowns();
}

function addCountdown(){
  const name = document.getElementById("countdownName").value.trim();
  const date = document.getElementById("countdownDate").value;
  if(!name || !date){ alert("Fill both fields"); return; }
  examCountdowns.push({name,date});
  localStorage.setItem("examCountdowns", JSON.stringify(examCountdowns));
  renderCountdowns();
}

function editCountdown(idx){
  const name = prompt("Edit Exam Name:", examCountdowns[idx].name);
  const date = prompt("Edit Exam Date:", examCountdowns[idx].date);
  if(name && date){
    examCountdowns[idx]={name,date};
    localStorage.setItem("examCountdowns", JSON.stringify(examCountdowns));
    renderCountdowns();
  }
}

function deleteCountdown(idx){
  if(confirm("Delete this exam countdown?")){
    examCountdowns.splice(idx,1);
    localStorage.setItem("examCountdowns", JSON.stringify(examCountdowns));
    renderCountdowns();
  }
}

function renderCountdowns(){
  const list = document.getElementById("countdownList");
  list.innerHTML="";
  examCountdowns.forEach((e,i)=>{
    const days = Math.ceil((new Date(e.date)-new Date())/(1000*60*60*24));
    const div = document.createElement("div");
    div.innerHTML=`${e.name}: ${days>=0?days+" days left":"Exam passed"} 
      <button onclick="editCountdown(${i})">✏</button>
      <button onclick="deleteCountdown(${i})">🗑</button>`;
    list.appendChild(div);
  });
}

/* ================== EVERYTHING ELSE REMAINS THE SAME ================== */
// renderAll(), renderDropdown(), renderTables(), editTest(), deleteTest(), drawGraph(), showGraph(), hideGraph(), addExportButtons(), exportPDF(), exportExcel() etc.
