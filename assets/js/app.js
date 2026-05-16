const catalog = [
  { name: 'Gestão Start', price: 220 },
  { name: 'Gestão Business', price: 320 },
  { name: 'Gestão Professional', price: 450 },
  { name: 'PDV adicional', price: 65 },
  { name: 'Mobile', price: 35 },
  { name: 'Comanda eletrônica', price: 35 },
  { name: 'Comanda eletrônica Pagamentos Getnet/Stone', price: 50 },
  { name: 'Microterminal', price: 35 },
  { name: 'Kitchen Display System', price: 50 },
  { name: 'Integração iFood por MerchantID', price: 65 },
  { name: 'Integração Rappi por MerchantID', price: 65 },
  { name: 'Integração Open Delivery por MerchantID', price: 65 },
  { name: 'Totem de Autoatendimento', price: 150 },
  { name: 'Integração Cardápio Digital Goomer', price: 100 },
  { name: 'API de Dados por loja', price: 60 },
  { name: 'Painel de Senha', price: 35 },
  { name: 'TEF 1ª Licença', price: 130 },
  { name: 'TEF adicional', price: 50 },
  { name: 'SW Delivery Ilimitado / Swnow', price: 500 },
  { name: 'SW Engajamento Start', price: 110 },
  { name: 'SW Engajamento Business', price: 235 }
];

const els = {
  clientName: document.querySelector('#clientName'),
  quoteDate: document.querySelector('#quoteDate'),
  catalogItem: document.querySelector('#catalogItem'),
  itemQty: document.querySelector('#itemQty'),
  customDesc: document.querySelector('#customDesc'),
  customValue: document.querySelector('#customValue'),
  addItem: document.querySelector('#addItem'),
  addImplantacao: document.querySelector('#addImplantacao'),
  discountDesc: document.querySelector('#discountDesc'),
  discountValue: document.querySelector('#discountValue'),
  addDiscount: document.querySelector('#addDiscount'),
  clearQuote: document.querySelector('#clearQuote'),
  extraNotes: document.querySelector('#extraNotes'),
  quoteRows: document.querySelector('#quoteRows'),
  quoteTotal: document.querySelector('#quoteTotal'),
  pvDate: document.querySelector('#pvDate'),
  notesList: document.querySelector('#notesList'),
  implantacaoLine: document.querySelector('#implantacaoLine'),
  implantacaoTotal: document.querySelector('#implantacaoTotal'),
  btnPrint: document.querySelector('#btnPrint'),
  btnWhats: document.querySelector('#btnWhats'),
  btnRemoveLast: document.querySelector('#btnRemoveLast')
};

let quote = {
  client: '',
  date: '',
  items: [],
  notes: ''
};

const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function todayISO(){
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
}

