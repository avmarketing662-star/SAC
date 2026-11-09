/* SAC Supermercado Avenida
 * Persistência local: IndexedDB. Para múltiplos computadores, configure API_BASE
 * e implemente os endpoints descritos em apiRequest(). Nunca use LocalStorage como
 * banco compartilhado: ele pertence ao navegador/dispositivo atual.
 */
'use strict';

const CONFIG = {
  API_BASE: '', // Ex.: 'https://seudominio.com/api'. Vazio = modo local (IndexedDB).
  USE_DEMO_DATA: true,
  DATABASE: 'SACAvenidaDB',
  DB_VERSION: 1
};
const CITIES = ['Camanducaia','Cambuí','Extrema','Itapeva'];
const UNITS = {'Camanducaia':'Camanducaia','Cambuí':'Cambuí','Extrema':'Extrema','Itapeva':'Itapeva'};
const AGENTS = ['João Fernando','Lavínia'];
const CATEGORIES = ['Açougue','Padaria','Hortifruti','Mercearia','Bebidas','Caixa','Atendimento','Preços','Promoções','Outros'];
const STATUSES = ['Aberto','Em Atendimento','Resolvido','Cancelado'];
let db, protocols = [], clients = [], charts = {}, reportRows = [], activeClientHistoryId = null;

const $ = id => document.getElementById(id);
const nowISO = () => new Date().toISOString();
const dateBR = value => value ? new Date(value).toLocaleDateString('pt-BR') : '—';
const dateTimeBR = value => value ? new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}) : '—';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusClass = s => ({'Aberto':'aberto','Em Atendimento':'em-atendimento','Resolvido':'resolvido','Cancelado':'cancelado'}[s] || 'aberto');
const statusBadge = s => `<span class="status status-${statusClass(s)}">${esc(s)}</span>`;
const id = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const formatPhone = value => value.replace(/\D/g,'').slice(0,11);

function toast(message, error=false) {
  const el=document.createElement('div'); el.className=`toast${error?' error':''}`; el.textContent=message;
  $('toastContainer').appendChild(el); setTimeout(()=>el.remove(),3500);
}
function openDB() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(CONFIG.DATABASE,CONFIG.DB_VERSION);
    request.onupgradeneeded=()=>{
      const database=request.result;
      if(!database.objectStoreNames.contains('protocols')) database.createObjectStore('protocols',{keyPath:'id'});
      if(!database.objectStoreNames.contains('clients')) database.createObjectStore('clients',{keyPath:'id'});
      if(!database.objectStoreNames.contains('history')) database.createObjectStore('history',{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error);
  });
}
function storeRequest(store,mode,operation) {
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,mode), objectStore=tx.objectStore(store);
    let request;
    try{request=operation(objectStore);}catch(e){reject(e);return;}
    if(request){request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}
    else{tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);}
  });
}
const dbGetAll = store => storeRequest(store,'readonly',s=>s.getAll());
const dbPut = (store,value) => storeRequest(store,'readwrite',s=>s.put(value));
const dbDelete = (store,key) => storeRequest(store,'readwrite',s=>s.delete(key));

async function apiRequest(path, options={}) {
  if(!CONFIG.API_BASE) throw new Error('API não configurada.');
  const response=await fetch(`${CONFIG.API_BASE}${path}`,{
    ...options,headers:{'Content-Type':'application/json',...(options.headers||{})}
  });
  if(!response.ok) throw new Error(`Erro na API (${response.status})`);
  return response.status===204?null:response.json();
}
const repository = {
  async all(){
    if(CONFIG.API_BASE) return apiRequest('/protocolos');
    return dbGetAll('protocols');
  },
  async save(protocol){
    if(CONFIG.API_BASE) return apiRequest(protocol.id?`/protocolos/${protocol.id}`:'/protocolos',{method:protocol.id?'PUT':'POST',body:JSON.stringify(protocol)});
    await dbPut('protocols',protocol); return protocol;
  },
  async remove(protocolId){
    if(CONFIG.API_BASE) return apiRequest(`/protocolos/${protocolId}`,{method:'DELETE'});
    return dbDelete('protocols',protocolId);
  },
  async allClients(){
    if(CONFIG.API_BASE) return apiRequest('/clientes');
    return dbGetAll('clients');
  },
  async saveClient(client){
    if(CONFIG.API_BASE) return apiRequest(client.id?`/clientes/${client.id}`:'/clientes',{method:client.id?'PUT':'POST',body:JSON.stringify(client)});
    await dbPut('clients',client); return client;
  },
  async addHistory(protocolId,entry){
    if(CONFIG.API_BASE) return apiRequest(`/protocolos/${protocolId}/historico`,{method:'POST',body:JSON.stringify(entry)});
    await dbPut('history',entry); return entry;
  },
  async history(protocolId){
    if(CONFIG.API_BASE) return apiRequest(`/protocolos/${protocolId}/historico`);
    return (await dbGetAll('history')).filter(x=>x.protocolId===protocolId).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  }
};

