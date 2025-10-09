import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const FilterBar = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  roleCount 
}) => {
  const roleTypeOptions = [
    { value: 'all', label: 'All Role Types' },
    { value: 'elevated', label: 'Elevated Roles' },
    { value: 'standard', label: 'Standard Roles' },
    { value: 'view-only', label: 'View-Only Roles' }
  ];

  const permissionLevelOptions = [
    { value: 'all', label: 'All Permission Levels' },
    { value: 'high', label: 'High Permissions (Write Access)' },
    { value: 'medium', label: 'Medium Permissions (Read Access)' },
    { value: 'low', label: 'Low Permissions (Limited Access)' }
  ];

  const sortOptions = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'users-desc', label: 'Most Users' },
    { value: 'users-asc', label: 'Least Users' },
    { value: 'modified-desc', label: 'Recently Modified' },
    { value: 'modified-asc', label: 'Oldest Modified' }
  ];

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.roleType !== 'all') count++;
    if (filters.permissionLevel !== 'all') count++;
    if (filters.showTemplatesOnly) count++;
    if (filters.showActiveOnly) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="glass-container p-4 rounded-xl border border-border/50 mb-6">
      {/* Top Row - Search and Quick Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Search roles by name or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Role Type Filter */}
          <Select
            options={roleTypeOptions}
            value={filters.roleType}
            onChange={(value) => handleFilterChange('roleType', value)}
            className="w-48"
          />

          {/* Permission Level Filter */}
          <Select
            options={permissionLevelOptions}
            value={filters.permissionLevel}
            onChange={(value) => handleFilterChange('permissionLevel', value)}
            className="w-56"
          />
        </div>

        {/* Results Count and Clear */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            {roleCount} role{roleCount !== 1 ? 's' : ''} found
          </div>
          
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon name="X" size={16} className="mr-2" />
              Clear Filters ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Row - Advanced Filters and Sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Toggle Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={filters.showTemplatesOnly}
                onChange={(e) => handleFilterChange('showTemplatesOnly', e.target.checked)}
              />
              <label className="text-sm text-foreground">Templates Only</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={filters.showActiveOnly}
                onChange={(e) => handleFilterChange('showActiveOnly', e.target.checked)}
              />
              <label className="text-sm text-foreground">Active Roles Only</label>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center space-x-2">
            <Icon name="Calendar" size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Modified:</span>
            <select
              className="px-2 py-1 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <Icon name="ArrowUpDown" size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select
            options={sortOptions}
            value={filters.sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
            className="w-48"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            
            {filters.search && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-primary/20 rounded-full">
                <Icon name="Search" size={12} className="text-primary" />
                <span className="text-xs text-primary">"{filters.search}"</span>
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="text-primary hover:text-primary/80"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}

            {filters.roleType !== 'all' && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 rounded-full">
                <Icon name="Shield" size={12} className="text-blue-400" />
                <span className="text-xs text-blue-400 capitalize">{filters.roleType}</span>
                <button
                  onClick={() => handleFilterChange('roleType', 'all')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}

            {filters.permissionLevel !== 'all' && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-500/20 rounded-full">
                <Icon name="Key" size={12} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 capitalize">{filters.permissionLevel}</span>
                <button
                  onClick={() => handleFilterChange('permissionLevel', 'all')}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}

            {filters.showTemplatesOnly && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-warning/20 rounded-full">
                <Icon name="Bookmark" size={12} className="text-warning" />
                <span className="text-xs text-warning">Templates</span>
                <button
                  onClick={() => handleFilterChange('showTemplatesOnly', false)}
                  className="text-warning hover:text-warning/80"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;