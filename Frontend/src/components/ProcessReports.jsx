import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Eye,
  Printer,
  RefreshCw,
  Settings,
  TrendingUp,
  DollarSign,
  Building2,
  AlertCircle,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useCompany } from "../contexts/CompanyContext";

const ProcessReports = ({ processContext, onClose }) => {
  const { selectedCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [hierarchies, setHierarchies] = useState([]);
  const [selectedHierarchy, setSelectedHierarchy] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [entities, setEntities] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [reportSettings, setReportSettings] = useState({
    showZeroBalances: false,
    showICAmounts: true,
    showOtherAmounts: true,
    consolidationLevel: "entity",
    currency: "USD",
    roundingFactor: 1,
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Color scheme for different data types
  const colorScheme = {
    entityAmount: "#3B82F6", // Blue
    icAmount: "#10B981", // Green
    otherAmount: "#F59E0B", // Amber
    total: "#6B7280", // Gray
    subtotal: "#8B5CF6", // Purple
    variance: "#EF4444", // Red
  };

  // Fetch available hierarchies
  useEffect(() => {
    if (selectedCompany) {
      fetchHierarchies();
      fetchEntities();
    }
  }, [selectedCompany]);

  const fetchHierarchies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/financial-reports/hierarchies?company_name=${selectedCompany}&hierarchy_type=Account`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setHierarchies(data.hierarchies || []);
      } else if (response.status === 404) {
        setError(
          "Financial reports module is not available. Please check backend configuration.",
        );
      } else {
        setError("Failed to fetch account hierarchies");
      }
    } catch (error) {
      console.error("Error fetching hierarchies:", error);
      setError("Unable to connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      const response = await fetch(
        `/api/entities?company_name=${selectedCompany}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setEntities(data.entities || []);
      } else {
        console.warn("Failed to fetch entities, using default empty list");
        setEntities([]);
      }
    } catch (error) {
      console.error("Error fetching entities:", error);
      setEntities([]);
    }
  };

  const generateReport = async () => {
    if (!selectedHierarchy) {
      alert("Please select an account hierarchy");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const reportRequest = {
        process_context: {
          process_id: processContext.processId,
          process_name: processContext.processName,
          entity_id: processContext.entityId,
          entity_name: processContext.entityName,
          scenario_id: processContext.scenarioId,
          scenario_name: processContext.scenarioName,
          fiscal_year: processContext.fiscalYear,
          period_ids: processContext.selectedPeriods,
          period_names: processContext.periodNames,
        },
        hierarchy_selection: {
          hierarchy_id: selectedHierarchy.hierarchy_id,
          hierarchy_name: selectedHierarchy.hierarchy_name,
          hierarchy_type: "Account",
          include_children: true,
          level_limit: null,
        },
        report_settings: {
          report_type: "balance_sheet",
          periods: processContext.selectedPeriods || [],
          show_zero_balances: reportSettings.showZeroBalances,
          currency: reportSettings.currency,
          consolidation_level: reportSettings.consolidationLevel,
          rounding_factor: reportSettings.roundingFactor,
          show_variances: true,
          drill_down_enabled: true,
        },
      };

      const response = await fetch(
        `/api/financial-reports/generate?company_name=${selectedCompany}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(reportRequest),
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Fetch detailed data for each account
        await fetchAccountDetails(data.report_data);

        setReportData(data.report_data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(
          errorData.detail ||
            "Failed to generate report. Please check your settings and try again.",
        );
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setError(
        "Unable to generate report. Please check your connection and try again.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const fetchAccountDetails = async (reportData) => {
    // Fetch entity-wise amounts for each account
    try {
      const accountsToFetch = [];

      // Collect all accounts from report sections
      if (reportData.sections) {
        Object.values(reportData.sections).forEach((section) => {
          if (section.accounts) {
            accountsToFetch.push(...section.accounts);
          }
        });
      }

      // Fetch amounts for each account and entity
      for (const account of accountsToFetch) {
        const response = await fetch(
          `/api/data-input/entries?company_name=${selectedCompany}` +
            `&card_type=entity_amounts` +
            `&process_id=${processContext.processId}` +
            `&scenario_id=${processContext.scenarioId}` +
            `&account_code=${account.account_code}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          account.entityAmounts = processEntityAmounts(data.entries || []);
        }
      }
    } catch (error) {
      console.error("Error fetching account details:", error);
    }
  };

  const processEntityAmounts = (entries) => {
    const entityMap = {};

    entries.forEach((entry) => {
      const entityName = entry.entity_name || `Entity ${entry.entity_id}`;
      if (!entityMap[entityName]) {
        entityMap[entityName] = {
          entity_amount: 0,
          ic_amount: 0,
          other_amount: 0,
        };
      }

      // Categorize amounts
      if (entry.origin === "ic" || entry.card_type === "ic_amounts") {
        entityMap[entityName].ic_amount += parseFloat(entry.amount || 0);
      } else if (
        entry.origin === "other" ||
        entry.card_type === "other_amounts"
      ) {
        entityMap[entityName].other_amount += parseFloat(entry.amount || 0);
      } else {
        entityMap[entityName].entity_amount += parseFloat(entry.amount || 0);
      }
    });

    return entityMap;
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

  const exportToExcel = async () => {
    if (!reportData) return;

    try {
      const response = await fetch(
        `/api/financial-reports/export/${reportData.report_id}?format=excel&company_name=${selectedCompany}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `financial_report_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(
          errorData.detail || "Failed to export to Excel. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Unable to export to Excel. Please check your connection.");
    }
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    try {
      const response = await fetch(
        `/api/financial-reports/export/${reportData.report_id}?format=pdf&company_name=${selectedCompany}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `financial_report_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (response.status === 503) {
        alert(
          "PDF export is not available. Please install reportlab on the server (pip install reportlab).",
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.detail || "Failed to export to PDF. Please try again.");
      }
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Unable to export to PDF. Please check your connection.");
    }
  };

  const renderHierarchyTree = (nodes, level = 0) => {
    if (!nodes || nodes.length === 0) return null;

    return nodes.map((node) => (
      <div key={node.hierarchy_id} className="hierarchy-node">
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors ${
            selectedHierarchy?.hierarchy_id === node.hierarchy_id
              ? "bg-blue-50 border-l-4 border-blue-500"
              : ""
          }`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() => setSelectedHierarchy(node)}
        >
          {node.children && node.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.hierarchy_id);
              }}
              className="mr-2 text-gray-500 hover:text-gray-700"
            >
              {expandedNodes.has(node.hierarchy_id) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          )}
          <span className="flex-1 text-sm font-medium text-gray-700">
            {node.hierarchy_name}
          </span>
          {node.hierarchy_type && (
            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              {node.hierarchy_type}
            </span>
          )}
        </div>
        {expandedNodes.has(node.hierarchy_id) && node.children && (
          <div className="ml-2">
            {renderHierarchyTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderAccountRow = (account, level = 0) => {
    const isExpandable = account.children && account.children.length > 0;
    const isExpanded = expandedNodes.has(account.account_code);

    return (
      <>
        <tr key={account.account_code} className="hover:bg-gray-50">
          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
            <div
              className="flex items-center"
              style={{ paddingLeft: `${level * 20}px` }}
            >
              {isExpandable && (
                <button
                  onClick={() => toggleNode(account.account_code)}
                  className="mr-2 text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
              )}
              <span>{account.account_code}</span>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-gray-700">
            {account.account_name}
          </td>

          {/* Entity columns */}
          {entities.map((entity) => {
            const amounts = account.entityAmounts?.[entity.entity_name] || {};
            const total =
              (amounts.entity_amount || 0) +
              (amounts.ic_amount || 0) +
              (amounts.other_amount || 0);

            return (
              <React.Fragment key={entity.entity_id}>
                {/* Entity Amount */}
                <td className="px-3 py-3 text-sm text-right whitespace-nowrap">
                  <span style={{ color: colorScheme.entityAmount }}>
                    {formatNumber(
                      amounts.entity_amount,
                      reportSettings.roundingFactor,
                    )}
                  </span>
                </td>

                {/* IC Amount */}
                {reportSettings.showICAmounts && (
                  <td className="px-3 py-3 text-sm text-right whitespace-nowrap">
                    <span style={{ color: colorScheme.icAmount }}>
                      {formatNumber(
                        amounts.ic_amount,
                        reportSettings.roundingFactor,
                      )}
                    </span>
                  </td>
                )}

                {/* Other Amount */}
                {reportSettings.showOtherAmounts && (
                  <td className="px-3 py-3 text-sm text-right whitespace-nowrap">
                    <span style={{ color: colorScheme.otherAmount }}>
                      {formatNumber(
                        amounts.other_amount,
                        reportSettings.roundingFactor,
                      )}
                    </span>
                  </td>
                )}

                {/* Total */}
                <td className="px-3 py-3 text-sm text-right font-semibold whitespace-nowrap border-r">
                  <span style={{ color: colorScheme.total }}>
                    {formatNumber(total, reportSettings.roundingFactor)}
                  </span>
                </td>
              </React.Fragment>
            );
          })}

          {/* Grand Total */}
          <td className="px-4 py-3 text-sm text-right font-bold whitespace-nowrap bg-gray-50">
            {formatNumber(account.subtotal || 0, reportSettings.roundingFactor)}
          </td>
        </tr>

        {/* Render children if expanded */}
        {isExpanded &&
          account.children &&
          account.children.map((child) => renderAccountRow(child, level + 1))}
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-hidden flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-3">
            <FileText className="text-white" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-white">
                Financial Reports
              </h2>
              <p className="text-blue-100 text-sm">
                Process: {processContext.processName} | Period:{" "}
                {processContext.periodNames?.join(", ")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Hierarchy Selection */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Select Account Hierarchy
              </h3>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-blue-500" size={24} />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="text-red-500 mt-0.5" size={16} />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Error
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              ) : hierarchies.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hierarchies available
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Please create account hierarchies first
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {renderHierarchyTree(hierarchies)}
                </div>
              )}
            </div>

            {/* Report Settings */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Report Settings
              </h3>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reportSettings.showZeroBalances}
                    onChange={(e) =>
                      setReportSettings({
                        ...reportSettings,
                        showZeroBalances: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Show Zero Balances
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reportSettings.showICAmounts}
                    onChange={(e) =>
                      setReportSettings({
                        ...reportSettings,
                        showICAmounts: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show IC Amounts</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reportSettings.showOtherAmounts}
                    onChange={(e) =>
                      setReportSettings({
                        ...reportSettings,
                        showOtherAmounts: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Show Other Amounts
                  </span>
                </label>

                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rounding
                  </label>
                  <select
                    value={reportSettings.roundingFactor}
                    onChange={(e) =>
                      setReportSettings({
                        ...reportSettings,
                        roundingFactor: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="1">Units</option>
                    <option value="1000">Thousands</option>
                    <option value="1000000">Millions</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generateReport}
                disabled={!selectedHierarchy || generating}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} />
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Report Area */}
          <div className="flex-1 overflow-auto">
            {error && !reportData ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Report Generation Failed
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
                  {error}
                </p>
                <button
                  onClick={() => {
                    setError(null);
                    setGenerating(false);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : reportData ? (
              <div className="p-6">
                {/* Report Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {reportData.report_title || "Financial Statement"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedCompany} | {reportData.currency || "USD"} |
                        {reportSettings.roundingFactor > 1 &&
                          ` (in ${reportSettings.roundingFactor === 1000 ? "thousands" : "millions"})`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={exportToExcel}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 text-sm"
                      >
                        <Download size={16} />
                        <span>Excel</span>
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 text-sm"
                      >
                        <Printer size={16} />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Color Legend */}
                <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-600">
                    Legend:
                  </span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: colorScheme.entityAmount }}
                    ></div>
                    <span className="text-xs text-gray-600">Entity Amount</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: colorScheme.icAmount }}
                    ></div>
                    <span className="text-xs text-gray-600">IC Amount</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: colorScheme.otherAmount }}
                    ></div>
                    <span className="text-xs text-gray-600">Other Amount</span>
                  </div>
                </div>

                {/* Report Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>

                        {/* Entity Headers */}
                        {entities.map((entity) => (
                          <React.Fragment key={entity.entity_id}>
                            <th
                              colSpan={
                                reportSettings.showICAmounts &&
                                reportSettings.showOtherAmounts
                                  ? 4
                                  : 2
                              }
                              className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-x"
                            >
                              {entity.entity_name}
                            </th>
                          </React.Fragment>
                        ))}

                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                          Total
                        </th>
                      </tr>

                      {/* Sub-headers for amounts */}
                      <tr className="bg-gray-50">
                        <th colSpan={2}></th>
                        {entities.map((entity) => (
                          <React.Fragment key={`sub-${entity.entity_id}`}>
                            <th className="px-3 py-2 text-center text-xs text-gray-500">
                              Entity
                            </th>
                            {reportSettings.showICAmounts && (
                              <th className="px-3 py-2 text-center text-xs text-gray-500">
                                IC
                              </th>
                            )}
                            {reportSettings.showOtherAmounts && (
                              <th className="px-3 py-2 text-center text-xs text-gray-500">
                                Other
                              </th>
                            )}
                            <th className="px-3 py-2 text-center text-xs text-gray-500 border-r">
                              Total
                            </th>
                          </React.Fragment>
                        ))}
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.sections &&
                        Object.values(reportData.sections).map((section) => (
                          <React.Fragment key={section.title}>
                            <tr className="bg-blue-50">
                              <td
                                colSpan={100}
                                className="px-4 py-3 text-sm font-bold text-blue-900"
                              >
                                {section.title}
                              </td>
                            </tr>
                            {section.accounts &&
                              section.accounts.map((account) =>
                                renderAccountRow(account),
                              )}
                            <tr className="bg-gray-100 font-bold">
                              <td
                                colSpan={2}
                                className="px-4 py-3 text-sm text-gray-900"
                              >
                                Total {section.title}
                              </td>
                              {entities.map((entity) => (
                                <React.Fragment
                                  key={`total-${entity.entity_id}`}
                                >
                                  <td
                                    colSpan={
                                      reportSettings.showICAmounts &&
                                      reportSettings.showOtherAmounts
                                        ? 4
                                        : 2
                                    }
                                    className="px-3 py-3 text-sm text-right border-r"
                                  >
                                    -
                                  </td>
                                </React.Fragment>
                              ))}
                              <td className="px-4 py-3 text-sm text-right bg-gray-200">
                                {formatNumber(
                                  section.total || 0,
                                  reportSettings.roundingFactor,
                                )}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText size={64} className="mb-4" />
                <p className="text-lg font-medium">No Report Generated</p>
                <p className="text-sm mt-2">
                  Select a hierarchy and click Generate Report
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessReports;
