import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  FileText, 
  Database, 
  BarChart3, 
  Building2, 
  Calculator,
  Receipt,
  Activity,
  Shield,
  Globe,
  Users,
  Settings,
  HelpCircle,
  Play,
  Download,
  ExternalLink,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Home,
  TrendingUp,
  CreditCard,
  PieChart,
  FileSpreadsheet,
  Zap,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  Upload,
  Download as DownloadIcon,
  Copy,
  Save,
  X
} from 'lucide-react';

const Documentation = () => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  // Comprehensive documentation structure
  const documentationStructure = {
    "Getting Started": {
      icon: BookOpen,
      color: "bg-blue-500",
      description: "Learn the basics of the IFRS Consolidation Tool",
      sections: {
        "Introduction": {
          content: "The IFRS Consolidation Tool is a comprehensive financial management system designed for multinational corporations to handle IFRS compliance, consolidation, and financial reporting.",
          features: [
            "Multi-Company Support with isolated data management",
            "IFRS Compliance with built-in standards and account structures", 
            "Multi-Currency Support with automatic currency conversion",
            "Consolidation Engine with automated intercompany elimination",
            "Audit Trail with complete tracking of all financial changes",
            "Excel Integration with direct file handling and template management"
          ],
          steps: [
            "Set up your company profile and entities",
            "Configure chart of accounts and FST templates",
            "Import trial balance data",
            "Run consolidation processes",
            "Generate financial statements"
          ]
        },
        "Quick Start Guide": {
          content: "Get up and running quickly with these essential steps.",
          features: [
            "Company setup and entity configuration",
            "Chart of accounts import",
            "Trial balance upload",
            "First consolidation run",
            "Financial statement generation"
          ]
        }
      }
    },
    "Core Modules": {
      icon: Database,
      color: "bg-green-500", 
      description: "Essential modules for financial management",
      sections: {
        "Dashboard": {
          content: "Your central command center for monitoring financial performance and key metrics. The Dashboard provides a comprehensive overview of your consolidation process, real-time data insights, and quick access to all system modules.",
          purpose: "To provide executives and financial managers with an at-a-glance view of the organization's financial health, consolidation status, and key performance indicators.",
          features: [
            "Real-time financial overview with key metrics and KPIs",
            "Interactive charts and graphs showing financial trends",
            "Recent activity tracking and audit trail summary",
            "Quick access buttons to all major modules",
            "Alert notifications for critical issues or pending tasks",
            "Customizable widgets for personalized dashboard experience"
          ],
          usage: "Access the Dashboard immediately after login to get an overview of your financial consolidation status. Use the quick action buttons to navigate to specific modules, review alerts for any issues requiring attention, and monitor key financial metrics in real-time.",
          tabs: {
            "Overview": {
              description: "Main dashboard with key metrics and charts",
              content: "Displays consolidated financial summary, entity performance comparison, and key ratios. Shows total assets, liabilities, equity, revenue, and profit margins across all entities.",
              features: [
                "Consolidated balance sheet summary",
                "Income statement highlights",
                "Entity performance comparison charts",
                "Key financial ratios and metrics",
                "Period-over-period comparisons"
              ]
            },
            "Analytics": {
              description: "Advanced analytics and trend analysis",
              content: "Provides detailed financial analysis with trend charts, variance analysis, and predictive insights. Use this tab to identify patterns, anomalies, and opportunities for improvement.",
              features: [
                "Multi-period trend analysis",
                "Variance analysis with explanations",
                "Predictive financial modeling",
                "Custom report generation",
                "Data export capabilities"
              ]
            },
            "Alerts": {
              description: "System alerts and notifications",
              content: "Centralized location for all system notifications, warnings, and alerts. Monitor consolidation issues, data validation errors, and pending approvals.",
              features: [
                "Consolidation error notifications",
                "Data validation alerts",
                "Pending approval reminders",
                "System maintenance notifications",
                "Custom alert configuration"
              ]
            },
            "Quick Actions": {
              description: "Fast access to common tasks",
              content: "One-click access to frequently used functions like generating reports, running consolidations, and accessing key modules.",
              features: [
                "Generate financial statements",
                "Run consolidation process",
                "Export data to Excel",
                "Access entity management",
                "View audit trail"
              ]
            }
          }
        },
        "Entity Management": {
          content: "Manage your corporate structure, subsidiaries, and ownership relationships. This module is the foundation of your consolidation process, defining how entities relate to each other and how ownership percentages are calculated.",
          purpose: "To establish and maintain the corporate structure, define ownership relationships, and configure entity-specific settings that drive the consolidation calculations and financial reporting.",
          features: [
            "Complete entity hierarchy management with parent-child relationships",
            "Ownership percentage tracking with effective dates and changes",
            "Multi-currency support with entity-specific reporting currencies",
            "Intercompany relationship mapping and configuration",
            "Entity status management (active, inactive, disposed)",
            "Audit trail for all entity changes and ownership modifications"
          ],
          usage: "Start here when setting up your consolidation. Create all entities first, then define ownership structures. This module must be configured before running any consolidation processes as it determines how eliminations and NCI calculations are performed.",
          tabs: {
            "Entity List": {
              description: "View and manage all entities in your organization",
              content: "Central repository for all entities including subsidiaries, associates, and joint ventures. Add new entities, edit existing ones, and manage entity-specific information.",
              features: [
                "Add, edit, and delete entities",
                "Entity code and name management",
                "Entity type classification (Subsidiary, Associate, JV)",
                "Entity status tracking (Active, Inactive, Disposed)",
                "Entity-specific contact information",
                "Bulk import/export functionality"
              ]
            },
            "Ownership Structure": {
              description: "Define ownership relationships and percentages",
              content: "Map out the ownership structure showing which entities own what percentage of other entities. This drives consolidation calculations and NCI computations.",
              features: [
                "Parent-child relationship mapping",
                "Ownership percentage entry with effective dates",
                "Direct and indirect ownership calculations",
                "Non-controlling interest (NCI) computation",
                "Ownership change tracking over time",
                "Visual ownership structure diagrams"
              ]
            },
            "Currency Settings": {
              description: "Configure reporting currencies for each entity",
              content: "Set up the functional and reporting currencies for each entity. This determines how currency conversion is performed during consolidation.",
              features: [
                "Functional currency assignment per entity",
                "Reporting currency configuration",
                "Currency conversion rate management",
                "Multi-currency consolidation support",
                "Currency translation adjustments",
                "Exchange rate validation and approval"
              ]
            },
            "Intercompany Setup": {
              description: "Set up intercompany relationships and elimination rules",
              content: "Define which entities can have intercompany transactions and configure the elimination rules for consolidation purposes.",
              features: [
                "Intercompany relationship matrix",
                "Elimination rule configuration",
                "Intercompany account mapping",
                "Transaction type definitions",
                "Elimination priority settings",
                "Intercompany reconciliation rules"
              ]
            }
          }
        },
        "Account Management": {
          content: "Configure your chart of accounts and account structures. This module defines the financial framework for your organization, ensuring proper account classification and IFRS compliance across all entities.",
          purpose: "To establish a standardized chart of accounts that supports IFRS reporting requirements, enables proper account classification, and provides the foundation for financial statement generation and consolidation.",
          features: [
            "Comprehensive chart of accounts management with hierarchical structure",
            "IFRS-compliant account classification and mapping",
            "Account hierarchy setup with parent-child relationships",
            "Multi-entity account synchronization and standardization",
            "Account validation rules and compliance checking",
            "Bulk import/export capabilities for account setup and maintenance"
          ],
          usage: "Set up your chart of accounts after defining entities but before uploading trial balance data. This ensures all financial data is properly classified and mapped to IFRS standards for accurate reporting and consolidation.",
          tabs: {
            "Chart of Accounts": {
              description: "Manage the complete account structure for your organization",
              content: "Create and maintain the hierarchical chart of accounts with proper account codes, names, and classifications. This forms the foundation for all financial reporting.",
              features: [
                "Add, edit, and delete accounts with proper coding",
                "Account hierarchy management (parent-child relationships)",
                "Account name and description management",
                "Account status tracking (Active, Inactive, Closed)",
                "Account validation and duplicate checking",
                "Account search and filtering capabilities"
              ]
            },
            "Account Mapping": {
              description: "Map accounts to IFRS standards and reporting requirements",
              content: "Ensure all accounts are properly mapped to IFRS classifications for accurate financial statement presentation and compliance reporting.",
              features: [
                "IFRS account classification mapping",
                "Balance sheet vs. income statement classification",
                "Account grouping for financial statement presentation",
                "IFRS 9 financial instrument classification",
                "Revenue recognition account mapping (IFRS 15)",
                "Lease accounting account setup (IFRS 16)"
              ]
            },
            "Account Classification": {
              description: "Classify accounts by type, nature, and reporting requirements",
              content: "Define account types, natures, and reporting classifications to ensure proper financial statement presentation and consolidation processing.",
              features: [
                "Account type classification (Asset, Liability, Equity, Income, Expense)",
                "Account nature definition (Current, Non-current, Operating, Non-operating)",
                "Consolidation classification (Elimination, NCI, etc.)",
                "Account grouping for management reporting",
                "Custom classification fields for specific requirements",
                "Classification validation and compliance checking"
              ]
            },
            "Import/Export": {
              description: "Bulk import and export account data",
              content: "Efficiently manage large account structures through bulk import/export functionality, supporting various file formats and data validation.",
              features: [
                "Excel/CSV import with data validation",
                "Bulk account creation and updates",
                "Account data export in multiple formats",
                "Import error reporting and correction",
                "Template-based import for standardized setup",
                "Data backup and restore capabilities"
              ]
            }
          }
        },
        "Process Module": {
          content: "Upload and process trial balance data from your entities. This is where raw financial data enters the system and gets prepared for consolidation and reporting.",
          purpose: "To efficiently import, validate, and process trial balance data from multiple entities, ensuring data quality and consistency before consolidation and financial statement generation.",
          features: [
            "Multi-format trial balance upload (Excel, CSV, XML)",
            "Automated data validation and error detection",
            "Currency conversion with real-time exchange rates",
            "Period management and data versioning",
            "Data reconciliation and variance analysis",
            "Audit trail for all data processing activities"
          ],
          usage: "Use this module monthly to upload trial balance data from all entities. The system will validate the data, convert currencies, and prepare it for consolidation. Always review validation results before proceeding to consolidation.",
          tabs: {
            "Upload Data": {
              description: "Upload trial balance files from all entities",
              content: "Import trial balance data in various formats with automatic mapping to your chart of accounts. Supports Excel, CSV, and XML formats with flexible data mapping.",
              features: [
                "Drag-and-drop file upload interface",
                "Multiple file format support (Excel, CSV, XML)",
                "Automatic account code mapping and validation",
                "Entity-specific upload templates",
                "Bulk upload for multiple entities",
                "Upload progress tracking and error reporting"
              ]
            },
            "Data Validation": {
              description: "Validate and review uploaded data for accuracy",
              content: "Comprehensive data validation ensures trial balance data is complete, accurate, and ready for consolidation. Review and resolve any validation errors before processing.",
              features: [
                "Trial balance balancing validation (Debits = Credits)",
                "Account code validation against chart of accounts",
                "Data completeness checking",
                "Variance analysis against previous periods",
                "Exception reporting and error highlighting",
                "Data approval workflow and sign-off"
              ]
            },
            "Currency Conversion": {
              description: "Convert currencies to reporting currency",
              content: "Automatically convert entity functional currencies to the group reporting currency using configured exchange rates and conversion methods.",
              features: [
                "Real-time exchange rate integration",
                "Multiple conversion methods (Spot, Average, Historical)",
                "Currency conversion validation and approval",
                "Translation adjustment calculations",
                "Multi-currency consolidation support",
                "Exchange rate variance analysis"
              ]
            },
            "Period Management": {
              description: "Manage reporting periods and data versions",
              content: "Control which periods are open for data entry, manage period-end closing processes, and maintain data versioning for audit and compliance purposes.",
              features: [
                "Period status management (Open, Closed, Locked)",
                "Period-end closing workflow",
                "Data versioning and rollback capabilities",
                "Period comparison and variance analysis",
                "Year-end closing procedures",
                "Period security and access controls"
              ]
            }
          }
        },
        "Trial Balance": {
          content: "Review and manage trial balance data across all entities. This module provides comprehensive trial balance management with multi-entity views, reconciliation tools, and adjustment capabilities.",
          purpose: "To provide a centralized view of all trial balance data, enable data validation and reconciliation, and support the creation of adjustment entries before consolidation.",
          features: [
            "Consolidated and entity-specific trial balance views",
            "Advanced filtering and search capabilities",
            "Data validation and reconciliation tools",
            "Adjustment entry creation and management",
            "Period-over-period comparison and variance analysis",
            "Export capabilities for external reporting and analysis"
          ],
          usage: "Use this module to review trial balance data after upload, identify and resolve discrepancies, create necessary adjustments, and ensure data quality before running consolidation processes.",
          tabs: {
            "Trial Balance View": {
              description: "View consolidated and entity-specific trial balances",
              content: "Comprehensive trial balance display with filtering, sorting, and drill-down capabilities. View data by entity, account, or period with real-time calculations.",
              features: [
                "Consolidated trial balance with entity breakdown",
                "Entity-specific trial balance views",
                "Advanced filtering by account, entity, or period",
                "Sortable columns with custom sorting options",
                "Drill-down to transaction details",
                "Real-time balance calculations and totals"
              ]
            },
            "Entity Comparison": {
              description: "Compare trial balances across entities",
              content: "Side-by-side comparison of trial balance data across entities to identify variances, inconsistencies, and opportunities for standardization.",
              features: [
                "Multi-entity side-by-side comparison",
                "Variance analysis with percentage differences",
                "Account-level comparison with highlighting",
                "Exception reporting for significant variances",
                "Comparison templates for standard analysis",
                "Export comparison reports to Excel"
              ]
            },
            "Adjustments": {
              description: "Create and manage adjustment entries",
              content: "Create manual adjustment entries to correct errors, record accruals, or make other necessary adjustments before consolidation.",
              features: [
                "Manual journal entry creation",
                "Adjustment entry templates and recurring entries",
                "Entry approval workflow and authorization",
                "Adjustment impact analysis and preview",
                "Entry reversal and correction capabilities",
                "Audit trail for all adjustment activities"
              ]
            },
            "Reconciliation": {
              description: "Reconcile intercompany and other balances",
              content: "Reconcile intercompany balances, bank accounts, and other accounts to ensure accuracy and completeness of trial balance data.",
              features: [
                "Intercompany balance reconciliation",
                "Bank reconciliation tools and matching",
                "Account reconciliation templates",
                "Reconciliation status tracking",
                "Exception reporting for unreconciled items",
                "Reconciliation approval and sign-off"
              ]
            }
          }
        },
        "Journal Entries": {
          content: "Create and manage journal entries for adjustments and corrections. This module provides comprehensive journal entry management with approval workflows and audit trails.",
          purpose: "To support the creation, approval, and management of journal entries for adjustments, corrections, and other accounting transactions with proper controls and audit trails.",
          features: [
            "Manual journal entry creation with validation",
            "Bulk entry processing and import capabilities",
            "Multi-level approval workflow and authorization",
            "Complete audit trail and change tracking",
            "Entry templates for recurring transactions",
            "Integration with trial balance and consolidation processes"
          ],
          usage: "Use this module to create adjustment entries, record accruals, make corrections, and handle other accounting transactions. All entries go through approval workflow before affecting trial balance data.",
          tabs: {
            "Create Entry": {
              description: "Create new journal entries with validation",
              content: "Create manual journal entries with automatic validation, account verification, and balance checking to ensure accuracy and compliance.",
              features: [
                "Manual journal entry form with account lookup",
                "Automatic debit/credit balancing validation",
                "Account code validation against chart of accounts",
                "Entry description and reference management",
                "Multi-entity entry support",
                "Entry preview and impact analysis"
              ]
            },
            "Entry List": {
              description: "View and manage existing journal entries",
              content: "Comprehensive view of all journal entries with filtering, searching, and management capabilities. Track entry status and approval progress.",
              features: [
                "Complete journal entry listing with filters",
                "Entry status tracking (Draft, Pending, Approved, Posted)",
                "Search and filter by date, account, entity, or amount",
                "Entry editing and correction capabilities",
                "Entry deletion and reversal options",
                "Export entries to Excel for external analysis"
              ]
            },
            "Approval Workflow": {
              description: "Approve pending journal entries",
              content: "Multi-level approval workflow for journal entries with role-based authorization and approval tracking.",
              features: [
                "Pending approval queue with priority sorting",
                "Role-based approval authorization",
                "Approval comments and justification tracking",
                "Bulk approval capabilities",
                "Approval history and audit trail",
                "Escalation procedures for overdue approvals"
              ]
            },
            "Entry Templates": {
              description: "Manage recurring journal entry templates",
              content: "Create and manage templates for recurring journal entries to improve efficiency and ensure consistency in common transactions.",
              features: [
                "Template creation with predefined accounts and amounts",
                "Recurring entry scheduling and automation",
                "Template sharing across entities",
                "Template versioning and change management",
                "Template usage tracking and reporting",
                "Template approval and activation workflow"
              ]
            }
          }
        },
        "FST Items": {
          content: "Financial Statement Templates (FST) - Define the structure and format of your financial statements. This module is crucial for generating properly formatted IFRS-compliant financial statements.",
          purpose: "To create and manage financial statement templates that define how accounts are grouped, calculated, and presented in financial statements, ensuring IFRS compliance and consistent reporting.",
          features: [
            "Comprehensive template creation and management",
            "Flexible line item definitions with hierarchical structure",
            "Advanced formula and calculation setup",
            "Customizable statement formatting and presentation",
            "Multi-statement template support (Balance Sheet, P&L, Cash Flow)",
            "Template versioning and change management"
          ],
          usage: "Set up FST templates after configuring your chart of accounts. These templates define how your financial statements will be structured and formatted. Use them in the Financial Statements module to generate reports.",
          tabs: {
            "Templates": {
              description: "Manage FST templates for different statement types",
              content: "Create and manage financial statement templates for Balance Sheet, Income Statement, Cash Flow Statement, and other custom reports.",
              features: [
                "Template creation wizard with guided setup",
                "Multiple statement type support (BS, P&L, CF, Equity)",
                "Template cloning and copying capabilities",
                "Template activation and deactivation",
                "Template sharing across entities",
                "Template approval and version control"
              ]
            },
            "Line Items": {
              description: "Define statement line items and account groupings",
              content: "Create line items that group accounts together for financial statement presentation. Define hierarchies, descriptions, and formatting rules.",
              features: [
                "Line item creation with account mapping",
                "Hierarchical line item structure (sections, subsections)",
                "Account grouping and aggregation rules",
                "Line item descriptions and formatting",
                "Conditional line item display logic",
                "Line item validation and testing"
              ]
            },
            "Formulas": {
              description: "Set up calculations and formulas for derived amounts",
              content: "Define formulas for calculated line items such as totals, subtotals, ratios, and other derived amounts in financial statements.",
              features: [
                "Formula builder with mathematical operators",
                "Reference to other line items and accounts",
                "Conditional calculations and logic",
                "Formula validation and error checking",
                "Formula testing and preview capabilities",
                "Formula documentation and comments"
              ]
            },
            "Formatting": {
              description: "Configure statement formatting and presentation",
              content: "Define how financial statements are formatted, including column layouts, number formatting, headers, footers, and presentation styles.",
              features: [
                "Column layout and entity grouping",
                "Number formatting (currency, decimals, thousands separators)",
                "Header and footer configuration",
                "Page layout and styling options",
                "Print and PDF formatting settings",
                "Custom formatting templates"
              ]
            }
          }
        },
        "Financial Statements": {
          content: "Generate financial statements using FST templates and processed data.",
          features: [
            "Automated statement generation",
            "Multiple statement types",
            "Entity and consolidated views",
            "Export capabilities"
          ],
          tabs: {
            "Generate Statements": "Generate new financial statements",
            "Statement Library": "View generated statements",
            "Templates": "Manage statement templates",
            "Export": "Export statements to various formats"
          }
        },
        "Consolidation": {
          content: "The heart of the system - automated consolidation with intercompany elimination.",
          features: [
            "Intercompany transaction matching",
            "Automated elimination entries",
            "Ownership structure management",
            "Non-controlling interest calculations",
            "Consolidated financial statement generation"
          ],
          tabs: {
            "IC Matching & Elimination": "Match and eliminate intercompany transactions",
            "Consolidation Journals": "Create consolidation adjustment entries", 
            "Ownership & NCI": "Manage ownership structures and NCI",
            "Roll-Forward & Closing": "Handle period-to-period roll-forwards",
            "Data Storage & Relations": "Manage consolidation data relationships",
            "Consolidated Financials": "Generate final consolidated statements"
          }
        }
      }
    },
    "Advanced Features": {
      icon: Zap,
      color: "bg-purple-500",
      description: "Advanced tools and integrations",
      sections: {
        "ETL Pipeline": {
          content: "Extract, Transform, Load - Automated data processing pipeline.",
          features: [
            "Automated data extraction",
            "Data transformation rules",
            "Load scheduling and monitoring",
            "Error handling and logging"
          ]
        },
        "Forecast & Budget": {
          content: "Budgeting and forecasting capabilities for financial planning.",
          features: [
            "Budget creation and management",
            "Forecasting models",
            "Variance analysis",
            "Scenario planning"
          ]
        },
        "Analytics & Reporting": {
          content: "Advanced analytics and custom reporting tools.",
          features: [
            "Custom report builder",
            "Data visualization",
            "Trend analysis",
            "KPI dashboards"
          ]
        }
      }
    },
    "System Administration": {
      icon: Settings,
      color: "bg-gray-500",
      description: "System configuration and maintenance",
      sections: {
        "User Management": {
          content: "Manage users, roles, and permissions.",
          features: [
            "User creation and management",
            "Role-based access control",
            "Permission settings",
            "Audit logging"
          ]
        },
        "System Settings": {
          content: "Configure system-wide settings and preferences.",
          features: [
            "Company settings",
            "Currency configurations",
            "Reporting preferences",
            "Integration settings"
          ]
        },
        "Backup & Restore": {
          content: "Data backup and restore functionality.",
          features: [
            "Automated backups",
            "Manual backup creation",
            "Data restore procedures",
            "Backup scheduling"
          ]
        }
      }
    }
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleModuleSelect = (moduleKey, sectionKey = null) => {
    setSelectedModule(moduleKey);
    setSelectedSection(sectionKey);
    setActiveTab(null);
  };

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
  };

  const filteredStructure = Object.entries(documentationStructure).filter(([key, value]) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      key.toLowerCase().includes(searchLower) ||
      value.description.toLowerCase().includes(searchLower) ||
      Object.keys(value.sections).some(sectionKey => 
        sectionKey.toLowerCase().includes(searchLower)
      )
    );
  });

  const getCurrentContent = () => {
    if (!selectedModule) return null;
    
    const module = documentationStructure[selectedModule];
    if (!module) return null;

    if (selectedSection) {
      const section = module.sections[selectedSection];
      if (!section) return null;

      return {
        title: selectedSection,
        content: section.content,
        purpose: section.purpose || null,
        usage: section.usage || null,
        features: section.features || [],
        steps: section.steps || [],
        tabs: section.tabs || null
      };
    }

    return {
      title: selectedModule,
      content: module.description,
      purpose: module.purpose || null,
      usage: module.usage || null,
      features: [],
      steps: [],
      tabs: null
    };
  };

  const currentContent = getCurrentContent();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            IFRS Consolidation Tool Documentation
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Comprehensive guide to using the IFRS Consolidation Tool for financial management, 
            consolidation, and compliance reporting.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Documentation Navigation
              </h2>
              
              <div className="space-y-2">
                {filteredStructure.map(([key, value]) => (
                  <div key={key}>
                    <button
                      onClick={() => {
                        toggleSection(key);
                        if (!expandedSections[key]) {
                          handleModuleSelect(key);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        selectedModule === key
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-1 rounded ${value.color}`}>
                          <value.icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium">{key}</span>
                      </div>
                      {expandedSections[key] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {expandedSections[key] && (
                      <div className="ml-6 mt-2 space-y-1">
                        {Object.keys(value.sections).map((sectionKey) => (
                          <button
                            key={sectionKey}
                            onClick={() => handleModuleSelect(key, sectionKey)}
                            className={`block w-full text-left p-2 text-sm rounded transition-colors ${
                              selectedModule === key && selectedSection === sectionKey
                                ? 'bg-blue-50 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {sectionKey}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
              {!currentContent ? (
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    Welcome to the Documentation
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Select a module from the navigation menu to view detailed documentation, 
                    features, and step-by-step instructions.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(documentationStructure).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => handleModuleSelect(key)}
                        className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`p-2 rounded-lg ${value.color}`}>
                            <value.icon className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">{key}</h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{value.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Content Header */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {currentContent.title}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                      {currentContent.content}
                    </p>
                    
                    {/* Purpose Section */}
                    {currentContent.purpose && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Purpose
                        </h3>
                        <p className="text-blue-800 dark:text-blue-200 text-sm">
                          {currentContent.purpose}
                        </p>
                      </div>
                    )}
                    
                    {/* Usage Section */}
                    {currentContent.usage && (
                      <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                        <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center">
                          <Play className="h-4 w-4 mr-2" />
                          How to Use
                        </h3>
                        <p className="text-green-800 dark:text-green-200 text-sm">
                          {currentContent.usage}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tabs */}
                  {currentContent.tabs && (
                    <div className="mb-6">
                      <div className="border-b border-slate-200 dark:border-slate-700">
                        <nav className="-mb-px flex space-x-8">
                          {Object.entries(currentContent.tabs).map(([tabKey, tabDescription]) => (
                            <button
                              key={tabKey}
                              onClick={() => handleTabSelect(tabKey)}
                              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tabKey
                                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              {tabKey}
                            </button>
                          ))}
                        </nav>
                      </div>
                      
                      {activeTab && currentContent.tabs[activeTab] && (
                        <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                            {activeTab}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-300 mb-4">
                            {typeof currentContent.tabs[activeTab] === 'string' 
                              ? currentContent.tabs[activeTab]
                              : currentContent.tabs[activeTab].description
                            }
                          </p>
                          
                          {typeof currentContent.tabs[activeTab] === 'object' && currentContent.tabs[activeTab].content && (
                            <div className="mb-4">
                              <h4 className="font-medium text-slate-900 dark:text-white mb-2">Description</h4>
                              <p className="text-slate-600 dark:text-slate-300">
                                {currentContent.tabs[activeTab].content}
                              </p>
                            </div>
                          )}
                          
                          {typeof currentContent.tabs[activeTab] === 'object' && currentContent.tabs[activeTab].features && (
                            <div>
                              <h4 className="font-medium text-slate-900 dark:text-white mb-3">Key Features</h4>
                              <ul className="space-y-2">
                                {currentContent.tabs[activeTab].features.map((feature, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Features */}
                  {currentContent.features.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                        Key Features
                      </h3>
                      <ul className="space-y-2">
                        {currentContent.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Steps */}
                  {currentContent.steps.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                        Getting Started
                      </h3>
                      <ol className="space-y-2">
                        {currentContent.steps.map((step, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                      Quick Actions
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedModule && (
                        <button
                          onClick={() => {
                            const moduleRoutes = {
                              'Dashboard': '/dashboard',
                              'Entity Management': '/entity-management',
                              'Account Management': '/account-management',
                              'Process Module': '/process',
                              'Trial Balance': '/trial-balance',
                              'Journal Entries': '/journal-entries',
                              'FST Items': '/fst-items',
                              'Financial Statements': '/financial-statements',
                              'Consolidation': '/consolidation'
                            };
                            const route = moduleRoutes[selectedModule];
                            if (route) navigate(route);
                          }}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Go to {selectedModule}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedModule(null);
                          setSelectedSection(null);
                          setActiveTab(null);
                        }}
                        className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Back to Overview
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;