const quizData = [



    {
        question: " vamos testar seu conhecimento. Se você estudou o que te mandei clique na alternativa (b), se não estudou, escolha outra qualquer.",
        a: "a",
        b: "b",
        c: "c",
        d: "d",
        correct: "b",
    },
     {
        question: "Quantas são as notas musicais?",
        a: "3",
        b: "8",
        c: "10",
        d: "7",
        correct: "d",
    },


    {
        question: "Qual a sequencia correta das notas musicais?",
        a: "Dó-Ré-Mí-Lá-Sol-Fá-Sí",
        b: "Dó-Ré-Sí-Sol-Fá-Lá-Sí",
        c: "Dó-Ré-Sí-Fá-Sol-Lá-Mí",
        d: "Dó-Ré-Mí-Fá-Sol-Lá-Sí",
        correct: "d",
    },

    {
        question: "Depois da nota Lá, que nota vem?",
        a: "Dó",
        b: "Sí",
        c: "Mí",
        d: "Sol",
        correct: "b",
    },
    {
        question: "Antes da nota Sí, qual é a nota?",
        a: "sol",
        b: "Fá",
        c: "Dó",
        d: "Lá",
        correct: "d",
    },
    {
        question: "Quais as sequencias das notas decrescente estão corretas?",
        a: "Sí-Lá-Sol",
        b: "Dó-Ré-Mí",
        c: "Ré-Mí-Sol",
        d: "Sol-Mí-Ré",
        correct: "a",
    },

    {
        question: "Quais as sequencias Crescente das notas estão corretas?  ",
        a: "Sí-Lá-Sol",
        b: "Mi-Ré-Dó",
        c: "Fá-Sol-Lá",
        d: "Dó-Ré-Sí",
        correct: "c",
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
                <h2>Parabéns! Gabriel você acertou ${score}/${quizData.length} Questões.</h2>
                
                <button onclick="location.reload()">Refazer o Teste</button>
            `;
        }
    }
});
