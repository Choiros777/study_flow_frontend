// js/goals.js
console.log('🎯 goals.js: Скрипт страницы целей загружен.');

document.addEventListener('DOMContentLoaded', () => {
    const goalDialog = document.getElementById('new-goal-modal');
    if (!goalDialog) return;

    // Функция для показа модального окна
    window.showgoalDialog = function() {
        goalDialog.showModal();
    }

    // Функция для закрытия модального окна (пример)
    window.closeTaskModal = function() {
        goalDialog.close();
    }
    
    // Навешиваем событие на кнопку закрытия внутри диалога, если она есть
    const closeButton = goalDialog.querySelector('.dialogclosebutton');
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            closeTaskModal();
        });
    }

    // Инициализация календаря Flatpickr
    const dateTimePicker = document.getElementById('dateTime');
    if (dateTimePicker) {
        flatpickr(dateTimePicker, {
            enableTime: true,
            dateFormat: "d.m.Y H:i",
            time_24hr: true,
            locale: "ru"
        });
    }

    // Логика для слайдеров (ползунков)
    const sliders = [
        { slider: document.getElementById('stepSlider'), value: document.getElementById('stepValue') },
        { slider: document.getElementById('stepSlider2'), value: document.getElementById('stepValue2') }
    ];

    sliders.forEach(item => {
        if (item.slider && item.value) {
            // Устанавливаем начальное значение
            item.value.textContent = item.slider.value;
            // Обновляем значение при изменении
            item.slider.addEventListener('input', () => {
                item.value.textContent = item.slider.value;
            });
        }
    });

    // Логика для добавления подзадач
    window.addSubtask = function() {
        const container = document.getElementById('subtasksContainer');
        if (!container) return;
        
        const subtaskId = 'subtask-' + Date.now();
        const subtaskHTML = `
            <div class="subtask" id="${subtaskId}">
                <input type="text" placeholder="📝 Название подзадачи" class="subtask-input">
                <textarea placeholder="📋 Описание"></textarea>
                <button onclick="document.getElementById('${subtaskId}').remove()" class="delete-btn">🗑️ Удалить</button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', subtaskHTML);
    }
    
    // Логика сохранения (пока заглушка)
    window.saveTask = function() {
        console.log("Сохранение задачи...");
        // Здесь будет логика сбора данных с формы и отправки на сервер
        closeTaskModal();
    }
});