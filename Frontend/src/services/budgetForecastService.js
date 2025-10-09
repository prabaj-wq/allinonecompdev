// Budget and Forecast Service Functions
const API_BASE_URL = 'http://localhost:8000';

// Budget Management Services
export const budgetService = {
  // Create a new budget
  async createBudget(budgetData, companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/?company_name=${companyName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  },

  // Get all budgets with optional filtering
  async getBudgets(companyName, filters = {}) {
    try {
      const params = new URLSearchParams({ company_name: companyName });
      if (filters.budget_type) params.append('budget_type', filters.budget_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.fiscal_year) params.append('fiscal_year', filters.fiscal_year);

      const response = await fetch(`${API_BASE_URL}/api/budgets/?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    }
  },

  // Get a specific budget with its lines
  async getBudget(budgetId, companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/${budgetId}?company_name=${companyName}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching budget:', error);
      throw error;
    }
  },

  // Update a budget
  async updateBudget(budgetId, budgetData, companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/${budgetId}?company_name=${companyName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  },

  // Add a budget line
  async addBudgetLine(budgetId, lineData, companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/${budgetId}/lines?company_name=${companyName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lineData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding budget line:', error);
      throw error;
    }
  },

  // Calculate budget totals
  calculateBudgetTotals(budgetLines) {
    const totals = {
      revenue: 0,
      expenses: 0,
      netIncome: 0,
      byQuarter: { q1: 0, q2: 0, q3: 0, q4: 0 },
      byMonth: {
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
        jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
      }
    };

    budgetLines.forEach(line => {
      const amount = parseFloat(line.annual_total) || 0;
      
      // Categorize by account type (simplified logic)
      if (line.account_code.startsWith('4') || line.account_code.startsWith('5')) {
        totals.revenue += amount;
      } else if (line.account_code.startsWith('6') || line.account_code.startsWith('7')) {
        totals.expenses += amount;
      }

      // Add to quarterly totals
      totals.byQuarter.q1 += parseFloat(line.q1_total) || 0;
      totals.byQuarter.q2 += parseFloat(line.q2_total) || 0;
      totals.byQuarter.q3 += parseFloat(line.q3_total) || 0;
      totals.byQuarter.q4 += parseFloat(line.q4_total) || 0;

      // Add to monthly totals
      if (line.monthly_amounts) {
        Object.keys(line.monthly_amounts).forEach(month => {
          totals.byMonth[month] += parseFloat(line.monthly_amounts[month]) || 0;
        });
      }
    });

    totals.netIncome = totals.revenue - totals.expenses;
    return totals;
  },

  // Validate budget data
  validateBudgetData(budgetData) {
    const errors = [];

    if (!budgetData.budget_name) {
      errors.push('Budget name is required');
    }

    if (!budgetData.period_start || !budgetData.period_end) {
      errors.push('Start and end dates are required');
    }

    if (new Date(budgetData.period_start) >= new Date(budgetData.period_end)) {
      errors.push('End date must be after start date');
    }

    if (!budgetData.fiscal_year || budgetData.fiscal_year < 2020) {
      errors.push('Valid fiscal year is required');
    }

    return errors;
  }
};

// Forecast Management Services
export const forecastService = {
  // Create a new forecast
  async createForecast(forecastData, companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/forecasts/?company_name=${companyName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(forecastData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating forecast:', error);
      throw error;
    }
  },

  // Get all forecasts with optional filtering
  async getForecasts(companyName, filters = {}) {
    try {
      const params = new URLSearchParams({ company_name: companyName });
      if (filters.forecast_type) params.append('forecast_type', filters.forecast_type);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`${API_BASE_URL}/api/forecasts/?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      throw error;
    }
  },

  // Get a specific forecast with scenarios and lines
  async getForecast(forecastId, companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/forecasts/${forecastId}?company_name=${companyName}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  },

  // Add a forecast scenario
  async addForecastScenario(forecastId, scenarioData, companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/forecasts/${forecastId}/scenarios?company_name=${companyName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scenarioData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding forecast scenario:', error);
      throw error;
    }
  },

  // Calculate forecast accuracy
  calculateForecastAccuracy(forecastData, actualData) {
    if (!forecastData || !actualData) return null;

    const periods = Object.keys(forecastData);
    let totalError = 0;
    let totalActual = 0;

    periods.forEach(period => {
      const forecast = parseFloat(forecastData[period]) || 0;
      const actual = parseFloat(actualData[period]) || 0;
      
      if (actual > 0) {
        const error = Math.abs((forecast - actual) / actual) * 100;
        totalError += error;
        totalActual += actual;
      }
    });

    return periods.length > 0 ? (100 - (totalError / periods.length)) : 0;
  },

  // Generate forecast scenarios
  generateForecastScenarios(baseForecast, assumptions = {}) {
    const scenarios = {
      optimistic: {},
      pessimistic: {},
      base: baseForecast
    };

    const optimisticMultiplier = 1 + (assumptions.optimisticGrowth || 0.15);
    const pessimisticMultiplier = 1 - (assumptions.pessimisticDecline || 0.10);

    Object.keys(baseForecast).forEach(period => {
      const baseValue = parseFloat(baseForecast[period]) || 0;
      scenarios.optimistic[period] = baseValue * optimisticMultiplier;
      scenarios.pessimistic[period] = baseValue * pessimisticMultiplier;
    });

    return scenarios;
  },

  // Validate forecast data
  validateForecastData(forecastData) {
    const errors = [];

    if (!forecastData.forecast_name) {
      errors.push('Forecast name is required');
    }

    if (!forecastData.forecast_type) {
      errors.push('Forecast type is required');
    }

    if (!forecastData.forecast_method) {
      errors.push('Forecast method is required');
    }

    if (!forecastData.forecast_start_date || !forecastData.forecast_end_date) {
      errors.push('Start and end dates are required');
    }

    if (new Date(forecastData.forecast_start_date) >= new Date(forecastData.forecast_end_date)) {
      errors.push('End date must be after start date');
    }

    if (!forecastData.forecast_horizon || forecastData.forecast_horizon < 1) {
      errors.push('Valid forecast horizon is required');
    }

    return errors;
  }
};

// Business Drivers Services
export const businessDriverService = {
  // Create a new business driver
  async createBusinessDriver(driverData, companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/business-drivers/?company_name=${companyName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating business driver:', error);
      throw error;
    }
  },

  // Get all business drivers with optional filtering
  async getBusinessDrivers(companyName, filters = {}) {
    try {
      const params = new URLSearchParams({ company_name: companyName });
      if (filters.driver_type) params.append('driver_type', filters.driver_type);
      if (filters.driver_category) params.append('driver_category', filters.driver_category);

      const response = await fetch(`${API_BASE_URL}/api/business-drivers/?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching business drivers:', error);
      throw error;
    }
  },

  // Calculate driver-based forecast
  calculateDriverBasedForecast(drivers, formulas) {
    const forecast = {};

    Object.keys(formulas).forEach(period => {
      let result = 0;
      const formula = formulas[period];

      // Simple formula evaluation (can be enhanced with a proper expression parser)
      drivers.forEach(driver => {
        const driverValue = parseFloat(driver.current_value) || 0;
        const regex = new RegExp(`\\b${driver.driver_code}\\b`, 'g');
        const evaluated = formula.replace(regex, driverValue);
        
        try {
          result += eval(evaluated);
        } catch (error) {
          console.error(`Error evaluating formula for ${period}:`, error);
        }
      });

      forecast[period] = result;
    });

    return forecast;
  }
};

// Comparison and Analytics Services
export const comparisonService = {
  // Create a comparison
  async createComparison(comparisonData, companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comparisons/?company_name=${companyName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comparisonData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating comparison:', error);
      throw error;
    }
  },

  // Get all comparisons
  async getComparisons(companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comparisons/?company_name=${companyName}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching comparisons:', error);
      throw error;
    }
  },

  // Calculate variance analysis
  calculateVarianceAnalysis(budgetData, actualData, forecastData = null) {
    const variance = {
      budgetVsActual: {},
      forecastVsActual: {},
      budgetVsForecast: {},
      summary: {
        totalBudgetVariance: 0,
        totalForecastVariance: 0,
        accuracyScore: 0
      }
    };

    // Budget vs Actual variance
    Object.keys(budgetData).forEach(period => {
      const budget = parseFloat(budgetData[period]) || 0;
      const actual = parseFloat(actualData[period]) || 0;
      const varianceAmount = actual - budget;
      const variancePercent = budget > 0 ? (varianceAmount / budget) * 100 : 0;

      variance.budgetVsActual[period] = {
        budget,
        actual,
        variance: varianceAmount,
        variancePercent,
        status: Math.abs(variancePercent) <= 5 ? 'On Track' : 
                variancePercent > 5 ? 'Over Budget' : 'Under Budget'
      };

      variance.summary.totalBudgetVariance += Math.abs(varianceAmount);
    });

    // Forecast vs Actual variance (if forecast data provided)
    if (forecastData) {
      Object.keys(forecastData).forEach(period => {
        const forecast = parseFloat(forecastData[period]) || 0;
        const actual = parseFloat(actualData[period]) || 0;
        const varianceAmount = actual - forecast;
        const variancePercent = forecast > 0 ? (varianceAmount / forecast) * 100 : 0;

        variance.forecastVsActual[period] = {
          forecast,
          actual,
          variance: varianceAmount,
          variancePercent,
          status: Math.abs(variancePercent) <= 5 ? 'On Track' : 
                  variancePercent > 5 ? 'Over Forecast' : 'Under Forecast'
        };

        variance.summary.totalForecastVariance += Math.abs(varianceAmount);
      });
    }

    // Calculate accuracy score
    const periods = Object.keys(budgetData);
    if (periods.length > 0) {
      const totalBudget = periods.reduce((sum, period) => sum + (parseFloat(budgetData[period]) || 0), 0);
      variance.summary.accuracyScore = totalBudget > 0 ? 
        ((totalBudget - variance.summary.totalBudgetVariance) / totalBudget) * 100 : 0;
    }

    return variance;
  },

  // Get analytics summary
  async getAnalyticsSummary(companyName, type = 'budget') {
    try {
      const endpoint = type === 'budget' ? 'budget-summary' : 'forecast-summary';
      const response = await fetch(`${API_BASE_URL}/api/analytics/${endpoint}?company_name=${companyName}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  },

  // Get variance analysis
  async getVarianceAnalysis(companyName, period, year) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/variance-analysis?company_name=${companyName}&period=${period}&year=${year}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching variance analysis:', error);
      throw error;
    }
  }
};

// Rolling Forecast Services
export const rollingForecastService = {
  // Create a rolling forecast
  async createRollingForecast(forecastData, companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rolling-forecasts/?company_name=${companyName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(forecastData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating rolling forecast:', error);
      throw error;
    }
  },

  // Get all rolling forecasts
  async getRollingForecasts(companyName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rolling-forecasts/?company_name=${companyName}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching rolling forecasts:', error);
      throw error;
    }
  },

  // Update rolling forecast (shift periods forward)
  updateRollingForecast(currentForecast, newPeriod) {
    const updatedForecast = { ...currentForecast };
    
    // Remove the oldest period and add the new period
    const periods = Object.keys(currentForecast).sort();
    if (periods.length > 0) {
      delete updatedForecast[periods[0]];
    }
    
    // Add new period with estimated value (can be enhanced with actual calculation)
    updatedForecast[newPeriod] = this.estimateNextPeriodValue(currentForecast);
    
    return updatedForecast;
  },

  // Estimate next period value based on trend
  estimateNextPeriodValue(forecastData) {
    const periods = Object.keys(forecastData).sort();
    if (periods.length < 2) return 0;

    const values = periods.map(period => parseFloat(forecastData[period]) || 0);
    
    // Simple linear trend calculation
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (val * (index + 1)), 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return Math.max(0, slope * (n + 1) + intercept);
  }
};

// Utility functions
export const budgetForecastUtils = {
  // Format currency
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  // Format percentage
  formatPercentage(value, decimals = 1) {
    return `${parseFloat(value).toFixed(decimals)}%`;
  },

  // Get status color
  getStatusColor(status) {
    const colors = {
      'On Track': 'green',
      'Over Budget': 'red',
      'Under Budget': 'blue',
      'Draft': 'gray',
      'Approved': 'green',
      'Active': 'blue',
      'Completed': 'purple'
    };
    return colors[status] || 'gray';
  },

  // Generate chart data
  generateChartData(data, type = 'line') {
    if (type === 'line' || type === 'bar') {
      return {
        labels: Object.keys(data),
        datasets: [{
          label: 'Values',
          data: Object.values(data),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        }]
      };
    }
    
    return data;
  },

  // Calculate trend
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (val * (index + 1)), 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }
};

export default {
  budgetService,
  forecastService,
  businessDriverService,
  comparisonService,
  rollingForecastService,
  budgetForecastUtils
};