// Configuration file for Budgeting and Forecasting module
// Centralized configuration management

// Safely access environment variables with fallbacks for browser environment
const getEnvVar = (key, defaultValue) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return defaultValue;
};

// API Configuration
export const API_BASE_URL = getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:8000');
export const API_TIMEOUT = getEnvVar('REACT_APP_API_TIMEOUT', 30000);

// Default Company Configuration
export const DEFAULT_COMPANY = getEnvVar('REACT_APP_DEFAULT_COMPANY', 'default');

// Feature Flags
export const FEATURE_FLAGS = {
  ADVANCED_FORECASTING: getEnvVar('REACT_APP_ADVANCED_FORECASTING', 'true') === 'true',
  SCENARIO_ANALYSIS: getEnvVar('REACT_APP_SCENARIO_ANALYSIS', 'true') === 'true',
  ROLLING_FORECASTS: getEnvVar('REACT_APP_ROLLING_FORECASTS', 'true') === 'true',
  DRIVER_BASED_FORECASTING: getEnvVar('REACT_APP_DRIVER_BASED_FORECASTING', 'true') === 'true',
  COLLABORATION_WORKFLOWS: getEnvVar('REACT_APP_COLLABORATION_WORKFLOWS', 'true') === 'true',
  EXPORT_FEATURES: getEnvVar('REACT_APP_EXPORT_FEATURES', 'true') === 'true',
  NOTIFICATIONS: getEnvVar('REACT_APP_NOTIFICATIONS', 'true') === 'true'
};

// Chart Configuration
export const CHART_CONFIG = {
  COLORS: {
    PRIMARY: '#2563eb',
    SECONDARY: '#7c3aed',
    SUCCESS: '#059669',
    WARNING: '#d97706',
    DANGER: '#dc2626',
    INFO: '#0891b2',
    LIGHT: '#f3f4f6',
    DARK: '#1f2937'
  },
  ANIMATION_DURATION: 1000,
  RESPONSIVE: true,
  MAINTAIN_ASPECT_RATIO: false
};

// Budget Configuration
export const BUDGET_CONFIG = {
  DEFAULT_CURRENCY: 'USD',
  DECIMAL_PLACES: 2,
  THOUSAND_SEPARATOR: ',',
  DECIMAL_SEPARATOR: '.',
  MAX_BUDGET_AMOUNT: 999999999.99,
  MIN_BUDGET_AMOUNT: 0.01,
  DEFAULT_FISCAL_YEAR: new Date().getFullYear(),
  BUDGET_TYPES: ['OPERATIONAL', 'CAPITAL', 'PROJECT', 'DEPARTMENT', 'MASTER'],
  STATUS_OPTIONS: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED']
};

// Forecast Configuration
export const FORECAST_CONFIG = {
  FORECAST_METHODS: ['TOP_DOWN', 'BOTTOM_UP', 'DRIVER_BASED', 'HYBRID'],
  FORECAST_PERIODS: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
  ROLLING_PERIODS: [3, 6, 12, 18, 24],
  CONFIDENCE_LEVELS: [50, 75, 80, 90, 95, 99],
  DEFAULT_FORECAST_HORIZON: 12,
  MIN_FORECAST_PERIODS: 1,
  MAX_FORECAST_PERIODS: 60
};

// Driver Configuration
export const DRIVER_CONFIG = {
  DRIVER_TYPES: ['VOLUME', 'PRICE', 'EFFICIENCY', 'MARKET', 'SEASONAL', 'CUSTOM'],
  CALCULATION_METHODS: ['LINEAR', 'PERCENTAGE', 'FIXED_AMOUNT', 'FORMULA'],
  UPDATE_FREQUENCIES: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
  MAX_DRIVERS_PER_FORECAST: 20,
  DEFAULT_DRIVER_WEIGHT: 1.0
};

// Comparison Configuration
export const COMPARISON_CONFIG = {
  COMPARISON_TYPES: ['BUDGET_VS_ACTUAL', 'FORECAST_VS_ACTUAL', 'BUDGET_VS_FORECAST', 'SCENARIO_COMPARISON'],
  VARIANCE_THRESHOLDS: {
    MINOR: 0.05,    // 5%
    MODERATE: 0.10, // 10%
    MAJOR: 0.20     // 20%
  },
  VARIANCE_COLORS: {
    FAVORABLE: '#059669',
    UNFAVORABLE: '#dc2626',
    NEUTRAL: '#6b7280'
  }
};

