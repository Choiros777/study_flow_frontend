// js/ui.js
console.log('🎨 ui.js: Модуль интерфейса загружен.');

document.addEventListener('DOMContentLoaded', () => {
    // --- Логика переключения тем ---
    const themeButtons = document.querySelectorAll('[data-set-theme]');
    const storageKey = 'studyflow-theme';

    const applyTheme = (theme) => {
        if (!theme || theme === 'default') {
            document.body.removeAttribute('data-theme');
        } else {
            document.body.setAttribute('data-theme', theme);
        }
    };

    themeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const theme = button.dataset.setTheme;
            applyTheme(theme);
            localStorage.setItem(storageKey, theme);
        });
    });

    const savedTheme = localStorage.getItem(storageKey);
    applyTheme(savedTheme);

    // --- Логика мобильного меню ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });

        // Закрытие меню при клике вне его
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
});