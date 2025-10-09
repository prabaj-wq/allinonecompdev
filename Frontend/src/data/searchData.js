// Comprehensive Search Data Structure for IFRS Consolidation Tool
// This file contains all searchable content organized hierarchically

export const searchData = {
  // Main Modules
  modules: {
    "Dashboard": {
      path: "/dashboard",
      description: "Main dashboard with financial ratios and system overview",
      keywords: ["dashboard", "overview", "home", "main", "ratios", "metrics", "financial overview", "insights"],
      tabs: []
    },
    "Entity Management": {
      path: "/entity",
      description: "Manage business entities and hierarchies",
      keywords: ["entities", "subsidiaries", "companies", "branches", "management", "business entities", "hierarchies"],
      tabs: []
    },
    "Account Management": {
      path: "/accounts",
      description: "Chart of accounts and categorization",
      keywords: ["accounts", "chart", "ifrs", "accounting", "codes", "management", "categorization"],
      tabs: []
    },
    "Process Module": {
      path: "/process",
      description: "Data processing & validation",
      keywords: ["process", "trial balance", "entries", "upload", "accounting", "validation", "data processing"],
      tabs: ["Period Management", "Trial Balance Upload", "Accounting Entries", "Data Summary"]
    },
    "Trial Balance": {
      path: "/trial-balance",
      description: "Trial balance reports",
      keywords: ["trial balance", "reports", "tb", "balances", "accounts", "trial balance reports"],
      tabs: []
    },
    "Journal Entries": {
      path: "/journal-entries",
      description: "Manual journal entries",
      keywords: ["journal", "entries", "manual", "adjustments", "posting", "journal entries"],
      tabs: []
    },
    "FST Items": {
      path: "/fst-items",
      description: "Financial Statement Templates",
      keywords: ["fst", "templates", "statements", "financial", "reports", "financial statement templates"],
      tabs: []
    },
    "Asset Register": {
      path: "/asset-register",
      description: "Fixed asset management",
      keywords: ["assets", "register", "depreciation", "ppe", "intangible", "fixed", "asset management"],
      tabs: ["Asset Overview", "Add Asset", "Depreciation", "IFRS Templates", "Reports"]
    },
    "Bills": {
      path: "/bills",
      description: "Bill management & tracking",
      keywords: ["bills", "payables", "receivables", "invoices", "aging", "tracking", "bill management"],
      tabs: ["Bills Overview", "Create Bill", "Configuration"]
    },
    "Bank Reconciliation": {
      path: "/bank-reconciliation",
      description: "Bank statement reconciliation",
      keywords: ["bank", "reconciliation", "statement", "matching", "clearing", "bank reconciliation"],
      tabs: []
    },
    "Supplier Reconciliation": {
      path: "/supplier-reconciliation",
      description: "Supplier invoice and payment reconciliation",
      keywords: ["supplier", "reconciliation", "invoice", "payment", "vendor", "supplier reconciliation"],
      tabs: []
    },
    "Purchase Orders": {
      path: "/integrations/purchase-order-management",
      description: "Procurement & purchase orders",
      keywords: ["purchase", "orders", "procurement", "purchase orders", "po"],
      tabs: []
    },
    "Financial Statements": {
      path: "/financial-statements",
      description: "P&L, Balance Sheet & Cash Flow",
      keywords: ["statements", "financial", "reports", "balance sheet", "p&l", "cash flow", "financial statements"],
      tabs: []
    },
    "Consolidation": {
      path: "/consolidation",
      description: "Multi-entity consolidation",
      keywords: ["consolidation", "intercompany", "ic", "elimination", "ownership", "multi-entity", "consolidated"],
      tabs: ["IC Matching & Elimination", "Consolidation Journals", "Ownership & NCI", "Roll-Forward & Closing", "Data Storage & Relations", "Consolidated Financials"]
    },
    "IFRS Templates": {
      path: "/ifrs-templates",
      description: "IFRS standards library",
      keywords: ["ifrs", "standards", "templates", "working papers", "compliance", "library", "ifrs standards"],
      tabs: ["IFRS 15 - Revenue Recognition", "IFRS 16 - Leases", "IFRS 9 - Financial Instruments", "IFRS 3 - Business Combinations"]
    },
    "ETL Pipeline": {
      path: "/etl",
      description: "Extract, Transform & Load data pipeline",
      keywords: ["etl", "extract", "transform", "load", "data processing", "pipeline", "etl pipeline"],
      tabs: ["Data Extraction", "Transformation", "Loading", "Data Quality", "Monitoring"]
    },
    "Forecast & Budget": {
      path: "/forecast-budget",
      description: "Budgeting & forecasting",
      keywords: ["forecast", "budget", "budgeting", "forecasting", "planning"],
      tabs: []
    },
    "Variance Analysis": {
      path: "/variance-analysis",
      description: "Budget vs actual analysis",
      keywords: ["variance", "analysis", "budget", "actual", "variance analysis"],
      tabs: []
    },
    "Cash Flow Analysis": {
      path: "/cash-flow",
      description: "Cash flow statements",
      keywords: ["cash flow", "analysis", "statements", "cash flow analysis"],
      tabs: []
    },
    "Financial Ratios": {
      path: "/financial-ratios",
      description: "Financial ratio analysis",
      keywords: ["financial", "ratios", "analysis", "financial ratios"],
      tabs: []
    },
    "Narrative Reporting": {
      path: "/narrative-reporting",
      description: "Rich text reporting and collaboration",
      keywords: ["narrative", "reporting", "rich text", "collaboration", "narrative reporting"],
      tabs: []
    },
    "What-If Analysis": {
      path: "/what-if-analysis",
      description: "Scenario modeling and sensitivity analysis",
      keywords: ["what-if", "analysis", "scenario", "modeling", "sensitivity", "what if analysis"],
      tabs: []
    },
    "Real-Time Analytics": {
      path: "/real-time-analytics",
      description: "Unified analytics dashboard",
      keywords: ["real-time", "analytics", "dashboard", "unified", "real time analytics"],
      tabs: []
    },
    "Regulatory Reporting": {
      path: "/regulatory-reporting",
      description: "Regulatory compliance",
      keywords: ["regulatory", "reporting", "compliance", "regulatory reporting"],
      tabs: []
    },
    "Global Compliance": {
      path: "/global-compliance",
      description: "Multi-jurisdiction compliance management",
      keywords: ["global", "compliance", "multi-jurisdiction", "global compliance"],
      tabs: []
    },
    "Audit": {
      path: "/audit",
      description: "Audit working papers",
      keywords: ["audit", "working papers", "auditing", "compliance", "review"],
      tabs: []
    },
    "Audit Trail": {
      path: "/audit-trail",
      description: "Track all system changes",
      keywords: ["audit trail", "tracking", "changes", "history", "log"],
      tabs: []
    },
    "Internal Controls": {
      path: "/internal-controls",
      description: "Internal control framework",
      keywords: ["internal", "controls", "framework", "internal controls"],
      tabs: []
    },
    "Forex Rate Management": {
      path: "/forex-rates",
      description: "Exchange rate management",
      keywords: ["forex", "rates", "exchange", "currency", "forex rates"],
      tabs: []
    },
    "Custom Axes": {
      path: "/custom-axes",
      description: "Custom dimensions for reporting",
      keywords: ["custom", "axes", "dimensions", "reporting", "custom axes"],
      tabs: []
    },
    "Workflows": {
      path: "/workflows",
      description: "Workflow automation and process management",
      keywords: ["workflows", "automation", "process", "management", "workflow"],
      tabs: []
    },
    "Audit Materiality": {
      path: "/audit-materiality",
      description: "Audit thresholds & materiality",
      keywords: ["audit", "materiality", "thresholds", "audit materiality"],
      tabs: []
    },
    "Tax Management": {
      path: "/tax-management",
      description: "Tax calculations & filing",
      keywords: ["tax", "management", "calculations", "filing", "tax management"],
      tabs: []
    },
    "Business Valuation & Impairment": {
      path: "/business-valuation",
      description: "Business valuation, DCF analysis & impairment testing",
      keywords: ["business", "valuation", "dcf", "analysis", "impairment", "testing", "business valuation"],
      tabs: []
    },
    "SQL Query Console": {
      path: "/sql-query-console",
      description: "Secure PostgreSQL query interface - SELECT only",
      keywords: ["sql", "query", "console", "postgresql", "secure", "sql query console"],
      tabs: []
    },
    "System Monitoring": {
      path: "/system-monitoring",
      description: "System health & performance",
      keywords: ["system", "monitoring", "health", "performance", "system monitoring"],
      tabs: []
    },
    "Database Management": {
      path: "/database-management",
      description: "Database administration",
      keywords: ["database", "management", "administration", "database management"],
      tabs: []
    },
    "Backup & Restore": {
      path: "/backup-restore",
      description: "Data backup & recovery",
      keywords: ["backup", "restore", "data", "recovery", "backup restore"],
      tabs: []
    },
    "Data Import/Export": {
      path: "/data-import-export",
      description: "Data import & export tools",
      keywords: ["data", "import", "export", "tools", "data import export"],
      tabs: []
    },
    "API Management": {
      path: "/api-management",
      description: "API endpoints & documentation",
      keywords: ["api", "management", "endpoints", "documentation", "api management"],
      tabs: []
    },
    "Third Party Integrations": {
      path: "/third-party-integration",
      description: "External system integrations",
      keywords: ["third party", "integrations", "external", "system", "third party integrations"],
      tabs: []
    },
    "Integration Summary": {
      path: "/integration-summary",
      description: "Consolidated view of all integrations",
      keywords: ["integration", "summary", "consolidated", "view", "integration summary"],
      tabs: []
    },
    "Documentation": {
      path: "/documentation",
      description: "User guides & documentation",
      keywords: ["documentation", "user guides", "help", "manual", "docs"],
      tabs: []
    },
    "Training Materials": {
      path: "/training",
      description: "Training videos & materials",
      keywords: ["training", "materials", "videos", "training materials"],
      tabs: []
    },
    "Support Center": {
      path: "/support",
      description: "Technical support & help",
      keywords: ["support", "center", "technical", "help", "support center"],
      tabs: []
    },
    "System Settings": {
      path: "/settings",
      description: "System configuration",
      keywords: ["settings", "config", "backup", "restore", "preferences", "system", "system settings"],
      tabs: ["Appearance Mode", "Backup & Restore", "System Configuration"]
    }
  },

  // Integration Modules
  integrations: {
    "Asset Management": {
      path: "/integrations/asset-management",
      description: "Fixed asset lifecycle management",
      keywords: ["asset management", "lifecycle", "maintenance", "depreciation", "tracking"],
      tabs: ["Asset Analytics Dashboard", "Asset Detail Management", "Asset Management Dashboard", "Quarterly Audit Workflow", "System Configuration Panel", "User Management Console", "Warranty Management Center"]
    },
    "Compliance Management": {
      path: "/integrations/compliance-management",
      description: "Regulatory compliance and risk management",
      keywords: ["compliance", "regulatory", "risk", "audit", "controls"],
      tabs: ["Compliance Dashboard Overview", "Compliance Reporting Center", "Control Detail Management", "Controls Library Management", "Controls Matrix Management", "Disclosure Checklist", "Policy Library Management", "System Configuration Dashboard", "User Profile Management", "User Role Administration", "Audit Timeline Scheduler"]
    },
    "CRM": {
      path: "/integrations/crm",
      description: "Customer relationship management",
      keywords: ["crm", "customer", "relationship", "sales", "leads"],
      tabs: ["Customer Dashboard", "Lead Management", "Sales Pipeline", "Customer Analytics", "Communication Center"]
    },
    "ESG": {
      path: "/integrations/esg",
      description: "Environmental, Social, and Governance reporting",
      keywords: ["esg", "environmental", "social", "governance", "sustainability"],
      tabs: ["ESG Dashboard", "Environmental Metrics", "Social Impact", "Governance Framework", "Sustainability Reporting"]
    },
    "Project Management": {
      path: "/integrations/project-management",
      description: "Project planning and execution management",
      keywords: ["project", "management", "planning", "execution", "tracking"],
      tabs: ["Project Dashboard", "Task Management", "Resource Planning", "Timeline Management", "Budget Tracking"]
    },
    "Purchase Order Management": {
      path: "/integrations/purchase-order-management",
      description: "Purchase order and procurement management",
      keywords: ["purchase", "order", "procurement", "vendor", "supplier"],
      tabs: ["PO Dashboard", "Vendor Management", "Purchase Orders", "Approval Workflow", "Receipt Management"]
    },
    "Revenue Analytics": {
      path: "/integrations/revenue-analytics",
      description: "Revenue analysis and forecasting",
      keywords: ["revenue", "analytics", "forecasting", "analysis", "trends"],
      tabs: ["Revenue Dashboard", "Analytics Center", "Forecasting", "Trend Analysis", "Performance Metrics"]
    },
    "Role Management": {
      path: "/integrations/role-management",
      description: "User roles, permissions, and access control management",
      keywords: ["roles", "permissions", "users", "access", "security"],
      tabs: ["Role Dashboard", "User Management", "Permission Matrix", "Access Control", "Security Settings"]
    },
    "Stakeholder Management": {
      path: "/integrations/stakeholder-management",
      description: "Stakeholder engagement and communication",
      keywords: ["stakeholder", "engagement", "communication", "relationships", "management"],
      tabs: ["Stakeholder Dashboard", "Engagement Center", "Communication Hub", "Relationship Mapping", "Reporting Center"]
    }
  },

  // Features and Capabilities
  features: {
    "Multi-Currency Support": {
      description: "Support for 150+ currencies with real-time FX rates",
      keywords: ["currency", "multi-currency", "fx", "exchange", "conversion"],
      modules: ["Forex Rate Management", "Financial Statements", "Consolidation"]
    },
    "IFRS Compliance": {
      description: "Built-in IFRS standards and compliance tools",
      keywords: ["ifrs", "compliance", "standards", "gaap", "accounting"],
      modules: ["Account Management", "IFRS Templates", "Audit"]
    },
    "Automated Consolidation": {
      description: "Automated intercompany elimination and consolidation",
      keywords: ["consolidation", "automated", "intercompany", "elimination", "ownership"],
      modules: ["Consolidation", "Financial Statements"]
    },
    "Excel Integration": {
      description: "Direct Excel file processing and template management",
      keywords: ["excel", "integration", "templates", "working papers", "import"],
      modules: ["Process Module", "IFRS Templates", "Financial Statements"]
    },
    "Audit Trail": {
      description: "Complete tracking of all system changes",
      keywords: ["audit", "trail", "tracking", "changes", "history"],
      modules: ["Audit Trail", "All Modules"]
    },
    "Backup & Restore": {
      description: "Automatic and manual backup system",
      keywords: ["backup", "restore", "data", "recovery", "safety"],
      modules: ["Settings"]
    }
  },

  // Common Questions and Answers
  faq: {
    "What does consolidation tab do?": {
      answer: "The Consolidation tab handles multi-entity consolidation processes. It includes: IC Matching & Elimination (match intercompany transactions), Consolidation Journals (create elimination entries), Ownership & NCI (manage ownership structures), Roll-Forward & Closing (handle period transitions), Data Storage & Relations (manage consolidation data), and Consolidated Financials (generate final statements).",
      keywords: ["consolidation", "tab", "what", "does", "consolidation tab", "multi-entity", "intercompany"],
      module: "Consolidation",
      navigationLink: "/consolidation"
    },
    "How do I upload trial balance?": {
      answer: "Go to Process Module → Trial Balance Upload tab → Select your Excel/CSV file → Choose period and year → Click upload. The system will automatically validate and process your data.",
      keywords: ["trial balance", "upload", "process", "file", "excel"],
      module: "Process Module",
      navigationLink: "/process"
    },
    "How to generate financial statements?": {
      answer: "Navigate to Financial Statements → Select period and year → Choose FST template → Click Generate Statements. The system will create Balance Sheet, Income Statement, and Cash Flow statements.",
      keywords: ["financial statements", "generate", "balance sheet", "income statement", "reports"],
      module: "Financial Statements"
    },
    "How to set up intercompany transactions?": {
      answer: "Go to Consolidation → IC Matching & Elimination tab → Add IC Item → Enter transaction details → System will automatically match counterparty amounts.",
      keywords: ["intercompany", "ic", "transactions", "consolidation", "elimination"],
      module: "Consolidation"
    },
    "How to manage multiple currencies?": {
      answer: "Use Forex Rate Management module to fetch current exchange rates → System automatically converts amounts in Financial Statements and Consolidation → Supports 150+ currencies.",
      keywords: ["currency", "fx", "rates", "conversion", "multi-currency"],
      module: "Forex Rate Management"
    },
    "How to create backup?": {
      answer: "Go to System Settings → Backup & Restore section → Click Create Backup → System creates timestamped ZIP file with all company data.",
      keywords: ["backup", "restore", "data", "safety", "settings"],
      module: "System Settings"
    },
    "How to add new IFRS accounts?": {
      answer: "Navigate to Account Management → Click Add Account → Enter account code (4 digits), name, type, and description → Assign to hierarchy → Save.",
      keywords: ["ifrs accounts", "add", "create", "chart of accounts", "accounting"],
      module: "Account Management"
    },
    "How to set up entities?": {
      answer: "Go to Entity Management → Add Entity → Enter entity name, type (Parent/Subsidiary), country, currency → Assign to hierarchy → Save.",
      keywords: ["entities", "subsidiaries", "companies", "setup", "management"],
      module: "Entity Management"
    },
    "How to calculate audit materiality?": {
      answer: "Navigate to Audit Materiality → Enter company size, industry, financial metrics → System calculates materiality thresholds automatically.",
      keywords: ["audit", "materiality", "calculation", "thresholds", "compliance"],
      module: "Audit Materiality"
    },
    "How to manage assets?": {
      answer: "Go to Asset Register → Add Asset → Enter asset details, acquisition cost, useful life → System calculates depreciation automatically → Track asset lifecycle.",
      keywords: ["assets", "register", "depreciation", "management", "tracking"],
      module: "Asset Register"
    },
    "How to use IFRS templates?": {
      answer: "Navigate to IFRS Templates → Select standard (IFRS 15, 16, etc.) → Open Excel working paper → Make changes → System creates journal entries automatically.",
      keywords: ["ifrs templates", "standards", "excel", "working papers", "compliance"],
      module: "IFRS Templates"
    },
    "How to use ETL pipeline?": {
      answer: "Go to ETL Pipeline → Data Extraction tab → Configure data sources → Transformation tab → Set up data transformation rules → Loading tab → Define target systems → Monitor progress.",
      keywords: ["etl", "pipeline", "extract", "transform", "load", "data processing"],
      module: "ETL Pipeline"
    },
    "How to set up consolidation?": {
      answer: "Navigate to Consolidation → Set up ownership structures → Add intercompany transactions → Create elimination journals → Generate consolidated statements.",
      keywords: ["consolidation", "setup", "ownership", "intercompany", "elimination"],
      module: "Consolidation"
    },
    "How to access documentation?": {
      answer: "Click on Documentation in the navigation menu → Browse through interactive guides → Use the tree structure to navigate to specific topics → Each module has detailed explanations and step-by-step instructions.",
      keywords: ["documentation", "help", "guides", "manual", "docs"],
      module: "Documentation"
    },
    "How to use bank reconciliation?": {
      answer: "Go to Bank Reconciliation → Upload bank statements → Match transactions with your records → Review and approve reconciliations → Generate reconciliation reports.",
      keywords: ["bank", "reconciliation", "statements", "matching", "clearing"],
      module: "Bank Reconciliation"
    },
    "How to manage bills?": {
      answer: "Navigate to Bills → Create Bill tab → Enter bill details → Upload supporting documents → Track payment status → Generate aging reports.",
      keywords: ["bills", "payables", "receivables", "invoices", "aging"],
      module: "Bills"
    },
    "How to create journal entries?": {
      answer: "Go to Journal Entries → Click Add Entry → Enter account codes, amounts, and descriptions → Review and post entries → System validates debits equal credits.",
      keywords: ["journal", "entries", "manual", "adjustments", "posting"],
      module: "Journal Entries"
    },
    "How to use forecast and budget?": {
      answer: "Navigate to Forecast & Budget → Create budget templates → Set up forecasting models → Compare actual vs budget → Generate variance reports.",
      keywords: ["forecast", "budget", "budgeting", "forecasting", "planning"],
      module: "Forecast & Budget"
    },
    "How to perform variance analysis?": {
      answer: "Go to Variance Analysis → Select period and budget → System automatically calculates variances → Review significant variances → Generate analysis reports.",
      keywords: ["variance", "analysis", "budget", "actual", "variance analysis"],
      module: "Variance Analysis"
    },
    "How to analyze cash flow?": {
      answer: "Navigate to Cash Flow Analysis → Select reporting period → System generates cash flow statements → Analyze operating, investing, and financing activities.",
      keywords: ["cash flow", "analysis", "statements", "cash flow analysis"],
      module: "Cash Flow Analysis"
    },
    "How to calculate financial ratios?": {
      answer: "Go to Financial Ratios → Select ratio categories → System automatically calculates ratios → Compare with industry benchmarks → Generate ratio reports.",
      keywords: ["financial", "ratios", "analysis", "financial ratios"],
      module: "Financial Ratios"
    },
    "How to use narrative reporting?": {
      answer: "Navigate to Narrative Reporting → Create rich text reports → Add charts and tables → Collaborate with team members → Publish reports.",
      keywords: ["narrative", "reporting", "rich text", "collaboration", "narrative reporting"],
      module: "Narrative Reporting"
    },
    "How to perform what-if analysis?": {
      answer: "Go to What-If Analysis → Create scenarios → Modify assumptions → Compare scenario outcomes → Generate sensitivity analysis reports.",
      keywords: ["what-if", "analysis", "scenario", "modeling", "sensitivity", "what if analysis"],
      module: "What-If Analysis"
    },
    "How to use real-time analytics?": {
      answer: "Navigate to Real-Time Analytics → View live dashboards → Monitor key performance indicators → Set up alerts → Generate real-time reports.",
      keywords: ["real-time", "analytics", "dashboard", "unified", "real time analytics"],
      module: "Real-Time Analytics"
    },
    "How to manage regulatory reporting?": {
      answer: "Go to Regulatory Reporting → Select reporting requirements → Generate compliance reports → Submit to regulatory bodies → Track submission status.",
      keywords: ["regulatory", "reporting", "compliance", "regulatory reporting"],
      module: "Regulatory Reporting"
    },
    "How to set up global compliance?": {
      answer: "Navigate to Global Compliance → Configure multi-jurisdiction requirements → Set up compliance workflows → Monitor compliance status → Generate compliance reports.",
      keywords: ["global", "compliance", "multi-jurisdiction", "global compliance"],
      module: "Global Compliance"
    },
    "How to use audit working papers?": {
      answer: "Go to Audit → Create audit engagements → Set up working papers → Document audit procedures → Generate audit reports → Track audit progress.",
      keywords: ["audit", "working papers", "auditing", "compliance", "review"],
      module: "Audit"
    },
    "How to track audit trail?": {
      answer: "Navigate to Audit Trail → View all system changes → Filter by user, date, or module → Export audit logs → Monitor system activity.",
      keywords: ["audit trail", "tracking", "changes", "history", "log"],
      module: "Audit Trail"
    },
    "How to set up internal controls?": {
      answer: "Go to Internal Controls → Define control framework → Set up control procedures → Monitor control effectiveness → Generate control reports.",
      keywords: ["internal", "controls", "framework", "internal controls"],
      module: "Internal Controls"
    },
    "How to manage workflows?": {
      answer: "Navigate to Workflows → Create workflow templates → Set up approval processes → Monitor workflow progress → Generate workflow reports.",
      keywords: ["workflows", "automation", "process", "management", "workflow"],
      module: "Workflows"
    },
    "How to manage tax calculations?": {
      answer: "Go to Tax Management → Set up tax rules → Calculate tax liabilities → Generate tax returns → Track tax payments → Manage tax compliance.",
      keywords: ["tax", "management", "calculations", "filing", "tax management"],
      module: "Tax Management"
    },
    "How to perform business valuation?": {
      answer: "Navigate to Business Valuation & Impairment → Set up valuation models → Perform DCF analysis → Conduct impairment testing → Generate valuation reports.",
      keywords: ["business", "valuation", "dcf", "analysis", "impairment", "testing", "business valuation"],
      module: "Business Valuation & Impairment"
    },
    "How to use SQL query console?": {
      answer: "Go to SQL Query Console → Write SELECT queries → Execute against PostgreSQL database → View results → Export query results → Save query templates.",
      keywords: ["sql", "query", "console", "postgresql", "secure", "sql query console"],
      module: "SQL Query Console"
    },
    "How to monitor system health?": {
      answer: "Navigate to System Monitoring → View system metrics → Monitor performance → Set up alerts → Generate system reports → Track system health.",
      keywords: ["system", "monitoring", "health", "performance", "system monitoring"],
      module: "System Monitoring"
    },
    "How to manage database?": {
      answer: "Go to Database Management → View database statistics → Monitor database performance → Manage database connections → Generate database reports.",
      keywords: ["database", "management", "administration", "database management"],
      module: "Database Management"
    },
    "How to import/export data?": {
      answer: "Navigate to Data Import/Export → Select data source → Configure import/export settings → Execute data transfer → Monitor transfer progress → Generate transfer reports.",
      keywords: ["data", "import", "export", "tools", "data import export"],
      module: "Data Import/Export"
    },
    "How to manage API endpoints?": {
      answer: "Go to API Management → View API documentation → Test API endpoints → Monitor API usage → Generate API reports → Manage API access.",
      keywords: ["api", "management", "endpoints", "documentation", "api management"],
      module: "API Management"
    },
    "How to set up third party integrations?": {
      answer: "Navigate to Third Party Integrations → Configure external systems → Set up data mapping → Test integrations → Monitor integration status → Generate integration reports.",
      keywords: ["third party", "integrations", "external", "system", "third party integrations"],
      module: "Third Party Integrations"
    },
    "How to view integration summary?": {
      answer: "Go to Integration Summary → View consolidated integration dashboard → Monitor all integrations → Generate integration reports → Track integration health.",
      keywords: ["integration", "summary", "consolidated", "view", "integration summary"],
      module: "Integration Summary"
    },
    "How to access training materials?": {
      answer: "Navigate to Training Materials → Browse video tutorials → Access training documents → Complete training modules → Track training progress → Generate training reports.",
      keywords: ["training", "materials", "videos", "training materials"],
      module: "Training Materials"
    },
    "How to get technical support?": {
      answer: "Go to Support Center → Submit support tickets → Access knowledge base → Chat with support team → Track support requests → Generate support reports.",
      keywords: ["support", "center", "technical", "help", "support center"],
      module: "Support Center",
      navigationLink: "/support"
    },
    // IFRS Specific Questions
    "What is IFRS 15 revenue recognition?": {
      answer: "IFRS 15 is the standard for Revenue from Contracts with Customers. It provides a 5-step model: 1) Identify the contract, 2) Identify performance obligations, 3) Determine transaction price, 4) Allocate price to obligations, 5) Recognize revenue when obligations are satisfied. Use the IFRS Templates → IFRS 15 section for working papers and journal entries.",
      keywords: ["ifrs 15", "revenue", "recognition", "contracts", "customers", "performance obligations"],
      module: "IFRS Templates",
      navigationLink: "/ifrs-templates"
    },
    "How to account for leases under IFRS 16?": {
      answer: "IFRS 16 requires lessees to recognize Right-of-Use (ROU) assets and lease liabilities for most leases. The system helps with: lease classification, ROU asset calculation, lease liability measurement, and journal entry creation. Access IFRS Templates → IFRS 16 for working papers and calculations.",
      keywords: ["ifrs 16", "leases", "rou", "right of use", "lease liability", "lease classification"],
      module: "IFRS Templates",
      navigationLink: "/ifrs-templates"
    },
    "What is IFRS 9 financial instruments?": {
      answer: "IFRS 9 covers classification and measurement of financial instruments, impairment of financial assets, and hedge accounting. It includes: amortized cost, fair value through OCI, fair value through P&L classifications. Use IFRS Templates → IFRS 9 for working papers and calculations.",
      keywords: ["ifrs 9", "financial instruments", "classification", "measurement", "impairment", "hedge accounting"],
      module: "IFRS Templates",
      navigationLink: "/ifrs-templates"
    },
    "How to handle business combinations under IFRS 3?": {
      answer: "IFRS 3 requires acquisition method accounting for business combinations. Key steps: identify acquirer, determine acquisition date, recognize and measure assets/liabilities, recognize goodwill or bargain purchase gain. Use IFRS Templates → IFRS 3 for working papers and consolidation entries.",
      keywords: ["ifrs 3", "business combinations", "acquisition method", "goodwill", "bargain purchase"],
      module: "IFRS Templates",
      navigationLink: "/ifrs-templates"
    },
    "What is consolidation under IFRS 10?": {
      answer: "IFRS 10 requires consolidation when an entity controls another entity. Control exists when you have power over investee, exposure to variable returns, and ability to affect returns. The Consolidation module handles: ownership structures, intercompany eliminations, NCI calculations, and consolidated statements.",
      keywords: ["ifrs 10", "consolidation", "control", "subsidiary", "nci", "non-controlling interest"],
      module: "Consolidation",
      navigationLink: "/consolidation"
    },
    "How to present financial statements under IAS 1?": {
      answer: "IAS 1 sets out overall requirements for financial statement presentation. It requires: statement of financial position, statement of profit/loss and OCI, statement of changes in equity, statement of cash flows, and notes. Use Financial Statements module to generate IAS 1 compliant statements.",
      keywords: ["ias 1", "presentation", "financial statements", "statement of financial position", "profit loss"],
      module: "Financial Statements",
      navigationLink: "/financial-statements"
    },
    "What is cash flow statement under IAS 7?": {
      answer: "IAS 7 requires cash flow statements showing operating, investing, and financing activities. The system automatically generates cash flow statements from your data, categorizing cash flows correctly and providing direct/indirect method options.",
      keywords: ["ias 7", "cash flow", "statement", "operating", "investing", "financing"],
      module: "Financial Statements",
      navigationLink: "/financial-statements"
    },
    "How to account for income taxes under IAS 12?": {
      answer: "IAS 12 requires current and deferred tax accounting. Current tax is tax payable on current period profits, while deferred tax arises from temporary differences between accounting and tax bases. Use Tax Management module for tax calculations and compliance.",
      keywords: ["ias 12", "income taxes", "current tax", "deferred tax", "temporary differences"],
      module: "Tax Management",
      navigationLink: "/tax-management"
    },
    // Software Usage Questions
    "What is the ETL pipeline?": {
      answer: "ETL (Extract, Transform, Load) pipeline processes data from various sources. It includes: Data Extraction (configure sources), Transformation (clean and transform data), Loading (load to target systems), Data Quality (validate data), and Monitoring (track performance). Access ETL Pipeline module for data processing workflows.",
      keywords: ["etl", "pipeline", "extract", "transform", "load", "data processing"],
      module: "ETL Pipeline",
      navigationLink: "/etl"
    },
    "How does the search function work?": {
      answer: "The search function provides instant access to all modules, features, and help content. It searches across: module names, descriptions, keywords, tabs, and FAQ. Use the search bar at the top to find any feature quickly. Results show hierarchical paths and direct navigation links.",
      keywords: ["search", "function", "how", "works", "find", "modules"],
      module: "Search System"
    },
    "What are financial ratios?": {
      answer: "Financial ratios analyze your company's financial performance. The system calculates: profitability ratios (ROE, ROA), liquidity ratios (current ratio, quick ratio), leverage ratios (debt-to-equity), and efficiency ratios. Access Financial Ratios module for automated calculations and industry benchmarking.",
      keywords: ["financial ratios", "profitability", "liquidity", "leverage", "efficiency", "roa", "roe"],
      module: "Financial Ratios",
      navigationLink: "/financial-ratios"
    },
    "How to set up multi-currency?": {
      answer: "Multi-currency support handles 150+ currencies automatically. Set up: entity currencies in Entity Management, fetch exchange rates in Forex Rate Management, configure conversion rules. The system automatically converts amounts in Financial Statements and Consolidation using closing rates for balance sheet and average rates for income statement.",
      keywords: ["multi-currency", "currency", "exchange rates", "conversion", "forex", "fx rates"],
      module: "Forex Rate Management",
      navigationLink: "/forex-rates"
    },
    "What is audit materiality?": {
      answer: "Audit materiality is the threshold for determining if misstatements are significant. The system calculates materiality based on: company size, industry, revenue, assets, and net income. Access Audit Materiality module to calculate thresholds and apply to your audit procedures.",
      keywords: ["audit materiality", "materiality", "threshold", "misstatements", "audit procedures"],
      module: "Audit Materiality",
      navigationLink: "/audit-materiality"
    },
    "How to manage assets?": {
      answer: "Asset management includes: registering assets, calculating depreciation, tracking locations, managing disposals. The Asset Register module provides: Asset Overview, Add Asset, Depreciation calculations, IFRS Templates, and Reports. It automatically calculates depreciation using various methods (straight-line, declining balance).",
      keywords: ["asset management", "assets", "depreciation", "asset register", "ppe", "fixed assets"],
      module: "Asset Register",
      navigationLink: "/asset-register"
    },
    "What is variance analysis?": {
      answer: "Variance analysis compares actual results with budgets/forecasts to identify differences. The system provides: budget vs actual comparisons, variance explanations, drill-down capabilities, exception reporting, and trend analysis. Access Variance Analysis module for detailed variance reporting.",
      keywords: ["variance analysis", "budget", "actual", "variances", "comparison", "forecast"],
      module: "Variance Analysis",
      navigationLink: "/variance-analysis"
    },
    "How to create journal entries?": {
      answer: "Journal entries record business transactions in the accounting system. The system provides: manual entry creation, debit/credit validation, entry approval workflow, audit trail tracking, and bulk entry processing. Access Journal Entries module to create and manage accounting entries.",
      keywords: ["journal entries", "manual entries", "debit", "credit", "accounting entries", "posting"],
      module: "Journal Entries",
      navigationLink: "/journal-entries"
    },
    "What is bank reconciliation?": {
      answer: "Bank reconciliation matches your accounting records with bank statements to ensure accuracy. The system provides: bank statement import, automatic transaction matching, reconciliation reports, exception handling, and audit trail. Access Bank Reconciliation module for automated reconciliation processes.",
      keywords: ["bank reconciliation", "bank statements", "matching", "reconciliation", "banking"],
      module: "Bank Reconciliation",
      navigationLink: "/bank-reconciliation"
    },
    "How to use what-if analysis?": {
      answer: "What-if analysis models different scenarios to understand potential outcomes. The system provides: scenario creation, assumption modification, outcome comparison, sensitivity analysis, and reporting. Access What-If Analysis module for scenario modeling and decision support.",
      keywords: ["what-if analysis", "scenarios", "modeling", "sensitivity", "assumptions", "outcomes"],
      module: "What-If Analysis",
      navigationLink: "/what-if-analysis"
    },
    "What is narrative reporting?": {
      answer: "Narrative reporting creates rich text reports with charts, tables, and collaborative features. The system provides: rich text editor, chart integration, table creation, team collaboration, and report publishing. Access Narrative Reporting module for comprehensive reporting capabilities.",
      keywords: ["narrative reporting", "rich text", "reports", "collaboration", "charts", "tables"],
      module: "Narrative Reporting",
      navigationLink: "/narrative-reporting"
    },
    "How to monitor system performance?": {
      answer: "System monitoring tracks performance metrics and health status. The system provides: real-time metrics, performance monitoring, alert system, system reports, and health tracking. Access System Monitoring module for comprehensive system oversight.",
      keywords: ["system monitoring", "performance", "metrics", "health", "alerts", "system status"],
      module: "System Monitoring",
      navigationLink: "/system-monitoring"
    },
    "What is real-time analytics?": {
      answer: "Real-time analytics provides live dashboards and KPI monitoring. The system provides: live dashboards, KPI monitoring, alert system, custom metrics, and mobile-responsive design. Access Real-Time Analytics module for instant insights and performance tracking.",
      keywords: ["real-time analytics", "live dashboards", "kpi", "monitoring", "alerts", "metrics"],
      module: "Real-Time Analytics",
      navigationLink: "/real-time-analytics"
    }
  }
};

