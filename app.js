const $=s=>document.querySelector(s);
const brl=n=>(+n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FM=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MS=FM.map(x=>x.slice(0,3));
const pad=n=>String(n).padStart(2,'0');
const NOW=new Date(),TODAY=NOW.getFullYear()+'-'+pad(NOW.getMonth()+1)+'-'+pad(NOW.getDate()),CUR=TODAY.slice(0,7),YR=CUR.slice(0,4),LIM=81000;
const fd=s=>s.split('-').reverse().join('/');
const mname=m=>FM[+m.slice(5)-1]+' '+m.slice(0,4);
const addM=(m,n)=>{let y=+m.slice(0,4),k=+m.slice(5)-1+n;y+=Math.floor(k/12);k=((k%12)+12)%12;return y+'-'+pad(k+1)};
const dueDate=m=>{const [y,mo]=addM(m,1).split('-').map(Number),d=new Date(y,mo-1,20);while(d.getDay()===0||d.getDay()===6)d.setDate(d.getDate()+1);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const daysTo=s=>Math.round((new Date(s+'T00:00:00')-new Date(TODAY+'T00:00:00'))/864e5);
function parseNum(s){s=String(s||'').trim();if(!s)return 0;if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');return parseFloat(s)||0}
const STANDALONE=!!(navigator.standalone||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches));
const KEY='meumei_v1';
// Valida e limpa dados vindos do armazenamento ou de um backup (mesmo formato do protótipo v3).
function clean(x){
 if(!x||typeof x!=='object'||!x.cfg||typeof x.cfg!=='object'||!Array.isArray(x.tx))return null;
 const c=x.cfg,ym=/^\d{4}-(0[1-9]|1[0-2])$/,ymd=/^\d{4}-\d{2}-\d{2}$/,str=(s,n)=>String(s==null?'':s).slice(0,n);
 const ATIV=['Comércio e indústria','Serviços','Comércio e serviços'];
 const cfg={nome:str(c.nome,60),neg:str(c.neg,80),cnpj:str(c.cnpj,20),ativ:ATIV.includes(c.ativ)?c.ativ:ATIV[0],das:Math.max(0,+c.das||0),start:ym.test(c.start)?c.start:CUR,abertura:ym.test(c.abertura)?c.abertura:''};
 const tx=[];x.tx.forEach((t,i)=>{if(t&&(t.type==='in'||t.type==='out')&&+t.val>0&&ymd.test(t.date))tx.push({id:+t.id>0?+t.id:Date.now()+i,type:t.type,val:+t.val,desc:str(t.desc,100),cat:str(t.cat,40),date:t.date})});
 const paid={};if(x.paid&&typeof x.paid==='object')Object.keys(x.paid).forEach(k=>{if(ym.test(k)&&x.paid[k])paid[k]=true});
 return{cfg,tx,paid,bk:ymd.test(x.bk||'')?x.bk:''};
}
let D=null;try{D=clean(JSON.parse(localStorage.getItem(KEY)))}catch(e){}
D=D||{cfg:null,tx:[],paid:{},bk:''};
let warned=0;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){if(!warned){warned=1;alert('Não foi possível salvar neste navegador. Libere o armazenamento do site para não perder dados.')}}};
const S={route:D.cfg?'inicio':'setup',month:CUR,t:null,reset:0};
const CATS={in:['Venda','Serviço','Outros'],out:['Fornecedor','Transporte','Marketing','Equipamentos','Impostos','Outros']};
const mTx=m=>D.tx.filter(t=>t.date.startsWith(m)).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
const sumT=(a,ty)=>a.filter(t=>t.type==ty).reduce((s,t)=>s+t.val,0);
const fatM=m=>sumT(mTx(m),'in');
const fatY=y=>D.tx.filter(t=>t.type=='in'&&t.date.startsWith(y)).reduce((s,t)=>s+t.val,0);
const limY=y=>{const a=D.cfg&&D.cfg.abertura;return a&&a.slice(0,4)==y?LIM/12*(13-(+a.slice(5))):LIM};
const dasList=()=>{const a=[];for(let m=D.cfg.start;m<=CUR;m=addM(m,1))a.push(m);return a};
const nextDas=()=>dasList().find(m=>!D.paid[m])||null;
function dasInfo(m){const dd=dueDate(m),n=daysTo(dd);return{dd,n,txt:n<0?`Atrasado há ${-n} dia(s)`:n==0?'Vence hoje':`Vence em ${n} dia(s)`,cls:n<0?'r':n<=7?'y':''}}
function alerts(){const a=[];if(!D.cfg)return a;const u=nextDas();
 if(u){const i=dasInfo(u);if(i.n<=10)a.push({i:i.n<0?'🔴':'🟡',t:`DAS de ${mname(u)}: ${i.txt.toLowerCase()} (${fd(i.dd)}).`,s:'Impostos',d:'impostos'})}
 const p=fatY(YR)/limY(YR)*100;
 if(p>120)a.push({i:'🔴',t:`Faturamento de ${YR} passou mais de 20% do limite: há risco de desenquadramento. Fale com seu contador.`,s:'Faturamento',d:'faturamento'});else if(p>=100)a.push({i:'🔴',t:`Faturamento de ${YR} passou do limite anual do MEI.`,s:'Faturamento',d:'faturamento'});
 else if(p>=80)a.push({i:'🟠',t:`Você já usou ${p.toFixed(0)}% do limite anual do MEI.`,s:'Faturamento',d:'faturamento'});
 if(!mTx(CUR).length)a.push({i:'🔵',t:'Você ainda não registrou lançamentos neste mês.',s:'Financeiro',d:'financeiro'});
 if(!D.cfg.das)a.push({i:'⚪',t:'Informe o valor do seu DAS para acompanhar os pagamentos.',s:'Dados do MEI',d:'perfil'});
 if(D.tx.length&&(!D.bk||daysTo(D.bk)<-30))a.push({i:'💾',t:'Faça um backup: seus dados ficam só neste aparelho.',s:'Backup',d:'backup'});
 return a}
const stat=(l,v,x,c='')=>`<div class="card"><div class="l">${l}</div><div class="v ${c}">${v}</div>${x||''}</div>`;
const item=(ic,t,s,right,fn)=>`<div class="item" onclick="${fn}"><span class="ic">${ic}</span><div class="grow"><b>${t}</b><small>${s}</small></div>${right===undefined?'<span class="l">›</span>':right}</div>`;
function chart(v,l){const mx=Math.max(...v,1);return `<div id="tip" class="tip">Toque numa barra</div><div class="chart">${v.map((x,i)=>`<div class="bar" style="height:${Math.max(x/mx*100,6)}%" onclick="tip('${l[i]}',${x})"><small>${l[i]}</small></div>`).join('')}</div>`}
function tip(l,x){$('#tip').textContent=l+': '+brl(x)}
const txItem=t=>item(t.type=='in'?'⬇️':'⬆️',esc(t.desc),fd(t.date)+' • '+esc(t.cat),`<div class="${t.type=='in'?'g':'r'}" style="font-weight:700">${t.type=='in'?'+':'-'} ${brl(t.val)}</div>`,`openTx(${t.id})`);
function form(c){c=c||{};return `<div class="card"><label>Seu nome</label><input class="in" id="f_nome" value="${esc(c.nome||'')}" placeholder="João">
<label>Nome do negócio</label><input class="in" id="f_neg" value="${esc(c.neg||'')}" placeholder="Silva Negócios">
<label>CNPJ (opcional)</label><input class="in" id="f_cnpj" value="${esc(c.cnpj||'')}" inputmode="numeric" placeholder="00.000.000/0000-00">
<label>Atividade</label><select class="in" id="f_ativ">${['Comércio e indústria','Serviços','Comércio e serviços'].map(x=>`<option ${c.ativ==x?'selected':''}>${x}</option>`).join('')}</select>
<label>Valor do seu DAS mensal (R$) — consulte no PGMEI</label><input class="in" id="f_das" value="${c.das||''}" inputmode="decimal" placeholder="0,00">
<label>Começar a controlar a partir de</label><input class="in" id="f_start" type="month" value="${c.start||CUR}">
<label>Mês de abertura do MEI (opcional — limite proporcional no 1º ano)</label><input class="in" id="f_abertura" type="month" value="${esc(c.abertura||'')}">
<p class="l" id="err" style="color:var(--r);min-height:16px"></p><button class="btn pri" style="width:100%" onclick="setup()">${D.cfg?'Salvar':'Começar'}</button></div>`}
function setup(){const g=i=>$('#'+i).value.trim();if(!g('f_nome')){$('#err').textContent='Informe seu nome.';return}
 const first=!D.cfg;D.cfg={nome:g('f_nome'),neg:g('f_neg'),cnpj:g('f_cnpj'),ativ:$('#f_ativ').value,das:parseNum($('#f_das').value),start:$('#f_start').value||CUR,abertura:$('#f_abertura').value};save();go(first?'inicio':'mais')}
