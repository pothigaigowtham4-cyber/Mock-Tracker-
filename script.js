/* ---------------- SAFE JSON PARSING ---------------- */
function parseJSON(key,fallback){
  const item = localStorage.getItem(key);
  try{ return item?JSON.parse(item):fallback; }
  catch(e){ return fallback; }
}

/* ---------------- QUOTES ---------------- */
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
let qIndex = Math.floor(Math.random()*quotes.length);

/* ---------------- DATA ---------------- */
let tests = parseJSON("tests",[]);
let editIndex = null;
let targets = parseJSON("targets",{});
let feedbackHistory = parseJSON("feedbackHistory",{});
let examCountdowns = parseJSON("examCountdowns",[]);
let darkMode = parseJSON("darkMode",false);
let chartInstance = null;

/* ---------------- DOM READY ---------------- */
document.addEventListener("DOMContentLoaded",()=>{
  window.quoteEl = document.getElementById("quoteText");
  window.sections = document.getElementById("sections");
  window.examFilter = document.getElementById("examFilter");
  window.examName = document.getElementById("examName");
  window.testName = document.getElementById("testName");
  window.testDate = document.getElementById("testDate");
  window.platformName = document.getElementById("platformName");
  window.negativeMark = document.getElementById("negativeMark");
  window.tablesArea = document.getElementById("tablesArea");
  window.countdownCard = document.getElementById("examCountdownCard");
  window.targetInput = document.getElementById("targetInput");
  window.graphCard = document.getElementById("graphCard");

  rotateQuotes();
  setInterval(rotateQuotes,30000);
  init();
  applyDarkMode();
});

/* ---------------- QUOTES ---------------- */
function rotateQuotes(){
  if(!quoteEl) return;
  quoteEl.classList.remove("show");
  setTimeout(()=>{
    quoteEl.textContent = quotes[qIndex];
    quoteEl.classList.add("show");
    qIndex = (qIndex+1)%quotes.length;
  },400);
}

/* ---------------- INIT ---------------- */
function init(){
  initSections();
  renderExamFilter();
  renderAll();
  addCountdownUI();
  document.getElementById("darkModeBtn").onclick = toggleDarkMode;
}

/* ---------------- DARK MODE ---------------- */
function applyDarkMode(){
  if(darkMode) document.body.classList.add("dark");
  else document.body.classList.remove("dark");
}
function toggleDarkMode(){
  darkMode=!darkMode;
  localStorage.setItem("darkMode",JSON.stringify(darkMode));
  applyDarkMode();
  document.getElementById("darkModeBtn").textContent=darkMode?"☀ Light Mode":"🌙 Dark Mode";
}

/* ---------------- SECTIONS ---------------- */
function initSections(){
  sections.innerHTML="";
}
function addSection(name="",marks=0,c=0,w=0,u=0){
  const d=document.createElement("div");
  d.className="sectionRow";
  d.innerHTML=`
    <input class="sectionName" value="${name}" placeholder="Section">
    <input type="number" class="sectionMarks" value="${marks}" placeholder="Marks">
    <input type="number" value="${c}" placeholder="Correct">
    <input type="number" value="${w}" placeholder="Wrong">
    <input type="number" value="${u}" placeholder="Unattempted">
    <button onclick="deleteSection(this)">🗑</button>
  `;
  sections.appendChild(d);
}
function deleteSection(btn){
  btn.parentElement.remove();
}

/* ---------------- SAVE TEST ---------------- */
function saveTest(){
  const exam=examName.value.trim();
  const test=testName.value.trim();
  const date=testDate.value;
  const platform=platformName.value.trim();
  const neg=Number(negativeMark.value)||0;
  const targetVal=Number(targetInput.value)||0;
  if(!exam||!test||!date||!platform){ alert("Fill all details"); return; }
  if(targetVal) targets[exam]=targetVal;

  let sectionsArr=[],total=0,tc=0,tw=0,tu=0;
  document.querySelectorAll(".sectionRow").forEach(r=>{
    const name=r.querySelector(".sectionName").value||"Section";
    const marks=Number(r.querySelector(".sectionMarks").value)||0;
    const c=Number(r.children[2].value)||0;
    const w=Number(r.children[3].value)||0;
    const u=Number(r.children[4].value)||0;
    total+=marks; tc+=c; tw+=w; tu+=u;
    sectionsArr.push({name,marks,c,w,u});
  });
  const negLoss = tw*neg;
  const accuracy = tc+tw>0?((tc/(tc+tw))*100).toFixed(1):0;
  const obj={exam,test,date,platform,neg,total,negLoss,tc,tw,tu,accuracy,sections:sectionsArr};

  if(editIndex==null) tests.push(obj);
  else tests[editIndex]=obj;
  localStorage.setItem("tests",JSON.stringify(tests));
  editIndex=null;
  initSections();
  renderExamFilter();
  renderAll();
}

