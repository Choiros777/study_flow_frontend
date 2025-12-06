// УЛУЧШЕННЫЙ МЕНЕДЖЕР ТУЛТИПОВ ДЛЯ ВСЕХ ГРАФИКОВ
window.chartTooltipManager = {
    currentTooltip: null,
    isMobile: window.innerWidth <= 768,

    init() {
        this.updateMobileState();

        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.updateMobileState();
        });

        // Закрытие при клике в любое место (для мобильных)
        document.addEventListener('click', (e) => {
            if (this.currentTooltip && this.isMobile && !e.target.closest('.global-tooltip')) {
                this.hideTooltip();
            }
        });

        // Закрытие при скролле для ВСЕХ графиков
        window.addEventListener('scroll', () => {
            if (this.currentTooltip) {
                this.hideTooltip();
            }

            // Также скрываем тултипы ECharts при скролле
            this.hideEChartsTooltips();
        }, { passive: true });

        console.log('✅ ChartTooltipManager инициализирован, мобильный режим:', this.isMobile);
    },

    updateMobileState() {
        this.isMobile = window.innerWidth <= 768;
    },

    showTooltip(event, content, tooltipType = 'energy-map') {
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = `global-tooltip ${tooltipType}-tooltip`;
        tooltip.innerHTML = content;
        document.body.appendChild(tooltip);

        this.currentTooltip = tooltip;
        this.positionTooltip(event, tooltip);

        // Для мобильных добавляем класс
        if (this.isMobile) {
            tooltip.classList.add('mobile-tooltip');
            document.body.classList.add('tooltip-open');
        }

        return tooltip;
    },

    positionTooltip(event, tooltip) {
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (this.isMobile) {
            // Для мобильных - фиксированно внизу экрана
            tooltip.style.position = 'fixed';
            tooltip.style.left = '50%';
            tooltip.style.bottom = '20px';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.maxWidth = 'calc(100vw - 40px)';
            tooltip.style.zIndex = '10000';
            tooltip.style.pointerEvents = 'auto';
        } else {
            // Для десктопа - позиционируем относительно курсора
            const offsetX = 15;
            const offsetY = 15;

            let posX = event.clientX + offsetX;
            let posY = event.clientY + offsetY;

            // Проверка границ
            if (posX + tooltipRect.width > viewportWidth - 10) {
                posX = event.clientX - tooltipRect.width - offsetX;
            }

            if (posY + tooltipRect.height > viewportHeight - 10) {
                posY = event.clientY - tooltipRect.height - offsetY;
            }

            if (posX < 10) posX = 10;
            if (posY < 10) posY = 10;

            tooltip.style.position = 'fixed';
            tooltip.style.left = posX + 'px';
            tooltip.style.top = posY + 'px';
            tooltip.style.zIndex = '10000';
            tooltip.style.pointerEvents = 'none';
        }

        tooltip.style.opacity = '1';
        tooltip.style.display = 'block';
    },

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
            document.body.classList.remove('tooltip-open');
        }
    },

    hideEChartsTooltips() {
        // Скрываем тултипы ECharts для всех графиков при скролле
        if (this.isMobile) {
            if (window.lineChart) {
                window.lineChart.dispatchAction({ type: 'hideTip' });
            }
            if (window.barChart) {
                window.barChart.dispatchAction({ type: 'hideTip' });
            }
            if (window.pieChart) {
                window.pieChart.dispatchAction({ type: 'hideTip' });
            }
        }
    }
};

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.chartTooltipManager.init();
});

// Также инициализируем если DOM уже загружен
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chartTooltipManager.init();
    });
} else {
    window.chartTooltipManager.init();
}