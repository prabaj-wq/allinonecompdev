const API_BASE_URL = 'http://localhost:8000/api/audit';

class AuditService {
  // Engagement Management
  static async createEngagement(engagementData) {
    try {
      const response = await fetch(`${API_BASE_URL}/engagements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(engagementData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating engagement:', error);
      throw error;
    }
  }

  static async getEngagements(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/engagements?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching engagements:', error);
      throw error;
    }
  }

  static async getEngagement(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/engagements/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching engagement:', error);
      throw error;
    }
  }

  static async updateEngagement(id, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/engagements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating engagement:', error);
      throw error;
    }
  }

  static async deleteEngagement(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/engagements/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting engagement:', error);
      throw error;
    }
  }

  // Workpaper Management
  static async createWorkpaper(workpaperData) {
    try {
      const response = await fetch(`${API_BASE_URL}/workpapers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workpaperData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating workpaper:', error);
      throw error;
    }
  }

  static async getWorkpapers(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/workpapers?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching workpapers:', error);
      throw error;
    }
  }

  static async getWorkpaper(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/workpapers/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching workpaper:', error);
      throw error;
    }
  }

  static async updateWorkpaper(id, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/workpapers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating workpaper:', error);
      throw error;
    }
  }

  static async deleteWorkpaper(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/workpapers/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting workpaper:', error);
      throw error;
    }
  }

  // Finding Management
  static async createFinding(findingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/findings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(findingData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating finding:', error);
      throw error;
    }
  }

  static async getFindings(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/findings?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching findings:', error);
      throw error;
    }
  }

  static async getFinding(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/findings/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching finding:', error);
      throw error;
    }
  }

  static async updateFinding(id, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/findings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating finding:', error);
      throw error;
    }
  }

  static async deleteFinding(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/findings/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting finding:', error);
      throw error;
    }
  }

  // Risk Assessment Management
  static async createRiskAssessment(riskData) {
    try {
      const response = await fetch(`${API_BASE_URL}/risk-assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(riskData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating risk assessment:', error);
      throw error;
    }
  }

  static async getRiskAssessments(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/risk-assessments?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching risk assessments:', error);
      throw error;
    }
  }

  // Schedule Management
  static async createSchedule(scheduleData) {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }

  static async getSchedules(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/schedules?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  }

  // Confirmation Management
  static async createConfirmation(confirmationData) {
    try {
      const response = await fetch(`${API_BASE_URL}/confirmations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(confirmationData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating confirmation:', error);
      throw error;
    }
  }

  static async getConfirmations(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/confirmations?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching confirmations:', error);
      throw error;
    }
  }

  // Sampling Management
  static async createSampling(samplingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/sampling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(samplingData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating sampling:', error);
      throw error;
    }
  }

  static async getSampling(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/sampling?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching sampling:', error);
      throw error;
    }
  }

  // Time Tracking Management
  static async createTimeEntry(timeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/time-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating time entry:', error);
      throw error;
    }
  }

  static async getTimeTracking(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/time-tracking?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching time tracking:', error);
      throw error;
    }
  }

  // Independence Management
  static async createIndependence(independenceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/independence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(independenceData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating independence record:', error);
      throw error;
    }
  }

  static async getIndependence(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/independence?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching independence records:', error);
      throw error;
    }
  }

  // Document Management
  static async createDocument(documentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  static async getDocuments(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/documents?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  // Dashboard
  static async getDashboard(companyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/${companyId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  }

  // Utility methods
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  }

  static formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }

  static formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    return new Date(dateTimeString).toLocaleString();
  }

  static getStatusColor(status) {
    const colors = {
      'completed': 'green',
      'in_progress': 'blue',
      'not_started': 'gray',
      'review': 'purple',
      'open': 'red',
      'resolved': 'green',
      'closed': 'gray',
      'pending': 'yellow',
      'sent': 'blue',
      'received': 'green',
      'reconciled': 'green'
    };
    return colors[status] || 'gray';
  }

  static getPriorityColor(priority) {
    const colors = {
      'low': 'green',
      'medium': 'yellow',
      'high': 'orange',
      'critical': 'red'
    };
    return colors[priority] || 'gray';
  }

  static getSeverityColor(severity) {
    return this.getPriorityColor(severity);
  }
}

export default AuditService;
