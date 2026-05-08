// ===== ESTADO GLOBAL =====
const State = {
  orcamento: null,
  editandoId: null,
  screenHistory: [],
  tabMao: 'horas',
  menuAberto: false
};

// ===== UTILITÁRIOS =====
function moeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtData(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}

function gerarId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function showToast(msg, dur = 2500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

// ===== VALIDAÇÃO VISUAL =====
function mostrarErro(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.add('input-error');
  const grupo = el.closest('.form-group');
  if (grupo) {
    grupo.classList.add('has-error');
    if (!grupo.querySelector('.field-error-msg')) {
      const p = document.createElement('p');
      p.className = 'field-error-msg';
      p.textContent = msg;
      grupo.appendChild(p);
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    // Campo fora de .form-group (ex: res-lucro dentro de .resumo-linha)
    showToast('⚠️ ' + msg);
  }
}

function limparErro(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.remove('input-error');
  const grupo = el.closest('.form-group');
  if (!grupo) return;
  grupo.classList.remove('has-error');
  grupo.querySelector('.field-error-msg')?.remove();
}

function limparErros(...ids) {
  ids.forEach(limparErro);
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ===== NAVEGAÇÃO =====
function navigate(screenId) {
  const current = document.querySelector('.screen.active');
  if (current && current.id !== `screen-${screenId}`) {
    State.screenHistory.push(current.id.replace('screen-', ''));
    current.classList.remove('active');
  }
  const next = document.getElementById(`screen-${screenId}`);
  if (next) next.classList.add('active');

  if (screenId === 'dashboard') atualizarDashboard();
  if (screenId === 'clientes') renderizarClientes();
  if (screenId === 'lista-orcamentos') renderizarTodosOrcamentos();
  if (screenId === 'orc-1') prepararPasso1();
  if (screenId === 'orc-2') prepararPasso2();
  if (screenId === 'orc-3') prepararPasso3();
  if (screenId === 'orc-4') prepararPasso4();
  if (screenId === 'configuracoes') carregarConfiguracoes();

  fecharMenuOrcamento();
}

function goBack() {
  if (State.screenHistory.length > 0) {
    const prev = State.screenHistory.pop();
    const current = document.querySelector('.screen.active');
    if (current) current.classList.remove('active');
    const back = document.getElementById(`screen-${prev}`);
    if (back) back.classList.add('active');

    if (prev === 'dashboard') atualizarDashboard();
    if (prev === 'clientes') renderizarClientes();
    if (prev === 'lista-orcamentos') renderizarTodosOrcamentos();
  } else {
    navigate('dashboard');
  }
}

// ===== SPLASH =====
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => {
        // Notifica o usuário quando uma nova versão do app estiver disponível
        reg.addEventListener('updatefound', () => {
          const novo = reg.installing;
          novo.addEventListener('statechange', () => {
            if (novo.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('🔄 Nova versão disponível! Feche e reabra o app.', 5000);
            }
          });
        });
      })
      .catch(() => {});
  }
  setTimeout(() => {
    navigate('dashboard');
    State.screenHistory = [];
  }, 2000);
});

// ===== DASHBOARD =====
function atualizarDashboard() {
  const todos = Storage.getOrcamentos();
  const orcamentos = todos.filter(o => o.status !== 'arquivado');
  const total = orcamentos.reduce((s, o) => s + (o.total || 0), 0);
  const aprovados = orcamentos.filter(o => o.status === 'aprovado').reduce((s, o) => s + (o.total || 0), 0);
  const pendentes = orcamentos.filter(o => o.status === 'pendente').length;
  const recusados = orcamentos.filter(o => o.status === 'recusado').length;

  document.getElementById('dash-total').textContent = moeda(total);
  document.getElementById('dash-aprovados').textContent = moeda(aprovados);
  document.getElementById('dash-pendentes').textContent = pendentes;
  document.getElementById('dash-recusados').textContent = recusados;

  const container = document.getElementById('lista-recentes');
  const recentes = orcamentos.slice(0, 5);
  if (recentes.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Nenhum orçamento ainda.</p><p>Clique em <strong>+ Novo</strong> para começar!</p></div>`;
  } else {
    container.innerHTML = recentes.map(o => cardOrcamento(o)).join('');
  }
}

function cardOrcamento(o) {
  const badges = {
    pendente: '<span class="badge badge-pendente">Pendente</span>',
    aprovado: '<span class="badge badge-aprovado">Aprovado</span>',
    recusado: '<span class="badge badge-recusado">Recusado</span>',
    rascunho: '<span class="badge badge-rascunho">Rascunho</span>',
    arquivado: '<span class="badge badge-arquivado">Arquivado</span>'
  };
  return `
    <div class="list-item">
      <div class="list-item-info" onclick="abrirOrcamento('${o.id}')">
        <div class="list-item-title">${o.numero} — ${o.cliente.nome || 'Cliente'}</div>
        <div class="list-item-sub">${o.cliente.empresa || ''} · ${fmtData(o.dataCriacao)}</div>
        <div style="margin-top:6px">${badges[o.status] || ''}</div>
      </div>
      <div class="list-item-right">
        <div class="list-item-value" onclick="abrirOrcamento('${o.id}')">${moeda(o.total)}</div>
        <div class="card-actions">
          <button class="card-action-btn archive" title="Arquivar" onclick="arquivarOrcamento('${o.id}')">
            ${o.status === 'arquivado' ? '📂' : '📁'}
          </button>
          <button class="card-action-btn delete" title="Excluir" onclick="excluirOrcamentoDash('${o.id}', '${o.numero}')">
            🗑️
          </button>
        </div>
      </div>
    </div>`;
}

function arquivarOrcamento(id) {
  const o = Storage.getOrcamento(id);
  if (!o) return;
  if (o.status === 'arquivado') {
    o.status = 'pendente';
    Storage.salvarOrcamento(o);
    showToast('📂 Orçamento restaurado');
  } else {
    o.status = 'arquivado';
    Storage.salvarOrcamento(o);
    showToast('📁 Orçamento arquivado');
  }
  atualizarDashboard();
}

function excluirOrcamentoDash(id, numero) {
  abrirModalExcluir(
    `Tem certeza que deseja excluir o orçamento <strong>${numero}</strong>? Esta ação não pode ser desfeita.`,
    () => {
      Storage.excluirOrcamento(id);
      showToast('🗑️ Orçamento excluído');
      atualizarDashboard();
    }
  );
}

// ===== LISTA ORÇAMENTOS =====
function renderizarTodosOrcamentos() {
  const filtro = document.getElementById('filtro-status').value;
  let lista = Storage.getOrcamentos();
  if (filtro) {
    lista = lista.filter(o => o.status === filtro);
  } else {
    lista = lista.filter(o => o.status !== 'arquivado');
  }
  const container = document.getElementById('lista-todos');
  if (lista.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Nenhum orçamento encontrado.</p></div>`;
  } else {
    container.innerHTML = lista.map(o => cardOrcamento(o)).join('');
  }
}