function formatDate(iso){
  if(!iso) return '';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function populateCatalog(){
  catalog.forEach((item, index) => {
    const opt = document.createElement('option');
    opt.value = String(index);
    opt.textContent = `${item.name} — ${money(item.price)}`;
    els.catalogItem.appendChild(opt);
  });
}

function getClient(){
  return (els.clientName.value.trim() || 'A DEFINIR').toUpperCase();
}

function hasDiscount(){
  return quote.items.some(item => item.type === 'discount');
}

function updateItemLock(){
  const locked = hasDiscount();
  [els.catalogItem, els.itemQty, els.customDesc, els.customValue, els.addItem, els.addImplantacao].forEach(el => {
    el.disabled = locked;
    el.classList.toggle('locked', locked);
  });
  els.addItem.textContent = locked ? 'Itens bloqueados' : 'Adicionar item';
}

function addItem(item){
  quote.items.push(item);
  render();
}

function addCatalogItem(){
  if(hasDiscount()){
    alert('Após adicionar desconto, a inserção de novos itens fica bloqueada.');
    return;
  }

  const qty = Math.max(1, Number(els.itemQty.value || 1));
  const selected = catalog[Number(els.catalogItem.value)];
  const customDesc = els.customDesc.value.trim();
  const customValue = Number(els.customValue.value);

  let desc = customDesc || (selected ? selected.name : '');
  let price = Number.isFinite(customValue) && customValue > 0 ? customValue : (selected ? selected.price : null);

  if(!desc || price === null){
    alert('Selecione um item da tabela ou preencha descrição e valor personalizados.');
    return;
  }

  addItem({
    store: getClient(),
    description: desc,
    qty,
    unit: price,
    total: qty * price,
    type: 'item'
  });

  els.customDesc.value = '';
  els.customValue.value = '';
  els.itemQty.value = 1;
}

function addImplantacao(){
  if(hasDiscount()){
    alert('Após adicionar desconto, a inserção de novos itens fica bloqueada.');
    return;
  }

  addItem({
    store: '',
    description: 'Implantação',
    qty: 1,
    unit: 900,
    total: 900,
    type: 'implantacao'
  });
}

function addDiscount(){
  const desc = els.discountDesc.value.trim() || 'Desconto';
  const value = Number(els.discountValue.value);
  if(!Number.isFinite(value) || value <= 0){
    alert('Informe o valor do desconto.');
    return;
  }

  addItem({
    store: '',
    description: desc,
    qty: 1,
    unit: -Math.abs(value),
    total: -Math.abs(value),
    type: 'discount'
  });

  els.discountDesc.value = '';
  els.discountValue.value = '';
}

function defaultNotes(){
  const client = els.clientName.value.trim() || 'cliente informado';
  const notes = [`Valores conforme itens informados para ${client}.`];

  const groups = {};
  quote.items.filter(i => i.type === 'item').forEach(i => {
    groups[i.description] = (groups[i.description] || { qty: 0, unit: i.unit });
    groups[i.description].qty += i.qty;
  });

  Object.entries(groups).forEach(([desc, data]) => {
    if(data.qty > 1){
      notes.push(`${desc} calculado a ${money(data.unit)} cada, totalizando ${money(data.qty * data.unit)} para ${data.qty} unidades.`);
    }
  });

  const implantationDiscount = quote.items
    .filter(i => i.type === 'discount' && i.description.toLowerCase().includes('implant'))
    .reduce((sum, i) => sum + Math.abs(i.total), 0);

  if(quote.items.some(i => i.type === 'implantacao') && implantationDiscount > 0){
    notes.push(`Implantação com desconto de ${money(implantationDiscount)}.`);
  }

  quote.items.filter(i => i.type === 'discount' && !i.description.toLowerCase().includes('implant')).forEach(i => {
    notes.push(`${i.description} aplicado no valor de ${money(Math.abs(i.total))}.`);
  });

  return notes;
}

function render(){
  quote.client = els.clientName.value.trim();
  quote.date = els.quoteDate.value;
  quote.notes = els.extraNotes.value.trim();

  els.pvDate.textContent = formatDate(quote.date);
  els.quoteRows.innerHTML = '';

  if(quote.items.length === 0){
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = '<td colspan="5">Adicione itens ao orçamento.</td>';
    els.quoteRows.appendChild(tr);
  }

  quote.items.forEach(item => {
    const tr = document.createElement('tr');
    if(item.type === 'discount') tr.className = 'discount';
    if(item.type === 'implantacao') tr.className = 'implantacao';
    tr.innerHTML = `
      <td>${item.store || ''}</td>
      <td>${item.description}</td>
      <td>${item.qty}</td>
      <td>${money(item.unit)}</td>
      <td>${money(item.total)}</td>
    `;
    els.quoteRows.appendChild(tr);
  });

  const total = quote.items.reduce((sum, i) => sum + i.total, 0);
  els.quoteTotal.textContent = money(total);

  const implantationTotal = quote.items
    .filter(i => i.type === 'implantacao' || (i.type === 'discount' && i.description.toLowerCase().includes('implant')))
    .reduce((sum, i) => sum + i.total, 0);

  const hasImplantationLine = quote.items.some(i => i.type === 'implantacao' || i.description.toLowerCase().includes('implant'));
  els.implantacaoLine.classList.toggle('hidden', !hasImplantationLine);
  els.implantacaoTotal.textContent = money(implantationTotal);

  const notes = defaultNotes();
  if(quote.notes){
    quote.notes.split('\n').filter(Boolean).forEach(n => notes.push(n));
  }
  els.notesList.innerHTML = notes.map(n => `<li>- ${n}</li>`).join('');
  updateItemLock();
}

function whatsappText(){
  const total = quote.items.reduce((sum, i) => sum + i.total, 0);
  const lines = [
    '*ORÇAMENTO COMERCIAL*',
    '',
    `*Data:* ${formatDate(quote.date)}`,
    quote.client ? `*Cliente:* ${quote.client}` : '',
    '',
    '*ITENS DO ORÇAMENTO*'
  ].filter(Boolean);

  quote.items.forEach(i => {
    lines.push('');
    if(i.store) lines.push(`Loja: *${i.store}*`);
    lines.push(`Descrição: *${i.description}*`);
    lines.push(`Qtde: ${i.qty}`);
    lines.push(`Valor unit.: ${money(i.unit)}`);
    lines.push(`Valor total: ${money(i.total)}`);
  });

  const implantationTotal = quote.items
    .filter(i => i.type === 'implantacao' || (i.type === 'discount' && i.description.toLowerCase().includes('implant')))
    .reduce((sum, i) => sum + i.total, 0);

  if(quote.items.some(i => i.type === 'implantacao' || i.description.toLowerCase().includes('implant'))){
    lines.push('');
    lines.push(`*Total implantação:* ${money(implantationTotal)}`);
  }

  lines.push('');
  lines.push(`*TOTAL: ${money(total)}*`);
  lines.push('');
  lines.push('*Observações:*');
  defaultNotes().forEach(n => lines.push(`- ${n}`));
  if(quote.notes) quote.notes.split('\n').filter(Boolean).forEach(n => lines.push(`- ${n}`));
  lines.push('');
  lines.push('*013 Automação Comercial*');
  lines.push('Alex: (13) 98822-9261 | Rafael: (13) 98821-5842');
  lines.push('Alex: suporte@013automacao.com.br | Rafael: comercial@013automacao.com.br');
  lines.push('www.013automacao.com.br');

  return lines.join('\n');
}

function shareWhatsapp(){
  window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText())}`, '_blank');
}

function clearQuote(){
  if(!confirm('Limpar este orçamento?')) return;
  quote.items = [];
  els.clientName.value = '';
  els.extraNotes.value = '';
  els.quoteDate.value = todayISO();
  render();
}

function bind(){
  ['input','change'].forEach(evt => {
    els.clientName.addEventListener(evt, () => {
      quote.items = quote.items.map(i => i.store ? { ...i, store: getClient() } : i);
      render();
    });
    els.quoteDate.addEventListener(evt, render);
    els.extraNotes.addEventListener(evt, render);
  });

  els.addItem.addEventListener('click', addCatalogItem);
  els.addImplantacao.addEventListener('click', addImplantacao);
  els.addDiscount.addEventListener('click', addDiscount);
  els.clearQuote.addEventListener('click', clearQuote);
  els.btnWhats.addEventListener('click', shareWhatsapp);
  els.btnPrint.addEventListener('click', () => {
    render();
    window.scrollTo(0, 0);
    setTimeout(() => window.print(), 120);
  });
  els.btnRemoveLast.addEventListener('click', () => {
    quote.items.pop();
    render();
  });
}

function init(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations()
      .then(registrations => registrations.forEach(registration => registration.unregister()))
      .catch(() => {});
  }
  if(window.caches){
    caches.keys().then(keys => keys.forEach(key => caches.delete(key))).catch(() => {});
  }

  populateCatalog();
  quote.items = [];
  els.clientName.value = '';
  els.extraNotes.value = '';
  els.quoteDate.value = todayISO();
  bind();
  render();
}

init();