function populateSelect(selectId,values,placeholder='Selecione') {
  const select=$(selectId); if(!select)return;
  const current=select.value;
  select.innerHTML=`<option value="">${placeholder}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if(values.includes(current)) select.value=current;
}
function initSelects(){
  populateSelect('city',CITIES); populateSelect('agent',AGENTS); populateSelect('historyAgent',AGENTS);
  populateSelect('registeredClientCity',CITIES);
  populateSelect('category',CATEGORIES); populateSelect('filterCity',CITIES,'Todas as cidades');
  populateSelect('filterUnit',Object.values(UNITS),'Todas as unidades');
  populateSelect('filterAgent',AGENTS,'Todos os atendentes');
  populateSelect('filterCategory',CATEGORIES,'Todas as categorias');
  $('city').addEventListener('change',()=>{const c=$('city').value;populateSelect('unit',c?[UNITS[c]]:[],'Selecione a unidade');});
  $('registeredClientCity').addEventListener('change',()=>{const c=$('registeredClientCity').value;populateSelect('registeredClientUnit',c?[UNITS[c]]:[],'Selecione a unidade');});
}
function nextProtocolNumber(){
  const year=new Date().getFullYear();
  const max=protocols.reduce((m,p)=>Math.max(m,Number((p.number||'').split('-').pop())||0),0);
  return `SAC-${year}-${String(max+1).padStart(5,'0')}`;
}
function demoData(){
  if(!CONFIG.USE_DEMO_DATA)return [];
  const samples=[
    ['Maria Oliveira','Camanducaia','WhatsApp','Reclamação','Açougue','João Fernando','Resolvido','Cliente relatou odor desagradável próximo ao setor de açougue.'],
    ['Carlos Mendes','Extrema','Instagram','Sugestão','Atendimento','Lavínia','Em Atendimento','Sugestão para melhorar a sinalização dos corredores.'],
    ['Ana Paula Souza','Cambuí','Presencial','Elogio','Hortifruti','João Fernando','Resolvido','Elogiou a organização e a qualidade dos produtos do hortifruti.'],
    ['Roberto Lima','Itapeva','Facebook','Reclamação','Preços','Lavínia','Aberto','Cliente identificou divergência entre o preço anunciado e o registrado no caixa.'],
    ['Fernanda Costa','Extrema','WhatsApp','Solicitação','Bebidas','João Fernando','Cancelado','Solicitou informação sobre disponibilidade de produto.'],
    ['Pedro Henrique','Camanducaia','Presencial','Reclamação','Caixa','Lavínia','Em Atendimento','Relatou demora no atendimento dos caixas em horário de pico.']
  ];
  return samples.map((s,i)=>{
    const d=new Date();d.setDate(d.getDate()-i*3);
    return {id:id(),number:`SAC-${d.getFullYear()}-${String(i+1).padStart(5,'0')}`,createdAt:d.toISOString(),updatedAt:d.toISOString(),clientName:s[0],phone:'',city:s[1],unit:UNITS[s[1]],channel:s[2],manifestation:s[3],category:s[4],agent:s[5],status:s[6],description:s[7]};
  });
}
async function init(){
  try{
    db=await openDB();
    protocols=await repository.all();
    clients=await repository.allClients();
    if(!protocols.length && CONFIG.USE_DEMO_DATA && !CONFIG.API_BASE){
      protocols=demoData();
      for(const p of protocols){await dbPut('protocols',p);await dbPut('history',{id:id(),protocolId:p.id,createdAt:p.createdAt,agent:p.agent,description:'Protocolo criado para demonstração do sistema.',status:p.status,notes:'Dado fictício de demonstração.'});}
    }
    // Vincula protocolos antigos a um cadastro de cliente sem duplicar registros.
    for(const p of protocols){
      let c=findClientForProtocol(p);
      if(!c){c={id:id(),name:p.clientName,phone:p.phone||'',city:p.city||'',unit:p.unit||'',notes:'',createdAt:p.createdAt||nowISO(),updatedAt:nowISO()};await repository.saveClient(c);clients.push(c);}
      if(!p.clientId){p.clientId=c.id;await repository.save(p);}
    }
  }catch(error){console.error(error);toast('Não foi possível abrir o banco local do navegador.',true);protocols=[];clients=[];}
  initSelects(); bindEvents();
  $('todayLabel').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
  $('yearNow').textContent=new Date().getFullYear();
  refreshAll();
  resetForm();
  if(CONFIG.API_BASE) setInterval(syncFromServer,30000);
}
async function syncFromServer(){
  try{protocols=await repository.all();refreshAll();}catch(e){console.warn('Sincronização pendente:',e);}
}
function bindEvents(){
  document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
  $('menuToggle').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
  $('protocolForm').addEventListener('submit',saveProtocol);
  $('cancelForm').addEventListener('click',()=>{resetForm();navigate('protocolos');});
  $('clientPhone').addEventListener('input',e=>{let n=formatPhone(e.target.value);e.target.value=n.length>10?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:n.length>6?`(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`:n;});
  ['searchProtocol','filterCity','filterUnit','filterAgent','filterStatus','filterCategory','filterStart','filterEnd','sortProtocols'].forEach(k=>$(k).addEventListener(k==='searchProtocol'?'input':'change',renderProtocols));
  $('clearFilters').addEventListener('click',()=>{['searchProtocol','filterCity','filterUnit','filterAgent','filterStatus','filterCategory','filterStart','filterEnd'].forEach(k=>$(k).value='');$('sortProtocols').value='newest';renderProtocols();});
  $('exportFiltered').addEventListener('click',()=>exportCSV(filteredProtocols(),'protocolos_filtrados.csv'));
  $('historyForm').addEventListener('submit',saveHistory);
  $('searchClient').addEventListener('input',renderClients);
  $('newClientBtn').addEventListener('click',()=>openClientForm());
  $('cancelClientForm').addEventListener('click',()=>{$('clientFormPanel').classList.add('hidden');$('clientForm').reset();});
  $('clientForm').addEventListener('submit',saveClientForm);
  $('printClientHistory').addEventListener('click',()=>printClientHistory(activeClientHistoryId));
  $('printDashboard').addEventListener('click',printDashboard);
  $('generateReport').addEventListener('click',generateReport);
  $('exportReport').addEventListener('click',()=>exportCSV(reportRows,'relatorio_sac.csv'));
  $('printReport').addEventListener('click',()=>{generateReport();window.print();});
  document.addEventListener('click',handleTableActions);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal-backdrop').forEach(m=>m.classList.add('hidden'));});
}
function navigate(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${page}`));
  document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  const names={dashboard:'Dashboard',protocolos:'Protocolos',clientes:'Clientes',novo:'Novo atendimento',relatorios:'Relatórios'};
  $('pageCrumb').textContent=names[page]||'Dashboard';$('sidebar').classList.remove('open');
  if(page==='novo'&&!$('editingId').value)resetForm();
  if(page==='relatorios')generateReport();
  if(page==='clientes')renderClients();
  window.scrollTo({top:0,behavior:'smooth'});
}
function resetForm(){
  $('protocolForm').reset();$('editingId').value='';$('formTitle').textContent='Novo protocolo';
  $('protocolNumber').value=nextProtocolNumber();$('protocolDate').value=dateTimeBR(nowISO());
  $('status').value='Aberto';populateSelect('unit',[],'Selecione a cidade primeiro');
}

