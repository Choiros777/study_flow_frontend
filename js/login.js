// js/login.js
console.log('🔑 login.js: Скрипт страницы входа загружен.');

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const notificationArea = document.getElementById('notificationArea');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Если пользователь уже авторизован, перенаправляем на дашборд
    if (checkAuth()) {
        console.log("Пользователь уже авторизован, перенаправление...");
        window.location.href = 'dashboard.html';
        return;
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showNotification('Пожалуйста, введите логин и пароль.', 'error');
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = 'Вход...';
        loadingIndicator.classList.add('show');
        clearNotifications();

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `Ошибка ${response.status}` }));
                throw new Error(errorData.detail || 'Неверные учетные данные');
            }

            const data = await response.json();
            
            if (!data.access_token) {
                throw new Error('Сервер не вернул токен доступа');
            }

            localStorage.setItem('studyflow_access_token', data.access_token);
            
            showNotification('Вход выполнен успешно! Перенаправление...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            showNotification(error.message, 'error');
            loginButton.disabled = false;
            loginButton.textContent = 'Войти';
            loadingIndicator.classList.remove('show');
        }
    });

    function showNotification(message, type = 'info') {
        clearNotifications();
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notificationArea.appendChild(notification);
    }

    function clearNotifications() {
        notificationArea.innerHTML = '';
    }

    usernameInput.addEventListener('input', clearNotifications);
    passwordInput.addEventListener('input', clearNotifications);
});