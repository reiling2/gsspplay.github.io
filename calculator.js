// calculator.js - Исправленная версия (без истории, с компанией)
// =================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===================
let currentRole = null;
let playerData = {
    cash: 0,
    salary: 0,
    expenses: 0,
    assets: [],
    liabilities: []
};

let companyData = {
    profit: 1000000, // 1 000 000 ₽ старт
    profitHistory: []
};

// =================== ИНИЦИАЛИЗАЦИЯ ===================
document.addEventListener('DOMContentLoaded', function() {
    initCalculator();
    loadFromLocalStorage();
    updateDisplay();
});

function initCalculator() {
    // Заполняем выбор ролей
    populateRoleSelect();
    
    // Обработчики выбора роли
    document.getElementById('roleSelect').addEventListener('change', function(e) {
        if (e.target.value) {
            selectRole(parseInt(e.target.value));
        }
    });
    
    document.getElementById('randomRoleBtn').addEventListener('click', selectRandomRole);
    
    // Обработчики управления наличными
    document.querySelectorAll('[data-action]').forEach(btn => {
        if (btn.dataset.action.includes('cash')) {
            btn.addEventListener('click', function() {
                handleCashAction(this.dataset.action);
            });
        }
    });
    
    // Кнопки добавления активов/пассивов из списка
    document.getElementById('addAssetBtn').addEventListener('click', () => showAssetSelector());
    document.getElementById('addLiabilityBtn').addEventListener('click', () => showLiabilitySelector());
    
    // Быстрые действия
    document.querySelectorAll('.btn-action').forEach(btn => {
        btn.addEventListener('click', function() {
            handleQuickAction(this.dataset.action);
        });
    });
    
    // Событие компании
    document.getElementById('companyEventBtn').addEventListener('click', applyCompanyEvent);
    
    // Сброс
    document.getElementById('resetCalculator').addEventListener('click', resetCalculator);
    
    // Копирование URL
    document.getElementById('copyUrlBtn').addEventListener('click', copyUrl);
    
    // Обновляем отображение компании
    updateCompanyDisplay();
}

// =================== РАБОТА С РОЛЯМИ ===================
function populateRoleSelect() {
    const select = document.getElementById('roleSelect');
    select.innerHTML = '<option value="">-- Выберите роль --</option>';
    
    const roles = CARDS_DATA.filter(card => card.category === 'roles');
    
    roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.title;
        select.appendChild(option);
    });
}

function selectRole(roleId) {
    const role = CARDS_DATA.find(c => c.id === roleId && c.category === 'roles');
    if (!role) return;
    
    currentRole = role;
    
    const salaryField = role.fields.find(f => f.name === 'Оклад');
    const expensesField = role.fields.find(f => f.name === 'Расходы');
    const cashField = role.fields.find(f => f.name === 'Наличные');
    
    playerData.salary = salaryField ? parseNumber(salaryField.value) : 0;
    playerData.expenses = expensesField ? parseNumber(expensesField.value) : 0;
    playerData.cash = cashField ? parseNumber(cashField.value) : 0;
    playerData.assets = [];
    playerData.liabilities = [];
    
    // Ипотека как пассив
    const mortgageField = role.fields.find(f => f.name === 'Ипотека');
    if (mortgageField) {
        const mortgageAmount = parseNumber(mortgageField.value);
        if (mortgageAmount > 0) {
            playerData.liabilities.push({
                name: 'Ипотека',
                amount: -mortgageAmount,
                monthly: -parseNumber(role.fields.find(f => f.name === 'Ежемесячные платежи')?.value || '0'),
                fromRole: true
            });
        }
    }
    
    // Пассивный доход как актив
    const passiveIncomeField = role.fields.find(f => f.name === 'Пассивный доход');
    if (passiveIncomeField) {
        const passiveIncome = parseNumber(passiveIncomeField.value);
        if (passiveIncome > 0) {
            playerData.assets.push({
                name: 'Пассивный доход',
                amount: 0,
                monthly: passiveIncome,
                fromRole: true
            });
        }
    }
    
    updateDisplay();
    saveToLocalStorage();
}

