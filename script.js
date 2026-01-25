let tests = JSON.parse(localStorage.getItem("tests")) || [];
let editIndex = null;

init();

function init(){
  initSections();
  renderAll();
}

/* -------- SECTIONS INPUT -------- */
function initSections(){
  sections.innerHTML="";
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

/* -------- SAVE TEST -------- */
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
  editIndex=null;
  initSections();
  renderAll();
}

/* -------- DROPDOWN -------- */
function renderAll(){
  renderDropdown();
  renderTables();
  detailBox.style.display="none";
}

function renderDropdown(){
  const exams=[...new Set(tests.map(t=>t.exam))];
  examFilter.innerHTML=`<option value="ALL">All Exams</option>`;
  exams.forEach(e=>examFilter.innerHTML+=`<option>${e}</option>`);
}

/* -------- TABLE WITH SECTION MARKS -------- */
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

    const secNames=[...new Set(arr.flatMap(t=>t.sections.map(s=>s.name)))];

    const card=document.createElement("div");
    card.className="tableCard";
    card.innerHTML=`<h3>${exam}</h3>`;
    tablesArea.appendChild(card);

    const table=document.createElement("table");
    card.appendChild(table);

    let head=`<tr><th>#</th><th>Date</th><th>Test</th>`;
    secNames.forEach(s=>head+=`<th>${s}</th>`);
    head+=`<th>Total</th><th>Action</th></tr>`;
    table.innerHTML=head;

    arr.forEach((t,i)=>{
      let row=`<tr>
        <td>${i+1}</td>
        <td>${t.date}</td>
        <td>${t.test}</td>`;

      secNames.forEach(s=>{
        const f=t.sections.find(x=>x.name===s);
        row+=`<td>${f?f.marks:"-"}</td>`;
      });

      row+=`<td>${t.total}</td>
      <td>
        <button onclick="viewDetail('${exam}',${i})">👁</button>
        <button onclick="editTest('${exam}',${i})">✏</button>
        <button onclick="deleteTest('${exam}',${i})">🗑</button>
      </td></tr>`;

      table.innerHTML+=row;
    });
  }
}

/* -------- VIEW DETAILS BELOW TABLE -------- */
function viewDetail(exam,idx){
  const arr=tests.filter(t=>t.exam===exam);
  const t=arr[idx];

  let html=`<h3>${t.test} — ${t.date}</h3>`;
  html+=`<b>Total:</b> ${t.total}<hr>`;

  t.sections.forEach(s=>{
    html+=`
      <b>${s.name}</b> →
      Correct: ${s.c},
      Wrong: ${s.w},
      Unattempted: ${s.u},
      Marks: ${s.marks}
      <br>`;
  });

  detailBox.innerHTML=html;
  detailBox.style.display="block";
  detailBox.scrollIntoView({behavior:"smooth"});
}

/* -------- EDIT -------- */
function editTest(exam,idx){
  const arr=tests.filter(t=>t.exam===exam);
  const t=arr[idx];
  editIndex=tests.indexOf(t);

  examName.value=t.exam;
  testName.value=t.test;
  testDate.value=t.date;

  sections.innerHTML="";
  t.sections.forEach(s=>addSection(s.name,s.c,s.w,s.u));
  window.scrollTo(0,0);
}

/* -------- DELETE -------- */
function deleteTest(exam,idx){
  if(!confirm("Delete this test?"))return;
  const arr=tests.filter(t=>t.exam===exam);
  const real=tests.indexOf(arr[idx]);
  tests.splice(real,1);
  localStorage.setItem("tests",JSON.stringify(tests));
  renderAll();
}

/* -------- GRAPH -------- */
function showGraph(){
  document.querySelector(".container").style.display="none";
  tablesArea.style.display="none";
  detailBox.style.display="none";
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
