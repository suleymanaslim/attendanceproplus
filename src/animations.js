// ===== ANIMATION UTILITIES =====
// Native-app feel animations: page transitions, bottom sheet, pull-to-refresh

// ===== VIEW TRANSITIONS (page navigation) =====
let navigationDirection = 'forward'; // 'forward' | 'back'

export function setNavigationDirection(dir) {
    navigationDirection = dir;
}

export function getNavigationDirection() {
    return navigationDirection;
}

/**
 * Navigate with View Transition API (graceful fallback)
 * @param {Function} updateDOM - function that updates the DOM
 */
export function animatePageTransition(updateDOM) {
    if (document.startViewTransition) {
        const transition = document.startViewTransition(() => {
            updateDOM();
        });
        return transition;
    } else {
        updateDOM();
        return null;
    }
}

// ===== STAGGERED ENTRANCE ANIMATIONS =====
/**
 * Observe elements and animate them in with stagger as they become visible
 * @param {string} selector - CSS selector for target elements
 * @param {object} options - animation options
 */
export function observeAndAnimate(container, selector = '.animate-on-scroll', options = {}) {
    const {
        threshold = 0.1,
        staggerDelay = 60,
        duration = 400,
        distance = 20,
        easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    } = options;

    const elements = container.querySelectorAll(selector);
    if (!elements.length) return;

    let index = 0;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = index * staggerDelay;
                el.style.transition = `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`;
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                observer.unobserve(el);
                index++;
            }
        });
    }, { threshold });

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = `translateY(${distance}px)`;
        observer.observe(el);
    });
}

// ===== BOTTOM SHEET =====
/**
 * Create a swipeable bottom sheet with drag-to-dismiss
 * @param {string} contentHTML - HTML content for the sheet
 * @param {object} options - sheet options
 * @returns {object} { overlay, destroy }
 */
export function createBottomSheet(contentHTML, options = {}) {
    const { onClose, maxHeight = '85vh' } = options;

    const overlay = document.createElement('div');
    overlay.className = 'bottom-sheet-overlay';

    const sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';
    sheet.style.maxHeight = maxHeight;

    sheet.innerHTML = `
    <div class="bottom-sheet-handle-area">
      <div class="bottom-sheet-handle"></div>
    </div>
    <div class="bottom-sheet-body">${contentHTML}</div>
  `;

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
        overlay.classList.add('active');
        sheet.classList.add('active');
    });

    // Touch drag to dismiss
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handleArea = sheet.querySelector('.bottom-sheet-handle-area');

    handleArea.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        sheet.style.transition = 'none';
    }, { passive: true });

    handleArea.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const diff = Math.max(0, currentY - startY);
        sheet.style.transform = `translateY(${diff}px)`;
        overlay.style.opacity = `${1 - diff / 400}`;
    }, { passive: true });

    handleArea.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        const diff = currentY - startY;
        sheet.style.transition = '';

        if (diff > 100) {
            destroy();
        } else {
            sheet.style.transform = '';
            overlay.style.opacity = '';
        }
    });

    function destroy() {
        sheet.classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.remove();
            if (onClose) onClose();
        }, 300);
    }

    // Tap overlay to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) destroy();
    });

    return { overlay, sheet, destroy };
}

// ===== ANIMATED COUNTER =====
/**
 * Animate a number from 0 to target
 */
export function animateCounter(element, target, duration = 600) {
    let start = 0;
    const startTime = performance.now();

    function step(timestamp) {
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = Math.round(eased * target);
        element.textContent = current;
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// ===== PRESS FEEDBACK =====
/**
 * Add press-down scale effect to interactive elements
 */
export function addPressFeedback(container, selector = '.card-interactive, .btn') {
    container.querySelectorAll(selector).forEach(el => {
        el.addEventListener('touchstart', () => {
            el.style.transform = 'scale(0.97)';
            el.style.transition = 'transform 0.1s ease';
        }, { passive: true });

        el.addEventListener('touchend', () => {
            el.style.transform = '';
            el.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }, { passive: true });

        el.addEventListener('touchcancel', () => {
            el.style.transform = '';
        }, { passive: true });
    });
}

// ===== NAV INDICATOR ANIMATION =====
/**
 * Animate the bottom nav active indicator sliding
 */
export function animateNavIndicator(nav, activeButton) {
    let indicator = nav.querySelector('.nav-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'nav-indicator';
        nav.style.position = 'relative';
        nav.appendChild(indicator);
    }

    const rect = activeButton.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const left = rect.left - navRect.left + rect.width / 2 - 16;

    indicator.style.transform = `translateX(${left}px)`;
}
