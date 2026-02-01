/* ---------------- SAFE JSON PARSING ---------------- */
function parseJSON(key, fallback){
    const item = localStorage.getItem(key);
    try { return item ? JSON.parse(item) : fallback; }
    catch(e){ return fallback; }
}

/* ---------------- QUOTES ---------------- */
const quotes = [
    "Don’t stop when you’re tired; stop when you are finally done. The discipline you find today builds the freedom you enjoy tomorrow.",
    "A mountain of books is just a series of single pages waiting to be turned. Focus on the progress of the hour, not the pressure of the exam.",
    "Be the person your future self will look back on and thank for not quitting. The work is temporary, but the result stays forever.",
    "Motivation gets you to the desk, but habit is what keeps the pen moving.",
    "You aren't just studying a subject; you are upgrading your own mind.",
    "Suffer the boredom of study now, or suffer the sting of regret later.",
    "While you are resting, someone else is working to take your spot.",
    "Consistency means letting your schedule run your day, not your mood.",
    "Winning the day is the only way to win the year.",
    "Greatness is built in silence."
];
let qIndex = Math.floor(Math.random() * quotes.length);

/* ---------------- DATA ---------------- */
let tests = parseJSON("tests", []);
let editIndex = null;
let targets = parseJSON("targets", {});
let feedbackHistory = parseJSON("feedbackHistory", {});
let examCountdowns = parseJSON("examCountdowns", []);
let darkMode = parseJSON("darkMode", false);
let chartInstance = null;

/* ---------------- DOM READY ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    window.quoteEl = document.getElementById("quoteText");
    window.sections = document.getElementById("sections");
    window.examFilter = document.getElementById("examFilter");
    window.examName = document.getElementById("examName");
    window.testName = document.getElementById("testName");
    window.testDate = document.getElementById("testDate");
    window.platformName = document.getElementById("platformName");
    window.negativeMark = document.getElementById("negativeMark");
    window.tablesArea = document.getElementById("tablesArea");
    window.countdownCard = document.getElementById("examCountdownCard");
    window.graphCard = document.getElementById("graphCard");
    window.graphCanvas = document.getElementById("examGraph");
    window.targetInput = document.getElementById("targetInput");

    rotateQuotes();
    setInterval(rotateQuotes, 30000);
    init();
});

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

/* ---------------- INIT ---------------- */
function init(){
    initSections();
    renderExamFilter();
    renderAll();
    addCountdownUI();
    applyDarkMode();
    document.getElementById("darkModeBtn").onclick=toggleDarkMode;
}

/* ---------------- DARK MODE ---------------- */
function applyDarkMode(){
    if(darkMode) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
}

function toggleDarkMode(){
    darkMode = !darkMode;
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    applyDarkMode();
    document.getElementById("darkModeBtn").innerHTML = darkMode ? "☀ Light Mode" : "🌙 Dark Mode";
}

/* ---------------- SECTIONS ---------------- */
function initSections(){
    sections.innerHTML="";
    addSection("Section 1");
}

function addSection(name="Section", marks=0, c=0, w=0, u=0){
    const d=document.createElement("div");
    d.className="sectionRow";
    d.innerHTML=`
        <input class="sectionName" value="${name}" placeholder="Section">
        <input type="number" class="sectionMarks" value="${marks}">
        <input type="number" value="${c}">
        <input type="number" value="${w}">
        <input type="number" value="${u}">
        <button onclick="deleteSection(this)">🗑</button>
    `;
    sections.appendChild(d);
}

function deleteSection(btn){
    const rows = document.querySelectorAll(".sectionRow");
    if(rows.length <= 1){ alert("At least one section is required."); return; }
    btn.parentElement.remove();
}

/* ---------------- SAVE TEST ---------------- */
function saveTest(){
    const exam=examName.value.trim();
    const test=testName.value.trim();
    const date=testDate.value;
    const platform=platformName.value.trim();
    const neg=Number(negativeMark.value)||0;
    const targetVal=Number(targetInput.value)||0;

    if(!exam||!test||!date||!platform){ alert("Fill all details"); return; }

    // Save target
    if(targetVal) targets[exam]=targetVal;
    localStorage.setItem("targets", JSON.stringify(targets));

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

    const negLoss = tw * neg;
    const accuracy = tc + tw > 0 ? ((tc/(tc+tw))*100).toFixed(1) : 0;

    const obj={exam,test,date,platform,neg,total,negLoss,tc,tw,tu,accuracy,sections:sectionsArr};

    if(editIndex==null) tests.push(obj);
    else tests[editIndex]=obj;

    localStorage.setItem("tests",JSON.stringify(tests));
    editIndex=null;
    initSections();
    renderExamFilter();
    renderAll();
}

/* ---------------- EXAM FILTER ---------------- */
function renderExamFilter(){
    if(!examFilter) return;
    let exams = Array.from(new Set(tests.map(t=>t.exam)));
    examFilter.innerHTML = `<option value="ALL">All Exams</option>` +
        exams.map(e=>`<option value="${e}">${e}</option>`).join("");
    examFilter.onchange = () => { 
        renderAll(); 
        graphCard.style.display="none"; 
    };
}

/* ---------------- EXAM COUNTDOWN ---------------- */
function addCountdownUI(){
    if(!countdownCard) return;
    countdownCard.innerHTML=`
        <h3>Exam Day Countdown ⏳</h3>
        <input id="countdownName" placeholder="Exam Name">
        <input id="countdownDate" type="date">
        <button onclick="addCountdown()">Add</button>
        <div id="countdownList"></div>
    `;
    renderCountdowns();
}

