// Comprehensive Question Database
const quizDatabase = {
    programming: [
        // LEVEL 1 (Base Questions)
        [
            { question: "ما هي لغة البرمجة التي تستخدم لإضافة التفاعلية للمواقع؟", options: ["HTML", "CSS", "JavaScript", "SQL"], answer: 2 },
            { question: "أي خاصية CSS تستخدم لتغيير لون الخلفية؟", options: ["color", "background-color", "bg-color", "fill"], answer: 1 },
            { question: "ماذا يرمز اختصار HTML؟", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Management Language"], answer: 0 },
            { question: "أي رمز يستخدم لتعريف الـ ID في CSS؟", options: [".", "#", "*", "@"], answer: 1 },
            { question: "كيف تقوم بتعريف مصفوفة في JavaScript؟", options: ["let arr = {}", "let arr = []", "let arr = ()", "let arr = <>"], answer: 1 },
            { question: "ما هو الوسم الصحيح لإضافة رابط؟", options: ["<link>", "<a>", "<href>", "<url>"], answer: 1 },
            { question: "أي شركة قامت بتطوير لغة Java؟", options: ["Microsoft", "Google", "Sun Microsystems", "Apple"], answer: 2 },
            { question: "ما هي الوظيفة الأساسية لـ Git؟", options: ["تحرير الصور", "تنسيق النصوص", "نظام مراقبة النسخ (Version Control)", "استضافة قواعد البيانات"], answer: 2 },
            { question: "أي خاصية تستخدم لجعل النص عريضاً (Bold)؟", options: ["font-style", "font-weight", "text-decoration", "boldness"], answer: 1 },
            { question: "ماذا تعني SQL؟", options: ["Simple Query Language", "Standard Quiz Layer", "Structured Query Language", "Solution Query List"], answer: 2 }
        ],
        // LEVEL 2 (More Questions...)
        [
            { question: "ما هو محرك جافا سكريبت في متصفح Chrome؟", options: ["SpiderMonkey", "Chakra", "V8", "Nitro"], answer: 2 },
            { question: "أي عنصر HTML يستخدم لتضمين ملف JS خارجي؟", options: ["<javascript>", "<scripting>", "<script>", "<js>"], answer: 2 },
            { question: "ما هي القيمة الافتراضية للـ position في CSS؟", options: ["absolute", "relative", "static", "fixed"], answer: 2 },
            { question: "ما هي طريقة دمج مصفوفتين في JS؟", options: ["concat()", "combine()", "merge()", "append()"], answer: 0 },
            { question: "ماذا تعني API؟", options: ["Application Program Interface", "Advanced Programming Intel", "Apple Program Info", "Automated Process Ink"], answer: 0 },
            { question: "ما هو الخطأ في تسمية المتغير: let 1user؟", options: ["استخدام let", "بدء الاسم برقم", "استخدام كلمة user", "لا يوجد خطأ"], answer: 1 },
            { question: "أي نوع بيانات يمثله: true / false؟", options: ["String", "Number", "Boolean", "Undefined"], answer: 2 },
            { question: "ما هو الـ DOM؟", options: ["Document Object Model", "Data Object Management", "Digital Orbit Mode", "Desktop Output Monitor"], answer: 0 },
            { question: "أي مكتبة JS تستخدم لبناء واجهات مستخدم بأسلوب المكونات؟", options: ["jQuery", "React", "Django", "Laravel"], answer: 1 },
            { question: "كيف نكتب تعليقاً في CSS؟", options: ["// comment", "<!-- comment -->", "/* comment */", "# comment"], answer: 2 }
        ]
        // Add more levels here up to 100+ to reach 1000 questions
    ],
    general: [
        // LEVEL 1
        [
            { question: "ما هي أكبر قارة في العالم؟", options: ["أفريقيا", "أوروبا", "آسيا", "أمريكا الشمالية"], answer: 2 },
            { question: "من هو مخترع المصباح الكهربائي؟", options: ["نيوتن", "توماس إديسون", "أينشتاين", "تسلا"], answer: 1 },
            { question: "ما هي عاصمة ألمانيا؟", options: ["باريس", "برلين", "لندن", "مدريد"], answer: 1 },
            { question: "كم عدد كواكب المجموعة الشمسية؟", options: ["7", "8", "9", "10"], answer: 1 },
            { question: "ما هو أسرع حيوان بري في العالم؟", options: ["الأسد", "النمر", "الفهد", "الغزال"], answer: 2 },
            { question: "ما هو الرمز الكيميائي للماء؟", options: ["CO2", "H2O", "O2", "NaCl"], answer: 1 },
            { question: "في أي مدينة توجد الأهرامات؟", options: ["القاهرة", "الجيزة", "الأقصر", "أسوان"], answer: 1 },
            { question: "ما هو طول نهر النيل تقريباً؟", options: ["4000 كم", "6650 كم", "8000 كم", "5500 كم"], answer: 1 },
            { question: "كم عدد أسنان الإنسان البالغ؟", options: ["28", "30", "32", "34"], answer: 2 },
            { question: "ما هي عاصمة اليابان؟", options: ["بكين", "سيول", "طوكيو", "هانوي"], answer: 2 }
        ],
        // LEVEL 2
        [
            { question: "ما هو أكبر محيط في العالم؟", options: ["الأطلسي", "الهندي", "الهادئ", "المجمّد الشمالي"], answer: 2 },
            { question: "من هو مؤلف كتاب 'مقدمة ابن خلدون'؟", options: ["ابن سينا", "ابن خلدون", "الغزالي", "الفارابي"], answer: 1 },
            { question: "ما هي العملة المستخدمة في دول الاتحاد الأوروبي؟", options: ["الدولار", "اليورو", "الجنيه", "الفرنك"], answer: 1 },
            { question: "كم عدد القلوب لدى الأخطبوط؟", options: ["1", "2", "3", "4"], answer: 2 },
            { question: "ما هو أصغر كوكب في المجموعة الشمسية؟", options: ["عطارد", "المريخ", "الزهرة", "نبتون"], answer: 0 },
            { question: "أين تقع الغابة الاستوائية الأكبر في العالم؟", options: ["أفريقيا", "الأمازون", "إندونيسيا", "أستراليا"], answer: 1 },
            { question: "من هو أول إنسان صعد إلى القمر؟", options: ["يوري غاغارين", "نيل آرمسترونغ", "بايز ألدرين", "مايكل كولينز"], answer: 1 },
            { question: "ما هي أصلب مادة في الطبيعة؟", options: ["الحديد", "الألماس", "الذهب", "النحاس"], answer: 1 },
            { question: "كم عدد ألوان قوس قزح؟", options: ["5", "6", "7", "8"], answer: 2 },
            { question: "ما هو الطائر الذي يضع أكبر بيضة؟", options: ["النسر", "النعامة", "البوم", "الصقر"], answer: 1 }
        ]
    ]
};

// State Variables
let currentCategory = '';
let currentLevel = 0;
let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 15;
let timerInterval;
let canAnswer = true;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
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

// Global Function for selection
window.selectCategory = function (category) {
    currentCategory = category;
    currentLevel = 0;
    startQuiz();
}

// Event Listeners
nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    const questionsInLevel = quizDatabase[currentCategory][currentLevel];
    if (currentQuestionIndex < questionsInLevel.length) {
        showQuestion();
    } else {
        showLevelComplete();
    }
});

