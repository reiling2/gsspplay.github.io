// script.js - Полная рабочая версия с редактором карточек
// =================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===================
let cardsData = JSON.parse(localStorage.getItem('cashflowCards')) || CARDS_DATA;
let currentFilter = 'all';
let editingCardId = null;

// DOM элементы
const headerTitle = document.getElementById('header-title');
const headerSubtitle = document.getElementById('header-subtitle');
const statsContainer = document.getElementById('stats-container');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');
const cardsContainer = document.getElementById('cardsContainer');
const searchInput = document.getElementById('searchInput');
const filterButtonsContainer = document.getElementById('filter-buttons');

// Модальное окно элементы
const cardModal = document.getElementById('cardModal');
const modalTitle = document.getElementById('modalTitle');
const cardForm = document.getElementById('cardForm');
const cardIdInput = document.getElementById('cardId');
const cardTitleInput = document.getElementById('cardTitle');
const cardTypeInput = document.getElementById('cardType');
const cardCategorySelect = document.getElementById('cardCategory');
const colorClassSelect = document.getElementById('colorClass');
const cardFooterInput = document.getElementById('cardFooter');
const fieldsList = document.getElementById('fieldsList');
const addFieldBtn = document.getElementById('addFieldBtn');
const saveCardBtn = document.getElementById('saveCardBtn');
const deleteCardBtn = document.getElementById('deleteCardBtn');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');

// Toast элементы
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// =================== ОСНОВНЫЕ ФУНКЦИИ ===================

// Обновление шапки для вкладок
function updateHeaderForTab(tabId) {
    if (tabId === 'rules-tab') {
        headerTitle.textContent = 'Cashflow Газстройпром';
        headerSubtitle.textContent = 'Правила настольной финансовой игры с корпоративной механикой';

        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="number">${CARDS_DATA.length + 195}</span>
                <span class="label">Игровых элементов</span>
            </div>
            <div class="stat-card">
                <span class="number">3</span>
                <span class="label">Пути к победе</span>
            </div>
            <div class="stat-card">
                <span class="number">2-6</span>
                <span class="label">Игроков</span>
            </div>
            <div class="stat-card">
                <span class="number">2-3</span>
                <span class="label">Часа игры</span>
            </div>
        `;

    } else if (tabId === 'cards-tab') {
        headerTitle.textContent = 'Cashflow Газстройпром';
        headerSubtitle.textContent = 'Редактор игровых карточек';

        const rolesCount = cardsData.filter(c => c.category === 'roles').length;
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="number">${rolesCount}</span>
                <span class="label">Игровых ролей</span>
            </div>
            <div class="stat-card">
                <span class="number">${cardsData.length}</span>
                <span class="label">Всего карточек</span>
            </div>
            <div class="stat-card">
                <span class="number">8</span>
                <span class="label">Категорий</span>
            </div>
            <div class="stat-card">
                <span class="number">${countAllFields()}</span>
                <span class="label">Всего полей</span>
            </div>
        `;

        initCardsEditor();
    }
}

// Подсчет всех полей во всех карточках
function countAllFields() {
    return cardsData.reduce((total, card) => total + card.fields.length, 0);
}

// Инициализация редактора карточек
function initCardsEditor() {
    createFilterButtons();
    renderCards();
    initModalHandlers();
}