// =================== ВЫБОР АКТИВОВ/ПАССИВОВ ИЗ СПИСКА ===================
function showAssetSelector() {
    const smallDeals = CARDS_DATA.filter(card => card.category === 'small-deals');
    const bigDeals = CARDS_DATA.filter(card => card.category === 'big-deals');
    
    if (smallDeals.length === 0 && bigDeals.length === 0) {
        alert('Нет доступных активов в базе данных');
        return;
    }
    
    // Создаем модальное окно для выбора
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); z-index: 1000;
        display: flex; justify-content: center; align-items: center;
    `;
    
    let optionsHtml = '<option value="">-- Выберите актив --</option>';
    
    // Добавляем малые сделки
    if (smallDeals.length > 0) {
        optionsHtml += '<optgroup label="Малые сделки">';
        smallDeals.forEach(deal => {
            const costField = deal.fields.find(f => f.name.includes('Стоимость') || f.name.includes('Взнос') || f.name.includes('Цена'));
            const cashflowField = deal.fields.find(f => f.name.includes('Денежный поток') || f.name.includes('Доход') || f.name.includes('Дивиденды'));
            
            const cost = costField ? parseNumber(costField.value) : 0;
            const cashflow = cashflowField ? parseNumber(cashflowField.value) : 0;
            
            optionsHtml += `<option value="${deal.id}" data-cost="${cost}" data-cashflow="${cashflow}">
                ${deal.title} (${formatCurrency(cost)}, доход: ${formatCurrency(cashflow)}/мес)
            </option>`;
        });
        optionsHtml += '</optgroup>';
    }
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%;">
            <h3 style="margin-bottom: 20px; color: var(--primary);">
                <i class="fas fa-handshake"></i> Выберите актив
            </h3>
            <select id="assetSelect" style="width: 100%; padding: 10px; margin-bottom: 20px; font-size: 16px;">
                ${optionsHtml}
            </select>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelAsset" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px;">
                    Отмена
                </button>
                <button id="confirmAsset" style="padding: 10px 20px; background: var(--accent); color: white; border: none; border-radius: 6px;">
                    Добавить актив
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики
    document.getElementById('cancelAsset').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('confirmAsset').addEventListener('click', () => {
        const select = document.getElementById('assetSelect');
        const selectedOption = select.options[select.selectedIndex];
        
        if (selectedOption.value) {
            const cost = parseInt(selectedOption.dataset.cost);
            const cashflow = parseInt(selectedOption.dataset.cashflow);
            const assetName = selectedOption.text.split(' (')[0];
            
            addAsset(assetName, cost, cashflow);
            document.body.removeChild(modal);
        }
    });
}

function showLiabilitySelector() {
    // Создаем список типовых пассивов
    const liabilitiesList = [
        { name: "Ипотека", amount: 1000000, monthly: -10000 },
        { name: "Автокредит", amount: 500000, monthly: -8000 },
        { name: "Потребительский кредит", amount: 200000, monthly: -5000 },
        { name: "Кредит на образование", amount: 300000, monthly: -4000 },
        { name: "Ипотека 2", amount: 1500000, monthly: -15000 }
    ];
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); z-index: 1000;
        display: flex; justify-content: center; align-items: center;
    `;
    
    let optionsHtml = '<option value="">-- Выберите пассив --</option>';
    liabilitiesList.forEach((liability, index) => {
        optionsHtml += `<option value="${index}" data-amount="${liability.amount}" data-monthly="${liability.monthly}">
            ${liability.name} (долг: ${formatCurrency(liability.amount)}, платеж: ${formatCurrency(liability.monthly)}/мес)
        </option>`;
    });
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%;">
            <h3 style="margin-bottom: 20px; color: var(--danger);">
                <i class="fas fa-credit-card"></i> Выберите пассив
            </h3>
            <select id="liabilitySelect" style="width: 100%; padding: 10px; margin-bottom: 20px; font-size: 16px;">
                ${optionsHtml}
            </select>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelLiability" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px;">
                    Отмена
                </button>
                <button id="confirmLiability" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 6px;">
                    Добавить пассив
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики
    document.getElementById('cancelLiability').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('confirmLiability').addEventListener('click', () => {
        const select = document.getElementById('liabilitySelect');
        const selectedOption = select.options[select.selectedIndex];
        
        if (selectedOption.value) {
            const index = parseInt(selectedOption.value);
            const liability = liabilitiesList[index];
            
            addLiability(liability.name, liability.amount, liability.monthly);
            document.body.removeChild(modal);
        }
    });
}

function addAsset(name, amount, monthly) {
    if (playerData.cash < amount) {
        if (!confirm(`У вас только ${formatCurrency(playerData.cash)}. Взять кредит на ${formatCurrency(amount - playerData.cash)}?`)) {
            return;
        }
        const loanAmount = amount - playerData.cash;
        playerData.liabilities.push({
            name: `Кредит на ${name}`,
            amount: -loanAmount,
            monthly: -Math.round(loanAmount * 0.01) // 1% в месяц
        });
        playerData.cash = 0;
    } else {
        playerData.cash -= amount;
    }
    
    playerData.assets.push({
        name: name,
        amount: amount,
        monthly: monthly
    });
    
    updateDisplay();
    saveToLocalStorage();
    showToast(`Добавлен актив "${name}"`, 'success');
}

