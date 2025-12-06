// js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    const calendarCard = document.querySelector('#dashboard-page .calendar-card');
    if (!calendarCard) return; // Работаем только на дашборде

    const monthYearElement = calendarCard.querySelector('#month-year');
    const calendarGrid = calendarCard.querySelector('.calendar-grid');
    const prevMonthButton = calendarCard.querySelector('#prev-month');
    const nextMonthButton = calendarCard.querySelector('#next-month');
    
    if (!monthYearElement || !calendarGrid) return;

    const modal = document.getElementById('goal-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModalButton = document.getElementById('close-modal');
    const goalTextarea = document.getElementById('goal-textarea');
    const saveGoalButton = document.getElementById('save-goal-btn');
    const deleteGoalButton = document.getElementById('delete-goal-btn');

    let currentDate = new Date();
    let selectedDayKey = null;
    let goals = JSON.parse(localStorage.getItem('calendarGoals')) || {};
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearElement.textContent = `${monthNames[month]} ${year}`;

        const weekdays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
        weekdays.forEach(day => {
            calendarGrid.appendChild(document.createElement('div')).className = 'day-header';
            calendarGrid.lastChild.textContent = day;
        });

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
        const lastDateOfMonth = lastDayOfMonth.getDate();

        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarGrid.appendChild(document.createElement('div')).className = 'calendar-day empty';
        }

        for (let day = 1; day <= lastDateOfMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;
            const dayKey = `${year}-${month + 1}-${day}`;
            dayCell.dataset.key = dayKey;

            if (goals[dayKey]) dayCell.classList.add('has-goal');
            
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayCell.classList.add('current-day');
            }
            calendarGrid.appendChild(dayCell);
        }
    }

    function openModal(dateKey) { /* ... (весь код функции openModal) ... */ }
    function closeModal() { /* ... (весь код функции closeModal) ... */ }
    function saveGoal() { /* ... (весь код функции saveGoal) ... */ }
    function deleteGoal() { /* ... (весь код функции deleteGoal) ... */ }

    prevMonthButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    calendarGrid.addEventListener('click', (e) => { /* ... */ });
    closeModalButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    saveGoalButton.addEventListener('click', saveGoal);
    deleteGoalButton.addEventListener('click', deleteGoal);

    renderCalendar();
});