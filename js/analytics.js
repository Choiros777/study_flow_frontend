// js/analytics.js
console.log('📈 analytics.js: Скрипт-оркестратор для аналитики загружен.');

document.addEventListener('DOMContentLoaded', () => {
    // Убедимся, что скрипт работает только на странице аналитики
    if (document.body.id !== 'analytics-page') return;

    console.log('Страница аналитики полностью загружена. Запускаем инициализацию компонентов.');

    const statsPeriodSelect = document.getElementById('statsPeriodSelect');
    const statsTaskTypeSelect = document.getElementById('statsTaskTypeSelect');

    // --- ИНИЦИАЛИЗАЦИЯ И ОБНОВЛЕНИЕ СТАТИСТИКИ ---

    async function updateStats(period = 'week', taskType = 'all') {
        if (typeof checkAuth !== 'function' || !checkAuth()) {
            // Если пользователь не авторизован, можно показать заглушку
            updateStatsUI({ totalTasks: 0, avgEnergy: 0, productivity: '0%', bestDay: '-' });
            return;
        }

        try {
            // Здесь будет логика запроса данных для статистики с бэкенда
            // Пока используем заглушку, чтобы интерфейс работал
            console.log(`Запрос статистики для: период=${period}, тип=${taskType}`);
            
            // Примерные данные-заглушки
            const mockStats = {
                totalTasks: Math.floor(Math.random() * 50) + 10,
                avgEnergy: Math.floor(Math.random() * 30) + 50,
                productivity: `${Math.floor(Math.random() * 40) + 50}%`,
                bestDay: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'][Math.floor(Math.random() * 5)]
            };
            
            updateStatsUI(mockStats);

        } catch (error) {
            console.error('Ошибка при обновлении статистики:', error);
        }
    }

    function updateStatsUI(stats) {
        document.getElementById('totalTasks').textContent = stats.totalTasks;
        document.getElementById('avgEnergy').textContent = stats.avgEnergy;
        document.getElementById('productivity').textContent = stats.productivity;
        document.getElementById('bestDay').textContent = stats.bestDay;
    }

    // Навешиваем обработчики на фильтры статистики
    if (statsPeriodSelect && statsTaskTypeSelect) {
        statsPeriodSelect.addEventListener('change', () => {
            updateStats(statsPeriodSelect.value, statsTaskTypeSelect.value);
        });
        statsTaskTypeSelect.addEventListener('change', () => {
            updateStats(statsPeriodSelect.value, statsTaskTypeSelect.value);
        });
    }

    // --- ОБЩАЯ ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ---

    // Первоначальная загрузка статистики
    updateStats();

    // Скрипты для графиков (barChart.js, lineChart.js и т.д.) 
    // уже подключены в analytics.html и инициализируются самостоятельно,
    // так как у них у каждого есть свой обработчик DOMContentLoaded.
    // Этот файл просто гарантирует, что страница готова.
});