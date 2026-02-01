/* ---------------- QUOTES ---------------- */
const quotes = [
  "Don’t stop when you’re tired; stop when you are finally done.",
  "A mountain of books is just pages waiting to be turned.",
  "Be the person your future self will thank.",
  "Motivation gets you to the desk, habit keeps the pen moving."
];
let qIndex = Math.floor(Math.random()*quotes.length);

let tests = JSON.parse(localStorage.getItem("tests"))||[];
let editIndex=null;
let targets=JSON.parse(localStorage.getItem("targets"))||{};

document.addEventListener("DOMContentLoaded",()=>{
  window.quoteEl=document.getElementById("quoteText");
  window.sections=document.getElementById("sections");
  window.examFilter=document.getElementById("examFilter");
  window.examName=document.getElementById("examName");
  window.testName=document.getElementById("testName");
  window.testDate=document.getElementById("testDate");
  window.platformName=document.getElementById("platformName");
  window.negativeMark=document.getElementById("negativeMark");
  window.targetInput=document.getElementById("targetInput");
  window.tablesArea=document.getElementById("tablesArea");
  window.graphPage=document.getElementById("graphPage");
  window.graph=document.getElementById("graph");
  window.darkModeBtn=document.getElementById("darkModeBtn");

  rotateQuotes();
  setInterval(rotateQuotes,30000);
  initSections();
  renderAll();

  darkModeBtn.onclick=()=>{ 
    document.body.classList.toggle("dark"); 
    darkModeBtn.textContent = document.body.classList.contains("dark")?"☀ Light Mode":"🌙 Dark Mode"; 
  }
});

function rotateQuotes(){ quoteEl.textContent=quotes[qIndex]; qIndex=(qIndex+1)%quotes.length; }

/* -------- SECTIONS -------- */
function initSections(){ 
  sections.innerHTML=""; 
  addSection(); addSection(); addSection(); addSectionHeader(); 
}
function addSectionHeader(){
  const header=document.createElement("div"); 
  header.className="sectionLabels";
  header.innerHTML="<span>Section</span><span>Marks</span><span>Correct</span><span>Wrong</span><span>Unattempted</span><span></span>";
  sections.prepend(header);
}
function addSection(name="",marks=0,c=0,w=0,u=0){
  const d=document.createElement("div"); d.className="sectionRow";
  d.innerHTML=`<input class="sectionName" value="${name}" placeholder="Section">
  <input type="number" class="sectionMarks" value="${marks}">
  <input type="number" value="${c}"><input type="number" value="${w}"><input type="number" value="${u}">
  <button onclick="deleteSection(this)">🗑</button>`;
  sections.appendChild(d);
}
function deleteSection(btn){ if(document.querySelectorAll(".sectionRow").length>1) btn.parentElement.remove(); }

/* -------- SAVE TEST -------- */
function saveTest(){
  const exam=examName.value.trim(), test=testName.value.trim(), date=testDate.value, platform=platformName.value.trim(), neg=Number(negativeMark.value)||0;
  const targetVal=Number(targetInput.value);
  if(exam && test && date && platform){ 
    if(targetVal) targets[exam]=targetVal; 
    localStorage.setItem("targets",JSON.stringify(targets)); 
  } else { alert("Fill all fields"); return; }

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

  const negLoss=tw*neg, accuracy=tc+tw>0?((tc/(tc+tw))*100).toFixed(1):0;
  const obj={exam,test,date,platform,neg,total,negLoss,tc,tw,tu,accuracy,sections:sectionsArr};

  if(editIndex==null) tests.push(obj); else tests[editIndex]=obj; editIndex=null;
  localStorage.setItem("tests",JSON.stringify(tests));
  initSections(); renderAll();
}

/* ---------------- RENDER ---------------- */
function renderAll(){
  renderDropdown();
  renderTables();
}

function renderDropdown(){
  const exams=["ALL",...new Set(tests.map(t=>t.exam))];
  examFilter.innerHTML="";
  exams.forEach(e=>{ 
    const opt=document.createElement("option"); 
    opt.value=e; 
    opt.textContent=e; 
    examFilter.appendChild(opt); 
  });
}

