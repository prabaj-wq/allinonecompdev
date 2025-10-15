import axios from 'axios';
import { API_BASE_URL } from '../config/config';

const API_URL = `${API_BASE_URL}/fiscal`;

/**
 * Service for managing fiscal years, periods, and scenarios
 */
const fiscalService = {
  // Fiscal Year Methods
  getAllFiscalYears: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await axios.get(`${API_URL}/years`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching fiscal years:', error);
      throw error;
    }
  },

  getFiscalYear: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/years/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching fiscal year ${id}:`, error);
      throw error;
    }
  },

  createFiscalYear: async (fiscalYearData) => {
    try {
      const response = await axios.post(`${API_URL}/years`, fiscalYearData);
      return response.data;
    } catch (error) {
      console.error('Error creating fiscal year:', error);
      throw error;
    }
  },

  updateFiscalYear: async (id, fiscalYearData) => {
    try {
      const response = await axios.put(`${API_URL}/years/${id}`, fiscalYearData);
      return response.data;
    } catch (error) {
      console.error(`Error updating fiscal year ${id}:`, error);
      throw error;
    }
  },

  deleteFiscalYear: async (id) => {
    try {
      await axios.delete(`${API_URL}/years/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting fiscal year ${id}:`, error);
      throw error;
    }
  },

  // Period Methods
  getPeriods: async (fiscalYearId) => {
    try {
      const response = await axios.get(`${API_URL}/years/${fiscalYearId}/periods`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching periods for fiscal year ${fiscalYearId}:`, error);
      throw error;
    }
  },

  getPeriod: async (periodId) => {
    try {
      const response = await axios.get(`${API_URL}/periods/${periodId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching period ${periodId}:`, error);
      throw error;
    }
  },

  createPeriod: async (fiscalYearId, periodData) => {
    try {
      const response = await axios.post(`${API_URL}/years/${fiscalYearId}/periods`, periodData);
      return response.data;
    } catch (error) {
      console.error(`Error creating period for fiscal year ${fiscalYearId}:`, error);
      throw error;
    }
  },

  updatePeriod: async (periodId, periodData) => {
    try {
      const response = await axios.put(`${API_URL}/periods/${periodId}`, periodData);
      return response.data;
    } catch (error) {
      console.error(`Error updating period ${periodId}:`, error);
      throw error;
    }
  },

  deletePeriod: async (periodId) => {
    try {
      await axios.delete(`${API_URL}/periods/${periodId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting period ${periodId}:`, error);
      throw error;
    }
  },

  createPeriodsInBulk: async (fiscalYearId, periodsData) => {
    try {
      const response = await axios.post(`${API_URL}/years/${fiscalYearId}/periods/bulk`, periodsData);
      return response.data;
    } catch (error) {
      console.error(`Error creating periods in bulk for fiscal year ${fiscalYearId}:`, error);
      throw error;
    }
  },

  // Scenario Methods
  getScenarios: async (fiscalYearId) => {
    try {
      const response = await axios.get(`${API_URL}/years/${fiscalYearId}/scenarios`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching scenarios for fiscal year ${fiscalYearId}:`, error);
      throw error;
    }
  },

  getScenario: async (scenarioId) => {
    try {
      const response = await axios.get(`${API_URL}/scenarios/${scenarioId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching scenario ${scenarioId}:`, error);
      throw error;
    }
  },

  createScenario: async (fiscalYearId, scenarioData) => {
    try {
      const response = await axios.post(`${API_URL}/years/${fiscalYearId}/scenarios`, scenarioData);
      return response.data;
    } catch (error) {
      console.error(`Error creating scenario for fiscal year ${fiscalYearId}:`, error);
      throw error;
    }
  },

  updateScenario: async (scenarioId, scenarioData) => {
    try {
      const response = await axios.put(`${API_URL}/scenarios/${scenarioId}`, scenarioData);
      return response.data;
    } catch (error) {
      console.error(`Error updating scenario ${scenarioId}:`, error);
      throw error;
    }
  },

  deleteScenario: async (scenarioId) => {
    try {
      await axios.delete(`${API_URL}/scenarios/${scenarioId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting scenario ${scenarioId}:`, error);
      throw error;
    }
  },

  // Audit Log Methods
  getFiscalYearAuditLogs: async (fiscalYearId) => {
    try {
      const response = await axios.get(`${API_URL}/years/${fiscalYearId}/audit`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching audit logs for fiscal year ${fiscalYearId}:`, error);
      throw error;
    }
  },

  getScenarioAuditLogs: async (scenarioId) => {
    try {
      const response = await axios.get(`${API_URL}/scenarios/${scenarioId}/audit`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching audit logs for scenario ${scenarioId}:`, error);
      throw error;
    }
  },

  // Helper Methods
  generateMonthlyPeriods: (fiscalYearId, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const periods = [];
    
    let currentDate = new Date(start);
    let periodIndex = 1;
    
    while (currentDate <= end) {
      const periodStart = new Date(currentDate);
      
      // Move to end of month
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(0); // Last day of previous month
      
      const periodEnd = new Date(currentDate);
      
      // Ensure we don't go past the fiscal year end date
      if (periodEnd > end) {
        periodEnd.setTime(end.getTime());
      }
      
      const monthName = periodStart.toLocaleString('default', { month: 'long' });
      const year = periodStart.getFullYear();
      
      periods.push({
        fiscal_year_id: fiscalYearId,
        code: `M${periodIndex.toString().padStart(2, '0')}`,
        name: `${monthName} ${year}`,
        start_date: periodStart.toISOString().split('T')[0],
        end_date: periodEnd.toISOString().split('T')[0],
        type: 'month',
        status: 'open',
        is_rollup: false
      });
      
      // Move to first day of next month
      currentDate.setDate(1);
      currentDate.setMonth(currentDate.getMonth() + 1);
      periodIndex++;
    }
    
    return periods;
  },
  
  generateQuarterlyPeriods: (fiscalYearId, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const periods = [];
    
    // Determine the first quarter start based on the fiscal year start
    let currentDate = new Date(start);
    let quarterIndex = 1;
    
    while (currentDate <= end) {
      const quarterStart = new Date(currentDate);
      
      // Move to end of quarter (3 months)
      currentDate.setMonth(currentDate.getMonth() + 3);
      currentDate.setDate(0); // Last day of the quarter
      
      const quarterEnd = new Date(currentDate);
      
      // Ensure we don't go past the fiscal year end date
      if (quarterEnd > end) {
        quarterEnd.setTime(end.getTime());
      }
      
      periods.push({
        fiscal_year_id: fiscalYearId,
        code: `Q${quarterIndex}`,
        name: `Quarter ${quarterIndex}`,
        start_date: quarterStart.toISOString().split('T')[0],
        end_date: quarterEnd.toISOString().split('T')[0],
        type: 'quarter',
        status: 'open',
        is_rollup: true
      });
      
      // Move to first day of next quarter
      currentDate.setDate(1);
      currentDate.setMonth(currentDate.getMonth() + 1);
      quarterIndex++;
    }
    
    return periods;
  }
};

export default fiscalService;