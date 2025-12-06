// js/goals.js
console.log('🎯 goals.js: Скрипт страницы целей загружен.');

document.addEventListener('DOMContentLoaded', () => {
    const goalDialog = document.getElementById('new-goal-modal');
    if (!goalDialog) return;

    window.showgoalDialog = function() {
        goalDialog.showModal();
    }
    window.closeTaskModal = function() {
        goalDialog.close();
    }
    
    const closeButton = goalDialog.querySelector('.dialogclosebutton');
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            closeTaskModal();
        });
    }

    flatpickr("#dateTime", {
        enableTime: true,
        dateFormat: "d.m.Y H:i",
        time_24hr: true,
        locale: "ru"
    });

    const sliders = [
        { slider: document.getElementById('stepSlider'), value: document.getElementById('stepValue') },
        { slider: document.getElementById('stepSlider2'), value: document.getElementById('stepValue2') }
    ];

    sliders.forEach(item => {
        if (item.slider && item.value) {
            item.value.textContent = item.slider.value;
            item.slider.addEventListener('input', () => {
                item.value.textContent = item.slider.value;
            });
        }
    });

    window.addSubtask = function() {
        const container = document.getElementById('subtasksContainer');
        if (!container) return;
        const subtaskId = 'subtask-' + Date.now();
        container.insertAdjacentHTML('beforeend', `
            <div class="subtask" id="${subtaskId}">
                <input type="text" placeholder="📝 Название подзадачи">
                <textarea placeholder="📋 Описание"></textarea>
                <button onclick="document.getElementById('${subtaskId}').remove()" class="delete-btn">🗑️ Удалить</button>
            </div>
        `);
    }
    
    window.saveTask = function() {
        console.log("Сохранение задачи...");
        // Здесь будет логика сбора данных и отправки на сервер
        closeTaskModal();
    }
});