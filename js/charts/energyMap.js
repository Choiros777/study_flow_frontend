// js/charts/energyMap.js
console.log('🗺️ energyMap.js загружается');

document.addEventListener('DOMContentLoaded', () => {
    const energyMapContainer = document.getElementById('energyMap');
    if (!energyMapContainer) return;
    
    let energyMap = null;
    const API_METRICS_URL = "/analytics/metrics?days_back=365";

    function processData(metrics, monthIndex) {
        const year = new Date().getFullYear();
        const dataForMonth = [];
        
        if (metrics && metrics.dates) {
            for (let i = 0; i < metrics.dates.length; i++) {
                const date = new Date(metrics.dates[i]);
                if (date.getFullYear() === year && date.getMonth() === monthIndex) {
                    dataForMonth.push([
                        echarts.format.formatTime('yyyy-MM-dd', date),
                        Math.round((1 - metrics.ema_values[i]) * 100)
                    ]);
                }
            }
        }
        return dataForMonth;
    }

    function renderChart(data, monthIndex) {
        if (!energyMap) return;

        const year = new Date().getFullYear();

        const option = {
            tooltip: { position: 'top' },
            visualMap: {
                min: 0,
                max: 100,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '15%',
                textStyle: { color: '#333' }
            },
            calendar: {
                top: '20%',
                left: 30,
                right: 30,
                cellSize: ['auto', 13],
                range: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
                itemStyle: { borderWidth: 0.5 },
                yearLabel: { show: false },
                monthLabel: { nameMap: 'ru' },
                dayLabel: { firstDay: 1, nameMap: 'ru' }
            },
            series: {
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: data
            }
        };
        energyMap.setOption(option, true);
    }
    
    async function updateEnergyMap(month = new Date().getMonth()) {
        if (typeof checkAuth !== 'function' || !checkAuth()) {
            energyMapContainer.innerHTML = '<div class="chart-loading">Требуется авторизация</div>';
            return;
        }

        try {
            energyMapContainer.innerHTML = '<div class="chart-loading">Загрузка...</div>';
            if (!energyMap) energyMap = echarts.init(energyMapContainer);

            const response = await makeAuthenticatedRequest(API_METRICS_URL);
            const metrics = await response.json();
            const chartData = processData(metrics, month);
            
            energyMap.clear();
            renderChart(chartData, month);

        } catch (error) {
            console.error("❌ EnergyMap: Ошибка:", error);
            energyMapContainer.innerHTML = '<div class="chart-loading">Ошибка загрузки</div>';
        }
    }

    const filterSelect = document.getElementById('energyMapFilter');
    if (filterSelect) {
        const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
        filterSelect.innerHTML = months.map((name, index) => `<option value="${index}">${name}</option>`).join('');
        filterSelect.value = new Date().getMonth();
        filterSelect.addEventListener('change', (e) => updateEnergyMap(parseInt(e.target.value)));
    }
    
    window.addEventListener('resize', () => energyMap && energyMap.resize());

    updateEnergyMap();
});