function addCountdown(){
    const name = document.getElementById("countdownName").value.trim();
    const date = document.getElementById("countdownDate").value;
    if(!name || !date){ alert("Fill both fields"); return; }
    examCountdowns.push({name,date});
    localStorage.setItem("examCountdowns", JSON.stringify(examCountdowns));
    renderCountdowns();
}

function editCountdown(idx){
    const name = prompt("Edit Exam Name:", examCountdowns[idx].name);
    const date = prompt("Edit Exam Date:", examCountdowns[idx].date);
    if(name && date){
        examCountdowns[idx]={name,date};
        localStorage.setItem("examCountdowns", JSON.stringify(examCountdowns));
        renderCountdowns();
    }
}

function deleteCountdown(idx){
    if(confirm("Delete this exam countdown?")){
        examCountdowns.splice(idx,1);
        localStorage.setItem("examCountdowns", JSON.stringify(examCountdowns));
        renderCountdowns();
    }
}

function renderCountdowns(){
    const list = document.getElementById("countdownList");
    list.innerHTML="";
    examCountdowns.forEach((e,i)=>{
        const days = Math.ceil((new Date(e.date)-new Date())/(1000*60*60*24));
        const div = document.createElement("div");
        div.innerHTML=`${e.name}: ${days>=0?days+" days left":"Exam passed"} 
            <button onclick="editCountdown(${i})">✏</button>
            <button onclick="deleteCountdown(${i})">🗑</button>`;
        list.appendChild(div);
    });
}

/* ---------------- TABLES & ANALYSIS ---------------- */
function renderAll(){
    tablesArea.innerHTML="";
    const filter = examFilter.value;
    const examsToShow = filter==="ALL"? Array.from(new Set(tests.map(t=>t.exam))) : [filter];

    examsToShow.forEach(exam=>{
        const examTests = tests.filter(t=>t.exam===exam).sort((a,b)=>new Date(a.date)-new Date(b.date));
        if(examTests.length===0) return;

        const div = document.createElement("div");
        div.className="tableCard";
        div.innerHTML=`<h3>${exam}</h3>`;
        const table = document.createElement("table");

        // header with sections
        let headers = `<tr>
            <th>Test</th><th>Date</th><th>Platform</th><th>Total</th><th>Accuracy %</th><th>Neg Loss</th>`;
        if(examTests[0].sections)
            examTests[0].sections.forEach(s=>{headers+=`<th>${s.name}</th>`;});
        headers+=`</tr>`;
        table.innerHTML=headers;

        examTests.forEach((t,idx)=>{
            const best = Math.max(...examTests.map(x=>x.total));
            const worst = Math.min(...examTests.map(x=>x.total));

            let tr = `<tr style="cursor:pointer;" onclick="toggleAnalysisRow(this,${idx},'${exam}')">
                <td>${t.test}</td><td>${t.date}</td><td>${t.platform}</td>
                <td class="${t.total===best?'best': t.total===worst?'worst':''}">${t.total}</td>
                <td>${t.accuracy}</td><td>${t.negLoss}</td>`;
            t.sections.forEach(s=>{ tr+=`<td>${s.marks}</td>`; });
            tr+=`</tr>`;
            table.innerHTML+=tr;
        });

        div.appendChild(table);
        tablesArea.appendChild(div);
    });
}

function toggleAnalysisRow(tr,idx,exam){
    const t = tests.filter(t=>t.exam===exam)[idx];
    if(tr.nextElementSibling && tr.nextElementSibling.classList.contains("analysisRow")){
        tr.nextElementSibling.remove();
        return;
    }
    const row = document.createElement("tr");
    row.className="analysisRow";
    const td = document.createElement("td");
    td.colSpan = tr.children.length;
    td.innerHTML=`<div class="analysisDiv">
        <p>Correct: ${t.tc} | Wrong: ${t.tw} | Unattempted: ${t.tu}</p>
        <p>Negative marks lost: ${t.negLoss}</p>
        <p>Accuracy: ${t.accuracy}%</p>
    </div>`;
    row.appendChild(td);
    tr.parentNode.insertBefore(row,tr.nextSibling);
}

/* ---------------- GRAPH ---------------- */
function renderGraph(){
    const filter = examFilter.value;
    const examTests = filter==="ALL"? tests : tests.filter(t=>t.exam===filter);
    if(!examTests.length) {alert("No tests to display graph."); return;}
    graphCard.style.display="block";

    const labels = examTests.map(t=>t.test);
    const data = examTests.map(t=>t.total);

    if(chartInstance) chartInstance.destroy();
    chartInstance = new Chart(graphCanvas,{
        type:"line",
        data:{ labels, datasets:[{label:filter==="ALL"?"All Exams":filter, data, borderColor:"#1565c0", backgroundColor:"transparent", tension:0.2, fill:false}] },
        options:{responsive:true, plugins:{legend:{display:true}}, scales:{y:{beginAtZero:true}}}
    });
}

/* ---------------- EXPORT ---------------- */
function exportExcel(){
    const table = tablesArea.querySelector("table");
    if(!table){ alert("No table to export"); return; }
    const wb = XLSX.utils.table_to_book(table,{sheet:"Sheet1"});
    XLSX.writeFile(wb,"MockTracker.xlsx");
}

function exportPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const table = tablesArea.querySelector("table");
    if(!table){ alert("No table to export"); return; }
    doc.html(table,{x:10,y:10,callback: function(){doc.save("MockTracker.pdf");}});
}
