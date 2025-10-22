import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User, HelpCircle, ArrowRight, ExternalLink, BookOpen, RefreshCw, Sparkles, Maximize2, Minimize2, Move, Database, Settings } from 'lucide-react';
import { SearchEngine } from '../data/searchData';
import { CompanyContext } from '../context/CompanyContext';
import axios from 'axios';

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [chatSize, setChatSize] = useState({ width: 400, height: 600 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [industryContext, setIndustryContext] = useState('');
  const [currentPage, setCurrentPage] = useState('');
  const { selectedCompany } = useContext(CompanyContext);
  const location = useLocation();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your IFRS Consolidation Assistant. I can help you navigate the system, answer questions about features, and guide you through processes. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState([]);
  const [lastResponse, setLastResponse] = useState(null);
  const [followUpOptions, setFollowUpOptions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const searchEngine = useRef(new SearchEngine());
  const navigate = useNavigate();
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const chatRef = useRef(null);
  const resizeRef = useRef(null);

  // Reset chat function
  const resetChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: "Hi! I'm your IFRS Consolidation Assistant. I can help you navigate the system, answer questions about features, and guide you through processes. What would you like to know?",
        timestamp: new Date()
      }
    ]);
    setInputValue('');
    setConversationContext([]);
    setLastResponse(null);
    setFollowUpOptions([]);
  };

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Track current page for context
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/process')) setCurrentPage('process');
    else if (path.includes('/data-input')) setCurrentPage('data-input');
    else if (path.includes('/consolidation')) setCurrentPage('consolidation');
    else if (path.includes('/journal-entries')) setCurrentPage('journal-entries');
    else setCurrentPage(path.replace('/', '') || 'dashboard');
  }, [location]);

  // Auto-detect industry context from conversations
  useEffect(() => {
    const detectIndustry = () => {
      const recentMessages = messages.slice(-5).map(m => m.content.toLowerCase?.() || '').join(' ');
      
      if (recentMessages.includes('manufacturing') || recentMessages.includes('automotive')) {
        setIndustryContext('Manufacturing & Automotive');
      } else if (recentMessages.includes('technology') || recentMessages.includes('software') || recentMessages.includes('saas')) {
        setIndustryContext('Technology & Software');
      } else if (recentMessages.includes('real estate') || recentMessages.includes('construction')) {
        setIndustryContext('Real Estate & Construction');
      } else if (recentMessages.includes('banking') || recentMessages.includes('financial services')) {
        setIndustryContext('Financial Services & Banking');
      } else if (recentMessages.includes('retail') || recentMessages.includes('consumer goods')) {
        setIndustryContext('Retail & Consumer Goods');
      } else if (recentMessages.includes('oil') || recentMessages.includes('gas') || recentMessages.includes('mining')) {
        setIndustryContext('Oil & Gas / Mining');
      } else if (recentMessages.includes('healthcare') || recentMessages.includes('pharmaceutical')) {
        setIndustryContext('Healthcare & Pharmaceuticals');
      }
    };
    
    if (messages.length > 2) {
      detectIndustry();
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Check if query should be handled by AI (IFRS-related without navigation keywords)
  const shouldUseAI = (query) => {
    const queryLower = query.toLowerCase();
    
    // Don't use AI for navigation commands
    if (queryLower.includes('go to') || queryLower.includes('navigate to') || queryLower.includes('open')) {
      return false;
    }
    
    // Don't use AI for reset commands
    if (queryLower.includes('reset') || queryLower.includes('clear') || queryLower.includes('start over')) {
      return false;
    }
    
    // Use AI for IFRS-related questions or complex queries
    const ifrsKeywords = ['ifrs', 'accounting', 'financial', 'revenue', 'consolidation', 'standard', 'recognition', 'measurement', 'disclosure', 'impairment', 'lease', 'instrument', 'asset', 'liability', 'equity', 'income', 'expense', 'statement', 'reporting'];
    const hasIFRSKeyword = ifrsKeywords.some(keyword => queryLower.includes(keyword));
    
    // Use AI for longer, complex questions (more than 8 words)
    const isComplexQuery = query.trim().split(' ').length > 8;
    
    return hasIFRSKeyword || isComplexQuery;
  };

  // Clean AI response text
  const cleanAIResponse = (text) => {
    if (!text) return '';
    
    // Handle if text is an object with content property
    if (typeof text === 'object' && text.content) {
      text = text.content;
    }
    
    // Convert to string if not already
    text = String(text);
    
    // Remove escape characters and clean formatting
    return text
      .replace(/\\n/g, '\n')           // Replace \n with actual newlines
      .replace(/\\'/g, "'")           // Replace \' with '
      .replace(/\\"/g, '"')           // Replace \" with "
      .replace(/\\t/g, ' ')           // Replace \t with space
      .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n')     // Clean up multiple newlines
      .trim();                        // Remove leading/trailing whitespace
  };

  // Generate follow-up options for AI responses
  const generateAIFollowUps = (query, response) => {
    const queryLower = query.toLowerCase();
    const followUps = [];
    
    // IFRS-specific follow-ups
    if (queryLower.includes('ifrs 15') || queryLower.includes('revenue')) {
      followUps.push(
        'Tell me about the 5 steps of IFRS 15',
        'How to handle contract modifications?',
        'What about variable consideration?',
        'Go to IFRS Templates'
      );
    } else if (queryLower.includes('consolidation')) {
      followUps.push(
        'How to handle intercompany eliminations?',
        'What about NCI calculations?',
        'Tell me about goodwill impairment',
        'Go to Consolidation module'
      );
    } else if (queryLower.includes('lease') || queryLower.includes('ifrs 16')) {
      followUps.push(
        'How to calculate lease liability?',
        'What about right-of-use assets?',
        'Tell me about lease modifications',
        'Go to IFRS Templates'
      );
    } else {
      // General follow-ups
      followUps.push(
        'Can you explain this in more detail?',
        'What are the practical implications?',
        'Are there any exceptions to this rule?',
        'Show me related modules'
      );
    }
    
    return followUps.slice(0, 4); // Limit to 4 options
  };

  // Get AI response from backend API with enhanced context
  const getAIResponse = async (query) => {
    try {
      setIsAIProcessing(true);
      
      // Build user context for system integration
      const userContext = {
        current_page: currentPage,
        analyze_journals: query.toLowerCase().includes('journal') || query.toLowerCase().includes('entry'),
        analyze_entities: query.toLowerCase().includes('entity') || query.toLowerCase().includes('consolidation'),
        analyze_processes: currentPage === 'process' || query.toLowerCase().includes('process')
      };
      
      const response = await axios.post('/api/ai-chat/query', {
        messages: [
          {
            role: "user",
            content: query
          }
        ],
        industry_context: industryContext,
        company_name: selectedCompany,
        current_page: currentPage,
        user_context: userContext
      });
      
      const { output, error, system_data, suggestions } = response.data;
      
      if (error) {
        console.error('AI API Error:', error);
        return {
          type: 'ai_error',
          message: 'I apologize, but I encountered an issue processing your question. Please try rephrasing or ask about a specific module.',
          timestamp: new Date()
        };
      }
      
      const cleanedResponse = cleanAIResponse(output);
      const followUpOptions = generateAIFollowUps(query, cleanedResponse);
      
      return {
        type: 'ai_response',
        message: cleanedResponse || 'I received your question but couldn\'t generate a response. Please try asking in a different way.',
        query: query,
        followUpOptions: suggestions || followUpOptions,
        systemData: system_data,
        industryContext: industryContext,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('AI Processing Error:', error);
      return {
        type: 'ai_error',
        message: 'I\'m having trouble connecting to the AI service. Let me help you with navigation or basic questions instead.',
        timestamp: new Date()
      };
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Enhanced chat response with better context understanding
  const getEnhancedChatResponse = async (query) => {
    const queryLower = query.toLowerCase();
    
    // Check if should use AI first
    if (shouldUseAI(query)) {
      return await getAIResponse(query);
    }
    
    // Handle reset command
    if (queryLower.includes('reset') || queryLower.includes('clear') || queryLower.includes('start over')) {
      resetChat();
      return {
        type: 'reset_confirmation',
        message: 'Chat has been reset! How can I help you today?',
        timestamp: new Date()
      };
    }
    
    // Update conversation context
    setConversationContext(prev => [...prev.slice(-3), queryLower]);
    
    // Check for follow-up questions based on last response
    if (lastResponse && isFollowUpQuestion(queryLower, lastResponse)) {
      return handleFollowUpQuestion(queryLower, lastResponse);
    }
    
    // Direct module navigation requests - Auto navigate immediately
    if (queryLower.includes('go to') || queryLower.includes('navigate to') || queryLower.includes('open')) {
      const moduleMap = {
        'consolidation': '/consolidation',
        'dashboard': '/dashboard',
        'process': '/process',
        'etl': '/etl',
        'financial statements': '/financial-statements',
        'asset register': '/asset-register',
        'bills': '/bills',
        'audit': '/audit',
        'settings': '/settings',
        'documentation': '/documentation',
        'fst': '/fst-items',
        'fst items': '/fst-items',
        'trial balance': '/trial-balance',
        'journal entries': '/journal-entries',
        'bank reconciliation': '/bank-reconciliation',
        'supplier reconciliation': '/supplier-reconciliation',
        'ifrs templates': '/ifrs-templates',
        'forecast budget': '/forecast-budget',
        'variance analysis': '/variance-analysis',
        'cash flow': '/cash-flow',
        'financial ratios': '/financial-ratios',
        'narrative reporting': '/narrative-reporting',
        'what-if analysis': '/what-if-analysis',
        'real-time analytics': '/real-time-analytics',
        'regulatory reporting': '/regulatory-reporting',
        'global compliance': '/global-compliance',
        'audit trail': '/audit-trail',
        'internal controls': '/internal-controls',
        'forex rates': '/forex-rates',
        'custom axes': '/custom-axes',
        'workflows': '/workflows',
        'audit materiality': '/audit-materiality',
        'tax management': '/tax-management',
        'business valuation': '/business-valuation',
        'sql query console': '/sql-query-console',
        'system monitoring': '/system-monitoring',
        'database management': '/database-management',
        'backup restore': '/backup-restore',
        'data import export': '/data-import-export',
        'api management': '/api-management',
        'third party integration': '/third-party-integration',
        'integration summary': '/integration-summary',
        'training': '/training',
        'support': '/support'
      };
      
      for (const [module, path] of Object.entries(moduleMap)) {
        if (queryLower.includes(module)) {
          // Auto navigate immediately
          setTimeout(() => {
            navigate(path);
          }, 500);
          
          return {
            type: 'auto_navigation',
            message: `Taking you to ${module}...`,
            action: 'navigate',
            path: path,
            module: module
          };
        }
      }
    }
    
    // Get search response
    const response = searchEngine.current.getChatResponse(query);
    
    // Enhance response with navigation links and follow-up options
    if (response.type === 'faq' && response.navigationLink) {
      const enhancedResponse = {
        ...response,
        type: 'faq_with_navigation',
        navigationLink: response.navigationLink,
        followUpOptions: generateFollowUpOptions(response)
      };
      setLastResponse(enhancedResponse);
      return enhancedResponse;
    }
    
    if (response.type === 'navigation' && response.path) {
      const enhancedResponse = {
        ...response,
        type: 'navigation_with_link',
        navigationLink: response.path,
        followUpOptions: generateFollowUpOptions(response)
      };
      setLastResponse(enhancedResponse);
      return enhancedResponse;
    }
    
    setLastResponse(response);
    return response;
  };

  // Check if current query is a follow-up question
  const isFollowUpQuestion = (query, lastResponse) => {
    // Don't treat navigation commands as follow-up questions
    if (query.includes('go to') || query.includes('navigate to') || query.includes('open')) {
      return false;
    }
    
    const followUpKeywords = ['explain', 'tell me more', 'what about', 'how about', 'can you', 'step', 'detail', 'more', 'how do', 'what is', 'when should', 'which', 'why'];
    const hasFollowUpKeyword = followUpKeywords.some(keyword => query.includes(keyword));
    
    // Check if query references previous response content
    if (lastResponse && lastResponse.question) {
      const lastQuestionWords = lastResponse.question.toLowerCase().split(' ').filter(word => word.length > 3);
      const hasReference = lastQuestionWords.some(word => query.includes(word));
      return hasFollowUpKeyword && hasReference;
    }
    
    return false;
  };

  // Handle follow-up questions with comprehensive IFRS guidance
  const handleFollowUpQuestion = (query, lastResponse) => {
    // IFRS 15 Revenue Recognition follow-ups
    if (lastResponse.question && lastResponse.question.includes('IFRS 15')) {
      if (query.includes('step 1') || query.includes('identify contract')) {
        return {
          type: 'faq_followup',
          question: 'IFRS 15 Step 1: Identify the Contract',
          answer: 'Step 1 involves identifying contracts with customers. A contract exists when: 1) Parties have approved the contract, 2) Each party\'s rights regarding goods/services can be identified, 3) Payment terms can be identified, 4) The contract has commercial substance, and 5) Collection of consideration is probable. Use the IFRS Templates → IFRS 15 section for working papers.',
          module: 'IFRS Templates',
          navigationLink: '/ifrs-templates',
          followUpOptions: [
            'Explain Step 2: Identify Performance Obligations',
            'What is Step 3: Determine Transaction Price?',
            'How to handle contract modifications?',
            'Go to IFRS 15 templates'
          ]
        };
      }
      if (query.includes('step 2') || query.includes('performance obligation')) {
        return {
          type: 'faq_followup',
          question: 'IFRS 15 Step 2: Identify Performance Obligations',
          answer: 'Step 2 requires identifying distinct performance obligations in the contract. A good or service is distinct if: 1) The customer can benefit from it on its own or with other readily available resources, and 2) The entity\'s promise to transfer the good/service is separately identifiable from other promises. Each distinct performance obligation is accounted for separately.',
          module: 'IFRS Templates',
          navigationLink: '/ifrs-templates',
          followUpOptions: [
            'Explain Step 1: Identify the Contract',
            'What is Step 3: Determine Transaction Price?',
            'How to allocate transaction price?',
            'Go to IFRS 15 templates'
          ]
        };
      }
      if (query.includes('step 3') || query.includes('transaction price')) {
        return {
          type: 'faq_followup',
          question: 'IFRS 15 Step 3: Determine Transaction Price',
          answer: 'Step 3 involves determining the transaction price - the amount of consideration to which an entity expects to be entitled. This includes: 1) Fixed consideration, 2) Variable consideration (estimated using expected value or most likely amount), 3) Non-cash consideration (fair value), 4) Consideration payable to customer (net against revenue), and 5) Time value of money if significant.',
          module: 'IFRS Templates',
          navigationLink: '/ifrs-templates',
          followUpOptions: [
            'How to estimate variable consideration?',
            'What is the constraint on variable consideration?',
            'How to handle time value of money?',
            'Go to IFRS 15 templates'
          ]
        };
      }
      if (query.includes('step 4') || query.includes('allocate')) {
        return {
          type: 'faq_followup',
          question: 'IFRS 15 Step 4: Allocate Transaction Price',
          answer: 'Step 4 requires allocating the transaction price to each performance obligation based on relative standalone selling prices. If standalone selling price is not observable, use: 1) Adjusted market assessment, 2) Expected cost plus margin, or 3) Residual approach (only if selling price is highly variable or uncertain).',
          module: 'IFRS Templates',
          navigationLink: '/ifrs-templates',
          followUpOptions: [
            'How to determine standalone selling price?',
            'What is the residual approach?',
            'How to handle discounts and variable consideration?',
            'Go to IFRS 15 templates'
          ]
        };
      }
      if (query.includes('step 5') || query.includes('recognize')) {
        return {
          type: 'faq_followup',
          question: 'IFRS 15 Step 5: Recognize Revenue',
          answer: 'Step 5 requires recognizing revenue when (or as) the entity satisfies a performance obligation by transferring control of a good or service to the customer. Control can transfer over time (if criteria met) or at a point in time. Over time recognition requires: 1) Customer simultaneously receives and consumes benefits, 2) Entity creates/enhances asset controlled by customer, or 3) Entity\'s performance creates asset with no alternative use and right to payment.',
          module: 'IFRS Templates',
          navigationLink: '/ifrs-templates',
          followUpOptions: [
            'How to determine control transfer?',
            'What are the over time criteria?',
            'How to measure progress over time?',
            'Go to IFRS 15 templates'
          ]
        };
      }
    }
    
    // Consolidation follow-ups
    if (lastResponse.question && lastResponse.question.includes('consolidation')) {
      if (query.includes('intercompany') || query.includes('ic')) {
        return {
          type: 'faq_followup',
          question: 'Intercompany Transactions in Consolidation',
          answer: 'Intercompany transactions must be eliminated in consolidation to avoid double-counting. Common eliminations include: 1) Intercompany sales and purchases, 2) Intercompany receivables and payables, 3) Intercompany dividends, 4) Unrealized profits in inventory, and 5) Intercompany loans and interest. Use the Consolidation → IC Matching & Elimination tab for automated processing.',
          module: 'Consolidation',
          navigationLink: '/consolidation',
          followUpOptions: [
            'How to handle unrealized profits?',
            'What about intercompany loans?',
            'How to set up IC matching?',
            'Go to consolidation module'
          ]
        };
      }
      if (query.includes('ownership') || query.includes('nci')) {
        return {
          type: 'faq_followup',
          question: 'Ownership Structure and NCI',
          answer: 'Non-controlling interest (NCI) represents the portion of equity in a subsidiary not attributable to the parent. NCI is measured at fair value or proportionate share of net assets. Key considerations: 1) Determine ownership percentage, 2) Calculate NCI share of profit/loss, 3) Account for changes in ownership, and 4) Handle step acquisitions. Use Consolidation → Ownership & NCI tab for calculations.',
          module: 'Consolidation',
          navigationLink: '/consolidation',
          followUpOptions: [
            'How to calculate NCI share of profit?',
            'What about step acquisitions?',
            'How to handle changes in ownership?',
            'Go to consolidation module'
          ]
        };
      }
    }
    
    // Default follow-up response
    return {
      type: 'faq_followup',
      question: 'Follow-up Information',
      answer: 'I\'d be happy to provide more details. Could you be more specific about which part you\'d like me to explain further?',
      module: lastResponse.module || 'General',
      navigationLink: lastResponse.navigationLink,
      followUpOptions: generateFollowUpOptions(lastResponse)
    };
  };

  // Generate follow-up options based on response
  const generateFollowUpOptions = (response) => {
    if (!response) return [];
    
    const options = [];
    
    if (response.question && response.question.includes('IFRS 15')) {
      options.push(
        'Explain Step 1: Identify the Contract',
        'What is Step 2: Identify Performance Obligations?',
        'How to determine transaction price?',
        'Go to IFRS 15 templates'
      );
    } else if (response.question && response.question.includes('consolidation')) {
      options.push(
        'How to set up intercompany transactions?',
        'What is ownership structure?',
        'How to calculate NCI?',
        'Go to consolidation module'
      );
    } else if (response.question && response.question.includes('ETL')) {
      options.push(
        'How to configure data extraction?',
        'What is data transformation?',
        'How to set up data loading?',
        'Go to ETL pipeline'
      );
    } else if (response.module) {
      options.push(
        `Tell me more about ${response.module}`,
        `How to use ${response.module}?`,
        `Go to ${response.module}`
      );
    }
    
    return options.slice(0, 4); // Limit to 4 options
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      // Get response (could be AI or traditional)
      const response = await getEnhancedChatResponse(currentQuery);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // Navigation is handled automatically in getEnhancedChatResponse
    } catch (error) {
      console.error('Message handling error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: {
          type: 'error',
          message: 'I encountered an error processing your message. Please try again.',
          timestamp: new Date()
        },
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle follow-up button clicks
  const handleFollowUpClick = async (followUpText) => {
    setInputValue(followUpText);
    // Small delay to show the input, then send
    setTimeout(async () => {
      await handleSendMessage();
    }, 100);
  };

  // Resizing functionality
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const newWidth = Math.max(350, Math.min(800, window.innerWidth - e.clientX + 20));
    const newHeight = Math.max(400, Math.min(window.innerHeight - 100, window.innerHeight - e.clientY + 20));
    
    setChatSize({ width: newWidth, height: newHeight });
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  // Toggle maximize/minimize
  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Industry context selector
  const industryOptions = [
    'Manufacturing & Automotive',
    'Technology & Software', 
    'Real Estate & Construction',
    'Financial Services & Banking',
    'Retail & Consumer Goods',
    'Oil & Gas / Mining',
    'Healthcare & Pharmaceuticals'
  ];

  // Quick action buttons
  const quickActions = [
    { label: "What does consolidation do?", action: "What does consolidation tab do?" },
    { label: "IFRS 15 revenue recognition", action: "What is IFRS 15 revenue recognition?" },
    { label: "Upload trial balance", action: "How do I upload trial balance?" },
    { label: "ETL pipeline help", action: "What is the ETL pipeline?" },
    { label: "Go to consolidation", action: "Go to consolidation" },
    { label: "Financial ratios", action: "What are financial ratios?" },
    { label: "Reset Chat", action: "reset_chat", isReset: true },
    { label: "IFRS Standards Help", action: "Tell me about IFRS standards" }
  ];

  const handleQuickAction = async (action, isReset = false) => {
    if (isReset) {
      resetChat();
      return;
    }
    setInputValue(action);
    // Small delay to show the input, then send
    setTimeout(async () => {
      await handleSendMessage();
    }, 100);
  };

  // Render message content based on type
  const renderMessageContent = (message) => {
    if (message.type === 'user') {
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
              <p className="text-sm">{message.content}</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    // Reset confirmation message
    if (message.content.type === 'reset_confirmation') {
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 max-w-xs lg:max-w-md">
              <div className="flex items-center space-x-2 mb-2">
                <RefreshCw className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Chat Reset
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {message.content.message}
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    // AI Response message
    if (message.content.type === 'ai_response') {
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 max-w-sm lg:max-w-lg xl:max-w-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    IFRS Expert
                  </span>
                  {message.content.industryContext && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                      {message.content.industryContext}
                    </span>
                  )}
                </div>
                {message.content.systemData && (
                  <Database className="h-4 w-4 text-green-500" title="System data analyzed" />
                )}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {message.content.message.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? (
                    <p key={index} className="mb-2 last:mb-0">
                      {paragraph.trim()}
                    </p>
                  ) : (
                    <br key={index} />
                  )
                ))}
              </div>
              {message.content.followUpOptions && message.content.followUpOptions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Follow-up questions:</p>
                  <div className="flex flex-wrap gap-1">
                    {message.content.followUpOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleFollowUpClick(option)}
                        className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    // AI Error message
    if (message.content.type === 'ai_error') {
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-700 border border-red-200 dark:border-red-600 rounded-lg px-4 py-3 max-w-xs lg:max-w-md">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  AI Service Issue
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {message.content.message}
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    // Auto navigation message
    if (message.content.type === 'auto_navigation') {
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 max-w-xs lg:max-w-md">
              <div className="flex items-center space-x-2 mb-2">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {message.content.message}
                </span>
              </div>
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <ArrowRight className="h-3 w-3 mr-1" />
                Module: {message.content.module}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    // Bot message with FAQ and navigation
    if (message.content.type === 'faq' || message.content.type === 'faq_with_navigation' || message.content.type === 'faq_followup') {
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 max-w-xs lg:max-w-md">
              <div className="flex items-center space-x-2 mb-2">
                <HelpCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {message.content.question}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                {message.content.answer}
              </p>
              
              {/* Follow-up Options */}
              {message.content.followUpOptions && message.content.followUpOptions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">You might also ask:</p>
                  <div className="space-y-1">
                    {message.content.followUpOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputValue(option);
                          handleSendMessage();
                        }}
                        className="block w-full text-left text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors"
                      >
                        • {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Module: {message.content.module}
                </div>
                {message.content.navigationLink && (
                  <button
                    onClick={() => navigate(message.content.navigationLink)}
                    className="flex items-center space-x-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Go to Module</span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    if (message.content.type === 'navigation' || message.content.type === 'navigation_with_link') {
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 max-w-xs lg:max-w-md">
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-4 w-4 rounded bg-blue-500 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">M</span>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {message.content.name || message.content.module}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                {message.content.description || message.content.message}
              </p>
              {message.content.tabs && message.content.tabs.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Available tabs:</p>
                  <div className="flex flex-wrap gap-1">
                    {message.content.tabs.slice(0, 3).map((tab, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      >
                        {tab}
                      </span>
                    ))}
                    {message.content.tabs.length > 3 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        +{message.content.tabs.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  {message.content.hierarchicalPath || `Module: ${message.content.module}`}
                </div>
                {message.content.navigationLink && (
                  <button
                    onClick={() => navigate(message.content.navigationLink)}
                    className="flex items-center space-x-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Go to Module</span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    if (message.content.type === 'no_results') {
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 max-w-xs lg:max-w-md">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {message.content.message}
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    // Default bot message
    return (
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 max-w-xs lg:max-w-md">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {message.content}
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          >
            <MessageCircle className="h-6 w-6" />
            <div className="absolute -top-2 -right-2 h-4 w-4 bg-green-500 rounded-full animate-pulse"></div>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatRef}
          className={`fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col ${
            isMaximized 
              ? 'inset-4' 
              : 'bottom-6 right-6'
          }`}
          style={
            isMaximized 
              ? {} 
              : { 
                  width: `${chatSize.width}px`, 
                  height: `${chatSize.height}px` 
                }
          }
        >
          {/* Resize Handle */}
          {!isMaximized && (
            <div
              className="absolute -top-2 -left-2 w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100 transition-opacity"
              onMouseDown={handleMouseDown}
            >
              <Move className="h-4 w-4 text-slate-400" />
            </div>
          )}
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                  IFRS Assistant
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Online • Ready to help
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Industry Context Selector */}
              <select
                value={industryContext}
                onChange={(e) => setIndustryContext(e.target.value)}
                className="text-xs bg-transparent border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-600 dark:text-slate-300"
                title="Industry Context"
              >
                <option value="">Auto-detect Industry</option>
                {industryOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              
              <button
                onClick={toggleMaximize}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title={isMaximized ? "Minimize" : "Maximize"}
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              
              <button
                onClick={resetChat}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Reset Chat"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {renderMessageContent(message)}
              </div>
            ))}
            
            {/* Typing indicator */}
            {(isTyping || isAIProcessing) && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    {isAIProcessing && (
                      <div className="flex items-center space-x-1">
                        <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
                        <span className="text-xs text-purple-500">AI thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.action, action.isReset)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      action.isReset 
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about the system..."
                className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping || isAIProcessing}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
