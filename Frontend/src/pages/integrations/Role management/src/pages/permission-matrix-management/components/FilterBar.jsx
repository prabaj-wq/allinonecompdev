import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const FilterBar = ({ 
  searchTerm, 
  onSearchChange, 
  filters, 
  onFilterChange, 
  onBulkAction,
  selectedRoles,
  onExport,
  onSave
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [savedFilters, setSavedFilters] = useState([
    { id: 1, name: 'Elevated Roles Only', active: false },
    { id: 2, name: 'Write Access Audit', active: false },
    { id: 3, name: 'Standard Users', active: false }
  ]);

  const handleSavedFilterToggle = (filterId) => {
    setSavedFilters(prev => prev.map(filter => 
      filter.id === filterId ? { ...filter, active: !filter.active } : filter
    ));
  };

  const bulkActions = [
    { id: 'grant-read', label: 'Grant Read Access', icon: 'Eye' },
    { id: 'grant-write', label: 'Grant Write Access', icon: 'Edit' },
    { id: 'revoke-all', label: 'Revoke All Access', icon: 'X' },
    { id: 'duplicate', label: 'Duplicate Permissions', icon: 'Copy' }
  ];

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="glass-container border border-border/50 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Icon 
                name="Search" 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                type="search"
                placeholder="Search roles, modules, or permissions..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Role Type Filters */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.showElevated}
                onChange={(e) => onFilterChange('showElevated', e.target.checked)}
                className="w-4 h-4 rounded border-border/50 bg-input text-primary focus:ring-primary"
              />
              <span className="text-foreground">Elevated Roles</span>
            </label>
            
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.showStandard}
                onChange={(e) => onFilterChange('showStandard', e.target.checked)}
                className="w-4 h-4 rounded border-border/50 bg-input text-primary focus:ring-primary"
              />
              <span className="text-foreground">Standard Roles</span>
            </label>
            
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.showViewOnly}
                onChange={(e) => onFilterChange('showViewOnly', e.target.checked)}
                className="w-4 h-4 rounded border-border/50 bg-input text-primary focus:ring-primary"
              />
              <span className="text-foreground">View Only</span>
            </label>
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            iconName={showAdvancedFilters ? "ChevronUp" : "ChevronDown"}
            iconPosition="right"
          >
            Advanced
          </Button>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              iconName="Download"
              iconPosition="left"
            >
              Export
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={onSave}
              iconName="Save"
              iconPosition="left"
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Saved Filter Presets */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Saved Filters
                </label>
                <div className="space-y-2">
                  {savedFilters.map((filter) => (
                    <label key={filter.id} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filter.active}
                        onChange={() => handleSavedFilterToggle(filter.id)}
                        className="w-4 h-4 rounded border-border/50 bg-input text-primary focus:ring-primary"
                      />
                      <span className="text-muted-foreground">{filter.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Permission Level Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Permission Levels
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.showNone}
                      onChange={(e) => onFilterChange('showNone', e.target.checked)}
                      className="w-4 h-4 rounded border-border/50 bg-input text-primary focus:ring-primary"
                    />
                    <span className="text-red-400">No Access</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.showRead}
                      onChange={(e) => onFilterChange('showRead', e.target.checked)}
                      className="w-4 h-4 rounded border-border/50 bg-input text-primary focus:ring-primary"
                    />
                    <span className="text-blue-400">Read Access</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.showWrite}
                      onChange={(e) => onFilterChange('showWrite', e.target.checked)}
                      className="w-4 h-4 rounded border-border/50 bg-input text-primary focus:ring-primary"
                    />
                    <span className="text-emerald-400">Write Access</span>
                  </label>
                </div>
              </div>

              {/* Module Categories */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Module Categories
                </label>
                <div className="space-y-2">
                  {['Core', 'Financial', 'HR', 'Security', 'Analytics'].map((category) => (
                    <label key={category} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.categories?.includes(category)}
                        onChange={(e) => {
                          const categories = filters.categories || [];
                          if (e.target.checked) {
                            onFilterChange('categories', [...categories, category]);
                          } else {
                            onFilterChange('categories', categories.filter(c => c !== category));
                          }
                        }}
                        className="w-4 h-4 rounded border-border/50 bg-input text-primary focus:ring-primary"
                      />
                      <span className="text-muted-foreground">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedRoles.length > 0 && (
        <div className="glass-container border border-primary/30 rounded-xl p-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon name="CheckSquare" size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {bulkActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction(action.id)}
                  iconName={action.icon}
                  iconPosition="left"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;