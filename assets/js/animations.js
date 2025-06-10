/**
 * Animations and transitions module
 */

// Animation durations
const DURATIONS = {
    FADE: 300,
    SLIDE: 500,
    COUNT: 1000,
    CHART: 800
};

// Easing functions
const EASING = {
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeOutBack: t => 1 + (--t) * t * (2.5 * t + 0.5)
};

/**
 * Animate a number counting up/down
 * @param {HTMLElement} element - The element to update
 * @param {number} target - Target number
 * @param {number} duration - Animation duration in ms
 * @param {function} easing - Easing function
 */
export function animateNumber(element, target, duration = DURATIONS.COUNT, easing = EASING.easeOutQuart) {
    const start = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const startTime = performance.now();
    
    const animate = currentTime => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easedProgress = easing(progress);
        const current = Math.round(start + (target - start) * easedProgress);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

/**
 * Fade in element
 * @param {HTMLElement} element - Element to fade in
 * @param {number} duration - Animation duration in ms
 */
export function fadeIn(element, duration = DURATIONS.FADE) {
    element.style.opacity = '0';
    element.style.display = '';
    
    requestAnimationFrame(() => {
        element.style.transition = `opacity ${duration}ms ease-out`;
        element.style.opacity = '1';
    });
}

/**
 * Fade out element
 * @param {HTMLElement} element - Element to fade out
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Resolves when animation completes
 */
export function fadeOut(element, duration = DURATIONS.FADE) {
    return new Promise(resolve => {
        element.style.transition = `opacity ${duration}ms ease-out`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.display = 'none';
            resolve();
        }, duration);
    });
}

/**
 * Slide down element
 * @param {HTMLElement} element - Element to slide down
 * @param {number} duration - Animation duration in ms
 */
export function slideDown(element, duration = DURATIONS.SLIDE) {
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.style.display = '';
    
    const targetHeight = element.scrollHeight;
    
    requestAnimationFrame(() => {
        element.style.transition = `height ${duration}ms ${EASING.easeOutBack}`;
        element.style.height = `${targetHeight}px`;
        
        setTimeout(() => {
            element.style.height = '';
            element.style.overflow = '';
        }, duration);
    });
}

/**
 * Slide up element
 * @param {HTMLElement} element - Element to slide up
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Resolves when animation completes
 */
export function slideUp(element, duration = DURATIONS.SLIDE) {
    return new Promise(resolve => {
        element.style.height = `${element.scrollHeight}px`;
        element.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            element.style.transition = `height ${duration}ms ${EASING.easeInOutQuart}`;
            element.style.height = '0';
            
            setTimeout(() => {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
                resolve();
            }, duration);
        });
    });
}

/**
 * Scale in element
 * @param {HTMLElement} element - Element to scale in
 * @param {number} duration - Animation duration in ms
 */
export function scaleIn(element, duration = DURATIONS.FADE) {
    element.style.opacity = '0';
    element.style.transform = 'scale(0.95)';
    element.style.display = '';
    
    requestAnimationFrame(() => {
        element.style.transition = `
            opacity ${duration}ms ease-out,
            transform ${duration}ms ${EASING.easeOutBack}
        `;
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
    });
}

/**
 * Scale out element
 * @param {HTMLElement} element - Element to scale out
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Resolves when animation completes
 */
export function scaleOut(element, duration = DURATIONS.FADE) {
    return new Promise(resolve => {
        element.style.transition = `
            opacity ${duration}ms ease-out,
            transform ${duration}ms ${EASING.easeInOutQuart}
        `;
        element.style.opacity = '0';
        element.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            element.style.display = 'none';
            resolve();
        }, duration);
    });
}

/**
 * Stagger animate children
 * @param {HTMLElement} container - Container element
 * @param {string} selector - Child elements selector
 * @param {function} animation - Animation function to apply
 * @param {number} staggerDelay - Delay between each animation
 */
export function staggerAnimate(container, selector, animation, staggerDelay = 50) {
    const elements = container.querySelectorAll(selector);
    elements.forEach((element, index) => {
        setTimeout(() => animation(element), index * staggerDelay);
    });
}

/**
 * Update element with slide transition
 * @param {HTMLElement} element - Element to update
 * @param {string} content - New content
 * @param {number} duration - Animation duration in ms
 */
export function updateWithSlide(element, content, duration = DURATIONS.FADE) {
    element.style.transform = 'translateY(-100%)';
    element.style.opacity = '0';
    
    setTimeout(() => {
        element.innerHTML = content;
        
        requestAnimationFrame(() => {
            element.style.transition = `
                transform ${duration}ms ${EASING.easeOutBack},
                opacity ${duration}ms ease-out
            `;
            element.style.transform = 'translateY(0)';
            element.style.opacity = '1';
        });
    }, duration);
}

// Export animation durations and easing functions
export { DURATIONS, EASING }; 