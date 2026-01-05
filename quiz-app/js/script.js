// Question Bank
const questions = [
    {
        question: "ما هي لغة البرمجة التي تستخدم لإضافة التفاعلية للمواقع؟",
        options: ["HTML", "CSS", "JavaScript", "SQL"],
        answer: 2
    },
    {
        question: "أي خاصية CSS تستخدم لتغيير لون الخلفية؟",
        options: ["color", "background-color", "bg-color", "fill"],
        answer: 1
    },
    {
        question: "ماذا يرمز اختصار HTML؟",
        options: [
            "Hyper Text Markup Language",
            "High Tech Modern Language",
            "Home Tool Markup Language",
            "Hyperlink Text Management Language"
        ],
        answer: 0
    },
    {
        question: "أي رمز يستخدم لتعريف الـ ID في CSS؟",
        options: [".", "#", "*", "@"],
        answer: 1
    },
    {
        question: "كيف تقوم بتعريف مصفوفة في JavaScript؟",
        options: [
            "let arr = {}",
            "let arr = []",
            "let arr = ()",
            "let arr = <>"
        ],
        answer: 1
    },
    {
        question: "ما هو الوسم الصحيح لإضافة رابط؟",
        options: ["<link>", "<a>", "<href>", "<url>"],
        answer: 1
    },
    {
        question: "أي شركة قامت بتطوير لغة Java؟",
        options: ["Microsoft", "Google", "Sun Microsystems", "Apple"],
        answer: 2
    },
    {
        question: "ما هي الوظيفة الأساسية لـ Git؟",
        options: [
            "تحرير الصور",
            "تنسيق النصوص",
            "نظام مراقبة النسخ (Version Control)",
            "استضافة قواعد البيانات"
        ],
        answer: 2
    },
    {
        question: "أي خاصية تستخدم لجعل النص عريضاً (Bold)؟",
        options: ["font-style", "font-weight", "text-decoration", "boldness"],
        answer: 1
    },
    {
        question: "ماذا تعني SQL؟",
        options: [
            "Simple Query Language",
            "Standard Quiz Layer",
            "Structured Query Language",
            "Solution Query List"
        ],
        answer: 2
    }
];

// State Variables
let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 15;
let timerInterval;
let canAnswer = true;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const timerDisplay = document.getElementById('time-left');
const progressBar = document.getElementById('progress-bar');
const currentQDisplay = document.getElementById('current-q');
const totalQDisplay = document.getElementById('total-q');
const finalScoreDisplay = document.getElementById('final-score');
const maxScoreDisplay = document.getElementById('max-score');
const resultMessage = document.getElementById('result-message');
const resultIcon = document.getElementById('result-icon');

// Initialize
totalQDisplay.textContent = questions.length;
maxScoreDisplay.textContent = `/ ${questions.length}`;

// Event Listeners
startBtn.addEventListener('click', startQuiz);
nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
});
restartBtn.addEventListener('click', startQuiz);

// Functions
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    startScreen.classList.remove('active');
    resultScreen.classList.remove('active');
    quizScreen.classList.add('active');
    showQuestion();
}

function showQuestion() {
    canAnswer = true;
    timeLeft = 15;
    nextBtn.disabled = true;
    timerDisplay.textContent = timeLeft;

    const q = questions[currentQuestionIndex];
    questionText.textContent = q.question;
    currentQDisplay.textContent = currentQuestionIndex + 1;

    // Update Progress
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;

    // Clear and build options
    optionsContainer.innerHTML = '';
    q.options.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.innerHTML = `
            <span>${option}</span>
            <i class="far fa-circle"></i>
        `;
        div.addEventListener('click', () => selectOption(index, div));
        optionsContainer.appendChild(div);
    });

    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            autoHandleTimeout();
        }
    }, 1000);
}

function selectOption(index, element) {
    if (!canAnswer) return;

    clearInterval(timerInterval);
    canAnswer = false;
    const correctIndex = questions[currentQuestionIndex].answer;

    if (index === correctIndex) {
        score++;
        element.classList.add('correct');
        element.querySelector('i').className = 'fas fa-check-circle';
        playFeedbackSound(true);
    } else {
        element.classList.add('wrong');
        element.querySelector('i').className = 'fas fa-times-circle';
        // Show correct answer
        optionsContainer.children[correctIndex].classList.add('correct');
        optionsContainer.children[correctIndex].querySelector('i').className = 'fas fa-check-circle';
        playFeedbackSound(false);
    }

    // Disable all options
    Array.from(optionsContainer.children).forEach(opt => opt.classList.add('disabled'));
    nextBtn.disabled = false;
}

function autoHandleTimeout() {
    canAnswer = false;
    const correctIndex = questions[currentQuestionIndex].answer;
    optionsContainer.children[correctIndex].classList.add('correct');
    optionsContainer.children[correctIndex].querySelector('i').className = 'fas fa-check-circle';

    Array.from(optionsContainer.children).forEach(opt => opt.classList.add('disabled'));
    nextBtn.disabled = false;
}

function showResults() {
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    finalScoreDisplay.textContent = score;

    // Custom Messages
    if (score === questions.length) {
        resultMessage.textContent = "عبقري! إجابات مثالية في كل الأسئلة.";
        resultIcon.innerHTML = '<i class="fas fa-crown"></i>';
        resultIcon.style.color = "#fbbf24";
    } else if (score >= questions.length / 2) {
        resultMessage.textContent = "عمل جيد جداً! لديك معرفة قوية بالبرمجة.";
        resultIcon.innerHTML = '<i class="fas fa-medal"></i>';
        resultIcon.style.color = "#e5e7eb";
    } else {
        resultMessage.textContent = "لا بأس، استمر في التعلم وحاول مرة أخرى!";
        resultIcon.innerHTML = '<i class="fas fa-book-open"></i>';
        resultIcon.style.color = "#94a3b8";
    }
}

function playFeedbackSound(isCorrect) {
    // Optional: Add Audio context sounds here for extra premium feel
    // console.log(isCorrect ? "Correct!" : "Wrong!");
}
