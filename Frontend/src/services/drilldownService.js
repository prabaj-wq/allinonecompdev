import api from './api'

export const drilldownService = {
  // Get drilldown details for a specific account/entity/period
  getDrilldownDetails: async (entityCode, accountCode, period, year) => {
    try {
      const response = await api.get('/drilldown', {
        params: {
          entity_code: entityCode,
          account_code: accountCode,
          period: period,
          year: year
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching drilldown details:', error)
      throw error
    }
  },

  // Get audit trail for drilldown
  getAuditTrail: async (entityCode, accountCode, period, year) => {
    try {
      const response = await api.get('/drilldown/audit-trail', {
        params: {
          entity_code: entityCode,
          account_code: accountCode,
          period: period,
          year: year
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching audit trail:', error)
      throw error
    }
  }
}

export default drilldownService
