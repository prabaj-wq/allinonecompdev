import React, { useState } from 'react';
import PeriodsTab from './PeriodsTab';
import ScenariosTab from './ScenariosTab';
import SettingsTab from './SettingsTab';
import AuditHistoryTab from './AuditHistoryTab';

const FiscalYearDetails = ({ fiscalYear }) => {
  const [activeTab, setActiveTab] = useState('Periods');

  if (!fiscalYear) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Periods':
        return <PeriodsTab fiscalYear={fiscalYear} />;
      case 'Scenarios':
        return <ScenariosTab fiscalYear={fiscalYear} />;
      case 'Settings':
        return <SettingsTab fiscalYear={fiscalYear} />;
      case 'Audit':
        return <AuditHistoryTab fiscalYear={fiscalYear} />;
      default:
        return null;
    }
  };

  return (
    <div className="mt-4 p-4 border rounded">
      <h2 className="text-xl font-bold">{fiscalYear.name}</h2>
      <p>Start Date: {fiscalYear.start_date}</p>
      <p>End Date: {fiscalYear.end_date}</p>
      <p>Status: {fiscalYear.status}</p>
      <div className="mt-4">
        <div className="flex border-b">
          <button onClick={() => setActiveTab('Periods')} className={`px-4 py-2 ${activeTab === 'Periods' ? 'border-b-2 border-blue-500' : ''}`}>Periods</button>
          <button onClick={() => setActiveTab('Scenarios')} className={`px-4 py-2 ${activeTab === 'Scenarios' ? 'border-b-2 border-blue-500' : ''}`}>Scenarios</button>
          <button onClick={() => setActiveTab('Settings')} className={`px-4 py-2 ${activeTab === 'Settings' ? 'border-b-2 border-blue-500' : ''}`}>Settings</button>
          <button onClick={() => setActiveTab('Audit')} className={`px-4 py-2 ${activeTab === 'Audit' ? 'border-b-2 border-blue-500' : ''}`}>Audit</button>
        </div>
        <div className="mt-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default FiscalYearDetails;
