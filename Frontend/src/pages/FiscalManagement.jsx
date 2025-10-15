import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import fiscalService from '../services/fiscalService';
import { toast } from 'react-toastify';

const FiscalManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [activeTab, setActiveTab] = useState('years'); // years, periods, scenarios
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  // Form states
  const [fiscalYearForm, setFiscalYearForm] = useState({
    name: '',
    code: '',
    start_date: '',
    end_date: '',
    status: 'active',
    metadata: {}
  });
  
  const [periodForm, setPeriodForm] = useState({
    code: '',
    name: '',
    start_date: '',
    end_date: '',
    type: 'month',
    status: 'open',
    is_rollup: false,
    parent_period_id: null
  });
  
  const [scenarioForm, setScenarioForm] = useState({
    code: '',
    name: '',
    description: '',
    type: 'base',
    parent_scenario_id: null,
    version: 1,
    status: 'draft',
    tags: '',
    custom_fields: {}
  });
  
  // Fetch fiscal years on component mount
  useEffect(() => {
    fetchFiscalYears();
  }, []);
  
  // Fetch periods and scenarios when a fiscal year is selected
  useEffect(() => {
    if (selectedFiscalYear) {
      fetchPeriods(selectedFiscalYear.id);
      fetchScenarios(selectedFiscalYear.id);
    } else {
      setPeriods([]);
      setScenarios([]);
    }
  }, [selectedFiscalYear]);
  
  const fetchFiscalYears = async () => {
    setLoading(true);
    try {
      const data = await fiscalService.getAllFiscalYears();
      setFiscalYears(data);
      if (data.length > 0 && !selectedFiscalYear) {
        setSelectedFiscalYear(data[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch fiscal years');
      console.error('Error fetching fiscal years:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPeriods = async (fiscalYearId) => {
    try {
      const data = await fiscalService.getPeriods(fiscalYearId);
      setPeriods(data);
    } catch (error) {
      toast.error('Failed to fetch periods');
      console.error('Error fetching periods:', error);
    }
  };
  
  const fetchScenarios = async (fiscalYearId) => {
    try {
      const data = await fiscalService.getScenarios(fiscalYearId);
      setScenarios(data);
    } catch (error) {
      toast.error('Failed to fetch scenarios');
      console.error('Error fetching scenarios:', error);
    }
  };
  
  // Fiscal Year CRUD operations
  const handleCreateFiscalYear = async () => {
    try {
      const newFiscalYear = await fiscalService.createFiscalYear(fiscalYearForm);
      setFiscalYears([...fiscalYears, newFiscalYear]);
      setSelectedFiscalYear(newFiscalYear);
      setShowCreateModal(false);
      resetForms();
      toast.success('Fiscal year created successfully');
    } catch (error) {
      toast.error('Failed to create fiscal year');
      console.error('Error creating fiscal year:', error);
    }
  };
  
  const handleUpdateFiscalYear = async () => {
    try {
      const updatedFiscalYear = await fiscalService.updateFiscalYear(currentItem.id, fiscalYearForm);
      setFiscalYears(fiscalYears.map(fy => fy.id === updatedFiscalYear.id ? updatedFiscalYear : fy));
      setSelectedFiscalYear(updatedFiscalYear);
      setShowEditModal(false);
      resetForms();
      toast.success('Fiscal year updated successfully');
    } catch (error) {
      toast.error('Failed to update fiscal year');
      console.error('Error updating fiscal year:', error);
    }
  };
  
  const handleDeleteFiscalYear = async () => {
    try {
      await fiscalService.deleteFiscalYear(currentItem.id);
      setFiscalYears(fiscalYears.filter(fy => fy.id !== currentItem.id));
      if (selectedFiscalYear && selectedFiscalYear.id === currentItem.id) {
        setSelectedFiscalYear(fiscalYears.length > 1 ? fiscalYears.find(fy => fy.id !== currentItem.id) : null);
      }
      setShowDeleteModal(false);
      resetForms();
      toast.success('Fiscal year deleted successfully');
    } catch (error) {
      toast.error('Failed to delete fiscal year');
      console.error('Error deleting fiscal year:', error);
    }
  };
  
  // Period CRUD operations
  const handleCreatePeriod = async () => {
    try {
      const newPeriod = await fiscalService.createPeriod(selectedFiscalYear.id, periodForm);
      setPeriods([...periods, newPeriod]);
      setShowCreateModal(false);
      resetForms();
      toast.success('Period created successfully');
    } catch (error) {
      toast.error('Failed to create period');
      console.error('Error creating period:', error);
    }
  };
  
  const handleUpdatePeriod = async () => {
    try {
      const updatedPeriod = await fiscalService.updatePeriod(currentItem.id, periodForm);
      setPeriods(periods.map(p => p.id === updatedPeriod.id ? updatedPeriod : p));
      setShowEditModal(false);
      resetForms();
      toast.success('Period updated successfully');
    } catch (error) {
      toast.error('Failed to update period');
      console.error('Error updating period:', error);
    }
  };
  
  const handleDeletePeriod = async () => {
    try {
      await fiscalService.deletePeriod(currentItem.id);
      setPeriods(periods.filter(p => p.id !== currentItem.id));
      setShowDeleteModal(false);
      resetForms();
      toast.success('Period deleted successfully');
    } catch (error) {
      toast.error('Failed to delete period');
      console.error('Error deleting period:', error);
    }
  };
  
  // Scenario CRUD operations
  const handleCreateScenario = async () => {
    try {
      const newScenario = await fiscalService.createScenario(selectedFiscalYear.id, scenarioForm);
      setScenarios([...scenarios, newScenario]);
      setShowCreateModal(false);
      resetForms();
      toast.success('Scenario created successfully');
    } catch (error) {
      toast.error('Failed to create scenario');
      console.error('Error creating scenario:', error);
    }
  };
  
  const handleUpdateScenario = async () => {
    try {
      const updatedScenario = await fiscalService.updateScenario(currentItem.id, scenarioForm);
      setScenarios(scenarios.map(s => s.id === updatedScenario.id ? updatedScenario : s));
      setShowEditModal(false);
      resetForms();
      toast.success('Scenario updated successfully');
    } catch (error) {
      toast.error('Failed to update scenario');
      console.error('Error updating scenario:', error);
    }
  };
  
  const handleDeleteScenario = async () => {
    try {
      await fiscalService.deleteScenario(currentItem.id);
      setScenarios(scenarios.filter(s => s.id !== currentItem.id));
      setShowDeleteModal(false);
      resetForms();
      toast.success('Scenario deleted successfully');
    } catch (error) {
      toast.error('Failed to delete scenario');
      console.error('Error deleting scenario:', error);
    }
  };
  
  // Helper functions
  const resetForms = () => {
    setFiscalYearForm({
      name: '',
      code: '',
      start_date: '',
      end_date: '',
      status: 'active',
      metadata: {}
    });
    
    setPeriodForm({
      code: '',
      name: '',
      start_date: '',
      end_date: '',
      type: 'month',
      status: 'open',
      is_rollup: false,
      parent_period_id: null
    });
    
    setScenarioForm({
      code: '',
      name: '',
      description: '',
      type: 'base',
      parent_scenario_id: null,
      version: 1,
      status: 'draft',
      tags: '',
      custom_fields: {}
    });
    
    setCurrentItem(null);
  };
  
  const handleEditClick = (item) => {
    setCurrentItem(item);
    
    if (activeTab === 'years') {
      setFiscalYearForm({
        name: item.name,
        code: item.code,
        start_date: item.start_date.split('T')[0],
        end_date: item.end_date.split('T')[0],
        status: item.status,
        metadata: item.metadata || {}
      });
    } else if (activeTab === 'periods') {
      setPeriodForm({
        code: item.code,
        name: item.name,
        start_date: item.start_date.split('T')[0],
        end_date: item.end_date.split('T')[0],
        type: item.type,
        status: item.status,
        is_rollup: item.is_rollup,
        parent_period_id: item.parent_period_id
      });
    } else if (activeTab === 'scenarios') {
      setScenarioForm({
        code: item.code,
        name: item.name,
        description: item.description || '',
        type: item.type,
        parent_scenario_id: item.parent_scenario_id,
        version: item.version,
        status: item.status,
        tags: item.tags || '',
        custom_fields: item.custom_fields || {}
      });
    }
    
    setShowEditModal(true);
  };
  
  const handleDeleteClick = (item) => {
    setCurrentItem(item);
    setShowDeleteModal(true);
  };
  
  const handleCreateClick = () => {
    resetForms();
    
    // Set default dates for fiscal year and period forms
    if (activeTab === 'years') {
      const currentYear = new Date().getFullYear();
      setFiscalYearForm({
        ...fiscalYearForm,
        name: `Fiscal Year ${currentYear}`,
        code: `FY${currentYear}`,
        start_date: `${currentYear}-01-01`,
        end_date: `${currentYear}-12-31`
      });
    } else if (activeTab === 'periods' && selectedFiscalYear) {
      setPeriodForm({
        ...periodForm,
        start_date: selectedFiscalYear.start_date.split('T')[0],
        end_date: selectedFiscalYear.end_date.split('T')[0]
      });
    }
    
    setShowCreateModal(true);
  };
  
  const handleGeneratePeriodsClick = () => {
    if (!selectedFiscalYear) return;
    
    try {
      // Generate monthly periods
      const monthlyPeriods = fiscalService.generateMonthlyPeriods(
        selectedFiscalYear.id,
        selectedFiscalYear.start_date,
        selectedFiscalYear.end_date
      );
      
      // Generate quarterly periods
      const quarterlyPeriods = fiscalService.generateQuarterlyPeriods(
        selectedFiscalYear.id,
        selectedFiscalYear.start_date,
        selectedFiscalYear.end_date
      );
      
      // Combine periods
      const allPeriods = [...monthlyPeriods, ...quarterlyPeriods];
      
      // Create periods in bulk
      fiscalService.createPeriodsInBulk(selectedFiscalYear.id, allPeriods)
        .then(newPeriods => {
          setPeriods([...periods, ...newPeriods]);
          toast.success('Periods generated successfully');
        })
        .catch(error => {
          toast.error('Failed to generate periods');
          console.error('Error generating periods:', error);
        });
    } catch (error) {
      toast.error('Failed to generate periods');
      console.error('Error generating periods:', error);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Render functions
  const renderFiscalYearsList = () => {
    if (loading) {
      return <div className="text-center py-4">Loading fiscal years...</div>;
    }
    
    if (fiscalYears.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">No fiscal years found</p>
          <button
            onClick={handleCreateClick}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create First Fiscal Year
          </button>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fiscalYears.map((fiscalYear) => (
              <tr 
                key={fiscalYear.id} 
                className={`hover:bg-gray-50 ${selectedFiscalYear && selectedFiscalYear.id === fiscalYear.id ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedFiscalYear(fiscalYear)}
              >
                <td className="px-6 py-4 whitespace-nowrap">{fiscalYear.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fiscalYear.code}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(fiscalYear.start_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(fiscalYear.end_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${fiscalYear.status === 'active' ? 'bg-green-100 text-green-800' : fiscalYear.status === 'locked' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {fiscalYear.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditClick(fiscalYear); }}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(fiscalYear); }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderPeriodsList = () => {
    if (!selectedFiscalYear) {
      return <div className="text-center py-4">Please select a fiscal year first</div>;
    }
    
    if (periods.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">No periods found for this fiscal year</p>
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create Period
            </button>
            <button
              onClick={handleGeneratePeriodsClick}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Generate Standard Periods
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Periods for {selectedFiscalYear.name}</h3>
          <div className="space-x-2">
            <button
              onClick={handleCreateClick}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Add Period
            </button>
            <button
              onClick={handleGeneratePeriodsClick}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
            >
              Generate Standard Periods
            </button>
          </div>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {periods.map((period) => (
              <tr key={period.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{period.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{period.code}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(period.start_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(period.end_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${period.type === 'month' ? 'bg-blue-100 text-blue-800' : period.type === 'quarter' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {period.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${period.status === 'open' ? 'bg-green-100 text-green-800' : period.status === 'closed' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {period.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(period)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(period)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderScenariosList = () => {
    if (!selectedFiscalYear) {
      return <div className="text-center py-4">Please select a fiscal year first</div>;
    }
    
    if (scenarios.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">No scenarios found for this fiscal year</p>
          <button
            onClick={handleCreateClick}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create Scenario
          </button>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Scenarios for {selectedFiscalYear.name}</h3>
          <button
            onClick={handleCreateClick}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Add Scenario
          </button>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scenarios.map((scenario) => (
              <tr key={scenario.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{scenario.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{scenario.code}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${scenario.type === 'base' ? 'bg-blue-100 text-blue-800' : scenario.type === 'budget' ? 'bg-green-100 text-green-800' : scenario.type === 'forecast' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {scenario.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{scenario.version}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${scenario.status === 'active' ? 'bg-green-100 text-green-800' : scenario.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : scenario.status === 'final' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {scenario.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(scenario)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(scenario)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderSettingsTab = () => {
    if (!selectedFiscalYear) {
      return <div className="text-center py-4">Please select a fiscal year first</div>;
    }

    return (
      <div>
        <h3 className="text-lg font-medium">Settings for {selectedFiscalYear.name}</h3>
        <p className="text-gray-500 mt-2">Settings will be available here in a future update.</p>
      </div>
    );
  };

  const renderAuditTab = () => {
    if (!selectedFiscalYear) {
      return <div className="text-center py-4">Please select a fiscal year first</div>;
    }

    return (
      <div>
        <h3 className="text-lg font-medium">Audit History for {selectedFiscalYear.name}</h3>
        <p className="text-gray-500 mt-2">Audit trail will be available here in a future update.</p>
      </div>
    );
  };
  
  // Modal components
  const renderCreateModal = () => {
    let title = '';
    let form = null;
    let handleSubmit = null;
    
    if (activeTab === 'years') {
      title = 'Create Fiscal Year';
      form = renderFiscalYearForm();
      handleSubmit = handleCreateFiscalYear;
    } else if (activeTab === 'periods') {
      title = 'Create Period';
      form = renderPeriodForm();
      handleSubmit = handleCreatePeriod;
    } else if (activeTab === 'scenarios') {
      title = 'Create Scenario';
      form = renderScenarioForm();
      handleSubmit = handleCreateScenario;
    }
    
    return (
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 ${showCreateModal ? '' : 'hidden'}`}>
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{title}</h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
          {form}
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    let title = '';
    let form = null;
    let handleSubmit = null;
    
    if (activeTab === 'years') {
      title = 'Edit Fiscal Year';
      form = renderFiscalYearForm();
      handleSubmit = handleUpdateFiscalYear;
    } else if (activeTab === 'periods') {
      title = 'Edit Period';
      form = renderPeriodForm();
      handleSubmit = handleUpdatePeriod;
    } else if (activeTab === 'scenarios') {
      title = 'Edit Scenario';
      form = renderScenarioForm();
      handleSubmit = handleUpdateScenario;
    }
    
    return (
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 ${showEditModal ? '' : 'hidden'}`}>
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{title}</h3>
            <button
              onClick={() => setShowEditModal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
          {form}
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteModal = () => {
    let title = '';
    let message = '';
    let handleSubmit = null;
    
    if (activeTab === 'years') {
      title = 'Delete Fiscal Year';
      message = `Are you sure you want to delete the fiscal year "${currentItem?.name}"? This action cannot be undone.`;
      handleSubmit = handleDeleteFiscalYear;
    } else if (activeTab === 'periods') {
      title = 'Delete Period';
      message = `Are you sure you want to delete the period "${currentItem?.name}"? This action cannot be undone.`;
      handleSubmit = handleDeletePeriod;
    } else if (activeTab === 'scenarios') {
      title = 'Delete Scenario';
      message = `Are you sure you want to delete the scenario "${currentItem?.name}"? This action cannot be undone.`;
      handleSubmit = handleDeleteScenario;
    }
    
    return (
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 ${showDeleteModal ? '' : 'hidden'}`}>
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-red-600">{title}</h3>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
          <p className="text-gray-500 mb-4">{message}</p>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fiscal Management</h1>
        <p className="text-gray-600">Manage fiscal years, periods, and scenarios</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('years')}
              className={`${activeTab === 'years' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Fiscal Years
            </button>
            <button
              onClick={() => setActiveTab('periods')}
              className={`${activeTab === 'periods' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Periods
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`${activeTab === 'scenarios' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Scenarios
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${activeTab === 'settings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`${activeTab === 'audit' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Audit History
            </button>
          </nav>
        </div>

        <div className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex-1">
              {activeTab === 'years' && (
                <button
                  onClick={handleCreateClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create Fiscal Year
                </button>
              )}
            </div>
          </div>

          {activeTab === 'years' && renderFiscalYearsList()}
          {activeTab === 'periods' && renderPeriodsList()}
          {activeTab === 'scenarios' && renderScenariosList()}
          {activeTab === 'settings' && renderSettingsTab()}
          {activeTab === 'audit' && renderAuditTab()}
        </div>
      </div>

      {renderCreateModal()}
      {renderEditModal()}
      {renderDeleteModal()}
    </div>
  );
};

export default FiscalManagement;

  const renderFiscalYearForm = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={fiscalYearForm.name}
            onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Code</label>
          <input
            type="text"
            value={fiscalYearForm.code}
            onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, code: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={fiscalYearForm.start_date}
            onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, start_date: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={fiscalYearForm.end_date}
            onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, end_date: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={fiscalYearForm.status}
            onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, status: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="active">Active</option>
            <option value="locked">Locked</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
    );
  };

  const renderPeriodForm = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={periodForm.name}
            onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Code</label>
          <input
            type="text"
            value={periodForm.code}
            onChange={(e) => setPeriodForm({ ...periodForm, code: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={periodForm.start_date}
            onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={periodForm.end_date}
            onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={periodForm.type}
            onChange={(e) => setPeriodForm({ ...periodForm, type: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={periodForm.status}
            onChange={(e) => setPeriodForm({ ...periodForm, status: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="locked">Locked</option>
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={periodForm.is_rollup}
            onChange={(e) => setPeriodForm({ ...periodForm, is_rollup: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">Is Rollup Period</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Parent Period</label>
          <select
            value={periodForm.parent_period_id || ''}
            onChange={(e) => setPeriodForm({ ...periodForm, parent_period_id: e.target.value ? parseInt(e.target.value) : null })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">None</option>
            {periods.filter(p => p.is_rollup).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const renderScenarioForm = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={scenarioForm.name}
            onChange={(e) => setScenarioForm({ ...scenarioForm, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Code</label>
          <input
            type="text"
            value={scenarioForm.code}
            onChange={(e) => setScenarioForm({ ...scenarioForm, code: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={scenarioForm.description}
            onChange={(e) => setScenarioForm({ ...scenarioForm, description: e.target.value })}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={scenarioForm.type}
            onChange={(e) => setScenarioForm({ ...scenarioForm, type: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="base">Base</option>
            <option value="budget">Budget</option>
            <option value="forecast">Forecast</option>
            <option value="what-if">What-if</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Version</label>
          <input
            type="number"
            value={scenarioForm.version}
            onChange={(e) => setScenarioForm({ ...scenarioForm, version: parseInt(e.target.value) || 1 })}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={scenarioForm.status}
            onChange={(e) => setScenarioForm({ ...scenarioForm, status: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="final">Final</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <input
            type="text"
            value={scenarioForm.tags}
            onChange={(e) => setScenarioForm({ ...scenarioForm, tags: e.target.value })}
            placeholder="Comma-separated tags"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Parent Scenario</label>
          <select
            value={scenarioForm.parent_scenario_id || ''}
            onChange={(e) => setScenarioForm({ ...scenarioForm, parent_scenario_id: e.target.value ? parseInt(e.target.value) : null })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">None</option>
            {scenarios.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Custom Fields (JSON)</label>
          <textarea
            value={typeof scenarioForm.custom_fields === 'string' ? scenarioForm.custom_fields : JSON.stringify(scenarioForm.custom_fields, null, 2)}
            onChange={(e) => setScenarioForm({ ...scenarioForm, custom_fields: e.target.value })}
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder='{\"key\": \"value\"}'
          />
        </div>
      </div>
    );
  };