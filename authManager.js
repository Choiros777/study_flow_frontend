// authManager.js - Централизованная система аутентификации для StudyFlow API
class AuthManager {
    constructor() {
        this.API_BASE_URL = "http://127.0.0.1:8000"; // Базовый URL вашего API
        this.LOGIN_URL = `${this.API_BASE_URL}/api/v1/auth/login`;
        this.REGISTER_URL = `${this.API_BASE_URL}/api/v1/auth/register`;
        this.ME_URL = `${this.API_BASE_URL}/api/v1/auth/me`;
        this.currentUser = null;
        this.accessToken = null;
        this.refreshToken = null; // Если ваше API поддерживает refresh токены
        this.isAuthenticated = false;

        // Инициализируем при создании
        this.initialize();

        console.log('✅ AuthManager инициализирован');
    }

    /**
     * Инициализация - восстановление сессии из localStorage
     */
    initialize() {
        const savedToken = localStorage.getItem('studyflow_access_token');
        const savedUser = localStorage.getItem('studyflow_user');

        if (savedToken && savedUser) {
            this.accessToken = savedToken;
            this.currentUser = JSON.parse(savedUser);
            this.isAuthenticated = true;
            console.log('✅ Восстановлена сессия пользователя:', this.currentUser.username);

            // Проверяем валидность токена
            this.verifyTokenSilently();
        } else {
            console.log('⚠️ Нет сохраненной сессии');
        }
    }

    /**
     * Регистрация нового пользователя
     * @param {Object} userData - Данные пользователя
     */
    async register(userData) {
        try {
            console.log('📝 Попытка регистрации пользователя');

            // Структура данных согласно вашему сваггеру
            const registrationData = {
                username: userData.username,
                email: userData.email,
                password: userData.password,
                full_name: userData.full_name || userData.username
            };

            const response = await fetch(this.REGISTER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(registrationData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Ошибка регистрации';

                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.detail || errorMessage;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${errorText}`;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('✅ Пользователь успешно зарегистрирован');

            // После регистрации автоматически логинимся
            return await this.login(userData.username, userData.password);

        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            return {
                success: false,
                error: error.message || 'Не удалось зарегистрироваться'
            };
        }
    }

    /**
     * Вход в систему
     * @param {string} username - Логин пользователя
     * @param {string} password - Пароль пользователя
     */
    async login(username, password) {
        try {
            console.log('🔐 Попытка входа для пользователя:', username);

            const response = await fetch(this.LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Ошибка входа';

                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.detail || errorMessage;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${errorText}`;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Сохраняем токен (согласно сваггеру, ожидается поле 'access_token')
            this.accessToken = data.access_token;
            this.currentUser = {
                username: username,
                id: data.user_id || data.id,
                email: data.email || ''
            };
            this.isAuthenticated = true;

            // Сохраняем в localStorage
            localStorage.setItem('studyflow_access_token', this.accessToken);
            localStorage.setItem('studyflow_user', JSON.stringify(this.currentUser));

            console.log('✅ Успешный вход для пользователя:', username);

            // Получаем полную информацию о пользователе
            await this.fetchUserInfo();

            return {
                success: true,
                user: this.currentUser,
                message: 'Вход выполнен успешно!'
            };

        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            return {
                success: false,
                error: error.message || 'Не удалось войти в систему'
            };
        }
    }

    /**
     * Получение информации о текущем пользователе
     */
    async fetchUserInfo() {
        if (!this.accessToken) return;

        try {
            const response = await fetch(this.ME_URL, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                const userData = await response.json();
                this.currentUser = {
                    ...this.currentUser,
                    ...userData
                };

                // Обновляем в localStorage
                localStorage.setItem('studyflow_user', JSON.stringify(this.currentUser));

                console.log('📋 Получена информация о пользователе:', this.currentUser);
            }
        } catch (error) {
            console.error('❌ Ошибка получения информации о пользователе:', error);
        }
    }

    /**
     * Тихая проверка валидности токена
     */
    async verifyTokenSilently() {
        if (!this.accessToken) return false;

        try {
            const response = await fetch(this.ME_URL, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                return true;
            } else if (response.status === 401) {
                // Токен невалиден
                console.log('⚠️ Токен невалиден, выполняем выход');
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка проверки токена:', error);
            return false;
        }
    }

    /**
     * Выход из системы
     */
    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.currentUser = null;
        this.isAuthenticated = false;

        // Удаляем из localStorage
        localStorage.removeItem('studyflow_access_token');
        localStorage.removeItem('studyflow_user');

        console.log('👋 Пользователь вышел из системы');

        // Если мы на странице с графиками, перенаправляем на страницу входа
        if (!window.location.href.includes('login.html') &&
            !window.location.href.includes('register.html')) {
            window.location.href = 'login.html';
        }
    }

    /**
     * Получение заголовков авторизации для API-запросов
     */
    getAuthHeaders(additionalHeaders = {}) {
        if (!this.accessToken || !this.isAuthenticated) {
            console.warn('⚠️ Нет действительного токена для запроса');
            return {};
        }

        return {
            "Authorization": `Bearer ${this.accessToken}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...additionalHeaders
        };
    }

    /**
     * Проверка авторизации пользователя
     */
    isLoggedIn() {
        return this.isAuthenticated && this.accessToken !== null;
    }

    /**
     * Получение информации о текущем пользователе
     */
    getUser() {
        return this.currentUser;
    }

    /**
     * Получение токена
     */
    getToken() {
        return this.accessToken;
    }

    /**
     * Безопасный метод для выполнения запросов к API
     */
    async fetchWithAuth(url, options = {}) {
        // Проверяем авторизацию
        if (!this.isLoggedIn()) {
            throw new Error('Пользователь не авторизован');
        }

        const authHeaders = this.getAuthHeaders();
        if (Object.keys(authHeaders).length === 0) {
            throw new Error('Нет заголовков авторизации');
        }

        const finalOptions = {
            ...options,
            headers: {
                ...authHeaders,
                ...options.headers
            }
        };

        let response = await fetch(url, finalOptions);

        // Если токен истек (401), выполняем выход
        if (response.status === 401) {
            console.log('🔁 Сессия истекла, выполняется выход...');
            this.logout();
            throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
        }

        return response;
    }

    /**
     * Утилитарный метод для выполнения GET запросов
     */
    async get(url, options = {}) {
        return await this.fetchWithAuth(url, { ...options, method: 'GET' });
    }

    /**
     * Утилитарный метод для выполнения POST запросов
     */
    async post(url, data = {}, options = {}) {
        return await this.fetchWithAuth(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Утилитарный метод для выполнения PUT запросов
     */
    async put(url, data = {}, options = {}) {
        return await this.fetchWithAuth(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Утилитарный метод для выполнения DELETE запросов
     */
    async delete(url, options = {}) {
        return await this.fetchWithAuth(url, { ...options, method: 'DELETE' });
    }
}

// Создаем глобальный экземпляр
window.authManager = new AuthManager();

// Экспортируем для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager };
}