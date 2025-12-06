// Главный файл для инициализации приложения

// Глобальные переменные для графиков
let energyMapInstance = null;
let lineChart = null;
let barChart = null;
let pieChart = null;

// Константы API
const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// Глобальные переменные для статистики
let taskLists = [];
let allTasks = [];
let analyticsMetrics = null;

// Определяем часовой пояс пользователя
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Флаг для отслеживания инициализации
let appInitialized = false;

console.log('🚀 Main.js загружается');
console.log(`🌍 Часовой пояс пользователя: ${userTimeZone}`);

/* ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==================== */

/**
 * Ищет authManager с нескольких попыток
 */
async function waitForAuthManager(maxAttempts = 10, delay = 500) {
    console.log('🔍 Ожидание загрузки authManager...');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (window.authManager) {
            console.log(`✅ authManager найден на попытке ${attempt}`);

            // Проверяем, что у него есть необходимые методы
            if (typeof window.authManager.isLoggedIn === 'function') {
                console.log('✅ authManager.isLoggedIn() доступен');
                return true;
            }

            // Если authManager есть, но метода нет, ждем еще
            console.log('⚠️ authManager есть, но метод isLoggedIn недоступен');
        }

        if (attempt < maxAttempts) {
            console.log(`⏳ Ожидание authManager (${attempt}/${maxAttempts})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.log(`❌ authManager не найден после ${maxAttempts} попыток`);
    return false;
}

/**
 * Загружает authManager если он не найден
 */
async function loadAuthManager() {
    console.log('📦 Проверка authManager...');

    // Если authManager уже загружен
    if (window.authManager) {
        console.log('✅ authManager уже загружен');
        return true;
    }

    // Пробуем найти скрипт authManager
    const authScripts = [
        './js/auth/authManager.js',
        '/js/auth/authManager.js',
        '/authManager.js',
        './authManager.js',
        '../auth/authManager.js'
    ];

    console.log('🔍 Ищем скрипт authManager...');

    for (const scriptSrc of authScripts) {
        try {
            console.log(`🔍 Проверяем: ${scriptSrc}`);

            // Создаем скрипт
            const script = document.createElement('script');
            script.src = scriptSrc;
            script.type = 'text/javascript';

            // Загружаем скрипт
            await new Promise((resolve, reject) => {
                script.onload = () => {
                    console.log(`✅ Скрипт загружен: ${scriptSrc}`);
                    resolve();
                };
                script.onerror = () => {
                    console.log(`❌ Не удалось загрузить: ${scriptSrc}`);
                    reject();
                };
                document.head.appendChild(script);
            });

            // Даем время на инициализацию
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Проверяем, загрузился ли authManager
            if (window.authManager) {
                console.log('✅ authManager успешно загружен');
                return true;
            }

        } catch (error) {
            // Продолжаем пробовать следующий путь
            console.log(`⏭️ Пропускаем ${scriptSrc}`);
        }
    }

    console.log('❌ Не удалось загрузить authManager');
    return false;
}

/**
 * Проверяет авторизацию пользователя с несколькими стратегиями
 * @returns {boolean} true если пользователь авторизован
 */
function checkAuth() {
    console.log('🔐 Проверка авторизации...');

    // Стратегия 1: Проверка через authManager (если он существует)
    if (window.authManager) {
        console.log('✅ authManager найден');

        if (typeof window.authManager.isLoggedIn === 'function') {
            try {
                const isLoggedIn = window.authManager.isLoggedIn();
                console.log(`📊 authManager.isLoggedIn() = ${isLoggedIn}`);

                if (isLoggedIn) {
                    console.log('✅ Авторизация подтверждена через authManager');
                    return true;
                }
            } catch (error) {
                console.error('❌ Ошибка при вызове authManager.isLoggedIn():', error);
            }
        } else {
            console.warn('⚠️ authManager не имеет метода isLoggedIn');
        }
    } else {
        console.log('ℹ️ authManager не найден');
    }

    // Стратегия 2: Проверка токена в localStorage (fallback для разработки)
    console.log('🔍 Проверяем localStorage на наличие токенов...');
    const possibleTokenKeys = ['auth_token', 'access_token', 'token', 'jwt_token', 'studyflow_token'];

    for (const key of possibleTokenKeys) {
        const token = localStorage.getItem(key);
        if (token) {
            console.log(`✅ Токен найден в localStorage (ключ: ${key})`);

            // Для отладки: выводим первые 20 символов токена
            console.log(`🔐 Токен (первые 20 символов): ${token.substring(0, 20)}...`);

            // Простая проверка JWT токена
            if (token.includes('.')) {
                const parts = token.split('.');
                if (parts.length === 3) {
                    console.log('✅ Токен имеет правильный JWT формат');

                    // Пробуем декодировать payload
                    try {
                        const payload = JSON.parse(atob(parts[1]));
                        console.log('📋 Декодированный payload:', {
                            sub: payload.sub,
                            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'нет'
                        });

                        // Проверяем срок действия
                        if (payload.exp) {
                            const now = Math.floor(Date.now() / 1000);
                            if (payload.exp > now) {
                                console.log('✅ Токен действителен (не истек)');
                                return true;
                            } else {
                                console.warn('⚠️ Токен истек');
                                localStorage.removeItem(key);
                            }
                        } else {
                            console.log('✅ Токен без срока действия, принимаем');
                            return true;
                        }
                    } catch (e) {
                        console.log('✅ Токен в базовом формате, принимаем');
                        return true;
                    }
                }
            } else {
                console.log('✅ Токен найден (не JWT формат)');
                return true;
            }
        }
    }

    // Стратегия 3: Проверка URL параметров (для тестирования)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token') || urlParams.get('auth_token');
    if (tokenFromUrl) {
        console.log('✅ Токен найден в URL параметрах');
        localStorage.setItem('auth_token', tokenFromUrl);
        // Убираем токен из URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
    }

    // Стратегия 4: DEMO режим - для тестирования без авторизации
    const isDemoMode = localStorage.getItem('demo_mode') === 'true' ||
                       urlParams.get('demo') === 'true';

    if (isDemoMode) {
        console.log('🎮 DEMO режим активирован');
        localStorage.setItem('demo_mode', 'true');
        return true;
    }

    // Если все проверки не прошли
    console.log('❌ Пользователь не авторизован');
    return false;
}

/**
 * Показывает сообщение о необходимости авторизации
 */
function showAuthRequiredMessage() {
    console.log('📢 Показываем сообщение об авторизации');

    const containers = ['energyMap', 'lineChart', 'barChart', 'pieChart'];
    const statsContainer = document.querySelector('.stats-container');

    const authMessageHTML = `
        <div class="auth-required-message" style="
            text-align: center;
            padding: 40px 20px;
            color: #666;
            background: #f8f9fa;
            border-radius: 12px;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        ">
            <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
            <h3 style="margin-bottom: 15px; color: #333; font-weight: 700;">
                Требуется авторизация
            </h3>
            <p style="margin-bottom: 25px; line-height: 1.5;">
                Для просмотра статистики и аналитики необходимо войти в систему.
                
                
            </p>
            <div style="display: flex; flex-direction: column; gap: 15px; align-items: center;">
                <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                    <a href="/login.html" style="
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #4169E1;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 700;
                        transition: background-color 0.2s;
                    " onmouseover="this.style.backgroundColor='#3159D1'"
                       onmouseout="this.style.backgroundColor='#4169E1'">
                        Войти в систему
                    </a>
                    <a href="/register.html" style="
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #f0f0f0;
                        color: #333;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 700;
                        transition: background-color 0.2s;
                    " onmouseover="this.style.backgroundColor='#e0e0e0'"
                       onmouseout="this.style.backgroundColor='#f0f0f0'">
                        Зарегистрироваться
                    </a>
                </div>
                
            </div>
        </div>
    `;

    // Показываем сообщение в графиках
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = authMessageHTML;
        }
    });

    // Показываем сообщение в статистике
    if (statsContainer) {
        statsContainer.innerHTML = authMessageHTML;
    }

    // Скрываем элементы управления
    document.querySelectorAll('.filter-select, .chart-controls, .stats-controls, .period-selector').forEach(el => {
        el.style.opacity = '0.3';
        el.style.pointerEvents = 'none';
    });
}

/**
 * Включает DEMO режим для тестирования
 */
window.enableDemoMode = function() {
    console.log('🎮 Включаем DEMO режим...');
    localStorage.setItem('demo_mode', 'true');
    location.reload();
};

/**
 * Получает заголовки авторизации для запросов
 * @returns {Object} Объект с заголовками авторизации
 */
function getAuthHeaders() {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    // Стратегия 1: Получаем заголовки через authManager
    if (window.authManager && typeof window.authManager.getAuthHeaders === 'function') {
        try {
            const authHeaders = window.authManager.getAuthHeaders();
            console.log('📡 Используем заголовки из authManager');
            return { ...headers, ...authHeaders };
        } catch (error) {
            console.error('❌ Ошибка при получении заголовков из authManager:', error);
        }
    }

    // Стратегия 2: Ищем токен в localStorage
    const possibleTokenKeys = ['auth_token', 'access_token', 'token', 'jwt_token', 'studyflow_token'];

    for (const key of possibleTokenKeys) {
        const token = localStorage.getItem(key);
        if (token) {
            console.log(`📡 Используем токен из localStorage (ключ: ${key})`);
            headers['Authorization'] = `Bearer ${token}`;
            return headers;
        }
    }

    // DEMO режим - используем демо-токен
    if (localStorage.getItem('demo_mode') === 'true') {
        console.log('🎮 DEMO режим: используем демо-токен');
        headers['Authorization'] = 'Bearer demo_token_for_testing';
        return headers;
    }

    console.warn('⚠️ Не удалось получить заголовки авторизации');
    return headers;
}

/**
 * Выполняет авторизованный запрос к API
 */
async function makeAuthenticatedRequest(endpoint, options = {}) {
    console.log(`📡 Выполняем запрос: ${endpoint}`);

    // DEMO режим - возвращаем mock данные
    if (localStorage.getItem('demo_mode') === 'true') {
        console.log('🎮 DEMO режим: возвращаем тестовые данные');
        return getMockResponse(endpoint, options);
    }

    // Получаем заголовки авторизации
    const authHeaders = getAuthHeaders();

    // Подготавливаем опции запроса
    const requestOptions = {
        method: options.method || 'GET',
        headers: { ...authHeaders, ...options.headers },
        ...options
    };

    try {
        const response = await fetch(endpoint, requestOptions);

        // Обрабатываем ответ
        if (response.status === 401) {
            console.error('❌ Ошибка 401: Неавторизован');

            // Очищаем токены
            ['auth_token', 'access_token', 'token', 'jwt_token', 'studyflow_token'].forEach(key => {
                localStorage.removeItem(key);
            });

            // Показываем сообщение об авторизации
            showAuthRequiredMessage();
            throw new Error('Authentication required');
        }

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
        }

        console.log(`✅ Запрос выполнен успешно: ${response.status}`);
        return response;

    } catch (error) {
        console.error(`❌ Ошибка при выполнении запроса ${endpoint}:`, error);

        // В DEMO режиме возвращаем mock данные даже при ошибке
        if (localStorage.getItem('demo_mode') === 'true') {
            console.log('🎮 DEMO режим: fallback на mock данные');
            return getMockResponse(endpoint, options);
        }

        throw error;
    }
}

/**
 * Возвращает mock ответ для DEMO режима
 */
function getMockResponse(endpoint, options) {
    console.log(`🎮 Генерируем mock данные для: ${endpoint}`);

    // Имитируем задержку сети
    const delay = Math.random() * 500 + 200;

    return new Promise(resolve => {
        setTimeout(() => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => {
                    if (endpoint.includes('/tasklists/')) {
                        return [
                            { id: 1, name: 'Работа', color: '#4169E1' },
                            { id: 2, name: 'Учеба', color: '#91CC75' },
                            { id: 3, name: 'Личное', color: '#FAC858' },
                            { id: 4, name: 'Спорт', color: '#EE6666' }
                        ];
                    }

                    if (endpoint.includes('/tasks/')) {
                        const tasks = [];
                        const now = new Date();

                        for (let i = 0; i < 50; i++) {
                            const date = new Date();
                            date.setDate(now.getDate() - Math.floor(Math.random() * 30));

                            tasks.push({
                                id: i + 1,
                                title: `Задача ${i + 1}`,
                                description: `Описание задачи ${i + 1}`,
                                is_completed: Math.random() > 0.3,
                                task_list_id: Math.floor(Math.random() * 4) + 1,
                                completed_at: Math.random() > 0.3 ? date.toISOString() : null,
                                created_at: date.toISOString(),
                                due_date: new Date(date.getTime() + 86400000).toISOString()
                            });
                        }
                        return tasks;
                    }

                    if (endpoint.includes('/analytics/metrics')) {
                        const dates = [];
                        const ema_values = [];
                        const tasks_raw = [];

                        const now = new Date();
                        for (let i = 90; i >= 0; i--) {
                            const date = new Date();
                            date.setDate(now.getDate() - i);
                            dates.push(date.toISOString());
                            ema_values.push(Math.random() * 0.5 + 0.2);
                            tasks_raw.push(Math.floor(Math.random() * 8) + 1);
                        }

                        return {
                            dates,
                            ema_values,
                            tasks_raw
                        };
                    }

                    return { message: 'Mock данные для DEMO режима' };
                }
            };

            resolve(mockResponse);
        }, delay);
    });
}

/* ==================== ФУНКЦИИ ДЛЯ РАБОТЫ С ДАТАМИ ==================== */

/**
 * Получает текущую дату в часовом поясе пользователя
 * @returns {Date} Текущая дата в часовом поясе пользователя
 */
function getCurrentDateInUserTimezone() {
    const now = new Date();

    // Преобразуем дату в строку в часовом поясе пользователя
    const dateStr = now.toLocaleString('en-CA', {
        timeZone: userTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    // Парсим строку формата YYYY-MM-DD, HH:MM:SS
    const [datePart, timePart] = dateStr.split(', ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * Конвертирует дату в часовой пояс пользователя
 * @param {Date|string} date - Исходная дата
 * @returns {Date} Дата в часовом поясе пользователя
 */
function convertToUserTimezone(date) {
    if (!date) return null;

    try {
        const dateObj = date instanceof Date ? date : new Date(date);

        // Получаем компоненты даты в часовом поясе пользователя
        const userDateStr = dateObj.toLocaleString('en-CA', {
            timeZone: userTimeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        // Парсим обратно в Date объект
        const [datePart, timePart] = userDateStr.split(', ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);

        return new Date(year, month - 1, day, hours, minutes, seconds);
    } catch (error) {
        console.error('❌ Ошибка конвертации даты:', error, date);
        return date instanceof Date ? date : new Date(date);
    }
}

/**
 * Создает ключ даты в формате YYYY-MM-DD
 * @param {Date|string} date - Дата
 * @returns {string} Строка ключа
 */
function dateKey(date) {
    const userDate = convertToUserTimezone(date);
    const year = userDate.getFullYear();
    const month = String(userDate.getMonth() + 1).padStart(2, '0');
    const day = String(userDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Определяет, находится ли дата в пределах периода
 */
function isDateInPeriod(date, period, now = null) {
    if (!date) return false;

    const checkDate = convertToUserTimezone(new Date(date));
    const currentDate = now || getCurrentDateInUserTimezone();

    if (isNaN(checkDate.getTime())) {
        return false;
    }

    // Нормализуем до начала дня
    const startOfCheckDate = new Date(checkDate);
    startOfCheckDate.setHours(0, 0, 0, 0);

    const startOfCurrentDate = new Date(currentDate);
    startOfCurrentDate.setHours(0, 0, 0, 0);

    // Вычисляем разницу в днях
    const diffTime = startOfCurrentDate - startOfCheckDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    switch (period) {
        case 'week':
            return diffDays >= 0 && diffDays < 7; // Последние 7 дней
        case 'month':
            return diffDays >= 0 && diffDays < 30; // Последние 30 дней
        case 'quarter':
            return diffDays >= 0 && diffDays < 90; // Последние 90 дней
        case 'all':
            return true; // Все время
        default:
            return false;
    }
}

/* ==================== API ФУНКЦИИ ==================== */

/**
 * Загружает списки задач
 */
async function fetchTaskLists() {
    try {
        console.log('📡 Запрашиваем списки задач...');
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/tasklists/`);

        taskLists = await response.json();
        console.log(`✅ Получено списков задач: ${taskLists.length}`);

        // Логируем первые несколько списков для отладки
        if (taskLists.length > 0) {
            console.log('📋 Первые 3 списка задач:', taskLists.slice(0, 3));
        }

        return taskLists;
    } catch (error) {
        console.error('❌ Ошибка при загрузке списков задач:', error);
        return [];
    }
}

