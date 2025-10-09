"""
Default data insertion for new company databases
This includes sample/default data that should be present in every new company
"""

def get_default_data_sql():
    """Return SQL statements to insert default/sample data"""
    return """
    -- Insert default asset categories
    INSERT INTO asset_categories (category_name, description, default_useful_life, default_depreciation_method) VALUES
    ('Buildings', 'Real estate and buildings', 30, 'Straight Line'),
    ('Machinery', 'Manufacturing and production equipment', 10, 'Straight Line'),
    ('Vehicles', 'Company vehicles and transportation', 5, 'Straight Line'),
    ('IT Equipment', 'Computers, servers, and IT hardware', 3, 'Straight Line'),
    ('Furniture', 'Office furniture and fixtures', 7, 'Straight Line'),
    ('Intangible', 'Patents, trademarks, and software', 5, 'Straight Line')
    ON CONFLICT DO NOTHING;

    -- Insert default system settings
    INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
    ('default_currency', 'USD', 'string', 'Default currency for the company'),
    ('fiscal_year_end', '12-31', 'string', 'Fiscal year end date (MM-DD)'),
    ('consolidation_method', 'Full', 'string', 'Default consolidation method'),
    ('materiality_threshold', '5.0', 'decimal', 'Default materiality threshold percentage'),
    ('auto_backup_enabled', 'true', 'boolean', 'Enable automatic backups'),
    ('backup_retention_days', '30', 'integer', 'Number of days to retain backups'),
    ('audit_trail_enabled', 'true', 'boolean', 'Enable audit trail logging'),
    ('workflow_notifications', 'true', 'boolean', 'Enable workflow notifications')
    ON CONFLICT (setting_key) DO NOTHING;

    -- Insert default consolidation settings
    INSERT INTO consolidation_settings (setting_key, setting_value, setting_type, description) VALUES
    ('elimination_method', 'Full', 'string', 'Method for intercompany eliminations'),
    ('goodwill_method', 'Partial', 'string', 'Goodwill calculation method'),
    ('nci_calculation', 'Proportionate', 'string', 'Non-controlling interest calculation method'),
    ('fx_translation_method', 'Current Rate', 'string', 'Foreign exchange translation method'),
    ('consolidation_frequency', 'Monthly', 'string', 'Frequency of consolidation process')
    ON CONFLICT (setting_key) DO NOTHING;

    -- Insert sample IFRS account structure
    INSERT INTO accounts (account_code, account_name, account_type, account_category, normal_balance, description) VALUES
    -- Assets
    ('1000', 'Cash and Cash Equivalents', 'Asset', 'Current Assets', 'Debit', 'Cash, bank accounts, and short-term investments'),
    ('1100', 'Accounts Receivable', 'Asset', 'Current Assets', 'Debit', 'Trade receivables from customers'),
    ('1200', 'Inventory', 'Asset', 'Current Assets', 'Debit', 'Raw materials, work in progress, and finished goods'),
    ('1300', 'Prepaid Expenses', 'Asset', 'Current Assets', 'Debit', 'Expenses paid in advance'),
    ('1500', 'Property, Plant & Equipment', 'Asset', 'Non-Current Assets', 'Debit', 'Fixed assets used in operations'),
    ('1600', 'Accumulated Depreciation', 'Asset', 'Non-Current Assets', 'Credit', 'Accumulated depreciation on fixed assets'),
    ('1700', 'Intangible Assets', 'Asset', 'Non-Current Assets', 'Debit', 'Patents, trademarks, goodwill'),
    ('1800', 'Investment Properties', 'Asset', 'Non-Current Assets', 'Debit', 'Properties held for investment'),
    
    -- Liabilities
    ('2000', 'Accounts Payable', 'Liability', 'Current Liabilities', 'Credit', 'Trade payables to suppliers'),
    ('2100', 'Short-term Debt', 'Liability', 'Current Liabilities', 'Credit', 'Short-term borrowings and loans'),
    ('2200', 'Accrued Expenses', 'Liability', 'Current Liabilities', 'Credit', 'Expenses incurred but not yet paid'),
    ('2300', 'Current Tax Liability', 'Liability', 'Current Liabilities', 'Credit', 'Income tax payable'),
    ('2500', 'Long-term Debt', 'Liability', 'Non-Current Liabilities', 'Credit', 'Long-term borrowings and loans'),
    ('2600', 'Deferred Tax Liability', 'Liability', 'Non-Current Liabilities', 'Credit', 'Deferred tax obligations'),
    ('2700', 'Provisions', 'Liability', 'Non-Current Liabilities', 'Credit', 'Provisions for future obligations'),
    
    -- Equity
    ('3000', 'Share Capital', 'Equity', 'Equity', 'Credit', 'Issued share capital'),
    ('3100', 'Retained Earnings', 'Equity', 'Equity', 'Credit', 'Accumulated profits and losses'),
    ('3200', 'Other Comprehensive Income', 'Equity', 'Equity', 'Credit', 'Other comprehensive income items'),
    ('3300', 'Non-controlling Interest', 'Equity', 'Equity', 'Credit', 'Non-controlling interest in subsidiaries'),
    
    -- Revenue
    ('4000', 'Sales Revenue', 'Revenue', 'Revenue', 'Credit', 'Revenue from sale of goods and services'),
    ('4100', 'Service Revenue', 'Revenue', 'Revenue', 'Credit', 'Revenue from services provided'),
    ('4200', 'Interest Income', 'Revenue', 'Revenue', 'Credit', 'Interest earned on investments'),
    ('4300', 'Other Income', 'Revenue', 'Revenue', 'Credit', 'Other operating income'),
    
    -- Expenses
    ('5000', 'Cost of Goods Sold', 'Expense', 'Cost of Sales', 'Debit', 'Direct costs of goods sold'),
    ('5100', 'Cost of Services', 'Expense', 'Cost of Sales', 'Debit', 'Direct costs of services provided'),
    ('6000', 'Salaries and Wages', 'Expense', 'Operating Expenses', 'Debit', 'Employee compensation'),
    ('6100', 'Rent Expense', 'Expense', 'Operating Expenses', 'Debit', 'Office and facility rent'),
    ('6200', 'Utilities', 'Expense', 'Operating Expenses', 'Debit', 'Electricity, water, gas, internet'),
    ('6300', 'Depreciation Expense', 'Expense', 'Operating Expenses', 'Debit', 'Depreciation of fixed assets'),
    ('6400', 'Marketing and Advertising', 'Expense', 'Operating Expenses', 'Debit', 'Marketing and promotional expenses'),
    ('6500', 'Professional Services', 'Expense', 'Operating Expenses', 'Debit', 'Legal, accounting, consulting fees'),
    ('6600', 'Travel and Entertainment', 'Expense', 'Operating Expenses', 'Debit', 'Business travel and entertainment'),
    ('7000', 'Interest Expense', 'Expense', 'Financial Expenses', 'Debit', 'Interest on borrowings'),
    ('7100', 'Foreign Exchange Loss', 'Expense', 'Financial Expenses', 'Debit', 'Losses from currency exchange'),
    ('8000', 'Income Tax Expense', 'Expense', 'Tax Expenses', 'Debit', 'Current and deferred tax expenses')
    ON CONFLICT (account_code) DO NOTHING;

    -- Insert default hierarchies
    INSERT INTO hierarchies (hierarchy_type, hierarchy_name, description) VALUES
    ('Entity', 'Corporate Structure', 'Main corporate entity hierarchy'),
    ('Account', 'Chart of Accounts', 'Standard chart of accounts hierarchy'),
    ('FST', 'Financial Statement Templates', 'Financial statement template hierarchy'),
    ('Geographic', 'Geographic Regions', 'Geographic reporting hierarchy'),
    ('Business Unit', 'Business Units', 'Business unit reporting hierarchy')
    ON CONFLICT DO NOTHING;

    -- No sample entities - will be created by user

    -- Insert default FST templates for basic financial statements
    INSERT INTO fst_templates (statement_type, category, line_item, display_order) VALUES
    ('Balance Sheet', 'Assets', 'Current Assets', 1),
    ('Balance Sheet', 'Assets', 'Non-Current Assets', 2),
    ('Balance Sheet', 'Liabilities', 'Current Liabilities', 3),
    ('Balance Sheet', 'Liabilities', 'Non-Current Liabilities', 4),
    ('Balance Sheet', 'Equity', 'Share Capital', 5),
    ('Balance Sheet', 'Equity', 'Retained Earnings', 6),
    ('Income Statement', 'Revenue', 'Total Revenue', 1),
    ('Income Statement', 'Expenses', 'Cost of Sales', 2),
    ('Income Statement', 'Expenses', 'Operating Expenses', 3),
    ('Income Statement', 'Expenses', 'Financial Expenses', 4),
    ('Cash Flow', 'Operating', 'Cash from Operations', 1),
    ('Cash Flow', 'Investing', 'Cash from Investing', 2),
    ('Cash Flow', 'Financing', 'Cash from Financing', 3)
    ON CONFLICT DO NOTHING;

    -- No default custom axes - will be created by user as needed

    -- No sample workflows or integrations - will be configured by user
    """

def get_sample_data_sql():
    """Return empty SQL - no sample data will be inserted"""
    return """
    -- No sample data - all data will be loaded by user
    SELECT 1 WHERE FALSE;
    """
