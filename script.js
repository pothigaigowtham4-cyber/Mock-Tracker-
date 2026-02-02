const quotes=[
 "Discipline beats motivation.",
 "Accuracy before speed.",
 "Mocks are mirrors, not judges.",
 "Consistency compounds.",
 "Today’s effort decides tomorrow’s rank.",
 "Mistakes are data.",
 "Pressure reveals preparation.",
 "One question at a time.",
 "Progress > perfection.",
 "Trust the process."
];

const insightBank=[
 "Accuracy improved compared to previous test.",
 "Negative marks increased – tighten attempt control.",
 "Score dipped but section balance improved.",
 "Target is close – small refinement needed.",
 "Good recovery after last performance.",
 "Speed increased without hurting accuracy.",
 "Attempts rose but precision dropped slightly.",
 "Section prioritization worked better.",
 "Risk management improved.",
 "Consistency trend is stabilizing.",
 "Strong fundamentals visible.",
 "Careless mistakes reduced.",
 "Better time distribution.",
 "Weak section impact reduced.",
 "Positive momentum building."
];

let tests=JSON.parse(localStorage.getItem("tests"))||[];
let targets=JSON.parse(localStorage.getItem("targets"))||{};
let openAnalysis=null;

quoteText.textContent=quotes[Math.floor(Math.random()*quotes.length)];

darkModeBtn.onclick=()=>{
 document.body.classList.toggle("dark");
 darkModeBtn.textContent=document.body.classList.contains("dark")?"☀ Light":"🌙 Dark";
};

function initSections(){
 sections.innerHTML=`
 <div class="sectionLabels">
  <span>Section</span><span>Marks</span><span>C</span><span>W</span><span>U</span><span></span>
 </div>`;
 for(let i=0;i<4;i++) addSection();
}
initSections();

function addSection(){
 const r=document.createElement("div");
 r.className="sectionRow";
 r.innerHTML=`
 <input>
 <input type="number" value="0">
 <input type="number" value="0">
 <input type="number" value="0">
 <input type="number" value="0">
 <button onclick="this.parentElement.remove()">🗑</button>`;
 sections.appendChild(r);
}

function saveTest(){
 let secs=[],total=0,tc=0,tw=0,tu=0;
 document.querySelectorAll(".sectionRow").forEach(r=>{
  const s={
   name:r.children[0].value||"Sec",
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
  total,tc,tw,tu,
  accuracy:(tc+tw)?((tc/(tc+tw))*100).toFixed(1):0,
  sections:secs
 };

 if(targetInput.value) targets[t.exam]=+targetInput.value;
 tests.push(t);

 localStorage.setItem("tests",JSON.stringify(tests));
 localStorage.setItem("targets",JSON.stringify(targets));

 initSections();
 renderTables();
}

function renderTables(){
 tablesArea.innerHTML="";
 examFilter.innerHTML=`<option value="ALL">All Exams</option>`;
 [...new Set(tests.map(t=>t.exam))].forEach(e=>{
  examFilter.innerHTML+=`<option>${e}</option>`;
 });

 const sel=examFilter.value||"ALL";
 const groups={};

 tests.forEach(t=>{
  if(sel==="ALL"||t.exam===sel){
   groups[t.exam]=groups[t.exam]||[];
   groups[t.exam].push(t);
  }
 });

 Object.keys(groups).forEach(exam=>{
  const arr=groups[exam];
  const totals=arr.map(t=>t.total);
  const avg=Math.round(totals.reduce((a,b)=>a+b,0)/arr.length);
  const best=Math.max(...totals), worst=Math.min(...totals);

  const wrap=document.createElement("div");
  wrap.innerHTML=`<h3>${exam} | Avg:${avg} | Target:${targets[exam]||"-"}</h3>`;

  const table=document.createElement("table");
  table.innerHTML=`<tr>
   <th>Test</th><th>Date</th><th>Total</th><th>Acc</th>
   ${arr[0].sections.map(s=>`<th>${s.name}</th>`).join("")}
  </tr>`;

  arr.forEach((t,i)=>{
   const tr=document.createElement("tr");
   if(t.total===best) tr.classList.add("best");
   if(t.total===worst) tr.classList.add("worst");

   tr.onclick=()=>toggleAnalysis(tr,t,exam,i);

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

function toggleAnalysis(row,t,exam,i){
 if(openAnalysis){
  if(openAnalysis.previousSibling===row){
   openAnalysis.remove(); openAnalysis=null; return;
  }
  openAnalysis.remove(); openAnalysis=null;
 }

 const sec=t.sections.map(s=>
  `${s.name} → C:${s.c}, W:${s.w}, U:${s.u}`
 ).join("<br>");

 const a=document.createElement("tr");
 a.className="analysisRow";
 a.innerHTML=`
 <td colspan="${4+t.sections.length}">
  <strong>Section-wise</strong><br>${sec}<br><br>
  <strong>Total</strong><br>
  C:${t.tc} | W:${t.tw} | U:${t.tu}<br>
  Negative Lost: ${t.tw*t.neg}<br><br>
  <strong>Insight</strong><br>
  ${insightBank[(t.total+i)%insightBank.length]}
 </td>`;
 row.after(a);
 openAnalysis=a;
}
