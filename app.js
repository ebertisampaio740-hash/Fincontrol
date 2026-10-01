const STORAGE_KEY = "fincontrol_v1";
const PAYMENT_LINKS = {
  monthly: "COLE_AQUI_SEU_LINK_DE_PAGAMENTO_MENSAL",
  annual: "COLE_AQUI_SEU_LINK_DE_PAGAMENTO_ANUAL"
};

const categories = ["Alimentação","Moradia","Transporte","Saúde","Lazer","Educação","Assinaturas","Compras","Salário","Freelance","Investimentos","Outros"];
const state = loadState();
let cashflowChart, categoryChart, annualChart;

function defaultState(){
  const now = new Date();
  return {
    user:{name:"Usuário",currency:"BRL",theme:"dark",plan:"Grátis"},
    transactions:[],
    budgets:[],
    goals:[],
    recurring:[]
  };
}
function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState()}catch(e){return defaultState()}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderAll()}
function money(v){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:state.user.currency||"BRL"}).format(Number(v)||0)}
function uid(prefix="id"){return prefix+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function dateBR(d){if(!d)return "-"; const x=new Date(d+"T12:00:00"); return x.toLocaleDateString("pt-BR")}
function monthKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function isThisMonth(t){return (t.date||"").startsWith(monthKey())}

function navigate(section){
  document.querySelectorAll(".section").forEach(x=>x.classList.toggle("active",x.id===section));
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.section===section));
  const titles={dashboard:["Dashboard","Visão geral das suas finanças"],transactions:["Lançamentos","Controle receitas, despesas e transferências."],budgets:["Orçamentos","Defina limites para não perder o controle."],goals:["Metas financeiras","Transforme objetivos em planos mensuráveis."],recurring:["Recorrentes","Contas e receitas que se repetem automaticamente."],reports:["Relatórios","Analise seu comportamento financeiro."],plans:["Planos","Escolha seu plano e desbloqueie recursos."],settings:["Configurações","Personalize seu FinControl."]};
  document.getElementById("pageTitle").textContent=titles[section]?.[0]||"FinControl";
  document.getElementById("pageSubtitle").textContent=titles[section]?.[1]||"";
  document.getElementById("sidebar").classList.remove("open");
  renderAll();
}

