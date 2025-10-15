import React, { useState } from 'react';

const AddScenarioModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scenarioType, setScenarioType] = useState('Budget');
  const [status, setStatus] = useState('Draft');
  const [group, setGroup] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onAdd({ name, description, scenario_type: scenarioType, status, group });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Scenario</h3>
        <div className="mt-2">
          <input
            type="text"
            placeholder="Scenario Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded mt-2"
          />
          <input
            type="text"
            placeholder="Group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full p-2 border rounded mt-2"
          />
          <select
            value={scenarioType}
            onChange={(e) => setScenarioType(e.target.value)}
            className="w-full p-2 border rounded mt-2"
          >
            <option value="Base">Base</option>
            <option value="Budget">Budget</option>
            <option value="Forecast">Forecast</option>
            <option value="What-If">What-If</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border rounded mt-2"
          >
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Final">Final</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
        <div className="items-center px-4 py-3">
          <button
            className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
            onClick={handleSubmit}
          >
            Add
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 mt-2"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddScenarioModal;
