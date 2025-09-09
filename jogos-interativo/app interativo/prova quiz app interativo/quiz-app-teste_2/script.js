const quizData = [



    {
        question: "Qual alternativa está correta? Um bemol é uma nota musical e sua variação é meio tom abaixo da nota natural.",
        a: "Essa afirmativa é falsa.",
        b: "Essa afirmativa é verdadeira.",
        c: "O correto é que um bemol é meio tom acima da nota natural.",
        d: "Nenhuma das alternativas estão corretas.",
        correct: "b",
    },
     {
        question: "Quantas oitavas existem em uma escala natural?",
        a: "3",
        b: "1",
        c: "10",
        d: "12",
        correct: "b",
    },


    {
        question: "Qual é a nota um semitom abaixo de Sí?",
        a: "Dó",
        b: "Ré",
        c: "Lá",
        d: "Sí-bemol",
        correct: "d",
    },

    {
        question: "Antes da nota Lá, que nota vem?",
        a: "Lábemol",
        b: "sol",
        c: "sol-bemol",
        d: "Sí",
        correct: "a",
    },
    {
        question: "Em uma escala cromática começando em Dó, qual a quinta nota?",
        a: "sol",
        b: "Mí",
        c: "Mí-bemol",
        d: "Sí",
        correct: "b",
    },
    {
        question: "Quantas oitavas há em seu Teclado musical?",
        a: "7",
        b: "6",
        c: "5",
        d: "4",
        correct: "c",
    },

    {
        question: "Qual é a nota um semitom abaixo de Fá?  ",
        a: "Sol",
        b: "Mi",
        c: "Lá",
        d: "Ré",
        correct: "b",
    },
];

const quiz = document.getElementById("quiz");
const answerEls = document.querySelectorAll(".answer");
const questionEl = document.getElementById("question");
const a_text = document.getElementById("a_text");
const b_text = document.getElementById("b_text");
const c_text = document.getElementById("c_text");
const d_text = document.getElementById("d_text");
const submitBtn = document.getElementById("submit");

let currentQuiz = 0;
let score = 0;

loadQuiz();

function loadQuiz() {
    deselectAnswers();

    const currentQuizData = quizData[currentQuiz];

    questionEl.innerText = currentQuizData.question;
    a_text.innerText = currentQuizData.a;
    b_text.innerText = currentQuizData.b;
    c_text.innerText = currentQuizData.c;
    d_text.innerText = currentQuizData.d;
}

function getSelected() {
    let answer = undefined;

    answerEls.forEach((answerEl) => {
        if (answerEl.checked) {
            answer = answerEl.id;
        }
    });

    return answer;
}

function deselectAnswers() {
    answerEls.forEach((answerEl) => {
        answerEl.checked = false;
    });
}

submitBtn.addEventListener("click", () => {
    // check to see the answer
    const answer = getSelected();

    if (answer) {
        if (answer === quizData[currentQuiz].correct) {
            score++;
        }

        currentQuiz++;
        if (currentQuiz < quizData.length) {
            loadQuiz();
        } else {
            quiz.innerHTML = `
                <h2>Parabéns! Roziana você acertou ${score}/${quizData.length} Questões.</h2>
                
                <button onclick="location.reload()">Refazer o Teste</button>
            `;
        }
    }
});