/* ---------------- EXAM FILTER ---------------- */
function renderExamFilter(){
  let exams=Array.from(new Set(tests.map(t=>t.exam)));
  examFilter.innerHTML=`<option value="ALL">All Exams</option>`+exams.map(e=>`<option value="${e}">${e}</option>`).join("");
  examFilter.onchange=renderAll;
}

/* ---------------- EXAM COUNTDOWN ---------------- */
function addCountdownUI(){
  countdownCard.innerHTML=`
    <h3>Exam Countdown ⏳</h3>
    <input id="countdownName" placeholder="Exam Name">
    <input id="countdownDate" type="date">
    <button onclick="addCountdown()">Add</button>
    <div id="countdownList"></div>
  `;
  renderCountdowns();
}
function addCountdown(){
  const name=document.getElementById("countdownName").value.trim();
  const date=document.getElementById("countdownDate").value;
  if(!name||!date){ alert("Fill both fields"); return; }
  examCountdowns.push({name,date});
  localStorage.setItem("examCountdowns",JSON.stringify(examCountdowns));
  renderCountdowns();
}
function renderCountdowns(){
  const list=document.getElementById("countdownList");
  list.innerHTML="";
  examCountdowns.forEach((e,i)=>{
    const days=Math.ceil((new Date(e.date)-new Date())/(1000*60*60*24));
    const div=document.createElement("div");
    div.innerHTML=`${e.name}: ${days>=0?days+" days left":"Exam passed"} <button onclick="editCountdown(${i})">✏</button> <button onclick="deleteCountdown(${i})">🗑</button>`;
    list.appendChild(div);
  });
}
function editCountdown(idx){
  const name=prompt("Edit Exam Name:",examCountdowns[idx].name);
  const date=prompt("Edit Exam Date:",examCountdowns[idx].date);
  if(name && date){
    examCountdowns[idx]={name,date};
    localStorage.setItem("examCountdowns",JSON.stringify(examCountdowns));
    renderCountdowns();
  }
}
function deleteCountdown(idx){
  if(confirm("Delete this exam countdown?")){
    examCountdowns.splice(idx,1);
    localStorage.setItem("examCountdowns",JSON.stringify(examCountdowns));
    renderCountdowns();
  }
}

/* ---------------- RENDER ALL ---------------- */
function renderAll(){
  tablesArea.innerHTML="";
  const filter=examFilter.value;
  const examsToShow=filter==="ALL"?Array.from(new Set(tests.map(t=>t.exam))):[filter];
  examsToShow.forEach(exam=>{
    const examTests=tests.filter(t=>t.exam===exam).sort((a,b)=>new Date(a.date)-new Date(b.date));
    if(!examTests.length) return;

    const totalMarks = examTests.map(t=>t.total);
    const avg = (totalMarks.reduce((a,b)=>a+b,0)/totalMarks.length).toFixed(1);

    const div=document.createElement("div");
    div.className="tableCard";
    div.innerHTML=`<h3>${exam} (Average: ${avg})</h3>`;
    const table=document.createElement("table");
    let sectionHeaders = [];
    if(examTests[0].sections.length>0) sectionHeaders = examTests[0].sections.map(s=>s.name);
    table.innerHTML=`<tr>
      <th>Test</th><th>Date</th><th>Platform</th><th>Total</th><th>Accuracy %</th>${sectionHeaders.map(s=>`<th>${s}</th>`).join("")}
    </tr>`;

    examTests.forEach((t,idx)=>{
      const tr=document.createElement("tr");
      tr.style.cursor="pointer";
      tr.innerHTML=`
        <td>${t.test}</td>
        <td>${formatDate(t.date)}</td>
        <td>${t.platform}</td>
        <td>${t.total}</td>
        <td>${t.accuracy}</td>
        ${t.sections.map(s=>`<td>${s.marks}</td>`).join("")}
      `;
      const minTotal=Math.min(...totalMarks);
      const maxTotal=Math.max(...totalMarks);
      if(t.total==minTotal) tr.classList.add("worst");
      if(t.total==maxTotal) tr.classList.add("best");
      tr.onclick=()=>showAnalysis(tr,t);
      table.appendChild(tr);
    });
    div.appendChild(table);
    tablesArea.appendChild(div);
  });
}

function formatDate(d){
  const dt=new Date(d);
  return `${("0"+dt.getDate()).slice(-2)}-${("0"+(dt.getMonth()+1)).slice(-2)}-${dt.getFullYear()}`;
}

