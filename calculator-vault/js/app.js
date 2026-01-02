class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.clear();
        this.loadPassword();
    }

    loadPassword() {
        this.secretCode = localStorage.getItem('vaultPassword') || null;
    }

    setPassword(password) {
        localStorage.setItem('vaultPassword', password);
        this.secretCode = password;
    }

    clear() {
        this.currentOperand = "0";
        this.previousOperand = "";
        this.operation = undefined;
        this.shouldResetScreen = false;
    }

    delete() {
        if (this.currentOperand === "0") return;
        if (this.currentOperand.length === 1) {
            this.currentOperand = "0";
        } else {
            this.currentOperand = this.currentOperand.toString().slice(0, -1);
        }
    }

    appendNumber(number) {
        if (number === "." && this.currentOperand.includes(".")) return;
        if (this.shouldResetScreen || this.currentOperand === "0") {
            this.currentOperand = number.toString();
            this.shouldResetScreen = false;
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    chooseOperation(operation) {
        if (this.currentOperand === "") return;
        if (this.previousOperand !== "") {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = "";
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case "+":
                computation = prev + current;
                break;
            case "-":
                computation = prev - current;
                break;
            case "*":
                computation = prev * current;
                break;
            case "/":
                if (current === 0) {
                    showNotification("لا يمكن القسمة على صفر!");
                    this.clear();
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = "";
        this.shouldResetScreen = true;
    }

    getDisplayNumber(number) {
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandElement.innerText = this.getDisplayNumber(this.currentOperand) || "0";
        if (this.operation != null) {
            this.previousOperandElement.innerText =
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.innerText = "";
        }
    }
}

// Elements
const numberButtons = document.querySelectorAll('[data-number]');
const operationButtons = document.querySelectorAll('[data-operator]');
const equalsButton = document.getElementById('equals-btn');
const deleteButton = document.querySelector('[data-action="delete"]');
const clearButton = document.querySelector('[data-action="clear"]');
const previousOperandElement = document.getElementById('previous-operand');
const currentOperandElement = document.getElementById('current-operand');
const calculatorUI = document.getElementById('calculator-ui');
const vaultUI = document.getElementById('vault-ui');
const lockVaultBtn = document.getElementById('lock-vault-btn');

// Setup Modal Elements
const setupModal = document.getElementById('setup-modal');
const pass1Input = document.getElementById('pass1');
const pass2Input = document.getElementById('pass2');
const savePassBtn = document.getElementById('save-pass-btn');

const calculator = new Calculator(previousOperandElement, currentOperandElement);

// Check if password exists on load
document.addEventListener('DOMContentLoaded', () => {
    if (!calculator.secretCode) {
        setupModal.classList.remove('hidden');
    }
});

// Setup Password Logic
savePassBtn.addEventListener('click', () => {
    const p1 = pass1Input.value;
    const p2 = pass2Input.value;

    if (!p1 || !p2) {
        showNotification("الرجاء إدخال الرمز في الحقلين");
        return;
    }

    if (p1 !== p2) {
        showNotification("الرموز غير متطابقة!");
        return;
    }

    if (p1.length < 4) {
        showNotification("يجب أن يتكون الرمز من 4 أرقام على الأقل");
        return;
    }

    calculator.setPassword(p1);
    setupModal.classList.add('hidden');
    showNotification("تم إعداد الرمز بنجاح! جرب إدخاله في الحاسبة");
});

// Calculator event listeners
numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.innerText);
        calculator.updateDisplay();
    });
});

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.getAttribute('data-operator'));
        calculator.updateDisplay();
    });
});

equalsButton.addEventListener('click', button => {
    if (calculator.currentOperand === calculator.secretCode && calculator.secretCode !== null) {
        openVault();
        calculator.clear();
        calculator.updateDisplay();
        return;
    }

    calculator.compute();
    calculator.updateDisplay();
});

clearButton.addEventListener('click', button => {
    calculator.clear();
    calculator.updateDisplay();
});

deleteButton.addEventListener('click', button => {
    calculator.delete();
    calculator.updateDisplay();
});

// Vault Interaction Logic
function openVault() {
    calculatorUI.style.transform = "scale(0.8) translateY(-50px)";
    calculatorUI.style.opacity = "0";
    setTimeout(() => {
        calculatorUI.classList.add('hidden');
        vaultUI.classList.remove('hidden');
        setTimeout(() => {
            vaultUI.classList.add('active');
        }, 50);
    }, 400);
}

function closeVault() {
    vaultUI.classList.remove('active');
    setTimeout(() => {
        vaultUI.classList.add('hidden');
        calculatorUI.classList.remove('hidden');
        setTimeout(() => {
            calculatorUI.style.transform = "scale(1) translateY(0)";
            calculatorUI.style.opacity = "1";
        }, 50);
    }, 500);
}

lockVaultBtn.addEventListener('click', closeVault);

// Notification Helper
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.innerText = message;
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Keyboard support
document.addEventListener('keydown', e => {
    if (setupModal.classList.contains('hidden')) {
        if ((e.key >= 0 && e.key <= 9) || e.key === '.') {
            calculator.appendNumber(e.key);
        } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
            calculator.chooseOperation(e.key);
        } else if (e.key === 'Enter' || e.key === '=') {
            if (calculator.currentOperand === calculator.secretCode && calculator.secretCode !== null) {
                openVault();
                calculator.clear();
            } else {
                calculator.compute();
            }
        } else if (e.key === 'Backspace') {
            calculator.delete();
        } else if (e.key === 'Escape') {
            calculator.clear();
        }
        calculator.updateDisplay();
    }
});
