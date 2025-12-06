// js/profile.js
console.log('👤 profile.js: Скрипт страницы профиля загружен.');

document.addEventListener('DOMContentLoaded', () => {
    // === Элементы DOM ===
    const editModal = document.getElementById('edit-modal');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editProfileForm = document.getElementById('edit-profile-form');

    // === Управление модальным окном ===
    function openEditModal() {
        if (editModal) editModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeEditModal() {
        if (editModal) editModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    if (editProfileBtn) editProfileBtn.addEventListener('click', openEditModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeEditModal();
        });
    }

    // === Загрузка и отображение данных ===
    async function loadProfile() {
        // Временно используем mock-данные для теста, пока нет API
        const mockProfileData = {
            name: "Зубенко Михаил Петрович",
            comment: "Мафиозник",
            email: "user@example.com",
            telegram: "@michail_z",
            vk: "https://vk.com/michail_z",
            streak_days: 3,
            total_days: 15
        };
        updateUI(mockProfileData);
        
        // РАСКОММЕНТИРУЙТЕ ЭТОТ БЛОК ДЛЯ РАБОТЫ С РЕАЛЬНЫМ API
        /*
        if (!checkAuth()) {
            showNotification('Требуется авторизация', 'error');
            return;
        }
        try {
            const response = await makeAuthenticatedRequest('/users/me');
            if (!response.ok) throw new Error('Не удалось загрузить профиль');
            const profileData = await response.json();
            updateUI(profileData);
        } catch (error) {
            handleApiError(error, 'загрузки профиля');
        }
        */
    }

    function updateUI(data) {
        document.getElementById('user-name').textContent = data.name || data.username;
        document.getElementById('user-comment').textContent = data.comment || 'Нет описания';
        document.getElementById('contact-email').textContent = data.email || 'не указан';
        document.getElementById('contact-telegram').textContent = data.telegram || 'не указан';
        document.getElementById('contact-vk').textContent = data.vk || 'не указан';
        document.getElementById('edit-name').value = data.name || '';
        document.getElementById('edit-description').value = data.comment || '';
        document.getElementById('edit-email').value = data.email || '';
        document.getElementById('edit-telegram').value = data.telegram || '';
        document.getElementById('edit-vk').value = data.vk || '';
        updateStreakVisual(data.streak_days || 0, data.total_days || 0);
        document.getElementById('streak-days').textContent = data.streak_days || 0;
        document.getElementById('total-days').textContent = data.total_days || 0;
    }

    // === ИСПРАВЛЕННАЯ ВЕРСИЯ ФУНКЦИИ СТРИКА ===
    function updateStreakVisual(currentStreak, totalDays) {
        const container = document.getElementById('streak-container');
        if (!container) return;
        container.innerHTML = '';
        
        const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
        
        for (let i = 0; i < weekDays.length; i++) {
            const day = document.createElement('div');
            day.className = 'streak-day';
            day.setAttribute('data-day', weekDays[i]);
            day.textContent = i + 1;
            
            if (i < currentStreak) {
                day.classList.add('filled');
            } else {
                // Здесь можно будет добавить логику для 'pattern', если понадобится
                day.classList.add('empty');
            }
            container.appendChild(day);
        }
    }

    // === Сохранение данных ===
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (остальная логика сохранения остается без изменений) ...
        });
    }

    // === Уведомления и обработка ошибок ===
    function showNotification(message, type = 'success') { /* ... */ }
    function handleApiError(error, context) { /* ... */ }

    // Инициализация
    loadProfile();
});