/* ---------------- GLOBAL ---------------- */
const quotes=[
 "Don’t stop when you’re tired; stop when you are finally done.",
 "Be the person your future self will thank."
];

let tests=JSON.parse(localStorage.getItem("tests"))||[];
let targets=JSON.parse(localStorage.getItem("targets"))||{};
let examDates=JSON.parse(localStorage.getItem("examDates"))||{};
let editIndex=null;

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded",()=>{
  quoteText.textContent=quotes[Math.floor(Math.random()*quotes.length)];
  initSections();
  buildFilter();
  renderTables();
  renderExamDates();
  darkModeBtn.onclick=toggleDark;
});

/* ---------------- DARK MODE ---------------- */
function toggleDark(){
  document.body.classList.toggle("dark");
  darkModeBtn.textContent=document.body.classList.contains("dark")?"☀ Light Mode":"🌙 Dark Mode";
}

/* ---------------- SECTIONS ---------------- */
function initSections(){
  sections.innerHTML="";
  addSectionHeader();
  for(let i=0;i<4;i++) addSection();
}

function addSectionHeader(){
  sections.innerHTML+=`
  <div class="sectionLabels">
    <span>Section</span><span>Marks</span><span>C</span><span>W</span><span>U</span><span></span>
  </div>`;
}

function addSection(n="",m=0,c=0,w=0,u=0){
  sections.innerHTML+=`
  <div class="sectionRow">
    <input class="sectionName" value="${n}">
    <input class="sectionMarks" type="number" value="${m}">
    <input type="number" value="${c}">
    <input type="number" value="${w}">
    <input type="number" value="${u}">
    <button onclick="this.parentElement.remove()">🗑</button>
  </div>`;
}

/* ---------------- SAVE ---------------- */
function saveTest(){
  if(!examName.value||!testName.value||!testDate.value)return alert("Fill all fields");

  const secs=[];
  let total=0,tc=0,tw=0,tu=0;
  document.querySelectorAll(".sectionRow").forEach(r=>{
    const s={
      name:r.children[0].value,
      marks:+r.children[1].value||0,
      c:+r.children[2].value||0,
      w:+r.children[3].value||0,
      u:+r.children[4].value||0
    };
    total+=s.marks; tc+=s.c; tw+=s.w; tu+=s.u;
    secs.push(s);
  });

  const t={
    exam:examName.value,
    test:testName.value,
    date:testDate.value,
    platform:platformName.value,
    neg:+negativeMark.value||0,
    total,
    accuracy:tc+tw?((tc/(tc+tw))*100).toFixed(1):0,
    sections:secs
  };

  if(targetInput.value) targets[t.exam]=+targetInput.value;

  editIndex===null?tests.push(t):tests[editIndex]=t;
  editIndex=null;

  localStorage.setItem("tests",JSON.stringify(tests));
  localStorage.setItem("targets",JSON.stringify(targets));

  initSections();
  buildFilter();
  renderTables();
}

/* ---------------- FILTER ---------------- */
function buildFilter(){
  examFilter.innerHTML="";
  const exams=[...new Set(tests.map(t=>t.exam))];
  examFilter.innerHTML+=`<option value="ALL">All Exams</option>`;
  exams.forEach(e=>examFilter.innerHTML+=`<option value="${e}">${e}</option>`);
  examFilter.onchange=renderTables;
}