// Search functionality
export class SearchEngine {
  constructor() {
    this.data = searchData;
    this.index = this.buildIndex();
  }

  buildIndex() {
    const index = [];
    
    // Index modules
    Object.entries(this.data.modules).forEach(([name, module]) => {
      index.push({
        type: 'module',
        name: name,
        path: module.path,
        description: module.description,
        keywords: module.keywords,
        tabs: module.tabs,
        searchText: `${name} ${module.description} ${module.keywords.join(' ')} ${module.tabs.join(' ')}`
      });
    });

    // Index integrations
    Object.entries(this.data.integrations).forEach(([name, integration]) => {
      index.push({
        type: 'integration',
        name: name,
        path: integration.path,
        description: integration.description,
        keywords: integration.keywords,
        tabs: integration.tabs,
        searchText: `${name} ${integration.description} ${integration.keywords.join(' ')} ${integration.tabs.join(' ')}`
      });
    });

    // Index features
    Object.entries(this.data.features).forEach(([name, feature]) => {
      index.push({
        type: 'feature',
        name: name,
        description: feature.description,
        keywords: feature.keywords,
        modules: feature.modules,
        searchText: `${name} ${feature.description} ${feature.keywords.join(' ')} ${feature.modules.join(' ')}`
      });
    });

    // Index FAQ
    Object.entries(this.data.faq).forEach(([question, faq]) => {
      index.push({
        type: 'faq',
        question: question,
        answer: faq.answer,
        keywords: faq.keywords,
        module: faq.module,
        searchText: `${question} ${faq.answer} ${faq.keywords.join(' ')} ${faq.module}`
      });
    });

    return index;
  }

