// js/charts/tooltip.js
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
        
        this.isHoveringTarget = false;
        this.isHoveringTooltip = false;

        this.setupGlobalListeners();
    }

    setupGlobalListeners() {
        window.addEventListener('resize', () => {
            const newIsMobile = window.innerWidth <= 768;
            if (newIsMobile !== this.isMobile) {
                this.isMobile = newIsMobile;
                this.hideAll();
            }
        });

        window.addEventListener('scroll', () => {
            if (!this.isMobile && this.desktopTooltip) this.handleDesktopScroll();
        }, { passive: true });
        
        document.addEventListener('click', (e) => {
            if (this.isMobile) return;
            const isClickOnTarget = e.target.closest('.energy-day:not(.empty)');
            if (!isClickOnTarget && this.desktopTooltip) this.hideDesktop();
        }, true);
    }
    
    handleDesktopScroll() {
        if (Math.abs(window.pageYOffset - this.lastScrollTop) > 5) {
            this.hideDesktop();
        }
        this.lastScrollTop = window.pageYOffset;
    }

    showDesktop(event, content, className = 'desktop-energy-tooltip') {
        const target = event.target.closest('.energy-day:not(.empty)');
        if (!target || this.currentHoverTarget === target) return;

        this.currentHoverTarget = target;
        this.hideDesktop(true);

        this.desktopTooltip = document.createElement('div');
        this.desktopTooltip.className = className;
        this.desktopTooltip.innerHTML = content;
        // ... (остальные стили и логика для десктопного тултипа)
        document.body.appendChild(this.desktopTooltip);
        this.positionDesktop(event);
        
        this.desktopTooltip.style.opacity = '1';
        this.isHoveringTarget = true;
    }

    positionDesktop(event) { /* ... логика позиционирования ... */ }

    hideDesktop(immediate = false) {
        if (!this.desktopTooltip) return;
        if (immediate) {
            this.desktopTooltip.remove();
            this.desktopTooltip = null;
        } else {
            this.desktopTooltip.style.opacity = '0';
            setTimeout(() => {
                if (this.desktopTooltip) this.desktopTooltip.remove();
                this.desktopTooltip = null;
            }, 150);
        }
        this.currentHoverTarget = null;
    }

    showMobile(content, className = 'mobile-energy-tooltip') {
        if (this.isMobileTooltipVisible) {
            this.hideMobile();
            return;
        }
        // ... (логика создания мобильного тултипа и бэкдропа) ...
    }

    hideMobile() {
        // ... (логика скрытия мобильного тултипа) ...
    }

    show(event, content, className = null) {
        if (this.isMobile) {
            this.showMobile(content, className);
        } else {
            this.showDesktop(event, content, className);
        }
    }
    
    hideAll() { this.hideDesktop(true); this.hideMobile(); }
}

window.tooltipSystem = new TooltipSystem();