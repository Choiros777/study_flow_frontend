// js/auth.js
console.log('🛡️ auth.js: Модуль авторизации загружен.');

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

/**
 * Проверяет, авторизован ли пользователь, по наличию токена в localStorage.
 * @returns {boolean} true, если токен найден.
 */
function checkAuth() {
    const token = localStorage.getItem('studyflow_access_token');
    if (token) {
        console.log('✅ Auth: Пользователь авторизован (токен найден).');
        return true;
    }
    console.log('❌ Auth: Пользователь не авторизован (токен не найден).');
    return false;
}

/**
 * Выполняет авторизованный запрос к API.
 * @param {string} endpoint - Конечная точка API (например, '/tasklists/').
 * @param {object} options - Опции для fetch().
 * @returns {Promise<Response>}
 */
async function makeAuthenticatedRequest(endpoint, options = {}) {
    const token = localStorage.getItem('studyflow_access_token');
    
    if (!token) {
        console.error('❌ Auth: Попытка сделать запрос без токена.');
        // Если мы не на странице входа/регистрации, перенаправляем туда
        if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('register.html')) {
            window.location.href = 'index.html';
        }
        return Promise.reject('Нет токена авторизации');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

        if (response.status === 401) {
            console.warn('⚠️ Auth: Токен недействителен или истек (ошибка 401). Очистка и перенаправление на вход...');
            localStorage.removeItem('studyflow_access_token');
            localStorage.removeItem('studyflow_user');
            window.location.href = 'index.html';
            return Promise.reject('Токен недействителен');
        }
        
        if (!response.ok) {
            console.error(`❌ Auth: Ошибка сети ${response.status} при запросе к ${endpoint}`);
        }

        return response;
    } catch (error) {
        console.error(`❌ Auth: Критическая ошибка сети при запросе к ${endpoint}`, error);
        throw error; // Пробрасываем ошибку дальше
    }
}