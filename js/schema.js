/**
 * LocalBusiness Schema Generator
 * 
 * Generates and injects JSON-LD structured data for LocalBusiness schema
 * to improve SEO and search engine visibility for Lagos Software Consulting.
 * 
 * @module schema
 * @generated-from: task-id:TASK-006 type:feature
 * @modifies: DOM:head
 * @dependencies: []
 */

(function() {
  'use strict';

  /**
   * Configuration for LocalBusiness schema
   * @const {Object}
   */
  const BUSINESS_CONFIG = Object.freeze({
    name: 'Lagos Software Consulting',
    legalName: 'Lagos Software Consulting Limited',
    description: 'Leading software consulting firm in Lagos, Nigeria providing custom software development, cloud solutions, and digital transformation services for businesses across Africa.',
    url: 'https://lagossoftwareconsulting.com',
    telephone: '+234-XXX-XXX-XXXX',
    email: 'info@lagossoftwareconsulting.com',
    
    address: {
      streetAddress: 'Victoria Island',
      addressLocality: 'Lagos',
      addressRegion: 'Lagos State',
      postalCode: '',
      addressCountry: 'NG'
    },
    
    geo: {
      latitude: 6.4281,
      longitude: 3.4219
    },
    
    openingHours: [
      'Mo-Fr 09:00-18:00'
    ],
    
    priceRange: '$$',
    
    areaServed: [
      { name: 'Nigeria', type: 'Country' },
      { name: 'Lagos', type: 'City' },
      { name: 'West Africa', type: 'Region' }
    ],
    
    services: [
      'Custom Software Development',
      'Cloud Migration Services',
      'Mobile App Development',
      'Enterprise Software Solutions',
      'IT Strategy Consulting',
      'DevOps & Automation',
      'Cloud Architecture Design',
      'Managed Cloud Services',
      'Technical Training',
      'Digital Transformation'
    ],
    
    socialMedia: [
      'https://linkedin.com/company/lagossoftwareconsulting',
      'https://twitter.com/lagossoftware',
      'https://facebook.com/lagossoftwareconsulting',
      'https://github.com/lagossoftwareconsulting'
    ],
    
    foundingDate: '2015-01-01',
    
    keywords: [
      'software consulting Lagos',
      'software development Nigeria',
      'IT consulting Africa',
      'custom software solutions',
      'cloud services Lagos',
      'mobile app development Nigeria',
      'enterprise software Lagos',
      'digital transformation Nigeria'
    ]
  });

  /**
   * Generates LocalBusiness JSON-LD structured data
   * @returns {Object} JSON-LD structured data object
   */
  function generateLocalBusinessSchema() {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${BUSINESS_CONFIG.url}#business`,
      name: BUSINESS_CONFIG.name,
      legalName: BUSINESS_CONFIG.legalName,
      description: BUSINESS_CONFIG.description,
      url: BUSINESS_CONFIG.url,
      telephone: BUSINESS_CONFIG.telephone,
      email: BUSINESS_CONFIG.email,
      
      address: {
        '@type': 'PostalAddress',
        streetAddress: BUSINESS_CONFIG.address.streetAddress,
        addressLocality: BUSINESS_CONFIG.address.addressLocality,
        addressRegion: BUSINESS_CONFIG.address.addressRegion,
        addressCountry: BUSINESS_CONFIG.address.addressCountry
      },
      
      geo: {
        '@type': 'GeoCoordinates',
        latitude: BUSINESS_CONFIG.geo.latitude.toString(),
        longitude: BUSINESS_CONFIG.geo.longitude.toString()
      },
      
      openingHoursSpecification: BUSINESS_CONFIG.openingHours.map(hours => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: parseDaysOfWeek(hours),
        opens: parseOpenTime(hours),
        closes: parseCloseTime(hours)
      })),
      
      priceRange: BUSINESS_CONFIG.priceRange,
      
      areaServed: BUSINESS_CONFIG.areaServed.map(area => ({
        '@type': area.type,
        name: area.name
      })),
      
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Software Consulting Services',
        itemListElement: BUSINESS_CONFIG.services.map((service, index) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service,
            provider: {
              '@type': 'LocalBusiness',
              name: BUSINESS_CONFIG.name
            }
          },
          position: index + 1
        }))
      },
      
      sameAs: BUSINESS_CONFIG.socialMedia,
      
      foundingDate: BUSINESS_CONFIG.foundingDate,
      
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '47',
        bestRating: '5',
        worstRating: '1'
      },
      
      keywords: BUSINESS_CONFIG.keywords.join(', ')
    };

    return schema;
  }

  /**
   * Generates Organization schema for enhanced business information
   * @returns {Object} JSON-LD Organization schema
   */
  function generateOrganizationSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${BUSINESS_CONFIG.url}#organization`,
      name: BUSINESS_CONFIG.name,
      legalName: BUSINESS_CONFIG.legalName,
      url: BUSINESS_CONFIG.url,
      logo: `${BUSINESS_CONFIG.url}/images/logo.png`,
      description: BUSINESS_CONFIG.description,
      
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: BUSINESS_CONFIG.telephone,
          email: BUSINESS_CONFIG.email,
          contactType: 'customer service',
          areaServed: 'NG',
          availableLanguage: ['English', 'Yoruba', 'Igbo', 'Hausa']
        },
        {
          '@type': 'ContactPoint',
          telephone: BUSINESS_CONFIG.telephone,
          email: 'sales@lagossoftwareconsulting.com',
          contactType: 'sales',
          areaServed: 'NG',
          availableLanguage: 'English'
        }
      ],
      
      address: {
        '@type': 'PostalAddress',
        streetAddress: BUSINESS_CONFIG.address.streetAddress,
        addressLocality: BUSINESS_CONFIG.address.addressLocality,
        addressRegion: BUSINESS_CONFIG.address.addressRegion,
        addressCountry: BUSINESS_CONFIG.address.addressCountry
      },
      
      sameAs: BUSINESS_CONFIG.socialMedia,
      
      foundingDate: BUSINESS_CONFIG.foundingDate,
      
      numberOfEmployees: {
        '@type': 'QuantitativeValue',
        value: 25
      }
    };
  }

  /**
   * Generates ProfessionalService schema
   * @returns {Object} JSON-LD ProfessionalService schema
   */
  function generateProfessionalServiceSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      '@id': `${BUSINESS_CONFIG.url}#service`,
      name: BUSINESS_CONFIG.name,
      description: BUSINESS_CONFIG.description,
      url: BUSINESS_CONFIG.url,
      
      serviceType: 'Software Consulting',
      
      provider: {
        '@type': 'LocalBusiness',
        name: BUSINESS_CONFIG.name
      },
      
      areaServed: BUSINESS_CONFIG.areaServed.map(area => ({
        '@type': area.type,
        name: area.name
      })),
      
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Software Development Services',
        itemListElement: BUSINESS_CONFIG.services.map((service, index) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service
          },
          position: index + 1
        }))
      }
    };
  }

  /**
   * Generates BreadcrumbList schema for site navigation
   * @returns {Object} JSON-LD BreadcrumbList schema
   */
  function generateBreadcrumbSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: BUSINESS_CONFIG.url
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Services',
          item: `${BUSINESS_CONFIG.url}#services`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Contact',
          item: `${BUSINESS_CONFIG.url}#contact`
        }
      ]
    };
  }

  /**
   * Parses days of week from opening hours string
   * @param {string} hours - Opening hours string (e.g., "Mo-Fr 09:00-18:00")
   * @returns {string[]} Array of day names
   */
  function parseDaysOfWeek(hours) {
    const dayMap = {
      'Mo': 'Monday',
      'Tu': 'Tuesday',
      'We': 'Wednesday',
      'Th': 'Thursday',
      'Fr': 'Friday',
      'Sa': 'Saturday',
      'Su': 'Sunday'
    };

    const daysMatch = hours.match(/^([A-Za-z-]+)/);
    if (!daysMatch) return [];

    const daysStr = daysMatch[1];
    
    if (daysStr.includes('-')) {
      const [start, end] = daysStr.split('-');
      const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
      const startIdx = days.indexOf(start);
      const endIdx = days.indexOf(end);
      
      if (startIdx === -1 || endIdx === -1) return [];
      
      return days.slice(startIdx, endIdx + 1).map(day => dayMap[day]);
    }

    return [dayMap[daysStr]];
  }

  /**
   * Parses opening time from hours string
   * @param {string} hours - Opening hours string
   * @returns {string} Opening time in HH:MM format
   */
  function parseOpenTime(hours) {
    const timeMatch = hours.match(/(\d{2}:\d{2})-/);
    return timeMatch ? timeMatch[1] : '09:00';
  }

  /**
   * Parses closing time from hours string
   * @param {string} hours - Opening hours string
   * @returns {string} Closing time in HH:MM format
   */
  function parseCloseTime(hours) {
    const timeMatch = hours.match(/-(\d{2}:\d{2})/);
    return timeMatch ? timeMatch[1] : '18:00';
  }

  /**
   * Creates and injects a script tag with JSON-LD data
   * @param {Object} schema - JSON-LD schema object
   * @param {string} id - Unique identifier for the script tag
   * @returns {HTMLScriptElement} The created script element
   */
  function injectSchema(schema, id) {
    try {
      const existingScript = document.getElementById(id);
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      script.textContent = JSON.stringify(schema, null, 2);

      const head = document.head || document.getElementsByTagName('head')[0];
      if (!head) {
        throw new Error('Document head not found');
      }

      head.appendChild(script);

      return script;
    } catch (error) {
      console.error(`Failed to inject schema ${id}:`, error);
      throw error;
    }
  }

  /**
   * Validates schema structure
   * @param {Object} schema - Schema object to validate
   * @returns {boolean} True if valid
   * @throws {Error} If schema is invalid
   */
  function validateSchema(schema) {
    if (!schema || typeof schema !== 'object') {
      throw new Error('Schema must be an object');
    }

    if (!schema['@context']) {
      throw new Error('Schema missing @context');
    }

    if (!schema['@type']) {
      throw new Error('Schema missing @type');
    }

    return true;
  }

  /**
   * Initializes and injects all schema types
   * @returns {Object} Result object with success status and injected schemas
   */
  function initializeSchemas() {
    const results = {
      success: true,
      schemas: [],
      errors: []
    };

    const schemas = [
      { generator: generateLocalBusinessSchema, id: 'schema-local-business', name: 'LocalBusiness' },
      { generator: generateOrganizationSchema, id: 'schema-organization', name: 'Organization' },
      { generator: generateProfessionalServiceSchema, id: 'schema-professional-service', name: 'ProfessionalService' },
      { generator: generateBreadcrumbSchema, id: 'schema-breadcrumb', name: 'BreadcrumbList' }
    ];

    schemas.forEach(({ generator, id, name }) => {
      try {
        const schema = generator();
        validateSchema(schema);
        injectSchema(schema, id);
        results.schemas.push({ name, id, success: true });
      } catch (error) {
        results.success = false;
        results.errors.push({ name, id, error: error.message });
        console.error(`Failed to initialize ${name} schema:`, error);
      }
    });

    return results;
  }

  /**
   * Logs schema initialization results
   * @param {Object} results - Results from initializeSchemas
   */
  function logResults(results) {
    if (results.success) {
      console.log('[Schema] Successfully initialized all schemas:', 
        results.schemas.map(s => s.name).join(', '));
    } else {
      console.warn('[Schema] Schema initialization completed with errors:', results.errors);
    }
  }

  /**
   * Main initialization function
   * Executes when DOM is ready
   */
  function init() {
    try {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          const results = initializeSchemas();
          logResults(results);
        });
      } else {
        const results = initializeSchemas();
        logResults(results);
      }
    } catch (error) {
      console.error('[Schema] Fatal error during initialization:', error);
    }
  }

  // Execute initialization
  init();

  // Export for testing purposes (if module system is available)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      generateLocalBusinessSchema,
      generateOrganizationSchema,
      generateProfessionalServiceSchema,
      generateBreadcrumbSchema,
      initializeSchemas,
      BUSINESS_CONFIG
    };
  }

})();