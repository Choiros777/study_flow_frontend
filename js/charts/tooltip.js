// tooltip.js - Упрощенная и надежная версия
class TooltipSystem {
    constructor() {
        this.desktopTooltip = null;
        this.mobileTooltip = null;
        this.mobileContainer = null;
        this.isMobile = window.innerWidth <= 768;

        this.desktopHideTimer = null;
        this.lastScrollTop = 0;
        this.currentHoverTarget = null;
        this.isMobileTooltipVisible = false;
        this.tapStart = { x: 0, y: 0, time: 0 };

        // Флаги для отслеживания наведения
        this.isHoveringTarget = false;
        this.isHoveringTooltip = false;
        this.checkHoverInterval = null;

        console.log('🛠️ TooltipSystem: режим', this.isMobile ? 'мобильный' : 'десктопный');

        this.setupGlobalListeners();
        this.setupHoverTracking();
    }

    setupGlobalListeners() {
        // Ресайз
        window.addEventListener('resize', () => {
            const newIsMobile = window.innerWidth <= 768;
            if (newIsMobile !== this.isMobile) {
                this.isMobile = newIsMobile;
                this.hideAll();
                console.log('🔄 TooltipSystem: переключен режим на', this.isMobile ? 'мобильный' : 'десктопный');
            }
        });

        // Скролл для десктопных тултипов
        window.addEventListener('scroll', () => {
            if (!this.isMobile && this.desktopTooltip) {
                this.handleDesktopScroll();
            }
        }, { passive: true });

        // Клик вне тултипа - всегда скрываем
        document.addEventListener('click', (e) => {
            if (this.isMobile) return;

            const isClickOnTarget = e.target.closest('.energy-day:not(.empty)');
            const isClickOnTooltip = e.target.closest('.desktop-energy-tooltip');

            if (!isClickOnTarget && !isClickOnTooltip && this.desktopTooltip) {
                this.hideDesktop();
            }
        }, true);
    }

