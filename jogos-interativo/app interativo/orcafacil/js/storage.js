// Chaves do LocalStorage
const KEYS = {
  orcamentos: 'of_orcamentos',
  clientes: 'of_clientes',
  config: 'of_config',
  contador: 'of_contador'
};

// Limite de aviso: 80% de 5 MB (estimativa padrão do localStorage)
const STORAGE_WARN_BYTES = 5 * 1024 * 1024 * 0.8;

function _setItem(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
    _verificarCota();
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      _alertaCotaEsgotada();
    } else {
      throw e;
    }
  }
}

function _calcularUsoBytes() {
  let total = 0;
  for (const key of Object.keys(localStorage)) {
    total += (localStorage.getItem(key) || '').length * 2; // UTF-16: 2 bytes por char
  }
  return total;
}

function _verificarCota() {
  const uso = _calcularUsoBytes();
  if (uso >= STORAGE_WARN_BYTES) {
    console.warn(`[Storage] Uso elevado: ${(uso / 1024).toFixed(1)} KB`);
    if (typeof showToast === 'function') {
      showToast('⚠️ Armazenamento quase cheio. Considere excluir orçamentos antigos.', 4000);
    }
  }
}

function _alertaCotaEsgotada() {
  console.error('[Storage] Cota do localStorage esgotada.');
  if (typeof showToast === 'function') {
    showToast('❌ Armazenamento cheio! Exclua orçamentos antigos para continuar salvando.', 5000);
  }
}

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
    _setItem(KEYS.orcamentos, JSON.stringify(lista));
  },
  getOrcamento(id) {
    return this.getOrcamentos().find(o => o.id === id) || null;
  },
  excluirOrcamento(id) {
    const lista = this.getOrcamentos().filter(o => o.id !== id);
    _setItem(KEYS.orcamentos, JSON.stringify(lista));
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
    _setItem(KEYS.clientes, JSON.stringify(lista));
  },
  getCliente(id) {
    return this.getClientes().find(c => c.id === id) || null;
  },
  excluirCliente(id) {
    const lista = this.getClientes().filter(c => c.id !== id);
    _setItem(KEYS.clientes, JSON.stringify(lista));
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
    _setItem(KEYS.config, JSON.stringify(cfg));
  },

  // ---- CONTADOR ORÇAMENTOS ----
  proximoNumero() {
    const n = parseInt(localStorage.getItem(KEYS.contador) || '0') + 1;
    _setItem(KEYS.contador, String(n));
    return n;
  },

  // ---- UTILITÁRIO: uso atual ----
  usoAtual() {
    const bytes = _calcularUsoBytes();
    return {
      bytes,
      kb: (bytes / 1024).toFixed(1),
      percentual: ((bytes / (5 * 1024 * 1024)) * 100).toFixed(1)
    };
  }
};