// Создание кнопок фильтров
function createFilterButtons() {
    const filters = [
        { id: 'all', label: 'Все карточки', icon: 'fas fa-layer-group' },
        { id: 'roles', label: 'Роли', icon: 'fas fa-user-tie' },
        { id: 'small-deals', label: 'Малые сделки', icon: 'fas fa-handshake' },
        { id: 'big-deals', label: 'Большие сделки', icon: 'fas fa-chart-line' },
        { id: 'market', label: 'События рынка', icon: 'fas fa-chart-bar' },
        { id: 'corporate', label: 'Корпоративные события', icon: 'fas fa-building' },
        { id: 'personal', label: 'Личные события', icon: 'fas fa-user' },
        { id: 'education', label: 'Образование', icon: 'fas fa-graduation-cap' },
        { id: 'dream', label: 'Мечты', icon: 'fas fa-star' }
    ];

    filterButtonsContainer.innerHTML = '';

    filters.forEach(filter => {
        let count = 0;
        if (filter.id === 'all') {
            count = cardsData.length;
        } else {
            count = cardsData.filter(card => card.category === filter.id).length;
        }

        const button = document.createElement('button');
        button.className = `filter-btn ${filter.id === 'all' ? 'active' : ''}`;
        button.innerHTML = `
            <i class="${filter.icon}"></i>
            <span>${filter.label} (${count})</span>
        `;
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = filter.id;
            renderCards();
        });

        filterButtonsContainer.appendChild(button);
    });
}

