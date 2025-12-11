/**
 * Enhanced animations script for Lagos Software Consulting
 * Provides service card interactions, scroll effects, and accessibility support
 * 
 * @generated-from: task-id:6b99e6c0-cc72-41ae-8cee-c3b630687600
 * @modifies: js/animations.js
 * @dependencies: ["index.html", "styles/main.css"]
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    INTERSECTION_THRESHOLD: 0.1,
    INTERSECTION_ROOT_MARGIN: '0px 0px -100px 0px',
    DEBOUNCE_DELAY: 150,
    ANIMATION_DURATION: 300,
    REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
    CARD_SELECTOR: '.service-card',
    EXPANDABLE_CONTENT_CLASS: 'service-card-expanded',
    VISIBLE_CLASS: 'animate-in',
    FOCUS_VISIBLE_CLASS: 'focus-visible-active'
  };

  // State management
  const state = {
    expandedCards: new WeakSet(),
    observedElements: new WeakSet(),
    prefersReducedMotion: false,
    isInitialized: false
  };

  /**
   * Utility: Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Check if user prefers reduced motion
   * @returns {boolean} True if reduced motion is preferred
   */
  function checkReducedMotion() {
    return window.matchMedia(CONFIG.REDUCED_MOTION_QUERY).matches;
  }

  /**
   * Initialize scroll-triggered animations using Intersection Observer
   */
  function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements immediately
      document.querySelectorAll(CONFIG.CARD_SELECTOR).forEach(card => {
        card.classList.add(CONFIG.VISIBLE_CLASS);
      });
      return;
    }

    const observerOptions = {
      threshold: CONFIG.INTERSECTION_THRESHOLD,
      rootMargin: CONFIG.INTERSECTION_ROOT_MARGIN
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !state.observedElements.has(entry.target)) {
          if (state.prefersReducedMotion) {
            entry.target.classList.add(CONFIG.VISIBLE_CLASS);
          } else {
            // Stagger animation for visual appeal
            const delay = Array.from(entry.target.parentElement.children)
              .indexOf(entry.target) * 100;
            
            setTimeout(() => {
              entry.target.classList.add(CONFIG.VISIBLE_CLASS);
            }, delay);
          }
          
          state.observedElements.add(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all service cards
    document.querySelectorAll(CONFIG.CARD_SELECTOR).forEach(card => {
      observer.observe(card);
    });
  }

  /**
   * Handle service card expand/collapse interaction
   * @param {HTMLElement} card - Service card element
   */
  function toggleCardExpansion(card) {
    const isExpanded = state.expandedCards.has(card);
    const expandableContent = card.querySelector('.service-benefits, .service-technologies');
    
    if (!expandableContent) return;

    if (isExpanded) {
      // Collapse
      card.classList.remove(CONFIG.EXPANDABLE_CONTENT_CLASS);
      card.setAttribute('aria-expanded', 'false');
      state.expandedCards.delete(card);
      
      if (!state.prefersReducedMotion) {
        expandableContent.style.maxHeight = '0';
        expandableContent.style.opacity = '0';
      }
    } else {
      // Expand
      card.classList.add(CONFIG.EXPANDABLE_CONTENT_CLASS);
      card.setAttribute('aria-expanded', 'true');
      state.expandedCards.add(card);
      
      if (!state.prefersReducedMotion) {
        expandableContent.style.maxHeight = expandableContent.scrollHeight + 'px';
        expandableContent.style.opacity = '1';
      }
    }
  }

  /**
   * Initialize service card interactions
   */
  function initServiceCardInteractions() {
    const cards = document.querySelectorAll(CONFIG.CARD_SELECTOR);
    
    cards.forEach(card => {
      // Make cards keyboard accessible
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
      }
      card.setAttribute('role', 'button');
      card.setAttribute('aria-expanded', 'false');

      // Click handler
      card.addEventListener('click', (e) => {
        // Don't toggle if clicking on links or buttons inside card
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
          return;
        }
        toggleCardExpansion(card);
      });

      // Keyboard handler
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCardExpansion(card);
        }
      });

      // Touch support for mobile
      let touchStartY = 0;
      card.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      card.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const touchDiff = Math.abs(touchEndY - touchStartY);
        
        // Only toggle if it's a tap, not a scroll
        if (touchDiff < 10) {
          toggleCardExpansion(card);
        }
      }, { passive: true });

      // Focus visible support
      card.addEventListener('focus', () => {
        card.classList.add(CONFIG.FOCUS_VISIBLE_CLASS);
      });

      card.addEventListener('blur', () => {
        card.classList.remove(CONFIG.FOCUS_VISIBLE_CLASS);
      });
    });
  }

  /**
   * Lazy load service card content when visible
   */
  function initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const lazyLoadObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const lazyContent = card.querySelectorAll('[data-lazy-load]');
          
          lazyContent.forEach(element => {
            element.removeAttribute('data-lazy-load');
            element.style.visibility = 'visible';
          });
          
          lazyLoadObserver.unobserve(card);
        }
      });
    }, {
      rootMargin: '50px'
    });

    document.querySelectorAll(CONFIG.CARD_SELECTOR).forEach(card => {
      lazyLoadObserver.observe(card);
    });
  }

  /**
   * Handle smooth scroll to sections
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (!target) return;
        
        e.preventDefault();
        
        if (state.prefersReducedMotion) {
          target.scrollIntoView();
        } else {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
        
        // Update focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus();
      });
    });
  }

  /**
   * Monitor reduced motion preference changes
   */
  function initReducedMotionListener() {
    const mediaQuery = window.matchMedia(CONFIG.REDUCED_MOTION_QUERY);
    
    const handleChange = (e) => {
      state.prefersReducedMotion = e.matches;
      
      // Update all animated elements
      if (state.prefersReducedMotion) {
        document.querySelectorAll(CONFIG.CARD_SELECTOR).forEach(card => {
          card.style.transition = 'none';
        });
      } else {
        document.querySelectorAll(CONFIG.CARD_SELECTOR).forEach(card => {
          card.style.transition = '';
        });
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Initial check
    state.prefersReducedMotion = mediaQuery.matches;
  }

  /**
   * Performance optimization: Use requestIdleCallback for non-critical work
   * @param {Function} callback - Function to execute when idle
   */
  function scheduleIdleTask(callback) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 1);
    }
  }

  /**
   * Initialize all animations and interactions
   */
  function init() {
    if (state.isInitialized) {
      return;
    }

    // Check document ready state
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    state.isInitialized = true;

    // Initialize reduced motion detection first
    initReducedMotionListener();

    // Critical path: scroll animations and card interactions
    initScrollAnimations();
    initServiceCardInteractions();
    initSmoothScroll();

    // Non-critical: lazy loading
    scheduleIdleTask(() => {
      initLazyLoading();
    });

    // Handle window resize with debouncing
    const handleResize = debounce(() => {
      // Recalculate any size-dependent animations
      document.querySelectorAll(`.${CONFIG.EXPANDABLE_CONTENT_CLASS}`).forEach(card => {
        const expandableContent = card.querySelector('.service-benefits, .service-technologies');
        if (expandableContent && !state.prefersReducedMotion) {
          expandableContent.style.maxHeight = expandableContent.scrollHeight + 'px';
        }
      });
    }, CONFIG.DEBOUNCE_DELAY);

    window.addEventListener('resize', handleResize, { passive: true });
  }

  // Auto-initialize
  init();

  // Expose public API for external control if needed
  window.LagosAnimations = {
    init,
    toggleCard: toggleCardExpansion,
    checkReducedMotion
  };
})();