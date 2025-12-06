// js/auth.js (ФИНАЛЬНАЯ ВЕРСИЯ)
console.log('🛡️ auth.js: Модуль авторизации загружен.');

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

function checkAuth() {
    const token = localStorage.getItem('studyflow_access_token');
    return !!token;
}

async function makeAuthenticatedRequest(endpoint, options = {}) {
    const token = localStorage.getItem('studyflow_access_token');
    if (!token) {
        console.error('❌ Auth: Попытка сделать запрос без токена.');
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
            console.warn('⚠️ Auth: Токен недействителен. Очистка и перенаправление.');
            localStorage.removeItem('studyflow_access_token');
            window.location.href = 'index.html';
            return Promise.reject('Токен недействителен');
        }
        return response;
    } catch (error) {
        console.error(`❌ Auth: Ошибка сети при запросе к ${endpoint}`, error);
        throw error;
    }
}