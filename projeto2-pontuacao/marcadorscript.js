const tabelaPontuacao = document.getElementById('tabela-pontuacao');
const corpoTabela = document.getElementById('corpo-tabela');
const totalPontuacaoJogador1 = document.getElementById('total-pontuacao-jogador-1');
const totalPontuacaoJogador2 = document.getElementById('total-pontuacao-jogador-2');
const adicionarLinhaButton = document.getElementById('adicionar-linha');
const calcularTotalButton = document.getElementById('calcular-total');

let pontuacoesJogador1 = [];
let pontuacoesJogador2 = [];

adicionarLinhaButton.addEventListener('click', () => {
    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td><input type="number" placeholder="Digite a pontuação"></td>
        <td><input type="number" placeholder="Digite a pontuação"></td>
        <td><button class="excluir-linha">Excluir</button></td>
    `;
    corpoTabela.appendChild(novaLinha);

    const excluirLinhaButton = novaLinha.querySelector('.excluir-linha');
    excluirLinhaButton.addEventListener('click', () => {
        corpoTabela.removeChild(novaLinha);
    });
});

calcularTotalButton.addEventListener('click', () => {
    pontuacoesJogador1 = [];
    pontuacoesJogador2 = [];

    const linhasTabela = corpoTabela.children;

    for (let i = 0; i < linhasTabela.length; i++) {
        const linha = linhasTabela[i];
        const inputs = linha.getElementsByTagName('input');

        if (inputs.length > 0) {
            const pontuacaoJogador1 = parseFloat(inputs[0].value);
            const pontuacaoJogador2 = parseFloat(inputs[1].value);

            pontuacoesJogador1.push(pontuacaoJogador1);
            pontuacoesJogador2.push(pontuacaoJogador2);
        }
    }

    const totalJogador1 = pontuacoesJogador1.reduce((a, b) => a + b, 0);
    const totalJogador2 = pontuacoesJogador2.reduce((a, b) => a + b, 0);

    totalPontuacaoJogador1.textContent = totalJogador1;
    totalPontuacaoJogador2.textContent = totalJogador2;
});
