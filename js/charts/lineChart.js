// js/charts/lineChart.js
console.log('📈 lineChart.js загружается');

document.addEventListener('DOMContentLoaded', () => {
    const lineChartContainer = document.getElementById('lineChart');
    if (!lineChartContainer) return;

    let lineChart = null;

    const API_METRICS_URL = "/analytics/metrics?days_back=90";

    function processData(metrics, period) {
        if (!metrics || !metrics.tasks_raw) {
            return { labels: [], values: [] };
        }

        const tasks_raw = metrics.tasks_raw.slice(-90);
        let labels = [];
        let values = [];

        if (period === 'week') {
            labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
            values = tasks_raw.slice(-7);
        } else if (period === 'month') {
            labels = ['Нед 1', 'Нед 2', 'Нед 3', 'Нед 4'];
            for (let i = 0; i < 4; i++) {
                const weekTasks = tasks_raw.slice(i * 7, (i + 1) * 7);
                values.push(weekTasks.reduce((a, b) => a + b, 0));
            }
        } else if (period === 'quarter') {
            labels = ['Мес 1', 'Мес 2', 'Мес 3'];
            for (let i = 0; i < 3; i++) {
                const monthTasks = tasks_raw.slice(i * 30, (i + 1) * 30);
                values.push(monthTasks.reduce((a, b) => a + b, 0));
            }
        }
        return { labels, values };
    }

    function renderChart(dataObj) {
        if (!lineChart) return;
        
        const option = {
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: dataObj.labels, boundaryGap: false },
            yAxis: { type: 'value', name: 'Продуктивность' },
            series: [{
                data: dataObj.values,
                type: 'line',
                smooth: true,
                areaStyle: {},
                itemStyle: { color: '#FAC858' },
                areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(250, 200, 88, 0.5)' }, { offset: 1, color: 'rgba(250, 200, 88, 0)' }]) }
            }]
        };
        lineChart.setOption(option, true);
    }
    
    async function updateLineChart(period = 'week') {
        if (!checkAuth()) {
            lineChartContainer.innerHTML = '<div class="chart-loading">Требуется авторизация</div>';
            return;
        }

        try {
            lineChartContainer.innerHTML = '<div class="chart-loading">Загрузка графика...</div>';
            if (!lineChart) lineChart = echarts.init(lineChartContainer);
            
            const response = await makeAuthenticatedRequest(API_METRICS_URL);
            const metrics = await response.json();
            const dataObj = processData(metrics, period);
            
            lineChart.clear();
            renderChart(dataObj);

        } catch (error) {
            console.error("❌ LineChart: Ошибка при загрузке или отрисовке:", error);
            lineChartContainer.innerHTML = '<div class="chart-loading">Ошибка загрузки данных</div>';
        }
    }

    const filterSelect = document.getElementById('lineChartFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => updateLineChart(e.target.value));
    }

    window.addEventListener('resize', () => lineChart && lineChart.resize());

    // Инициализация
    updateLineChart();
});