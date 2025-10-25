import React from "react";
import { X } from "lucide-react";

const FinancialStatementsSimple = ({ processContext = {}, nodeConfig = {}, onClose, onSaveConfig }) => {
  console.log("🚀 FinancialStatementsSimple component rendering");
  console.log("📊 Process Context:", processContext);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-hidden flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full h-full max-w-4xl max-h-[80vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-white">Financial Statements (Test)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-blue-600 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Test Modal Working!</h3>
            <p className="text-gray-600 mb-4">
              Process: {processContext.processName || "Unknown"}
            </p>
            <p className="text-gray-600 mb-4">
              Scenario: {processContext.scenarioName || "Unknown"}
            </p>
            <p className="text-gray-600 mb-4">
              Entities: {processContext.entityIds ? processContext.entityIds.length : 0}
            </p>
            <p className="text-gray-600">
              Periods: {processContext.selectedPeriods ? processContext.selectedPeriods.length : 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialStatementsSimple;
