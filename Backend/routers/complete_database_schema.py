"""
Complete database schema creation for company databases
This includes ALL tables from olddatabase.py
"""

def get_complete_database_schema():
    """Return the complete SQL schema for creating all necessary tables"""
    return """
    -- Core Tables
    CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        company_id INTEGER,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(username, company_id)
    );

    -- Entity Management
    CREATE TABLE IF NOT EXISTS entities (
        id SERIAL PRIMARY KEY,
        entity_code VARCHAR(100) NOT NULL,
        entity_name VARCHAR(255) NOT NULL,
        entity_type VARCHAR(50),
        country VARCHAR(100),
        currency VARCHAR(10),
        hierarchy_id INTEGER,
        parent_id INTEGER,
        node_id INTEGER,
        public_company BOOLEAN,
        jurisdiction VARCHAR(100),
        business_sector VARCHAR(255),
        ownership_percentage DECIMAL(5,2),
        consolidation_method VARCHAR(50),
        functional_currency VARCHAR(10),
        reporting_currency VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Account Management
    CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        account_code VARCHAR(100) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        ifrs_category VARCHAR(100),
        statement VARCHAR(50),
        description TEXT,
        hierarchy_id INTEGER,
        node_id INTEGER,
        account_type VARCHAR(50),
        account_category VARCHAR(100),
        normal_balance VARCHAR(10),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Hierarchies
    CREATE TABLE IF NOT EXISTS hierarchies (
        id SERIAL PRIMARY KEY,
        hierarchy_type VARCHAR(50) NOT NULL,
        hierarchy_name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- FST Templates
    CREATE TABLE IF NOT EXISTS fst_templates (
        id SERIAL PRIMARY KEY,
        statement_type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        line_item VARCHAR(255) NOT NULL,
        display_order INTEGER DEFAULT 0,
        formula TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fst_elements (
        id VARCHAR(100) PRIMARY KEY,
        template_id INTEGER,
        element_type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        account_code VARCHAR(100),
        formula TEXT,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        color VARCHAR(50),
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Trial Balance
    CREATE TABLE IF NOT EXISTS tb_entries (
        id SERIAL PRIMARY KEY,
        period VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        entity_code VARCHAR(100) NOT NULL,
        account_code VARCHAR(100) NOT NULL,
        amount DECIMAL(20,2) NOT NULL,
        debit_amount DECIMAL(15,2) DEFAULT 0,
        credit_amount DECIMAL(15,2) DEFAULT 0,
        balance_amount DECIMAL(15,2) DEFAULT 0,
        source_filename VARCHAR(255),
        source_type VARCHAR(50) DEFAULT 'process_entry',
        upload_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Uploads
    CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        original_filename VARCHAR(255) NOT NULL,
        stored_path VARCHAR(500) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        period VARCHAR(20),
        year VARCHAR(10),
        file_size BIGINT,
        row_count INTEGER,
        status VARCHAR(50) DEFAULT 'uploaded',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit
    CREATE TABLE IF NOT EXISTS account_audit_log (
        id SERIAL PRIMARY KEY,
        account_code VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        changes JSONB,
        user_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audits (
        id SERIAL PRIMARY KEY,
        audit_name VARCHAR(255) NOT NULL,
        audit_type VARCHAR(100) NOT NULL,
        period VARCHAR(50) NOT NULL,
        year VARCHAR(10) NOT NULL,
        auditor_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Planning',
        start_date DATE,
        end_date DATE,
        description TEXT,
        findings JSONB,
        recommendations JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS audit_materiality (
        id SERIAL PRIMARY KEY,
        materiality_type VARCHAR(100) NOT NULL,
        base_amount DECIMAL(15,2) NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        calculated_amount DECIMAL(15,2) NOT NULL,
        period VARCHAR(50) NOT NULL,
        year VARCHAR(10) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS audit_findings (
        id SERIAL PRIMARY KEY,
        audit_id INTEGER NOT NULL,
        finding_title VARCHAR(255) NOT NULL,
        finding_type VARCHAR(100) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        description TEXT,
        recommendation TEXT,
        status VARCHAR(50) DEFAULT 'Open',
        assigned_to VARCHAR(255),
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_trail (
        id SERIAL PRIMARY KEY,
        table_name VARCHAR(100) NOT NULL,
        record_id VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        old_values JSONB,
        new_values JSONB,
        user_id VARCHAR(100),
        user_name VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Consolidation
    CREATE TABLE IF NOT EXISTS consolidation_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS intercompany_transactions (
        id SERIAL PRIMARY KEY,
        transaction_type VARCHAR(100) NOT NULL,
        entity VARCHAR(255) NOT NULL,
        counterparty VARCHAR(255) NOT NULL,
        entity_account VARCHAR(100) NOT NULL,
        counterparty_account VARCHAR(100) NOT NULL,
        entity_amount DECIMAL(15,2) NOT NULL,
        counterparty_amount DECIMAL(15,2) NOT NULL,
        difference DECIMAL(15,2) DEFAULT 0,
        period VARCHAR(2) NOT NULL,
        year INTEGER NOT NULL,
        transaction_date TIMESTAMP NOT NULL,
        description TEXT,
        reference VARCHAR(255),
        currency VARCHAR(3) DEFAULT 'USD',
        exchange_rate DECIMAL(10,6) DEFAULT 1.0,
        status VARCHAR(50) DEFAULT 'Open',
        matching_id VARCHAR(100),
        elimination_entry_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        approved_by VARCHAR(100),
        approved_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consolidation_journals (
        id SERIAL PRIMARY KEY,
        journal_number VARCHAR(100) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        journal_date TIMESTAMP NOT NULL,
        period VARCHAR(2) NOT NULL,
        year INTEGER NOT NULL,
        journal_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Draft',
        total_debits DECIMAL(15,2) DEFAULT 0,
        total_credits DECIMAL(15,2) DEFAULT 0,
        is_balanced BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        posted_by VARCHAR(100),
        posted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consolidation_journal_entries (
        id SERIAL PRIMARY KEY,
        journal_id INTEGER NOT NULL,
        entry_type VARCHAR(50) NOT NULL,
        account_code VARCHAR(100) NOT NULL,
        entity VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        description TEXT,
        reference VARCHAR(255),
        line_number INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Process Journals
    CREATE TABLE IF NOT EXISTS process_journal_categories (
        id SERIAL PRIMARY KEY,
        category_code VARCHAR(50) NOT NULL,
        category_name VARCHAR(255) NOT NULL,
        description TEXT,
        source_type VARCHAR(50) DEFAULT 'category',
        period VARCHAR(50),
        year INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        default_journal_type VARCHAR(100) DEFAULT 'ADJUSTMENT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS process_journals (
        id SERIAL PRIMARY KEY,
        category_id INTEGER,
        journal_number VARCHAR(100) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        journal_date TIMESTAMP NOT NULL,
        source_type VARCHAR(50) DEFAULT 'journal',
        period VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        journal_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Draft',
        total_debits DECIMAL(15,2) DEFAULT 0,
        total_credits DECIMAL(15,2) DEFAULT 0,
        is_balanced BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        posted_by VARCHAR(100),
        posted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS process_journal_entries (
        id SERIAL PRIMARY KEY,
        journal_id INTEGER NOT NULL,
        entry_type VARCHAR(50) NOT NULL,
        account_code VARCHAR(100) NOT NULL,
        entity VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        description TEXT,
        reference VARCHAR(255),
        line_number INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Ownership & NCI
    CREATE TABLE IF NOT EXISTS ownership_structures (
        id SERIAL PRIMARY KEY,
        parent_entity VARCHAR(255) NOT NULL,
        subsidiary_entity VARCHAR(255) NOT NULL,
        ownership_percentage DECIMAL(5,2) NOT NULL,
        nci_percentage DECIMAL(5,2) DEFAULT 0,
        relationship_type VARCHAR(100) NOT NULL,
        description TEXT,
        valid_from TIMESTAMP NOT NULL,
        valid_to TIMESTAMP,
        fair_value_net_assets DECIMAL(15,2) NOT NULL,
        purchase_consideration DECIMAL(15,2),
        goodwill_method VARCHAR(50) DEFAULT 'Partial',
        goodwill_value DECIMAL(15,2),
        nci_value DECIMAL(15,2),
        effective_date TIMESTAMP,
        entity_name VARCHAR(255),
        entity_id VARCHAR(100),
        economic_interest_percentage DECIMAL(5,2),
        voting_rights_percentage DECIMAL(5,2),
        ownership_event_type VARCHAR(100),
        acquisition_date TIMESTAMP,
        ownership_type VARCHAR(50),
        acquisition_cost DECIMAL(15,2),
        consideration_paid DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS nci_calculations (
        id SERIAL PRIMARY KEY,
        period VARCHAR(2) NOT NULL,
        year INTEGER NOT NULL,
        entity_name VARCHAR(255) NOT NULL,
        ownership_percentage DECIMAL(5,2) NOT NULL,
        nci_percentage DECIMAL(5,2) NOT NULL,
        subsidiary_equity DECIMAL(15,2) NOT NULL,
        parent_share DECIMAL(15,2) NOT NULL,
        minority_interest DECIMAL(15,2) NOT NULL,
        nci_amount DECIMAL(15,2) NOT NULL,
        goodwill_allocation DECIMAL(15,2) DEFAULT 0,
        fair_value_adjustments DECIMAL(15,2) DEFAULT 0,
        other_adjustments DECIMAL(15,2) DEFAULT 0,
        calculation_method VARCHAR(100) DEFAULT 'Proportionate',
        goodwill_method VARCHAR(50) DEFAULT 'Partial',
        status VARCHAR(50) DEFAULT 'Calculated',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        calculated_by VARCHAR(100),
        reviewed_by VARCHAR(100),
        reviewed_at TIMESTAMP
    );

    -- Roll Forward
    CREATE TABLE IF NOT EXISTS roll_forward_entries (
        id SERIAL PRIMARY KEY,
        account_code VARCHAR(100) NOT NULL,
        entity VARCHAR(255) NOT NULL,
        from_period VARCHAR(2) NOT NULL,
        from_year INTEGER NOT NULL,
        to_period VARCHAR(2) NOT NULL,
        to_year INTEGER NOT NULL,
        opening_balance DECIMAL(15,2) NOT NULL,
        movements DECIMAL(15,2) DEFAULT 0,
        closing_balance DECIMAL(15,2) NOT NULL,
        movement_type VARCHAR(100),
        description TEXT,
        status VARCHAR(50) DEFAULT 'Open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100)
    );

    -- Financial Statements
    CREATE TABLE IF NOT EXISTS consolidated_financial_statements (
        id SERIAL PRIMARY KEY,
        statement_type VARCHAR(100) NOT NULL,
        period VARCHAR(2) NOT NULL,
        year INTEGER NOT NULL,
        statement_date TIMESTAMP NOT NULL,
        statement_data JSONB,
        summary_data JSONB,
        status VARCHAR(50) DEFAULT 'Draft',
        version VARCHAR(20) DEFAULT '1.0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        approved_by VARCHAR(100),
        approved_at TIMESTAMP
    );

    -- Assets
    CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        asset_code VARCHAR(50) UNIQUE NOT NULL,
        asset_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        acquisition_date DATE NOT NULL,
        acquisition_cost DECIMAL(15,2) NOT NULL,
        current_value DECIMAL(15,2),
        accumulated_depreciation DECIMAL(15,2) DEFAULT 0,
        net_book_value DECIMAL(15,2),
        useful_life INTEGER NOT NULL,
        depreciation_method VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        updated_by VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS asset_categories (
        id SERIAL PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL,
        description TEXT,
        default_useful_life INTEGER,
        default_depreciation_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_locations (
        id SERIAL PRIMARY KEY,
        location_name VARCHAR(255) NOT NULL,
        address TEXT,
        country VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_maintenance (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL,
        maintenance_date DATE NOT NULL,
        maintenance_type VARCHAR(100),
        description TEXT,
        cost DECIMAL(15,2),
        performed_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_audits (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL,
        audit_date DATE NOT NULL,
        auditor_name VARCHAR(255),
        condition_rating VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS warranty_records (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL,
        warranty_start DATE,
        warranty_end DATE,
        warranty_provider VARCHAR(255),
        warranty_terms TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_users (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        assigned_date DATE,
        return_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Budget & Forecasting
    CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        budget_name VARCHAR(255) NOT NULL,
        budget_version VARCHAR(50) DEFAULT 'v1.0',
        budget_type VARCHAR(50) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        fiscal_year INTEGER NOT NULL,
        total_revenue DECIMAL(20,2) DEFAULT 0,
        total_expenses DECIMAL(20,2) DEFAULT 0,
        total_assets DECIMAL(20,2) DEFAULT 0,
        total_liabilities DECIMAL(20,2) DEFAULT 0,
        net_income DECIMAL(20,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Draft',
        approval_status VARCHAR(50) DEFAULT 'Pending',
        workflow_step VARCHAR(100) DEFAULT 'Creation',
        parent_budget_id INTEGER,
        department_id VARCHAR(100),
        project_id VARCHAR(100),
        description TEXT,
        assumptions JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        approved_by VARCHAR(100),
        approved_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budget_lines (
        id SERIAL PRIMARY KEY,
        budget_id INTEGER NOT NULL,
        account_code VARCHAR(100) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        entity_code VARCHAR(100),
        entity_name VARCHAR(255),
        jan_amount DECIMAL(15,2) DEFAULT 0,
        feb_amount DECIMAL(15,2) DEFAULT 0,
        mar_amount DECIMAL(15,2) DEFAULT 0,
        apr_amount DECIMAL(15,2) DEFAULT 0,
        may_amount DECIMAL(15,2) DEFAULT 0,
        jun_amount DECIMAL(15,2) DEFAULT 0,
        jul_amount DECIMAL(15,2) DEFAULT 0,
        aug_amount DECIMAL(15,2) DEFAULT 0,
        sep_amount DECIMAL(15,2) DEFAULT 0,
        oct_amount DECIMAL(15,2) DEFAULT 0,
        nov_amount DECIMAL(15,2) DEFAULT 0,
        dec_amount DECIMAL(15,2) DEFAULT 0,
        q1_total DECIMAL(15,2) DEFAULT 0,
        q2_total DECIMAL(15,2) DEFAULT 0,
        q3_total DECIMAL(15,2) DEFAULT 0,
        q4_total DECIMAL(15,2) DEFAULT 0,
        annual_total DECIMAL(15,2) DEFAULT 0,
        line_type VARCHAR(50) DEFAULT 'Regular',
        driver_type VARCHAR(100),
        driver_value DECIMAL(15,2),
        formula TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS budget_versions (
        id SERIAL PRIMARY KEY,
        budget_id INTEGER NOT NULL,
        version_number VARCHAR(50) NOT NULL,
        version_name VARCHAR(255) NOT NULL,
        version_type VARCHAR(50) DEFAULT 'Revision',
        changes_summary TEXT,
        changes_details JSONB,
        status VARCHAR(50) DEFAULT 'Draft',
        is_current BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        approved_by VARCHAR(100),
        approved_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forecasts (
        id SERIAL PRIMARY KEY,
        forecast_name VARCHAR(255) NOT NULL,
        forecast_type VARCHAR(50) NOT NULL,
        forecast_method VARCHAR(50) NOT NULL,
        forecast_frequency VARCHAR(50) DEFAULT 'MONTHLY',
        forecast_start_date DATE NOT NULL,
        forecast_end_date DATE NOT NULL,
        forecast_horizon INTEGER DEFAULT 12,
        base_period VARCHAR(50),
        growth_rate DECIMAL(5,2) DEFAULT 0,
        seasonality_factor DECIMAL(5,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Draft',
        accuracy_score DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100)
    );

    -- Custom Axes
    CREATE TABLE IF NOT EXISTS custom_axes (
        id SERIAL PRIMARY KEY,
        axis_id VARCHAR(50) UNIQUE NOT NULL,
        axis_name VARCHAR(255) NOT NULL,
        description TEXT,
        value_type VARCHAR(50) DEFAULT 'text',
        is_active BOOLEAN DEFAULT TRUE,
        is_required BOOLEAN DEFAULT FALSE,
        display_order INTEGER DEFAULT 0,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Backup Management
    CREATE TABLE IF NOT EXISTS backups (
        id SERIAL PRIMARY KEY,
        backup_name VARCHAR(255) NOT NULL,
        backup_type VARCHAR(50) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT,
        backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Completed',
        description TEXT,
        created_by VARCHAR(100),
        restore_count INTEGER DEFAULT 0,
        last_restored TIMESTAMP
    );

    -- Business Tools
    CREATE TABLE IF NOT EXISTS integrations (
        id SERIAL PRIMARY KEY,
        integration_name VARCHAR(255) NOT NULL,
        integration_type VARCHAR(100) NOT NULL,
        api_endpoint VARCHAR(500),
        api_key VARCHAR(500),
        status VARCHAR(50) DEFAULT 'Active',
        last_sync TIMESTAMP,
        sync_frequency VARCHAR(50) DEFAULT 'Daily',
        error_count INTEGER DEFAULT 0,
        last_error TEXT,
        description TEXT,
        configuration JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS workflows (
        id SERIAL PRIMARY KEY,
        workflow_name VARCHAR(255) NOT NULL,
        workflow_type VARCHAR(100) NOT NULL,
        trigger_event VARCHAR(255) NOT NULL,
        actions JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        execution_count INTEGER DEFAULT 0,
        last_executed TIMESTAMP,
        success_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        last_error TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100)
    );

    -- System Settings
    CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'string',
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_entities_code ON entities(entity_code);
    CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(account_code);
    CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type);
    CREATE INDEX IF NOT EXISTS idx_tb_entries_entity_period ON tb_entries(entity_code, period, year);
    CREATE INDEX IF NOT EXISTS idx_tb_entries_account ON tb_entries(account_code);
    CREATE INDEX IF NOT EXISTS idx_ic_transactions_entities ON intercompany_transactions(entity, counterparty);
    CREATE INDEX IF NOT EXISTS idx_ic_transactions_period ON intercompany_transactions(period, year);
    CREATE INDEX IF NOT EXISTS idx_consolidation_journals_period ON consolidation_journals(period, year);
    CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(asset_code);
    CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
    CREATE INDEX IF NOT EXISTS idx_budgets_fiscal_year ON budgets(fiscal_year);
    CREATE INDEX IF NOT EXISTS idx_budget_lines_budget ON budget_lines(budget_id);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_table_record ON audit_trail(table_name, record_id);
    CREATE INDEX IF NOT EXISTS idx_uploads_type_date ON uploads(file_type, upload_date);
    """