const T={inicio:()=>[`Olá, ${esc(D.cfg.nome)}!`,esc(D.cfg.neg||'Seu MEI')],financeiro:()=>['Financeiro','Receitas e despesas'],impostos:()=>['Impostos','DAS e DASN-SIMEI'],faturamento:()=>['Faturamento','Acompanhe o limite anual'],mais:()=>['Mais','Seu MEI em um só lugar'],alertas:()=>['Alertas','O que merece atenção'],perfil:()=>['Dados do MEI','Edite suas informações'],backup:()=>['Backup','Exportar e restaurar dados'],setup:()=>['Bem-vindo ao MeuMEI','Configure em 1 minuto']};
const R={
setup:()=>form(),perfil:()=>form(D.cfg),
inicio:()=>{const m=mTx(CUR),f=sumT(m,'in'),d=sumT(m,'out'),pf=fatM(addM(CUR,-1)),u=nextDas(),i=u&&dasInfo(u);
 const hero=u?`<h2>Próxima ação</h2><p>DAS de ${mname(u)} — <b class="${i.cls}">${i.txt.toLowerCase()}</b> (${fd(i.dd)}).</p><button class="btn pri" onclick="go('impostos')">Ver DAS</button>`:`<h2>Tudo em dia ✅</h2><p>Nenhum DAS pendente por enquanto.</p>`;
 const vs=[],ls=[];for(let k=5;k>=0;k--){const x=addM(CUR,-k);vs.push(fatM(x));ls.push(MS[+x.slice(5)-1])}
 const al=alerts().slice(0,3);
 return `<div class="hero">${hero}</div><div class="grid">${stat('Faturamento do mês',brl(f),pf?`<div class="${f>=pf?'g':'r'} l">${f>=pf?'↑':'↓'} ${Math.abs(Math.round((f-pf)/pf*100))}% vs. mês anterior</div>`:'')}${stat('Despesas do mês',brl(d),'','r')}${stat('Resultado',brl(f-d),'',f-d>=0?'g':'r')}${stat('Valor do DAS',D.cfg.das?brl(D.cfg.das):'—',u?`<div class="l">${mname(u)}</div>`:'')}</div>
<div class="card"><h3>Faturamento • últimos 6 meses</h3>${chart(vs,ls)}</div>
<div class="card"><h3>Alertas</h3>${al.length?al.map(a=>item(a.i,a.t,a.s,'',`go('${a.d}')`)).join(''):'<p class="l">Nada pendente. 🎉</p>'}</div>
<div class="row"><button class="btn pri" onclick="openTx(0,'in')">＋ Receita</button><button class="btn" onclick="openTx(0,'out')">＋ Despesa</button></div>`},
financeiro:()=>{const m=mTx(S.month),f=sumT(m,'in'),d=sumT(m,'out'),cs={};m.filter(t=>t.type=='out').forEach(t=>cs[t.cat]=(cs[t.cat]||0)+t.val);
 return `<div class="mn"><button class="ib" onclick="S.month=addM(S.month,-1);render()">‹</button><b>${mname(S.month)}</b><button class="ib" onclick="S.month=addM(S.month,1);render()">›</button></div>
<div class="grid">${stat('Receitas',brl(f),'','g')}${stat('Despesas',brl(d),'','r')}</div>${stat('Resultado',brl(f-d),'',f-d>=0?'g':'r')}
${d?`<div class="card"><h3>Despesas por categoria</h3>${Object.entries(cs).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(c)}</span><span>${brl(v)}</span></div><div class="prog"><span style="width:${v/d*100}%"></span></div></div>`).join('')}</div>`:''}
<div class="card"><h3>Lançamentos</h3>${m.length?m.map(txItem).join(''):'<p class="l">Nenhum lançamento neste mês. Toque no ＋ para adicionar.</p>'}</div>`},
impostos:()=>{const u=nextDas(),i=u&&dasInfo(u),Y=YR;
 const hero=u?`<h2>DAS de ${mname(u)}</h2><p>Vencimento: <b style="color:#fff">${fd(i.dd)}</b> • ${D.cfg.das?brl(D.cfg.das):'valor não definido'}</p><span class="badge ${i.cls}">${i.txt}</span><div class="row" style="margin-top:14px"><button class="btn pri" onclick="togglePaid('${u}')">Marcar como pago</button><a class="btn" href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" target="_blank" rel="noopener">Emitir no portal oficial</a></div>`:`<h2>Tudo pago ✅</h2><p>Próximo vencimento: ${fd(dueDate(CUR))} (DAS de ${mname(CUR)}).</p>`;
 return `<div class="hero">${hero}</div><div class="card"><h3>Histórico do DAS</h3>${dasList().reverse().map(m=>{const p=D.paid[m],n=daysTo(dueDate(m));return item('🧾',mname(m),'Vence em '+fd(dueDate(m)),`<span class="badge ${p?'':n<0?'r':'y'}">${p?'Pago':n<0?'Atrasado':'A vencer'}</span>`,`togglePaid('${m}')`)}).join('')}<p class="l" style="margin-top:8px">Toque numa competência para marcar como paga ou desfazer. Se o dia 20 cair em fim de semana, o vencimento passa para o próximo dia útil (feriados não são considerados).</p></div>
<div class="card"><h3>DASN-SIMEI ${Y}</h3><span class="badge y">Entrega até 31/05/${+Y+1}</span><p class="l" style="margin:10px 0">Faturamento acumulado em ${Y}: <b style="color:#fff">${brl(fatY(Y))}</b>. Confira seus lançamentos antes de fazer a declaração oficial.</p><button class="btn pri" onclick="go('faturamento')">Conferir faturamento</button></div>`},
faturamento:()=>{const v=[],t=fatY(YR),L=limY(YR),p=t/L*100,k=+CUR.slice(5);for(let x=1;x<=12;x++)v.push(fatM(YR+'-'+pad(x)));
 return `<div class="grid">${stat('Faturamento em '+YR,brl(t),'','g')}${stat('Média mensal',brl(t/k))}</div><div class="card"><h3>Evolução em ${YR}</h3>${chart(v,MS)}</div>
<div class="card"><h3>Limite anual do MEI</h3><div class="v">${brl(L)}</div><div class="prog"><span style="width:${Math.min(p,100)}%"></span></div><div class="l" style="margin-top:8px">${p.toFixed(1)}% utilizado • restam ${brl(Math.max(L-t,0))}. ${D.cfg.abertura&&D.cfg.abertura.startsWith(YR)?'Limite proporcional ao ano de abertura. ':''}Confira a regra vigente nos canais oficiais.</div></div>`},
mais:()=>`<div class="card">${[['🔔','Alertas',alerts().length+' ativo(s)','alertas'],['🏢','Dados do MEI',esc(D.cfg.neg||D.cfg.nome),'perfil'],['💾','Backup e restauração','Seus dados ficam só neste aparelho','backup']].map(x=>item(x[0],x[1],x[2],undefined,`go('${x[3]}')`)).join('')}</div>
<div class="card"><h3>Aviso</h3><p class="l">O MeuMEI é uma ferramenta de organização e não substitui contador nem os serviços oficiais. Os valores do DAS e do limite devem ser conferidos nos canais oficiais.</p></div>
${STANDALONE?'':'<div class="card"><h3>Instalar no iPhone</h3><p class="l">No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.</p></div>'}
<div class="card"><h3>Apagar tudo</h3>${S.reset?`<p class="l" style="margin-bottom:10px">Isso remove todos os lançamentos e dados deste aparelho.</p><div class="row"><button class="btn dg" onclick="wipe()">Sim, apagar</button><button class="btn" onclick="S.reset=0;render()">Cancelar</button></div>`:`<button class="btn dg" onclick="S.reset=1;render()">Apagar meus dados</button>`}</div>`,
alertas:()=>{const a=alerts();return `<div class="card">${a.length?a.map(x=>item(x.i,x.t,x.s,'',`go('${x.d}')`)).join(''):'<p class="l" style="text-align:center;padding:26px 0">Tudo em dia. 🎉</p>'}</div>`},
backup:()=>`<div class="card"><h3>Exportar</h3><p class="l">${D.bk?'Último backup: '+fd(D.bk)+'.':'Você ainda não fez backup.'} Salve o arquivo em Arquivos/iCloud Drive ou envie para você mesmo.</p><div class="row" style="margin-bottom:12px"><button class="btn pri" onclick="saveBackup()">Salvar arquivo</button><button class="btn" onclick="exportCsv()">Planilha (CSV)</button></div><p class="l">Ou copie o texto abaixo (notas, e-mail):</p><textarea class="in" rows="5" readonly onfocus="this.select()">${esc(JSON.stringify(D))}</textarea></div>
<div class="card"><h3>Restaurar</h3><label class="btn" style="display:block;position:relative;overflow:hidden;margin-bottom:12px;color:var(--t);font-size:15px">Escolher arquivo de backup<input type="file" accept=".json,application/json" style="position:absolute;inset:0;opacity:0" onchange="restoreFile(this)"></label><textarea class="in" id="imp" rows="4" placeholder="Cole aqui o backup"></textarea><p class="l" id="impm" style="min-height:16px"></p><button class="btn pri" onclick="restore()">Restaurar dados</button></div>`};
function restore(){try{const x=clean(JSON.parse($('#imp').value));if(!x)throw 0;if(!confirm('Restaurar '+x.tx.length+' lançamento(s)? Os dados atuais serão substituídos.'))return;D=x;save();go('inicio')}catch(e){$('#impm').textContent='Backup inválido.'}}
function restoreFile(inp){const f=inp.files[0];if(!f)return;f.text().then(s=>{$('#imp').value=s;restore();inp.value=''}).catch(()=>{$('#impm').textContent='Não consegui ler o arquivo.'})}
async function shareFile(name,type,text){const f=new File([text],name,{type});
 if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f]});return true}catch(e){if(e.name==='AbortError')return false}}
 const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);return true}
