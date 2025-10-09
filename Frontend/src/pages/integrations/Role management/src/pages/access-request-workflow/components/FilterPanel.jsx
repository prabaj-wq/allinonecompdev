import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const FilterPanel = ({ filters, onFiltersChange, onClearFilters, requestStats }) => {
  const statusOptions = [
    { value: 'all', label: 'All Requests', count: requestStats.total },
    { value: 'pending', label: 'Pending', count: requestStats.pending },
    { value: 'approved', label: 'Approved', count: requestStats.approved },
    { value: 'rejected', label: 'Rejected', count: requestStats.rejected },
    { value: 'escalated', label: 'Escalated', count: requestStats.escalated }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities', count: requestStats.total },
    { value: 'critical', label: 'Critical', count: requestStats.critical },
    { value: 'high', label: 'High', count: requestStats.high },
    { value: 'medium', label: 'Medium', count: requestStats.medium },
    { value: 'low', label: 'Low', count: requestStats.low }
  ];

  const departmentOptions = [
    { value: 'all', label: 'All Departments', count: requestStats.total },
    { value: 'Engineering', label: 'Engineering', count: 12 },
    { value: 'Marketing', label: 'Marketing', count: 8 },
    { value: 'Sales', label: 'Sales', count: 15 },
    { value: 'HR', label: 'Human Resources', count: 6 },
    { value: 'Finance', label: 'Finance', count: 9 },
    { value: 'Operations', label: 'Operations', count: 7 }
  ];

  const accessTypeOptions = [
    { value: 'read', label: 'Read Only' },
    { value: 'write', label: 'Read/Write' },
    { value: 'admin', label: 'Administrative' },
    { value: 'temporary', label: 'Temporary Access' }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleAccessTypeChange = (type, checked) => {
    const newAccessTypes = checked
      ? [...filters.accessTypes, type]
      : filters.accessTypes.filter(t => t !== type);
    onFiltersChange({ ...filters, accessTypes: newAccessTypes });
  };

  const hasActiveFilters = () => {
    return filters.status !== 'all' || 
           filters.priority !== 'all' || 
           filters.department !== 'all' || 
           filters.accessTypes.length > 0 ||
           filters.showOverdue ||
           filters.showEscalated;
  };

  return (
    <div className="w-80 h-full glass-container border-r border-border/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Refine your request view
        </p>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status Filter */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
            <Icon name="CheckCircle" size={16} className="mr-2" />
            Status
          </h4>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={filters.status === option.value}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-4 h-4 text-primary bg-input border-border focus:ring-primary/50"
                  />
                  <span className="text-sm text-foreground">{option.label}</span>
                </div>
                <span className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded-full">
                  {option.count}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
            <Icon name="AlertTriangle" size={16} className="mr-2" />
            Priority
          </h4>
          <div className="space-y-2">
            {priorityOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="priority"
                    value={option.value}
                    checked={filters.priority === option.value}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-4 h-4 text-primary bg-input border-border focus:ring-primary/50"
                  />
                  <span className="text-sm text-foreground">{option.label}</span>
                </div>
                <span className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded-full">
                  {option.count}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Department Filter */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
            <Icon name="Building" size={16} className="mr-2" />
            Department
          </h4>
          <div className="space-y-2">
            {departmentOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="department"
                    value={option.value}
                    checked={filters.department === option.value}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="w-4 h-4 text-primary bg-input border-border focus:ring-primary/50"
                  />
                  <span className="text-sm text-foreground">{option.label}</span>
                </div>
                <span className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded-full">
                  {option.count}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Access Type Filter */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
            <Icon name="Key" size={16} className="mr-2" />
            Access Type
          </h4>
          <div className="space-y-2">
            {accessTypeOptions.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={filters.accessTypes.includes(option.value)}
                onChange={(e) => handleAccessTypeChange(option.value, e.target.checked)}
                className="p-2 rounded-lg hover:bg-white/5"
              />
            ))}
          </div>
        </div>

        {/* Special Filters */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
            <Icon name="Filter" size={16} className="mr-2" />
            Special Filters
          </h4>
          <div className="space-y-2">
            <Checkbox
              label="Show Overdue Only"
              checked={filters.showOverdue}
              onChange={(e) => handleFilterChange('showOverdue', e.target.checked)}
              className="p-2 rounded-lg hover:bg-white/5"
            />
            <Checkbox
              label="Show Escalated Only"
              checked={filters.showEscalated}
              onChange={(e) => handleFilterChange('showEscalated', e.target.checked)}
              className="p-2 rounded-lg hover:bg-white/5"
            />
            <Checkbox
              label="My Approvals Only"
              checked={filters.myApprovalsOnly}
              onChange={(e) => handleFilterChange('myApprovalsOnly', e.target.checked)}
              className="p-2 rounded-lg hover:bg-white/5"
            />
          </div>
        </div>

        {/* Date Range */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
            <Icon name="Calendar" size={16} className="mr-2" />
            Date Range
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full p-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full p-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground text-center">
          <Icon name="Info" size={12} className="inline mr-1" />
          Filters apply to all views
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;