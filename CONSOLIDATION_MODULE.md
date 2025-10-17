# IFRS Consolidation Module - Complete Implementation Guide

## Overview

The IFRS Consolidation Module is a comprehensive, production-ready consolidation system built into the All in One Company platform. It provides enterprise-grade functionality for managing complex consolidation processes with full IFRS compliance.

## Architecture

### Backend (Python/FastAPI)
- **File**: `Backend/routers/consolidation.py`
- **API Prefix**: `/api/consolidation`
- **Database**: PostgreSQL with company-specific databases
- **Authentication**: JWT-based with role-based access control

### Frontend (React/TypeScript)
- **Main Component**: `Frontend/src/pages/Process.jsx`
- **Canvas Component**: `Frontend/src/components/ConsolidationCanvas.jsx`
- **Settings Component**: `Frontend/src/components/ConsolidationSettings.jsx`
- **Integration**: Seamlessly integrated with existing Process Management tab

## Database Schema

### Core Tables

#### consolidation_entities
Manages consolidation entity hierarchies with ownership percentages and measurement methods.
- `id`: Primary key
- `entity_code`, `entity_name`: Entity identifiers
- `parent_entity_code`: Parent entity reference
- `ownership_percentage`: Ownership stake (0-100)
- `measurement_method`: 'proportionate' or 'equity'
- `nci_measurement`: Non-Controlling Interest method ('fair_value' or 'proportionate')
- `functional_currency`, `reporting_currency`: Currency settings
- `acquisition_date`: For goodwill calculation
- `status`: 'active' or 'inactive'

#### consolidation_scenarios
Version control for consolidation runs, supporting multiple scenarios per fiscal year.
- `id`: Primary key
- `scenario_key`: Unique identifier
- `name`, `description`: User-friendly names
- `scenario_type`: 'actual', 'forecast', or 'budget'
- `fiscal_year`: Year identifier
- `parent_scenario_id`: For scenario branching/versions
- `status`: 'draft', 'in_progress', 'completed'
- `settings`: JSONB for custom configuration

#### consolidation_processes
Defines individual consolidation workflows.
- `id`: Primary key
- `process_key`: Unique identifier
- `name`, `description`: Process details
- `scenario_id`: Links to consolidation_scenarios
- `process_type`: 'consolidation' or similar
- `status`: 'draft', 'running', 'completed'
- `canvas_config`: JSONB storing workflow layout
- `rules`: JSONB for consolidation rules
- `custom_fields`: JSONB for process-specific fields
- `restrictions`: JSONB for account/entity restrictions
- `audit_enabled`: Boolean for audit trail

#### consolidation_nodes
Individual workflow steps/nodes in the consolidation process.
- `id`: Primary key
- `process_id`: References consolidation_processes
- `node_key`: Unique within process
- `node_type`: Type of consolidation operation
- `position_x`, `position_y`: Canvas coordinates
- `config`: JSONB with node-specific configuration
- `execution_order`: Sequence in workflow
- `enabled`: Boolean to toggle node execution

#### consolidation_node_mappings
Defines connections between nodes (data flow).
- `source_node_id`, `target_node_id`: Node references
- `mapping_key`: Identifies the mapped data
- `mapping_config`: JSONB with transformation rules

#### consolidation_periods
Fiscal periods within a consolidation process.
- `period_code`: e.g., 'Q1', 'January'
- `period_name`: User-friendly name
- `start_date`, `end_date`: Period boundaries
- `is_open`: Whether period accepts updates

#### consolidation_rules
Business rules for consolidation logic.
- `rule_type`: Type of rule (fx_translation, intercompany, nci_calculation, etc.)
- `rule_name`, `description`: Rule details
- `rule_logic`: JSONB with rule definition
- `priority`: Execution order
- `enabled`: Boolean

#### consolidation_fx_rates
Foreign exchange rates for currency translation.
- `from_currency`, `to_currency`: Currency pair
- `rate_type`: 'closing', 'average', 'historical'
- `rate_date`: Effective date
- `rate_value`: Exchange rate
- `average_rate`: Average rate for the period

#### consolidation_intercompany
Tracks intercompany transactions for elimination.
- `from_entity_code`, `to_entity_code`: Parties
- `account_code`: GL account
- `amount`: Transaction amount
- `currency`: Transaction currency
- `elimination_method`: 'full' or 'proportionate'

