import React, { useState, useEffect } from 'react'
import { 
  X, 
  Calculator, 
  Calculator as FunctionIcon, 
  Plus, 
  Minus, 
  Divide, 
  X as Multiply,
  Equal,
  Hash,
  RotateCcw,
  Percent,
  DollarSign,
  Calendar,
  User,
  Database,
  Link,
  Check,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Zap
} from 'lucide-react'

const FormulaEditor = ({ isOpen, onClose, onSave, initialFormula = '', selectedCell = null }) => {
  const [formula, setFormula] = useState(initialFormula)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [showFunctions, setShowFunctions] = useState(false)
  const [showReferences, setShowReferences] = useState(false)

  useEffect(() => {
    setFormula(initialFormula)
  }, [initialFormula])

  useEffect(() => {
    // Preview the formula result
    try {
      if (formula.trim()) {
        // This would integrate with HyperFormula for real preview
        setPreview('Preview: ' + formula)
        setError('')
      } else {
        setPreview('')
        setError('')
      }
    } catch (err) {
      setError('Invalid formula syntax')
      setPreview('')
    }
  }, [formula])

  const handleSave = () => {
    if (formula.trim()) {
      onSave(formula)
      onClose()
    }
  }

  const insertFunction = (func) => {
    const cursorPos = document.getElementById('formula-input')?.selectionStart || formula.length
    const newFormula = formula.slice(0, cursorPos) + func + formula.slice(cursorPos)
    setFormula(newFormula)
  }

  const insertReference = (ref) => {
    const cursorPos = document.getElementById('formula-input')?.selectionStart || formula.length
    const newFormula = formula.slice(0, cursorPos) + ref + formula.slice(cursorPos)
    setFormula(newFormula)
  }

  const commonFunctions = [
    { name: 'SUM', description: 'Sum of values', example: 'SUM(A1:A10)' },
    { name: 'AVERAGE', description: 'Average of values', example: 'AVERAGE(A1:A10)' },
    { name: 'COUNT', description: 'Count of values', example: 'COUNT(A1:A10)' },
    { name: 'MAX', description: 'Maximum value', example: 'MAX(A1:A10)' },
    { name: 'MIN', description: 'Minimum value', example: 'MIN(A1:A10)' },
    { name: 'IF', description: 'Conditional logic', example: 'IF(A1>0, "Positive", "Negative")' },
    { name: 'VLOOKUP', description: 'Vertical lookup', example: 'VLOOKUP(A1, B1:C10, 2, FALSE)' },
    { name: 'HLOOKUP', description: 'Horizontal lookup', example: 'HLOOKUP(A1, B1:J2, 2, FALSE)' },
    { name: 'CONCATENATE', description: 'Join text', example: 'CONCATENATE(A1, " ", B1)' },
    { name: 'ROUND', description: 'Round number', example: 'ROUND(A1, 2)' },
    { name: 'ABS', description: 'Absolute value', example: 'ABS(A1)' },
    { name: 'SQRT', description: 'Square root', example: 'SQRT(A1)' }
  ]

  const operators = [
    { symbol: '+', name: 'Add' },
    { symbol: '-', name: 'Subtract' },
    { symbol: '*', name: 'Multiply' },
    { symbol: '/', name: 'Divide' },
    { symbol: '^', name: 'Power' },
    { symbol: '%', name: 'Percentage' },
    { symbol: '=', name: 'Equal' },
    { symbol: '>', name: 'Greater than' },
    { symbol: '<', name: 'Less than' },
    { symbol: '>=', name: 'Greater or equal' },
    { symbol: '<=', name: 'Less or equal' },
    { symbol: '<>', name: 'Not equal' }
  ]

  const cellReferences = [
    { ref: 'A1', description: 'Current cell' },
    { ref: 'B1', description: 'Next column' },
    { ref: 'A2', description: 'Next row' },
    { ref: 'A1:A10', description: 'Range A1 to A10' },
    { ref: 'A1:Z1', description: 'Row range' },
    { ref: 'A:A', description: 'Entire column A' },
    { ref: '1:1', description: 'Entire row 1' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Calculator className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Formula Editor
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCell ? `Editing formula for cell ${selectedCell.row},${selectedCell.col}` : 'Create a formula'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Functions and References */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="p-4">
              <div className="space-y-4">
                {/* Functions */}
                <div>
                  <button
                    onClick={() => setShowFunctions(!showFunctions)}
                    className="flex items-center justify-between w-full p-3 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      <FunctionIcon className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Functions</span>
                    </div>
                    {showFunctions ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                  
                  {showFunctions && (
                    <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                      {commonFunctions.map((func) => (
                        <button
                          key={func.name}
                          onClick={() => insertFunction(func.name + '()')}
                          className="w-full p-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                          title={func.description}
                        >
                          <div className="font-mono text-blue-600">{func.name}()</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{func.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cell References */}
                <div>
                  <button
                    onClick={() => setShowReferences(!showReferences)}
                    className="flex items-center justify-between w-full p-3 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      <Link className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Cell References</span>
                    </div>
                    {showReferences ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                  
                  {showReferences && (
                    <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                      {cellReferences.map((ref) => (
                        <button
                          key={ref.ref}
                          onClick={() => insertReference(ref.ref)}
                          className="w-full p-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                          title={ref.description}
                        >
                          <div className="font-mono text-green-600">{ref.ref}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{ref.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Operators */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-gray-900 dark:text-white">Operators</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {operators.map((op) => (
                      <button
                        key={op.symbol}
                        onClick={() => insertFunction(op.symbol)}
                        className="p-2 text-center text-sm font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                        title={op.name}
                      >
                        {op.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Formula Input and Preview */}
          <div className="flex-1 flex flex-col">
            {/* Formula Input */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formula
              </label>
              <div className="relative">
                <input
                  id="formula-input"
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-lg"
                  placeholder="Enter formula (e.g., =SUM(A1:A10))"
                  autoFocus
                />
                <div className="absolute right-3 top-3">
                  {error ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : formula.trim() ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : null}
                </div>
              </div>
              
              {error && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              
              {preview && !error && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>{preview}</span>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Formula Help
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Basic Syntax
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Start formulas with = (equals sign)</li>
                        <li>• Use cell references like A1, B2, C3</li>
                        <li>• Use ranges like A1:A10 for multiple cells</li>
                        <li>• Combine with operators: +, -, *, /, ^</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                        Common Examples
                      </h4>
                      <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                        <div className="font-mono">=SUM(A1:A10)</div>
                        <div className="font-mono">=AVERAGE(B1:B5)</div>
                        <div className="font-mono">=A1+B1*C1</div>
                        <div className="font-mono">=IF(A1&gt;0, "Positive", "Negative")</div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                        Tips
                      </h4>
                      <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                        <li>• Click on functions to insert them</li>
                        <li>• Use cell references for dynamic calculations</li>
                        <li>• Test formulas with sample data</li>
                        <li>• Use parentheses to control order of operations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <HelpCircle className="h-4 w-4" />
                  <span>Use the left panel to insert functions and references</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formula.trim() || !!error}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Apply Formula
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FormulaEditor