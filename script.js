let tests = JSON.parse(localStorage.getItem("tests")) || [];
let editIndex = null;

init();

/* ---------------- INIT ---------------- */
function init(){
  initSections();
  renderDropdown();
  renderTables();
}

/* ---------------- SECTIONS ---------------- */
function initSections(){
  const s = document.getElementById("sections");
  s.innerHTML = "";
  addSection();
  addSection();
  addSection();
}

function addSection(name="", marks=0){
  const div = document.createElement("div");
  div.className = "sectionRow";
  div.innerHTML = `
    <input placeholder="Section Name" value="${name}">
    <input type="number" value="${marks}">
  `;
  document.getElementById("sections").appendChild(div);
}

/* ---------------- SAVE ---------------- */
function saveTest(){

  const exam = document.getElementById("examName").value.trim();
  const test = document.getElementById("testName").value.trim();
  const date = document.getElementById("testDate").value;

  if(!exam || !test || !date){
    alert("Fill all details");
    return;
  }

  const rows = document.querySelectorAll(".sectionRow");
  let sections = [];
  let total = 0;

  rows.forEach(r=>{
    const name = r.children[0].value || "Section";
    const marks = Number(r.children[1].value) || 0;
    total += marks;
    sections.push({name, marks});
  });

  const obj = {exam, test, date, total, sections};

  if(editIndex===null) tests.push(obj);
  else tests[editIndex]=obj;

  localStorage.setItem("tests", JSON.stringify(tests));

  editIndex=null;
  initSections();
  renderDropdown();
  renderTables();
}

/* ---------------- DROPDOWN ---------------- */
function renderDropdown(){
  const sel = document.getElementById("examFilter");
  const exams = [...new Set(tests.map(t=>t.exam))];

  const current = sel.value;

  sel.innerHTML = `<option value="ALL">All Exams</option>`;
  exams.forEach(e=>{
    const o=document.createElement("option");
    o.value=e; o.textContent=e;
    sel.appendChild(o);
  });

  if(exams.includes(current)) sel.value = current;
}

/* ---------------- TABLE ---------------- */
function renderTables(){

  const area = document.getElementById("tablesArea");
  area.innerHTML="";

  const filter = document.getElementById("examFilter").value;

  tests.sort((a,b)=> new Date(a.date)-new Date(b.date));

  const grouped = {};
  tests.forEach(t=>{
    if(!grouped[t.exam]) grouped[t.exam]=[];
    grouped[t.exam].push(t);
  });

  for(const exam in grouped){

    if(filter!=="ALL" && filter!==exam) continue;

    const arr = grouped[exam];
    const best = Math.max(...arr.map(t=>t.total));
    const worst = Math.min(...arr.map(t=>t.total));
    const avg = arr.reduce((a,t)=>a+t.total,0)/arr.length;

    const card=document.createElement("div");
    card.className="tableCard";
    card.innerHTML=`<h3>${exam} (Avg: ${avg.toFixed(1)})</h3>`;
    area.appendChild(card);

    const table=document.createElement("table");
    card.appendChild(table);

    const secNames=[...new Set(arr.flatMap(t=>t.sections.map(s=>s.name)))];

    let head="<tr><th>Sr</th><th>Date</th><th>Test</th>";
    secNames.forEach(s=>head+=`<th>${s}</th>`);
    head+="<th>Total</th><th>Action</th></tr>";

    table.innerHTML=head;

    arr.forEach((t,i)=>{

      const d=new Date(t.date);
      const fd=`${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;

      let cls="";
      if(t.total===best) cls="best";
      if(t.total===worst) cls="worst";

      let row=`<tr class="${cls}">
        <td>${i+1}</td>
        <td>${fd}</td>
        <td>${t.test}</td>`;

      secNames.forEach(s=>{
        const f=t.sections.find(x=>x.name===s);
        row+=`<td>${f?f.marks:"-"}</td>`;
      });

      row+=`<td>${t.total}</td>`;

      row+=`<td>
        <button onclick="editTest('${exam}',${i})">✏</button>
        <button onclick="deleteTest('${exam}',${i})">🗑</button>
      </td></tr>`;

      table.innerHTML+=row;
    });
  }
}

/* ---------------- EDIT ---------------- */
function editTest(exam,idx){
  const arr=tests.filter(t=>t.exam===exam);
  const t=arr[idx];
  editIndex=tests.indexOf(t);

  examName.value=t.exam;
  testName.value=t.test;
  testDate.value=t.date;

  const s=document.getElementById("sections");
  s.innerHTML="";
  t.sections.forEach(x=>addSection(x.name,x.marks));
}

/* ---------------- DELETE ---------------- */
function deleteTest(exam,idx){
  if(!confirm("Delete test?")) return;
  const arr=tests.filter(t=>t.exam===exam);
  const real=tests.indexOf(arr[idx]);
  tests.splice(real,1);
  localStorage.setItem("tests",JSON.stringify(tests));
  renderDropdown();
  renderTables();
}

/* ---------------- GRAPH ---------------- */
function showGraph(){
  document.querySelector(".container").style.display="none";
  document.getElementById("tablesArea").style.display="none";
  document.getElementById("graphPage").style.display="block";
  drawGraph();
}

function hideGraph(){
  document.querySelector(".container").style.display="block";
  document.getElementById("tablesArea").style.display="block";
  document.getElementById("graphPage").style.display="none";
}

/* ✅ FIXED GRAPH — ONLY SELECTED EXAM */
function drawGraph(){

  const exam = document.getElementById("examFilter").value;

  let filtered = tests;

  if(exam !== "ALL"){
    filtered = tests.filter(t => t.exam === exam);
  }

  if(filtered.length === 0){
    return;
  }

  const sorted=[...filtered].sort((a,b)=>new Date(a.date)-new Date(b.date));

  const labels=sorted.map(t=>t.test);
  const data=sorted.map(t=>t.total);

  const ctx=document.getElementById("graph");

  if(window.chart) window.chart.destroy();

  window.chart=new Chart(ctx,{
    type:"line",
    data:{
      labels,
      datasets:[{
        label: exam==="ALL" ? "All Exams" : exam + " Marks",
        data,
        fill:true,
        tension:0.3
      }]
    },
    options:{responsive:true,scales:{y:{beginAtZero:true}}}
  });
}