function currentTotals(){
  const ts=state.transactions.filter(isThisMonth);
  const income=ts.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
  const expense=ts.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
  return {income,expense,balance:income-expense,rate:income?((income-expense)/income*100):0};
}
function renderDashboard(){
  const x=currentTotals();
  document.getElementById("incomeTotal").textContent=money(x.income);
  document.getElementById("expenseTotal").textContent=money(x.expense);
  document.getElementById("balanceTotal").textContent=money(x.balance);
  document.getElementById("savingRate").textContent=(isFinite(x.rate)?x.rate:0).toFixed(1)+"%";
  document.getElementById("userNameLabel").textContent=state.user.name||"Usuário";
  document.getElementById("currentPlanBadge").textContent=state.user.plan||"Grátis";
  renderRecent();
  renderGoalsPreview();
  renderCharts();
}
function renderRecent(){
  const el=document.getElementById("recentTransactions");
  const arr=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  el.innerHTML=arr.length?arr.map(t=>`<div class="tx-row"><div class="tx-icon">${t.type==="income"?"↗":"↘"}</div><div class="tx-main"><strong>${esc(t.description)}</strong><small>${esc(t.category)} · ${dateBR(t.date)}</small></div><div class="tx-value ${t.type==="income"?"type-income":"type-expense"}">${t.type==="income"?"+":"-"} ${money(t.amount)}</div></div>`).join(""):`<p class="muted">Nenhum lançamento. Comece adicionando sua primeira movimentação.</p>`;
}
function renderGoalsPreview(){
  const el=document.getElementById("goalPreview");
  const arr=state.goals.slice(0,4);
  el.innerHTML=arr.length?arr.map(g=>{const p=Math.min(100,(g.current/g.target)*100||0);return `<div class="goal-item"><div class="goal-line"><span>${esc(g.name)}</span><small>${p.toFixed(0)}%</small></div><div class="progress"><i style="width:${p}%"></i></div></div>`}).join(""):`<p class="muted">Crie uma meta como "Reserva de emergência" ou "Comprar uma moto".</p>`;
}
function renderCharts(){
  if(typeof Chart==="undefined")return;
  const labels=[],inc=[],exp=[];
  const months=Number(document.getElementById("chartPeriod")?.value||6);
  const base=new Date(); base.setDate(1);
  for(let i=months-1;i>=0;i--){const d=new Date(base);d.setMonth(base.getMonth()-i);const key=monthKey(d);labels.push(d.toLocaleDateString("pt-BR",{month:"short"}));const ts=state.transactions.filter(t=>t.date?.startsWith(key));inc.push(ts.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0));exp.push(ts.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0))}
  cashflowChart?.destroy();
  cashflowChart=new Chart(document.getElementById("cashflowChart"),{type:"line",data:{labels,datasets:[{label:"Receitas",data:inc,tension:.35},{label:"Despesas",data:exp,tension:.35}]},options:{responsive:true,plugins:{legend:{labels:{color:getComputedStyle(document.body).getPropertyValue("--text")}}},scales:{x:{ticks:{color:"#8d9ab0"},grid:{display:false}},y:{ticks:{color:"#8d9ab0"},grid:{color:"rgba(141,154,176,.12)"}}}}});
  const cats={};state.transactions.filter(t=>isThisMonth(t)&&t.type==="expense").forEach(t=>cats[t.category]=(cats[t.category]||0)+Number(t.amount));
  categoryChart?.destroy();const labels2=Object.keys(cats),data2=Object.values(cats);
  categoryChart=new Chart(document.getElementById("categoryChart"),{type:"doughnut",data:{labels:labels2.length?labels2:["Sem despesas"],datasets:[{data:data2.length?data2:[1]}]},options:{cutout:"68%",plugins:{legend:{display:false}}}});
  document.getElementById("categoryLegend").innerHTML=labels2.map(k=>`<span>${esc(k)}: ${money(cats[k])}</span>`).join("");
}
function populateCategoryFilter(){const s=document.getElementById("filterCategory");if(!s)return;s.innerHTML='<option value="all">Todas categorias</option>'+categories.map(c=>`<option>${c}</option>`).join("")}
function renderTransactions(){
  populateCategoryFilter();
  const q=(document.getElementById("searchTransactions")?.value||"").toLowerCase();
  const type=document.getElementById("filterType")?.value||"all", cat=document.getElementById("filterCategory")?.value||"all", mon=document.getElementById("filterMonth")?.value||"";
  const arr=[...state.transactions].filter(t=>(!q||t.description.toLowerCase().includes(q))&&(type==="all"||t.type===type)&&(cat==="all"||t.category===cat)&&(!mon||t.date.startsWith(mon))).sort((a,b)=>b.date.localeCompare(a.date));
  document.getElementById("transactionsTable").innerHTML=arr.length?arr.map(t=>`<tr><td>${dateBR(t.date)}</td><td><strong>${esc(t.description)}</strong></td><td><span class="tag">${esc(t.category)}</span></td><td class="${t.type==="income"?"type-income":"type-expense"}">${t.type==="income"?"Receita":"Despesa"}</td><td>${esc(t.account||"Carteira")}</td><td class="${t.type==="income"?"type-income":"type-expense"}">${t.type==="income"?"+":"-"} ${money(t.amount)}</td><td><button class="text-btn" onclick="deleteTransaction('${t.id}')">Excluir</button></td></tr>`).join(""):`<tr><td colspan="7" class="muted">Nenhum lançamento encontrado.</td></tr>`;
}
function renderBudgets(){
  const el=document.getElementById("budgetsGrid");
  el.className="budgets-grid";
  el.innerHTML=state.budgets.length?state.budgets.map(b=>{const spent=state.transactions.filter(t=>isThisMonth(t)&&t.type==="expense"&&t.category===b.category).reduce((s,t)=>s+Number(t.amount),0);const p=Math.min(100,spent/b.limit*100||0);return `<article class="budget-card"><h3>${esc(b.category)}</h3><p>Limite mensal</p><div class="progress"><i style="width:${p}%"></i></div><div class="budget-amount"><span>${money(spent)} usados</span><strong>${money(b.limit)}</strong></div><button class="text-btn" onclick="deleteBudget('${b.id}')">Excluir</button></article>`}).join(""):`<article class="panel"><p class="muted">Nenhum orçamento criado.</p></article>`;
}
function renderGoals(){
  const el=document.getElementById("goalsGrid");
  el.innerHTML=state.goals.length?state.goals.map(g=>{const p=Math.min(100,(g.current/g.target)*100||0);return `<article class="goal-card"><h3>${esc(g.name)}</h3><div class="target">Meta para ${dateBR(g.deadline)}</div><div class="goal-big">${money(g.current)} <span class="muted">/ ${money(g.target)}</span></div><div class="progress"><i style="width:${p}%"></i></div><div class="goal-line"><span>${p.toFixed(1)}% concluído</span><small>${money(Math.max(0,g.target-g.current))} restantes</small></div><div class="goal-actions"><button class="primary-btn" onclick="addToGoal('${g.id}')">＋ Aportar</button><button class="text-btn" onclick="deleteGoal('${g.id}')">Excluir</button></div></article>`}).join(""):`<article class="panel"><p class="muted">Nenhuma meta criada.</p></article>`;
}
function renderRecurring(){
  const el=document.getElementById("recurringGrid");
  el.innerHTML=state.recurring.length?state.recurring.map(r=>`<article class="rec-card"><h3>${esc(r.description)}</h3><p class="muted">${esc(r.category)} · ${r.type==="income"?"Receita":"Despesa"} · dia ${r.day}</p><div class="goal-big">${r.type==="income"?"+":"-"} ${money(r.amount)}</div><button class="text-btn" onclick="deleteRecurring('${r.id}')">Excluir</button></article>`).join(""):`<article class="panel"><p class="muted">Nenhum lançamento recorrente.</p></article>`;
}
function renderReports(){
  const totals=currentTotals(), annual={};
  for(let i=0;i<12;i++){const d=new Date();d.setMonth(d.getMonth()-i);const key=monthKey(d);const ts=state.transactions.filter(t=>t.date.startsWith(key));annual[key]={income:ts.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0),expense:ts.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0)}}
  const labels=Object.keys(annual).reverse().map(k=>{const [y,m]=k.split("-");return new Date(Number(y),Number(m)-1).toLocaleDateString("pt-BR",{month:"short"})});
  const vals=Object.values(annual).reverse();
  annualChart?.destroy();annualChart=new Chart(document.getElementById("annualChart"),{type:"bar",data:{labels,datasets:[{label:"Receitas",data:vals.map(x=>x.income)},{label:"Despesas",data:vals.map(x=>x.expense)}]},options:{responsive:true,plugins:{legend:{labels:{color:getComputedStyle(document.body).getPropertyValue("--text")}}}}});
  const debt=state.transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0), inc=state.transactions.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
  document.getElementById("reportIndicators").innerHTML=`<div class="indicator"><span>Saldo do mês</span><strong>${money(totals.balance)}</strong></div><div class="indicator"><span>Taxa de economia</span><strong>${totals.rate.toFixed(1)}%</strong></div><div class="indicator"><span>Total movimentado (todos os registros)</span><strong>${money(inc+debt)}</strong></div><div class="indicator"><span>Quantidade de lançamentos</span><strong>${state.transactions.length}</strong></div>`;
}
function renderSettings(){document.getElementById("settingsName").value=state.user.name||"";document.getElementById("settingsCurrency").value=state.user.currency||"BRL";document.body.classList.toggle("light",state.user.theme==="light")}
function renderAll(){renderDashboard();renderTransactions();renderBudgets();renderGoals();renderRecurring();renderReports();renderSettings()}

