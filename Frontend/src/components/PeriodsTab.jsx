import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddPeriodModal from './AddPeriodModal';

const PeriodsTab = ({ fiscalYear }) => {
  const [periods, setPeriods] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPeriods = async () => {
    if (fiscalYear) {
      try {
        const response = await axios.get(`/api/fiscal-years/${fiscalYear.id}/periods`);
        setPeriods(response.data);
      } catch (error) {
        console.error('Error fetching periods:', error);
      }
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, [fiscalYear]);

  const handleAddPeriod = async (newPeriod) => {
    try {
      await axios.post('/api/periods', { ...newPeriod, fiscal_year_id: fiscalYear.id });
      setIsModalOpen(false);
      fetchPeriods();
    } catch (error) {
      console.error('Error adding period:', error);
    }
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700">Add Period</button>
      <table className="mt-4 w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Start Date</th>
            <th className="border px-4 py-2">End Date</th>
            <th className="border px-4 py-2">Type</th>
            <th className="border px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period.id}>
              <td className="border px-4 py-2">{period.name}</td>
              <td className="border px-4 py-2">{period.start_date}</td>
              <td className="border px-4 py-2">{period.end_date}</td>
              <td className="border px-4 py-2">{period.period_type}</td>
              <td className="border px-4 py-2">{period.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddPeriodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddPeriod}
      />
    </div>
  );
};

export default PeriodsTab;
