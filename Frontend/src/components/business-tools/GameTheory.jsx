import React, { useState, useEffect } from 'react'
import { 
  Gamepad2, 
  Target, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Save,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  Brain,
  Calculator,
  LineChart,
  Info,
  Filter,
  Search,
  Activity,
  DollarSign,
  Percent,
  Calendar,
  Building,
  UserCheck,
  Lock,
  Unlock,
  Users,
  Shield
} from 'lucide-react'

const GameTheory = ({ industry, level }) => {
  const [gameData, setGameData] = useState({
    gameType: 'prisoners_dilemma',
    players: 2,
    strategies: ['cooperate', 'defect'],
    payoffs: {
      cooperate_cooperate: [3, 3],
      cooperate_defect: [0, 5],
      defect_cooperate: [5, 0],
      defect_defect: [1, 1]
    },
    iterations: 1,
    discountFactor: 0.9
  })

  const [analysisResults, setAnalysisResults] = useState({
    nashEquilibrium: null,
    dominantStrategy: null,
    paretoOptimal: null,
    recommendations: [],
    gameOutcome: null
  })

  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [activeAnalysis, setActiveAnalysis] = useState('basic')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const gameTypes = [
    { 
      id: 'prisoners_dilemma', 
      name: 'Prisoner\'s Dilemma', 
      description: 'Classic cooperation vs. defection scenario',
      payoffs: {
        cooperate_cooperate: [3, 3],
        cooperate_defect: [0, 5],
        defect_cooperate: [5, 0],
        defect_defect: [1, 1]
      }
    },
    { 
      id: 'chicken', 
      name: 'Chicken Game', 
      description: 'Bluffing and brinkmanship scenario',
      payoffs: {
        swerve_swerve: [0, 0],
        swerve_straight: [-1, 1],
        straight_swerve: [1, -1],
        straight_straight: [-10, -10]
      }
    },
    { 
      id: 'stag_hunt', 
      name: 'Stag Hunt', 
      description: 'Coordination and risk scenario',
      payoffs: {
        stag_stag: [4, 4],
        stag_hare: [0, 3],
        hare_stag: [3, 0],
        hare_hare: [2, 2]
      }
    },
    { 
      id: 'battle_sexes', 
      name: 'Battle of the Sexes', 
      description: 'Coordination with different preferences',
      payoffs: {
        opera_opera: [2, 1],
        opera_football: [0, 0],
        football_opera: [0, 0],
        football_football: [1, 2]
      }
    }
  ]

  const industryDefaults = {
    banking: { gameType: 'prisoners_dilemma', iterations: 5, discountFactor: 0.95 },
    manufacturing: { gameType: 'stag_hunt', iterations: 3, discountFactor: 0.9 },
    retail: { gameType: 'chicken', iterations: 2, discountFactor: 0.85 },
    healthcare: { gameType: 'prisoners_dilemma', iterations: 10, discountFactor: 0.98 },
    technology: { gameType: 'battle_sexes', iterations: 4, discountFactor: 0.9 },
    energy: { gameType: 'stag_hunt', iterations: 6, discountFactor: 0.92 },
    real_estate: { gameType: 'prisoners_dilemma', iterations: 3, discountFactor: 0.88 },
    general: { gameType: 'prisoners_dilemma', iterations: 1, discountFactor: 0.9 }
  }

  useEffect(() => {
    loadSavedAnalyses()
    
    // Set industry defaults
    const defaults = industryDefaults[industry] || industryDefaults.general
    const gameType = gameTypes.find(gt => gt.id === defaults.gameType)
    
    setGameData(prev => ({
      ...prev,
      gameType: defaults.gameType,
      iterations: defaults.iterations,
      discountFactor: defaults.discountFactor,
      payoffs: gameType ? gameType.payoffs : prev.payoffs
    }))
  }, [industry])

  const loadSavedAnalyses = () => {
    try {
      const saved = localStorage.getItem('gameTheoryAnalyses')
      if (saved) {
        setSavedAnalyses(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved analyses:', error)
    }
  }

  const saveAnalysis = () => {
    if (!analysisResults.nashEquilibrium) return

    const newAnalysis = {
      id: Date.now(),
      gameData: { ...gameData },
      results: { ...analysisResults },
      timestamp: new Date().toISOString(),
      industry
    }

    const updated = [...savedAnalyses, newAnalysis]
    setSavedAnalyses(updated)
    localStorage.setItem('gameTheoryAnalyses', JSON.stringify(updated))
  }

  const analyzeGameTheory = () => {
    const { gameType, payoffs, iterations, discountFactor } = gameData
    
    // Find Nash Equilibrium
    let nashEquilibrium = null
    let dominantStrategy = null
    let paretoOptimal = null
    let recommendations = []
    let gameOutcome = null

    // Analyze based on game type
    switch (gameType) {
      case 'prisoners_dilemma':
        nashEquilibrium = 'Defect-Defect'
        dominantStrategy = 'Defect'
        paretoOptimal = 'Cooperate-Cooperate'
        gameOutcome = 'Suboptimal outcome due to individual rationality'
        recommendations = [
          'Consider repeated interactions to enable cooperation',
          'Implement reputation mechanisms',
          'Use tit-for-tat strategy in repeated games'
        ]
        break
        
      case 'chicken':
        nashEquilibrium = 'Mixed Strategy'
        dominantStrategy = 'None (depends on opponent)'
        paretoOptimal = 'Swerve-Swerve'
        gameOutcome = 'Unstable equilibrium with risk of mutual destruction'
        recommendations = [
          'Establish clear communication channels',
          'Consider commitment strategies',
          'Use gradual escalation to avoid brinkmanship'
        ]
        break
        
      case 'stag_hunt':
        nashEquilibrium = 'Stag-Stag or Hare-Hare'
        dominantStrategy = 'None (coordination required)'
        paretoOptimal = 'Stag-Stag'
        gameOutcome = 'Coordination problem with multiple equilibria'
        recommendations = [
          'Build trust through repeated interactions',
          'Establish clear coordination mechanisms',
          'Use focal points to guide strategy selection'
        ]
        break
        
      case 'battle_sexes':
        nashEquilibrium = 'Mixed Strategy'
        dominantStrategy = 'None (coordination required)'
        paretoOptimal = 'Both pure strategy equilibria'
        gameOutcome = 'Coordination problem with asymmetric preferences'
        recommendations = [
          'Use communication to coordinate',
          'Consider side payments to align preferences',
          'Establish focal points for coordination'
        ]
        break
    }

    // Add general recommendations based on iterations
    if (iterations > 1) {
      recommendations.push(`Repeated game with ${iterations} iterations - consider reputation effects`)
    }

    if (discountFactor > 0.9) {
      recommendations.push('High discount factor - future payoffs are important')
    }

    setAnalysisResults({
      nashEquilibrium,
      dominantStrategy,
      paretoOptimal,
      recommendations,
      gameOutcome
    })
  }

  const handleInputChange = (field, value) => {
    setGameData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGameTypeChange = (gameTypeId) => {
    const gameType = gameTypes.find(gt => gt.id === gameTypeId)
    if (gameType) {
      setGameData(prev => ({
        ...prev,
        gameType: gameTypeId,
        payoffs: gameType.payoffs
      }))
    }
  }

  const handlePayoffChange = (outcome, player, value) => {
    setGameData(prev => ({
      ...prev,
      payoffs: {
        ...prev.payoffs,
        [outcome]: prev.payoffs[outcome].map((payoff, index) => 
          index === player ? parseFloat(value) || 0 : payoff
        )
      }
    }))
  }

  const renderAnalysisForm = () => {
    const currentGameType = gameTypes.find(gt => gt.id === gameData.gameType)
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Gamepad2 className="h-6 w-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Game Theory Analysis
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Analyze strategic interactions and find optimal strategies
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Game Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Game Type
              </label>
              <select
                value={gameData.gameType}
                onChange={(e) => handleGameTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {gameTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {currentGameType?.description}
              </p>
            </div>

            {/* Game Parameters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Number of Iterations
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={gameData.iterations}
                  onChange={(e) => handleInputChange('iterations', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Discount Factor
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={gameData.discountFactor}
                  onChange={(e) => handleInputChange('discountFactor', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payoff Matrix */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Payoff Matrix
            </h4>
            <div className="bg-white dark:bg-slate-700 rounded-lg p-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2"></th>
                    <th className="text-center p-2">Player 2: Strategy A</th>
                    <th className="text-center p-2">Player 2: Strategy B</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 font-medium">Player 1: Strategy A</td>
                    <td className="p-2">
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={gameData.payoffs.cooperate_cooperate?.[0] || 0}
                          onChange={(e) => handlePayoffChange('cooperate_cooperate', 0, e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        />
                        <input
                          type="number"
                          value={gameData.payoffs.cooperate_cooperate?.[1] || 0}
                          onChange={(e) => handlePayoffChange('cooperate_cooperate', 1, e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={gameData.payoffs.cooperate_defect?.[0] || 0}
                          onChange={(e) => handlePayoffChange('cooperate_defect', 0, e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        />
                        <input
                          type="number"
                          value={gameData.payoffs.cooperate_defect?.[1] || 0}
                          onChange={(e) => handlePayoffChange('cooperate_defect', 1, e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Player 1: Strategy B</td>
                    <td className="p-2">
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={gameData.payoffs.defect_cooperate?.[0] || 0}
                          onChange={(e) => handlePayoffChange('defect_cooperate', 0, e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        />
                        <input
                          type="number"
                          value={gameData.payoffs.defect_cooperate?.[1] || 0}
                          onChange={(e) => handlePayoffChange('defect_cooperate', 1, e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={gameData.payoffs.defect_defect?.[0] || 0}
                          onChange={(e) => handlePayoffChange('defect_defect', 0, e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        />
                        <input
                          type="number"
                          value={gameData.payoffs.defect_defect?.[1] || 0}
                          onChange={(e) => handlePayoffChange('defect_defect', 1, e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Format: [Player 1 payoff, Player 2 payoff]
              </p>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={analyzeGameTheory}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Analyze Game</span>
            </button>
            
            {analysisResults.nashEquilibrium && (
              <button
                onClick={saveAnalysis}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Analysis</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderResults = () => {
    if (!analysisResults.nashEquilibrium) return null

    return (
      <div className="space-y-6">
        {/* Game Theory Results */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Game Theory Analysis Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Nash Equilibrium</h4>
                <p className="text-lg text-indigo-600 dark:text-indigo-400">{analysisResults.nashEquilibrium}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Dominant Strategy</h4>
                <p className="text-lg text-blue-600 dark:text-blue-400">{analysisResults.dominantStrategy}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Pareto Optimal</h4>
                <p className="text-lg text-green-600 dark:text-green-400">{analysisResults.paretoOptimal}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Game Outcome</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{analysisResults.gameOutcome}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Recommendations */}
        {analysisResults.recommendations.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span>Strategic Recommendations</span>
            </h3>
            <ul className="space-y-2">
              {analysisResults.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-600 dark:text-slate-400">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Game Theory Concepts */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Key Game Theory Concepts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Nash Equilibrium</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                A strategy profile where no player can unilaterally improve their payoff by changing strategy.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Pareto Optimal</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                An outcome where no player can be made better off without making another player worse off.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Dominant Strategy</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                A strategy that yields the highest payoff regardless of what the opponent does.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Repeated Games</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Games played multiple times, enabling cooperation through reputation and future consequences.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Game Theory
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analyze strategic interactions and find optimal strategies
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Industry: {industry}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Level: {level}
          </span>
        </div>
      </div>

      {/* Analysis Form */}
      {renderAnalysisForm()}

      {/* Results */}
      {renderResults()}

      {/* Saved Analyses */}
      {savedAnalyses.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Saved Analyses
          </h3>
          <div className="space-y-3">
            {savedAnalyses.slice(-5).map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {gameTypes.find(gt => gt.id === analysis.gameData.gameType)?.name}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    - {analysis.results.nashEquilibrium}
                  </span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(analysis.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default GameTheory
