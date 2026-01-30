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

let qIndex = 0;

/* ---------------- DATA ---------------- */
let tests = JSON.parse(localStorage.getItem("tests")) || [];
let editIndex = null;
let targets = JSON.parse(localStorage.getItem("targets")) || {};
let feedbackHistory = JSON.parse(localStorage.getItem("feedbackHistory")) || {};

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
  setInterval(rotateQuotes, 60000);

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
  addExportButtons();
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
  labelRow.innerHTML=`<span>Section</span><span>Marks</span><span>Correct</span><span>Wrong</span><span>Unattempted</span><span></span>`;
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
  if(rows.length <= 1){
    alert("At least one section is required.");
    return;
  }
  btn.parentElement.remove();
}

/* -------- SAVE -------- */
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

    total+=marks;
    tc+=c; tw+=w; tu+=u;

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

/* ================== SMART FEEDBACK (ONLY LOGIC CHANGE) ================== */
function autoFeedback(t){

  const examTests = tests
    .filter(x => x.exam === t.exam)
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  const idx = examTests.indexOf(t);
  const prev = idx > 0 ? examTests[idx-1] : null;

  let feedbackPool = [];

  if(!prev){
    feedbackPool.push("🧪 First test for this exam. This becomes your baseline.");
  }else{
    if(t.total > prev.total)
      feedbackPool.push("📈 Score improved from previous test. Strategy is moving in right direction.");
    else if(t.total < prev.total)
      feedbackPool.push("📉 Score dropped compared to last test. Analyse mistakes deeply.");
    else
      feedbackPool.push("➖ Score stagnant. Push either attempts or accuracy consciously.");
  }

  if(t.accuracy < 60)
    feedbackPool.push("🎯 Accuracy is risky. Reduce guesses and focus on concepts.");
  else if(t.accuracy > 80)
    feedbackPool.push("✅ Accuracy is strong. You can safely increase attempts.");
  else
    feedbackPool.push("⚖ Accuracy balanced. Maintain same approach.");

  if(t.negLoss > t.total * 0.15)
    feedbackPool.push("❗ Negative marks are hurting your score badly.");
  else
    feedbackPool.push("🛡 Negative marks are under control.");

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

  let finalFeedback =
    feedbackPool.find(f => !feedbackHistory[t.exam].includes(f)) || feedbackPool[0];

  feedbackHistory[t.exam].push(finalFeedback);
  if(feedbackHistory[t.exam].length > 6)
    feedbackHistory[t.exam].shift();

  localStorage.setItem("feedbackHistory", JSON.stringify(feedbackHistory));
  return finalFeedback;
}

/* ================== EVERYTHING BELOW IS UNCHANGED ================== */

function renderAll(){
  renderDropdown();
  renderTables();
  drawGraph();
}

function renderDropdown(){
  const exams=[...new Set(tests.map(t=>t.exam))];
  const cur=examFilter.value;
  examFilter.innerHTML=`<option value="ALL">All Exams</option>`;
  exams.forEach(e=>examFilter.innerHTML+=`<option>${e}</option>`);
  if(exams.includes(cur)) examFilter.value=cur;
}

