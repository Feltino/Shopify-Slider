class ProductTimeline {
    constructor(root) {
        this.root = root;
        this.triggers = Array.from(root.querySelectorAll('[data-timeline-trigger]'));
        this.panels = Array.from(root.querySelectorAll('[data-timeline-panel]'));
        this.progress = root.querySelector('.product-timeline__line-progress');

        this.autoplay = root.dataset.autoplay === 'true';
        this.autoplaySpeed = parseInt(root.dataset.autoplaySpeed, 10) || 6000;
        this.timer = null;
        this.activeIndex = 0;

        this.bindEvents();
        this.updateProgress();

        if (this.autoplay) {
            this.startAutoplay();
        }
    }

    bindEvents() {
        this.triggers.forEach((trigger, index) => {
            trigger.addEventListener('click', () => {
                this.activate(trigger.dataset.target, index);
                this.stopAutoplay();
            });
        });

        // Keyboard arrow support for accessibility (a11y)
        this.root.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
            event.preventDefault();
            const delta = event.key === 'ArrowRight' ? 1 : -1;
            const nextIndex = (this.activeIndex + delta + this.triggers.length) % this.triggers.length;
            const nextTrigger = this.triggers[nextIndex];
            nextTrigger.focus();
            this.activate(nextTrigger.dataset.target, nextIndex);
        });
    }

    activate(targetId, index) {
        this.activeIndex = index;

        this.triggers.forEach((trigger) => {
            const isActive = trigger.dataset.target === targetId;
            trigger.classList.toggle('is-active', isActive);
            trigger.setAttribute('aria-selected', String(isActive));
        });

        this.panels.forEach((panel) => {
            const isActive = panel.dataset.target === targetId;
            panel.classList.toggle('is-active', isActive);
            panel.toggleAttribute('hidden', !isActive);

            // Lazy -> eager switch for newly active image to improve loading
            if (isActive) {
                const img = panel.querySelector('img');
                if (img) img.loading = 'eager';
            }
        });

        this.updateProgress();

        this.root.dispatchEvent(
            new CustomEvent('timeline:change', { detail: { targetId, index } })
        );
    }

    updateProgress() {
        if (!this.progress || this.triggers.length < 2) return;
        const percent = (this.activeIndex / (this.triggers.length - 1)) * 100;
        this.progress.style.width = `${percent}%`;
    }

    startAutoplay() {
        this.timer = window.setInterval(() => {
            const nextIndex = (this.activeIndex + 1) % this.triggers.length;
            const nextTrigger = this.triggers[nextIndex];
            this.activate(nextTrigger.dataset.target, nextIndex);
        }, this.autoplaySpeed);
    }

    stopAutoplay() {
        if (this.timer) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }
}

function initProductTimelines() {
    document.querySelectorAll('[data-product-timeline]').forEach((root) => {
        if (root.dataset.ptInitialized) return;
        root.dataset.ptInitialized = 'true';
        new ProductTimeline(root);
    });
}

document.addEventListener('DOMContentLoaded', initProductTimelines);

// Re-initialize after editing the section in the Theme Editor
document.addEventListener('shopify:section:load', (event) => {
    const root = event.target.querySelector('[data-product-timeline]');
    if (root) new ProductTimeline(root);
});