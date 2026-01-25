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
  addSection();addSection();addSection();
}

function addSection(n="",m=0,c=0,w=0,u=0){
  const d=document.createElement("div");
  d.className="sectionRow";
  d.innerHTML=`
  <input value="${n}" placeholder="Section">
  <input type="number" value="${m}">
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
  const platform=platformName.value.trim();
  const date=testDate.value;
  const neg=+negMark.value||0;

  if(!exam||!test||!platform||!date){alert("Fill all details");return;}

  let sectionsArr=[],total=0,C=0,W=0,U=0;

  document.querySelectorAll(".sectionRow").forEach(r=>{
    const name=r.children[0].value||"Section";
    const marks=+r.children[1].value||0;
    const c=+r.children[2].value||0;
    const w=+r.children[3].value||0;
    const u=+r.children[4].value||0;
    total+=marks; C+=c; W+=w; U+=u;
    sectionsArr.push({name,marks,c,w,u});
  });

  const negLoss = W * neg;

  const obj={exam,test,platform,date,total,C,W,U,neg,negLoss,sections:sectionsArr};

  if(editIndex==null)tests.push(obj);
  else tests[editIndex]=obj;

  localStorage.setItem("tests",JSON.stringify(tests));
  editIndex=null;
  initSections();
  renderAll();
}

/* -------- RENDER ALL -------- */
function renderAll(){
  renderDropdown();
  renderTables();
}

/* -------- DROPDOWN -------- */
function renderDropdown(){
  const exams=[...new Set(tests.map(t=>t.exam))];
  const current=examFilter.value;
  examFilter.innerHTML=`<option value="ALL">All Exams</option>`;
  exams.forEach(e=>examFilter.innerHTML+=`<option>${e}</option>`);
  if(exams.includes(current)) examFilter.value=current;
}

/* -------- TABLE -------- */
function renderTables(){
  tablesArea.innerHTML="";
  const filter=examFilter.value;

  const grouped={};
  tests.forEach(t=>{
    if(filter!=="ALL" && t.exam!==filter) return;
    grouped[t.exam]=grouped[t.exam]||[];
    grouped[t.exam].push(t);
  });

  for(const exam in grouped){
    const arr=grouped[exam].sort((a,b)=>new Date(a.date)-new Date(b.date));

    const best=Math.max(...arr.map(t=>t.total));
    const worst=Math.min(...arr.map(t=>t.total));
    const avg=(arr.reduce((a,t)=>a+t.total,0)/arr.length).toFixed(1);

    const secAvg={};
    arr.forEach(t=>{
      t.sections.forEach(s=>{
        secAvg[s.name]=(secAvg[s.name]||0)+s.marks;
      });
    });
    const weak=Object.entries(secAvg).sort((a,b)=>a[1]-b[1])[0][0];

    const card=document.createElement("div");
    card.className="tableCard";
    card.innerHTML=`
    <h3>${exam}</h3>
    <div class="summary">
      <span>Attempts: ${arr.length}</span>
      <span>Avg: ${avg}</span>
      <span>Best: ${best}</span>
      <span>Worst: ${worst}</span>
      <span>Weak Section: ${weak}</span>
    </div>`;
    tablesArea.appendChild(card);

    const table=document.createElement("table");
    card.appendChild(table);

    const secNames=[...new Set(arr.flatMap(t=>t.sections.map(s=>s.name)))];

    let head=`<tr><th>#</th><th>Date</th><th>Test</th><th>Platform</th>`;
    secNames.forEach(s=>head+=`<th>${s}</th>`);
    head+=`<th>Total</th><th>Action</th></tr>`;
    table.innerHTML=head;

    arr.forEach((t,i)=>{
      const d=new Date(t.date);
      const fd=`${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;

      let cls="";
      if(t.total===best) cls="best";
      if(t.total===worst) cls="worst";

      let row=`<tr class="${cls}">
      <td>${i+1}</td><td>${fd}</td><td>${t.test}</td><td>${t.platform}</td>`;

      secNames.forEach(s=>{
        const f=t.sections.find(x=>x.name===s);
        row+=`<td>${f?f.marks:"-"}</td>`;
      });

      row+=`<td>${t.total}</td>
      <td>
      <button onclick="viewDetail(this,'${exam}',${i})">👁</button>
      <button onclick="editTest('${exam}',${i})">✏</button>
      <button onclick="deleteTest('${exam}',${i})">🗑</button>
      </td></tr>`;

      table.innerHTML+=row;
    });
  }
}

/* -------- VIEW DETAIL -------- */
function viewDetail(btn,exam,idx){
  const tr=btn.closest("tr");
  if(tr.nextSibling && tr.nextSibling.classList.contains("detailRow")){
    tr.nextSibling.remove();return;
  }
  document.querySelectorAll(".detailRow").forEach(r=>r.remove());

  const arr=tests.filter(t=>t.exam===exam);
  const t=arr[idx];

  let html=`<tr class="detailRow"><td colspan="100">`;

  html+=`<b>Platform:</b> ${t.platform}<br><br>`;

  t.sections.forEach(s=>{
    html+=`<b>${s.name}</b> → Marks:${s.marks}, C:${s.c}, W:${s.w}, U:${s.u}<br>`;
  });

  html+=`<br><b>Total:</b> C:${t.C}, W:${t.W}, U:${t.U}<br>`;
  html+=`<b>Negative Marking:</b> ${t.W} × ${t.neg} = <b>${t.negLoss}</b> marks lost`;

  html+=`</td></tr>`;
  tr.insertAdjacentHTML("afterend",html);
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
  t.sections.forEach(s=>addSection(s.name,s.marks,s.c,s.w,s.u));
  window.scrollTo(0,0);
}

/* -------- DELETE -------- */
function deleteTest(exam,idx){
  if(!confirm("Delete test?"))return;
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
  let arr=tests.filter(t=>exam==="ALL"||t.exam===exam);
  arr.sort((a,b)=>new Date(a.date)-new Date(b.date));

  if(window.chart)window.chart.destroy();

  window.chart=new Chart(graph,{
    type:"line",
    data:{
      labels:arr.map(t=>t.test),
      datasets:[{label:exam+" Marks",data:arr.map(t=>t.total),fill:true,tension:.3}]
    },
    options:{scales:{y:{beginAtZero:true}}}
  });
}