/* -------- TABLE RENDER -------- */
function renderTables(){
  tablesArea.innerHTML="";
  const filter=examFilter.value;

  const grouped={};
  tests.forEach(t=>{
    if(filter!=="ALL" && t.exam!==filter) return;
    if(!grouped[t.exam]) grouped[t.exam]=[];
    grouped[t.exam].push(t);
  });

  for(const exam in grouped){
    const arr=grouped[exam].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const best=Math.max(...arr.map(t=>t.total));
    const worst=Math.min(...arr.map(t=>t.total));
    const avg=(arr.reduce((a,t)=>a+t.total,0)/arr.length).toFixed(1);

    const card=document.createElement("div");
    card.className="tableCard";
    card.innerHTML=`<h3>${exam} | Avg: ${avg}</h3>`;
    tablesArea.appendChild(card);

    const table=document.createElement("table"); 
    card.appendChild(table);

    const baseSections = arr[0].sections;
    const orderedNames = [];

    FIXED_ORDER.forEach(n=>{
      if(baseSections.find(s=>norm(s.name)===n)) orderedNames.push(n);
    });
    baseSections.forEach(s=>{
      if(!orderedNames.includes(norm(s.name))) orderedNames.push(norm(s.name));
    });

    let head=`<tr><th>Sr</th><th>Date</th><th>Test</th><th>Platform</th>`;
    orderedNames.forEach(n=>head+=`<th>${n}</th>`);
    head+=`<th>Total</th><th>Acc%</th><th>Action</th></tr>`;
    table.innerHTML=head;

    arr.forEach((t,i)=>{
      const d=new Date(t.date);
      const fd=`${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
      let cls=t.total===best?"best":t.total===worst?"worst":"";

      const map={};
      t.sections.forEach(s=>map[norm(s.name)] = s);

      let row=`<tr class="${cls}">
        <td>${i+1}</td><td>${fd}</td><td>${t.test}</td><td>${t.platform}</td>`;

      orderedNames.forEach(n=>{
        row+=`<td>${map[n]?map[n].marks:0}</td>`;
      });

      row+=`<td>${t.total}</td><td>${t.accuracy}%</td>
      <td>
        <button onclick="toggleDetail(this)">View</button>
        <button onclick="editTest('${exam}',${i})">✏</button>
        <button onclick="deleteTest('${exam}',${i})">🗑</button>
      </td></tr>`;

      const weak = t.sections.reduce((a,b)=>a.marks<b.marks?a:b).name;

      let detail=`<tr class="detailRow" style="display:none">
        <td colspan="${7+orderedNames.length}">
        <b>Section-wise Details:</b><br>`;

      orderedNames.forEach(n=>{
        const x = map[n] || {c:0,w:0,u:0};
        const acc = x.c+x.w>0 ? ((x.c/(x.c+x.w))*100).toFixed(1) : 0;
        detail+=`${n} → C:${x.c}, W:${x.w}, U:${x.u}, Acc:${acc}% | `;
      });

      detail+=`<br><b>Total:</b> C:${t.tc}, W:${t.tw}, U:${t.tu}
        | <b>Negative Loss:</b> ${t.negLoss}
        | <b>Weakest Section:</b> ${weak}
        | <b>Feedback:</b> ${autoFeedback(t)}
        </td></tr>`;

      table.innerHTML+=row+detail;
    });
  }
}

function toggleDetail(btn){
  const r=btn.closest("tr").nextElementSibling;
  r.style.display=r.style.display==="none"?"table-row":"none";
}

/* -------- EDIT / DELETE -------- */
function editTest(exam,idx){
  const arr=tests.filter(t=>t.exam===exam);
  const t=arr[idx];
  editIndex=tests.indexOf(t);

  examName.value=t.exam;
  testName.value=t.test;
  testDate.value=t.date;
  platformName.value=t.platform;
  negativeMark.value=t.neg;

  sections.innerHTML="";
  const labelRow = document.createElement("div");
  labelRow.className="sectionLabels";
  labelRow.innerHTML=`<span>Section</span><span>Marks</span><span>Correct</span><span>Wrong</span><span>Unattempted</span><span></span>`;
  sections.appendChild(labelRow);

  t.sections.forEach(s=>addSection(s.name,s.marks,s.c,s.w,s.u));
}

function deleteTest(exam,idx){
  if(!confirm("Delete test?")) return;
  const arr=tests.filter(t=>t.exam===exam);
  tests.splice(tests.indexOf(arr[idx]),1);
  localStorage.setItem("tests",JSON.stringify(tests));
  renderAll();
}

/* -------- GRAPH -------- */
function showGraph(){
  document.querySelector(".container").style.display="none";
  tablesArea.style.display="none";
  graphPage.style.display="block";
  drawGraph();
}

function hideGraph(){
  document.querySelector(".container").style.display="block";
  tablesArea.style.display="block";
  graphPage.style.display="none";
}

function drawGraph(){
  const exam=examFilter.value;
  let dataArr=tests.filter(t=>exam==="ALL"||t.exam===exam);
  if(dataArr.length===0) return;

  dataArr=dataArr.sort((a,b)=>new Date(a.date)-new Date(b.date));
  const labels=dataArr.map(t=>t.test);
  const totals=dataArr.map(t=>t.total);

  const target = targets[exam] || null;
  const targetLine = target ? dataArr.map(()=>target) : [];

  if(window.chart) window.chart.destroy();

  const datasets=[{label:"Total Marks",data:totals,fill:true,tension:0.3}];

  if(target){
    datasets.push({label:"Target",data:targetLine,borderDash:[5,5]});
  }

  window.chart=new Chart(graph,{
    type:"line",
    data:{labels,datasets},
    options:{responsive:true,scales:{y:{beginAtZero:true}}}
  });
}

/* -------- EXPORT -------- */
function addExportButtons(){
  const box=document.createElement("div");
  box.innerHTML=`
    <br>
    <button onclick="exportPDF()">Export PDF 📄</button>
    <button onclick="exportExcel()">Export Excel 📊</button>
  `;
  document.querySelector(".card").appendChild(box);
}

function exportPDF(){
  if(tablesArea.innerHTML.trim()===""){ alert("No data"); return; }
  const win = window.open("", "", "width=900,height=650");
  win.document.write(`<html><head><title>Mock Report</title>
  <style>
    body{font-family:Arial;padding:20px;}
    table{width:100%;border-collapse:collapse;margin-bottom:25px;}
    th,td{border:1px solid #333;padding:6px;text-align:center;}
  </style></head><body>${tablesArea.innerHTML}</body></html>`);
  win.document.close(); win.print();
}

function exportExcel(){
  if(tests.length===0){ alert("No data"); return; }

  let sheets = {};
  tests.forEach(t=>{
    if(!sheets[t.exam]) sheets[t.exam] = [];
    sheets[t.exam].push(t);
  });

  let xml = `<?xml version="1.0"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">`;

  for(const exam in sheets){
    xml += `<Worksheet ss:Name="${exam}"><Table>`;
    xml += `<Row>
      <Cell><Data ss:Type="String">Date</Data></Cell>
      <Cell><Data ss:Type="String">Test</Data></Cell>
      <Cell><Data ss:Type="String">Platform</Data></Cell>
      <Cell><Data ss:Type="Number">Total</Data></Cell>
      <Cell><Data ss:Type="Number">Accuracy</Data></Cell>
    </Row>`;

    sheets[exam].forEach(t=>{
      xml += `<Row>
        <Cell><Data ss:Type="String">${t.date}</Data></Cell>
        <Cell><Data ss:Type="String">${t.test}</Data></Cell>
        <Cell><Data ss:Type="String">${t.platform}</Data></Cell>
        <Cell><Data ss:Type="Number">${t.total}</Data></Cell>
        <Cell><Data ss:Type="Number">${t.accuracy}</Data></Cell>
      </Row>`;
    });

    xml += `</Table></Worksheet>`;
  }

  xml += `</Workbook>`;

  const blob = new Blob([xml], {type: "application/vnd.ms-excel"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Mock_Analysis.xls";
  a.click();
}