// Rolling Forecast Configuration
export const ROLLING_FORECAST_CONFIG = {
  DEFAULT_ROLLING_PERIOD: 12,
  UPDATE_FREQUENCY: 'MONTHLY',
  FORECAST_HORIZON: 18,
  HISTORICAL_PERIODS: 24,
  CONFIDENCE_INTERVALS: [0.8, 0.9, 0.95],
  SMOOTHING_FACTORS: [0.1, 0.2, 0.3, 0.5, 0.7, 0.9]
};

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  DASHBOARD_REFRESH_INTERVAL: 30000, // 30 seconds
  CHART_ANIMATION_DURATION: 1000,
  MAX_DATA_POINTS: 1000,
  EXPORT_FORMATS: ['PDF', 'EXCEL', 'CSV', 'JSON'],
  PRINT_OPTIONS: {
    ORIENTATION: 'landscape',
    MARGIN: '0.5in',
    SCALE: 0.8
  }
};

// UI Configuration
export const UI_CONFIG = {
  THEME: {
    PRIMARY_COLOR: '#2563eb',
    SECONDARY_COLOR: '#7c3aed',
    BACKGROUND_COLOR: '#ffffff',
    TEXT_COLOR: '#1f2937',
    BORDER_COLOR: '#e5e7eb'
  },
  LAYOUT: {
    SIDEBAR_WIDTH: 280,
    HEADER_HEIGHT: 64,
    FOOTER_HEIGHT: 48,
    CONTENT_PADDING: 24
  },
  RESPONSIVE: {
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024,
    DESKTOP_BREAKPOINT: 1280
  },
  ANIMATIONS: {
    DURATION: 300,
    EASING: 'ease-in-out'
  }
};

// Validation Configuration
export const VALIDATION_CONFIG = {
  BUDGET: {
    MIN_NAME_LENGTH: 3,
    MAX_NAME_LENGTH: 100,
    MIN_DESCRIPTION_LENGTH: 10,
    MAX_DESCRIPTION_LENGTH: 500
  },
  FORECAST: {
    MIN_NAME_LENGTH: 3,
    MAX_NAME_LENGTH: 100,
    MIN_PERIODS: 1,
    MAX_PERIODS: 60
  },
  DRIVER: {
    MIN_NAME_LENGTH: 3,
    MAX_NAME_LENGTH: 50,
    MIN_VALUE: -999999999,
    MAX_VALUE: 999999999
  }
};

// Export Configuration
export const EXPORT_CONFIG = {
  EXCEL: {
    SHEET_NAME: 'Budget_Forecast_Data',
    MAX_ROWS_PER_SHEET: 1000000,
    DATE_FORMAT: 'YYYY-MM-DD',
    NUMBER_FORMAT: '#,##0.00'
  },
  PDF: {
    PAGE_SIZE: 'A4',
    ORIENTATION: 'landscape',
    MARGIN: '0.5in',
    FONT_SIZE: 10
  },
  CSV: {
    DELIMITER: ',',
    ENCODING: 'UTF-8',
    INCLUDE_HEADERS: true
  }
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  TYPES: ['SUCCESS', 'WARNING', 'ERROR', 'INFO'],
  POSITION: 'top-right',
  AUTO_CLOSE: 5000,
  MAX_NOTIFICATIONS: 5,
  SOUND_ENABLED: false
};

// Security Configuration
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 3600000, // 1 hour
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8,
  API_RATE_LIMIT: 100, // requests per minute
  CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:8000']
};

// Development Configuration
export const DEV_CONFIG = {
  DEBUG_MODE: getEnvVar('REACT_APP_DEBUG_MODE', 'false') === 'true',
  LOG_LEVEL: getEnvVar('REACT_APP_LOG_LEVEL', 'info'),
  MOCK_DATA: getEnvVar('REACT_APP_MOCK_DATA', 'false') === 'true',
  API_MOCK_DELAY: 1000
};

// Default export for easy importing
export default {
  API_BASE_URL,
  API_TIMEOUT,
  DEFAULT_COMPANY,
  FEATURE_FLAGS,
  CHART_CONFIG,
  BUDGET_CONFIG,
  FORECAST_CONFIG,
  DRIVER_CONFIG,
  COMPARISON_CONFIG,
  ROLLING_FORECAST_CONFIG,
  ANALYTICS_CONFIG,
  UI_CONFIG,
  VALIDATION_CONFIG,
  EXPORT_CONFIG,
  NOTIFICATION_CONFIG,
  SECURITY_CONFIG,
  DEV_CONFIG
};
