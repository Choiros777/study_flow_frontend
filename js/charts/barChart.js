// js/charts/barChart.js
console.log('📊 barChart.js загружается');

document.addEventListener('DOMContentLoaded', () => {
    const barChartContainer = document.getElementById('barChart');
    if (!barChartContainer) return;

    let barChart = null;
    const API_METRICS_URL = "/analytics/metrics?days_back=90";

    function processData(metrics, period) {
        if (!metrics || !metrics.tasks_raw || !metrics.ema_values) {
            return { days: [], tasks: [], energy: [] };
        }

        const tasks_raw = metrics.tasks_raw.slice(-90);
        const ema_values = metrics.ema_values.slice(-90);
        
        let labels = [];
        let tasksData = [];
        let energyData = [];

        if (period === 'week') {
            labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
            tasksData = tasks_raw.slice(-7);
            energyData = ema_values.slice(-7).map(e => Math.round((1 - e) * 100));
        } else if (period === 'month') {
            labels = ['Нед 1', 'Нед 2', 'Нед 3', 'Нед 4'];
            for (let i = 0; i < 4; i++) {
                const weekTasks = tasks_raw.slice(i * 7, (i + 1) * 7);
                const weekEma = ema_values.slice(i * 7, (i + 1) * 7);
                tasksData.push(weekTasks.reduce((a, b) => a + b, 0));
                if (weekEma.length > 0) {
                    const avgEma = weekEma.reduce((a, b) => a + b, 0) / weekEma.length;
                    energyData.push(Math.round((1 - avgEma) * 100));
                } else {
                    energyData.push(0);
                }
            }
        } else if (period === 'quarter') {
            labels = ['Мес 1', 'Мес 2', 'Мес 3'];
            for (let i = 0; i < 3; i++) {
                const monthTasks = tasks_raw.slice(i * 30, (i + 1) * 30);
                const monthEma = ema_values.slice(i * 30, (i + 1) * 30);
                tasksData.push(monthTasks.reduce((a, b) => a + b, 0));
                if (monthEma.length > 0) {
                    const avgEma = monthEma.reduce((a, b) => a + b, 0) / monthEma.length;
                    energyData.push(Math.round((1 - avgEma) * 100));
                } else {
                    energyData.push(0);
                }
            }
        }
        return { days: labels, tasks: tasksData, energy: energyData };
    }

    function renderChart(dataObj) {
        if (!barChart) return;

        const option = {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: ['Задачи', 'Энергия'], textStyle: { color: '#333' } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: dataObj.days },
            yAxis: [
                { type: 'value', name: 'Задачи' },
                { type: 'value', name: 'Энергия (%)', axisLabel: { formatter: '{value} %' } }
            ],
            series: [
                { name: 'Задачи', type: 'bar', data: dataObj.tasks, itemStyle: { color: '#5470C6' } },
                { name: 'Энергия', type: 'bar', yAxisIndex: 1, data: dataObj.energy, itemStyle: { color: '#91CC75' } }
            ]
        };
        barChart.setOption(option, true);
    }
    
    async function updateBarChart(period = 'week') {
        if (typeof checkAuth !== 'function' || !checkAuth()) {
            barChartContainer.innerHTML = '<div class="chart-loading">Требуется авторизация</div>';
            return;
        }
        
        try {
            barChartContainer.innerHTML = '<div class="chart-loading">Загрузка графика...</div>';
            if (!barChart) barChart = echarts.init(barChartContainer);

            const response = await makeAuthenticatedRequest(API_METRICS_URL);
            const metrics = await response.json();
            const dataObj = processData(metrics, period);
            
            barChart.clear();
            renderChart(dataObj);

        } catch (error) {
            console.error("❌ BarChart: Ошибка при загрузке или отрисовке:", error);
            barChartContainer.innerHTML = '<div class="chart-loading">Ошибка загрузки данных</div>';
        }
    }

    const filterSelect = document.getElementById('barChartFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => updateBarChart(e.target.value));
    }
    
    window.addEventListener('resize', () => barChart && barChart.resize());

    updateBarChart();
});