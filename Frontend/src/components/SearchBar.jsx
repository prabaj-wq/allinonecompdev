import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, FileText, Database, HelpCircle, Zap } from 'lucide-react';
import { SearchEngine } from '../data/searchData';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const navigate = useNavigate();
  const searchEngine = useRef(new SearchEngine());

  // Handle search input
  const handleSearch = (value) => {
    setQuery(value);
    if (value.length >= 2) {
      const searchResults = searchEngine.current.search(value, 8);
      setResults(searchResults);
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result) => {
    if (result.path) {
      navigate(result.path);
    }
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
  };

  // Get icon for result type
  const getResultIcon = (type) => {
    switch (type) {
      case 'module':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'integration':
        return <Database className="h-4 w-4 text-green-500" />;
      case 'feature':
        return <Zap className="h-4 w-4 text-purple-500" />;
      case 'faq':
        return <HelpCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get result type label
  const getResultTypeLabel = (type) => {
    switch (type) {
      case 'module':
        return 'Module';
      case 'integration':
        return 'Integration';
      case 'feature':
        return 'Feature';
      case 'faq':
        return 'Help';
      default:
        return 'Result';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative flex flex-1" ref={searchRef}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        className="block h-full w-full border-0 py-0 pl-12 pr-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 sm:text-sm bg-transparent"
        placeholder="Search consolidation tools..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) {
            setIsOpen(true);
          }
        }}
      />

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-y-auto">
          <div ref={resultsRef} className="py-2">
            {results.map((result, index) => (
              <div
                key={`${result.type}-${result.name || result.question}-${index}`}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {result.name || result.question}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {getResultTypeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {result.description || result.answer}
                    </p>
                    {result.tabs && result.tabs.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Available tabs:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.tabs.slice(0, 3).map((tab, tabIndex) => (
                            <span
                              key={tabIndex}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            >
                              {tab}
                            </span>
                          ))}
                          {result.tabs.length > 3 && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              +{result.tabs.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {result.hierarchicalPath && (
                      <div className="mt-1 flex items-center text-xs text-slate-400 dark:text-slate-500">
                        <ArrowRight className="h-3 w-3 mr-1" />
                        {result.hierarchicalPath}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer with search tips */}
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-xs">↑↓</kbd> to navigate, 
              <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-xs ml-1">Enter</kbd> to select, 
              <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-xs ml-1">Esc</kbd> to close
            </p>
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50">
          <div className="px-4 py-6 text-center">
            <Search className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No results found for "{query}"
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Try searching for: trial balance, consolidation, IFRS, or ETL
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