#### consolidation_fair_values
Fair value adjustments at acquisition.
- `acquired_entity_code`: Acquired subsidiary
- `asset_code`: Asset being adjusted
- `fair_value`: Fair value assigned
- `carrying_amount`: Book value
- `adjustment`: Fair value adjustment
- `useful_life`: Asset life for depreciation
- `goodwill_amount`: Residual goodwill
- `impairment_amount`: Impairment recorded

#### consolidation_nci
Non-Controlling Interest calculations.
- `entity_code`: Subsidiary
- `period`: Period code
- `ownership_percentage`: NCI percentage
- `entity_profit`: Subsidiary profit
- `nci_share_profit`: NCI share of profit
- `nci_equity_opening`, `nci_equity_closing`: NCI equity

#### consolidation_oci_items
Other Comprehensive Income items.
- `oci_type`: Type of OCI (revaluation, FX, actuarial, etc.)
- `opening_balance`, `current_period`: Balance changes
- `reclassifications`: Reclassified amounts
- `tax_effect`: Deferred tax
- `closing_balance`: End balance

#### consolidation_staging
Temporary staging area for simulation runs.
- `process_id`, `scenario_id`, `node_id`: References
- `data_type`: Type of data
- `entity_code`, `account_code`, `period`: Dimensions
- `amount`: Calculated amount
- `calculation_method`: How it was calculated
- `status`: 'staged' or 'committed'

#### consolidation_audit_trail
Complete audit history of all changes.
- `action`: Operation performed
- `entity_type`: Table modified
- `old_value`, `new_value`: JSONB change tracking
- `user_id`: User making change

## Consolidation Node Types

### 1. Profit/Loss Calculation
**Key Features**:
- Calculate entity profit across all segments
- Gross margin computation
- Operating profit analysis
- Inputs: Entity selection, account ranges, period
- Outputs: Net profit, retained earnings impact

### 2. Non-Controlling Interest (NCI) Handling
**Key Features**:
- Measure NCI at fair value or proportionate share
- Calculate NCI share of profit
- Allocate equity between parent and NCI
- Support for step acquisitions
- Inputs: Ownership %, subsidiary profit, FV adjustments
- Outputs: NCI profit, NCI equity components

### 3. Retained Earnings Rollforward
**Key Features**:
- Opening balance + Profit/Loss - Dividends ± Adjustments = Closing
- Prior period error tracking
- Dividend payment recording
- Adjustment accommodation (policy changes, restatements)
- Inputs: Opening RE, current profit, adjustments
- Outputs: Closing RE, rollforward schedule

### 4. FX Translation
**Key Features**:
- Monetary/Non-monetary distinction
- Translation method selection (current rate or historical rate)
- Currency Translation Adjustment (CTA) calculation
- Re-measurement for functional currency changes
- Inputs: Entity, balances, FX rates, translation rules
- Outputs: Translated balances, CTA entries

### 5. Intercompany Eliminations
**Key Features**:
- Eliminate reciprocal transactions
- Unrealized profit in inventory elimination
- Intercompany loan/receivable netting
- Multi-currency matching
- Inputs: IC data, elimination rules
- Outputs: Elimination journals

### 6. Fair Value Adjustments
**Key Features**:
- Goodwill calculation
- Fair value allocation
- Depreciation of fair value differences
- Impairment testing and recognition
- Inputs: Acquisition data, fair values
- Outputs: Goodwill entries, depreciation schedule

### 7. Deferred Tax
**Key Features**:
- Deferred tax on fair value adjustments
- Tax on depreciation differences
- Deferred tax on elimination entries
- Tax rate configuration
- Inputs: Adjustments, tax rates
- Outputs: Deferred tax entries

### 8. Opening Balance Adjustments
**Key Features**:
- Set up opening retained earnings
- Record fair value adjustments opening balances
- New entity initialization
- Inputs: Prior period data
- Outputs: Opening balance entries

### 9. OCI Items
**Key Features**:
- Capture revaluation surplus changes
- Foreign currency translation adjustments
- Actuarial gains/losses
- Fair value adjustments to equity
- Inputs: OCI transactions
- Outputs: OCI closing positions

### 10. Statement of Changes in Equity
**Key Features**:
- Automatic SCE generation
- Share capital tracking
- Reserves reconciliation
- NCI changes
- OCI integration
- Inputs: Opening equity, all changes
- Outputs: Complete SCE

## API Endpoints

### Entities Management
- `POST /consolidation/entities/create` - Create consolidation entity
- `GET /consolidation/entities/list` - List all entities

### Scenarios Management
- `POST /consolidation/scenarios/create` - Create scenario
- `GET /consolidation/scenarios/list` - List scenarios by fiscal year

