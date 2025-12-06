// js/calendar.js
console.log('📅 calendar.js: Скрипт большого календаря загружен.');

document.addEventListener('DOMContentLoaded', () => {
    // Убедимся, что скрипт работает только на странице календаря
    if (document.body.id !== 'calendar-page') return;

    const monthYearElement = document.getElementById('month-year');
    const calendarGrid = document.querySelector('.calendar-grid');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    
    // Элементы модального окна
    const modal = document.getElementById('goal-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModalButton = document.getElementById('close-modal');
    const goalTextarea = document.getElementById('goal-textarea');
    const saveGoalButton = document.getElementById('save-goal-btn');
    const deleteGoalButton = document.getElementById('delete-goal-btn');

    if (!monthYearElement || !calendarGrid || !modal) {
        console.error('Calendar script: один из ключевых элементов не найден.');
        return;
    }

    let currentDate = new Date();
    let selectedDayKey = null;
    
    // Загружаем цели из localStorage или создаем пустой объект
    let goals = JSON.parse(localStorage.getItem('calendarGoals')) || {};

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearElement.textContent = `${monthNames[month]} ${year}`;

        const weekdays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'weekday';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0=ПН, ..., 6=ВС
        const lastDateOfMonth = lastDayOfMonth.getDate();
        
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarGrid.appendChild(document.createElement('div')).className = 'day-cell empty';
        }

        for (let day = 1; day <= lastDateOfMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            dayCell.textContent = day;
            const dayKey = `${year}-${month + 1}-${day}`;
            dayCell.dataset.key = dayKey;

            if (goals[dayKey]) {
                dayCell.classList.add('has-goal');
            }

            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayCell.classList.add('current-day');
            }
            
            calendarGrid.appendChild(dayCell);
        }
    }

    function openModal(dateKey) {
        selectedDayKey = dateKey;
        const [year, month, day] = dateKey.split('-');
        modalTitle.textContent = `Цель на ${day}.${month}.${year}`; 
        goalTextarea.value = goals[selectedDayKey] || '';
        
        deleteGoalButton.style.display = goals[selectedDayKey] ? 'block' : 'none';
        
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        selectedDayKey = null;
    }

    function saveGoal() {
        if (selectedDayKey) {
            const goalText = goalTextarea.value.trim();
            if (goalText) {
                goals[selectedDayKey] = goalText;
            } else {
                delete goals[selectedDayKey];
            }
            localStorage.setItem('calendarGoals', JSON.stringify(goals));
            closeModal();
            renderCalendar();
        }
    }

    function deleteGoal() {
        if (selectedDayKey) {
            delete goals[selectedDayKey];
            localStorage.setItem('calendarGoals', JSON.stringify(goals));
            closeModal();
            renderCalendar();
        }
    }
    
    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    calendarGrid.addEventListener('click', (event) => {
        const cell = event.target.closest('.day-cell');
        if (cell && !cell.classList.contains('empty')) {
            openModal(cell.dataset.key);
        }
    });

    closeModalButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });
    saveGoalButton.addEventListener('click', saveGoal);
    deleteGoalButton.addEventListener('click', deleteGoal);

    renderCalendar();
});