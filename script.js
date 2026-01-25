let tests = JSON.parse(localStorage.getItem("tests")) || [];
let editIndex = null;

init();

function init(){
  initSections();
  renderAll();
}

/* -------- SECTIONS -------- */
function initSections(){
  const s = document.getElementById("sections");
  s.innerHTML="";
  addSection(); addSection(); addSection();
}

function addSection(name="",c=0,w=0,u=0){
  const d=document.createElement("div");
  d.className="sectionRow";
  d.innerHTML=`
    <input placeholder="Section" value="${name}">
    <input type="number" placeholder="C" value="${c}">
    <input type="number" placeholder="W" value="${w}">
    <input type="number" placeholder="U" value="${u}">
  `;
  sections.appendChild(d);
}

/* -------- SAVE -------- */
function saveTest(){
  const exam=examName.value.trim();
  const test=testName.value.trim();
  const date=testDate.value;

  if(!exam||!test||!date){alert("Fill all details");return;}

  let sectionsArr=[], total=0;

  document.querySelectorAll(".sectionRow").forEach(r=>{
    const name=r.children[0].value||"Section";
    const c=+r.children[1].value||0;
    const w=+r.children[2].value||0;
    const u=+r.children[3].value||0;
    const marks=c*2-w;
    total+=marks;
    sectionsArr.push({name,c,w,u,marks});
  });

  const obj={exam,test,date,total,sections:sectionsArr};

  if(editIndex==null) tests.push(obj);
  else tests[editIndex]=obj;

  localStorage.setItem("tests",JSON.stringify(tests));
  editIndex=null; initSections(); renderAll();
}

/* -------- DROPDOWN + TABLE -------- */
function renderAll(){
  renderDropdown();
  renderTables();
}

function renderDropdown(){
  const sel=examFilter;
  const exams=[...new Set(tests.map(t=>t.exam))];
  sel.innerHTML=`<option value="ALL">All Exams</option>`;
  exams.forEach(e=>sel.innerHTML+=`<option>${e}</option>`);
}

function renderTables(){
  tablesArea.innerHTML="";
  const filter=examFilter.value;

  const grouped={};
  tests.forEach(t=>{
    if(filter!=="ALL"&&t.exam!==filter)return;
    grouped[t.exam]=grouped[t.exam]||[];
    grouped[t.exam].push(t);
  });

  for(const exam in grouped){
    const arr=grouped[exam].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const best=Math.max(...arr.map(t=>t.total));
    const worst=Math.min(...arr.map(t=>t.total));

    const card=document.createElement("div");
    card.className="tableCard";
    card.innerHTML=`<h3>${exam}</h3>`;
    tablesArea.appendChild(card);

    const table=document.createElement("table");
    card.appendChild(table);
    table.innerHTML=`<tr><th>#</th><th>Date</th><th>Test</th><th>Total</th><th>View</th></tr>`;

    arr.forEach((t,i)=>{
      const cls=t.total==best?"best":t.total==worst?"worst":"";
      table.innerHTML+=`
      <tr class="${cls}">
        <td>${i+1}</td>
        <td>${t.date}</td>
        <td>${t.test}</td>
        <td>${t.total}</td>
        <td><button onclick="viewDetail('${exam}',${i})">👁</button></td>
      </tr>`;
    });
  }
}

/* -------- DETAIL VIEW -------- */
function viewDetail(exam,idx){
  const arr=tests.filter(t=>t.exam===exam);
  const t=arr[idx];

  detailTitle.innerText=t.test+" ("+t.date+")";

  let html=`<b>Total:</b> ${t.total}<hr>`;
  t.sections.forEach(s=>{
    html+=`<b>${s.name}</b> — Marks:${s.marks} | C:${s.c} W:${s.w} U:${s.u}<br>`;
  });

  detailBody.innerHTML=html;
  detailModal.style.display="flex";
}

function closeDetail(){detailModal.style.display="none";}

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
  let arr=tests.filter(t=>exam==="ALL"||t.exam===exam);
  arr.sort((a,b)=>new Date(a.date)-new Date(b.date));

  const labels=arr.map(t=>t.test);
  const data=arr.map(t=>t.total);

  if(window.chart)window.chart.destroy();

  window.chart=new Chart(graph,{
    type:"line",
    data:{labels,datasets:[{label:"Marks",data,fill:true,tension:.3}]},
    options:{responsive:true,scales:{y:{beginAtZero:true}}}
  });
}