### Process Management
- `POST /consolidation/processes/create` - Create consolidation process
- `GET /consolidation/processes/list` - List processes
- `GET /consolidation/processes/{id}/details` - Get process with nodes/rules

### Node Management
- `POST /consolidation/processes/{id}/nodes/add` - Add workflow node
- `GET /consolidation/processes/{id}/nodes/list` - List process nodes

### Rules Management
- `POST /consolidation/processes/{id}/rules/add` - Add consolidation rule
- `GET /consolidation/processes/{id}/rules/list` - List process rules

### FX Rates
- `POST /consolidation/fx-rates/set` - Set FX rate
- `GET /consolidation/fx-rates/get` - Get FX rates for scenario

## Frontend Features

### Consolidation View
Access via **"Consolidation"** button on Process Catalogue page.

#### Scenario Management
- Create new consolidation scenarios
- Select scenarios by fiscal year
- Branching scenarios for what-if analysis

#### Process Creation
- Name and describe consolidation process
- Select scenario
- Automatic linking to entities and rules

#### Workflow Canvas
- **Drag-and-drop** node placement
- **10+ pre-configured** consolidation nodes
- **Visual workflow** with node connections
- **Node editing**: Title, description, enabled/disabled status
- **Execution ordering**: Automatic or manual
- **Input/Output mapping**: Visual indication of data flow

#### Settings Panel
- **Consolidation Rules**: Add, edit, delete rules
  - FX translation rules
  - Intercompany rules
  - NCI calculation rules
  - Elimination rules
  - Allocation rules
  - Rounding rules
  - Validation rules

- **Entities**: Define consolidation structure
  - Entity codes and names
  - Parent entity relationships
  - Ownership percentages
  - NCI measurement methods
  - Functional/reporting currencies

- **FX Rates**: Manage exchange rates
  - Close rates
  - Average rates
  - Historical rates
  - Date-specific rates

- **Validation**: Real-time validation checks
  - Balance equation verification
  - Intercompany net-to-zero
  - Entity consolidation coverage
  - FX rate completeness
  - Ownership percentage validity

## Integration with Existing Modules

### Process Module
- Consolidation processes appear in Catalogue
- Each consolidation process is a separate Process definition
- Custom fields support for process-specific data
- Workflow restrictions by account/entity

### Accounts Module
- Full integration with account hierarchy
- Account restrictions in consolidation process
- Account-specific rules and eliminations

### Entities Module
- Entity hierarchy support
- Multi-level consolidation
- Parent/subsidiary relationships

### Custom Axes
- Custom dimension support in consolidation
- Dimension-specific rules
- Dimension-based filtering

## Customization Features

### Custom Fields (Per Process)
- Add any field type (text, number, date, select, dropdown)
- Field validation rules
- Default values
- Required field marking
- SQL-driven field options

### Restrictions
- **Account Restrictions**: Limit process to specific accounts
  - By individual account code
  - By account hierarchy node
- **Entity Restrictions**: Limit process to specific entities
  - By individual entity code
  - By entity hierarchy node

### Rules Configuration
- Define custom consolidation rules
- Priority-based execution
- Enable/disable rules
- Rule-specific logic via JSONB configuration

### Workflow Customization
- Add/remove nodes
- Reorder execution sequence
- Configure node inputs/outputs
- Node-specific settings

## Security & Permissions

### Authentication
- JWT token-based authentication
- Company-specific database isolation
- User role-based access control

### Authorization
- Page-level permissions for consolidation module
- Process-level restrictions
- Entity-level filtering
- Account-level restrictions

### Audit Trail
- Complete audit history
- Track all changes (create, update, delete)
- User attribution
- Timestamp recording
- Old/new value comparison

## Usage Workflow

### Step 1: Set Up Consolidation Structure
1. Navigate to Consolidation module
2. Create consolidation scenario (fiscal year, type)
3. Define consolidation entities (parent, subsidiaries, ownership %)
4. Set up NCI measurement methods
5. Configure FX rates for translation

### Step 2: Design Consolidation Process
1. Create new consolidation process
2. Link to scenario
3. Name and describe process
4. Set up custom fields if needed
5. Configure account/entity restrictions

### Step 3: Build Workflow Canvas
1. Drag nodes from library to canvas
2. Configure each node:
   - Set node-specific parameters
   - Define inputs/outputs
   - Enable/disable as needed
3. Order nodes for proper execution sequence
4. Connect nodes to show data flow

### Step 4: Define Business Rules
1. Add FX translation rules (method, rates)
2. Set up intercompany elimination rules
3. Configure NCI calculation rules
4. Add validation rules
5. Set rule priorities

