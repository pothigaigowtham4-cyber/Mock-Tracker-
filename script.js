/* ---------------- GLOBAL ---------------- */
const quotes=[
 "Don’t stop when you’re tired; stop when you are finally done.",
 "Be the person your future self will thank."
];

const insightBank=[
 "Accuracy is improving, but risky attempts are creeping in.",
 "You’re trading speed for accuracy — rebalance this.",
 "Strong attempt strategy, execution needs tightening.",
 "Marks are rising due to fewer silly mistakes.",
 "You’re close to target, refinement will push you over.",
 "Attempts increased but accuracy dropped — be cautious.",
 "This test shows controlled aggression, good sign.",
 "Section balance is improving compared to earlier tests.",
 "Negative marks are hurting otherwise solid performance.",
 "Your consistency is stabilizing after earlier fluctuations.",
 "You’re improving under pressure — maintain this approach.",
 "Score dipped, but fundamentals remain strong.",
 "Section prioritization worked better this time.",
 "Your weakest section is no longer dragging total score.",
 "Momentum is positive — don’t change strategy abruptly."
];

let tests=JSON.parse(localStorage.getItem("tests"))||[];
let targets=JSON.parse(localStorage.getItem("targets"))||{};
let examDates=JSON.parse(localStorage.getItem("examDates"))||{};
let editIndex=null;
let openAnalysisRow=null;

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded",()=>{
  quoteText.textContent=quotes[Math.floor(Math.random()*quotes.length)];
  initSections();
  buildFilter();
  renderExamCounters();
  renderTables();
  darkModeBtn.onclick=toggleDark;
});

/* ---------------- DARK MODE ---------------- */
function toggleDark(){
  document.body.classList.toggle("dark");
  darkModeBtn.textContent=document.body.classList.contains("dark")?"☀ Light Mode":"🌙 Dark Mode";
}

/* ---------------- SECTIONS (2 ROW LAYOUT FIX) ---------------- */
function initSections(){
  sections.innerHTML="";
  sections.style.display="grid";
  sections.style.gridTemplateColumns="1fr 1fr";
  sections.style.gap="12px";

  sections.innerHTML+=`
    <div class="sectionLabels" style="grid-column:1/-1">
      <span>Section</span><span>Marks</span><span>C</span><span>W</span><span>U</span><span></span>
    </div>`;

  for(let i=0;i<4;i++) addSection();
}

function addSection(n="",m=0,c=0,w=0,u=0){
  const r=document.createElement("div");
  r.className="sectionRow";
  r.style.display="flex";
  r.style.gap="6px";
  r.innerHTML=`
    <input value="${n}">
    <input type="number" value="${m}">
    <input type="number" value="${c}">
    <input type="number" value="${w}">
    <input type="number" value="${u}">
    <button onclick="this.parentElement.remove()">🗑</button>`;
  sections.appendChild(r);
}

/* ---------------- SAVE TEST ---------------- */
function saveTest(){
  if(!examName.value||!testName.value||!testDate.value)return alert("Fill all fields");

  let secs=[],total=0,tc=0,tw=0,tu=0;
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
    total, tc, tw, tu,
    accuracy:tc+tw?((tc/(tc+tw))*100).toFixed(1):0,
    sections:secs
  };

  if(targetInput.value) targets[t.exam]=+targetInput.value;
  editIndex===null?tests.push(t):tests[editIndex]=t;
  editIndex=null;

  localStorage.setItem("tests",JSON.stringify(tests));
  localStorage.setItem("targets",JSON.stringify(targets));
  initSections(); buildFilter(); renderTables();
}

/* ---------------- FILTER ---------------- */
function buildFilter(){
  examFilter.innerHTML=`<option value="ALL">All Exams</option>`;
  [...new Set(tests.map(t=>t.exam))].forEach(e=>{
    examFilter.innerHTML+=`<option value="${e}">${e}</option>`;
  });
  examFilter.onchange=renderTables;
}

/* ---------------- TABLE + ANALYSIS ---------------- */
function renderTables(){
  tablesArea.innerHTML="";
  renderExamCounters();

  const selected=examFilter.value||"ALL";
  const grouped={};

  tests.forEach(t=>{
    if(selected==="ALL"||t.exam===selected){
      grouped[t.exam]=grouped[t.exam]||[];
      grouped[t.exam].push(t);
    }
  });

  Object.keys(grouped).forEach(exam=>{
    const totals=grouped[exam].map(t=>t.total);
    const avg=Math.round(totals.reduce((a,b)=>a+b,0)/totals.length);
    const best=Math.max(...totals), worst=Math.min(...totals);

    const wrap=document.createElement("div");
    wrap.innerHTML=`<h3>${exam} | Avg: ${avg} | Target: ${targets[exam]||"-"}</h3>`;

    const table=document.createElement("table");
    table.innerHTML=`<tr>
      <th>Test</th><th>Date</th><th>Total</th><th>Accuracy</th>
      ${grouped[exam][0].sections.map(s=>`<th>${s.name}</th>`).join("")}
    </tr>`;

    grouped[exam].forEach((t,idx)=>{
      const tr=document.createElement("tr");
      if(t.total===best) tr.classList.add("best");
      if(t.total===worst) tr.classList.add("worst");

      tr.onclick=()=>toggleAnalysis(tr,t,grouped[exam],idx);

      tr.innerHTML=`
        <td>${t.test}</td>
        <td>${t.date}</td>
        <td>${t.total}</td>
        <td>${t.accuracy}</td>
        ${t.sections.map(s=>`<td>${s.marks}</td>`).join("")}
      `;
      table.appendChild(tr);
    });

    wrap.appendChild(table);
    tablesArea.appendChild(wrap);
  });
}

/* ---------------- ANALYSIS (FIXED TOGGLE + INSIGHTS) ---------------- */
function toggleAnalysis(row,test,examTests,index){
  if(openAnalysisRow){
    if(openAnalysisRow.previousSibling===row){
      openAnalysisRow.remove();
      openAnalysisRow=null;
      return;
    }
    openAnalysisRow.remove();
    openAnalysisRow=null;
  }

  const negLost=test.tw*test.neg;
  const prevAvg=index
    ? Math.round(examTests.slice(0,index).reduce((a,b)=>a+b.total,0)/index)
    : test.total;

  const insightIndex=Math.abs((test.total+index)%insightBank.length);
  const insightText=insightBank[insightIndex];

  const a=document.createElement("tr");
  a.className="analysisRow";
  a.innerHTML=`
    <td colspan="${4+test.sections.length}">
      <div style="text-align:left;padding:12px">
        <strong>Section-wise</strong>
        <ul>${test.sections.map(s=>
          `<li>${s.name}: C ${s.c}, W ${s.w}, U ${s.u}</li>`).join("")}</ul>

        <strong>Overall</strong>
        <p>Correct: ${test.tc}, Wrong: ${test.tw}, Unattempted: ${test.tu}</p>
        <p>Negative Marks Lost: ${negLost}</p>

        <strong>Insight</strong>
        <p>${insightText}</p>
        ${targets[test.exam]?`<p>Target Gap: ${test.total-targets[test.exam]}</p>`:""}
        <p>Previous Avg: ${prevAvg}</p>
      </div>
    </td>`;

  row.after(a);
  openAnalysisRow=a;
}

/* ---------------- EXAM COUNTER ---------------- */
function renderExamCounters(){/* unchanged */}