function openModal(title,body,onSave){
  const back=document.getElementById("modalBackdrop"), modal=document.getElementById("modal");
  modal.innerHTML=`<div class="modal-head"><h3>${title}</h3><button class="close-btn" id="closeModal">×</button></div>${body}<div class="modal-actions"><button class="secondary-btn" id="cancelModal">Cancelar</button><button class="primary-btn" id="saveModal">Salvar</button></div>`;
  back.classList.add("open");document.getElementById("closeModal").onclick=()=>back.classList.remove("open");document.getElementById("cancelModal").onclick=()=>back.classList.remove("open");document.getElementById("saveModal").onclick=()=>{if(onSave()){back.classList.remove("open");save();toast("Salvo com sucesso!")}};
}
function transactionModal(){
  const today=new Date().toISOString().slice(0,10);
  openModal("Novo lançamento",`<div class="form-grid"><div class="form-field"><label>Tipo</label><select id="fType"><option value="expense">Despesa</option><option value="income">Receita</option></select></div><div class="form-field"><label>Valor</label><input id="fAmount" type="number" step="0.01" min="0.01" placeholder="0,00"></div><div class="form-field full-row"><label>Descrição</label><input id="fDesc" placeholder="Ex.: Supermercado"></div><div class="form-field"><label>Categoria</label><select id="fCat">${categories.map(c=>`<option>${c}</option>`).join("")}</select></div><div class="form-field"><label>Conta</label><input id="fAccount" placeholder="Carteira, Nubank..."></div><div class="form-field"><label>Data</label><input id="fDate" type="date" value="${today}"></div></div>`,()=>{
    const amount=Number(document.getElementById("fAmount").value),desc=document.getElementById("fDesc").value.trim();if(!amount||!desc){toast("Informe descrição e valor.");return false}
    state.transactions.push({id:uid("tx"),type:document.getElementById("fType").value,amount,description:desc,category:document.getElementById("fCat").value,account:document.getElementById("fAccount").value.trim()||"Carteira",date:document.getElementById("fDate").value});return true
  });
}
function budgetModal(){
  openModal("Novo orçamento",`<div class="form-grid"><div class="form-field"><label>Categoria</label><select id="bCat">${categories.filter(x=>!["Salário","Freelance","Investimentos"].includes(x)).map(c=>`<option>${c}</option>`).join("")}</select></div><div class="form-field"><label>Limite mensal</label><input id="bLimit" type="number" step="0.01" min="1" placeholder="500"></div></div>`,()=>{const limit=Number(document.getElementById("bLimit").value);if(!limit){toast("Informe um limite.");return false}state.budgets.push({id:uid("budget"),category:document.getElementById("bCat").value,limit});return true})
}
function goalModal(){
  openModal("Nova meta",`<div class="form-grid"><div class="form-field full-row"><label>Nome da meta</label><input id="gName" placeholder="Reserva de emergência"></div><div class="form-field"><label>Valor da meta</label><input id="gTarget" type="number" step="0.01" min="1"></div><div class="form-field"><label>Já guardado</label><input id="gCurrent" type="number" step="0.01" min="0" value="0"></div><div class="form-field"><label>Prazo</label><input id="gDate" type="date"></div></div>`,()=>{const name=document.getElementById("gName").value.trim(),target=Number(document.getElementById("gTarget").value);if(!name||!target){toast("Informe nome e valor da meta.");return false}state.goals.push({id:uid("goal"),name,target,current:Number(document.getElementById("gCurrent").value)||0,deadline:document.getElementById("gDate").value||new Date().toISOString().slice(0,10)});return true})
}
function recurringModal(){
  openModal("Novo recorrente",`<div class="form-grid"><div class="form-field"><label>Tipo</label><select id="rType"><option value="expense">Despesa</option><option value="income">Receita</option></select></div><div class="form-field"><label>Valor</label><input id="rAmount" type="number" step="0.01" min="0.01"></div><div class="form-field full-row"><label>Descrição</label><input id="rDesc" placeholder="Aluguel, salário, internet..."></div><div class="form-field"><label>Categoria</label><select id="rCat">${categories.map(c=>`<option>${c}</option>`).join("")}</select></div><div class="form-field"><label>Dia do mês</label><input id="rDay" type="number" min="1" max="31" value="10"></div></div>`,()=>{const amount=Number(document.getElementById("rAmount").value),desc=document.getElementById("rDesc").value.trim();if(!amount||!desc){toast("Preencha os campos.");return false}state.recurring.push({id:uid("rec"),type:document.getElementById("rType").value,amount,description:desc,category:document.getElementById("rCat").value,day:Number(document.getElementById("rDay").value)||1});return true})
}
function addToGoal(id){const g=state.goals.find(x=>x.id===id);if(!g)return;const v=Number(prompt(`Quanto deseja aportar em "${g.name}"?`));if(v>0){g.current=Math.min(g.target,g.current+v);save();toast("Aporte registrado!")}}
function deleteTransaction(id){if(confirm("Excluir este lançamento?")){state.transactions=state.transactions.filter(x=>x.id!==id);save();toast("Lançamento excluído.")}}
function deleteBudget(id){if(confirm("Excluir este orçamento?")){state.budgets=state.budgets.filter(x=>x.id!==id);save()}}
function deleteGoal(id){if(confirm("Excluir esta meta?")){state.goals=state.goals.filter(x=>x.id!==id);save()}}
function deleteRecurring(id){if(confirm("Excluir este recorrente?")){state.recurring=state.recurring.filter(x=>x.id!==id);save()}}

