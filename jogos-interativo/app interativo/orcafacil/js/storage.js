// Chaves do LocalStorage
const KEYS = {
  orcamentos: 'of_orcamentos',
  clientes: 'of_clientes',
  config: 'of_config',
  contador: 'of_contador'
};

const Storage = {
  // ---- ORÇAMENTOS ----
  getOrcamentos() {
    return JSON.parse(localStorage.getItem(KEYS.orcamentos) || '[]');
  },
  salvarOrcamento(orc) {
    const lista = this.getOrcamentos();
    const idx = lista.findIndex(o => o.id === orc.id);
    if (idx >= 0) lista[idx] = orc;
    else lista.unshift(orc);
    localStorage.setItem(KEYS.orcamentos, JSON.stringify(lista));
  },
  getOrcamento(id) {
    return this.getOrcamentos().find(o => o.id === id) || null;
  },
  excluirOrcamento(id) {
    const lista = this.getOrcamentos().filter(o => o.id !== id);
    localStorage.setItem(KEYS.orcamentos, JSON.stringify(lista));
  },

  // ---- CLIENTES ----
  getClientes() {
    return JSON.parse(localStorage.getItem(KEYS.clientes) || '[]');
  },
  salvarCliente(cli) {
    const lista = this.getClientes();
    const idx = lista.findIndex(c => c.id === cli.id);
    if (idx >= 0) lista[idx] = cli;
    else lista.push(cli);
    localStorage.setItem(KEYS.clientes, JSON.stringify(lista));
  },
  getCliente(id) {
    return this.getClientes().find(c => c.id === id) || null;
  },
  excluirCliente(id) {
    const lista = this.getClientes().filter(c => c.id !== id);
    localStorage.setItem(KEYS.clientes, JSON.stringify(lista));
  },

  // ---- CONFIGURAÇÕES ----
  getConfig() {
    return JSON.parse(localStorage.getItem(KEYS.config) || JSON.stringify({
      empresa: '',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      site: '',
      margem: 20,
      validade: 15,
      pagamento: '',
      obs: ''
    }));
  },
  salvarConfig(cfg) {
    localStorage.setItem(KEYS.config, JSON.stringify(cfg));
  },

  // ---- CONTADOR ORÇAMENTOS ----
  proximoNumero() {
    const n = parseInt(localStorage.getItem(KEYS.contador) || '0') + 1;
    localStorage.setItem(KEYS.contador, String(n));
    return n;
  }
};
