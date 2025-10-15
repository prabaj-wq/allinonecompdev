import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddScenarioModal from './AddScenarioModal';

const ScenariosTab = ({ fiscalYear }) => {
  const [scenarios, setScenarios] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchScenarios = async () => {
    if (fiscalYear) {
      try {
        const response = await axios.get(`/api/fiscal-years/${fiscalYear.id}/scenarios`);
        setScenarios(response.data);
      } catch (error) {
        console.error('Error fetching scenarios:', error);
      }
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, [fiscalYear]);

  const handleAddScenario = async (newScenario) => {
    try {
      await axios.post('/api/scenarios', { ...newScenario, fiscal_year_id: fiscalYear.id });
      setIsModalOpen(false);
      fetchScenarios();
    } catch (error) {
      console.error('Error adding scenario:', error);
    }
  };

  const groupedScenarios = scenarios.reduce((acc, scenario) => {
    const group = scenario.group || 'Uncategorized';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(scenario);
    return acc;
  }, {});

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700">Add Scenario</button>
      <div className="mt-4">
        {Object.entries(groupedScenarios).map(([group, scenarios]) => (
          <div key={group} className="mb-4">
            <h3 className="text-xl font-bold">{group}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="p-4 border rounded-lg shadow-sm">
                  <h3 className="text-lg font-bold">{scenario.name}</h3>
                  <p>{scenario.description}</p>
                  <p>Type: {scenario.scenario_type}</p>
                  <p>Status: {scenario.status}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <AddScenarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddScenario}
      />
    </div>
  );
};

export default ScenariosTab;