### Step 5: Configure Settings
1. Define consolidation entities and hierarchy
2. Set ownership percentages
3. Configure NCI measurement methods
4. Input FX rates
5. Set up any custom rules

### Step 6: Test & Simulate
1. Run process in simulation mode
2. Review staged calculations
3. Validate results against expectations
4. Adjust rules/nodes as needed
5. Make manual overrides if required

### Step 7: Execute & Publish
1. Finalize all settings
2. Execute consolidation process
3. Review consolidation output
4. Approve and publish
5. Generate consolidation reports

## Advanced Features

### Scenario Branching
- Create child scenarios from parent
- What-if analysis
- Multiple consolidation versions
- Version comparison

### Simulation Mode
- Test consolidation without committing
- Staging table isolation
- Rollback capability
- Preview reports

### Multi-Period Support
- Period definition per process
- Comparative consolidations
- Opening/closing period tracking
- Period-specific rules

### Validation Framework
- Pre-execution validation
- Real-time balance checking
- Exception alerts
- Correction workflow

## Performance Considerations

### Database Optimization
- Indexed foreign keys
- Indexed search columns
- Aggregation tables for reporting
- Partition support for large datasets

### Workflow Optimization
- Node parallelization potential
- Lazy calculation
- Cache staging results
- Batch processing

### API Performance
- Connection pooling
- Query optimization
- Pagination support
- Async operations

## Troubleshooting

### Common Issues

#### Scenario Not Loading
- Check scenario status
- Verify fiscal year
- Ensure user permissions

#### Process Creation Fails
- Verify scenario is selected
- Check process name
- Validate database connectivity

#### Nodes Not Appearing
- Refresh canvas
- Check node types available
- Verify process is created
- Clear browser cache

#### FX Rates Not Applied
- Verify rates are set
- Check rate date matches
- Confirm scenario linkage
- Validate currency codes

### Debug Mode
- Check browser console for errors
- Monitor API calls in network tab
- Review backend logs
- Check database audit trail

## Best Practices

1. **Naming Conventions**
   - Use clear, descriptive scenario names
   - Include fiscal year in scenario name
   - Use standardized entity codes
   - Document rule purposes

2. **Process Design**
   - Start with simple, well-documented process
   - Add complexity incrementally
   - Test rules individually
   - Document exceptions and overrides

3. **Data Quality**
   - Validate input data before consolidation
   - Reconcile account balances
   - Verify entity ownership totals
   - Check FX rate coverage

4. **Change Management**
   - Use scenario versioning for changes
   - Document rule modifications
   - Test changes in draft scenarios
   - Keep audit trail for compliance

5. **Performance**
   - Archive completed scenarios
   - Limit rows in staging tables
   - Index frequently filtered columns
   - Monitor API response times

## Examples

### Example 1: Basic Parent-Subsidiary Consolidation
1. Create scenario "2025 Q4 Consolidation"
2. Add Parent Company (100% ownership)
3. Add Subsidiary (80% ownership)
4. Create process "Q4 Consolidation"
5. Add nodes: Profit/Loss → NCI Handling → Retained Earnings → FX Translation
6. Configure 80% NCI calculation rule
7. Run process
8. Review consolidated results

### Example 2: Multi-Currency Consolidation
1. Create scenario with foreign subsidiary
2. Define entities with different functional currencies
3. Input closing FX rates
4. Create process "Multi-Currency Consolidation"
5. Add FX Translation node with appropriate rates
6. Configure NCI rules
7. Test with sample transactions
8. Execute and validate CTA calculation

### Example 3: Complex Eliminations
1. Set up 3+ entities with intercompany transactions
2. Define elimination rules for:
   - Intercompany sales
   - Intercompany loans
   - Unrealized profit in inventory
3. Configure process with Intercompany Elimination node
4. Test elimination matching
5. Verify net-to-zero consolidation

## Support & Documentation

- API Documentation: `/api/docs` (Swagger UI)
- Database Schema: See schema section above
- Component Documentation: See file headers
- Examples: See examples section above

## Version History

- **v1.0.0** - Initial release with 10 consolidation node types
  - Full IFRS consolidation support
  - Customizable workflow canvas
  - Comprehensive rule engine
  - Complete audit trail
  - Multi-scenario support

## License & Compliance

- IFRS 10, IFRS 11 compliant
- GAAP support ready
- SOX compliance ready
- GDPR data handling
- Audit trail for regulatory requirements

---

**Last Updated**: October 2025
**Status**: Production Ready
**Maintenance**: Active Development