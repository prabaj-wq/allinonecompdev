import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Calendar, 
  User, 
  DollarSign, 
  AlertTriangle,
  Building,
  FileText
} from 'lucide-react';
import AuditService from '../../services/auditService';

const AuditEngagementForm = ({ 
  engagement = null, 
  onSave, 
  onCancel, 
  companyId 
}) => {
  const [formData, setFormData] = useState({
    company_id: companyId || 1,
    engagement_name: '',
    client_name: '',
    engagement_type: 'External',
    period_start: '',
    period_end: '',
    risk_level: 'medium',
    materiality_threshold: '',
    tolerable_misstatement: '',
    engagement_partner: '',
    engagement_manager: '',
    planning_start_date: '',
    fieldwork_start_date: '',
    review_start_date: '',
    completion_date: '',
    created_by: 'Current User'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (engagement) {
      setFormData({
        ...engagement,
        period_start: engagement.period_start ? engagement.period_start.split('T')[0] : '',
        period_end: engagement.period_end ? engagement.period_end.split('T')[0] : '',
        planning_start_date: engagement.planning_start_date ? engagement.planning_start_date.split('T')[0] : '',
        fieldwork_start_date: engagement.fieldwork_start_date ? engagement.fieldwork_start_date.split('T')[0] : '',
        review_start_date: engagement.review_start_date ? engagement.review_start_date.split('T')[0] : '',
        completion_date: engagement.completion_date ? engagement.completion_date.split('T')[0] : '',
      });
    }
  }, [engagement]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.engagement_name.trim()) {
      newErrors.engagement_name = 'Engagement name is required';
    }

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Client name is required';
    }

    if (!formData.period_start) {
      newErrors.period_start = 'Period start date is required';
    }

    if (!formData.period_end) {
      newErrors.period_end = 'Period end date is required';
    }

    if (formData.period_start && formData.period_end && 
        new Date(formData.period_start) >= new Date(formData.period_end)) {
      newErrors.period_end = 'Period end date must be after start date';
    }

    if (formData.materiality_threshold && parseFloat(formData.materiality_threshold) <= 0) {
      newErrors.materiality_threshold = 'Materiality threshold must be greater than 0';
    }

    if (formData.tolerable_misstatement && parseFloat(formData.tolerable_misstatement) <= 0) {
      newErrors.tolerable_misstatement = 'Tolerable misstatement must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        materiality_threshold: formData.materiality_threshold ? parseFloat(formData.materiality_threshold) : null,
        tolerable_misstatement: formData.tolerable_misstatement ? parseFloat(formData.tolerable_misstatement) : null,
      };

      let result;
      if (engagement) {
        result = await AuditService.updateEngagement(engagement.id, dataToSubmit);
      } else {
        result = await AuditService.createEngagement(dataToSubmit);
      }

      onSave(result);
    } catch (error) {
      console.error('Error saving engagement:', error);
      setErrors({ submit: 'Failed to save engagement. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const engagementTypes = [
    'External Audit',
    'Internal Audit',
    'Review Engagement',
    'Agreed-Upon Procedures',
    'Compilation',
    'Other'
  ];

  const riskLevels = [
    { value: 'low', label: 'Low Risk' },
    { value: 'medium', label: 'Medium Risk' },
    { value: 'high', label: 'High Risk' },
    { value: 'critical', label: 'Critical Risk' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {engagement ? 'Edit Audit Engagement' : 'New Audit Engagement'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Engagement Name *
            </label>
            <input
              type="text"
              name="engagement_name"
              value={formData.engagement_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.engagement_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 dark:text-white`}
              placeholder="Enter engagement name"
            />
            {errors.engagement_name && (
              <p className="text-red-500 text-sm mt-1">{errors.engagement_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building className="w-4 h-4 inline mr-2" />
              Client Name *
            </label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.client_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 dark:text-white`}
              placeholder="Enter client name"
            />
            {errors.client_name && (
              <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>
            )}
          </div>
        </div>

        {/* Engagement Type and Risk Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Engagement Type
            </label>
            <select
              name="engagement_type"
              value={formData.engagement_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            >
              {engagementTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Risk Level
            </label>
            <select
              name="risk_level"
              value={formData.risk_level}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            >
              {riskLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Period Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Period Start Date *
            </label>
            <input
              type="date"
              name="period_start"
              value={formData.period_start}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.period_start ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 dark:text-white`}
            />
            {errors.period_start && (
              <p className="text-red-500 text-sm mt-1">{errors.period_start}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Period End Date *
            </label>
            <input
              type="date"
              name="period_end"
              value={formData.period_end}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.period_end ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 dark:text-white`}
            />
            {errors.period_end && (
              <p className="text-red-500 text-sm mt-1">{errors.period_end}</p>
            )}
          </div>
        </div>

        {/* Materiality and Tolerable Misstatement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Materiality Threshold
            </label>
            <input
              type="number"
              name="materiality_threshold"
              value={formData.materiality_threshold}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.materiality_threshold ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 dark:text-white`}
              placeholder="0.00"
            />
            {errors.materiality_threshold && (
              <p className="text-red-500 text-sm mt-1">{errors.materiality_threshold}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Tolerable Misstatement
            </label>
            <input
              type="number"
              name="tolerable_misstatement"
              value={formData.tolerable_misstatement}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.tolerable_misstatement ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 dark:text-white`}
              placeholder="0.00"
            />
            {errors.tolerable_misstatement && (
              <p className="text-red-500 text-sm mt-1">{errors.tolerable_misstatement}</p>
            )}
          </div>
        </div>

        {/* Team Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Engagement Partner
            </label>
            <input
              type="text"
              name="engagement_partner"
              value={formData.engagement_partner}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              placeholder="Enter engagement partner name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Engagement Manager
            </label>
            <input
              type="text"
              name="engagement_manager"
              value={formData.engagement_manager}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              placeholder="Enter engagement manager name"
            />
          </div>
        </div>

        {/* Phase Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Planning Start Date
            </label>
            <input
              type="date"
              name="planning_start_date"
              value={formData.planning_start_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Fieldwork Start Date
            </label>
            <input
              type="date"
              name="fieldwork_start_date"
              value={formData.fieldwork_start_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Review Start Date
            </label>
            <input
              type="date"
              name="review_start_date"
              value={formData.review_start_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Completion Date
            </label>
            <input
              type="date"
              name="completion_date"
              value={formData.completion_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {engagement ? 'Update Engagement' : 'Create Engagement'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuditEngagementForm;
