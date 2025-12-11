/**
 * Contact Form Handler
 * 
 * Production-ready form validation, submission handling, and email integration
 * for Lagos Software Consulting contact form.
 * 
 * Features:
 * - Client-side validation with real-time feedback
 * - Formspree email integration
 * - Spam protection with honeypot and rate limiting
 * - Accessibility enhancements
 * - Form state management (loading, success, error)
 * - Double submission prevention
 * - Comprehensive error handling and logging
 * 
 * @module contact-form
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = Object.freeze({
    FORMSPREE_ENDPOINT: 'https://formspree.io/f/YOUR_FORM_ID',
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    MAX_SUBMISSIONS_PER_WINDOW: 3,
    SUBMISSION_TIMEOUT: 30000, // 30 seconds
    MIN_MESSAGE_LENGTH: 20,
    MAX_MESSAGE_LENGTH: 1000,
    PHONE_PATTERN: /^[\+]?[0-9]{10,15}$/,
    NAME_PATTERN: /^[A-Za-z\s]{2,}$/,
  });

  // State management
  const state = {
    isSubmitting: false,
    submissionCount: 0,
    lastSubmissionTime: 0,
    formData: null,
  };

  // DOM elements cache
  const elements = {
    form: null,
    submitButton: null,
    buttonText: null,
    buttonSpinner: null,
    formMessage: null,
    inputs: {},
  };

  /**
   * Initialize the contact form handler
   */
  function init() {
    try {
      cacheElements();
      
      if (!elements.form) {
        logError('Contact form not found in DOM');
        return;
      }

      setupEventListeners();
      setupHoneypot();
      setupAccessibility();
      
      logInfo('Contact form initialized successfully');
    } catch (error) {
      logError('Failed to initialize contact form', error);
    }
  }

  /**
   * Cache DOM elements for performance
   */
  function cacheElements() {
    elements.form = document.getElementById('contact-form');
    
    if (!elements.form) {
      return;
    }

    elements.submitButton = elements.form.querySelector('.submit-button');
    elements.buttonText = elements.submitButton?.querySelector('.button-text');
    elements.buttonSpinner = elements.submitButton?.querySelector('.button-spinner');
    elements.formMessage = document.getElementById('form-message');

    // Cache all form inputs
    elements.inputs = {
      name: document.getElementById('name'),
      email: document.getElementById('email'),
      company: document.getElementById('company'),
      phone: document.getElementById('phone'),
      service: document.getElementById('service'),
      message: document.getElementById('message'),
    };
  }

  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    // Form submission
    elements.form.addEventListener('submit', handleSubmit);

    // Real-time validation
    Object.values(elements.inputs).forEach(input => {
      if (!input) return;

      input.addEventListener('input', handleInputChange);
      input.addEventListener('blur', handleInputBlur);
      input.addEventListener('invalid', handleInvalidInput);
    });

    // Clear custom validity on input
    elements.form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => {
        input.setCustomValidity('');
      });
    });
  }

  /**
   * Setup honeypot field for spam protection
   */
  function setupHoneypot() {
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website';
    honeypot.style.position = 'absolute';
    honeypot.style.left = '-9999px';
    honeypot.style.width = '1px';
    honeypot.style.height = '1px';
    honeypot.tabIndex = -1;
    honeypot.setAttribute('aria-hidden', 'true');
    honeypot.setAttribute('autocomplete', 'off');
    
    elements.form.appendChild(honeypot);
  }

  /**
   * Setup accessibility enhancements
   */
  function setupAccessibility() {
    // Ensure all form fields have proper ARIA attributes
    Object.entries(elements.inputs).forEach(([key, input]) => {
      if (!input) return;

      const errorId = `${key}-error`;
      const errorElement = document.getElementById(errorId);
      
      if (errorElement) {
        input.setAttribute('aria-describedby', errorId);
      }
    });

    // Add live region for form messages if not present
    if (elements.formMessage) {
      elements.formMessage.setAttribute('role', 'status');
      elements.formMessage.setAttribute('aria-live', 'polite');
      elements.formMessage.setAttribute('aria-atomic', 'true');
    }
  }

  /**
   * Handle input change events for real-time validation
   * @param {Event} event - Input event
   */
  function handleInputChange(event) {
    const input = event.target;
    
    // Clear previous error state
    clearFieldError(input);

    // Validate on change for better UX
    if (input.value.trim()) {
      validateField(input);
    }
  }

  /**
   * Handle input blur events for validation
   * @param {Event} event - Blur event
   */
  function handleInputBlur(event) {
    const input = event.target;
    
    if (input.value.trim()) {
      validateField(input);
    }
  }

  /**
   * Handle invalid input events
   * @param {Event} event - Invalid event
   */
  function handleInvalidInput(event) {
    event.preventDefault();
    const input = event.target;

    setCustomValidationMessage(input);
    showFieldError(input);
  }

  /**
   * Set custom validation messages based on validity state
   * @param {HTMLInputElement} input - Input element
   */
  function setCustomValidationMessage(input) {
    if (input.validity.valueMissing) {
      input.setCustomValidity('This field is required');
    } else if (input.validity.typeMismatch) {
      if (input.type === 'email') {
        input.setCustomValidity('Please enter a valid email address');
      } else {
        input.setCustomValidity('Please enter a valid value');
      }
    } else if (input.validity.patternMismatch) {
      input.setCustomValidity(input.title || 'Please match the requested format');
    } else if (input.validity.tooShort) {
      input.setCustomValidity(`Please enter at least ${input.minLength} characters`);
    } else if (input.validity.tooLong) {
      input.setCustomValidity(`Please enter no more than ${input.maxLength} characters`);
    }
  }

  /**
   * Validate individual form field
   * @param {HTMLInputElement} input - Input element to validate
   * @returns {boolean} - Validation result
   */
  function validateField(input) {
    const fieldName = input.name;
    const value = input.value.trim();

    // Custom validation rules
    switch (fieldName) {
      case 'name':
        if (!CONFIG.NAME_PATTERN.test(value)) {
          input.setCustomValidity('Please enter a valid name (at least 2 characters, letters only)');
          showFieldError(input);
          return false;
        }
        break;

      case 'email':
        if (!isValidEmail(value)) {
          input.setCustomValidity('Please enter a valid email address');
          showFieldError(input);
          return false;
        }
        break;

      case 'phone':
        if (value && !CONFIG.PHONE_PATTERN.test(value.replace(/[\s\-]/g, ''))) {
          input.setCustomValidity('Please enter a valid phone number (10-15 digits)');
          showFieldError(input);
          return false;
        }
        break;

      case 'message':
        if (value.length < CONFIG.MIN_MESSAGE_LENGTH) {
          input.setCustomValidity(`Please enter at least ${CONFIG.MIN_MESSAGE_LENGTH} characters`);
          showFieldError(input);
          return false;
        }
        if (value.length > CONFIG.MAX_MESSAGE_LENGTH) {
          input.setCustomValidity(`Please enter no more than ${CONFIG.MAX_MESSAGE_LENGTH} characters`);
          showFieldError(input);
          return false;
        }
        break;
    }

    // HTML5 validation
    if (!input.checkValidity()) {
      setCustomValidationMessage(input);
      showFieldError(input);
      return false;
    }

    clearFieldError(input);
    return true;
  }

  /**
   * Validate email format
   * @param {string} email - Email address to validate
   * @returns {boolean} - Validation result
   */
  function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Show field error message
   * @param {HTMLInputElement} input - Input element
   */
  function showFieldError(input) {
    const errorId = `${input.id}-error`;
    const errorElement = document.getElementById(errorId);
    
    if (errorElement) {
      errorElement.textContent = input.validationMessage;
      errorElement.style.display = 'block';
    }

    input.setAttribute('aria-invalid', 'true');
  }

  /**
   * Clear field error message
   * @param {HTMLInputElement} input - Input element
   */
  function clearFieldError(input) {
    const errorId = `${input.id}-error`;
    const errorElement = document.getElementById(errorId);
    
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }

    input.setAttribute('aria-invalid', 'false');
    input.setCustomValidity('');
  }

  /**
   * Validate entire form
   * @returns {boolean} - Validation result
   */
  function validateForm() {
    let isValid = true;

    Object.values(elements.inputs).forEach(input => {
      if (!input) return;

      if (!validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Check for spam using honeypot
   * @returns {boolean} - True if spam detected
   */
  function isSpam() {
    const honeypot = elements.form.querySelector('input[name="website"]');
    return honeypot && honeypot.value.trim() !== '';
  }

  /**
   * Check rate limiting
   * @returns {boolean} - True if rate limit exceeded
   */
  function isRateLimited() {
    const now = Date.now();
    const timeSinceLastSubmission = now - state.lastSubmissionTime;

    if (timeSinceLastSubmission > CONFIG.RATE_LIMIT_WINDOW) {
      // Reset counter if outside window
      state.submissionCount = 0;
      state.lastSubmissionTime = now;
      return false;
    }

    if (state.submissionCount >= CONFIG.MAX_SUBMISSIONS_PER_WINDOW) {
      return true;
    }

    return false;
  }

  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async function handleSubmit(event) {
    event.preventDefault();

    try {
      // Prevent double submission
      if (state.isSubmitting) {
        logWarning('Form submission already in progress');
        return;
      }

      // Clear previous messages
      clearFormMessage();

      // Validate form
      if (!validateForm()) {
        logWarning('Form validation failed');
        elements.form.reportValidity();
        return;
      }

      // Spam protection
      if (isSpam()) {
        logWarning('Spam detected via honeypot');
        showSuccessMessage(); // Show success to fool bots
        return;
      }

      // Rate limiting
      if (isRateLimited()) {
        showErrorMessage('Too many submissions. Please wait a moment and try again.');
        logWarning('Rate limit exceeded');
        return;
      }

      // Set submitting state
      setSubmittingState(true);
      state.submissionCount++;

      // Collect form data
      const formData = collectFormData();
      state.formData = formData;

      logInfo('Submitting form', { service: formData.get('service') });

      // Submit to Formspree with timeout
      const response = await submitWithTimeout(formData);

      if (response.ok) {
        handleSubmissionSuccess();
      } else {
        const errorData = await response.json().catch(() => ({}));
        handleSubmissionError(errorData);
      }

    } catch (error) {
      handleSubmissionError(error);
    } finally {
      setSubmittingState(false);
    }
  }

  /**
   * Collect form data
   * @returns {FormData} - Form data object
   */
  function collectFormData() {
    const formData = new FormData(elements.form);

    // Remove honeypot field
    formData.delete('website');

    // Add metadata
    formData.append('_subject', 'New Contact Form Submission - Lagos Software Consulting');
    formData.append('_replyto', formData.get('email'));
    formData.append('_timestamp', new Date().toISOString());
    formData.append('_source', 'Lagos Software Consulting Website');

    return formData;
  }

  /**
   * Submit form data with timeout
   * @param {FormData} formData - Form data to submit
   * @returns {Promise<Response>} - Fetch response
   */
  function submitWithTimeout(formData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.SUBMISSION_TIMEOUT);

    return fetch(CONFIG.FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId);
    });
  }

  /**
   * Handle successful form submission
   */
  function handleSubmissionSuccess() {
    logInfo('Form submitted successfully');
    
    showSuccessMessage();
    resetForm();

    // Track success (if analytics available)
    if (typeof gtag === 'function') {
      gtag('event', 'form_submission', {
        event_category: 'contact',
        event_label: 'success'
      });
    }
  }

  /**
   * Handle form submission error
   * @param {Error|Object} error - Error object or data
   */
  function handleSubmissionError(error) {
    logError('Form submission failed', error);

    if (error.name === 'AbortError') {
      showErrorMessage('Request timed out. Please check your connection and try again.');
    } else if (error.message) {
      showErrorMessage('Oops! There was a problem submitting your form. Please try again or email us directly.');
    } else {
      showErrorMessage('An unexpected error occurred. Please try again later.');
    }

    // Track error (if analytics available)
    if (typeof gtag === 'function') {
      gtag('event', 'form_submission', {
        event_category: 'contact',
        event_label: 'error',
        event_value: error.message || 'unknown'
      });
    }
  }

  /**
   * Set form submitting state
   * @param {boolean} isSubmitting - Submitting state
   */
  function setSubmittingState(isSubmitting) {
    state.isSubmitting = isSubmitting;

    if (elements.submitButton) {
      elements.submitButton.disabled = isSubmitting;
      elements.submitButton.setAttribute('aria-busy', isSubmitting.toString());
    }

    // Update button text for screen readers
    if (elements.buttonText) {
      elements.buttonText.textContent = isSubmitting ? 'Sending...' : 'Send Message';
    }
  }

  /**
   * Show success message
   */
  function showSuccessMessage() {
    if (!elements.formMessage) return;

    elements.formMessage.className = 'form-message success';
    elements.formMessage.textContent = 'Thank you for your message! We will get back to you within 24 hours.';
    elements.formMessage.setAttribute('role', 'status');

    // Announce to screen readers
    announceToScreenReader('Form submitted successfully. Thank you for your message.');
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  function showErrorMessage(message) {
    if (!elements.formMessage) return;

    elements.formMessage.className = 'form-message error';
    elements.formMessage.textContent = message;
    elements.formMessage.setAttribute('role', 'alert');

    // Announce to screen readers
    announceToScreenReader(`Error: ${message}`);
  }

  /**
   * Clear form message
   */
  function clearFormMessage() {
    if (!elements.formMessage) return;

    elements.formMessage.className = 'form-message';
    elements.formMessage.textContent = '';
  }

  /**
   * Reset form to initial state
   */
  function resetForm() {
    elements.form.reset();

    // Clear all error states
    Object.values(elements.inputs).forEach(input => {
      if (input) {
        clearFieldError(input);
      }
    });

    // Reset state
    state.formData = null;

    // Focus on first field for better UX
    if (elements.inputs.name) {
      elements.inputs.name.focus();
    }
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  function logInfo(message, context = {}) {
    console.log('[ContactForm]', message, context);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  function logWarning(message, context = {}) {
    console.warn('[ContactForm]', message, context);
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error} error - Error object
   */
  function logError(message, error = null) {
    console.error('[ContactForm]', message, error);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose public API for testing and external control
  window.ContactForm = Object.freeze({
    validateForm,
    resetForm,
    getState: () => ({ ...state }),
  });

})();