function seedDemo(){
  const today=new Date(); const d=n=>{const x=new Date(today);x.setDate(x.getDate()-n);return x.toISOString().slice(0,10)}
  state.transactions=[
    {id:uid("tx"),type:"income",amount:2300,description:"Salário",category:"Salário",account:"Banco",date:d(2)},
    {id:uid("tx"),type:"expense",amount:450,description:"Supermercado",category:"Alimentação",account:"Banco",date:d(3)},
    {id:uid("tx"),type:"expense",amount:180,description:"Combustível",category:"Transporte",account:"Carteira",date:d(5)},
    {id:uid("tx"),type:"expense",amount:120,description:"Internet",category:"Assinaturas",account:"Banco",date:d(7)},
    {id:uid("tx"),type:"expense",amount:90,description:"Lazer",category:"Lazer",account:"Carteira",date:d(10)}
  ];
  state.budgets=[{id:uid("b"),category:"Alimentação",limit:700},{id:uid("b"),category:"Transporte",limit:350},{id:uid("b"),category:"Lazer",limit:250}];
  state.goals=[{id:uid("g"),name:"Reserva de emergência",target:10000,current:2500,deadline:new Date(today.getFullYear(),today.getMonth()+8,1).toISOString().slice(0,10)},{id:uid("g"),name:"Viagem",target:4000,current:1200,deadline:new Date(today.getFullYear(),today.getMonth()+5,1).toISOString().slice(0,10)}];
  state.recurring=[{id:uid("r"),type:"expense",amount:120,description:"Internet",category:"Assinaturas",day:10},{id:uid("r"),type:"income",amount:2300,description:"Salário",category:"Salário",day:5}];
  save();toast("Dados de demonstração carregados.")
}
function exportCSV(){
  const rows=[["Data","Descrição","Categoria","Tipo","Conta","Valor"],...state.transactions.map(t=>[t.date,t.description,t.category,t.type,t.account,t.amount])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="fincontrol-lancamentos.csv";a.click();URL.revokeObjectURL(url)
}
function subscribe(plan){
  const url=PAYMENT_LINKS[plan];
  if(!url||url.startsWith("COLE_AQUI")){toast("Configure o link de pagamento no app.js primeiro.");navigate("settings");return}
  window.open(url,"_blank");
}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove("show"),2800)}

