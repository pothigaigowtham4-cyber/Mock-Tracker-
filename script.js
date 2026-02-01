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
  window.targetInput = document.getElementById("targetInput");
  window.tablesArea = document.getElementById("tablesArea");
  window.graphPage = document.getElementById("graphPage");
  window.graph = document.getElementById("graph");
  window.darkModeBtn = document.getElementById("darkModeBtn");

  rotateQuotes();
  setInterval(rotateQuotes, 30000);
  darkModeBtn.onclick = toggleDarkMode;

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
}

/* -------- SECTIONS -------- */
function initSections(){
  sections.innerHTML="";
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
  const targetVal = Number(targetInput.value);

  if(!exam||!test||!date||!platform){
    alert("Fill all details"); return;
  }

  if(targetVal) targets[exam] = targetVal;

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
  localStorage.setItem("targets",JSON.stringify(targets));
  editIndex=null;
  targetInput.value = targets[exam] || "";
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
  if(examFilter.value==="ALL" && exams.length>1) examFilter.value=exams[1];
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
    const examTests = grouped[exam];
    const avg = (examTests.reduce((a,b)=>a+b.total,0)/examTests.length).toFixed(1);

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "examTableWrapper";
    tableWrapper.innerHTML = `<h3>${exam} - Avg: ${avg}</h3>`;
    const table = document.createElement("table");
    table.innerHTML = `
      <tr>
        <th>Test</th><th>Date</th><th>Platform</th><th>Total</th><th>Accuracy %</th><th>Edit</th><th>Delete</th>
      </tr>
    `;

    const totals = examTests.map(t=>t.total);
    const maxTotal = Math.max(...totals);
    const minTotal = Math.min(...totals);

    examTests.forEach((t,i)=>{
      const tr = document.createElement("tr");
      tr.className = t.total===maxTotal?"best":t.total===minTotal?"worst":"";
      tr.innerHTML = `
        <td>${t.test}</td>
        <td>${t.date}</td>
        <td>${t.platform}</td>
        <td>${t.total}</td>
        <td>${t.accuracy}</td>
        <td><button onclick="editTest(${tests.indexOf(t)})">✏️</button></td>
        <td><button onclick="deleteTest(${tests.indexOf(t)})">🗑</button></td>
      `;
      tr.onclick = ()=>toggleAnalysis(tr, t);
      table.appendChild(tr);
    });
    tableWrapper.appendChild(table);
    tablesArea.appendChild(tableWrapper);
  });
}

/* -------- ANALYSIS ROW -------- */
function toggleAnalysis(row,t){
  const next = row.nextElementSibling;
  if(next && next.classList.contains("analysisRow")){
    next.remove();
    return;
  }
  const analysis = document.createElement("tr");
  analysis.className="analysisRow";
  const td = document.createElement("td");
  td.colSpan=7;
  td.innerHTML = `
    <b>Sections:</b> ${t.sections.map(s=>`${s.name}: ${s.marks}`).join(', ')} <br>
    <b>Correct:</b> ${t.tc}, <b>Wrong:</b> ${t.tw}, <b>Unattempted:</b> ${t.tu} <br>
    <b>Negative Marks:</b> ${t.negLoss} <br>
    <b>Insights:</b> ${autoFeedback(t)}
  `;
  analysis.appendChild(td);
  row.parentNode.insertBefore(analysis,row.nextSibling);
}

/* ---------------- EDIT / DELETE ---------------- */
function editTest(idx){
  const t = tests[idx];
  examName.value = t.exam;
  testName.value = t.test;
  testDate.value = t.date;
  platformName.value = t.platform;
  negativeMark.value = t.neg;
  targetInput.value = targets[t.exam] || "";
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
  if(!prev) feedbackPool.push("🧪 First test for this exam. Baseline established.");
  else {
    if(t.total>prev.total) feedbackPool.push("📈 Score improved from previous test.");
    else if(t.total<prev.total) feedbackPool.push("📉 Score dropped compared to last test.");
    else feedbackPool.push("➖ Score stagnant. Push attempts or accuracy.");
  }

  if(t.accuracy<60) feedbackPool.push("🎯 Accuracy risky. Reduce guesses.");
  else if(t.accuracy>80) feedbackPool.push("✅ Accuracy strong.");
  else feedbackPool.push("⚖ Accuracy balanced.");

  if(t.negLoss>t.total*0.15) feedbackPool.push("❗ Negative marks hurting score.");
  else feedbackPool.push("🛡 Negative marks under control.");

  const target = targets[t.exam];
  if(target){
    const diff = t.total - target;
    if(diff>=10) feedbackPool.push("🔥 Above target. Raise difficulty.");
    else if(diff>=0) feedbackPool.push("🎯 Target achieved. Maintain consistency.");
    else if(diff>-10) feedbackPool.push("🟡 Very close to target. Minor corrections needed.");
    else feedbackPool.push("🚨 Far below target. Revise basics.");
  }

  const weak = t.sections.reduce((a,b)=>a.marks<b.marks?a:b).name;
  feedbackPool.push(`🧱 Weakest section: ${weak}. Fix this first.`);

  if(!feedbackHistory[t.exam]) feedbackHistory[t.exam]=[];
  let finalFeedback = feedbackPool.find(f=>!feedbackHistory[t.exam].includes(f)) || feedbackPool[0];
  feedbackHistory[t.exam].push(finalFeedback);
  if(feedbackHistory[t.exam].length>6) feedbackHistory[t.exam].shift();
  localStorage.setItem("feedbackHistory",JSON.stringify(feedbackHistory));
  return finalFeedback;
}

/* ---------------- GRAPH ---------------- */
function showGraph(){
  const selected = examFilter.value;
  if(selected==="ALL"){ alert("Select an exam for graph"); return; }

  graphPage.style.display="block";
  tablesArea.style.display="none";
  drawGraph(selected);
}

function hideGraph(){
  graphPage.style.display="none";
  tablesArea.style.display="block";
}

function drawGraph(exam){
  const ctx = graph.getContext('2d');
  const examTests = tests.filter(t=>t.exam===exam);
  const labels = examTests.map(t=>t.test);
  const data = examTests.map(t=>t.total);
  if(window.graphInstance) window.graphInstance.destroy();
  window.graphInstance = new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{label:'Total Marks',data,fill:false,borderColor:'blue'}]},
    options:{responsive:true}
  });
}

/* ---------------- DARK MODE ---------------- */
function toggleDarkMode(){
  document.body.classList.toggle("dark");
  darkModeBtn.textContent = document.body.classList.contains("dark")?"☀ Light Mode":"🌙 Dark Mode";
}

/* ---------------- EXPORT ---------------- */
function exportExcel(){
  const ws = XLSX.utils.json_to_sheet(tests.map(t=>{
    return {
      Exam:t.exam, Test:t.test, Date:t.date, Platform:t.platform, Total:t.total, Accuracy:t.accuracy,
      Sections:t.sections.map(s=>`${s.name}:${s.marks}`).join(', ')
    }
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tests");
  XLSX.writeFile(wb, "MockTracker.xlsx");
}

function exportPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y=10;
  tests.forEach(t=>{
    doc.text(`Exam: ${t.exam} | Test: ${t.test} | Date: ${t.date} | Total: ${t.total} | Accuracy: ${t.accuracy}`, 10, y);
    y+=7;
    doc.text(`Sections: ${t.sections.map(s=>`${s.name}:${s.marks}`).join(', ')}`, 10, y);
    y+=10;
  });
  doc.save("MockTracker.pdf");
}
