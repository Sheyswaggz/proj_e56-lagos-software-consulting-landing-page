/**
 * Lazy Loading Module
 * 
 * Implements progressive image loading using Intersection Observer API with
 * performance optimizations for Nigerian internet speeds (2G-4G networks).
 * 
 * Features:
 * - Intersection Observer for viewport detection
 * - Progressive image loading with placeholders
 * - Lazy loading for service cards and content
 * - Fallback for older browsers
 * - Loading state management
 * - Performance-optimized loading strategies
 * 
 * @module LazyLoading
 */

(function() {
  'use strict';

  /**
   * Configuration for lazy loading behavior
   */
  const CONFIG = Object.freeze({
    // Intersection Observer options
    rootMargin: '50px', // Start loading 50px before entering viewport
    threshold: 0.01, // Trigger when 1% visible
    
    // Loading behavior
    loadDelay: 100, // Delay before loading (ms) - helps with rapid scrolling
    retryAttempts: 3, // Number of retry attempts for failed loads
    retryDelay: 1000, // Delay between retries (ms)
    
    // Placeholder settings
    placeholderClass: 'lazy-placeholder',
    loadingClass: 'lazy-loading',
    loadedClass: 'lazy-loaded',
    errorClass: 'lazy-error',
    
    // Data attributes
    srcAttribute: 'data-src',
    srcsetAttribute: 'data-srcset',
    sizesAttribute: 'data-sizes',
    bgAttribute: 'data-bg',
    
    // Performance
    enableWebP: true,
    enableProgressiveJPEG: true,
  });

  /**
   * Browser capability detection
   */
  const CAPABILITIES = Object.freeze({
    intersectionObserver: 'IntersectionObserver' in window,
    webP: checkWebPSupport(),
    connectionSpeed: getConnectionSpeed(),
  });

  /**
   * Check WebP support
   * @returns {boolean} True if WebP is supported
   */
  function checkWebPSupport() {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  }

  /**
   * Get connection speed category
   * @returns {string} Connection speed category
   */
  function getConnectionSpeed() {
    if (!('connection' in navigator)) {
      return 'unknown';
    }
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = connection?.effectiveType || 'unknown';
    
    return effectiveType;
  }

  /**
   * Adjust loading strategy based on connection speed
   * @returns {Object} Adjusted configuration
   */
  function getAdaptiveConfig() {
    const speed = CAPABILITIES.connectionSpeed;
    const baseConfig = { ...CONFIG };
    
    // Adjust for slow connections
    if (speed === 'slow-2g' || speed === '2g') {
      baseConfig.rootMargin = '0px'; // Load only when in viewport
      baseConfig.loadDelay = 300; // Longer delay to avoid loading too many images
    } else if (speed === '3g') {
      baseConfig.rootMargin = '25px';
      baseConfig.loadDelay = 150;
    }
    
    return baseConfig;
  }

  /**
   * Lazy Loading Manager
   */
  class LazyLoadManager {
    constructor() {
      this.config = getAdaptiveConfig();
      this.observer = null;
      this.loadingQueue = new Set();
      this.loadedElements = new WeakSet();
      this.retryMap = new WeakMap();
      
      this.init();
    }

    /**
     * Initialize lazy loading
     */
    init() {
      if (CAPABILITIES.intersectionObserver) {
        this.setupIntersectionObserver();
      } else {
        this.setupFallback();
      }
      
      this.observeElements();
      this.setupEventListeners();
    }

    /**
     * Setup Intersection Observer
     */
    setupIntersectionObserver() {
      const options = {
        root: null,
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold,
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.handleIntersection(entry.target);
          }
        });
      }, options);
    }

    /**
     * Setup fallback for browsers without Intersection Observer
     */
    setupFallback() {
      let scrollTimeout;
      
      const checkVisibility = () => {
        const elements = document.querySelectorAll(`[${this.config.srcAttribute}], [${this.config.bgAttribute}]`);
        
        elements.forEach((element) => {
          if (this.loadedElements.has(element)) {
            return;
          }
          
          if (this.isElementInViewport(element)) {
            this.loadElement(element);
          }
        });
      };

      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(checkVisibility, 100);
      }, { passive: true });

      window.addEventListener('resize', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(checkVisibility, 100);
      }, { passive: true });

      // Initial check
      checkVisibility();
    }

    /**
     * Check if element is in viewport (fallback method)
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if element is in viewport
     */
    isElementInViewport(element) {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;
      
      const verticalMargin = parseInt(this.config.rootMargin, 10) || 0;
      
      return (
        rect.top <= windowHeight + verticalMargin &&
        rect.bottom >= -verticalMargin &&
        rect.left <= windowWidth &&
        rect.right >= 0
      );
    }

    /**
     * Observe all lazy-loadable elements
     */
    observeElements() {
      const elements = document.querySelectorAll(`[${this.config.srcAttribute}], [${this.config.bgAttribute}]`);
      
      elements.forEach((element) => {
        if (this.observer) {
          this.observer.observe(element);
        }
        
        // Add placeholder class
        element.classList.add(this.config.placeholderClass);
      });
    }

    /**
     * Handle element intersection
     * @param {HTMLElement} element - Intersecting element
     */
    handleIntersection(element) {
      if (this.loadedElements.has(element) || this.loadingQueue.has(element)) {
        return;
      }

      // Add delay to avoid loading too many images at once
      setTimeout(() => {
        if (!this.loadedElements.has(element)) {
          this.loadElement(element);
        }
      }, this.config.loadDelay);
    }

    /**
     * Load element (image or background)
     * @param {HTMLElement} element - Element to load
     */
    async loadElement(element) {
      if (this.loadedElements.has(element)) {
        return;
      }

      this.loadingQueue.add(element);
      element.classList.add(this.config.loadingClass);

      try {
        if (element.hasAttribute(this.config.srcAttribute)) {
          await this.loadImage(element);
        } else if (element.hasAttribute(this.config.bgAttribute)) {
          await this.loadBackground(element);
        }

        this.onLoadSuccess(element);
      } catch (error) {
        this.onLoadError(element, error);
      }
    }

    /**
     * Load image element
     * @param {HTMLImageElement} img - Image element
     * @returns {Promise<void>}
     */
    loadImage(img) {
      return new Promise((resolve, reject) => {
        const src = img.getAttribute(this.config.srcAttribute);
        const srcset = img.getAttribute(this.config.srcsetAttribute);
        const sizes = img.getAttribute(this.config.sizesAttribute);

        if (!src) {
          reject(new Error('No source URL provided'));
          return;
        }

        // Optimize for WebP if supported
        const optimizedSrc = this.getOptimizedSrc(src);

        const tempImg = new Image();
        
        tempImg.onload = () => {
          img.src = optimizedSrc;
          
          if (srcset) {
            img.srcset = srcset;
          }
          
          if (sizes) {
            img.sizes = sizes;
          }

          // Remove data attributes
          img.removeAttribute(this.config.srcAttribute);
          img.removeAttribute(this.config.srcsetAttribute);
          img.removeAttribute(this.config.sizesAttribute);

          resolve();
        };

        tempImg.onerror = () => {
          reject(new Error(`Failed to load image: ${optimizedSrc}`));
        };

        tempImg.src = optimizedSrc;
      });
    }

    /**
     * Load background image
     * @param {HTMLElement} element - Element with background
     * @returns {Promise<void>}
     */
    loadBackground(element) {
      return new Promise((resolve, reject) => {
        const bgUrl = element.getAttribute(this.config.bgAttribute);

        if (!bgUrl) {
          reject(new Error('No background URL provided'));
          return;
        }

        const optimizedUrl = this.getOptimizedSrc(bgUrl);

        const tempImg = new Image();
        
        tempImg.onload = () => {
          element.style.backgroundImage = `url('${optimizedUrl}')`;
          element.removeAttribute(this.config.bgAttribute);
          resolve();
        };

        tempImg.onerror = () => {
          reject(new Error(`Failed to load background: ${optimizedUrl}`));
        };

        tempImg.src = optimizedUrl;
      });
    }

    /**
     * Get optimized source URL (WebP if supported)
     * @param {string} src - Original source URL
     * @returns {string} Optimized source URL
     */
    getOptimizedSrc(src) {
      if (!CAPABILITIES.webP || !this.config.enableWebP) {
        return src;
      }

      // Check if WebP version exists (convention: replace extension with .webp)
      if (src.match(/\.(jpg|jpeg|png)$/i)) {
        return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      }

      return src;
    }

    /**
     * Handle successful load
     * @param {HTMLElement} element - Loaded element
     */
    onLoadSuccess(element) {
      this.loadingQueue.delete(element);
      this.loadedElements.add(element);
      
      element.classList.remove(this.config.placeholderClass);
      element.classList.remove(this.config.loadingClass);
      element.classList.add(this.config.loadedClass);

      if (this.observer) {
        this.observer.unobserve(element);
      }

      // Dispatch custom event
      element.dispatchEvent(new CustomEvent('lazyloaded', {
        bubbles: true,
        detail: { element },
      }));
    }

    /**
     * Handle load error with retry logic
     * @param {HTMLElement} element - Failed element
     * @param {Error} error - Error object
     */
    async onLoadError(element, error) {
      const retryCount = this.retryMap.get(element) || 0;

      if (retryCount < this.config.retryAttempts) {
        this.retryMap.set(element, retryCount + 1);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        
        this.loadingQueue.delete(element);
        this.loadElement(element);
      } else {
        // Max retries reached
        this.loadingQueue.delete(element);
        
        element.classList.remove(this.config.loadingClass);
        element.classList.add(this.config.errorClass);

        console.error('Lazy loading failed after retries:', error.message, element);

        // Dispatch error event
        element.dispatchEvent(new CustomEvent('lazyerror', {
          bubbles: true,
          detail: { element, error },
        }));
      }
    }

    /**
     * Setup event listeners for dynamic content
     */
    setupEventListeners() {
      // Re-observe elements when DOM changes
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const lazyElements = node.querySelectorAll 
                ? node.querySelectorAll(`[${this.config.srcAttribute}], [${this.config.bgAttribute}]`)
                : [];

              lazyElements.forEach((element) => {
                if (this.observer) {
                  this.observer.observe(element);
                }
                element.classList.add(this.config.placeholderClass);
              });

              // Check if the node itself is lazy-loadable
              if (node.hasAttribute && 
                  (node.hasAttribute(this.config.srcAttribute) || 
                   node.hasAttribute(this.config.bgAttribute))) {
                if (this.observer) {
                  this.observer.observe(node);
                }
                node.classList.add(this.config.placeholderClass);
              }
            }
          });
        });
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    /**
     * Manually trigger loading for specific element
     * @param {HTMLElement} element - Element to load
     */
    loadNow(element) {
      if (!this.loadedElements.has(element)) {
        this.loadElement(element);
      }
    }

    /**
     * Destroy lazy loading manager
     */
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
      
      this.loadingQueue.clear();
    }
  }

  /**
   * Initialize lazy loading when DOM is ready
   */
  function initLazyLoading() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.lazyLoadManager = new LazyLoadManager();
      });
    } else {
      window.lazyLoadManager = new LazyLoadManager();
    }
  }

  // Auto-initialize
  initLazyLoading();

  // Export for manual control if needed
  window.LazyLoadManager = LazyLoadManager;
})();