    setupHoverTracking() {
        // Отслеживаем наведение на элементы .energy-day
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('.energy-day:not(.empty)');
            if (target) {
                this.isHoveringTarget = true;
            }

            // Проверяем, навели ли на тултип
            const tooltip = e.target.closest('.desktop-energy-tooltip');
            if (tooltip) {
                this.isHoveringTooltip = true;
                clearTimeout(this.desktopHideTimer);
            }
        });

        document.addEventListener('mouseout', (e) => {
            // Проверяем, ушла ли мышь с целевого элемента
            const target = e.target.closest('.energy-day:not(.empty)');
            if (target && !e.relatedTarget?.closest('.energy-day:not(.empty)')) {
                this.isHoveringTarget = false;
                this.scheduleHideIfNotHovering();
            }

            // Проверяем, ушла ли мышь с тултипа
            const tooltip = e.target.closest('.desktop-energy-tooltip');
            if (tooltip && !e.relatedTarget?.closest('.desktop-energy-tooltip')) {
                this.isHoveringTooltip = false;
                this.scheduleHideIfNotHovering();
            }
        });

        // Периодическая проверка наведения (дополнительная защита)
        this.checkHoverInterval = setInterval(() => {
            this.checkHoverStatus();
        }, 100);
    }

    checkHoverStatus() {
        if (this.isMobile || !this.desktopTooltip) return;

        // Проверяем, находится ли курсор над целевым элементом
        const hoveredTarget = document.querySelector('.energy-day:not(.empty):hover');
        this.isHoveringTarget = !!hoveredTarget;

        // Проверяем, находится ли курсор над тултипом
        const hoveredTooltip = document.querySelector('.desktop-energy-tooltip:hover');
        this.isHoveringTooltip = !!hoveredTooltip;

        // Если курсор не над ничем из нужного - скрываем
        if (!this.isHoveringTarget && !this.isHoveringTooltip) {
            this.scheduleHideIfNotHovering();
        } else {
            clearTimeout(this.desktopHideTimer);
        }
    }

    scheduleHideIfNotHovering() {
        if (this.isMobile || !this.desktopTooltip) return;

        clearTimeout(this.desktopHideTimer);

        // Ждем 100мс для уверенности, что это не просто промежуточное движение мыши
        this.desktopHideTimer = setTimeout(() => {
            if (!this.isHoveringTarget && !this.isHoveringTooltip && this.desktopTooltip) {
                this.hideDesktop();
            }
        }, 100);
    }

    handleDesktopScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDiff = Math.abs(currentScroll - this.lastScrollTop);

        if (scrollDiff > 3) {
            this.hideDesktop();
        }

        this.lastScrollTop = currentScroll;
    }

    // ===== ДЕСКТОПНЫЕ ТУЛТИПЫ =====
    showDesktop(event, content, className = 'desktop-energy-tooltip') {
        const target = event.target.closest('.energy-day:not(.empty)');
        if (!target) return;

        if (this.currentHoverTarget === target) {
            return;
        }

        this.currentHoverTarget = target;

        this.hideDesktop(true);

        requestAnimationFrame(() => {
            this.createDesktopTooltip(event, content, className);
        });
    }

    createDesktopTooltip(event, content, className) {
        this.desktopTooltip = document.createElement('div');
        this.desktopTooltip.className = className;
        this.desktopTooltip.innerHTML = content;

        Object.assign(this.desktopTooltip.style, {
            position: 'fixed',
            background: 'white',
            border: '1px solid #e1e4e8',
            borderRadius: '6px',
            padding: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: '10000',
            fontSize: '13px',
            maxWidth: '220px',
            minWidth: '180px',
            opacity: '0',
            pointerEvents: 'auto', // Разрешаем взаимодействие с тултипом
            transition: 'opacity 0.15s ease',
            willChange: 'transform, opacity'
        });

        // Слушатели для тултипа
        this.desktopTooltip.addEventListener('mouseenter', () => {
            this.isHoveringTooltip = true;
            clearTimeout(this.desktopHideTimer);
        });

        this.desktopTooltip.addEventListener('mouseleave', (e) => {
            // Проверяем, не перешла ли мышь на целевой элемент
            if (!e.relatedTarget?.closest('.energy-day:not(.empty)')) {
                this.isHoveringTooltip = false;
                this.scheduleHideIfNotHovering();
            }
        });

        document.body.appendChild(this.desktopTooltip);
        this.positionDesktop(event);

        requestAnimationFrame(() => {
            if (this.desktopTooltip) {
                this.desktopTooltip.style.opacity = '1';
                this.isHoveringTarget = true;
            }
        });
    }

    positionDesktop(event) {
        if (!this.desktopTooltip) return;

        const target = event.target.closest('.energy-day:not(.empty)');
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const tooltipRect = this.desktopTooltip.getBoundingClientRect();

        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.top - tooltipRect.height - 8;

        const padding = 10;

        if (left < padding) left = padding;
        if (left + tooltipRect.width > window.innerWidth - padding) {
            left = window.innerWidth - tooltipRect.width - padding;
        }

        if (top < padding) {
            top = rect.bottom + 8;
        }

        if (top + tooltipRect.height > window.innerHeight - padding) {
            top = window.innerHeight - tooltipRect.height - padding;
        }

        Object.assign(this.desktopTooltip.style, {
            left: left + 'px',
            top: top + 'px'
        });
    }

    hideDesktop(immediate = false) {
        clearTimeout(this.desktopHideTimer);

        if (this.desktopTooltip) {
            if (immediate) {
                if (this.desktopTooltip.parentNode) {
                    this.desktopTooltip.parentNode.removeChild(this.desktopTooltip);
                }
                this.desktopTooltip = null;
                this.currentHoverTarget = null;
                this.isHoveringTarget = false;
                this.isHoveringTooltip = false;
            } else {
                this.desktopTooltip.style.opacity = '0';

                this.desktopHideTimer = setTimeout(() => {
                    if (this.desktopTooltip && this.desktopTooltip.parentNode) {
                        this.desktopTooltip.parentNode.removeChild(this.desktopTooltip);
                    }
                    this.desktopTooltip = null;
                    this.currentHoverTarget = null;
                    this.isHoveringTarget = false;
                    this.isHoveringTooltip = false;
                }, 150);
            }
        }
    }

    // ===== МОБИЛЬНЫЕ ТУЛТИПЫ - ПРОСТАЯ ВЕРСИЯ =====
    showMobile(content, className = 'mobile-energy-tooltip') {
        // Если уже открыт - закрываем
        if (this.isMobileTooltipVisible) {
            this.hideMobile();
            return;
        }

        this.hideDesktop(true);

        // Удаляем старый если есть
        if (this.mobileContainer) {
            if (this.mobileContainer.parentNode) {
                this.mobileContainer.parentNode.removeChild(this.mobileContainer);
            }
            if (this.mobileTooltip && this.mobileTooltip.parentNode) {
                this.mobileTooltip.parentNode.removeChild(this.mobileTooltip);
            }
        }

        this.createMobileTooltip(content, className);
    }

    createMobileTooltip(content, className) {
        this.isMobileTooltipVisible = true;

        // Сохраняем скролл
        this.scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Backdrop
        this.mobileContainer = document.createElement('div');
        this.mobileContainer.className = 'mobile-tooltip-backdrop';
        this.mobileContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9998;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Тултип
        this.mobileTooltip = document.createElement('div');
        this.mobileTooltip.className = className;
        this.mobileTooltip.innerHTML = content;
        this.mobileTooltip.style.cssText = `
            position: fixed;
            left: 20px;
            right: 20px;
            bottom: 20px;
            background: white;
            border-radius: 12px;
            padding: 20px;
            z-index: 9999;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            opacity: 0;
            transform: translateY(100px);
            transition: all 0.3s ease;
            max-height: 70vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        `;

        // Кнопка закрытия
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.className = 'mobile-tooltip-close';
        closeBtn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #f5f5f5;
            border: none;
            font-size: 20px;
            color: #666;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
        `;

        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.hideMobile();
        };

        this.mobileTooltip.appendChild(closeBtn);
        document.body.appendChild(this.mobileContainer);
        document.body.appendChild(this.mobileTooltip);

        // Блокируем скролл
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${this.scrollTop}px`;

        // Показываем
        setTimeout(() => {
            if (this.mobileContainer) {
                this.mobileContainer.style.opacity = '1';
            }
            if (this.mobileTooltip) {
                this.mobileTooltip.style.opacity = '1';
                this.mobileTooltip.style.transform = 'translateY(0)';
            }
        }, 10);

        // Закрытие по клику на backdrop
        this.mobileContainer.addEventListener('click', (e) => {
            if (e.target === this.mobileContainer) {
                this.hideMobile();
            }
        });

        console.log('📱 Мобильный тултип показан');
    }

    hideMobile() {
        if (this.mobileContainer) {
            this.isMobileTooltipVisible = false;

            // Анимация скрытия
            this.mobileContainer.style.opacity = '0';
            if (this.mobileTooltip) {
                this.mobileTooltip.style.opacity = '0';
                this.mobileTooltip.style.transform = 'translateY(100px)';
            }

            // Разблокируем скролл
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            window.scrollTo(0, this.scrollTop);

            // Удаляем элементы
            setTimeout(() => {
                if (this.mobileContainer && this.mobileContainer.parentNode) {
                    this.mobileContainer.parentNode.removeChild(this.mobileContainer);
                }
                if (this.mobileTooltip && this.mobileTooltip.parentNode) {
                    this.mobileTooltip.parentNode.removeChild(this.mobileTooltip);
                }

                this.mobileContainer = null;
                this.mobileTooltip = null;
            }, 300);
        }
    }

    // ===== ОБЩИЕ МЕТОДЫ =====
    show(event, content, className = null) {
        if (this.isMobile) {
            this.showMobile(content, className || 'mobile-energy-tooltip');
        } else {
            this.showDesktop(event, content, className || 'desktop-energy-tooltip');
        }
    }

    hideAll() {
        this.hideDesktop(true);
        this.hideMobile();
    }

    hide() {
        if (this.isMobile) {
            this.hideMobile();
        } else {
            this.hideDesktop();
        }
    }

    // Деструктор для очистки
    destroy() {
        clearInterval(this.checkHoverInterval);
        this.hideAll();
    }
}

// Глобальный экземпляр
window.tooltipSystem = new TooltipSystem();