  search(query, limit = 10) {
    if (!query || query.length < 2) return [];
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const results = [];

    this.index.forEach(item => {
      const searchText = item.searchText.toLowerCase();
      let score = 0;

      // Exact match gets highest score
      if (searchText.includes(query.toLowerCase())) {
        score += 100;
      }

      // Individual term matches
      searchTerms.forEach(term => {
        if (searchText.includes(term)) {
          score += 10;
        }
      });

      // Name/title matches get bonus
      if (item.name && item.name.toLowerCase().includes(query.toLowerCase())) {
        score += 50;
      }

      if (item.question && item.question.toLowerCase().includes(query.toLowerCase())) {
        score += 50;
      }

      if (score > 0) {
        results.push({ ...item, score });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getHierarchicalPath(item) {
    if (item.type === 'integration') {
      return `Integrations → ${item.name}`;
    } else if (item.type === 'module') {
      return item.name;
    } else if (item.type === 'feature') {
      return `Features → ${item.name}`;
    } else if (item.type === 'faq') {
      return `Help → ${item.module}`;
    }
    return item.name;
  }

  getChatResponse(query) {
    const results = this.search(query, 3);
    
    if (results.length === 0) {
      return {
        type: 'no_results',
        message: "I couldn't find information about that. Try searching for: trial balance, financial statements, consolidation, or IFRS accounts."
      };
    }

    const topResult = results[0];
    
    if (topResult.type === 'faq') {
      return {
        type: 'faq',
        question: topResult.question,
        answer: topResult.answer,
        module: topResult.module
      };
    } else {
      return {
        type: 'navigation',
        name: topResult.name,
        description: topResult.description,
        path: topResult.path,
        tabs: topResult.tabs || [],
        hierarchicalPath: this.getHierarchicalPath(topResult)
      };
    }
  }
}
