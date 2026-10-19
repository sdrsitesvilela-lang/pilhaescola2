(() => {
  'use strict';
  const {parseVoltage, parseQuantity, calculate} = window.PilhaMath;
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = 'pilhalab-registros-v1';
  let storageUnreadable = false;
  const labels = {measurement:'MULTÍMETRO · DIGITADO',real:'SENSOR · REGISTRO ANTIGO',manual:'CÁLCULO TEÓRICO',demo:'SIMULAÇÃO · REGISTRO ANTIGO'};
  const state = {cells:[], history:loadHistory(), toastTimeout:null, graphIndex:null};
  const f2 = (n) => Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const f3 = (n) => Number(n).toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3});
  function loadHistory() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(data)) throw new Error('Formato desconhecido');
      return data; // Preserve all existing records, including legacy metadata.
    } catch (_) { storageUnreadable=true; return []; }
  }
  function records() {
    return state.history.map((item,index)=>({item,index})).filter(({item})=>
      item && Object.hasOwn(labels,item.type) && typeof item.value==='number' && Number.isFinite(item.value));
  }
  function measurements() { return records().filter(({item})=>item.type==='measurement'); }
  function persistHistory() {
    if(storageUnreadable) return false; // Never overwrite an unreadable previous history.
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(state.history)); return true;}
    catch (_) { return false; }
  }
  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(state.toastTimeout);
    state.toastTimeout = setTimeout(()=>$('toast').classList.remove('show'),2700);
  }
  function addHistory(type,value,detail) {
    state.history.unshift({type,value,detail,at:new Date().toISOString()});
    const saved=persistHistory();renderHistory();
    $('storageStatus').textContent=saved?'Salvo neste navegador. Exporte CSV para guardar uma cópia.':'Não foi possível salvar no navegador. Exporte CSV antes de fechar; os dados anteriores não foram substituídos.';
    toast(saved?'Registro salvo neste navegador.':'Registro nesta sessão: exporte CSV antes de fechar.');
  }
  function renderHistory() {
    const root = $('historyList');root.replaceChildren();
    $('historyCount').textContent=String(state.history.length);
    renderMeasurements();
    $('exportCsv').disabled=state.history.length===0;
    $('clearHistory').disabled=state.history.length===0;
    if (!state.history.length) {
      const empty=document.createElement('div');empty.className='empty-history';empty.textContent='Nenhuma medição salva.';
      const note=document.createElement('small');note.textContent='Seus registros ficam neste navegador.';empty.append(note);root.append(empty);return;
    }
    records().forEach(({item,index})=>{
      const row=document.createElement('div');row.className='history-row';
      const left=document.createElement('div');const label=document.createElement('span');label.textContent=`#${state.history.length-index} · ${labels[item.type]}`;
      const date=document.createElement('small');const dt=new Date(item.at);
      date.textContent=(Number.isFinite(dt.getTime())?dt.toLocaleString('pt-BR'):'Sem data')+' · '+(item.detail||'');
      const value=document.createElement('strong');value.textContent=f3(item.value)+' V';
      left.append(label,date);row.append(left,value);root.append(row);
    });
  }
  function renderCells() {
    const root=$('cellList');root.replaceChildren();
    if (!state.cells.length) {
      const row=document.createElement('li');row.className='empty-list';row.textContent='Nenhuma célula adicionada ainda.';root.append(row);
    }
    state.cells.forEach((cell,index)=>{
      const row=document.createElement('li');
      const label=document.createElement('div');
      const type=document.createElement('span');type.className='row-type';type.textContent=cell.type;
      const calc=document.createElement('span');calc.className='row-calc';calc.textContent=`${cell.quantity} × ${f3(cell.voltage)} V = ${f3(cell.quantity*cell.voltage)} V`;
      const remove=document.createElement('button');remove.type='button';remove.className='remove-cell';remove.textContent='×';remove.title=`Remover ${cell.type}`;remove.setAttribute('aria-label',remove.title);
      remove.addEventListener('click',()=>{state.cells.splice(index,1);renderCells();});
      label.append(type,calc);row.append(label,remove);root.append(row);
    });
    const {total,cells}=calculate(state.cells);
    $('totalVoltage').textContent=f2(total);
    $('compareManual').textContent=f2(total)+' V';
    $('formula').textContent=cells ? `${cells} célula(s) · ${state.cells.map(c=>`${c.quantity} × ${f3(c.voltage)} V`).join(' + ')}` : 'Adicione células para ver o resultado.';
    $('saveManual').disabled=cells===0;
    $('manualWarning').hidden=cells===0;
    renderComparison();
  }
  function addCell(event) {
    event.preventDefault();
    const voltage=parseVoltage($('cellVoltage').value);
    const quantity=parseQuantity($('cellQuantity').value);
    if (voltage===null || quantity===null) {
      $('formError').textContent='Informe uma tensão entre 0 e 10 V e quantidade inteira de 1 a 100.';
      return;
    }
    $('formError').textContent='';
    state.cells.push({type:$('cellType').value,voltage,quantity});
    $('cellVoltage').value='';$('cellQuantity').value='1';
    renderCells();toast('Células adicionadas ao cálculo.');
  }
  function registerMeasurement(event) {
    event.preventDefault();
    const voltage=parseVoltage($('measurementVoltage').value);
    if(voltage===null){
      $('measurementError').textContent='Digite uma tensão de 0 a 10 V, usando vírgula ou ponto.';
      $('measurementVoltage').setAttribute('aria-invalid','true');
      return;
    }
    $('measurementError').textContent='';
    $('measurementVoltage').removeAttribute('aria-invalid');
    state.graphIndex=null;
    addHistory('measurement',voltage,$('measurementType').value);
    $('measurementVoltage').value='';
  }
  function renderMeasurements() {
    const data=measurements();
    const latest=data[0]?.item;
    $('liveVoltage').textContent=latest?f3(latest.value)+' V':'—';
    $('readingHint').textContent=latest?latest.detail+' · '+new Date(latest.at).toLocaleString('pt-BR'):'Seu primeiro registro começa aqui.';
    ['compareA','compareB'].forEach((id,side)=>{
      const select=$(id), previous=select.value;
      select.replaceChildren();
      data.forEach(({item,index},i)=>{
        const option=document.createElement('option');
        // Use the immutable chronological position as the selection identity.
        option.value=String(state.history.length-index);
        option.textContent=`#${data.length-i} · ${f3(item.value)} V · ${item.detail}`;
        select.append(option);
      });
      if(!data.length){const option=document.createElement('option');option.textContent='Sem medições';option.value='';select.append(option);}
      select.disabled=data.length<2;
      if(data.some(({index})=>String(state.history.length-index)===previous))select.value=previous;
      else select.selectedIndex=side===1 && data.length>1?1:0;
    });
    if(data.length>1 && $('compareA').value===$('compareB').value){
      $('compareB').selectedIndex=$('compareA').selectedIndex===0?1:0;
    }
    renderGraph();renderComparison();
  }
  function renderComparison() {
    const data=measurements();
    const selected=id=>data.find(({index})=>String(state.history.length-index)===$(id).value)?.item;
    const a=selected('compareA'), b=selected('compareB');
    $('compareFirst').textContent=a?f3(a.value)+' V':'—';
    $('compareReal').textContent=data.length>=2&&b?f3(b.value)+' V':'—';
    $('compareDiff').textContent=data.length>=2&&a&&b?f3(Math.abs(a.value-b.value))+' V':'—';
  }
  function renderGraph() {
    const data=measurements().reverse();
    $('sampleCount').textContent=`${data.length} ponto${data.length===1?'':'s'}`;
    $('graphEmpty').hidden=Boolean(data.length);
    $('graphCursor').disabled=!data.length;
    $('graphCursor').max=String(Math.max(0,data.length-1));
    if(!data.length){
      $('graphLine').setAttribute('d','');$('graphFill').setAttribute('d','');
      $('graphPoint').setAttribute('visibility','hidden');$('graphMax').textContent='— V';
      $('graphDetail').textContent='Nenhum dado experimental registrado.';return;
    }
    const max=data.reduce((max,{item})=>Math.max(max,item.value),0.25)*1.15;
    $('graphMax').textContent=f3(max)+' V';
    const points=data.map(({item},i)=>[data.length===1?300:8+i/(data.length-1)*584,145-item.value/max*130]);
    const line=points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    $('graphLine').setAttribute('d',line);
    $('graphFill').setAttribute('d',`${line} L${points.at(-1)[0]} 145 L${points[0][0]} 145 Z`);
    const index=state.graphIndex===null?data.length-1:Math.min(state.graphIndex,data.length-1);
    $('graphCursor').value=String(index);
    const [x,y]=points[index];
    $('graphPoint').setAttribute('cx',x);$('graphPoint').setAttribute('cy',y);$('graphPoint').setAttribute('visibility','visible');
    const item=data[index].item;
    const detail=`#${index+1} · ${f3(item.value)} V · ${item.detail} · ${new Date(item.at).toLocaleString('pt-BR')}`;
    $('graphDetail').textContent=detail;$('graphCursor').setAttribute('aria-valuetext',detail);
    $('signalGraph').setAttribute('aria-label',`Gráfico de ${data.length} medições digitadas; eixo vertical em volts, horizontal por ordem de registro. Selecionada: ${detail}`);
  }
  function escapeCsv(value){const text=String(value??'');return '"'+(/^[=+@\-\t\r]/.test(text)?"'":'')+text.replaceAll('"','""')+'"';}
  function exportCsv(){
    const rows=[['Tipo','Voltagem (V)','Detalhe','Data/Hora'],...records().map(({item:h})=>[labels[h.type],h.value.toFixed(4),h.detail,h.at])];
    const csv='\ufeff'+rows.map(row=>row.map(escapeCsv).join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='dabdm-registros.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Arquivo CSV preparado.');
  }
  $('cellForm').addEventListener('submit',addCell);
  $('clearCells').addEventListener('click',()=>{state.cells=[];renderCells();});
  $('saveManual').addEventListener('click',()=>{const result=calculate(state.cells);if(result.cells)addHistory('manual',result.total,`${result.cells} célula(s) em série`);});
  $('measurementForm').addEventListener('submit',registerMeasurement);
  ['compareA','compareB'].forEach(id=>$(id).addEventListener('change',renderComparison));
  $('graphCursor').addEventListener('input',()=>{state.graphIndex=Number($('graphCursor').value);renderGraph();});
  $('signalGraph').addEventListener('pointerdown',event=>{
    const count=measurements().length;if(!count)return;
    const rect=$('signalGraph').getBoundingClientRect();
    state.graphIndex=Math.max(0,Math.min(count-1,Math.round(((event.clientX-rect.left)/rect.width*600-8)/584*(count-1))));renderGraph();
  });
  $('exportCsv').addEventListener('click',exportCsv);
  $('clearHistory').addEventListener('click',()=>{
    if(window.confirm('Apagar todos os registros deste navegador? Exporte CSV antes se quiser guardar uma cópia.')){
      const previous=state.history;state.history=[];
      if(!persistHistory()){state.history=previous;toast('Não foi possível apagar. Seus registros foram mantidos.');return;}
      state.graphIndex=null;renderHistory();toast('Histórico apagado.');
    }
  });
  renderHistory();renderCells();
  if(storageUnreadable)$('storageStatus').textContent='Histórico anterior indisponível. Não será sobrescrito; exporte novos registros antes de fechar.';
})();
