/**
 * animations.js
 * Scroll-triggered animations and interactive elements for company overview section
 * 
 * Features:
 * - Intersection Observer API for scroll-triggered animations
 * - Smooth scrolling between sections
 * - Image lazy loading
 * - Responsive navigation behavior
 * - Performance-optimized for mobile devices
 * 
 * @generated-from: task-id:TASK-002
 * @modifies: index.html company overview section
 * @dependencies: []
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    intersectionThreshold: 0.15,
    intersectionRootMargin: '0px 0px -10% 0px',
    smoothScrollBehavior: 'smooth',
    lazyLoadRootMargin: '50px 0px',
    debounceDelay: 150,
    animationClass: 'animate-in',
    visibleClass: 'is-visible',
    loadedClass: 'is-loaded',
    mobileBreakpoint: 768,
  };

  // State management
  const state = {
    observers: new Map(),
    isReducedMotion: false,
    isMobile: false,
    scrollTimeout: null,
    resizeTimeout: null,
  };

  /**
   * Initialize all animations and interactive features
   */
  function init() {
    try {
      checkReducedMotion();
      checkMobileDevice();
      setupIntersectionObserver();
      setupLazyLoading();
      setupSmoothScrolling();
      setupNavigationBehavior();
      setupEventListeners();
      
      console.log('[Animations] Initialized successfully');
    } catch (error) {
      console.error('[Animations] Initialization failed:', error);
    }
  }

  /**
   * Check if user prefers reduced motion
   */
  function checkReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    state.isReducedMotion = mediaQuery.matches;

    mediaQuery.addEventListener('change', function(e) {
      state.isReducedMotion = e.matches;
      if (state.isReducedMotion) {
        disableAnimations();
      }
    });
  }

  /**
   * Check if device is mobile
   */
  function checkMobileDevice() {
    state.isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
  }

  /**
   * Disable all animations for reduced motion preference
   */
  function disableAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach(function(element) {
      element.classList.add(CONFIG.visibleClass);
      element.style.opacity = '1';
      element.style.transform = 'none';
    });
  }

  /**
   * Setup Intersection Observer for scroll-triggered animations
   */
  function setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      console.warn('[Animations] IntersectionObserver not supported, falling back to immediate display');
      fallbackToImmediateDisplay();
      return;
    }

    const observerOptions = {
      threshold: CONFIG.intersectionThreshold,
      rootMargin: CONFIG.intersectionRootMargin,
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    state.observers.set('scroll', observer);

    // Observe elements that should animate on scroll
    const animatableSelectors = [
      '.value-card',
      '.team-member',
      '.testimonial-card',
      '.timeline-item',
      '.indicator',
      '.mission-statement',
      '.lagos-expertise',
    ];

    animatableSelectors.forEach(function(selector) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(function(element) {
        if (!state.isReducedMotion) {
          element.setAttribute('data-animate', 'true');
          observer.observe(element);
        } else {
          element.classList.add(CONFIG.visibleClass);
        }
      });
    });
  }

  /**
   * Handle intersection observer callback
   * @param {IntersectionObserverEntry[]} entries
   */
  function handleIntersection(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // Add visible class with slight delay for stagger effect
        requestAnimationFrame(function() {
          element.classList.add(CONFIG.visibleClass);
          element.classList.add(CONFIG.animationClass);
        });

        // Unobserve after animation to improve performance
        const observer = state.observers.get('scroll');
        if (observer) {
          observer.unobserve(element);
        }
      }
    });
  }

  /**
   * Fallback for browsers without IntersectionObserver
   */
  function fallbackToImmediateDisplay() {
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(function(element) {
      element.classList.add(CONFIG.visibleClass);
    });
  }

  /**
   * Setup lazy loading for images
   */
  function setupLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      console.warn('[Animations] IntersectionObserver not supported, loading all images immediately');
      loadAllImages();
      return;
    }

    const lazyLoadOptions = {
      rootMargin: CONFIG.lazyLoadRootMargin,
      threshold: 0.01,
    };

    const lazyLoadObserver = new IntersectionObserver(handleLazyLoad, lazyLoadOptions);
    state.observers.set('lazyload', lazyLoadObserver);

    const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    lazyImages.forEach(function(img) {
      lazyLoadObserver.observe(img);
    });
  }

  /**
   * Handle lazy load intersection
   * @param {IntersectionObserverEntry[]} entries
   */
  function handleLazyLoad(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const img = entry.target;
        loadImage(img);
        
        const observer = state.observers.get('lazyload');
        if (observer) {
          observer.unobserve(img);
        }
      }
    });
  }

  /**
   * Load a single image
   * @param {HTMLImageElement} img
   */
  function loadImage(img) {
    const src = img.getAttribute('data-src') || img.src;
    
    if (!src) {
      return;
    }

    const tempImg = new Image();
    
    tempImg.onload = function() {
      img.src = src;
      img.classList.add(CONFIG.loadedClass);
      img.removeAttribute('data-src');
    };

    tempImg.onerror = function() {
      console.error('[Animations] Failed to load image:', src);
      img.classList.add('load-error');
    };

    tempImg.src = src;
  }

  /**
   * Load all images immediately (fallback)
   */
  function loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(loadImage);
  }

  /**
   * Setup smooth scrolling for navigation links
   */
  function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(function(link) {
      link.addEventListener('click', handleSmoothScroll);
    });
  }

  /**
   * Handle smooth scroll click
   * @param {Event} e
   */
  function handleSmoothScroll(e) {
    const href = e.currentTarget.getAttribute('href');
    
    if (!href || href === '#') {
      return;
    }

    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);

    if (!targetElement) {
      return;
    }

    e.preventDefault();

    // Use native smooth scroll if supported
    if ('scrollBehavior' in document.documentElement.style) {
      targetElement.scrollIntoView({
        behavior: CONFIG.smoothScrollBehavior,
        block: 'start',
      });
    } else {
      // Fallback for older browsers
      smoothScrollTo(targetElement);
    }

    // Update URL without triggering scroll
    if (history.pushState) {
      history.pushState(null, null, href);
    }

    // Update aria-current for accessibility
    updateNavigationState(e.currentTarget);
  }

  /**
   * Smooth scroll fallback for older browsers
   * @param {HTMLElement} target
   */
  function smoothScrollTo(target) {
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 800;
    let start = null;

    function animation(currentTime) {
      if (start === null) {
        start = currentTime;
      }
      
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      
      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    }

    requestAnimationFrame(animation);
  }

  /**
   * Easing function for smooth scroll
   * @param {number} t - Progress (0 to 1)
   * @returns {number}
   */
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Update navigation state for accessibility
   * @param {HTMLElement} activeLink
   */
  function updateNavigationState(activeLink) {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(function(link) {
      link.removeAttribute('aria-current');
    });

    activeLink.setAttribute('aria-current', 'page');
  }

  /**
   * Setup responsive navigation behavior
   */
  function setupNavigationBehavior() {
    const header = document.querySelector('header');
    
    if (!header) {
      return;
    }

    let lastScrollTop = 0;
    let scrollDirection = 'down';

    window.addEventListener('scroll', function() {
      if (state.scrollTimeout) {
        clearTimeout(state.scrollTimeout);
      }

      state.scrollTimeout = setTimeout(function() {
        handleNavigationScroll(header, lastScrollTop, scrollDirection);
        lastScrollTop = window.pageYOffset;
      }, CONFIG.debounceDelay);
    }, { passive: true });
  }

  /**
   * Handle navigation scroll behavior
   * @param {HTMLElement} header
   * @param {number} lastScrollTop
   * @param {string} scrollDirection
   */
  function handleNavigationScroll(header, lastScrollTop, scrollDirection) {
    const currentScrollTop = window.pageYOffset;

    if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
      // Scrolling down
      scrollDirection = 'down';
      if (state.isMobile) {
        header.style.transform = 'translateY(-100%)';
      }
    } else {
      // Scrolling up
      scrollDirection = 'up';
      header.style.transform = 'translateY(0)';
    }

    // Add shadow when scrolled
    if (currentScrollTop > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  /**
   * Setup global event listeners
   */
  function setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', debounce(handleResize, CONFIG.debounceDelay), { passive: true });

    // Handle visibility change for performance
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle page load complete
    if (document.readyState === 'complete') {
      handlePageLoad();
    } else {
      window.addEventListener('load', handlePageLoad);
    }
  }

  /**
   * Handle window resize
   */
  function handleResize() {
    const wasMobile = state.isMobile;
    checkMobileDevice();

    if (wasMobile !== state.isMobile) {
      console.log('[Animations] Device type changed, reinitializing');
      cleanup();
      init();
    }
  }

  /**
   * Handle visibility change for performance optimization
   */
  function handleVisibilityChange() {
    if (document.hidden) {
      // Pause animations when page is hidden
      pauseAnimations();
    } else {
      // Resume animations when page is visible
      resumeAnimations();
    }
  }

  /**
   * Handle page load complete
   */
  function handlePageLoad() {
    console.log('[Animations] Page fully loaded');
    
    // Trigger any animations that should happen on load
    const loadAnimations = document.querySelectorAll('[data-animate-on-load]');
    loadAnimations.forEach(function(element) {
      element.classList.add(CONFIG.visibleClass);
    });
  }

  /**
   * Pause animations for performance
   */
  function pauseAnimations() {
    state.observers.forEach(function(observer) {
      observer.disconnect();
    });
  }

  /**
   * Resume animations
   */
  function resumeAnimations() {
    setupIntersectionObserver();
    setupLazyLoading();
  }

  /**
   * Debounce utility function
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction() {
      const context = this;
      const args = arguments;
      
      const later = function() {
        timeout = null;
        func.apply(context, args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Cleanup function for observers and event listeners
   */
  function cleanup() {
    state.observers.forEach(function(observer) {
      observer.disconnect();
    });
    state.observers.clear();

    if (state.scrollTimeout) {
      clearTimeout(state.scrollTimeout);
    }

    if (state.resizeTimeout) {
      clearTimeout(state.resizeTimeout);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);

  // Expose cleanup for testing purposes
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init, cleanup };
  }

})();