restartBtn.addEventListener('click', () => {
    currentLevel = 0;
    startQuiz();
});

// Functions
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    startScreen.classList.remove('active');
    resultScreen.classList.remove('active');
    quizScreen.classList.add('active');

    // Total for this level (always 10)
    totalQDisplay.textContent = quizDatabase[currentCategory][currentLevel].length;
    showQuestion();
}

function showQuestion() {
    canAnswer = true;
    timeLeft = 15;
    nextBtn.disabled = true;
    timerDisplay.textContent = timeLeft;

    const qBatch = quizDatabase[currentCategory][currentLevel];
    const q = qBatch[currentQuestionIndex];

    questionText.textContent = q.question;
    currentQDisplay.textContent = currentQuestionIndex + 1;

    // Update Progress
    const progress = ((currentQuestionIndex + 1) / qBatch.length) * 100;
    progressBar.style.width = `${progress}%`;

    optionsContainer.innerHTML = '';
    q.options.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.innerHTML = `<span>${option}</span><i class="far fa-circle"></i>`;
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
    const correctIndex = quizDatabase[currentCategory][currentLevel][currentQuestionIndex].answer;

    if (index === correctIndex) {
        score++;
        element.classList.add('correct');
        element.querySelector('i').className = 'fas fa-check-circle';
    } else {
        element.classList.add('wrong');
        element.querySelector('i').className = 'fas fa-times-circle';
        optionsContainer.children[correctIndex].classList.add('correct');
        optionsContainer.children[correctIndex].querySelector('i').className = 'fas fa-check-circle';
    }

    Array.from(optionsContainer.children).forEach(opt => opt.classList.add('disabled'));
    nextBtn.disabled = false;
}

function autoHandleTimeout() {
    canAnswer = false;
    const correctIndex = quizDatabase[currentCategory][currentLevel][currentQuestionIndex].answer;
    optionsContainer.children[correctIndex].classList.add('correct');
    optionsContainer.children[correctIndex].querySelector('i').className = 'fas fa-check-circle';
    Array.from(optionsContainer.children).forEach(opt => opt.classList.add('disabled'));
    nextBtn.disabled = false;
}

function showLevelComplete() {
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    finalScoreDisplay.textContent = score;
    maxScoreDisplay.textContent = `/ 10`;

    if (score >= 7) {
        resultMessage.innerHTML = `مستوى رائع! لقد أكملت <b>المستوى ${currentLevel + 1}</b> بنجاح. هل أنت جاهز للمستوى التالي؟`;
        restartBtn.textContent = "المستوى التالي";
        restartBtn.onclick = () => {
            currentLevel++;
            // Wrap around or check if level exists
            if (currentLevel >= quizDatabase[currentCategory].length) {
                alert("تهانينا! لقد أنهيت جميع المستويات المتوفرة حالياً.");
                currentLevel = 0;
            }
            startQuiz();
        };
    } else {
        resultMessage.innerHTML = "نقاطك غير كافية للمرور للمستوى التالي. حاول مرة أخرى!";
        restartBtn.textContent = "إعادة المحاولة";
        restartBtn.onclick = () => startQuiz();
    }
}
