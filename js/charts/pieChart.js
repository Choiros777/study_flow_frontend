// js/charts/pieChart.js
console.log('🥧 pieChart.js загружается');

document.addEventListener('DOMContentLoaded', () => {
    const pieChartContainer = document.getElementById('pieChart');
    if (!pieChartContainer) return;
    
    let pieChart = null;
    
    async function fetchData() {
        if (!checkAuth()) throw new Error("Требуется авторизация");
        const [listsRes, tasksRes] = await Promise.all([
            makeAuthenticatedRequest('/tasklists/'),
            makeAuthenticatedRequest('/tasks/')
        ]);
        const taskLists = await listsRes.json();
        const allTasks = await tasksRes.json();
        return { taskLists, allTasks };
    }

    function processData(data, filter) {
        const { taskLists, allTasks } = data;
        const listMap = new Map(taskLists.map(list => [list.id, list.name]));
        
        const tasksByList = {};
        
        allTasks.forEach(task => {
            if ((filter === 'completed' && !task.is_completed) || (filter === 'incomplete' && task.is_completed)) {
                return;
            }
            const listId = task.task_list_id || 'unassigned';
            tasksByList[listId] = (tasksByList[listId] || 0) + 1;
        });

        const chartData = Object.entries(tasksByList).map(([listId, count]) => ({
            value: count,
            name: listMap.get(parseInt(listId)) || 'Без категории'
        }));
        
        return chartData;
    }

    function renderChart(data) {
        if (!pieChart) return;
        
        const option = {
            tooltip: { trigger: 'item' },
            legend: { top: '5%', left: 'center' },
            series: [{
                name: 'Распределение',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
                label: { show: false, position: 'center' },
                emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold' } },
                labelLine: { show: false },
                data: data
            }]
        };
        pieChart.setOption(option, true);
    }
    
    async function updatePieChart(filter = 'all') {
        if (!checkAuth()) {
            pieChartContainer.innerHTML = '<div class="chart-loading">Требуется авторизация</div>';
            return;
        }

        try {
            pieChartContainer.innerHTML = '<div class="chart-loading">Загрузка...</div>';
            if (!pieChart) pieChart = echarts.init(pieChartContainer);

            const data = await fetchData();
            const chartData = processData(data, filter);
            
            pieChart.clear();
            renderChart(chartData);

        } catch (error) {
            console.error("❌ PieChart: Ошибка:", error);
            pieChartContainer.innerHTML = '<div class="chart-loading">Ошибка загрузки</div>';
        }
    }

    const filterSelect = document.getElementById('pieChartFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => updatePieChart(e.target.value));
    }
    
    window.addEventListener('resize', () => pieChart && pieChart.resize());
    
    // Инициализация
    updatePieChart();
});