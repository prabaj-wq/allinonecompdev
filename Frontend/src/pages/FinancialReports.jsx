import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompany } from "../contexts/CompanyContext";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Settings,
  Save,
  RefreshCw,
  Search,
  FileSpreadsheet,
} from "lucide-react";

const FinancialReports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCompany } = useCompany();

  // Get process context from navigation state
  const processContext = location.state || {};

  console.log("📊 Financial Reports Page Loaded");
  console.log("🔍 Process Context:", processContext);

  // Configuration State
  const [config, setConfig] = useState({
    hierarchyId: null,
    showZeroBalances: false,
    showICColumn: true,
    showOtherColumn: true,
    roundingFactor: 1,
    currency: "INR",
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [hierarchies, setHierarchies] = useState([]);
  const [entities, setEntities] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
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
        const filteredEntities = processContext.entityIds && processContext.entityIds.length > 0
          ? data.filter(e => processContext.entityIds.includes(e.id || e.code))
          : data;
        setEntities(filteredEntities);
      }
    } catch (error) {
      console.error("Error fetching entities:", error);
    }
  };

  const generateReport = async () => {
    if (!config.hierarchyId) {
      alert("Please select an account hierarchy");
      return;
    }

    if (!processContext.selectedPeriods || processContext.selectedPeriods.length === 0) {
      alert("No periods selected in process context");
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
            process_id: processContext.processId,
            scenario_id: processContext.scenarioId,
            hierarchy_id: config.hierarchyId,
            entity_ids: processContext.entityIds || [],
            period_ids: processContext.selectedPeriods || [],
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

  const formatNumber = (value, rounding = 1) => {
    if (!value && value !== 0) return "-";
    const rounded = value / rounding;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(rounded);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Financial Statements
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {processContext.processName} | {processContext.scenarioName} | 
                  {processContext.periodNames && processContext.periodNames.length > 0 
                    ? ` ${processContext.periodNames.join(", ")}` 
                    : " No periods"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Report Configuration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Hierarchy *
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
          </div>

          <div className="flex items-center space-x-6 mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.showZeroBalances}
                onChange={(e) => setConfig({ ...config, showZeroBalances: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show Zero Balances</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.showICColumn}
                onChange={(e) => setConfig({ ...config, showICColumn: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show IC Column</span>
            </label>

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

          <div className="flex items-center space-x-2">
            <button
              onClick={generateReport}
              disabled={generating || !config.hierarchyId}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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

            {reportData && (
              <button
                onClick={exportToExcel}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <FileSpreadsheet size={16} />
                <span>Export Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* Report Display */}
        {error ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="flex flex-col items-center justify-center">
              <AlertCircle className="text-red-500 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          </div>
        ) : !reportData ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="flex flex-col items-center justify-center">
              <FileText size={64} className="text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No Report Generated</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Select a hierarchy and click Generate Report
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {reportData.report_title}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Account Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Description
                    </th>
                    {entities.map((entity) => (
                      <th
                        key={entity.id || entity.code}
                        className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase border-x dark:border-gray-600"
                      >
                        {entity.name || entity.entity_name}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-600">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.nodes && reportData.nodes.map((node) => (
                    <tr key={node.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {node.code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {node.name}
                      </td>
                      {entities.map((entity) => (
                        <td key={`${node.id}-${entity.id}`} className="px-3 py-3 text-sm text-right text-gray-900 dark:text-white">
                          {formatNumber(0, config.roundingFactor)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">
                        0
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;