/* ---------------- TABLES ---------------- */
function renderTables(){
  tablesArea.innerHTML="";
  const selected=examFilter.value||"ALL";

  const grouped={};
  tests.forEach(t=>{
    if(selected==="ALL"||t.exam===selected){
      grouped[t.exam]=grouped[t.exam]||[];
      grouped[t.exam].push(t);
    }
  });

  Object.keys(grouped).forEach(exam=>{
    const wrap=document.createElement("div");
    wrap.className="examTableWrapper";
    wrap.innerHTML=`<h3>${exam} | Target: ${targets[exam]||"-"}</h3>`;

    const table=document.createElement("table");
    table.innerHTML=`<tr>
      <th>Test</th><th>Date</th><th>Platform</th><th>Total</th><th>Accuracy</th>
      ${grouped[exam][0].sections.map(s=>`<th>${s.name}</th>`).join("")}
      <th>Edit</th><th>Delete</th>
    </tr>`;

    grouped[exam].forEach((t,i)=>{
      table.innerHTML+=`
      <tr>
        <td>${t.test}</td>
        <td>${t.date}</td>
        <td>${t.platform}</td>
        <td>${t.total}</td>
        <td>${t.accuracy}</td>
        ${t.sections.map(s=>`<td>${s.marks}</td>`).join("")}
        <td><button onclick="editTest(${tests.indexOf(t)})">✏️</button></td>
        <td><button onclick="deleteTest(${tests.indexOf(t)})">🗑</button></td>
      </tr>`;
    });

    wrap.appendChild(table);
    tablesArea.appendChild(wrap);
  });
}

/* ---------------- EDIT / DELETE ---------------- */
function editTest(i){
  const t=tests[i]; editIndex=i;
  examName.value=t.exam;
  testName.value=t.test;
  testDate.value=t.date;
  platformName.value=t.platform;
  negativeMark.value=t.neg||0;
  targetInput.value=targets[t.exam]||"";
  initSections();
  t.sections.forEach((s,i)=>{
    const r=document.querySelectorAll(".sectionRow")[i];
    r.children[0].value=s.name;
    r.children[1].value=s.marks;
    r.children[2].value=s.c;
    r.children[3].value=s.w;
    r.children[4].value=s.u;
  });
}

function deleteTest(i){
  if(confirm("Delete test?")){
    tests.splice(i,1);
    localStorage.setItem("tests",JSON.stringify(tests));
    buildFilter();
    renderTables();
  }
}

/* ---------------- GRAPH ---------------- */
function showGraph(){
  if(examFilter.value==="ALL")return alert("Select an exam");
  graphPage.style.display="block";
  tablesArea.style.display="none";

  const data=tests.filter(t=>t.exam===examFilter.value);
  const ctx=graph.getContext("2d");
  if(window.g)window.g.destroy();
  window.g=new Chart(ctx,{
    type:"line",
    data:{labels:data.map(t=>t.test),datasets:[{label:"Marks",data:data.map(t=>t.total)}]}
  });
}

function hideGraph(){
  graphPage.style.display="none";
  tablesArea.style.display="block";
}

/* ---------------- EXPORT ---------------- */
function exportExcel(){
  const ws=XLSX.utils.json_to_sheet(tests);
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Tests");
  XLSX.writeFile(wb,"MockTracker.xlsx");
}

function exportPDF(){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF();
  let y=10;
  tests.forEach(t=>{
    doc.text(`${t.exam} - ${t.test} : ${t.total}`,10,y); y+=8;
  });
  doc.save("MockTracker.pdf");
}

/* ---------------- EXAM DATE COUNTER ---------------- */
function saveExamDate(){
  if(!examCounterName.value||!examCounterDate.value)return;
  examDates[examCounterName.value]=examCounterDate.value;
  localStorage.setItem("examDates",JSON.stringify(examDates));
  examCounterName.value="";
  examCounterDate.value="";
  renderExamDates();
}

function renderExamDates(){
  examCounterList.innerHTML="";
  const today=new Date();
  Object.keys(examDates).forEach(exam=>{
    const d=new Date(examDates[exam]);
    const days=Math.ceil((d-today)/(1000*60*60*24));
    const div=document.createElement("div");
    div.innerHTML=`
      <b>${exam}</b> : ${days>=0?days+" days left":"Expired"}
      <button onclick="deleteExamDate('${exam}')">🗑</button>
    `;
    examCounterList.appendChild(div);
  });
}

function deleteExamDate(exam){
  delete examDates[exam];
  localStorage.setItem("examDates",JSON.stringify(examDates));
  renderExamDates();
}