function renderTables(){
  tablesArea.innerHTML="";
  const selected=examFilter.value;
  const grouped={};
  tests.forEach(t=>{
    if(selected==="ALL" || t.exam===selected){
      if(!grouped[t.exam]) grouped[t.exam]=[];
      grouped[t.exam].push(t);
    }
  });

  Object.keys(grouped).forEach((exam,i)=>{
    const tableWrapper=document.createElement("div"); 
    tableWrapper.className="examTableWrapper";
    tableWrapper.style.background= `hsl(${i*60}, 80%, 90%)`;

    const avg=Math.round(grouped[exam].reduce((a,b)=>a+b.total,0)/grouped[exam].length);
    tableWrapper.innerHTML=`<h3>${exam} - Avg: ${avg} / Target: ${targets[exam]||"-"} <span class="examCountdown"></span></h3>`;

    const table=document.createElement("table");
    const sectionNames=grouped[exam][0].sections.map(s=>s.name);
    let sectionHeaders="";
    sectionNames.forEach(name=>sectionHeaders+=`<th>${name}</th>`);
    table.innerHTML=`<tr>
      <th>Test</th><th>Date</th><th>Platform</th><th>Total</th><th>Accuracy</th>${sectionHeaders}<th>Feedback</th><th>Edit</th><th>Delete</th>
    </tr>`;

    const totals=grouped[exam].map(t=>t.total);
    const best=Math.max(...totals), worst=Math.min(...totals);

    grouped[exam].forEach(t=>{
      const tr=document.createElement("tr");
      if(t.total===best) tr.classList.add("best");
      if(t.total===worst) tr.classList.add("worst");

      let sectionColumns="";
      t.sections.forEach(sec=>sectionColumns+=`<td>${sec.marks} (${sec.c}/${sec.w}/${sec.u})</td>`);

      const dt=new Date(t.date);
      const dtStr = dt.getDate().toString().padStart(2,'0')+"-"+(dt.getMonth()+1).toString().padStart(2,'0')+"-"+dt.getFullYear();

      tr.innerHTML=`<td>${t.test}</td><td>${dtStr}</td><td>${t.platform}</td><td>${t.total}</td><td>${t.accuracy}</td>
      ${sectionColumns}
      <td><button onclick="toggleAnalysis(this)">Show</button></td>
      <td><button onclick="editTest(${tests.indexOf(t)})">✏️</button></td>
      <td><button onclick="deleteTest(${tests.indexOf(t)})">🗑</button></td>`;

      table.appendChild(tr);
    });

    tableWrapper.appendChild(table);
    tablesArea.appendChild(tableWrapper);

    // Countdown
    const countdownEl = tableWrapper.querySelector(".examCountdown");
    const examDate = new Date(grouped[exam][0].date);
    const diff = Math.ceil((examDate - new Date())/(1000*60*60*24));
    countdownEl.textContent = diff>=0?` | ${diff} days left`:" | Completed";
  });
}

/* ---------------- ANALYSIS ---------------- */
function toggleAnalysis(btn){
  const tr=btn.parentElement.parentElement;
  if(tr.nextElementSibling && tr.nextElementSibling.classList.contains("analysisRow")){
    tr.nextElementSibling.remove();
    btn.textContent="Show";
    return;
  }
  const idx = Array.from(tr.parentNode.children).indexOf(tr) - 1;
  const t=tests[idx];
  const weak=t.sections.reduce((a,b)=>a.marks>b.marks?b:a);
  const analysisRow=document.createElement("tr");
  analysisRow.className="analysisRow"; 
  analysisRow.innerHTML=`<td colspan="${tr.children.length}">Weak Section: ${weak.name} | Neg Penalty: ${t.negLoss}</td>`;
  tr.parentNode.insertBefore(analysisRow,tr.nextSibling);
  btn.textContent="Hide";
}

/* -------- EDIT / DELETE -------- */
function editTest(idx){ 
  const t=tests[idx]; editIndex=idx; 
  examName.value=t.exam; testName.value=t.test; testDate.value=t.date; platformName.value=t.platform; negativeMark.value=t.neg; 
  targetInput.value=targets[t.exam]||""; 
  initSections(); 
  t.sections.forEach((s,i)=>{ 
    const row=document.querySelectorAll(".sectionRow")[i]; 
    if(row) { 
      row.querySelector(".sectionName").value=s.name; 
      row.querySelector(".sectionMarks").value=s.marks; 
      row.children[2].value=s.c; 
      row.children[3].value=s.w; 
      row.children[4].value=s.u; 
    } else addSection(s.name,s.marks,s.c,s.w,s.u); 
  }); 
}

function deleteTest(idx){ 
  if(confirm("Delete this test?")){ 
    tests.splice(idx,1); 
    localStorage.setItem("tests",JSON.stringify(tests)); 
    renderAll(); 
  } 
}

/* ---------------- GRAPH ---------------- */
function showGraph(){
  const selected=examFilter.value; 
  if(selected==="ALL"){ alert("Select exam"); return; }
  graphPage.style.display="block"; tablesArea.style.display="none"; drawGraph(selected);
}
function hideGraph(){ graphPage.style.display="none"; tablesArea.style.display="block"; }
function drawGraph(exam){
  const ctx=graph.getContext('2d'); 
  const examTests=tests.filter(t=>t.exam===exam);
  const labels=examTests.map(t=>t.test); 
  const data=examTests.map(t=>t.total);
  if(window.graphInstance) window.graphInstance.destroy();
  window.graphInstance=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{label:'Total Marks',data,fill:false,borderColor:'blue', tension:0.2}]},
    options:{responsive:true, plugins:{legend:{display:true}}}
  });
}

/* ---------------- EXPORT ---------------- */
function exportExcel(){ 
  const ws=XLSX.utils.json_to_sheet(tests.map(t=>({
    Exam:t.exam,
    Test:t.test,
    Date:t.date,
    Platform:t.platform,
    Total:t.total,
    Accuracy:t.accuracy,
    Sections:t.sections.map(s=>`${s.name}:${s.marks}`).join(', ')
  })));
  const wb=XLSX.utils.book_new(); 
  XLSX.utils.book_append_sheet(wb,ws,"Tests"); 
  XLSX.writeFile(wb,"MockTracker.xlsx"); 
}

function exportPDF(){ 
  const { jsPDF } = window.jspdf; 
  const doc=new jsPDF(); 
  let y=10; 
  tests.forEach(t=>{
    doc.text(`Exam: ${t.exam} | Test: ${t.test} | Date: ${t.date} | Total: ${t.total} | Accuracy: ${t.accuracy}`,10,y); 
    y+=7; 
    doc.text(`Sections: ${t.sections.map(s=>`${s.name}:${s.marks}`).join(', ')}`,10,y); 
    y+=10; 
  }); 
  doc.save("MockTracker.pdf"); 
}