async function saveBackup(){if(await shareFile('meumei-backup-'+TODAY+'.json','application/json',JSON.stringify(D))){D.bk=TODAY;save();render()}}
function exportCsv(){const q=s=>{s=String(s);if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 const rows=[...D.tx].sort((a,b)=>a.date.localeCompare(b.date)).map(t=>[t.date,t.type=='in'?'receita':'despesa',t.val.toFixed(2).replace('.',','),q(t.cat),q(t.desc)].join(';'));
 shareFile('meumei-'+TODAY+'.csv','text/csv','\ufeffdata;tipo;valor;categoria;descricao\r\n'+rows.join('\r\n')+'\r\n')}
function wipe(){D={cfg:null,tx:[],paid:{},bk:''};try{localStorage.removeItem(KEY)}catch(e){}S.reset=0;go('setup')}
function togglePaid(m){D.paid[m]=!D.paid[m];save();render()}
function openTx(id,ty){const t=id?D.tx.find(x=>x.id==id):{type:ty||'in',date:TODAY,val:'',desc:'',cat:''};S.t={...t,id:id||0};sheet()}
function sync(){S.t.val=$('#t_val').value;S.t.desc=$('#t_desc').value;S.t.cat=$('#t_cat').value;S.t.date=$('#t_date').value}
function setType(x){sync();S.t.type=x;S.t.cat='';sheet()}
function sheet(){const t=S.t;$('#sheet').innerHTML=`<div><div class="seg"><button class="btn ${t.type=='in'?'on':''}" onclick="setType('in')">⬇️ Receita</button><button class="btn ${t.type=='out'?'on':''}" onclick="setType('out')">⬆️ Despesa</button></div>
<label>Valor (R$)</label><input class="in" id="t_val" inputmode="decimal" value="${esc(t.val)}" placeholder="0,00">
<label>Descrição</label><input class="in" id="t_desc" value="${esc(t.desc)}" placeholder="Ex.: venda de camisetas">
<label>Categoria</label><select class="in" id="t_cat">${CATS[t.type].map(c=>`<option ${t.cat==c?'selected':''}>${c}</option>`).join('')}</select>
<label>Data</label><input class="in" id="t_date" type="date" value="${t.date}">
<p class="l" id="terr" style="color:var(--r);min-height:16px"></p>
<div class="row"><button class="btn pri" onclick="saveTx()">Salvar</button><button class="btn" onclick="closeSheet()">Cancelar</button>${t.id?'<button class="btn dg" onclick="delTx()">Excluir</button>':''}</div></div>`;$('#sheet').style.display='flex'}
function closeSheet(){$('#sheet').style.display='none'}
function saveTx(){sync();const t=S.t,v=parseNum(t.val);if(!(v>0)){$('#terr').textContent='Informe um valor maior que zero.';return}if(!t.date){$('#terr').textContent='Informe a data.';return}
 const o={id:t.id||Date.now(),type:t.type,val:v,desc:t.desc.trim()||t.cat,cat:t.cat,date:t.date};
 if(t.id)D.tx=D.tx.map(x=>x.id==t.id?o:x);else D.tx.push(o);save();closeSheet();render()}
function delTx(){if(!confirm('Excluir este lançamento?'))return;D.tx=D.tx.filter(x=>x.id!=S.t.id);save();closeSheet();render()}
$('#sheet').addEventListener('click',e=>{if(e.target.id=='sheet')closeSheet()});
const TABS=[['inicio','⌂','Início'],['financeiro','💰','Financeiro'],['impostos','🧾','Impostos'],['faturamento','📊','Faturamento'],['mais','☰','Mais']];
function go(r){S.route=r;S.reset=0;render();scrollTo(0,0)}
function render(){const r=S.route,main=TABS.some(x=>x[0]==r),setupMode=r=='setup',on=main?r:'mais';
 const t=T[r]();$('#ttl').textContent=t[0].replace(/&amp;/g,'&');$('#sub').textContent=t[1].replace(/&amp;/g,'&');
 $('#back').style.display=(main||setupMode)?'none':'block';$('#bell').style.display=setupMode?'none':'block';
 $('#fab').style.display=(r=='inicio'||r=='financeiro')?'block':'none';$('nav').style.display=setupMode?'none':'block';
 $('#view').innerHTML=R[r]();
 $('#tabs').innerHTML=TABS.map(x=>`<button class="${x[0]==on?'on':''}" onclick="go('${x[0]}')"><span>${x[1]}</span>${x[2]}</button>`).join('');
 if(!setupMode){const n=alerts().length;$('#bdg').textContent=n;$('#bdg').style.display=n?'block':'none'}}
render();
// PWA: pedir armazenamento persistente, recarregar na virada do dia e registrar o service worker.
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){const n=new Date();if(n.getDate()!==NOW.getDate()||n.getMonth()!==NOW.getMonth())location.reload()}});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
