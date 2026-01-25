/* ---------------- QUOTES ROTATION ---------------- */

const quotes = [
"Don’t stop when you’re tired; stop when you are finally done. The discipline you find today builds the freedom you enjoy tomorrow.",
"A mountain of books is just a series of single pages waiting to be turned. Focus on the progress of the hour, not the pressure of the exam.",
"Be the person your future self will look back on and thank for not quitting. The work is temporary, but the result stays forever.",
"Motivation gets you to the desk, but habit is what keeps the pen moving. Small sessions of deep focus beat long hours of distracted scrolling.",
"You aren't just studying a subject; you are upgrading your own mind. Invest in your brain now—it’s the only asset that never loses its value.",
"Suffer the boredom of study now, or suffer the sting of regret later.",
"While you are resting, someone else is working to take your spot. Don't study to beat others; study so that no one can ignore your talent.",
"Study when you are inspired, but study harder when you are not. Consistency means letting your schedule, not your mood, run your day.",
"Don't look at the peak of the mountain; just look at your next step. Winning the day is the only way to eventually win the entire year.",
"Greatness isn't a grand act; it is simply a series of small wins stacked together. True mastery is found in the quiet work you do when nobody is watching."
];

let qIndex = 0;

/* Elements */
const quoteEl = document.getElementById("quoteText");
const sections = document.getElementById("sections");
const examFilter = document.getElementById("examFilter");
const examName = document.getElementById("examName");
const testName = document.getElementById("testName");
const testDate = document.getElementById("testDate");
const platformName = document.getElementById("platformName");
const negativeMark = document.getElementById("negativeMark");
const tablesArea = document.getElementById("tablesArea");
const graphPage = document.getElementById("graphPage");

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

setInterval(rotateQuotes, 60000);
window.addEventListener("load", rotateQuotes);

/* ---------------- DATA ---------------- */
let tests = JSON.parse(localStorage.getItem("tests")) || [];
let editIndex = null;

init();

function init(){
  initSections();
  renderAll();
}

/* -------- SECTIONS -------- */
function initSections(){
  sections.innerHTML="";

  // Add a single label row on top
  const labelRow = document.createElement("div");
  labelRow.className="sectionLabels";
  labelRow.innerHTML=`<span>Section</span><span>Marks</span><span>Correct</span><span>Wrong</span><span>Unattempted</span>`;
  sections.appendChild(labelRow);

  // Add 3 default section input rows
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
  `;
  sections.appendChild(d);
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

    total += marks;
    tc+=c; tw+=w; tu+=u;

    sectionsArr.push({name,marks,c,w,u});
  });

  const negLoss = tw * neg;

  const obj={exam,test,date,platform,neg,total,negLoss,tc,tw,tu,sections:sectionsArr};

  if(editIndex==null) tests.push(obj);
  else tests[editIndex]=obj;

  localStorage.setItem("tests",JSON.stringify(tests));
  editIndex=null;
  initSections();
  renderAll();
}

/* -------- DROPDOWN & TABLE -------- */
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

    const table=document.createElement("table"); card.appendChild(table);

    let head=`<tr><th>Sr</th><th>Date</th><th>Test</th><th>Platform</th>`;
    arr[0].sections.forEach(s=>head+=`<th>${s.name}</th>`);
    head+=`<th>Total</th><th>Action</th></tr>`;
    table.innerHTML=head;

    arr.forEach((t,i)=>{
      const d=new Date(t.date);
      const fd=`${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
      let cls=t.total===best?"best":t.total===worst?"worst":"";

      let row=`<tr class="${cls}">
        <td>${i+1}</td><td>${fd}</td><td>${t.test}</td><td>${t.platform}</td>`;
      t.sections.forEach(s=>row+=`<td>${s.marks}</td>`);
      row+=`<td>${t.total}</td>
      <td>
        <button onclick="toggleDetail(this)">View</button>
        <button onclick="editTest('${exam}',${i})">✏</button>
        <button onclick="deleteTest('${exam}',${i})">🗑</button>
      </td></tr>`;

      const weak = t.sections.reduce((a,b)=>a.marks<b.marks?a:b).name;

      let detail=`<tr class="detailRow" style="display:none">
        <td colspan="${6+t.sections.length}">
        <b>Section-wise Details:</b><br>`;

      t.sections.forEach(s=>{
        detail+=`${s.name} → C:${s.c}, W:${s.w}, U:${s.u} | `;
      });

      detail+=`<br><b>Total:</b> C:${t.tc}, W:${t.tw}, U:${t.tu}
        | <b>Negative Loss:</b> ${t.negLoss}
        | <b>Weakest Section:</b> ${weak}
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
  // re-add label row
  const labelRow = document.createElement("div");
  labelRow.className="sectionLabels";
  labelRow.innerHTML=`<span>Section</span><span>Marks</span><span>Correct</span><span>Wrong</span><span>Unattempted</span>`;
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
  const data=dataArr.map(t=>t.total);

  if(window.chart) window.chart.destroy();

  window.chart=new Chart(graph,{
    type:"line",
    data:{labels,datasets:[{label:"Total Marks",data,fill:true,tension:0.3}]},
    options:{responsive:true,scales:{y:{beginAtZero:true}}}
  });
}