// Отображение карточек
function renderCards() {
    // Фильтрация
    let filteredCards = cardsData;
    if (currentFilter !== 'all') {
        filteredCards = cardsData.filter(card => card.category === currentFilter);
    }

    // Поиск
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredCards = filteredCards.filter(card => 
            card.title.toLowerCase().includes(searchTerm) ||
            card.type.toLowerCase().includes(searchTerm) ||
            card.footer.toLowerCase().includes(searchTerm) ||
            card.fields.some(field => 
                field.name.toLowerCase().includes(searchTerm) || 
                field.value.toLowerCase().includes(searchTerm)
            )
        );
    }

    // Группировка по категориям
    const groupedCards = {};
    filteredCards.forEach(card => {
        if (!groupedCards[card.category]) {
            groupedCards[card.category] = [];
        }
        groupedCards[card.category].push(card);
    });

    // Отрисовка
    cardsContainer.innerHTML = '';

    Object.keys(groupedCards).forEach(category => {
        const section = document.createElement('div');
        section.className = 'card-section';

        const categoryNames = {
            'roles': 'Роли',
            'small-deals': 'Малые сделки',
            'big-deals': 'Большие сделки',
            'market': 'События рынка',
            'corporate': 'Корпоративные события',
            'personal': 'Личные события',
            'education': 'Образование',
            'dream': 'Мечты'
        };

        section.innerHTML = `
            <h3 class="section-title">
                <i class="fas fa-folder"></i>
                ${categoryNames[category] || category}
                <span style="font-size: 0.9rem; color: var(--gray); margin-left: 10px;">
                    (${groupedCards[category].length} карточек)
                </span>
            </h3>
            <div class="card-grid" id="grid-${category}"></div>
        `;

        cardsContainer.appendChild(section);

        const grid = document.getElementById(`grid-${category}`);
        groupedCards[category].forEach(card => {
            const cardElement = createCardElement(card);
            grid.appendChild(cardElement);
        });
    });

    // Если нет карточек
    if (filteredCards.length === 0) {
        cardsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                <h3>Карточки не найдены</h3>
                <p>Попробуйте изменить параметры поиска или фильтрации</p>
            </div>
        `;
    }
}

// Создание элемента карточки для отображения
function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card';

    // Определяем цветовую категорию
    let colorClass = '';
    if (card.colorClass) {
        colorClass = `card-${card.colorClass}`;
    } else {
        // Автоматическое определение по категории
        const colorMap = {
            'roles': 'role',
            'small-deals': 'real-estate',
            'big-deals': 'business',
            'market': 'market-pos',
            'corporate': 'corporate',
            'personal': 'personal-neutral',
            'education': 'education-blue',
            'dream': 'dream'
        };
        colorClass = `card-${colorMap[card.category] || 'role'}`;
    }
    div.classList.add(colorClass);

    // Поля карточки
    const fieldsHtml = card.fields.map(field => `
        <div class="card-field">
            <span class="field-name">${field.name}</span>
            <span class="field-value ${field.specialClass || ''}">${field.value}</span>
        </div>
    `).join('');

    div.innerHTML = `
        <div class="card-actions">
            <button class="card-action-btn edit" onclick="editCard(${card.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="card-action-btn delete" onclick="deleteCard(${card.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="card-header">
            <span class="card-id">#${card.id}</span>
            <h3 class="card-title">${card.title}</h3>
            <div class="card-type">
                <i class="fas fa-tag"></i>
                <span>${card.type}</span>
            </div>
        </div>
        <div class="card-content">
            ${fieldsHtml}
        </div>
        <div class="card-footer">
            ${card.footer}
        </div>
    `;

    return div;
}

// =================== ФУНКЦИИ РЕДАКТОРА КАРТОЧЕК ===================

// Редактирование карточки
function editCard(id) {
    const card = cardsData.find(c => c.id === id);
    if (!card) return;
    
    editingCardId = id;
    
    // Заполняем форму данными карточки
    cardIdInput.value = card.id;
    cardTitleInput.value = card.title;
    cardTypeInput.value = card.type;
    cardCategorySelect.value = card.category;
    colorClassSelect.value = card.colorClass || '';
    cardFooterInput.value = card.footer || '';
    
    // Заполняем поля
    fieldsList.innerHTML = '';
    card.fields.forEach((field, index) => {
        addFieldToForm(field.name, field.value, field.specialClass || '', index);
    });
    
    // Обновляем заголовок модального окна
    modalTitle.textContent = 'Редактирование карточки';
    deleteCardBtn.style.display = 'block';
    
    // Показываем модальное окно
    cardModal.classList.add('active');
}

// Удаление карточки
function deleteCard(id) {
    if (!confirm('Вы уверены, что хотите удалить эту карточку?')) return;
    
    cardsData = cardsData.filter(card => card.id !== id);
    saveToLocalStorage();
    renderCards();
    showToast('Карточка удалена', 'success');
}

// Добавление новой карточки
function addNewCard() {
    editingCardId = null;
    
    // Очищаем форму
    cardForm.reset();
    fieldsList.innerHTML = '';
    
    // Устанавливаем значения по умолчанию
    const newId = cardsData.length > 0 ? Math.max(...cardsData.map(c => c.id)) + 1 : 1;
    cardIdInput.value = newId;
    cardCategorySelect.value = 'roles';
    colorClassSelect.value = '';
    
    // Добавляем одно поле по умолчанию
    addFieldToForm('Название поля', 'Значение', '', 0);
    
    // Обновляем заголовок модального окна
    modalTitle.textContent = 'Создание новой карточки';
    deleteCardBtn.style.display = 'none';
    
    // Показываем модальное окно
    cardModal.classList.add('active');
}

// Сохранение карточки
function saveCard() {
    // Собираем данные из формы
    const id = parseInt(cardIdInput.value) || (cardsData.length > 0 ? Math.max(...cardsData.map(c => c.id)) + 1 : 1);
    const title = cardTitleInput.value.trim();
    const type = cardTypeInput.value.trim();
    const category = cardCategorySelect.value;
    const colorClass = colorClassSelect.value || null;
    const footer = cardFooterInput.value.trim();
    
    // Собираем поля
    const fields = [];
    const fieldInputs = fieldsList.querySelectorAll('.field-item');
    
    fieldInputs.forEach(item => {
        const nameInput = item.querySelector('.field-name-input');
        const valueInput = item.querySelector('.field-value-input');
        const classInput = item.querySelector('.field-class-input');
        
        if (nameInput && valueInput) {
            fields.push({
                name: nameInput.value.trim(),
                value: valueInput.value.trim(),
                specialClass: classInput ? classInput.value.trim() : ''
            });
        }
    });
    
    // Проверка обязательных полей
    if (!title || !type || !category || fields.length === 0) {
        showToast('Заполните все обязательные поля', 'error');
        return;
    }
    
    // Создаем объект карточки
    const cardData = {
        id,
        title,
        type,
        category,
        fields,
        footer
    };
    
    if (colorClass) {
        cardData.colorClass = colorClass;
    }
    
    // Обновляем или добавляем карточку
    if (editingCardId !== null) {
        // Редактирование существующей
        const index = cardsData.findIndex(c => c.id === editingCardId);
        if (index !== -1) {
            cardsData[index] = cardData;
        }
    } else {
        // Добавление новой
        cardsData.push(cardData);
    }
    
    // Сохраняем и обновляем отображение
    saveToLocalStorage();
    renderCards();
    createFilterButtons(); // Обновляем счетчики в фильтрах
    
    // Закрываем модальное окно и показываем уведомление
    closeModal();
    showToast(editingCardId !== null ? 'Карточка обновлена' : 'Карточка добавлена', 'success');
}

// Добавление поля в форму
function addFieldToForm(name = '', value = '', cssClass = '', index = 0) {
    const fieldItem = document.createElement('div');
    fieldItem.className = 'field-item';
    fieldItem.innerHTML = `
        <div class="field-header">
            <h4>Поле #${index + 1}</h4>
            <div class="field-actions">
                <button type="button" class="btn btn-small btn-danger remove-field-btn">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Название поля</label>
                <input type="text" class="form-control field-name-input" value="${name}" placeholder="Например: Стоимость">
            </div>
            <div class="form-group">
                <label>Значение</label>
                <input type="text" class="form-control field-value-input" value="${value}" placeholder="Например: 1 000 000 ₽">
            </div>
            <div class="form-group">
                <label>CSS класс (опционально)</label>
                <select class="form-control field-class-input">
                    <option value="">Нет</option>
                    <option value="cashflow-positive" ${cssClass === 'cashflow-positive' ? 'selected' : ''}>cashflow-positive (зеленый)</option>
                    <option value="cashflow-negative" ${cssClass === 'cashflow-negative' ? 'selected' : ''}>cashflow-negative (красный)</option>
                </select>
            </div>
        </div>
    `;
    
    // Обработчик для кнопки удаления поля
    const removeBtn = fieldItem.querySelector('.remove-field-btn');
    removeBtn.addEventListener('click', () => {
        if (fieldsList.children.length > 1) {
            fieldItem.remove();
        } else {
            showToast('Должно быть хотя бы одно поле', 'error');
        }
    });
    
    fieldsList.appendChild(fieldItem);
}

// Инициализация обработчиков модального окна
function initModalHandlers() {
    // Кнопка добавления поля
    addFieldBtn.addEventListener('click', () => {
        addFieldToForm('', '', '', fieldsList.children.length);
    });
    
    // Кнопка сохранения
    saveCardBtn.addEventListener('click', saveCard);
    
    // Кнопка удаления
    deleteCardBtn.addEventListener('click', () => {
        if (editingCardId !== null) {
            deleteCard(editingCardId);
            closeModal();
        }
    });
    
    // Кнопки закрытия
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Закрытие по клику вне окна
    cardModal.addEventListener('click', (e) => {
        if (e.target === cardModal) {
            closeModal();
        }
    });
}

// Закрытие модального окна
function closeModal() {
    cardModal.classList.remove('active');
    editingCardId = null;
}

// Сохранение в LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('cashflowCards', JSON.stringify(cardsData));
}

// Сброс к исходным данным
function resetToDefault() {
    if (confirm('Вы уверены? Все ваши изменения карточек будут удалены.')) {
        localStorage.removeItem('cashflowCards');
        cardsData = CARDS_DATA;
        currentFilter = 'all';
        renderCards();
        createFilterButtons();
        showToast('Данные сброшены к исходным', 'success');
    }
}

// Показать toast-уведомление
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// =================== ИНИЦИАЛИЗАЦИЯ ===================

document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем первую вкладку
    updateHeaderForTab('rules-tab');
    
    // Обработчики вкладок
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            updateHeaderForTab(tabId);
        });
    });
    
    // Обработчик поиска
    searchInput.addEventListener('input', () => {
        renderCards();
    });
    
    // Кнопка добавления карточки
    document.getElementById('addCardBtn').addEventListener('click', addNewCard);
    
    // Кнопка экспорта
    document.getElementById('exportBtn').addEventListener('click', () => {
        const dataStr = JSON.stringify(cardsData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'cashflow-cards.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('Данные экспортированы в JSON', 'success');
    });
    
    // Кнопка сброса
    document.getElementById('resetBtn').addEventListener('click', resetToDefault);
    
    // Инициализация модального окна
    initModalHandlers();
    
    console.log('Cashflow Газстройпром загружен. Редактор карточек готов к работе.');
    function updateHeaderForTab(tabId) {
    if (tabId === 'rules-tab') {
        // ... существующий код для правил (не меняй) ...
        headerTitle.textContent = 'Cashflow Газстройпром';
        headerSubtitle.textContent = 'Правила настольной финансовой игры с корпоративной механикой';
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="number">${CARDS_DATA.length + 195}</span>
                <span class="label">Игровых элементов</span>
            </div>
            <div class="stat-card">
                <span class="number">3</span>
                <span class="label">Пути к победе</span>
            </div>
            <div class="stat-card">
                <span class="number">2-6</span>
                <span class="label">Игроков</span>
            </div>
            <div class="stat-card">
                <span class="number">2-3</span>
                <span class="label">Часа игры</span>
            </div>
        `;
        
    } else if (tabId === 'cards-tab') {
        // ... существующий код для редактора (не меняй) ...
        headerTitle.textContent = 'Cashflow Газстройпром';
        headerSubtitle.textContent = 'Редактор игровых карточек';
        
        const rolesCount = cardsData.filter(c => c.category === 'roles').length;
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="number">${rolesCount}</span>
                <span class="label">Игровых ролей</span>
            </div>
            <div class="stat-card">
                <span class="number">${cardsData.length}</span>
                <span class="label">Всего карточек</span>
            </div>
            <div class="stat-card">
                <span class="number">8</span>
                <span class="label">Категорий</span>
            </div>
            <div class="stat-card">
                <span class="number">${countAllFields()}</span>
                <span class="label">Всего полей</span>
            </div>
        `;
        
        initCardsEditor();
        
    } else if (tabId === 'calculator-tab') {
        // ★ ЭТО НОВЫЙ КОД ДЛЯ КАЛЬКУЛЯТОРА ★
        headerTitle.textContent = 'Cashflow Газстройпром';
        headerSubtitle.textContent = 'Персональный калькулятор игрока';
        
        // Статистика для калькулятора
        const savedData = localStorage.getItem('cashflowCalculator');
        const playerData = savedData ? JSON.parse(savedData).playerData : null;
        
        let cashflow = 0;
        let assetsCount = 0;
        let liabilitiesCount = 0;
        
        if (playerData) {
            cashflow = calculateCashflowForHeader(playerData);
            assetsCount = playerData.assets ? playerData.assets.length : 0;
            liabilitiesCount = playerData.liabilities ? playerData.liabilities.length : 0;
        }
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="number">${playerData ? formatCurrencyShort(cashflow) : '0'}</span>
                <span class="label">Денежный поток</span>
            </div>
            <div class="stat-card">
                <span class="number">${assetsCount}</span>
                <span class="label">Активов</span>
            </div>
            <div class="stat-card">
                <span class="number">${liabilitiesCount}</span>
                <span class="label">Пассивов</span>
            </div>
            <div class="stat-card">
                <span class="number">${playerData && playerData.history ? playerData.history.length : '0'}</span>
                <span class="label">Операций</span>
            </div>
        `;
    }
}

// Вспомогательные функции для калькулятора
function formatCurrencyShort(amount) {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K';
    return amount.toString();
}

function calculateCashflowForHeader(playerData) {
    let income = playerData.salary || 0;
    let expenses = playerData.expenses || 0;
    
    (playerData.assets || []).forEach(asset => {
        income += asset.monthly || 0;
    });
    
    (playerData.liabilities || []).forEach(liability => {
        expenses += Math.abs(liability.monthly || 0);
    });
    
    return income - expenses;
}

console.log('Cashflow Газстройпром загружен. Редактор карточек готов к работе.');
});
