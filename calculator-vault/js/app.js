class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.clear();
        this.secretCode = "1111";
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
                    alert("لا يمكن القسمة على صفر!");
                    this.clear();
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        // Vault check
        if (this.currentOperand === this.secretCode) {
            // This is a special case if we want to trigger on equals
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
const closeVaultBtn = document.getElementById('close-vault');

const calculator = new Calculator(previousOperandElement, currentOperandElement);

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
    // Check for secret code BEFORE computing
    if (calculator.currentOperand === calculator.secretCode) {
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

// Vault Logic
function openVault() {
    calculatorUI.style.transform = "rotateY(180deg) scale(0.8)";
    calculatorUI.style.opacity = "0";
    setTimeout(() => {
        calculatorUI.classList.add('hidden');
        vaultUI.classList.remove('hidden');
        setTimeout(() => {
            vaultUI.classList.add('active');
        }, 50);
    }, 300);
}

function closeVault() {
    vaultUI.classList.remove('active');
    setTimeout(() => {
        vaultUI.classList.add('hidden');
        calculatorUI.classList.remove('hidden');
        calculatorUI.style.transform = "rotateY(0deg) scale(1)";
        calculatorUI.style.opacity = "1";
    }, 500);
}

closeVaultBtn.addEventListener('click', closeVault);

// Keyboard support
document.addEventListener('keydown', e => {
    if ((e.key >= 0 && e.key <= 9) || e.key === '.') {
        calculator.appendNumber(e.key);
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        calculator.chooseOperation(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
        if (calculator.currentOperand === calculator.secretCode) {
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
});
