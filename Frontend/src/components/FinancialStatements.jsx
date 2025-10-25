import React, { useState, useEffect } from "react";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Download,
  X,
  Loader2,
  AlertCircle,
  Settings,
  Eye,
  Save,
  RefreshCw,
  Filter,
  Search,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { useCompany } from "../contexts/CompanyContext";

const FinancialStatements = ({ processContext = {}, nodeConfig = {}, onClose, onSaveConfig }) => {
  const { selectedCompany } = useCompany();

  // Validate and set defaults for processContext
  const safeProcessContext = {
    processId: processContext.processId || null,
    processName: processContext.processName || "Unknown Process",
    entityIds: Array.isArray(processContext.entityIds) ? processContext.entityIds : [],
    entityNames: Array.isArray(processContext.entityNames) ? processContext.entityNames : [],
    scenarioId: processContext.scenarioId || null,
    scenarioName: processContext.scenarioName || null,
    fiscalYear: processContext.fiscalYear || null,
    fiscalYearName: processContext.fiscalYearName || null,
    selectedPeriods: Array.isArray(processContext.selectedPeriods) ? processContext.selectedPeriods : [],
    periodNames: Array.isArray(processContext.periodNames) ? processContext.periodNames : [],
  };

  // Node Configuration State
  const [config, setConfig] = useState({
    hierarchyId: nodeConfig.hierarchyId || null,
    reportType: nodeConfig.reportType || "balance_sheet",
    showZeroBalances: nodeConfig.showZeroBalances !== undefined ? nodeConfig.showZeroBalances : false,
    showICColumn: nodeConfig.showICColumn !== undefined ? nodeConfig.showICColumn : true,
    showOtherColumn: nodeConfig.showOtherColumn !== undefined ? nodeConfig.showOtherColumn : true,
    roundingFactor: nodeConfig.roundingFactor || 1,
    currency: nodeConfig.currency || "INR",
  });

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hierarchies, setHierarchies] = useState([]);
  const [entities, setEntities] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [drillDownData, setDrillDownData] = useState(null);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Color scheme
  const colorScheme = {
    entityAmount: "#3B82F6",
    icAmount: "#10B981",
    otherAmount: "#F59E0B",
    total: "#1F2937",
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchHierarchies();
      fetchEntities();
    }
  }, [selectedCompany]);

  const fetchHierarchies = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/axes-account/hierarchies?company_name=${selectedCompany}`
      );

      if (response.ok) {
        const data = await response.json();
        setHierarchies(data.hierarchies || []);
      } else {
        setError("Failed to fetch account hierarchies");
      }
    } catch (error) {
      console.error("Error fetching hierarchies:", error);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      const response = await fetch(
        `/api/axes-entity/elements?company_name=${selectedCompany}`
      );

      if (response.ok) {
        const data = await response.json();
        const filteredEntities = safeProcessContext.entityIds.length > 0
          ? data.filter(e => safeProcessContext.entityIds.includes(e.id || e.code))
          : data;
        setEntities(filteredEntities);
      }
    } catch (error) {
      console.error("Error fetching entities:", error);
    }
  };

  const generateReport = async () => {
    if (!config.hierarchyId) {
      alert("Please select an account hierarchy in settings");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const response = await fetch(
        `/api/financial-statements/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_name: selectedCompany,
            process_id: safeProcessContext.processId,
            scenario_id: safeProcessContext.scenarioId,
            hierarchy_id: config.hierarchyId,
            entity_ids: safeProcessContext.entityIds,
            period_ids: safeProcessContext.selectedPeriods,
            report_type: config.reportType,
            show_zero_balances: config.showZeroBalances,
            show_ic_column: config.showICColumn,
            show_other_column: config.showOtherColumn,
            rounding_factor: config.roundingFactor,
            currency: config.currency,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate financial statement");
      }

      const data = await response.json();
      setReportData(data);
      
      if (data.nodes && data.nodes.length > 0) {
        const topLevelNodes = new Set(data.nodes.map(n => `node_${n.id}`));
        setExpandedNodes(topLevelNodes);
      }

    } catch (error) {
      console.error("Error generating report:", error);
      setError("Unable to generate report: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const exportToExcel = async () => {
    if (!reportData) {
      alert("No report to export");
      return;
    }

    try {
      const response = await fetch(
        `/api/financial-statements/export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_name: selectedCompany,
            report_data: reportData,
            config: config,
            format: "excel",
          }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Financial_Statement_${config.reportType}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report");
    }
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const formatNumber = (value, rounding = 1) => {
    if (!value && value !== 0) return "-";
    const rounded = value / rounding;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(rounded);
  };

  const calculateNodeTotal = (node, entityId) => {
    let total = { entity_amount: 0, ic_amount: 0, other_amount: 0 };

    if (node.accounts) {
      node.accounts.forEach((account) => {
        const amounts = account.amounts?.[entityId] || {};
        total.entity_amount += amounts.entity_amount || 0;
        total.ic_amount += amounts.ic_amount || 0;
        total.other_amount += amounts.other_amount || 0;
      });
    }

    if (node.children) {
      node.children.forEach((child) => {
        const childTotal = calculateNodeTotal(child, entityId);
        total.entity_amount += childTotal.entity_amount;
        total.ic_amount += childTotal.ic_amount;
        total.other_amount += childTotal.other_amount;
      });
    }

    return total;
  };

  const handleDrillDown = async (accountCode, entityId) => {
    try {
      const response = await fetch(
        `/api/financial-statements/drill-down?` +
        `company_name=${selectedCompany}&` +
        `process_id=${safeProcessContext.processId}&` +
        `scenario_id=${safeProcessContext.scenarioId}&` +
        `account_code=${accountCode}&` +
        `entity_id=${entityId}&` +
        `period_ids=${safeProcessContext.selectedPeriods.join(",")}`
      );

      if (response.ok) {
        const data = await response.json();
        setDrillDownData(data);
        setShowDrillDown(true);
      }
    } catch (error) {
      console.error("Error fetching drill-down data:", error);
      alert("Failed to fetch drill-down data");
    }
  };

  const handleSaveConfig = () => {
    if (onSaveConfig) {
      onSaveConfig(config);
    }
    setShowSettings(false);
    alert("Configuration saved successfully");
  };

  // Component continues in next part...
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-hidden flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-3">
            <FileText className="text-white" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-white">Financial Statements</h2>
              <p className="text-blue-100 text-sm">
                {safeProcessContext.processName} | {safeProcessContext.scenarioName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-white hover:bg-blue-600 rounded-lg transition-colors"
            >
              <Settings size={20} />
            </button>
            <button onClick={onClose} className="p-2 text-white hover:bg-blue-600 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Hierarchy
                </label>
                <select
                  value={config.hierarchyId || ""}
                  onChange={(e) => setConfig({ ...config, hierarchyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Hierarchy</option>
                  {hierarchies.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hierarchy_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Type
                </label>
                <select
                  value={config.reportType}
                  onChange={(e) => setConfig({ ...config, reportType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="balance_sheet">Balance Sheet</option>
                  <option value="profit_loss">Profit & Loss</option>
                  <option value="cash_flow">Cash Flow Statement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rounding
                </label>
                <select
                  value={config.roundingFactor}
                  onChange={(e) => setConfig({ ...config, roundingFactor: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="1">Units</option>
                  <option value="1000">Thousands</option>
                  <option value="1000000">Millions</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.showZeroBalances}
                    onChange={(e) => setConfig({ ...config, showZeroBalances: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Zero Balances</span>
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.showICColumn}
                    onChange={(e) => setConfig({ ...config, showICColumn: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show IC Column</span>
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.showOtherColumn}
                    onChange={(e) => setConfig({ ...config, showOtherColumn: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Other Column</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save size={16} />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={generateReport}
              disabled={generating || !config.hierarchyId}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportToExcel}
              disabled={!reportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <FileSpreadsheet size={16} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="text-red-500 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          ) : !reportData ? (
            <div className="flex flex-col items-center justify-center h-full">
              <FileText size={64} className="text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700">No Report Generated</p>
              <p className="text-sm text-gray-500 mt-2">Configure settings and click Generate Report</p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{reportData.report_title}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Account Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      {entities.map((entity) => (
                        <th
                          key={entity.id || entity.code}
                          colSpan={3}
                          className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase border-x"
                        >
                          {entity.name || entity.entity_name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-100">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.nodes && reportData.nodes.map((node) => (
                      <tr key={node.id}>
                        <td className="px-4 py-3 text-sm font-medium">{node.code}</td>
                        <td className="px-4 py-3 text-sm">{node.name}</td>
                        {entities.map((entity) => (
                          <td key={`${node.id}-${entity.id}`} className="px-3 py-3 text-sm text-right">
                            {formatNumber(0, config.roundingFactor)}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm text-right font-bold">0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Drill-down Modal */}
        {showDrillDown && drillDownData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-auto m-4">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Transaction Details</h3>
                <button onClick={() => setShowDrillDown(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reference</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillDownData.entries && drillDownData.entries.map((entry, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2 text-sm">{entry.date}</td>
                        <td className="px-4 py-2 text-sm">{entry.reference}</td>
                        <td className="px-4 py-2 text-sm">{entry.description}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatNumber(entry.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialStatements;
