let tests = JSON.parse(localStorage.getItem("tests")) || [];
let editIndex = null;
let chart = null;

init();

function init(){
  initSections();
  renderDropdown();
  renderTables();
}

/* -------- SECTIONS -------- */
function initSections(){
  const s = document.getElementById("sections");
  s.innerHTML = "";
  addSection(); addSection(); addSection();
}

function addSection(name="", marks=0, c=0, w=0, u=0){
  const div = document.createElement("div");
  div.className = "sectionRow";
  div.innerHTML = `
    <input value="${name}" placeholder="Section">
    <input type="number" value="${marks}">
    <input type="number" value="${c}">
    <input type="number" value="${w}">
    <input type="number" value="${u}">
  `;
  document.getElementById("sections").appendChild(div);
}

/* -------- SAVE -------- */
function saveTest(){

  const exam = examName.value.trim();
  const test = testName.value.trim();
  const platform = platformName.value.trim();
  const date = testDate.value;
  const neg = Number(negMark.value) || 0;

  if(!exam || !test || !date){
    alert("Fill all details");
    return;
  }

  const rows = document.querySelectorAll(".sectionRow");
  let sections = [];
  let total = 0, tc=0, tw=0, tu=0;

  rows.forEach(r=>{
    const s = r.children[0].value || "Section";
    const m = Number(r.children[1].value)||0;
    const c = Number(r.children[2].value)||0;
    const w = Number(r.children[3].value)||0;
    const u = Number(r.children[4].value)||0;

    total += m - (w * neg);
    tc+=c; tw+=w; tu+=u;

    sections.push({s,m,c,w,u});
  });

  const obj={exam,test,platform,date,neg,total,tc,tw,tu,sections};

  if(editIndex===null) tests.push(obj);
  else tests[editIndex]=obj;

  localStorage.setItem("tests",JSON.stringify(tests));
  editIndex=null;
  initSections();
  renderDropdown();
  renderTables();
}

/* -------- DROPDOWN -------- */
function renderDropdown(){
  const sel=examFilter;
  const exams=[...new Set(tests.map(t=>t.exam))];
  const cur=sel.value;

  sel.innerHTML=`<option value="ALL">All Exams</option>`;
  exams.forEach(e=>sel.add(new Option(e,e)));
  if(exams.includes(cur)) sel.value=cur;
}

/* -------- TABLE -------- */
function renderTables(){

  const area=tablesArea;
  area.innerHTML="";
  const filter=examFilter.value;

  const grouped={};
  tests.forEach(t=>{
    if(!grouped[t.exam]) grouped[t.exam]=[];
    grouped[t.exam].push(t);
  });

  for(const exam in grouped){

    if(filter!=="ALL" && filter!==exam) continue;

    const arr=[...grouped[exam]].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const best=Math.max(...arr.map(t=>t.total));
    const worst=Math.min(...arr.map(t=>t.total));
    const avg=(arr.reduce((a,t)=>a+t.total,0)/arr.length).toFixed(1);

    const card=document.createElement("div");
    card.className="tableCard";
    card.innerHTML=`<h3>${exam} | Avg: ${avg}</h3>`;
    area.appendChild(card);

    const table=document.createElement("table");
    card.appendChild(table);

    let head=`<tr><th>Sr</th><th>Date</th><th>Test</th><th>Platform</th><th>Total</th><th>View</th><th>Edit</th><th>Del</th></tr>`;
    table.innerHTML=head;

    arr.forEach((t,i)=>{
      const d=new Date(t.date);
      const fd=`${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;

      let cls="";
      if(t.total===best) cls="best";
      if(t.total===worst) cls="worst";

      table.innerHTML+=`
      <tr class="${cls}">
        <td>${i+1}</td><td>${fd}</td><td>${t.test}</td><td>${t.platform}</td>
        <td>${t.total.toFixed(2)}</td>
        <td><button onclick="toggleDetails('${exam}',${i})">👁</button></td>
        <td><button onclick="editTest('${exam}',${i})">✏</button></td>
        <td><button onclick="deleteTest('${exam}',${i})">🗑</button></td>
      </tr>
      <tr id="det-${exam}-${i}" class="detailsRow" style="display:none">
        <td colspan="8">
          ${t.sections.map(s=>`
            <b>${s.s}</b> → Marks:${s.m} | C:${s.c} W:${s.w} U:${s.u}
          `).join("<br>")}
          <hr>
          Total → C:${t.tc} W:${t.tw} U:${t.tu}
        </td>
      </tr>`;
    });
  }
}

/* -------- DETAILS -------- */
function toggleDetails(exam,idx){
  const el=document.getElementById(`det-${exam}-${idx}`);
  el.style.display = el.style.display==="none" ? "table-row" : "none";
}

/* -------- EDIT -------- */
function editTest(exam,idx){
  const arr=tests.filter(t=>t.exam===exam);
  const t=arr[idx];
  editIndex=tests.indexOf(t);

  examName.value=t.exam;
  testName.value=t.test;
  platformName.value=t.platform;
  testDate.value=t.date;
  negMark.value=t.neg;

  sections.innerHTML="";
  t.sections.forEach(s=>addSection(s.s,s.m,s.c,s.w,s.u));
}

/* -------- DELETE -------- */
function deleteTest(exam,idx){
  if(!confirm("Delete test?")) return;
  const arr=tests.filter(t=>t.exam===exam);
  const real=tests.indexOf(arr[idx]);
  tests.splice(real,1);
  localStorage.setItem("tests",JSON.stringify(tests));
  renderDropdown(); renderTables();
}

/* -------- GRAPH -------- */
function showGraph(){
  document.querySelector(".container").style.display="none";
  tablesArea.style.display="none";
  graphPage.style.display="block";
  renderGraph();
}

function hideGraph(){
  document.querySelector(".container").style.display="block";
  tablesArea.style.display="block";
  graphPage.style.display="none";
}

function renderGraph(){

  const exam=examFilter.value;
  let data=tests;
  if(exam!=="ALL") data=tests.filter(t=>t.exam===exam);

  if(chart) chart.destroy();

  const sorted=[...data].sort((a,b)=>new Date(a.date)-new Date(b.date));

  chart=new Chart(graph,{
    type:"line",
    data:{
      labels:sorted.map(t=>t.test),
      datasets:[{label:"Total Marks",data:sorted.map(t=>t.total),fill:true,tension:0.3}]
    },
    options:{scales:{y:{beginAtZero:true}}}
  });
}