/**
 * Загружает все задачи
 */
async function fetchAllTasks() {
    try {
        console.log('📡 Запрашиваем все задачи...');
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/tasks/`);

        allTasks = await response.json();
        console.log(`✅ Получено задач: ${allTasks.length}`);

        // Анализируем структуру данных
        if (allTasks.length > 0) {
            const sampleTask = allTasks[0];
            console.log('🔍 Структура задачи:', Object.keys(sampleTask));

            // Считаем выполненные задачи
            const completedTasks = allTasks.filter(task =>
                task.is_completed === true || task.completed === true
            );
            console.log(`✅ Выполнено задач: ${completedTasks.length}`);

            // Задачи без темы
            const noTopicTasks = allTasks.filter(task =>
                task.task_list_id === 0 ||
                task.list_id === 0 ||
                !task.task_list_id
            );
            console.log(`📝 Задач без темы: ${noTopicTasks.length}`);
        }

        return allTasks;
    } catch (error) {
        console.error('❌ Ошибка при загрузке всех задач:', error);
        return [];
    }
}

/**
 * Загружает аналитику
 */
async function fetchAnalyticsMetrics() {
    try {
        console.log('📡 Запрашиваем аналитику...');
        const response = await makeAuthenticatedRequest(
            `${API_BASE_URL}/analytics/metrics?days_back=90`
        );

        analyticsMetrics = await response.json();
        console.log('✅ Аналитика получена');

        // Логируем структуру данных
        if (analyticsMetrics) {
            console.log('📊 Структура аналитики:', {
                dates: analyticsMetrics.dates?.length || 0,
                ema_values: analyticsMetrics.ema_values?.length || 0,
                tasks_raw: analyticsMetrics.tasks_raw?.length || 0
            });

            if (analyticsMetrics.dates && analyticsMetrics.dates.length > 0) {
                console.log('📅 Диапазон дат:', {
                    first: analyticsMetrics.dates[0],
                    last: analyticsMetrics.dates[analyticsMetrics.dates.length - 1]
                });
            }
        }

        return analyticsMetrics;
    } catch (error) {
        console.error('❌ Ошибка при загрузке аналитики:', error);
        return null;
    }
}

/* ==================== ФУНКЦИИ СТАТИСТИКИ ==================== */

/**
 * Рассчитывает статистику
 */
async function calculateRealStats(period, taskListType) {
    try {
        console.log(`📊 Рассчитываем статистику: период=${period}, тип=${taskListType}`);

        // Проверяем авторизацию
        if (!checkAuth()) {
            console.log('🚫 Пропускаем расчет статистики - пользователь не авторизован');
            return getDefaultStats(period, taskListType);
        }

        // Загружаем данные если нужно
        if (taskLists.length === 0) {
            await fetchTaskLists();
        }
        if (allTasks.length === 0) {
            await fetchAllTasks();
        }
        if (!analyticsMetrics) {
            await fetchAnalyticsMetrics();
        }

        // Фильтруем задачи по типу
        let filteredTasks = filterTasksByType(taskListType);
        console.log(`🔍 Отфильтровано задач: ${filteredTasks.length}`);

        // Фильтруем по периоду
        const now = getCurrentDateInUserTimezone();
        const completedTasks = filteredTasks.filter(task => {
            if (!(task.is_completed === true || task.completed === true)) {
                return false;
            }

            const taskDate = new Date(task.completed_at || task.created_at || task.due_date);
            return isDateInPeriod(taskDate, period, now);
        });

        const allPeriodTasks = filteredTasks.filter(task => {
            const taskDate = new Date(task.created_at || task.due_date || task.completed_at);
            return isDateInPeriod(taskDate, period, now);
        });

        console.log(`📅 За период ${period}: ${allPeriodTasks.length} всего, ${completedTasks.length} выполнено`);

        // Рассчитываем показатели
        const stats = {
            totalTasks: allPeriodTasks.length,
            completedTasks: completedTasks.length,
            avgEnergy: calculateAverageEnergy(period),
            productivity: calculateProductivity(completedTasks, period),
            bestPeriod: findBestPeriod(completedTasks, period),
            bestTasksCount: 0,
            taskListType: taskListType,
            timezone: userTimeZone
        };

        // Для лучшего периода считаем количество задач
        if (stats.bestPeriod && stats.bestPeriod !== '-') {
            stats.bestTasksCount = countTasksInBestPeriod(completedTasks, stats.bestPeriod, period);
        }

        console.log('📊 Рассчитанная статистика:', stats);
        return stats;

    } catch (error) {
        console.error('❌ Ошибка при расчете статистики:', error);
        return getDefaultStats(period, taskListType);
    }
}

/**
 * Фильтрует задачи по типу
 */
function filterTasksByType(taskListType) {
    if (taskListType === 'all') {
        return allTasks;
    }

    if (taskListType === 'no_topic') {
        return allTasks.filter(task =>
            task.task_list_id === 0 ||
            task.list_id === 0 ||
            !task.task_list_id
        );
    }

    // Ищем список по имени
    const list = taskLists.find(list =>
        list.name.toLowerCase() === taskListType.toLowerCase()
    );

    if (!list) {
        console.warn(`⚠️ Список "${taskListType}" не найден, используем все задачи`);
        return allTasks;
    }

    return allTasks.filter(task =>
        task.task_list_id === list.id ||
        task.list_id === list.id ||
        (task.list_name && task.list_name.toLowerCase() === list.name.toLowerCase())
    );
}

/**
 * Рассчитывает среднюю энергию
 */
function calculateAverageEnergy(period) {
    if (!analyticsMetrics || !analyticsMetrics.ema_values || !analyticsMetrics.dates) {
        return 0;
    }

    const now = getCurrentDateInUserTimezone();
    let totalEnergy = 0;
    let count = 0;

    for (let i = 0; i < analyticsMetrics.dates.length; i++) {
        const date = new Date(analyticsMetrics.dates[i]);
        if (isDateInPeriod(date, period, now)) {
            const energy = (1 - (analyticsMetrics.ema_values[i] || 0)) * 100;
            if (!isNaN(energy)) {
                totalEnergy += energy;
                count++;
            }
        }
    }

    return count > 0 ? Math.round(totalEnergy / count) : 0;
}

/**
 * Рассчитывает продуктивность
 */
function calculateProductivity(completedTasks, period) {
    if (completedTasks.length === 0) return 0;

    const maxTasksPerDay = 10;
    const now = getCurrentDateInUserTimezone();

    // Группируем задачи по дням
    const tasksByDay = {};
    completedTasks.forEach(task => {
        const taskDate = new Date(task.completed_at || task.created_at || task.due_date);
        const key = dateKey(taskDate);
        tasksByDay[key] = (tasksByDay[key] || 0) + 1;
    });

    // Рассчитываем продуктивность для каждого дня
    let totalProductivity = 0;
    let daysCount = 0;

    // Генерируем все дни в периоде
    const daysInPeriod = getDaysInPeriod(period, now);

    daysInPeriod.forEach(dateKey => {
        const dailyTasks = tasksByDay[dateKey] || 0;
        const productivity = Math.min(100, (dailyTasks / maxTasksPerDay) * 100);
        totalProductivity += productivity;
        daysCount++;
    });

    return daysCount > 0 ? Math.round(totalProductivity / daysCount) : 0;
}

/**
 * Находит лучший период
 */
/**
 * Находит лучший период
 */
function findBestPeriod(completedTasks, period) {
    if (completedTasks.length === 0) return '-';

    const now = getCurrentDateInUserTimezone();

    if (period === 'week') {
        // Лучший день
        const tasksByDay = {};
        completedTasks.forEach(task => {
            const taskDate = new Date(task.completed_at || task.created_at || task.due_date);
            const key = dateKey(taskDate);
            tasksByDay[key] = (tasksByDay[key] || 0) + 1;
        });

        let bestDay = '';
        let maxTasks = 0;

        Object.entries(tasksByDay).forEach(([day, count]) => {
            if (count > maxTasks) {
                maxTasks = count;
                bestDay = day;
            }
        });

        if (bestDay) {
            const date = new Date(bestDay + 'T12:00:00');
            return date.toLocaleDateString('ru-RU', {
                weekday: 'short',
                day: 'numeric'
            });
        }
    } else if (period === 'month') {
        // Лучшая неделя (группируем по неделям)
        const tasksByWeek = {};
        completedTasks.forEach(task => {
            const taskDate = new Date(task.completed_at || task.created_at || task.due_date);
            const weekNumber = getWeekOfMonth(taskDate);
            const key = `Нед${weekNumber}`;
            tasksByWeek[key] = (tasksByWeek[key] || 0) + 1;
        });

        let bestWeek = '';
        let maxTasks = 0;

        Object.entries(tasksByWeek).forEach(([week, count]) => {
            if (count > maxTasks) {
                maxTasks = count;
                bestWeek = week;
            }
        });

        if (bestWeek) {
            return bestWeek;
        }
    } else if (period === 'quarter') {
        // Лучший месяц (группируем по месяцам)
        const tasksByMonth = {};
        completedTasks.forEach(task => {
            const taskDate = new Date(task.completed_at || task.created_at || task.due_date);
            const monthName = getMonthShortName(taskDate);
            tasksByMonth[monthName] = (tasksByMonth[monthName] || 0) + 1;
        });

        let bestMonth = '';
        let maxTasks = 0;

        Object.entries(tasksByMonth).forEach(([month, count]) => {
            if (count > maxTasks) {
                maxTasks = count;
                bestMonth = month;
            }
        });

        if (bestMonth) {
            return bestMonth;
        }
    }

    return '-';
}

/**
 * Получает номер недели в месяце
 */
function getWeekOfMonth(date) {
    const userDate = convertToUserTimezone(date);
    const firstDay = new Date(userDate.getFullYear(), userDate.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay() || 7; // 1 = Понедельник, ..., 7 = Воскресенье

    const adjustedDate = userDate.getDate() + firstDayOfWeek - 1;
    return Math.ceil(adjustedDate / 7);
}

/**
 * Получает сокращенное название месяца на русском
 */
function getMonthShortName(date) {
    const userDate = convertToUserTimezone(date);
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return months[userDate.getMonth()];
}
/**
 * Считает задачи в лучшем периоде
 */
function countTasksInBestPeriod(completedTasks, bestPeriod, period) {
    if (completedTasks.length === 0) return 0;

    if (period === 'week') {
        // Для недели - считаем задачи в лучший день
        const tasksByDay = {};
        completedTasks.forEach(task => {
            const taskDate = new Date(task.completed_at || task.created_at || task.due_date);
            const key = dateKey(taskDate);
            tasksByDay[key] = (tasksByDay[key] || 0) + 1;
        });

        // Находим максимальное количество задач
        return Math.max(...Object.values(tasksByDay), 0);
    } else if (period === 'month') {
        // Для месяца - считаем задачи в лучшей неделе
        const tasksByWeek = {};
        completedTasks.forEach(task => {
            const taskDate = new Date(task.completed_at || task.created_at || task.due_date);
            const weekNumber = getWeekOfMonth(taskDate);
            const key = `Нед${weekNumber}`;
            tasksByWeek[key] = (tasksByWeek[key] || 0) + 1;
        });

        return tasksByWeek[bestPeriod] || 0;
    } else if (period === 'quarter') {
        // Для квартала - считаем задачи в лучшем месяце
        const tasksByMonth = {};
        completedTasks.forEach(task => {
            const taskDate = new Date(task.completed_at || task.created_at || task.due_date);
            const monthName = getMonthShortName(taskDate);
            tasksByMonth[monthName] = (tasksByMonth[monthName] || 0) + 1;
        });

        return tasksByMonth[bestPeriod] || 0;
    }

    return 0;
}

/**
 * Возвращает дни в периоде
 */
function getDaysInPeriod(period, now) {
    const days = [];
    const startDate = new Date(now);

    switch (period) {
        case 'week':
            startDate.setDate(now.getDate() - 6);
            break;
        case 'month':
            startDate.setDate(now.getDate() - 29);
            break;
        case 'quarter':
            startDate.setDate(now.getDate() - 89);
            break;
        default:
            return [];
    }

    const current = new Date(startDate);
    while (current <= now) {
        days.push(dateKey(current));
        current.setDate(current.getDate() + 1);
    }

    return days;
}

/**
 * Возвращает статистику по умолчанию
 */
function getDefaultStats(period, taskListType) {
    // DEMO режим - возвращаем демо статистику
    if (localStorage.getItem('demo_mode') === 'true') {
        const demoStats = {
            'week': { completedTasks: 24, avgEnergy: 75, productivity: 68, bestPeriod: 'Вт, 14', bestTasksCount: 8 },
            'month': { completedTasks: 89, avgEnergy: 72, productivity: 65, bestPeriod: 'Нед2', bestTasksCount: 24 },
            'quarter': { completedTasks: 245, avgEnergy: 70, productivity: 62, bestPeriod: 'Март', bestTasksCount: 89 }
        };

        const stats = demoStats[period] || demoStats.week;

        return {
            totalTasks: stats.completedTasks * 1.3,
            completedTasks: stats.completedTasks,
            avgEnergy: stats.avgEnergy,
            productivity: stats.productivity,
            bestPeriod: stats.bestPeriod,
            bestTasksCount: stats.bestTasksCount,
            taskListType: taskListType,
            timezone: userTimeZone
        };
    }

    // Режим без авторизации
    return {
        totalTasks: 0,
        completedTasks: 0,
        avgEnergy: 0,
        productivity: 0,
        bestPeriod: '-',
        bestTasksCount: 0,
        taskListType: taskListType,
        timezone: userTimeZone
    };
}

/* ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ==================== */

/**
 * Обновляет отображение статистики
 */
async function updateStats(period, taskListType) {
    console.log(`🔄 Обновление статистики: ${period}, ${taskListType}`);

    try {
        // Обновляем селектор типов задач
        updateTaskTypeSelector(taskListType);

        // Получаем статистику
        const stats = await calculateRealStats(period, taskListType);

        // Обновляем элементы интерфейса
        updateStatsUI(stats, period);

        console.log('✅ Статистика обновлена');
    } catch (error) {
        console.error('❌ Ошибка при обновлении статистики:', error);
        showDefaultStats();
    }
}

/**
 * Обновляет селектор типов задач
 */
function updateTaskTypeSelector(selectedType) {
    const taskTypeSelect = document.getElementById('statsTaskTypeSelect');
    if (!taskTypeSelect) return;

    // Создаем базовые опции
    let options = `
        <option value="all">Все задачи</option>
        <option value="no_topic">Без темы</option>
    `;

    // Добавляем списки задач
    if (taskLists.length > 0) {
        options += taskLists.map(list =>
            `<option value="${list.name.toLowerCase()}">${list.name}</option>`
        ).join('');
    }

    taskTypeSelect.innerHTML = options;

    // Устанавливаем выбранное значение
    if (selectedType && taskTypeSelect.querySelector(`option[value="${selectedType}"]`)) {
        taskTypeSelect.value = selectedType;
    } else {
        taskTypeSelect.value = 'all';
    }
}

/**
 * Обновляет UI статистики
 */
function updateStatsUI(stats, period) {
    // Обновляем цифры
    const totalTasksEl = document.getElementById('totalTasks');
    const avgEnergyEl = document.getElementById('avgEnergy');
    const productivityEl = document.getElementById('productivity');
    const bestDayEl = document.getElementById('bestDay');

    if (totalTasksEl) totalTasksEl.textContent = stats.completedTasks;
    if (avgEnergyEl) avgEnergyEl.textContent = stats.avgEnergy;
    if (productivityEl) productivityEl.textContent = stats.productivity + '%';

    if (bestDayEl) {
        // Обновляем заголовок в зависимости от периода
        let label = 'Лучший день';
        if (period === 'month') label = 'Лучшая неделя';
        else if (period === 'quarter') label = 'Лучший месяц';

        const labelEl = bestDayEl.parentElement.querySelector('.stat-label');
        if (labelEl) labelEl.textContent = label;

        // Обновляем значение
        bestDayEl.textContent = stats.bestPeriod;

        // Обновляем количество задач
        const countEl = bestDayEl.parentElement.querySelector('.stat-count');
        if (countEl) {
            countEl.textContent = stats.bestTasksCount > 0
                ? `${stats.bestTasksCount} задач`
                : '';
        }
    }

    // Показываем элементы управления если они были скрыты
    document.querySelectorAll('.filter-select, .chart-controls, .stats-controls, .period-selector').forEach(el => {
        el.style.opacity = '';
        el.style.pointerEvents = '';
    });
}

/**
 * Показывает статистику по умолчанию
 */
function showDefaultStats() {
    const elements = {
        totalTasks: document.getElementById('totalTasks'),
        avgEnergy: document.getElementById('avgEnergy'),
        productivity: document.getElementById('productivity'),
        bestDay: document.getElementById('bestDay')
    };

    if (elements.totalTasks) elements.totalTasks.textContent = '0';
    if (elements.avgEnergy) elements.avgEnergy.textContent = '0';
    if (elements.productivity) elements.productivity.textContent = '0%';
    if (elements.bestDay) elements.bestDay.textContent = '-';
}

/* ==================== ЗАГРУЗКА СКРИПТОВ ==================== */

/**
 * Загружает все необходимые скрипты
 */
function loadAllScripts() {
    console.log('📦 Загрузка скриптов...');

    // Загружаем tooltip.js
    const tooltipScript = document.createElement('script');
    tooltipScript.src = './js/charts/tooltip.js';
    tooltipScript.onload = function() {
        console.log('✅ TooltipSystem загружен');
        loadEnergyMapScript();
        setTimeout(loadECharts, 100);
    };
    tooltipScript.onerror = function() {
        console.warn('⚠️ tooltip.js не найден, продолжаем без него');
        loadEnergyMapScript();
        setTimeout(loadECharts, 100);
    };
    document.head.appendChild(tooltipScript);
}

/**
 * Загружает скрипт EnergyMap
 */
function loadEnergyMapScript() {
    console.log('🌐 Загрузка EnergyMap...');

    if (document.querySelector('script[src*="energyMap"]')) {
        console.log('ℹ️ EnergyMap уже загружается');
        return;
    }

    const script = document.createElement('script');
    script.src = '/study_flow_frontend/Analitics/js/charts/energyMap.js';
    script.onload = function() {
        console.log('✅ EnergyMap загружен');
        setTimeout(() => {
            if (typeof window.EnergyMap !== 'undefined') {
                initEnergyMap();
            }
        }, 100);
    };
    script.onerror = function() {
        console.error('❌ Ошибка загрузки EnergyMap');
    };
    document.head.appendChild(script);
}

/**
 * Загружает ECharts
 */
function loadECharts() {
    if (typeof echarts !== 'undefined') {
        console.log('✅ ECharts уже загружен');
        initCharts();
        return;
    }

    console.log('📊 Загрузка ECharts...');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = function() {
        console.log('✅ ECharts загружен');
        setTimeout(initCharts, 100);
    };
    script.onerror = function() {
        console.error('❌ Не удалось загрузить ECharts');
        showEChartsError();
    };
    document.head.appendChild(script);
}

/**
 * Показывает ошибку загрузки ECharts
 */
function showEChartsError() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        container.innerHTML = `
            <div style="color: #666; text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
                <div style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">
                    Ошибка загрузки графиков
                </div>
                <div style="font-size: 14px;">
                    Пожалуйста, проверьте подключение к интернету
                </div>
            </div>
        `;
    });
}

/* ==================== ИНИЦИАЛИЗАЦИЯ ГРАФИКОВ ==================== */

/**
 * Инициализирует все графики
 */
function initCharts() {
    if (typeof echarts === 'undefined') {
        console.log('⏳ Ожидаем загрузку ECharts...');
        setTimeout(initCharts, 500);
        return;
    }

    console.log('🎨 Инициализация всех графиков...');

    try {
        // Инициализируем графики только если пользователь авторизован или в DEMO режиме
        if (checkAuth() || localStorage.getItem('demo_mode') === 'true') {
            console.log('✅ Пользователь авторизован, инициализируем графики');

            // Инициализируем BarChart если контейнер есть
            const barChartContainer = document.getElementById('barChart');
            if (barChartContainer) {
                try {
                    window.barChart = echarts.init(barChartContainer);
                    console.log('✅ BarChart инициализирован');

                    // Запускаем обновление данных
                    if (typeof window.updateBarChart === 'function') {
                        window.updateBarChart('week');
                    }
                } catch (error) {
                    console.error('❌ Ошибка инициализации BarChart:', error);
                }
            }

            // Инициализируем LineChart если контейнер есть
            const lineChartContainer = document.getElementById('lineChart');
            if (lineChartContainer) {
                try {
                    window.lineChart = echarts.init(lineChartContainer);
                    console.log('✅ LineChart инициализирован');

                    if (typeof window.updateLineChart === 'function') {
                        window.updateLineChart('week');
                    }
                } catch (error) {
                    console.error('❌ Ошибка инициализации LineChart:', error);
                }
            }

            // Инициализируем PieChart если контейнер есть
            const pieChartContainer = document.getElementById('pieChart');
            if (pieChartContainer) {
                try {
                    window.pieChart = echarts.init(pieChartContainer);
                    console.log('✅ PieChart инициализирован');

                    if (typeof window.updatePieChart === 'function') {
                        window.updatePieChart('all');
                    }
                } catch (error) {
                    console.error('❌ Ошибка инициализации PieChart:', error);
                }
            }

            // Инициализируем EnergyMap
            setTimeout(() => {
                if (typeof window.EnergyMap !== 'undefined') {
                    initEnergyMap();
                }
            }, 500);

        } else {
            console.log('🚫 Пользователь не авторизован, пропускаем инициализацию графиков');
            showAuthRequiredMessage();
        }

        console.log('✅ Все графики инициализированы');

        // Настраиваем ресайз
        setTimeout(() => {
            handleResize();
            setTimeout(handleResize, 500);
        }, 300);

        // Обновляем статистику
        updateStats('week', 'all');

    } catch (error) {
        console.error('❌ Ошибка инициализации графиков:', error);
    }
}

/**
 * Инициализирует EnergyMap
 */
function initEnergyMap() {
    console.log('🗺️ Инициализация EnergyMap...');

    const container = document.getElementById('energyMap');
    if (!container) {
        console.error('❌ EnergyMap: контейнер не найден');
        return;
    }

    if (typeof window.EnergyMap === 'undefined') {
        console.error('❌ EnergyMap: класс не загружен');
        return;
    }

    try {
        energyMapInstance = new window.EnergyMap('energyMap');
        window.energyMapInstance = energyMapInstance;
        console.log('✅ EnergyMap инициализирован');
    } catch (error) {
        console.error('❌ Ошибка инициализации EnergyMap:', error);
    }
}

/**
 * Обрабатывает изменение размера окна
 */
function handleResize() {
    const charts = [window.barChart, window.lineChart, window.pieChart];

    charts.forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
            try {
                chart.resize();
            } catch (error) {
                console.error('❌ Ошибка ресайза графика:', error);
            }
        }
    });
}

/* ==================== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ==================== */

/**
 * Инициализирует все данные
 */
async function initAllData() {
    console.log('📥 Инициализация данных...');

    try {
        // Проверяем авторизацию
        if (!checkAuth() && localStorage.getItem('demo_mode') !== 'true') {
            console.log('🚫 Пользователь не авторизован и не в DEMO режиме, останавливаем загрузку данных');
            return false;
        }

        console.log('✅ Пользователь авторизован или в DEMO режиме, загружаем данные...');

        // Загружаем данные параллельно для скорости
        const [lists, tasks, analytics] = await Promise.allSettled([
            fetchTaskLists(),
            fetchAllTasks(),
            fetchAnalyticsMetrics()
        ]);

        console.log('📊 Результаты загрузки данных:', {
            taskLists: lists.status === 'fulfilled' ? '✅' : '❌',
            allTasks: tasks.status === 'fulfilled' ? '✅' : '❌',
            analytics: analytics.status === 'fulfilled' ? '✅' : '❌'
        });

        return true;
    } catch (error) {
        console.error('❌ Ошибка инициализации данных:', error);
        return false;
    }
}

/**
 * Настраивает обработчики событий
 */
function setupEventHandlers() {
    console.log('🎮 Настройка обработчиков событий...');

    // Селекторы статистики
    const statsPeriodSelect = document.getElementById('statsPeriodSelect');
    const statsTaskTypeSelect = document.getElementById('statsTaskTypeSelect');

    if (statsPeriodSelect && statsTaskTypeSelect) {
        statsPeriodSelect.addEventListener('change', function() {
            updateStats(this.value, statsTaskTypeSelect.value);
        });

        statsTaskTypeSelect.addEventListener('change', function() {
            updateStats(statsPeriodSelect.value, this.value);
        });

        console.log('✅ Обработчики статистики настроены');
    }

    // Обработчик ресайза
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 300);
    });

    // Обработчик для проверки authManager
    window.addEventListener('load', () => {
        console.log('📄 Страница полностью загружена');
        console.log('🔍 Проверка authManager:', window.authManager ? '✅ найден' : '❌ не найден');

        // Если authManager появился позже, обновляем статистику
        if (window.authManager && checkAuth()) {
            console.log('🔄 authManager загружен, обновляем данные...');
            updateStats('week', 'all');
        }
    });
}

/**
 * Основная функция инициализации приложения
 */
async function initializeApp() {
    if (appInitialized) {
        console.log('⚠️ Приложение уже инициализировано');
        return;
    }

    console.log('🚀 Инициализация приложения...');
    appInitialized = true;

    // Ждем немного чтобы другие скрипты успели загрузиться
    await new Promise(resolve => setTimeout(resolve, 500));

    // Пробуем найти или загрузить authManager
    const authManagerLoaded = await loadAuthManager();
    if (!authManagerLoaded) {
        console.log('⚠️ authManager не загружен, продолжаем без него');
    }

    // Сначала проверяем авторизацию
    const isAuthenticated = checkAuth();
    console.log(`🔐 Статус авторизации: ${isAuthenticated ? '✅ авторизован' : '❌ не авторизован'}`);

    if (!isAuthenticated && localStorage.getItem('demo_mode') !== 'true') {
        console.log('🔐 Требуется авторизация, показываем сообщение...');
        showAuthRequiredMessage();

        // Все равно настраиваем обработчики, но не загружаем данные
        setupEventHandlers();

        // Ждем и проверяем снова через 2 секунды (на случай если токен появится)
        setTimeout(async () => {
            if (checkAuth()) {
                console.log('🔄 Авторизация появилась, продолжаем инициализацию...');
                await continueInitialization();
            }
        }, 2000);

        return;
    }

    // Продолжаем инициализацию
    await continueInitialization();
}

/**
 * Продолжает инициализацию после проверки авторизации
 */
async function continueInitialization() {
    console.log('🔄 Продолжение инициализации...');

    // Восстанавливаем тему
    const savedTheme = localStorage.getItem('studyflow-theme');
    if (savedTheme && typeof changeTheme === 'function') {
        changeTheme(savedTheme);
    }

    // Инициализируем данные
    await initAllData();

    // Настраиваем обработчики
    setupEventHandlers();

    // Загружаем скрипты графиков
    loadAllScripts();

    // Устанавливаем текущий месяц в селекторе
    if (typeof StudyFlowData !== 'undefined' && StudyFlowData.getCurrentMonth) {
        const currentMonth = StudyFlowData.getCurrentMonth();
        const monthSelect = document.querySelector('.chart-item:nth-child(2) .filter-select');
        if (monthSelect) {
            monthSelect.value = currentMonth;
        }
    }

    console.log('✅ Приложение инициализировано');
}

/* ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==================== */

// Функция для обновления всех графиков
window.refreshAllCharts = function() {
    console.log('🔄 Обновление всех графиков...');

    if (window.barChart && typeof window.updateBarChart === 'function') {
        window.updateBarChart('week');
    }
    if (window.lineChart && typeof window.updateLineChart === 'function') {
        window.updateLineChart('week');
    }
    if (window.pieChart && typeof window.updatePieChart === 'function') {
        window.updatePieChart('all');
    }
    if (window.energyMapInstance && typeof window.updateEnergyMap === 'function') {
        window.updateEnergyMap(StudyFlowData?.getCurrentMonth?.() || 'march');
    }

    updateStats('week', 'all');
    setTimeout(handleResize, 200);
};

// Функции для темы и меню (fallback)
window.changeTheme = typeof changeTheme !== 'undefined' ? changeTheme : function(theme) {
    console.log('🎨 Изменение темы:', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('studyflow-theme', theme);
};

window.toggleMobileMenu = typeof toggleMobileMenu !== 'undefined' ? toggleMobileMenu : function() {
    console.log('📱 Переключение мобильного меню');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
    }
};

window.closeMobileMenu = typeof closeMobileMenu !== 'undefined' ? closeMobileMenu : function() {
    console.log('📱 Закрытие мобильного меню');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
    }
};

// Экспортируем основные функции
window.calculateRealStats = calculateRealStats;
window.updateStats = updateStats;
window.loadAllScripts = loadAllScripts;
window.checkAuth = checkAuth;
window.getAuthHeaders = getAuthHeaders;

/* ==================== ЗАПУСК ПРИЛОЖЕНИЯ ==================== */

// Ждем полной загрузки страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM загружен, запускаем инициализацию...');
        setTimeout(initializeApp, 300);
    });
} else {
    // DOM уже загружен
    console.log('📄 DOM уже загружен, запускаем инициализацию...');
    setTimeout(initializeApp, 500);
}

// Глобальный обработчик ошибок
window.addEventListener('error', function(e) {
    console.error('🌍 Глобальная ошибка:', e.message, e.filename, e.lineno);
});

console.log('✅ Main.js полностью загружен и готов к работе');