function filtrarOrcamentos() {
  renderizarTodosOrcamentos();
}

function abrirArquivados() {
  navigate('lista-orcamentos');
  document.getElementById('filtro-status').value = 'arquivado';
  renderizarTodosOrcamentos();
}

// ===== CLIENTES =====
function renderizarClientes(filtro = '') {
  let lista = Storage.getClientes();
  if (filtro) lista = lista.filter(c =>
    (c.nome + c.empresa).toLowerCase().includes(filtro.toLowerCase())
  );
  const container = document.getElementById('lista-clientes');
  if (lista.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Nenhum cliente cadastrado.</p></div>`;
    return;
  }
  container.innerHTML = lista.map(c => `
    <div class="list-item">
      <div class="list-item-info" onclick="editarCliente('${c.id}')">
        <div class="list-item-title">${c.nome}</div>
        <div class="list-item-sub">${[c.empresa, c.telefone].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="list-item-actions">
        <button class="icon-btn" onclick="editarCliente('${c.id}')">✏️</button>
        <button class="icon-btn" style="color:var(--red)" onclick="confirmarExcluirCliente('${c.id}')">🗑️</button>
      </div>
    </div>`).join('');
}

function filtrarClientes() {
  renderizarClientes(document.getElementById('busca-cliente').value);
}

function editarCliente(id) {
  const c = Storage.getCliente(id);
  if (!c) return;
  document.getElementById('titulo-cliente-form').textContent = 'Editar Cliente';
  document.getElementById('cliente-id').value = c.id;
  document.getElementById('cliente-nome').value = c.nome || '';
  document.getElementById('cliente-empresa').value = c.empresa || '';
  document.getElementById('cliente-telefone').value = c.telefone || '';
  document.getElementById('cliente-email').value = c.email || '';
  document.getElementById('cliente-endereco').value = c.endereco || '';
  navigate('novo-cliente');
}

function salvarCliente() {
  const nome = document.getElementById('cliente-nome').value.trim();
  if (!nome) { showToast('⚠️ Informe o nome do cliente'); return; }
  const id = document.getElementById('cliente-id').value || gerarId();
  Storage.salvarCliente({
    id, nome,
    empresa: document.getElementById('cliente-empresa').value.trim(),
    telefone: document.getElementById('cliente-telefone').value.trim(),
    email: document.getElementById('cliente-email').value.trim(),
    endereco: document.getElementById('cliente-endereco').value.trim()
  });
  showToast('✅ Cliente salvo!');
  limparFormCliente();
  goBack();
}

function limparFormCliente() {
  document.getElementById('titulo-cliente-form').textContent = 'Novo Cliente';
  document.getElementById('cliente-id').value = '';
  ['cliente-nome','cliente-empresa','cliente-telefone','cliente-email','cliente-endereco']
    .forEach(id => document.getElementById(id).value = '');
}

function confirmarExcluirCliente(id) {
  const c = Storage.getCliente(id);
  if (confirm(`Excluir cliente "${c.nome}"?`)) {
    Storage.excluirCliente(id);
    renderizarClientes();
    showToast('🗑️ Cliente excluído');
  }
}

// ===== NOVO ORÇAMENTO =====
function iniciarNovoOrcamento() {
  State.orcamento = {
    id: gerarId(),
    numero: `ORC-${String(Storage.proximoNumero()).padStart(3, '0')}`,
    status: 'pendente',
    dataCriacao: new Date().toISOString(),
    tipo: 'completo',
    cliente: {},
    materiais: [],
    maoDeObra: [],
    despesas: 0,
    margem: 20,
    subtotalMateriais: 0,
    subtotalMao: 0,
    total: 0,
    validade: 15,
    descricao: '',
    obsCliente: '',
    notasInternas: '',
    pagamento: ''
  };
  State.editandoId = null;
  State.screenHistory = [];
  State.tabMao = 'horas';
  editandoMaterialId = null;
  editandoMaoId = null;
  navigate('orc-1');
}

// ---- PASSO 1 ----
function prepararPasso1() {
  const cfg = Storage.getConfig();
  const clientes = Storage.getClientes();

  const sel = document.getElementById('orc-cliente-select');
  sel.innerHTML = '<option value="">-- Selecione ou preencha abaixo --</option>';
  clientes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.nome + (c.empresa ? ` (${c.empresa})` : '');
    sel.appendChild(opt);
  });

  if (State.orcamento) {
    document.getElementById('orc-cliente-nome').value = State.orcamento.cliente.nome || '';
    document.getElementById('orc-cliente-empresa').value = State.orcamento.cliente.empresa || '';
    document.getElementById('orc-cliente-telefone').value = State.orcamento.cliente.telefone || '';
    document.getElementById('orc-cliente-email').value = State.orcamento.cliente.email || '';
    document.getElementById('orc-validade').value = State.orcamento.validade || cfg.validade || 15;
    document.getElementById('orc-descricao').value = State.orcamento.descricao || '';
    const tipo = State.orcamento.tipo || 'completo';
    document.querySelector(`input[name="tipo-servico"][value="${tipo}"]`).checked = true;
  }

  // Usar .oninput (propriedade) evita acúmulo de listeners a cada visita ao passo
  document.getElementById('orc-cliente-nome').oninput = () => limparErro('orc-cliente-nome');
  document.getElementById('orc-cliente-email').oninput = () => limparErro('orc-cliente-email');
}

function preencherClienteSelecionado() {
  const id = document.getElementById('orc-cliente-select').value;
  if (!id) return;
  const c = Storage.getCliente(id);
  if (!c) return;
  document.getElementById('orc-cliente-nome').value = c.nome || '';
  document.getElementById('orc-cliente-empresa').value = c.empresa || '';
  document.getElementById('orc-cliente-telefone').value = c.telefone || '';
  document.getElementById('orc-cliente-email').value = c.email || '';
}

function atualizarTipoServico() {}

function irParaPasso2() {
  limparErros('orc-cliente-nome', 'orc-cliente-email');

  const nome = document.getElementById('orc-cliente-nome').value.trim();
  const email = document.getElementById('orc-cliente-email').value.trim();
  let valido = true;

  if (!nome) {
    mostrarErro('orc-cliente-nome', 'Nome do cliente é obrigatório');
    valido = false;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    mostrarErro('orc-cliente-email', 'E-mail inválido');
    valido = false;
  }

  if (!valido) return;

  State.orcamento.cliente = {
    nome,
    empresa: document.getElementById('orc-cliente-empresa').value.trim(),
    telefone: document.getElementById('orc-cliente-telefone').value.trim(),
    email
  };
  State.orcamento.tipo = document.querySelector('input[name="tipo-servico"]:checked').value;
  State.orcamento.validade = parseInt(document.getElementById('orc-validade').value) || 15;
  State.orcamento.descricao = document.getElementById('orc-descricao').value.trim();
  navigate('orc-2');
}

// ---- PASSO 2 — MATERIAIS ----
function prepararPasso2() {
  editandoMaterialId = null;
  document.getElementById('btn-add-material').textContent = '+ Adicionar';
  const isMao = State.orcamento.tipo === 'mao-de-obra';
  document.getElementById('orc-2-sem-material').style.display = isMao ? 'block' : 'none';
  document.getElementById('orc-2-com-material').style.display = isMao ? 'none' : 'block';
  renderizarMateriais();
}

let editandoMaterialId = null;

function adicionarMaterial() {
  limparErros('mat-item', 'mat-qtd', 'mat-valor');
  const item = document.getElementById('mat-item').value.trim();
  const qtd = parseFloat(document.getElementById('mat-qtd').value);
  const valor = parseFloat(document.getElementById('mat-valor').value);
  let valido = true;

  if (!item) { mostrarErro('mat-item', 'Informe o nome do item'); valido = false; }
  if (isNaN(qtd) || qtd <= 0) { mostrarErro('mat-qtd', 'Quantidade inválida'); valido = false; }
  if (isNaN(valor) || valor < 0) { mostrarErro('mat-valor', 'Valor inválido'); valido = false; }
  if (!valido) return;

  if (editandoMaterialId) {
    const idx = State.orcamento.materiais.findIndex(m => m.id === editandoMaterialId);
    if (idx >= 0) State.orcamento.materiais[idx] = { id: editandoMaterialId, item, qtd, valor, total: qtd * valor };
    editandoMaterialId = null;
    document.getElementById('btn-add-material').textContent = '+ Adicionar';
  } else {
    State.orcamento.materiais.push({ id: gerarId(), item, qtd, valor, total: qtd * valor });
  }

  document.getElementById('mat-item').value = '';
  document.getElementById('mat-qtd').value = '';
  document.getElementById('mat-valor').value = '';
  document.getElementById('mat-item').focus();
  renderizarMateriais();
}

function editarMaterial(id) {
  const m = State.orcamento.materiais.find(m => m.id === id);
  if (!m) return;
  editandoMaterialId = id;
  document.getElementById('mat-item').value = m.item;
  document.getElementById('mat-qtd').value = m.qtd;
  document.getElementById('mat-valor').value = m.valor;
  document.getElementById('btn-add-material').textContent = '✔ Atualizar';
  document.getElementById('mat-item').focus();
  document.getElementById('mat-item').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderizarMateriais() {
  const lista = State.orcamento.materiais;
  const container = document.getElementById('lista-materiais');
  if (lista.length === 0) {
    container.innerHTML = '<p style="color:var(--gray-400);font-size:14px;padding:8px 0">Nenhum material adicionado.</p>';
  } else {
    container.innerHTML = lista.map(m => `
      <div class="item-row ${editandoMaterialId === m.id ? 'item-editing' : ''}">
        <div class="item-row-info">
          <div class="item-row-name">${m.item}</div>
          <div class="item-row-detail">${m.qtd} × ${moeda(m.valor)}</div>
        </div>
        <span class="item-row-value">${moeda(m.total)}</span>
        <button class="item-row-edit" onclick="editarMaterial('${m.id}')">✏️</button>
        <button class="item-row-del" onclick="removerMaterial('${m.id}')">🗑️</button>
      </div>`).join('');
  }
  const sub = lista.reduce((s, m) => s + m.total, 0);
  State.orcamento.subtotalMateriais = sub;
  document.getElementById('subtotal-materiais').textContent = moeda(sub);
}

function removerMaterial(id) {
  if (editandoMaterialId === id) {
    editandoMaterialId = null;
    document.getElementById('btn-add-material').textContent = '+ Adicionar';
    document.getElementById('mat-item').value = '';
    document.getElementById('mat-qtd').value = '';
    document.getElementById('mat-valor').value = '';
  }
  State.orcamento.materiais = State.orcamento.materiais.filter(m => m.id !== id);
  renderizarMateriais();
}

function irParaPasso3() {
  navigate('orc-3');
}

// ---- PASSO 3 — MÃO DE OBRA ----
function prepararPasso3() {
  editandoMaoId = null;
  document.getElementById('btn-add-mao').textContent = '+ Adicionar';
  setTabMao(State.tabMao);
  renderizarMaoDeObra();
}

function setTabMao(tab) {
  State.tabMao = tab;
  document.getElementById('tab-horas').classList.toggle('active', tab === 'horas');
  document.getElementById('tab-fixo').classList.toggle('active', tab === 'fixo');
  document.getElementById('mao-form-horas').style.display = tab === 'horas' ? 'block' : 'none';
  document.getElementById('mao-form-fixo').style.display = tab === 'fixo' ? 'block' : 'none';
}

let editandoMaoId = null;

function atualizarUnidadeMao() {
  const unidade = document.getElementById('mao-unidade').value;
  const labels = { horas: 'R$ por hora', dias: 'R$ por dia', litros: 'R$ por litro' };
  const steps = { horas: '0.5', dias: '1', litros: '0.1' };
  document.getElementById('label-mao-valor').textContent = labels[unidade] || 'R$ por unidade';
  document.getElementById('mao-horas').step = steps[unidade] || '1';
}

function adicionarMaoDeObra() {
  if (State.tabMao === 'horas') {
    limparErros('mao-desc-h', 'mao-horas', 'mao-valor-h');
    const desc = document.getElementById('mao-desc-h').value.trim();
    const qtd = parseFloat(document.getElementById('mao-horas').value);
    const valorU = parseFloat(document.getElementById('mao-valor-h').value);
    const unidade = document.getElementById('mao-unidade').value;
    let valido = true;
    if (!desc) { mostrarErro('mao-desc-h', 'Informe a descrição'); valido = false; }
    if (isNaN(qtd) || qtd <= 0) { mostrarErro('mao-horas', `Informe a quantidade de ${unidade}`); valido = false; }
    if (isNaN(valorU) || valorU < 0) { mostrarErro('mao-valor-h', 'Informe o valor'); valido = false; }
    if (!valido) return;
    if (editandoMaoId) {
      const idx = State.orcamento.maoDeObra.findIndex(m => m.id === editandoMaoId);
      if (idx >= 0) State.orcamento.maoDeObra[idx] = { id: editandoMaoId, tipo: 'horas', unidade, desc, horas: qtd, valorH: valorU, total: qtd * valorU };
      editandoMaoId = null;
      document.getElementById('btn-add-mao').textContent = '+ Adicionar';
    } else {
      State.orcamento.maoDeObra.push({ id: gerarId(), tipo: 'horas', unidade, desc, horas: qtd, valorH: valorU, total: qtd * valorU });
    }
    document.getElementById('mao-desc-h').value = '';
    document.getElementById('mao-horas').value = '';
    document.getElementById('mao-valor-h').value = '';
  } else {
    limparErros('mao-desc-f', 'mao-valor-f');
    const desc = document.getElementById('mao-desc-f').value.trim();
    const valor = parseFloat(document.getElementById('mao-valor-f').value);
    let valido = true;
    if (!desc) { mostrarErro('mao-desc-f', 'Informe a descrição'); valido = false; }
    if (isNaN(valor) || valor < 0) { mostrarErro('mao-valor-f', 'Informe o valor'); valido = false; }
    if (!valido) return;
    if (editandoMaoId) {
      const idx = State.orcamento.maoDeObra.findIndex(m => m.id === editandoMaoId);
      if (idx >= 0) State.orcamento.maoDeObra[idx] = { id: editandoMaoId, tipo: 'fixo', desc, total: valor };
      editandoMaoId = null;
      document.getElementById('btn-add-mao').textContent = '+ Adicionar';
    } else {
      State.orcamento.maoDeObra.push({ id: gerarId(), tipo: 'fixo', desc, total: valor });
    }
    document.getElementById('mao-desc-f').value = '';
    document.getElementById('mao-valor-f').value = '';
  }
  renderizarMaoDeObra();
}

const CUSTO_CONFIG = {
  trabalhadores: { icon: '👷', label: 'Trabalhadores', qtdId: 'c-trab-qtd', valorId: 'c-trab-valor', unidadeId: 'c-trab-unidade' },
  combustivel:   { icon: '⛽', label: 'Combustível',   qtdId: 'c-comb-qtd', valorId: 'c-comb-valor', unidadeId: 'c-comb-unidade' },
  hotel:         { icon: '🏨', label: 'Diária de Hotel', qtdId: 'c-hotel-qtd', valorId: 'c-hotel-valor', unidadeId: 'c-hotel-unidade' },
  refeicao:      { icon: '🍽️', label: 'Refeições',      qtdId: 'c-ref-qtd',  valorId: 'c-ref-valor',  unidadeId: 'c-ref-unidade' }
};

function adicionarCusto(categoria) {
  const cfg = CUSTO_CONFIG[categoria];
  const qtd = parseFloat(document.getElementById(cfg.qtdId).value);
  const valor = parseFloat(document.getElementById(cfg.valorId).value);
  const unidade = document.getElementById(cfg.unidadeId).value;
  if (isNaN(qtd) || qtd <= 0) { showToast('⚠️ Informe a quantidade'); return; }
  if (isNaN(valor) || valor < 0) { showToast('⚠️ Informe o valor'); return; }

  let total, detalhe;

  if (categoria === 'trabalhadores') {
    const hpd = parseFloat(document.getElementById('c-trab-hpd').value);
    if (isNaN(hpd) || hpd <= 0) { showToast('⚠️ Informe as horas por dia'); return; }
    total = qtd * hpd * valor;
    detalhe = `${qtd} trab. × ${hpd}h/dia × ${moeda(valor)}/h`;
    document.getElementById('c-trab-hpd').value = '';
  } else {
    total = qtd * valor;
    detalhe = null;
  }

  State.orcamento.maoDeObra.push({
    id: gerarId(),
    tipo: 'custo',
    categoria,
    icon: cfg.icon,
    desc: cfg.label,
    horas: qtd,
    valorH: valor,
    unidade,
    detalhe,
    total
  });
  document.getElementById(cfg.qtdId).value = '';
  document.getElementById(cfg.valorId).value = '';
  renderizarMaoDeObra();
  atualizarPreviewTrab();
}

function atualizarPreviewTrab() {
  const qtd = parseFloat(document.getElementById('c-trab-qtd').value) || 0;
  const hpd = parseFloat(document.getElementById('c-trab-hpd').value) || 0;
  const valor = parseFloat(document.getElementById('c-trab-valor').value) || 0;
  const preview = document.getElementById('preview-trab');
  if (qtd > 0 && hpd > 0 && valor > 0) {
    const total = qtd * hpd * valor;
    preview.innerHTML = `<span class="formula-calc">${qtd} trab. × ${hpd}h/dia × ${moeda(valor)}/h = <strong>${moeda(total)}</strong></span>`;
  } else {
    preview.innerHTML = `<span>Fórmula: trabalhadores × horas/dia × R$/hora</span>`;
  }
}

function editarMaoDeObra(id) {
  const m = State.orcamento.maoDeObra.find(m => m.id === id);
  if (!m) return;
  editandoMaoId = id;
  document.getElementById('btn-add-mao').textContent = '✔ Atualizar';
  if (m.tipo === 'horas') {
    setTabMao('horas');
    document.getElementById('mao-desc-h').value = m.desc;
    document.getElementById('mao-horas').value = m.horas;
    document.getElementById('mao-valor-h').value = m.valorH;
    document.getElementById('mao-unidade').value = m.unidade || 'horas';
    atualizarUnidadeMao();
    document.getElementById('mao-desc-h').focus();
  } else {
    setTabMao('fixo');
    document.getElementById('mao-desc-f').value = m.desc;
    document.getElementById('mao-valor-f').value = m.total;
    document.getElementById('mao-desc-f').focus();
  }
  document.querySelector('.card-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderizarMaoDeObra() {
  const lista = State.orcamento.maoDeObra;
  const container = document.getElementById('lista-mao-obra');
  if (lista.length === 0) {
    container.innerHTML = '<p style="color:var(--gray-400);font-size:14px;padding:8px 0">Nenhum item adicionado.</p>';
  } else {
    container.innerHTML = lista.map(m => `
      <div class="item-row ${editandoMaoId === m.id ? 'item-editing' : ''}">
        <div class="item-row-info">
          <div class="item-row-name">${m.icon ? m.icon + ' ' : ''}${m.desc}</div>
          <div class="item-row-detail">${
            m.tipo === 'horas' ? `${m.horas} ${m.unidade === 'dias' ? 'dia(s)' : m.unidade === 'litros' ? 'L' : 'h'} × ${moeda(m.valorH)}`
            : m.tipo === 'custo' ? (m.detalhe || `${m.horas} ${m.unidade} × ${moeda(m.valorH)}`)
            : 'Valor fixo'
          }</div>
        </div>
        <span class="item-row-value">${moeda(m.total)}</span>
        <button class="item-row-edit" onclick="editarMaoDeObra('${m.id}')">✏️</button>
        <button class="item-row-del" onclick="removerMaoDeObra('${m.id}')">🗑️</button>
      </div>`).join('');
  }
  const sub = lista.reduce((s, m) => s + m.total, 0);
  State.orcamento.subtotalMao = sub;
  document.getElementById('subtotal-mao').textContent = moeda(sub);
}

function removerMaoDeObra(id) {
  if (editandoMaoId === id) {
    editandoMaoId = null;
    document.getElementById('btn-add-mao').textContent = '+ Adicionar';
    document.getElementById('mao-desc-h').value = '';
    document.getElementById('mao-horas').value = '';
    document.getElementById('mao-valor-h').value = '';
    document.getElementById('mao-desc-f').value = '';
    document.getElementById('mao-valor-f').value = '';
  }
  State.orcamento.maoDeObra = State.orcamento.maoDeObra.filter(m => m.id !== id);
  renderizarMaoDeObra();
}

function irParaPasso4() {
  navigate('orc-4');
}

// ---- PASSO 4 — RESUMO ----
function prepararPasso4() {
  const cfg = Storage.getConfig();
  document.getElementById('res-materiais').textContent = moeda(State.orcamento.subtotalMateriais);
  document.getElementById('res-mao').textContent = moeda(State.orcamento.subtotalMao);
  document.getElementById('res-despesas').value = State.orcamento.despesas || 0;
  document.getElementById('res-lucro').value = State.orcamento.margem ?? cfg.margem ?? 20;
  document.getElementById('orc-obs-cliente').value = State.orcamento.obsCliente || cfg.obs || '';
  document.getElementById('orc-notas-internas').value = State.orcamento.notasInternas || '';
  document.getElementById('orc-pagamento').value = State.orcamento.pagamento || cfg.pagamento || '';
  calcularTotal();
}

function calcularTotal() {
  const mat = State.orcamento.subtotalMateriais || 0;
  const mao = State.orcamento.subtotalMao || 0;
  const desp = parseFloat(document.getElementById('res-despesas').value) || 0;
  const pct = parseFloat(document.getElementById('res-lucro').value) || 0;
  const sub = mat + mao + desp;
  const lucroValor = sub * (pct / 100);
  const total = sub + lucroValor;
  document.getElementById('res-subtotal').textContent = moeda(sub);
  document.getElementById('res-lucro-valor').textContent = moeda(lucroValor);
  document.getElementById('res-total').textContent = moeda(total);
  State.orcamento.despesas = desp;
  State.orcamento.margem = pct;
  State.orcamento.subtotal = sub;
  State.orcamento.lucroValor = lucroValor;
  State.orcamento.total = total;
}

function salvarOrcamento() {
  calcularTotal();

  const margem = parseFloat(document.getElementById('res-lucro').value);
  if (isNaN(margem) || margem < 0 || margem > 100) {
    mostrarErro('res-lucro', 'Margem deve ser entre 0 e 100');
    return;
  }

  if (State.orcamento.total === 0 &&
      State.orcamento.materiais.length === 0 &&
      State.orcamento.maoDeObra.length === 0) {
    showToast('⚠️ Adicione pelo menos um material ou serviço antes de salvar');
    return;
  }

  State.orcamento.obsCliente = document.getElementById('orc-obs-cliente').value.trim();
  State.orcamento.notasInternas = document.getElementById('orc-notas-internas').value.trim();
  State.orcamento.pagamento = document.getElementById('orc-pagamento').value;

  const dataValidade = new Date(State.orcamento.dataCriacao);
  dataValidade.setDate(dataValidade.getDate() + State.orcamento.validade);
  State.orcamento.dataValidade = dataValidade.toISOString();

  Storage.salvarOrcamento(State.orcamento);
  showToast('✅ Orçamento salvo!');
  State.screenHistory = [];
  abrirOrcamento(State.orcamento.id);
}

// ===== VISUALIZAR ORÇAMENTO =====
function abrirOrcamento(id) {
  const o = Storage.getOrcamento(id);
  if (!o) return;
  // Deep copy garante que visualização não interfere com estado de edição
  State.orcamento = deepCopy(o);
  document.getElementById('vis-numero').textContent = o.numero;
  document.getElementById('vis-status').value = o.status;
  renderizarPreview(o);
  navigate('visualizar');
}

function renderizarPreview(o) {
  const cfg = Storage.getConfig();
  const empresa = cfg.empresa || 'Sua Empresa';

  const headerEmpresa = cfg.empresa ? `
    <div class="preview-empresa">${cfg.empresa}</div>
    <div class="preview-empresa-info">
      ${cfg.cnpj ? `CNPJ: ${cfg.cnpj}<br>` : ''}
      ${cfg.telefone ? `Tel: ${cfg.telefone}<br>` : ''}
      ${cfg.email ? `${cfg.email}<br>` : ''}
      ${cfg.endereco ? `${cfg.endereco}<br>` : ''}
      ${cfg.site ? cfg.site : ''}
    </div>` : `<div class="preview-empresa">${empresa}</div>
    <div class="preview-empresa-info" style="color:var(--yellow);font-size:12px">
      ⚠️ Configure os dados da empresa em Configurações
    </div>`;

  const linhasMat = o.materiais.length > 0 ? `
    <div class="preview-section">
      <div class="preview-section-title">Materiais</div>
      <table class="preview-table">
        <thead><tr>
          <th>Item</th><th>Qtd</th><th>Unit.</th><th class="td-right">Total</th>
        </tr></thead>
        <tbody>
          ${o.materiais.map(m => `<tr>
            <td>${m.item}</td>
            <td>${m.qtd}</td>
            <td>${moeda(m.valor)}</td>
            <td class="td-right">${moeda(m.total)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : '';

  const linhasMao = o.maoDeObra.length > 0 ? `
    <div class="preview-section">
      <div class="preview-section-title">Mão de Obra</div>
      <table class="preview-table">
        <thead><tr>
          <th>Descrição</th><th>Detalhe</th><th class="td-right">Total</th>
        </tr></thead>
        <tbody>
          ${o.maoDeObra.map(m => `<tr>
            <td>${m.desc}</td>
            <td>${m.tipo === 'horas' ? `${m.horas}h × ${moeda(m.valorH)}` : 'Fixo'}</td>
            <td class="td-right">${moeda(m.total)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : '';

  document.getElementById('preview-orcamento').innerHTML = `
    <div class="preview-header">
      ${headerEmpresa}
    </div>
    <div class="preview-divider"></div>
    <div class="preview-orc-titulo">ORÇAMENTO ${o.numero}</div>
    <div class="preview-meta">
      Data: ${fmtData(o.dataCriacao)}<br>
      Válido até: ${fmtData(o.dataValidade)}<br>
      Cliente: <strong>${o.cliente.nome}</strong>
      ${o.cliente.empresa ? `<br>Empresa: ${o.cliente.empresa}` : ''}
      ${o.descricao ? `<br><em>${o.descricao}</em>` : ''}
    </div>
    ${linhasMat}
    ${linhasMao}
    <div class="preview-totais">
      <div class="preview-divider"></div>
      ${o.subtotalMateriais > 0 ? `<div class="preview-total-linha"><span>Subtotal Materiais</span><span>${moeda(o.subtotalMateriais)}</span></div>` : ''}
      ${o.subtotalMao > 0 ? `<div class="preview-total-linha"><span>Subtotal Mão de Obra</span><span>${moeda(o.subtotalMao)}</span></div>` : ''}
      ${o.despesas > 0 ? `<div class="preview-total-linha"><span>Despesas Extras</span><span>${moeda(o.despesas)}</span></div>` : ''}
      <div class="preview-total-linha"><span>Margem de Lucro (${o.margem}%)</span><span>${moeda(o.lucroValor)}</span></div>
      <div class="preview-total-linha grand"><span>TOTAL</span><span>${moeda(o.total)}</span></div>
    </div>
    ${o.pagamento ? `<div class="preview-obs"><div class="preview-obs-title">Forma de Pagamento</div>${o.pagamento}</div>` : ''}
    ${o.obsCliente ? `<div class="preview-obs"><div class="preview-obs-title">Observações</div>${o.obsCliente}</div>` : ''}
  `;
}

function atualizarStatus() {
  if (!State.orcamento) return;
  State.orcamento.status = document.getElementById('vis-status').value;
  Storage.salvarOrcamento(State.orcamento);
  showToast('✅ Status atualizado');
}

function toggleMenuOrcamento() {
  const menu = document.getElementById('menu-orcamento');
  State.menuAberto = !State.menuAberto;
  menu.style.display = State.menuAberto ? 'block' : 'none';
}

function fecharMenuOrcamento() {
  State.menuAberto = false;
  const menu = document.getElementById('menu-orcamento');
  if (menu) menu.style.display = 'none';
}

function editarOrcamentoAtual() {
  if (!State.orcamento) return;
  // Carrega cópia fresca do storage para evitar edição sobre estado de visualização
  const fresco = Storage.getOrcamento(State.orcamento.id);
  if (!fresco) return;
  State.orcamento = deepCopy(fresco);
  State.editandoId = fresco.id;
  State.screenHistory = ['dashboard'];
  navigate('orc-1');
}

function duplicarOrcamento() {
  fecharMenuOrcamento();
  if (!State.orcamento) return;
  const novo = deepCopy(State.orcamento);
  novo.id = gerarId();
  novo.numero = `ORC-${String(Storage.proximoNumero()).padStart(3, '0')}`;
  novo.dataCriacao = new Date().toISOString();
  novo.status = 'rascunho';
  const dataValidade = new Date();
  dataValidade.setDate(dataValidade.getDate() + novo.validade);
  novo.dataValidade = dataValidade.toISOString();
  Storage.salvarOrcamento(novo);
  showToast('📋 Orçamento duplicado!');
  abrirOrcamento(novo.id);
}

function excluirOrcamento() {
  fecharMenuOrcamento();
  if (!State.orcamento) return;
  abrirModalExcluir(
    `Tem certeza que deseja excluir o orçamento <strong>${State.orcamento.numero}</strong>? Esta ação não pode ser desfeita.`,
    () => {
      Storage.excluirOrcamento(State.orcamento.id);
      State.orcamento = null;
      showToast('🗑️ Orçamento excluído');
      State.screenHistory = [];
      navigate('dashboard');
    }
  );
}

// ===== PDF =====
function gerarPDF() {
  if (!State.orcamento) return;

  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast('⚠️ Biblioteca de PDF não carregou. Verifique sua conexão e recarregue a página.');
    return;
  }

  try {
    _gerarPDFInterno();
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    showToast('❌ Não foi possível gerar o PDF. Tente novamente.');
  }
}

function _gerarPDFInterno() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const cfg = Storage.getConfig();
  const o = State.orcamento;
  const W = doc.internal.pageSize.getWidth();

  // Cabeçalho
  doc.setFillColor(26, 115, 232);
  doc.rect(0, 0, W, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(cfg.empresa || 'OrcaFácil Industrial', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const infoEmpresa = [cfg.cnpj, cfg.telefone, cfg.email, cfg.endereco].filter(Boolean).join(' | ');
  if (infoEmpresa) doc.text(infoEmpresa, 14, 27);

  // Título do orçamento
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`ORÇAMENTO ${o.numero}`, 14, 48);

  // Meta
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Data: ${fmtData(o.dataCriacao)}   Válido até: ${fmtData(o.dataValidade)}`, 14, 56);
  doc.text(`Cliente: ${o.cliente.nome}${o.cliente.empresa ? ' — ' + o.cliente.empresa : ''}`, 14, 62);
  if (o.descricao) doc.text(`Serviço: ${o.descricao}`, 14, 68);

  let y = o.descricao ? 76 : 70;

  // Materiais
  if (o.materiais.length > 0) {
    doc.autoTable({
      startY: y,
      head: [['Item', 'Qtd', 'Valor Unit.', 'Total']],
      body: o.materiais.map(m => [m.item, m.qtd, moeda(m.valor), moeda(m.total)]),
      headStyles: { fillColor: [26, 115, 232], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 243, 244] },
      margin: { left: 14, right: 14 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
      didDrawPage: (d) => { y = d.cursor.y + 4; }
    });
    y = doc.lastAutoTable.finalY + 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(`Subtotal Materiais: ${moeda(o.subtotalMateriais)}`, W - 14, y, { align: 'right' });
    y += 8;
  }

  // Mão de Obra
  if (o.maoDeObra.length > 0) {
    doc.autoTable({
      startY: y,
      head: [['Descrição', 'Detalhe', 'Total']],
      body: o.maoDeObra.map(m => [
        m.desc,
        m.tipo === 'horas' ? `${m.horas} ${m.unidade === 'dias' ? 'dia(s)' : m.unidade === 'litros' ? 'L' : 'h'} × ${moeda(m.valorH)}` : 'Valor Fixo',
        moeda(m.total)
      ]),
      headStyles: { fillColor: [52, 168, 83], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [230, 244, 234] },
      margin: { left: 14, right: 14 },
      columnStyles: { 2: { halign: 'right' } }
    });
    y = doc.lastAutoTable.finalY + 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(`Subtotal Mão de Obra: ${moeda(o.subtotalMao)}`, W - 14, y, { align: 'right' });
    y += 8;
  }

  // Totais finais
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, W - 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  if (o.despesas > 0) {
    doc.text(`Despesas Extras: ${moeda(o.despesas)}`, W - 14, y, { align: 'right' }); y += 6;
  }
  doc.text(`Margem de Lucro (${o.margem}%): ${moeda(o.lucroValor)}`, W - 14, y, { align: 'right' }); y += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 115, 232);
  doc.text(`TOTAL: ${moeda(o.total)}`, W - 14, y, { align: 'right' }); y += 12;

  // Pagamento e Observações
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  if (o.pagamento) {
    doc.setFont('helvetica', 'bold');
    doc.text('Forma de Pagamento:', 14, y); y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(o.pagamento, 14, y); y += 8;
  }
  if (o.obsCliente) {
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 14, y); y += 5;
    doc.setFont('helvetica', 'normal');
    const linhas = doc.splitTextToSize(o.obsCliente, W - 28);
    doc.text(linhas, 14, y);
  }

  doc.save(`${o.numero}.pdf`);
  showToast('📄 PDF gerado!');
}

// ===== IMPRESSÃO =====
function imprimirOrcamento() {
  const area = document.getElementById('print-area');
  area.innerHTML = document.getElementById('preview-orcamento').innerHTML;
  window.print();
}

// ===== COMPARTILHAR =====
async function compartilharOrcamento() {
  if (!State.orcamento) return;
  const o = State.orcamento;
  const cfg = Storage.getConfig();
  const texto = `*${o.numero}*\n` +
    `${cfg.empresa || 'Orçamento'}\n\n` +
    `Cliente: ${o.cliente.nome}\n` +
    (o.cliente.empresa ? `Empresa: ${o.cliente.empresa}\n` : '') +
    `Data: ${fmtData(o.dataCriacao)}\n` +
    `Válido até: ${fmtData(o.dataValidade)}\n\n` +
    `*TOTAL: ${moeda(o.total)}*\n\n` +
    (o.obsCliente ? `Obs: ${o.obsCliente}\n` : '') +
    (o.pagamento ? `Pagamento: ${o.pagamento}` : '');

  if (navigator.share) {
    try {
      await navigator.share({ title: o.numero, text: texto });
    } catch (e) {
      copiarTexto(texto);
    }
  } else {
    copiarTexto(texto);
  }
}

function copiarTexto(texto) {
  navigator.clipboard.writeText(texto)
    .then(() => showToast('📋 Texto copiado para a área de transferência!'))
    .catch(() => showToast('⚠️ Não foi possível compartilhar'));
}

// ===== CONFIGURAÇÕES =====
function carregarConfiguracoes() {
  const cfg = Storage.getConfig();
  document.getElementById('cfg-empresa').value = cfg.empresa || '';
  document.getElementById('cfg-cnpj').value = cfg.cnpj || '';
  document.getElementById('cfg-telefone').value = cfg.telefone || '';
  document.getElementById('cfg-email').value = cfg.email || '';
  document.getElementById('cfg-endereco').value = cfg.endereco || '';
  document.getElementById('cfg-site').value = cfg.site || '';
  document.getElementById('cfg-margem').value = cfg.margem || 20;
  document.getElementById('cfg-validade').value = cfg.validade || 15;
  document.getElementById('cfg-pagamento').value = cfg.pagamento || '';
  document.getElementById('cfg-obs').value = cfg.obs || '';
}

function salvarConfiguracoes() {
  Storage.salvarConfig({
    empresa: document.getElementById('cfg-empresa').value.trim(),
    cnpj: document.getElementById('cfg-cnpj').value.trim(),
    telefone: document.getElementById('cfg-telefone').value.trim(),
    email: document.getElementById('cfg-email').value.trim(),
    endereco: document.getElementById('cfg-endereco').value.trim(),
    site: document.getElementById('cfg-site').value.trim(),
    margem: parseFloat(document.getElementById('cfg-margem').value) || 20,
    validade: parseInt(document.getElementById('cfg-validade').value) || 15,
    pagamento: document.getElementById('cfg-pagamento').value.trim(),
    obs: document.getElementById('cfg-obs').value.trim()
  });
  showToast('✅ Configurações salvas!');
  goBack();
}

// ===== MODAL DE CONFIRMAÇÃO =====
let modalCallback = null;

function abrirModalExcluir(mensagem, onConfirmar) {
  modalCallback = onConfirmar;
  document.getElementById('modal-msg').innerHTML = mensagem;
  document.getElementById('modal-btn-confirmar').onclick = () => {
    const cb = modalCallback;
    fecharModalExcluir();
    if (cb) cb();
  };
  document.getElementById('modal-overlay').classList.add('active');
}

function fecharModalExcluir() {
  document.getElementById('modal-overlay').classList.remove('active');
  modalCallback = null;
}

// Fechar menu ao clicar fora
document.addEventListener('click', (e) => {
  if (State.menuAberto && !e.target.closest('#menu-orcamento') && !e.target.closest('.icon-btn')) {
    fecharMenuOrcamento();
  }
});