document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.section)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
document.getElementById("quickAddBtn").onclick=transactionModal;
document.getElementById("addTransactionBtn").onclick=transactionModal;
document.getElementById("addBudgetBtn").onclick=budgetModal;
document.getElementById("addGoalBtn").onclick=goalModal;
document.getElementById("addRecurringBtn").onclick=recurringModal;
document.getElementById("exportBtn").onclick=exportCSV;
document.getElementById("seedBtn").onclick=seedDemo;
document.getElementById("clearBtn").onclick=()=>{if(confirm("Isso apagará todos os lançamentos, metas e orçamentos deste aparelho. Continuar?")){localStorage.removeItem(STORAGE_KEY);location.reload()}};
document.getElementById("menuBtn").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
document.getElementById("themeBtn").onclick=()=>{state.user.theme=state.user.theme==="light"?"dark":"light";save()};
document.getElementById("saveSettingsBtn").onclick=()=>{state.user.name=document.getElementById("settingsName").value.trim()||"Usuário";state.user.currency=document.getElementById("settingsCurrency").value;save();toast("Configurações salvas.")};
document.getElementById("chartPeriod").onchange=renderCharts;
["searchTransactions","filterType","filterCategory","filterMonth"].forEach(id=>document.getElementById(id).addEventListener("input",renderTransactions));
document.querySelectorAll("[data-plan]").forEach(b=>b.addEventListener("click",()=>subscribe(b.dataset.plan)));

renderAll();
