import React, { useState, useEffect } from "react";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Download,
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
  Printer,
} from "lucide-react";
import { useCompany } from "../contexts/CompanyContext";

const ProcessReports = ({ processContext = {}, onClose }) => {
  const { selectedCompany } = useCompany();

  // Validate and set defaults for processContext
  const safeProcessContext = {
    processId: processContext.processId || null,
    processName: processContext.processName || "Unknown Process",
    entityId: processContext.entityId || null,
    entityName: processContext.entityName || null,
    scenarioId: processContext.scenarioId || null,
    scenarioName: processContext.scenarioName || null,
    fiscalYear: processContext.fiscalYear || null,
    selectedPeriods: Array.isArray(processContext.selectedPeriods)
      ? processContext.selectedPeriods
      : [],
    periodNames: Array.isArray(processContext.periodNames)
      ? processContext.periodNames
      : [],
  };

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
    currency: "USD",
    roundingFactor: 1,
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Color scheme for different data types
  const colorScheme = {
    entityAmount: "#3B82F6",
    icAmount: "#10B981",
    otherAmount: "#F59E0B",
    total: "#6B7280",
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
      setError(null);
      const response = await fetch(
        `/api/axes-account/hierarchies?company_name=${selectedCompany}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setHierarchies(data.hierarchies || []);
      } else {
        setError("Failed to fetch account hierarchies. Please create account hierarchies in Axes Account module first.");
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
        `/api/axes-entity/elements?company_name=${selectedCompany}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setEntities(data || []);
      } else {
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

      // Fetch hierarchy structure with nodes and accounts
      const structureResponse = await fetch(
        `/api/axes-account/hierarchy-structure/${selectedHierarchy.id}?company_name=${selectedCompany}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!structureResponse.ok) {
        throw new Error("Failed to fetch hierarchy structure");
      }

      const hierarchyData = await structureResponse.json();

      // Fetch data for all accounts
      const accountsWithData = await Promise.all(
        (hierarchyData.accounts || []).map(async (account) => {
          const amounts = await fetchAccountAmounts(account.code);
          return {
            ...account,
            entityAmounts: amounts,
          };
        })
      );

      // Build report structure
      const reportData = {
        report_title: `${selectedHierarchy.hierarchy_name} - Financial Statement`,
        report_id: `report_${Date.now()}`,
        currency: reportSettings.currency,
        nodes: await enrichNodesWithAccounts(hierarchyData.nodes, accountsWithData),
        accounts: accountsWithData,
        unassigned_accounts: hierarchyData.unassigned_accounts || [],
      };

      setReportData(reportData);
    } catch (error) {
      console.error("Error generating report:", error);
      setError("Unable to generate report. " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const enrichNodesWithAccounts = async (nodes, accounts) => {
    if (!nodes || nodes.length === 0) return [];

    return nodes.map((node) => {
      // Find accounts that belong to this node
      const nodeAccounts = accounts.filter((acc) => acc.node_id === node.id);

      return {
        ...node,
        accounts: nodeAccounts,
        children: node.children ? enrichNodesWithAccounts(node.children, accounts) : [],
      };
    });
  };

  const fetchAccountAmounts = async (accountCode) => {
    try {
      const entityMap = {};

      for (const entity of entities) {
        const entityId = entity.code || entity.entity_code || entity.id;
        const entityName = entity.name || entity.entity_name || `Entity ${entityId}`;

        entityMap[entityName] = {
          entity_amount: 0,
          ic_amount: 0,
          other_amount: 0,
        };

        // Fetch all card types
        const cardTypes = ['entity_amounts', 'ic_amounts', 'other_amounts'];

        for (const cardType of cardTypes) {
          try {
            const response = await fetch(
              `/api/data-input/entries?company_name=${selectedCompany}` +
              `&card_type=${cardType}` +
              `&process_id=${safeProcessContext.processId}` +
              `&scenario_id=${safeProcessContext.scenarioId}` +
              `&entity_id=${entityId}` +
              `&account_code=${accountCode}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              },
            );

            if (response.ok) {
              const data = await response.json();
              const entries = data.entries || [];

              entries.forEach((entry) => {
                if (safeProcessContext.selectedPeriods.includes(entry.period_id)) {
                  const amount = parseFloat(entry.amount || 0);

                  if (cardType === 'ic_amounts') {
                    entityMap[entityName].ic_amount += amount;
                  } else if (cardType === 'other_amounts') {
                    entityMap[entityName].other_amount += amount;
                  } else {
                    entityMap[entityName].entity_amount += amount;
                  }
                }
              });
            }
          } catch (err) {
            console.error(`Error fetching ${cardType} for ${accountCode}:`, err);
          }
        }
      }

      return entityMap;
    } catch (error) {
      console.error(`Error fetching amounts for account ${accountCode}:`, error);
      return {};
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

  const calculateNodeTotal = (node, entityName) => {
    let total = { entity_amount: 0, ic_amount: 0, other_amount: 0 };

    // Sum accounts in this node
    if (node.accounts) {
      node.accounts.forEach((account) => {
        const amounts = account.entityAmounts?.[entityName] || {};
        total.entity_amount += amounts.entity_amount || 0;
        total.ic_amount += amounts.ic_amount || 0;
        total.other_amount += amounts.other_amount || 0;
      });
    }

    // Sum child nodes recursively
    if (node.children) {
      node.children.forEach((child) => {
        const childTotal = calculateNodeTotal(child, entityName);
        total.entity_amount += childTotal.entity_amount;
        total.ic_amount += childTotal.ic_amount;
        total.other_amount += childTotal.other_amount;
      });
    }

    return total;
  };

  const renderHierarchyNode = (node, level = 0) => {
    const nodeKey = `node_${node.id}`;
    const isExpanded = expandedNodes.has(nodeKey);
    const hasContent = (node.accounts && node.accounts.length > 0) || (node.children && node.children.length > 0);

    return (
      <React.Fragment key={nodeKey}>
        {/* Node Header Row */}
        <tr className="bg-indigo-50 dark:bg-indigo-900/20 font-semibold border-t-2 border-indigo-200">
          <td colSpan={2} className="px-4 py-3 text-sm text-indigo-900 dark:text-indigo-100">
            <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
              {hasContent && (
                <button
                  onClick={() => toggleNode(nodeKey)}
                  className="mr-2 text-indigo-600 hover:text-indigo-800"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
              <span className="font-bold">{node.name} ({node.code})</span>
            </div>
          </td>
          
          {/* Node totals for each entity */}
          {entities.map((entity) => {
            const entityName = entity.name || entity.entity_name || `Entity ${entity.code || entity.id}`;
            const nodeTotals = calculateNodeTotal(node, entityName);
            const grandTotal = nodeTotals.entity_amount + nodeTotals.ic_amount + nodeTotals.other_amount;

            return (
              <React.Fragment key={`node-total-${node.id}-${entity.id || entity.code}`}>
                <td className="px-3 py-3 text-sm text-right whitespace-nowrap">
                  <span style={{ color: colorScheme.entityAmount }} className="font-semibold">
                    {formatNumber(nodeTotals.entity_amount, reportSettings.roundingFactor)}
                  </span>
                </td>
                {reportSettings.showICAmounts && (
                  <td className="px-3 py-3 text-sm text-right whitespace-nowrap">
                    <span style={{ color: colorScheme.icAmount }} className="font-semibold">
                      {formatNumber(nodeTotals.ic_amount, reportSettings.roundingFactor)}
                    </span>
                  </td>
                )}
                {reportSettings.showOtherAmounts && (
                  <td className="px-3 py-3 text-sm text-right whitespace-nowrap">
                    <span style={{ color: colorScheme.otherAmount }} className="font-semibold">
                      {formatNumber(nodeTotals.other_amount, reportSettings.roundingFactor)}
                    </span>
                  </td>
                )}
                <td className="px-3 py-3 text-sm text-right font-bold whitespace-nowrap border-r">
                  <span style={{ color: colorScheme.total }}>
                    {formatNumber(grandTotal, reportSettings.roundingFactor)}
                  </span>
                </td>
              </React.Fragment>
            );
          })}
          
          <td className="px-4 py-3 text-sm text-right font-bold bg-indigo-100">
            {formatNumber(
              entities.reduce((sum, entity) => {
                const entityName = entity.name || entity.entity_name || `Entity ${entity.code || entity.id}`;
                const nodeTotals = calculateNodeTotal(node, entityName);
                return sum + nodeTotals.entity_amount + nodeTotals.ic_amount + nodeTotals.other_amount;
              }, 0),
              reportSettings.roundingFactor
            )}
          </td>
        </tr>

        {/* Render accounts in this node */}
        {isExpanded && node.accounts && node.accounts.map((account) => renderAccountRow(account, level + 1))}

        {/* Render child nodes */}
        {isExpanded && node.children && node.children.map((childNode) => renderHierarchyNode(childNode, level + 1))}
      </React.Fragment>
    );
  };

  const renderAccountRow = (account, level = 0) => {
    const accountCode = account.code || account.account_code;
    const accountName = account.name || account.account_name;

    return (
      <tr key={accountCode} className="hover:bg-gray-50">
        <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
          <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
            <span>{accountCode}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{accountName}</td>

        {/* Entity columns */}
        {entities.map((entity) => {
          const entityName = entity.name || entity.entity_name || `Entity ${entity.code || entity.id}`;
          const amounts = account.entityAmounts?.[entityName] || {};
          const total = (amounts.entity_amount || 0) + (amounts.ic_amount || 0) + (amounts.other_amount || 0);

          return (
            <React.Fragment key={`${accountCode}-${entity.id || entity.code}`}>
              <td className="px-3 py-3 text-sm text-right whitespace-nowrap">
                <span style={{ color: colorScheme.entityAmount }}>
                  {formatNumber(amounts.entity_amount, reportSettings.roundingFactor)}
                </span>
              </td>
              {reportSettings.showICAmounts && (
                <td className="px-3 py-3 text-sm text-right whitespace-nowrap">
                  <span style={{ color: colorScheme.icAmount }}>
                    {formatNumber(amounts.ic_amount, reportSettings.roundingFactor)}
                  </span>
                </td>
              )}
              {reportSettings.showOtherAmounts && (
                <td className="px-3 py-3 text-sm text-right whitespace-nowrap">
                  <span style={{ color: colorScheme.otherAmount }}>
                    {formatNumber(amounts.other_amount, reportSettings.roundingFactor)}
                  </span>
                </td>
              )}
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
          {formatNumber(
            entities.reduce((sum, entity) => {
              const entityName = entity.name || entity.entity_name || `Entity ${entity.code || entity.id}`;
              const amounts = account.entityAmounts?.[entityName] || {};
              return sum + (amounts.entity_amount || 0) + (amounts.ic_amount || 0) + (amounts.other_amount || 0);
            }, 0),
            reportSettings.roundingFactor
          )}
        </td>
      </tr>
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
              <h2 className="text-xl font-semibold text-white">Financial Reports</h2>
              <p className="text-blue-100 text-sm">
                Process: {safeProcessContext.processName} | Period:{" "}
                {safeProcessContext.periodNames.length > 0
                  ? safeProcessContext.periodNames.join(", ")
                  : "No periods selected"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Account Hierarchy</h3>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-blue-500" size={24} />
                </div>
              ) : error && hierarchies.length === 0 ? (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="text-red-500 mt-0.5" size={16} />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              ) : hierarchies.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No hierarchies available</p>
                  <p className="text-xs text-gray-400 mt-2">Please create account hierarchies first</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {hierarchies.map((hierarchy) => (
                    <div
                      key={hierarchy.id}
                      className={`flex items-center py-2 px-3 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors ${
                        selectedHierarchy?.id === hierarchy.id
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : ""
                      }`}
                      onClick={() => setSelectedHierarchy(hierarchy)}
                    >
                      <span className="flex-1 text-sm font-medium text-gray-700">
                        {hierarchy.hierarchy_name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report Settings */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Report Settings</h3>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reportSettings.showZeroBalances}
                    onChange={(e) =>
                      setReportSettings({ ...reportSettings, showZeroBalances: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show Zero Balances</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reportSettings.showICAmounts}
                    onChange={(e) =>
                      setReportSettings({ ...reportSettings, showICAmounts: e.target.checked })
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
                      setReportSettings({ ...reportSettings, showOtherAmounts: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show Other Amounts</span>
                </label>

                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rounding</label>
                  <select
                    value={reportSettings.roundingFactor}
                    onChange={(e) =>
                      setReportSettings({ ...reportSettings, roundingFactor: parseInt(e.target.value) })
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Report Generation Failed</h3>
                <p className="text-sm text-gray-600 text-center max-w-md">{error}</p>
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
                      <h3 className="text-lg font-semibold text-gray-900">{reportData.report_title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedCompany} | {reportData.currency} |
                        {reportSettings.roundingFactor > 1 &&
                          ` (in ${reportSettings.roundingFactor === 1000 ? "thousands" : "millions"})`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Color Legend */}
                <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-600">Legend:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: colorScheme.entityAmount }}></div>
                    <span className="text-xs text-gray-600">Entity Amount</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: colorScheme.icAmount }}></div>
                    <span className="text-xs text-gray-600">IC Amount</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: colorScheme.otherAmount }}></div>
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
                        {entities.map((entity) => {
                          const colSpan =
                            (reportSettings.showICAmounts ? 1 : 0) +
                            (reportSettings.showOtherAmounts ? 1 : 0) +
                            2;
                          return (
                            <th
                              key={entity.id || entity.code}
                              colSpan={colSpan}
                              className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-x"
                            >
                              {entity.name || entity.entity_name}
                            </th>
                          );
                        })}

                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                          Total
                        </th>
                      </tr>

                      {/* Sub-headers */}
                      <tr className="bg-gray-50">
                        <th colSpan={2}></th>
                        {entities.map((entity) => (
                          <React.Fragment key={`sub-${entity.id || entity.code}`}>
                            <th className="px-3 py-2 text-center text-xs text-gray-500">Entity</th>
                            {reportSettings.showICAmounts && (
                              <th className="px-3 py-2 text-center text-xs text-gray-500">IC</th>
                            )}
                            {reportSettings.showOtherAmounts && (
                              <th className="px-3 py-2 text-center text-xs text-gray-500">Other</th>
                            )}
                            <th className="px-3 py-2 text-center text-xs text-gray-500 border-r">Total</th>
                          </React.Fragment>
                        ))}
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.nodes && reportData.nodes.map((node) => renderHierarchyNode(node, 0))}
                      
                      {/* Unassigned Accounts */}
                      {reportData.unassigned_accounts && reportData.unassigned_accounts.length > 0 && (
                        <>
                          <tr className="bg-yellow-50 border-t-2 border-yellow-200">
                            <td colSpan={100} className="px-4 py-3 text-sm font-bold text-yellow-900">
                              Unassigned Accounts
                            </td>
                          </tr>
                          {reportData.unassigned_accounts.map((account) => renderAccountRow(account, 0))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
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
