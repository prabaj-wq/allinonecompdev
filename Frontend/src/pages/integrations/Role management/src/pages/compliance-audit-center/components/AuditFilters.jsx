import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const AuditFilters = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    department: '',
    system: '',
    framework: '',
    searchQuery: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'lastyear', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'it', label: 'Information Technology' },
    { value: 'operations', label: 'Operations' },
    { value: 'sales', label: 'Sales & Marketing' },
    { value: 'legal', label: 'Legal & Compliance' }
  ];

  const systemOptions = [
    { value: '', label: 'All Systems' },
    { value: 'erp', label: 'ERP System' },
    { value: 'crm', label: 'CRM Platform' },
    { value: 'hr', label: 'HR Management' },
    { value: 'financial', label: 'Financial Systems' },
    { value: 'database', label: 'Database Access' },
    { value: 'cloud', label: 'Cloud Services' }
  ];

  const frameworkOptions = [
    { value: '', label: 'All Frameworks' },
    { value: 'sox', label: 'SOX Compliance' },
    { value: 'gdpr', label: 'GDPR' },
    { value: 'hipaa', label: 'HIPAA' },
    { value: 'iso27001', label: 'ISO 27001' },
    { value: 'custom', label: 'Custom Framework' }
  ];

  const savedTemplates = [
    { id: 1, name: 'Monthly SOX Review', framework: 'sox', department: 'finance' },
    { id: 2, name: 'GDPR Data Access Audit', framework: 'gdpr', department: '' },
    { id: 3, name: 'IT Security Assessment', framework: 'iso27001', department: 'it' },
    { id: 4, name: 'Healthcare Compliance', framework: 'hipaa', department: 'operations' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleTemplateLoad = (template) => {
    const newFilters = {
      ...filters,
      framework: template.framework,
      department: template.department
    };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      dateRange: 'last30days',
      department: '',
      system: '',
      framework: '',
      searchQuery: ''
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  return (
    <div className="glass-container p-6 border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Icon name="Filter" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Audit Filters</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            iconName="X"
            iconPosition="left"
          >
            Clear All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
            iconPosition="right"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Input
          type="search"
          placeholder="Search audits..."
          value={filters.searchQuery}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          className="w-full"
        />

        <Select
          options={dateRangeOptions}
          value={filters.dateRange}
          onChange={(value) => handleFilterChange('dateRange', value)}
          placeholder="Select date range"
        />

        <Select
          options={departmentOptions}
          value={filters.department}
          onChange={(value) => handleFilterChange('department', value)}
          placeholder="Select department"
        />

        <Select
          options={frameworkOptions}
          value={filters.framework}
          onChange={(value) => handleFilterChange('framework', value)}
          placeholder="Select framework"
        />
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="System Filter"
              options={systemOptions}
              value={filters.system}
              onChange={(value) => handleFilterChange('system', value)}
              placeholder="Select system"
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Custom Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  placeholder="Start date"
                  disabled={filters.dateRange !== 'custom'}
                />
                <Input
                  type="date"
                  placeholder="End date"
                  disabled={filters.dateRange !== 'custom'}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Icon name="Bookmark" size={16} className="text-primary" />
              <span>Saved Audit Templates</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {savedTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateLoad(template)}
                  className="justify-start text-left"
                  iconName="Play"
                  iconPosition="left"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditFilters;