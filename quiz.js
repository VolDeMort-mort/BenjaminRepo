        
        // Базовий клас питання
        class Question {
            constructor(text, type, points) {
                this.text = text;
                this.type = type;
                this.points = points;
                this.userAnswer = null; // Тут зберігається відповідь
            }

            render() {
                return `<div class="question-text">${this.text}</div>`;
            }

            captureAnswer() { }

            checkAnswer() {
                return false;
            }

            getUserAnswer() {
                return this.userAnswer;
            }
        }

        class RadioQuestion extends Question {
            constructor(text, options, correctAnswer, points) {
                super(text, 'radio', points);
                this.options = options;
                this.correctAnswer = correctAnswer;
            }

            render() {
                const shuffled = this.shuffleArray([...this.options]);
                return `
                    ${super.render()}
                    <div class="options">
                        ${shuffled.map((opt, i) => `
                            <label class="option">
                                <input type="radio" name="q${this.id}" value="${opt}" ${this.userAnswer === opt ? 'checked' : ''}>
                                <span>${opt}</span>
                            </label>
                        `).join('')}
                    </div>
                `;
            }

            captureAnswer() {
                const selected = document.querySelector(`input[name="q${this.id}"]:checked`);
                if (selected) {
                    this.userAnswer = selected.value;
                }
            }

            checkAnswer() {
                return this.userAnswer === this.correctAnswer;
            }

            shuffleArray(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            }
        }

        class CheckboxQuestion extends Question {
            constructor(text, options, correctAnswers, points) {
                super(text, 'checkbox', points);
                this.options = options;
                this.correctAnswers = correctAnswers.sort();
            }

            render() {
                const shuffled = this.shuffleArray([...this.options]);
                return `
                    ${super.render()}
                    <div class="options">
                        ${shuffled.map((opt, i) => `
                            <label class="option">
                                <input type="checkbox" name="q${this.id}" value="${opt}" 
                                ${this.userAnswer && this.userAnswer.includes(opt) ? 'checked' : ''}>
                                <span>${opt}</span>
                            </label>
                        `).join('')}
                    </div>
                `;
            }

            captureAnswer() {
                const selected = Array.from(document.querySelectorAll(`input[name="q${this.id}"]:checked`))
                    .map(cb => cb.value)
                    .sort();
                this.userAnswer = selected;
            }

            checkAnswer() {
                if (!this.userAnswer) return false;
                return JSON.stringify(this.userAnswer) === JSON.stringify(this.correctAnswers);
            }

            shuffleArray(array) {
               for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            }
        }

        class SelectQuestion extends Question {
            constructor(text, options, correctAnswer, points) {
                super(text, 'select', points);
                this.options = options;
                this.correctAnswer = correctAnswer;
            }

            render() {
                return `
                    ${super.render()}
                    <select id="select${this.id}">
                        <option value="">-- Оберіть відповідь --</option>
                        ${this.options.map(opt => 
                            `<option value="${opt}" ${this.userAnswer === opt ? 'selected' : ''}>${opt}</option>`
                        ).join('')}
                    </select>
                `;
            }

            captureAnswer() {
                const select = document.getElementById(`select${this.id}`);
                if (select) {
                    this.userAnswer = select.value;
                }
            }

            checkAnswer() {
                return this.userAnswer === this.correctAnswer;
            }
        }

        class CodeQuestion extends Question {
            constructor(text, correctAnswer, points) {
                super(text, 'code', points);
                this.correctAnswer = correctAnswer.toLowerCase().replace(/\s+/g, '');
            }

            render() {
                return `
                    ${super.render()}
                    <textarea id="code${this.id}" placeholder="Напишіть ваш код тут...">${this.userAnswer || ''}</textarea>
                `;
            }

            captureAnswer() {
                const textarea = document.getElementById(`code${this.id}`);
                if (textarea) {
                    this.userAnswer = textarea.value;
                }
            }

            checkAnswer() {
                if (!this.userAnswer) return false;
                const normalized = this.userAnswer.toLowerCase().replace(/\s+/g, '');
                return normalized.includes(this.correctAnswer) || normalized === this.correctAnswer;
            }
        }

        class DragDropQuestion extends Question {
            constructor(text, pairs, points) {
                super(text, 'dragdrop', points);
                this.pairs = pairs;
                this.userAnswers = {};
            }

            render() {
                const items = Object.keys(this.pairs);
                const shuffledItems = this.shuffleArray([...items]);                 
                return `
                    ${super.render()}
                    <div class="drag-drop-container">
                        <div class="drag-items">
                            <strong>Перетягніть елементи:</strong>
                            ${shuffledItems.map(item => `
                                <div class="drag-item" draggable="true" data-item="${item}">
                                    ${item}
                                </div>
                            `).join('')}
                        </div>
                        <div class="drop-zones">
                            ${Object.values(this.pairs).map(zone => `
                                <div>
                                    <div class="drop-zone-label">${zone}</div>
                                    <div class="drop-zone" data-zone="${zone}"></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            setupDragDrop() {
                const dragItems = document.querySelectorAll('.drag-item');
                const dropZones = document.querySelectorAll('.drop-zone');

                dragItems.forEach(item => {
                    item.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', e.target.dataset.item);
                        e.target.classList.add('dragging');
                    });
                    item.addEventListener('dragend', (e) => {
                        e.target.classList.remove('dragging');
                    });
                });

                dropZones.forEach(zone => {
                    zone.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        zone.classList.add('drag-over');
                    });
                    zone.addEventListener('dragleave', () => {
                        zone.classList.remove('drag-over');
                    });
                    zone.addEventListener('drop', (e) => {
                        e.preventDefault();
                        zone.classList.remove('drag-over');
                        const item = e.dataTransfer.getData('text/plain');
                        const draggedElement = document.querySelector(`[data-item="${item}"]`);
                        
                        if (draggedElement && zone.children.length === 0) {
                            zone.appendChild(draggedElement);
                            // Зберігаємо відповідь відразу
                            this.userAnswers[item] = zone.dataset.zone;
                        }
                    });
                });
            }

            captureAnswer() { }

            checkAnswer() {
                let correct = 0;
                for (let item in this.pairs) {
                    if (this.userAnswers[item] === this.pairs[item]) {
                        correct++;
                    }
                }
                return correct === Object.keys(this.pairs).length;
            }
            
            shuffleArray(array) {
               for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            }
        }

        class FillBlankQuestion extends Question {
            constructor(text, template, blanks, points) {
                super(text, 'fillblank', points);
                this.template = template;
                this.blanks = blanks;
                this.userAnswer = []; 
            }

            render() {
                let html = super.render();
                let template = this.template;
                
                this.blanks.forEach((blank, i) => {
                    const val = this.userAnswer[i] || '';
                    template = template.replace('___', `<input type="text" class="blank-input" id="blank${this.id}_${i}" value="${val}" placeholder="...">`);
                });

                html += `<div class="code-editor">${template}</div>`;
                return html;
            }

            captureAnswer() {
                this.userAnswer = [];
                this.blanks.forEach((blank, i) => {
                    const input = document.getElementById(`blank${this.id}_${i}`);
                    if (input) {
                        this.userAnswer[i] = input.value;
                    }
                });
            }

            checkAnswer() {
                let correct = 0;
                this.blanks.forEach((blank, i) => {
                    const val = (this.userAnswer[i] || '').trim().toLowerCase();
                    const answers = [blank.answer.toLowerCase(), ...(blank.alternatives || []).map(a => a.toLowerCase())];
                    if (answers.includes(val)) {
                        correct++;
                    }
                });
                return correct === this.blanks.length;
            }
        }
       
        const questionBank = {
            easy: [
                new RadioQuestion(
                    'Яка різниця між let і const?',
                    ['let можна переприсвоїти, const - ні', 'const швидше за let', 'let глобальна, const локальна', 'Немає різниці'],
                    'let можна переприсвоїти, const - ні',
                    10
                ),
                new RadioQuestion(
                    'Що таке DOM?',
                    ['Document Object Model', 'Data Object Manager', 'Dynamic Object Method', 'Digital Output Module'],
                    'Document Object Model',
                    10
                ),
                new CheckboxQuestion(
                    'Які з наведених є примітивними типами даних в JavaScript?',
                    ['string', 'number', 'array', 'boolean', 'object', 'undefined'],
                    ['string', 'number', 'boolean', 'undefined'],
                    10
                ),
                new SelectQuestion(
                    'Який метод використовується для вибору елемента за ID?',
                    ['getElementById', 'querySelector', 'getElement', 'findById'],
                    'getElementById',
                    10
                ),
                new CodeQuestion(
                    'Напишіть код для виведення "Hello World" у консоль:',
                    'console.log("helloworld")',
                    10
                ),
                new RadioQuestion(
                    'Що поверне typeof null?',
                    ['object', 'null', 'undefined', 'number'],
                    'object',
                    10
                ),
                new CheckboxQuestion(
                    'Які методи масиву змінюють оригінальний масив?',
                    ['push()', 'pop()', 'map()', 'filter()', 'splice()', 'sort()'],
                    ['push()', 'pop()', 'splice()', 'sort()'],
                    10
                ),
                new RadioQuestion(
                    'Яка подія виникає при натисканні на елемент?',
                    ['click', 'press', 'touch', 'select'],
                    'click',
                    10
                ),
                new SelectQuestion(
                    'Який метод додає елемент в кінець масиву?',
                    ['push()', 'pop()', 'shift()', 'unshift()'],
                    'push()',
                    10
                ),
                new RadioQuestion(
                    'Що таке HTML атрибут?',
                    ['Додаткова інформація про елемент', 'Стиль елемента', 'Текст елемента', 'Тип елемента'],
                    'Додаткова інформація про елемент',
                    10
                ),
                new CheckboxQuestion(
                    'Які з цих операторів є операторами порівняння?',
                    ['==', '===', '=', '!=', '!==', '=>'],
                    ['==', '===', '!=', '!=='],
                    10
                ),
                new RadioQuestion(
                    'Як створити функцію в JavaScript?',
                    ['function myFunc() {}', 'func myFunc() {}', 'def myFunc() {}', 'create myFunc() {}'],
                    'function myFunc() {}',
                    10
                ),
                new SelectQuestion(
                    'Який метод перетворює рядок у число?',
                    ['parseInt()', 'toString()', 'toNumber()', 'convert()'],
                    'parseInt()',
                    10
                ),
                new RadioQuestion(
                    'Що таке callback функція?',
                    ['Функція, передана як аргумент іншій функції', 'Функція, що викликає сама себе', 'Функція без параметрів', 'Анонімна функція'],
                    'Функція, передана як аргумент іншій функції',
                    10
                ),
                new CodeQuestion(
                    'Напишіть код для створення масиву з числами 1, 2, 3:',
                    '[1,2,3]',
                    10
                ),
                new RadioQuestion(
                    'Яка подія спрацьовує при зміні значення input?',
                    ['change', 'input', 'modify', 'update'],
                    'change',
                    10
                )
            ],
            medium: [
                new DragDropQuestion(
                    'Зіставте методи DOM з їх описом:',
                    {
                        'querySelector': 'Повертає перший елемент за CSS-селектором',
                        'addEventListener': 'Додає обробник події',
                        'createElement': 'Створює новий HTML елемент'
                    },
                    15
                ),
                new CheckboxQuestion(
                    'Які методи масиву НЕ змінюють оригінальний масив?',
                    ['map()', 'filter()', 'push()', 'concat()', 'reduce()', 'splice()'],
                    ['map()', 'filter()', 'concat()', 'reduce()'],
                    15
                ),
                new FillBlankQuestion(
                    'Заповніть пропуски у коді для створення класу:',
                    'class Person {\n  ___(name, age) {\n    this.name = ___;\n    this.age = age;\n  }\n}',
                    [
                        {answer: 'constructor', alternatives: []},
                        {answer: 'name', alternatives: []}
                    ],
                    15
                ),
                new CodeQuestion(
                    'Напишіть стрілкову функцію, що приймає число x і повертає x * 2:',
                    'x=>x*2',
                    15
                ),
                new RadioQuestion(
                    'Що таке замикання (closure) в JavaScript?',
                    ['Функція з доступом до зовнішньої області видимості', 'Закрита функція', 'Приватний метод', 'Функція без return'],
                    'Функція з доступом до зовнішньої області видимості',
                    15
                ),
                new CheckboxQuestion(
                    'Які з методів Object використовуються для роботи з об\'єктами?',
                    ['Object.keys()', 'Object.values()', 'Object.length()', 'Object.entries()', 'Object.size()', 'Object.assign()'],
                    ['Object.keys()', 'Object.values()', 'Object.entries()', 'Object.assign()'],
                    15
                ),
                new SelectQuestion(
                    'Який метод використовується для видалення останнього елемента масиву?',
                    ['pop()', 'push()', 'shift()', 'unshift()'],
                    'pop()',
                    15
                ),
                new FillBlankQuestion(
                    'Заповніть код для обробки події:',
                    'element.___("click", function(e) {\n  e.___();\n});',
                    [
                        {answer: 'addEventListener', alternatives: []},
                        {answer: 'preventDefault', alternatives: []}
                    ],
                    15
                ),
                new RadioQuestion(
                    'Що таке деструктуризація?',
                    ['Витягування значень з об\'єктів або масивів', 'Видалення властивостей', 'Знищення об\'єкта', 'Об\'єднання об\'єктів'],
                    'Витягування значень з об\'єктів або масивів',
                    15
                ),
                new CodeQuestion(
                    'Напишіть код для отримання всіх елементів з класом "test":',
                    'querySelectorAll(".test")',
                    15
                ),
                new CheckboxQuestion(
                    'Які події пов\'язані з формами?',
                    ['submit', 'reset', 'click', 'change', 'input', 'hover'],
                    ['submit', 'reset', 'change', 'input'],
                    15
                ),
                new RadioQuestion(
                    'Яка різниця між == та ===?',
                    ['=== перевіряє тип і значення, == тільки значення', '== строгіше за ===', 'Немає різниці', '=== для чисел, == для рядків'],
                    '=== перевіряє тип і значення, == тільки значення',
                    15
                ),
                new SelectQuestion(
                    'Який метод об\'єднує всі елементи масиву в рядок?',
                    ['join()', 'concat()', 'merge()', 'combine()'],
                    'join()',
                    15
                ),
                new FillBlankQuestion(
                    'Заповніть код для циклу:',
                    'for (let i = 0; i ___ 10; i___) {\n  console.log(i);\n}',
                    [
                        {answer: '<', alternatives: ['<=']},
                        {answer: '++', alternatives: []}
                    ],
                    15
                ),
                new RadioQuestion(
                    'Що таке event bubbling?',
                    ['Спливання події від дочірнього до батьківського елемента', 'Видалення події', 'Створення події', 'Блокування події'],
                    'Спливання події від дочірнього до батьківського елемента',
                    15
                ),
                new CodeQuestion(
                    'Напишіть код для перевірки, чи масив arr містить елемент 5:',
                    'arr.includes(5)',
                    15
                )
            ],
            hard: [
                new DragDropQuestion(
                    'Зіставте концепції JavaScript з їх призначенням:',
                    {
                        'Promise': 'Асинхронні операції',
                        'Prototype': 'Наслідування об\'єктів',
                        'Closure': 'Збереження області видимості'
                    },
                    20
                ),
                new FillBlankQuestion(
                    'Виправте та заповніть код async/await:',
                    '___ function fetchData() {\n  const response = ___ fetch(url);\n  const data = await response.___();\n  return data;\n}',
                    [
                        {answer: 'async', alternatives: []},
                        {answer: 'await', alternatives: []},
                        {answer: 'json', alternatives: []}
                    ],
                    20
                ),
                new CheckboxQuestion(
                    'Які з цих тверджень про прототипи вірні?',
                    [
                        'Кожен об\'єкт має __proto__',
                        'Прототип використовується для наслідування',
                        'Прототип - це копія об\'єкта',
                        'Методи в прототипі спільні для всіх екземплярів',
                        'Прототип змінює оригінальний клас'
                    ],
                    ['Кожен об\'єкт має __proto__', 'Прототип використовується для наслідування', 'Методи в прототипі спільні для всіх екземплярів'],
                    20
                ),
                new CodeQuestion(
                    'Напишіть код для створення Promise, що резолвиться через 1 секунду:',
                    'newPromise(resolve=>setTimeout(resolve,1000))',
                    20
                ),
                new RadioQuestion(
                    'Що таке делегування подій?',
                    ['Встановлення одного обробника на батьківський елемент для дочірніх', 'Передача події іншому елементу', 'Видалення обробника', 'Клонування події'],
                    'Встановлення одного обробника на батьківський елемент для дочірніх',
                    20
                ),
                new FillBlankQuestion(
                    'Заповніть код для localStorage:',
                    'const data = { name: "John" };\nlocalStorage.___(\'user\', JSON.___(data));\nconst user = JSON.___(localStorage.___("user"));',
                    [
                        {answer: 'setItem', alternatives: []},
                        {answer: 'stringify', alternatives: []},
                        {answer: 'parse', alternatives: []},
                        {answer: 'getItem', alternatives: []}
                    ],
                    20
                ),
                new CheckboxQuestion(
                    'Які методи масивів приймають callback функцію?',
                    ['forEach', 'map', 'filter', 'push', 'reduce', 'sort', 'pop'],
                    ['forEach', 'map', 'filter', 'reduce', 'sort'],
                    20
                ),
                new RadioQuestion(
                    'Що станеться при виклику preventDefault() в обробнику події submit?',
                    ['Форма не відправиться', 'Форма відправиться без перезавантаження', 'Форма очиститься', 'Нічого не станеться'],
                    'Форма не відправиться',
                    20
                ),
                new CodeQuestion(
                    'Напишіть код для деструктуризації об\'єкта {name: "Anna", age: 20}:',
                    '{name,age}',
                    20
                ),
                new SelectQuestion(
                    'Який метод масиву повертає новий масив без зміни оригіналу?',
                    ['map()', 'push()', 'sort()', 'reverse()'],
                    'map()',
                    20
                ),
                new FillBlankQuestion(
                    'Заповніть код класу з наслідуванням:',
                    'class Student ___ Person {\n  constructor(name, age, course) {\n    ___(name, age);\n    this.course = course;\n  }\n}',
                    [
                        {answer: 'extends', alternatives: []},
                        {answer: 'super', alternatives: []}
                    ],
                    20
                ),
                new CheckboxQuestion(
                    'Які властивості об\'єкта Event існують?',
                    ['target', 'currentTarget', 'type', 'value', 'preventDefault', 'stopPropagation'],
                    ['target', 'currentTarget', 'type', 'preventDefault', 'stopPropagation'],
                    20
                ),
                new RadioQuestion(
                    'Що таке hoisting в JavaScript?',
                    ['Підняття оголошень змінних та функцій на початок області видимості', 'Видалення змінних', 'Копіювання змінних', 'Об\'єднання змінних'],
                    'Підняття оголошень змінних та функцій на початок області видимості',
                    20
                ),
                new CodeQuestion(
                    'Напишіть код для фільтрації масиву arr, залишивши тільки парні числа:',
                    'arr.filter(x=>x%2===0)',
                    20
                ),
                new DragDropQuestion(
                    'Зіставте методи валідації форм з їх призначенням:',
                    {
                        'checkValidity()': 'Перевіряє валідність елемента',
                        'setCustomValidity()': 'Встановлює власне повідомлення про помилку',
                        'reportValidity()': 'Показує повідомлення про валідацію'
                    },
                    20
                ),
                new RadioQuestion(
                    'Яка різниця між stopPropagation() та preventDefault()?',
                    ['stopPropagation() зупиняє спливання, preventDefault() скасовує дію', 'preventDefault() зупиняє спливання', 'Обидва роблять те саме', 'stopPropagation() скасовує дію'],
                    'stopPropagation() зупиняє спливання, preventDefault() скасовує дію',
                    20
                )
            ]
        };

        // ========== КЛАС ТЕСТУ ==========
        class Quiz {
            constructor() {
                this.currentQuestionIndex = 0;
                this.questions = [];
                this.score = 0;
                this.correctAnswers = 0;
                this.studentName = '';
                this.studentGroup = '';
                this.level = '';
                this.pointsPerQuestion = 0;
            }

            init() {
                document.getElementById('loginForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });

                document.querySelectorAll('.level-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.startQuiz(e.currentTarget.dataset.level);
                    });
                });
                
                const backBtn = document.getElementById('backToSite');
                if(backBtn) backBtn.addEventListener('click', () => this.backToMenu());

                document.getElementById('prevBtn').addEventListener('click', () => this.prevQuestion());
                document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
                document.getElementById('submitBtn').addEventListener('click', () => this.submitQuiz());
                document.getElementById('retryBtn').addEventListener('click', () => this.retry());
                document.getElementById('viewHistoryBtn').addEventListener('click', () => this.showHistory());
            }

            handleLogin() {
                this.studentName = document.getElementById('name').value;
                this.studentGroup = document.getElementById('group').value;
                document.getElementById('studentName').textContent = this.studentName;
                document.getElementById('studentGroup').textContent = this.studentGroup;
                this.showScreen('levelScreen');
            }

            startQuiz(level) {
                this.level = level;
                this.currentQuestionIndex = 0;
                this.score = 0;
                this.correctAnswers = 0;
                const pointsMap = { easy: 10, medium: 15, hard: 20 };
                this.pointsPerQuestion = pointsMap[level];
                const bank = questionBank[level];

                this.questions = this.getRandomQuestions(bank, 10);
                
                this.questions.forEach((q, i) => {
                    q.id = i; 
                    q.userAnswer = null;
                    if(q.type === 'dragdrop') q.userAnswers = {};
                    if(q.type === 'fillblank') q.userAnswer = [];
                });

                const levelNames = { easy: 'Початковий', medium: 'Середній', hard: 'Складний' };
                document.getElementById('currentLevel').textContent = levelNames[level];
                this.showScreen('quizScreen');
                this.renderQuestion();
                this.updateProgress();
            }

            getRandomQuestions(bank, count) {
                const shuffled = [...bank].sort(() => Math.random() - 0.5);
                return shuffled.slice(0, count);
            }

            renderQuestion() {
                const question = this.questions[this.currentQuestionIndex];
                const container = document.getElementById('questionsContainer');
                
                container.innerHTML = `
                    <div class="question-container">
                        <div class="question-header">
                            <span class="question-number">Питання ${this.currentQuestionIndex + 1}</span>
                            <span style="color: #667eea; font-weight: 600;">${question.points} балів</span>
                        </div>
                        ${question.render()}
                    </div>
                `;

                if (question.type === 'dragdrop') {
                    setTimeout(() => question.setupDragDrop(), 100);
                }

                this.updateButtons();
            }

            updateButtons() {
                const prevBtn = document.getElementById('prevBtn');
                const nextBtn = document.getElementById('nextBtn');
                const submitBtn = document.getElementById('submitBtn');

                prevBtn.style.display = this.currentQuestionIndex === 0 ? 'none' : 'block';
                
                if (this.currentQuestionIndex === this.questions.length - 1) {
                    nextBtn.classList.add('hidden');
                    submitBtn.classList.remove('hidden');
                } else {
                    nextBtn.classList.remove('hidden');
                    submitBtn.classList.add('hidden');
                }
            }

            prevQuestion() {
                this.questions[this.currentQuestionIndex].captureAnswer();
                
                if (this.currentQuestionIndex > 0) {
                    this.currentQuestionIndex--;
                    this.renderQuestion();
                    this.updateProgress();
                }
            }

            nextQuestion() {
                this.questions[this.currentQuestionIndex].captureAnswer();

                if (this.currentQuestionIndex < this.questions.length - 1) {
                    this.currentQuestionIndex++;
                    this.renderQuestion();
                    this.updateProgress();
                }
            }

            updateProgress() {
                const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
                document.getElementById('progressBar').style.width = progress + '%';
                document.getElementById('questionCounter').textContent = 
                    `${this.currentQuestionIndex + 1}/${this.questions.length}`;
            }

            submitQuiz() {
                this.questions[this.currentQuestionIndex].captureAnswer();

                this.score = 0;
                this.correctAnswers = 0;

                this.questions.forEach(question => {
                    if (question.checkAnswer()) {
                        this.score += question.points;
                        this.correctAnswers++;
                    }
                });

                this.showResults();
                this.saveToLocalStorage();
            }

            showResults() {
                document.getElementById('finalScore').textContent = this.score;
                document.getElementById('resultName').textContent = this.studentName;
                document.getElementById('resultGroup').textContent = this.studentGroup;
                document.getElementById('resultLevel').textContent = 
                    this.level === 'easy' ? 'Початковий' : 
                    this.level === 'medium' ? 'Середній' : 'Складний';
                document.getElementById('correctAnswers').textContent = 
                    `${this.correctAnswers}/${this.questions.length}`;
                
                const maxScore = this.questions.length * this.pointsPerQuestion;
                const percentage = Math.round((this.score / maxScore) * 100);
                document.getElementById('percentage').textContent = percentage + '%';

                let grade = '';
                if (percentage >= 90) grade = '⭐⭐⭐⭐⭐ Відмінно!';
                else if (percentage >= 75) grade = '⭐⭐⭐⭐ Добре';
                else if (percentage >= 60) grade = '⭐⭐⭐ Задовільно';
                else grade = '⭐⭐ Потрібно покращити';
                
                document.getElementById('grade').textContent = grade;
                this.showScreen('resultsScreen');
            }

            saveToLocalStorage() {
                const result = {
                    name: this.studentName,
                    group: this.studentGroup,
                    level: this.level,
                    score: this.score,
                    correct: this.correctAnswers,
                    total: this.questions.length,
                    date: new Date().toLocaleString('uk-UA'),
                    maxScore: this.questions.length * this.pointsPerQuestion
                };

                let history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
                history.push(result);
                if (history.length > 10) history = history.slice(-10);
                localStorage.setItem('quizHistory', JSON.stringify(history));
            }

            showHistory() {
                const historyContainer = document.getElementById('historyContainer');
                const historyList = document.getElementById('historyList');
                const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');

                if (history.length === 0) {
                    historyList.innerHTML = '<p style="text-align: center; color: #777;">Історія порожня</p>';
                } else {
                    historyList.innerHTML = history.map((result, i) => `
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                            <strong>${i + 1}. ${result.name}</strong> (${result.group}) - ${result.date}<br>
                            Рівень: ${result.level === 'easy' ? 'Початковий' : result.level === 'medium' ? 'Середній' : 'Складний'}<br>
                            Результат: ${result.score}/${result.maxScore} балів (${result.correct}/${result.total} правильних)
                        </div>
                    `).reverse().join('');
                }
                historyContainer.classList.remove('hidden');
            }

            retry() {
                this.showScreen('levelScreen');
            }

            backToMenu(){
                window.location.href = 'index.html';
            }

            showScreen(screenId) {
                ['loginScreen', 'levelScreen', 'quizScreen', 'resultsScreen'].forEach(id => {
                    document.getElementById(id).classList.add('hidden');
                });
                document.getElementById(screenId).classList.remove('hidden');
            }
        }

        const quiz = new Quiz();
        quiz.init();