/* ---------------- SHOW ANALYSIS ---------------- */
function showAnalysis(row,test){
  // remove previous analysis row if exists
  const nextRow = row.nextSibling;
  if(nextRow && nextRow.classList && nextRow.classList.contains("analysisRow")){
    nextRow.remove(); return;
  }
  const tr=document.createElement("tr");
  tr.className="analysisRow";
  const td=document.createElement("td");
  td.colSpan=row.children.length;
  td.innerHTML=`
    <div class="analysisDiv">
      <strong>Analysis for ${test.test}:</strong><br>
      Correct: ${test.tc} | Wrong: ${test.tw} | Unattempted: ${test.tu}<br>
      Negative Marks Lost: ${test.negLoss}<br>
      Feedback: ${autoFeedback(test)}
    </div>
  `;
  tr.appendChild(td);
  row.parentNode.insertBefore(tr,row.nextSibling);
}

/* ---------------- SMART FEEDBACK ---------------- */
function autoFeedback(t){
  const examTests = tests.filter(x => x.exam===t.exam).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const idx = examTests.indexOf(t);
  const prev = idx>0 ? examTests[idx-1]:null;
  let feedbackPool=[];
  if(!prev) feedbackPool.push("🧪 First test. Baseline established.");
  else{
    if(t.total>prev.total) feedbackPool.push("📈 Score improved from previous test.");
    else if(t.total<prev.total) feedbackPool.push("📉 Score dropped. Analyse mistakes.");
    else feedbackPool.push("➖ Score stagnant. Push accuracy.");
  }
  if(t.accuracy<60) feedbackPool.push("🎯 Accuracy is low. Focus on concepts.");
  else if(t.accuracy>80) feedbackPool.push("✅ Accuracy is strong.");
  else feedbackPool.push("⚖ Accuracy balanced.");
  if(t.negLoss>t.total*0.15) feedbackPool.push("❗ Negative marks are hurting score.");
  const target = targets[t.exam];
  if(target){
    const diff = t.total - target;
    if(diff>=10) feedbackPool.push("🔥 Well above target.");
    else if(diff>=0) feedbackPool.push("🎯 Target achieved.");
    else if(diff>-10) feedbackPool.push("🟡 Very close to target.");
    else feedbackPool.push("🚨 Far below target.");
  }
  const weak = t.sections.reduce((a,b)=>a.marks<b.marks?a:b).name;
  feedbackPool.push(`🧱 Weakest section: ${weak}`);
  const strategies=["Reduce risky guesses.","Focus on accuracy.","Prioritize weak sections.","Adjust time allocation.","Maintain consistency."];
  feedbackPool.push(strategies[Math.floor(Math.random()*strategies.length)]);
  if(!feedbackHistory[t.exam]) feedbackHistory[t.exam]=[];
  let finalFeedback = feedbackPool.find(f=>!feedbackHistory[t.exam].includes(f)) || feedbackPool[0];
  feedbackHistory[t.exam].push(finalFeedback);
  if(feedbackHistory[t.exam].length>6) feedbackHistory[t.exam].shift();
  localStorage.setItem("feedbackHistory",JSON.stringify(feedbackHistory));
  return finalFeedback;
}

/* ---------------- GRAPH ---------------- */
function toggleGraph(){
  if(graphCard.style.display=="none") graphCard.style.display="block";
  else{ graphCard.style.display="none"; return; }
  const exam=examFilter.value;
  const examTests=tests.filter(t=>t.exam===exam).sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(!examTests.length) return;

  const labels=examTests.map(t=>t.test);
  const totals=examTests.map(t=>t.total);

  if(chartInstance) chartInstance.destroy();
  const ctx=document.getElementById("examGraph").getContext("2d");
  chartInstance = new Chart(ctx,{
    type:'line',
    data:{labels, datasets:[{label:"Total Marks",data:totals,borderColor:"blue",fill:false}]},
    options:{responsive:true,maintainAspectRatio:false}
  });
}

/* ---------------- EXPORT ---------------- */
function exportExcel(){
  let csv="Exam,Test,Date,Platform,Total,Accuracy";
  tests.forEach(t=>{
    csv+=`\n${t.exam},${t.test},${formatDate(t.date)},${t.platform},${t.total},${t.accuracy}`;
  });
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="mock_marks.csv"; a.click();
}

function exportPDF(){
  const printWindow = window.open('', '_blank');
  printWindow.document.write('<html><head><title>Mock Marks</title></head><body>');
  printWindow.document.write(tablesArea.innerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
}
