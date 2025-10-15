import React, { useState } from 'react';

const AddPeriodModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodType, setPeriodType] = useState('Month');
  const [status, setStatus] = useState('Open');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onAdd({ name, start_date: startDate, end_date: endDate, period_type: periodType, status });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Period</h3>
        <div className="mt-2">
          <input
            type="text"
            placeholder="Period Name (e.g., Jan 2025)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded mt-2"
          />
          <input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded mt-2"
          />
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            className="w-full p-2 border rounded mt-2"
          >
            <option value="Month">Month</option>
            <option value="Quarter">Quarter</option>
            <option value="Custom">Custom</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border rounded mt-2"
          >
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Locked">Locked</option>
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

export default AddPeriodModal;