function normalizeClientKey(value){return String(value||'').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g,' ');}
function findClientForProtocol(p){
  const phone=String(p.phone||'').replace(/\D/g,'');
  return clients.find(c=>phone && String(c.phone||'').replace(/\D/g,'')===phone)
    || clients.find(c=>normalizeClientKey(c.name)===normalizeClientKey(p.clientName) && (!c.city||c.city===p.city));
}
async function ensureClientForProtocol(data){
  let c=(data.clientId&&clients.find(x=>x.id===data.clientId))||findClientForProtocol(data);
  if(!c){
    c={id:id(),name:data.clientName,phone:data.phone||'',city:data.city,unit:data.unit,notes:'',createdAt:nowISO(),updatedAt:nowISO()};
  }else{
    c={...c,name:data.clientName,phone:data.phone||c.phone||'',city:data.city||c.city,unit:data.unit||c.unit,updatedAt:nowISO()};
  }
  await repository.saveClient(c);
  const idx=clients.findIndex(x=>x.id===c.id);if(idx>=0)clients[idx]=c;else clients.push(c);
  data.clientId=c.id;
  return c;
}
function openClientForm(client=null){
  $('clientForm').reset();$('clientEditingId').value=client?.id||'';
  $('clientFormTitle').textContent=client?'Editar cliente':'Cadastrar cliente';
  $('registeredClientName').value=client?.name||'';
  $('registeredClientPhone').value=client?.phone||'';
  $('registeredClientCity').value=client?.city||'';
  populateSelect('registeredClientUnit',client?.city?[UNITS[client.city]||client.unit]:[],'Selecione a unidade');
  $('registeredClientUnit').value=client?.unit||'';
  $('registeredClientNotes').value=client?.notes||'';
  $('clientFormPanel').classList.remove('hidden');
  $('clientFormPanel').scrollIntoView({behavior:'smooth',block:'start'});
}
async function saveClientForm(e){
  e.preventDefault();
  const old=clients.find(c=>c.id===$('clientEditingId').value);
  const c={id:old?.id||id(),name:$('registeredClientName').value.trim(),phone:$('registeredClientPhone').value.trim(),
    city:$('registeredClientCity').value,unit:$('registeredClientUnit').value,notes:$('registeredClientNotes').value.trim(),
    createdAt:old?.createdAt||nowISO(),updatedAt:nowISO()};
  if(!c.name||!c.city){toast('Informe o nome e a cidade do cliente.',true);return;}
  try{
    await repository.saveClient(c);
    const i=clients.findIndex(x=>x.id===c.id);if(i>=0)clients[i]=c;else clients.push(c);
    $('clientFormPanel').classList.add('hidden');$('clientForm').reset();renderClients();refreshAll();
    toast(old?'Cadastro do cliente atualizado!':'Cliente cadastrado com sucesso!');
  }catch(err){console.error(err);toast('Não foi possível salvar o cliente.',true);}
}
function renderClients(){
  const q=normalizeClientKey($('searchClient')?.value||'');
  const rows=clients.filter(c=>!q||normalizeClientKey([c.name,c.phone,c.city,c.unit].join(' ')).includes(q))
    .sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  $('clientCount').textContent=`${rows.length} cliente(s)`;
  $('navClients').textContent=clients.length;
  $('clientTable').innerHTML=rows.map(c=>{
    const related=protocols.filter(p=>p.clientId===c.id||(!p.clientId&&findClientForProtocol(p)?.id===c.id));
    const last=related.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0];
    return `<tr><td class="client-cell">${esc(c.name)}</td><td>${esc(c.phone||'—')}</td><td>${esc(c.city||'—')}</td><td>${related.length}</td><td>${last?dateBR(last.createdAt):'—'}</td><td><div class="action-group"><button class="table-action" title="Histórico do cliente" data-client-action="history" data-id="${c.id}"><i class="fa-solid fa-clock-rotate-left"></i></button><button class="table-action" title="Editar cadastro" data-client-action="edit" data-id="${c.id}"><i class="fa-regular fa-pen-to-square"></i></button></div></td></tr>`;
  }).join('');
  $('emptyClients').classList.toggle('hidden',rows.length>0);
  $('clientTable').parentElement.classList.toggle('hidden',rows.length===0);
}
async function showClientHistory(clientId){
  const c=clients.find(x=>x.id===clientId);if(!c)return;
  activeClientHistoryId=clientId;
  const rows=protocols.filter(p=>p.clientId===clientId||(!p.clientId&&findClientForProtocol(p)?.id===clientId))
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const sections=[];
  for(const p of rows){
    const entries=await repository.history(p.id);
    sections.push(`<article class="client-history-protocol">
      <div class="client-history-protocol-head"><div><strong>${esc(p.number)}</strong><span>${dateTimeBR(p.createdAt)} • ${esc(p.manifestation)} • ${esc(p.category)}</span></div>${statusBadge(p.status)}</div>
      <p><b>Unidade:</b> ${esc(p.unit||'—')} &nbsp; <b>Canal:</b> ${esc(p.channel||'—')} &nbsp; <b>Atendente:</b> ${esc(p.agent||'—')}</p>
      <p><b>Relato:</b> ${esc(p.description)}</p>
      <div class="client-history-updates">${entries.map(h=>`<div><b>${dateTimeBR(h.createdAt)} — ${esc(h.agent||'Atendente não informado')}</b><p>${esc(h.description)}</p>${h.status?`<small>Status: ${esc(h.status)}</small>`:''}${h.notes?`<small>Observação interna: ${esc(h.notes)}</small>`:''}</div>`).join('')||'<small>Sem atualizações adicionais.</small>'}</div>
    </article>`);
  }
  $('clientHistoryTitle').textContent=`Histórico • ${c.name}`;
  $('clientHistoryContent').innerHTML=`<div class="client-history-summary"><div><span>Cliente</span><strong>${esc(c.name)}</strong></div><div><span>Telefone</span><strong>${esc(c.phone||'Não informado')}</strong></div><div><span>Cidade / unidade</span><strong>${esc(c.city||'—')} / ${esc(c.unit||'—')}</strong></div><div><span>Total de atendimentos</span><strong>${rows.length}</strong></div>${c.notes?`<div class="client-notes"><span>Observações do cadastro</span><strong>${esc(c.notes)}</strong></div>`:''}</div>
    <div class="client-history-list">${sections.join('')||'<div class="empty-state"><b>Nenhum atendimento encontrado</b><span>Os próximos protocolos vinculados a este cliente aparecerão aqui.</span></div>'}</div>`;
  $('clientHistoryModal').classList.remove('hidden');
}
async function printClientHistory(clientId){
  const c=clients.find(x=>x.id===clientId);if(!c)return;
  const rows=protocols.filter(p=>p.clientId===clientId||(!p.clientId&&findClientForProtocol(p)?.id===clientId))
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  let content='';
  for(const p of rows){
    const entries=await repository.history(p.id);
    content+=`<section class="print-protocol"><h2>${esc(p.number)} — ${esc(p.manifestation)}</h2>
      <p><b>Abertura:</b> ${dateTimeBR(p.createdAt)} &nbsp; <b>Status:</b> ${esc(p.status)} &nbsp; <b>Unidade:</b> ${esc(p.unit||'—')}</p>
      <p><b>Categoria:</b> ${esc(p.category)} &nbsp; <b>Canal:</b> ${esc(p.channel)} &nbsp; <b>Atendente:</b> ${esc(p.agent)}</p>
      <p><b>Descrição:</b><br>${esc(p.description)}</p>
      <h3>Atualizações</h3>${entries.map(h=>`<div class="print-update"><b>${dateTimeBR(h.createdAt)} — ${esc(h.agent||'Atendente não informado')}</b><p>${esc(h.description)}</p>${h.status?`<small>Status: ${esc(h.status)}</small>`:''}${h.notes?`<p><small>Observação interna: ${esc(h.notes)}</small></p>`:''}</div>`).join('')||'<p>Sem atualizações.</p>'}</section>`;
  }
  const w=window.open('','_blank','width=900,height=700');
  if(!w){toast('Permita a abertura de pop-ups para imprimir o histórico.',true);return;}
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Histórico do cliente - ${esc(c.name)}</title><style>
    body{font:13px Arial,sans-serif;color:#222;margin:28px}h1{color:#063B7A;margin-bottom:5px}.muted{color:#666}.client-data{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:14px;background:#f2f5f9;margin:18px 0}.print-protocol{border-top:2px solid #063B7A;padding:14px 0;break-inside:avoid}.print-protocol h2{font-size:16px;color:#063B7A}.print-update{border-left:3px solid #9bb9d8;padding:5px 12px;margin:8px 0}.print-update p{margin:5px 0}small{color:#555}@media print{body{margin:12mm}}
  </style></head><body><h1>SUPERMERCADO AVENIDA — SAC</h1><h2>Histórico de atendimentos do cliente</h2>
  <div class="client-data"><div><b>Cliente:</b> ${esc(c.name)}</div><div><b>Telefone:</b> ${esc(c.phone||'Não informado')}</div><div><b>Cidade:</b> ${esc(c.city||'—')}</div><div><b>Unidade:</b> ${esc(c.unit||'—')}</div><div><b>Total de atendimentos:</b> ${rows.length}</div><div><b>Emitido em:</b> ${dateTimeBR(nowISO())}</div></div>
  ${c.notes?`<p><b>Observações:</b> ${esc(c.notes)}</p>`:''}${content||'<p>Nenhum atendimento registrado para este cliente.</p>'}
  <script>window.onload=()=>{window.print();};<\/script></body></html>`);
  w.document.close();
}
function printDashboard(){
  document.body.classList.add('print-dashboard');
  const cleanup=()=>document.body.classList.remove('print-dashboard');
  window.addEventListener('afterprint',cleanup,{once:true});
  window.print();
  setTimeout(cleanup,1500);
}

async function saveProtocol(event){
  event.preventDefault();
  const editingId=$('editingId').value;
  const old=protocols.find(p=>p.id===editingId);
  const data={
    id:old?.id||id(),number:old?.number||nextProtocolNumber(),createdAt:old?.createdAt||nowISO(),updatedAt:nowISO(),
    clientName:$('clientName').value.trim(),phone:$('clientPhone').value.trim(),city:$('city').value,unit:$('unit').value,
    channel:$('channel').value,manifestation:$('manifestation').value,category:$('category').value,
    agent:$('agent').value,status:$('status').value,description:$('description').value.trim()
  };
  if(!data.clientName||!data.city||!data.unit||!data.channel||!data.manifestation||!data.category||!data.agent||!data.description){toast('Preencha todos os campos obrigatórios.',true);return;}
  try{
    const linkedClient=await ensureClientForProtocol(data);
    await repository.save(data);
    if(!old){await repository.addHistory(data.id,{id:id(),protocolId:data.id,createdAt:data.createdAt,agent:data.agent,description:'Protocolo registrado no sistema.',status:data.status,notes:'Registro inicial.'});}
    else if(old.status!==data.status){await repository.addHistory(data.id,{id:id(),protocolId:data.id,createdAt:nowISO(),agent:data.agent,description:`Dados do protocolo editados. Status alterado de "${old.status}" para "${data.status}".`,status:data.status,notes:'Atualização realizada na edição do protocolo.'});}
    await syncFromServer();toast(old?'Protocolo atualizado com sucesso!':'Protocolo cadastrado com sucesso!');resetForm();navigate('protocolos');
  }catch(e){console.error(e);toast('Erro ao salvar protocolo. Verifique a conexão e tente novamente.',true);}
}
function refreshAll(){renderDashboard();renderProtocols();renderClients();$('navTotal').textContent=protocols.length;}
function renderDashboard(){
  const count=s=>protocols.filter(p=>p.status===s).length;
  $('statTotal').textContent=protocols.length;$('statOpen').textContent=count('Aberto');$('statProgress').textContent=count('Em Atendimento');$('statResolved').textContent=count('Resolvido');$('statCanceled').textContent=count('Cancelado');
  const resolved=protocols.filter(p=>p.status==='Resolvido');
  const rate=protocols.length?Math.round(resolved.length/protocols.length*100):0;
  $('resolutionRate').textContent=`${rate}%`;$('resolutionBar').style.width=`${rate}%`;
  const durations=resolved.filter(p=>p.resolvedAt||p.updatedAt).map(p=>(new Date(p.resolvedAt||p.updatedAt)-new Date(p.createdAt))/3600000).filter(n=>n>=0);
  const avg=durations.length?durations.reduce((a,b)=>a+b,0)/durations.length:null;
  $('statAverage').textContent=avg===null?'—':avg<24?`${avg.toFixed(1)} h`:`${(avg/24).toFixed(1)} d`;
  const recent=[...protocols].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
  $('recentTable').innerHTML=recent.length?recent.map(p=>`<tr><td><button class="protocol-link" data-action="detail" data-id="${p.id}">${esc(p.number)}</button></td><td class="client-cell">${esc(p.clientName)}</td><td>${esc(p.unit)}</td><td>${esc(p.category)}</td><td>${statusBadge(p.status)}</td><td><button class="table-action" title="Ver detalhes" data-action="detail" data-id="${p.id}"><i class="fa-regular fa-eye"></i></button></td></tr>`).join(''):`<tr><td colspan="6">Nenhum protocolo cadastrado.</td></tr>`;
  drawCharts();
}
function drawCharts(){
  if(typeof Chart==='undefined')return;
  const statusLabels=STATUSES, statusValues=statusLabels.map(s=>protocols.filter(p=>p.status===s).length);
  const cities=CITIES,cityValues=cities.map(c=>protocols.filter(p=>p.city===c).length);
  const cats=CATEGORIES,catValues=cats.map(c=>protocols.filter(p=>p.category===c).length);
  const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);return {key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:d.toLocaleDateString('pt-BR',{month:'short'})};});
  const monthValues=months.map(m=>protocols.filter(p=>p.createdAt?.slice(0,7)===m.key).length);
  const common={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{font:{family:'Inter',size:10},boxWidth:10,usePointStyle:true}}}};
  const make=(key,config)=>{if(charts[key])charts[key].destroy();charts[key]=new Chart($(key),config);};
  make('statusChart',{type:'doughnut',data:{labels:statusLabels,datasets:[{data:statusValues,backgroundColor:['#E8A33C','#4388D5','#35A879','#C85D65'],borderWidth:0,hoverOffset:5}]},options:{...common,cutout:'68%'}});
  make('unitChart',{type:'bar',data:{labels:cities,datasets:[{label:'Protocolos',data:cityValues,backgroundColor:'#397FC8',borderRadius:5,maxBarThickness:34}]},options:{...common,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0,font:{size:9}},grid:{color:'#EEF2F6'}},x:{ticks:{font:{size:9}},grid:{display:false}}}}});
  make('categoryChart',{type:'bar',data:{labels:cats,datasets:[{label:'Protocolos',data:catValues,backgroundColor:'#65A5E3',borderRadius:4,maxBarThickness:24}]},options:{...common,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{precision:0,font:{size:9}},grid:{color:'#EEF2F6'}},y:{ticks:{font:{size:9}},grid:{display:false}}}}});
  make('monthlyChart',{type:'line',data:{labels:months.map(m=>m.label),datasets:[{label:'Protocolos',data:monthValues,borderColor:'#0757B8',backgroundColor:'#0757B81A',fill:true,tension:.35,pointRadius:4,pointBackgroundColor:'#0757B8'}]},options:{...common,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0,font:{size:9}},grid:{color:'#EEF2F6'}},x:{ticks:{font:{size:9}},grid:{display:false}}}}});
}
function filteredProtocols(){
  const q=$('searchProtocol').value.trim().toLowerCase(),start=$('filterStart').value,end=$('filterEnd').value;
  let rows=protocols.filter(p=>(!q||p.number.toLowerCase().includes(q)||p.clientName.toLowerCase().includes(q))&&(!$('filterCity').value||p.city===$('filterCity').value)&&(!$('filterUnit').value||p.unit===$('filterUnit').value)&&(!$('filterAgent').value||p.agent===$('filterAgent').value)&&(!$('filterStatus').value||p.status===$('filterStatus').value)&&(!$('filterCategory').value||p.category===$('filterCategory').value)&&(!start||p.createdAt.slice(0,10)>=start)&&(!end||p.createdAt.slice(0,10)<=end));
  const sort=$('sortProtocols').value;
  rows.sort((a,b)=>sort==='oldest'?new Date(a.createdAt)-new Date(b.createdAt):sort==='name'?a.clientName.localeCompare(b.clientName):sort==='status'?a.status.localeCompare(b.status):new Date(b.createdAt)-new Date(a.createdAt));
  return rows;
}
function renderProtocols(){
  const rows=filteredProtocols();$('protocolCount').textContent=`${rows.length} registro(s) encontrado(s)`;
  $('protocolTable').innerHTML=rows.map(p=>`<tr><td><button class="protocol-link" data-action="detail" data-id="${p.id}">${esc(p.number)}</button></td><td>${dateBR(p.createdAt)}</td><td class="client-cell">${esc(p.clientName)}</td><td>${esc(p.unit)}</td><td>${esc(p.category)}</td><td>${esc(p.agent)}</td><td>${statusBadge(p.status)}</td><td><div class="action-group"><button class="table-action" title="Detalhes" data-action="detail" data-id="${p.id}"><i class="fa-regular fa-eye"></i></button><button class="table-action" title="Histórico" data-action="history" data-id="${p.id}"><i class="fa-solid fa-clock-rotate-left"></i></button><button class="table-action" title="Editar" data-action="edit" data-id="${p.id}"><i class="fa-regular fa-pen-to-square"></i></button><button class="table-action" title="Excluir" data-action="delete" data-id="${p.id}"><i class="fa-regular fa-trash-can"></i></button></div></td></tr>`).join('');
  $('emptyProtocols').classList.toggle('hidden',rows.length>0);$('protocolTable').parentElement.classList.toggle('hidden',rows.length===0);
}
async function handleTableActions(e){
  const clientButton=e.target.closest('[data-client-action]');
  if(clientButton){
    const c=clients.find(x=>x.id===clientButton.dataset.id);if(!c)return;
    if(clientButton.dataset.clientAction==='history')await showClientHistory(c.id);
    if(clientButton.dataset.clientAction==='edit')openClientForm(c);
    return;
  }
  const button=e.target.closest('[data-action]');if(!button)return;
  const p=protocols.find(x=>x.id===button.dataset.id);if(!p)return;
  if(button.dataset.action==='detail')showDetails(p);
  if(button.dataset.action==='history')await showHistory(p);
  if(button.dataset.action==='edit')editProtocol(p);
  if(button.dataset.action==='delete'){
    if(confirm(`Tem certeza de que deseja excluir o protocolo ${p.number}?\nEsta ação não poderá ser desfeita.`)){
      try{await repository.remove(p.id);if(!CONFIG.API_BASE){for(const h of await repository.history(p.id))await dbDelete('history',h.id);}await syncFromServer();toast('Protocolo excluído.');}
      catch(err){toast('Não foi possível excluir o protocolo.',true);}
    }
  }
}
function editProtocol(p){
  navigate('novo');$('editingId').value=p.id;$('formTitle').textContent=`Editar ${p.number}`;
  $('protocolNumber').value=p.number;$('protocolDate').value=dateTimeBR(p.createdAt);
  $('clientName').value=p.clientName;$('clientPhone').value=p.phone||'';$('city').value=p.city;
  populateSelect('unit',[UNITS[p.city]||p.unit],'Selecione a unidade');$('unit').value=p.unit;
  $('channel').value=p.channel;$('manifestation').value=p.manifestation;$('category').value=p.category;$('agent').value=p.agent;$('status').value=p.status;$('description').value=p.description;
}
function showDetails(p){
  $('detailTitle').textContent=p.number;
  $('detailContent').innerHTML=`<div class="detail-grid">
    ${detailItem('Cliente',p.clientName)}${detailItem('Telefone / WhatsApp',p.phone||'Não informado')}${detailItem('Data de abertura',dateTimeBR(p.createdAt))}
    ${detailItem('Cidade',p.city)}${detailItem('Unidade',p.unit)}${detailItem('Canal',p.channel)}
    ${detailItem('Manifestação',p.manifestation)}${detailItem('Categoria',p.category)}${detailItem('Atendente',p.agent)}
    ${detailItem('Status',p.status)}${detailItem('Última atualização',dateTimeBR(p.updatedAt))}
    <div class="detail-item detail-description"><label>Descrição da manifestação</label><strong>${esc(p.description)}</strong></div>
    </div><div class="detail-actions"><button class="btn btn-outline" data-action="history" data-id="${p.id}"><i class="fa-solid fa-clock-rotate-left"></i> Ver histórico</button><button class="btn btn-primary" data-action="edit" data-id="${p.id}"><i class="fa-regular fa-pen-to-square"></i> Editar protocolo</button></div>`;
  $('detailModal').classList.remove('hidden');
}
function detailItem(label,value){return `<div class="detail-item"><label>${esc(label)}</label><strong>${esc(value)}</strong></div>`;}
function closeModal(id){$(id).classList.add('hidden');}
async function showHistory(p){
  $('historyTitle').textContent=`Histórico • ${p.number}`;$('historyProtocolId').value=p.id;$('historyAgent').value=p.agent;$('historyStatus').value='';$('historyDescription').value='';$('historyNotes').value='';
  await renderTimeline(p.id);$('historyModal').classList.remove('hidden');
}
async function renderTimeline(protocolId){
  const entries=await repository.history(protocolId);
  $('timeline').innerHTML=entries.length?entries.map(h=>`<div class="timeline-item"><h4>${esc(h.description)}</h4><p>${h.notes?`<b>Observação interna:</b> ${esc(h.notes)}`:''}</p><small>${dateTimeBR(h.createdAt)} • ${esc(h.agent||'Atendente não informado')} ${h.status?`• ${esc(h.status)}`:''}</small></div>`).join(''):'<div class="empty-state"><i class="fa-regular fa-clock"></i><b>Nenhuma atualização registrada</b></div>';
}
async function saveHistory(e){
  e.preventDefault();const p=protocols.find(x=>x.id===$('historyProtocolId').value);if(!p)return;
  const newStatus=$('historyStatus').value||p.status,entry={id:id(),protocolId:p.id,createdAt:nowISO(),agent:$('historyAgent').value,description:$('historyDescription').value.trim(),status:newStatus,notes:$('historyNotes').value.trim()};
  if(!entry.description||!entry.agent){toast('Informe o atendente e a descrição.',true);return;}
  try{
    await repository.addHistory(p.id,entry);
    if(newStatus!==p.status){p.status=newStatus;if(newStatus==='Resolvido')p.resolvedAt=nowISO();p.updatedAt=nowISO();p.agent=entry.agent;await repository.save(p);}
    else{p.updatedAt=nowISO();p.agent=entry.agent;await repository.save(p);}
    await syncFromServer();await renderTimeline(p.id);$('historyDescription').value='';$('historyNotes').value='';$('historyStatus').value='';toast('Atualização adicionada ao histórico.');
  }catch(err){console.error(err);toast('Erro ao salvar atualização.',true);}
}
function dateFilter(rows,startId,endId){const a=$(startId).value,b=$(endId).value;return rows.filter(p=>(!a||p.createdAt.slice(0,10)>=a)&&(!b||p.createdAt.slice(0,10)<=b));}
function generateReport(){
  let rows=dateFilter([...protocols],'reportStart','reportEnd'),type=$('reportType').value;
  const labels={geral:'Relatório geral de protocolos',unidade:'Relatório por unidade',atendente:'Relatório por atendente',categoria:'Relatório por categoria',reclamacoes:'Relatório de reclamações',pendentes:'Relatório de resolvidos e pendentes'};
  if(type==='reclamacoes')rows=rows.filter(p=>p.manifestation==='Reclamação');
  if(type==='pendentes')rows=rows.filter(p=>['Resolvido','Aberto','Em Atendimento'].includes(p.status));
  reportRows=rows;$('reportTitle').textContent=labels[type];$('reportSubtitle').textContent=`Período: ${$('reportStart').value?dateBR($('reportStart').value):'Início'} até ${$('reportEnd').value?dateBR($('reportEnd').value):'Hoje'} • ${rows.length} protocolo(s)`;
  const resolved=rows.filter(p=>p.status==='Resolvido').length,open=rows.filter(p=>p.status==='Aberto'||p.status==='Em Atendimento').length,canceled=rows.filter(p=>p.status==='Cancelado').length;
  $('reportSummary').innerHTML=[['Total',rows.length],['Resolvidos',resolved],['Pendentes',open],['Cancelados',canceled]].map(([l,v])=>`<div class="report-kpi"><span>${l}</span><strong>${v}</strong></div>`).join('');
  $('reportTableBody').innerHTML=rows.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(p=>`<tr><td>${esc(p.number)}</td><td>${dateBR(p.createdAt)}</td><td>${esc(p.clientName)}</td><td>${esc(p.unit)}</td><td>${esc(p.manifestation)}</td><td>${esc(p.category)}</td><td>${esc(p.agent)}</td><td>${esc(p.status)}</td></tr>`).join('')||'<tr><td colspan="8">Nenhum registro no período.</td></tr>';
}
function exportCSV(rows,filename){
  if(!rows.length){toast('Não há dados para exportar.',true);return;}
  const columns=[['Protocolo','number'],['Data de abertura','createdAt'],['Cliente','clientName'],['Telefone','phone'],['Cidade','city'],['Unidade','unit'],['Canal','channel'],['Manifestação','manifestation'],['Categoria','category'],['Descrição','description'],['Atendente','agent'],['Status','status']];
  const quote=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const content='\uFEFF'+[columns.map(c=>quote(c[0])).join(';'),...rows.map(p=>columns.map(c=>quote(c[1]==='createdAt'?dateTimeBR(p[c[1]]):p[c[1]])).join(';'))].join('\r\n');
  const blob=new Blob([content],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);toast('Arquivo CSV exportado.');
}
document.addEventListener('DOMContentLoaded',init);