function addLiability(name, amount, monthly) {
    playerData.cash += amount; // Получаем деньги при взятии кредита
    playerData.liabilities.push({
        name: name,
        amount: -amount,
        monthly: monthly
    });
    
    updateDisplay();
    saveToLocalStorage();
    showToast(`Добавлен пассив "${name}"`, 'success');
}

// =================== КОМПАНИЯ ГАЗСТРОЙПРОМ ===================
function updateCompanyDisplay() {
    document.getElementById('companyProfit').textContent = formatCurrency(companyData.profit);
    
    // Расчет изменения прибыли
    if (companyData.profitHistory.length > 0) {
        const lastProfit = companyData.profitHistory[companyData.profitHistory.length - 1];
        const change = ((companyData.profit - lastProfit) / lastProfit * 100).toFixed(1);
        
        const changeElement = document.getElementById('profitChange');
        changeElement.textContent = (change >= 0 ? '+' : '') + change + '%';
        changeElement.className = change >= 0 ? '' : 'negative';
    }
}

function applyCompanyEvent() {
    // Случайное событие для компании
    const events = [
        { name: "Выигран тендер", change: 0.12 }, // +12%
        { name: "Срыв сроков", change: -0.08 },   // -8%
        { name: "Господдержка", change: 0.15 },   // +15%
        { name: "Санкции", change: -0.10 },       // -10%
        { name: "Новый контракт", change: 0.20 }, // +20%
        { name: "Поломка оборудования", change: -0.05 } // -5%
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    const changeAmount = Math.round(companyData.profit * randomEvent.change);
    
    // Сохраняем предыдущую прибыль в историю
    companyData.profitHistory.push(companyData.profit);
    if (companyData.profitHistory.length > 10) {
        companyData.profitHistory.shift(); // Ограничиваем историю
    }
    
    // Применяем изменение
    companyData.profit += changeAmount;
    
    // Если игрок сотрудник компании, может получить бонус
    if (currentRole && randomEvent.change > 0.1) { // Если рост >10%
        const bonus = Math.round(changeAmount * 0.01); // 1% от роста
        playerData.cash += bonus;
        showToast(`Бонус за успех компании: +${formatCurrency(bonus)}`, 'success');
    }
    
    updateCompanyDisplay();
    saveToLocalStorage();
    showToast(`Событие компании: ${randomEvent.name} (${randomEvent.change > 0 ? '+' : ''}${(randomEvent.change * 100).toFixed(0)}%)`, 'info');
}

// =================== ОСТАЛЬНЫЕ ФУНКЦИИ (упрощенные) ===================
function updateDisplay() {
    document.getElementById('cashAmount').textContent = formatCurrency(playerData.cash);
    
    const cashflow = calculateCashflow();
    document.getElementById('cashflowAmount').textContent = formatCurrency(cashflow, true);
    document.getElementById('cashflowAmount').className = `amount ${cashflow >= 0 ? 'positive' : 'negative'}`;
    
    const netWorth = calculateNetWorth();
    document.getElementById('netWorthAmount').textContent = formatCurrency(netWorth);
    
    // Доходы/расходы
    let totalIncome = playerData.salary;
    playerData.assets.forEach(asset => {
        totalIncome += asset.monthly || 0;
    });
    
    let totalExpenses = playerData.expenses;
    playerData.liabilities.forEach(liability => {
        totalExpenses += Math.abs(liability.monthly || 0);
    });
    
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    
    updateAssetsList();
    updateLiabilitiesList();
    updateCompanyDisplay();
    checkRatRaceExit();
}

function updateAssetsList() {
    const list = document.getElementById('assetsList');
    list.innerHTML = '';
    
    if (playerData.assets.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--gray);">Нет активов</div>';
        return;
    }
    
    playerData.assets.forEach((asset, index) => {
        const item = document.createElement('div');
        item.className = 'item-card';
        item.innerHTML = `
            <div>
                <div class="item-name">${asset.name}</div>
                <div class="item-info">
                    ${asset.amount ? `Стоимость: ${formatCurrency(asset.amount)}<br>` : ''}
                    Доход: <span class="item-amount positive">+${formatCurrency(asset.monthly || 0)}/мес</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-icon btn-small" onclick="sellAsset(${index})" title="Продать">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

function updateLiabilitiesList() {
    const list = document.getElementById('liabilitiesList');
    list.innerHTML = '';
    
    if (playerData.liabilities.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--gray);">Нет пассивов</div>';
        return;
    }
    
    playerData.liabilities.forEach((liability, index) => {
        const item = document.createElement('div');
        item.className = 'item-card';
        item.innerHTML = `
            <div>
                <div class="item-name">${liability.name}</div>
                <div class="item-info">
                    ${liability.amount ? `Долг: ${formatCurrency(Math.abs(liability.amount))}<br>` : ''}
                    Платеж: <span class="item-amount negative">${formatCurrency(liability.monthly || 0)}/мес</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-icon btn-small" onclick="payOffLiability(${index})" title="Погасить">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

// Глобальные функции для кнопок
window.sellAsset = function(index) {
    const asset = playerData.assets[index];
    const salePrice = asset.amount || Math.round(asset.monthly * 200);
    
    if (confirm(`Продать "${asset.name}" за ${formatCurrency(salePrice)}?`)) {
        playerData.cash += salePrice;
        playerData.assets.splice(index, 1);
        updateDisplay();
        saveToLocalStorage();
        showToast(`Актив продан: +${formatCurrency(salePrice)}`, 'success');
    }
};

window.payOffLiability = function(index) {
    const liability = playerData.liabilities[index];
    const payoffAmount = Math.abs(liability.amount || 0);
    
    if (payoffAmount === 0) {
        playerData.liabilities.splice(index, 1);
        showToast(`Пассив "${liability.name}" удален`, 'success');
    } else if (playerData.cash >= payoffAmount) {
        if (confirm(`Погасить "${liability.name}" за ${formatCurrency(payoffAmount)}?`)) {
            playerData.cash -= payoffAmount;
            playerData.liabilities.splice(index, 1);
            showToast(`Пассив погашен: -${formatCurrency(payoffAmount)}`, 'success');
        } else {
            return;
        }
    } else {
        showToast(`Недостаточно средств. Нужно: ${formatCurrency(payoffAmount)}`, 'error');
        return;
    }
    
    updateDisplay();
    saveToLocalStorage();
};

// Утилиты
function formatCurrency(amount, showMonthly = false) {
    const formatted = Math.abs(amount).toLocaleString('ru-RU') + ' ₽';
    const sign = amount >= 0 ? '+' : '-';
    const monthly = showMonthly ? '/мес' : '';
    return `${sign}${formatted}${monthly}`;
}

function parseNumber(str) {
    if (typeof str === 'number') return str;
    return parseInt(str.replace(/\s+/g, '').replace('₽', '')) || 0;
}

function calculateCashflow() {
    let totalIncome = playerData.salary;
    let totalExpenses = playerData.expenses;
    
    playerData.assets.forEach(asset => {
        totalIncome += asset.monthly || 0;
    });
    
    playerData.liabilities.forEach(liability => {
        totalExpenses += Math.abs(liability.monthly || 0);
    });
    
    return totalIncome - totalExpenses;
}

function calculateNetWorth() {
    let netWorth = playerData.cash;
    playerData.assets.forEach(asset => netWorth += asset.amount || 0);
    playerData.liabilities.forEach(liability => netWorth += liability.amount || 0);
    return netWorth;
}

function checkRatRaceExit() {
    const cashflow = calculateCashflow();
    if (cashflow > 0 && !document.getElementById('ratRaceAlert')) {
        const alert = document.createElement('div');
        alert.id = 'ratRaceAlert';
        alert.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: var(--accent); color: white; padding: 15px 25px;
            border-radius: 8px; z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: fadeIn 0.5s;
        `;
        alert.innerHTML = `
            <i class="fas fa-trophy"></i>
            <strong>Поздравляем!</strong> Вы вышли из крысиных бегов! Денежный поток: ${formatCurrency(cashflow, true)}
        `;
        document.body.appendChild(alert);
        setTimeout(() => document.body.removeChild(alert), 5000);
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = 'toast ' + type;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

function saveToLocalStorage() {
    const data = {
        role: currentRole ? currentRole.id : null,
        playerData: playerData,
        companyData: companyData
    };
    localStorage.setItem('cashflowCalculator', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('cashflowCalculator');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.role) {
                document.getElementById('roleSelect').value = data.role;
                selectRole(data.role);
            }
            if (data.playerData) playerData = data.playerData;
            if (data.companyData) companyData = data.companyData;
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }
}

function resetCalculator() {
    if (confirm('Сбросить все данные калькулятора?')) {
        playerData = { cash: 0, salary: 0, expenses: 0, assets: [], liabilities: [] };
        companyData = { profit: 1000000, profitHistory: [] };
        currentRole = null;
        document.getElementById('roleSelect').value = '';
        localStorage.removeItem('cashflowCalculator');
        updateDisplay();
        showToast('Калькулятор сброшен', 'success');
    }
}