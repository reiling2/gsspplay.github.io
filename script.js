// script.js
// =================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===================
let cardsData = JSON.parse(localStorage.getItem('cashflowCards')) || getDefaultCardsData();
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

// =================== ФУНКЦИИ ===================
function updateHeaderForTab(tabId) {
    if (tabId === 'rules-tab') {
        headerTitle.textContent = 'Cashflow Газстройпром';
        headerSubtitle.textContent = 'Правила настольной финансовой игры с корпоративной механикой';
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="number">195</span>
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
        
        // Загружаем правила
        loadRulesContent();
        
    } else if (tabId === 'cards-tab') {
        headerTitle.textContent = 'Cashflow Газстройпром';
        headerSubtitle.textContent = 'Элементы игры';
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="number">${cardsData.filter(c => c.category === 'roles').length}</span>
                <span class="label">Игровых ролей</span>
            </div>
            <div class="stat-card">
                <span class="number">${cardsData.length}</span>
                <span class="label">Карточек</span>
            </div>
            <div class="stat-card">
                <span class="number">8</span>
                <span class="label">Колод</span>
            </div>
            <div class="stat-card">
                <span class="number">${cardsData.length + 195}</span>
                <span class="label">Всего элементов</span>
            </div>
        `;
        
        initCardsEditor();
    }
}

async function loadRulesContent() {
    // Для Netlify используем этот путь
    try {
        const response = await fetch('/content/rules.html');
        if (response.ok) {
            const html = await response.text();
            document.getElementById('rules-content-placeholder').innerHTML = html;
            return;
        }
    } catch (e) {
        console.log('Попытка 1 не удалась');
    }
    
    // Пробуем другой путь
    try {
        const response = await fetch('content/rules.html');
        if (response.ok) {
            const html = await response.text();
            document.getElementById('rules-content-placeholder').innerHTML = html;
            return;
        }
    } catch (e) {
        console.log('Попытка 2 не удалась');
    }
    
    // Если всё провалилось, показываем базовые правила
    showBasicRules();
}

function showBasicRules() {
    document.getElementById('rules-content-placeholder').innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2><i class="fas fa-book"></i> Правила Cashflow Газстройпром</h2>
            <p>Для полных правил скачайте файл:</p>
            <a href="/content/rules.html" download style="
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: var(--primary);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
            ">
                <i class="fas fa-download"></i> Скачать правила (HTML)
            </a>
        </div>
    `;
}

function initCardsEditor() {
    createFilterButtons();
    renderCards();
    initCardsEventHandlers();
}

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
        // Считаем количество карточек для этой категории
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

function renderCards() {
    console.log('Всего карточек:', cardsData.length);
    console.log('Карточки образования:', cardsData.filter(card => card.category === 'education'));
    
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
            card.footer.toLowerCase().includes(searchTerm)
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

// Остальные функции (editCard, deleteCard, initCardsEventHandlers и т.д.)
// ... их нужно перенести из вашего текущего кода ...

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
});