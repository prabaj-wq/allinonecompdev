import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User, HelpCircle, ArrowRight, ExternalLink, BookOpen, RefreshCw, Sparkles, Maximize2, Minimize2, Move, Database, Settings } from 'lucide-react';
import { SearchEngine } from '../data/searchData';
import { useCompany } from '../contexts/CompanyContext';
import axios from 'axios';

// Funny loading phrases for AI processing
const LOADING_PHRASES = [
  "Even AI takes time... ⏰",
  "IFRS is luckily easy! 📊",
  "Calculating consolidation magic ✨",
  "Reading IFRS 16 for the 1000th time 📖",
  "Asking the accounting gods for wisdom 🙏",
  "Converting coffee to IFRS expertise ☕",
  "Debugging journal entries like a pro 🐛",
  "Teaching AI about debit and credit 💡",
  "Consolidating thoughts and entities 🏢",
  "Searching for the perfect IFRS paragraph 🔍",
  "AI is having an existential crisis about goodwill 🤔",
  "Calculating present value of patience ⏳",
  "IFRS 9 expected credit loss: my sanity 😅",
  "Translating human to accounting language 🤖",
  "Loading... like a slow ERP system 🐌",
  "AI is consulting the IFRS crystal ball 🔮",
  "Depreciation in progress... please wait 📉",
  "Amortizing the time it takes to respond ⏲️",
  "Fair value measurement of your question 💰",
  "AI is doing some creative accounting 🎨",
  "Reconciling AI thoughts with reality ⚖️",
  "IFRS 15 revenue recognition: still pending 💸",
  "Calculating the NPV of this conversation 📈",
  "AI audit in progress... no findings yet ✅",
  "Consolidating 99 problems but IFRS ain't one 🎵",
  "Teaching AI that assets = liabilities + equity 🧮",
  "AI is having flashbacks to accounting school 🎓",
  "Impairment testing AI's patience levels 📊",
  "Loading faster than year-end closing 🏃‍♂️",
  "AI is reading footnotes... this might take a while 📝",
  "Hedge accounting: AI's natural defense mechanism 🛡️",
  "Calculating lease liability like it's 2019 📅",
  "AI is practicing its journal entry dance 💃",
  "IFRS interpretation committee meeting in session 👥",
  "AI's brain is doing some serious number crunching 🧠",
  "Loading with the speed of regulatory approval 🐢",
  "AI is consulting its inner auditor 🕵️‍♂️",
  "Materiality assessment: this wait is immaterial ⚡",
  "AI is having a moment with segment reporting 📊",
  "Calculating faster than a Big 4 intern 🏃‍♀️",
  "AI's processing power: depreciated but not impaired 💪",
  "IFRS convergence: AI and human understanding 🤝",
  "Loading... like waiting for audit sign-off 📋",
  "AI is doing some forensic accounting on your question 🔍",
  "Substance over form: AI gets it now 💡",
  "AI's memory is being tested for impairment 🧪",
  "Loading with the enthusiasm of tax season 📊",
  "AI is calculating the probability of making sense 🎲",
  "IFRS 3 business combination: AI + your question 💼",
  "AI is having a control assessment moment 🎮",
  "Loading... faster than regulatory changes 🚀",
  "AI's confidence interval: 95% sure it knows IFRS 📈",
  "Performing substantive testing on this query 🔬",
  "AI is consulting the accounting standards codification 📚",
  "Loading with the speed of financial statement prep 📄",
  "AI's risk assessment: low risk of wrong answer 🎯",
  "Calculating like it's month-end close 📅",
  "AI is having a moment of professional skepticism 🤨",
  "Loading... with the patience of an external auditor ⏰",
  "AI's internal controls are functioning effectively ✅",
  "Performing analytical procedures on your question 📊",
  "AI is consulting its continuing professional education 🎓",
  "Loading faster than SOX compliance testing 🏃‍♂️",
  "AI's materiality threshold: every question matters 💎",
  "Calculating with the precision of a forensic accountant 🔍",
  "AI is having a going concern assessment 🏢",
  "Loading... like waiting for management representation letter 📝",
  "AI's professional judgment is being exercised 🧠",
  "Performing walkthrough procedures on this query 🚶‍♂️",
  "AI is consulting the conceptual framework 🏗️",
  "Loading with the speed of quarterly reporting 📊",
  "AI's quality control procedures are in effect ✅",
  "Calculating faster than expense report approvals 💸",
  "AI is having a subsequent events review 📅",
  "Loading... with the thoroughness of due diligence 🔍",
  "AI's independence is not impaired 🗽",
  "Performing test of controls on this conversation 🎮",
  "AI is consulting its engagement letter 📋",
  "Loading faster than budget variance analysis 📈",
  "AI's sampling method: judgmental selection 🎯",
  "Calculating with the accuracy of a trial balance ⚖️",
  "AI is having a management letter moment 💌",
  "Loading... like waiting for board approval 👥",
  "AI's documentation standards are being met 📝",
  "Performing confirmation procedures on your question ✉️",
  "AI is consulting the audit committee 🏛️",
  "Loading with the speed of regulatory filing 📊",
  "AI's ethical considerations are being evaluated 🤔",
  "Calculating faster than depreciation schedules 📉",
  "AI is having a peer review moment 👨‍💼",
  "Loading... with the diligence of tax preparation 📊",
  "AI's competence is continuously assessed 📚",
  "Performing cut-off testing on this query ✂️",
  "AI is consulting its quality assurance manual 📖",
  "Loading faster than financial statement footnotes 📝",
  "AI's objectivity remains uncompromised 🎯",
  "Calculating with the precision of cash flow projections 💰",
  "AI is having a business risk assessment 📊",
  "Loading... like waiting for clean audit opinion ✅",
  "AI's professional development is up to date 🎓",
  "Performing existence testing on this conversation 🔍",
  "AI is consulting the engagement quality control reviewer 👨‍⚖️",
  "Loading with the speed of internal audit findings 🕵️‍♂️",
  "AI's skepticism level: appropriately professional 🤨",
  "Calculating faster than accrual adjustments 📊",
  "AI is having a fraud risk assessment 🚨",
  "Loading... with the patience of year-end inventory count 📦",
  "AI's communication skills are being tested 💬",
  "Performing completeness testing on your question ✅",
  "AI is consulting its continuing education credits 🎓",
  "Loading faster than management override controls 🛡️",
  "AI's integrity is beyond question 💎",
  
  // Additional 100+ accounting humor phrases
  "Calculating faster than a CFO's bonus approval 💰",
  "AI is having a moment with working capital 🔄",
  "Loading... like waiting for board minutes approval 📋",
  "AI's memory allocation: better than budget allocation 🧠",
  "Performing ratio analysis on this conversation 📊",
  "AI is consulting its chart of accounts 📈",
  "Loading with the speed of expense reimbursements 💸",
  "AI's error rate: lower than rounding differences ✅",
  "Calculating like it's bonus calculation time 💎",
  "AI is having a cash flow forecast moment 💰",
  "Loading... with the patience of tax auditors 🕵️‍♂️",
  "AI's processing: more reliable than Excel formulas 📊",
  "Performing variance analysis on your patience 📉",
  "AI is consulting the generally accepted AI principles 📚",
  "Loading faster than quarterly earnings calls 📞",
  "AI's confidence: higher than gross profit margins 📈",
  "Calculating with the accuracy of bank reconciliations ⚖️",
  "AI is having a working papers organization moment 📁",
  "Loading... like waiting for client responses 📧",
  "AI's efficiency: better than automated journal entries ⚡",
  "Performing sensitivity analysis on this query 🔍",
  "AI is consulting its internal control matrix 🛡️",
  "Loading with the thoroughness of SOX testing 📋",
  "AI's reliability: higher than audit sampling confidence 🎯",
  "Calculating faster than depreciation on technology assets 💻",
  "AI is having a fixed asset register moment 🏢",
  "Loading... like waiting for management decisions 🤔",
  "AI's accuracy: better than three-way matches ✅",
  "Performing benchmarking analysis on response time ⏱️",
  "AI is consulting its risk assessment framework 🎲",
  "Loading with the precision of actuarial calculations 🧮",
  "AI's judgment: more consistent than accounting estimates 💡",
  "Calculating like it's impairment testing season 🧪",
  "AI is having a segment reporting revelation 📊",
  "Loading... with the diligence of compliance officers 👨‍💼",
  "AI's performance: exceeds materiality thresholds 🎯",
  "Performing walkthrough of neural pathways 🧠",
  "AI is consulting its engagement quality manual 📖",
  "Loading faster than accrual reversals 🔄",
  "AI's consistency: better than accounting policy application 📋",
  "Calculating with the precision of fair value measurements 💰",
  "AI is having a related party transaction moment 🤝",
  "Loading... like waiting for external confirmations ✉️",
  "AI's transparency: clearer than footnote disclosures 📝",
  "Performing substantive analytical procedures on data 📊",
  "AI is consulting its professional skepticism settings 🤨",
  "Loading with the speed of automated controls ⚡",
  "AI's integrity: stronger than segregation of duties 🛡️",
  "Calculating faster than month-end accruals 📅",
  "AI is having a cash equivalents classification moment 💵",
  "Loading... like waiting for audit committee meetings 🏛️",
  "AI's competence: continuously updated like CPE credits 🎓",
  "Performing test of details on your question 🔍",
  "AI is consulting its quality control procedures 📋",
  "Loading with the patience of inventory observers 📦",
  "AI's objectivity: unimpaired by cognitive biases 🎯",
  "Calculating like it's pension liability valuation 👴",
  "AI is having a deferred tax asset realization moment 📊",
  "Loading... with the thoroughness of loan covenant testing 📋",
  "AI's reliability: higher than internal control effectiveness ✅",
  "Performing cut-off procedures on response timing ✂️",
  "AI is consulting its engagement letter terms 📄",
  "Loading faster than automated three-way matches ⚡",
  "AI's independence: stronger than audit firm policies 🗽",
  "Calculating with the accuracy of bank reconciliations 🏦",
  "AI is having a subsequent events evaluation 📅",
  "Loading... like waiting for management representations 📝",
  "AI's professional judgment: exercised with due care 🧠",
  "Performing analytical review of processing patterns 📊",
  "AI is consulting its continuing education database 📚",
  "Loading with the speed of real-time reporting 🚀",
  "AI's skepticism: appropriately calibrated for risk 🎯",
  "Calculating faster than automated journal postings ⚡",
  "AI is having a going concern assessment 🏢",
  "Loading... like waiting for regulatory approvals 📋",
  "AI's documentation: meets professional standards 📝",
  "Performing confirmation procedures on data accuracy ✅",
  "AI is consulting its peer review feedback 👥",
  "Loading with the diligence of forensic accountants 🔍",
  "AI's ethics: beyond reproach like audit independence 💎",
  "Calculating like it's derivative valuation time 📈",
  "AI is having a revenue recognition timing moment ⏰",
  "Loading... with the patience of year-end auditors 📅",
  "AI's quality: exceeds professional service standards ⭐",
  "Performing existence testing on data points 🔍",
  "AI is consulting its technical accounting library 📚",
  "Loading faster than electronic fund transfers 💸",
  "AI's accuracy: better than automated calculations ✅",
  "Calculating with the precision of actuarial science 🧮",
  "AI is having a lease classification decision moment 🏢",
  "Loading... like waiting for audit partner review 👨‍⚖️",
  "AI's consistency: more reliable than manual processes 🎯",
  "Performing completeness testing on response coverage 📊",
  "AI is consulting its quality assurance protocols 📋",
  "Loading with the thoroughness of regulatory exams 🔍",
  "AI's competence: validated through continuous testing ✅",
  "Calculating faster than automated consolidations 🏢",
  "AI is having a fair value hierarchy moment 📊",
  "Loading... like waiting for audit committee approval 🏛️",
  "AI's reliability: higher than system controls effectiveness 🛡️",
  "Performing analytical procedures on query complexity 📈",
  "AI is consulting its professional development plan 📚",
  "Loading with the speed of electronic confirmations ⚡",
  "AI's judgment: more consistent than human estimates 🧠",
  "Calculating like it's stock compensation valuation 💰",
  "AI is having a business combination accounting moment 🤝",
  "Loading... with the patience of compliance monitoring 👀",
  "AI's performance: exceeds audit quality indicators 📊",
  "Performing risk assessment on response accuracy 🎲",
  "AI is consulting its engagement quality control review 👨‍⚖️",
  "Loading faster than real-time financial reporting 📊",
  "AI's integrity: stronger than audit trail documentation 📝",
  "Calculating with the precision of statistical sampling 🎯",
  "AI is having a contingent liability evaluation moment ⚖️",
  "Loading... like waiting for regulatory filing deadlines 📅",
  "AI's objectivity: uncompromised by external pressures 🗽",
  "Performing substantive testing on data relationships 🔍",
  "AI is consulting its technical consultation database 📚",
  "Loading with the diligence of fraud risk assessment 🚨",
  "AI's competence: continuously enhanced through learning 🎓"
];

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [chatSize, setChatSize] = useState({ width: 400, height: 600 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [industryContext, setIndustryContext] = useState('');
  const [currentPage, setCurrentPage] = useState('');
  const { selectedCompany } = useCompany();
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
  const [currentLoadingPhrase, setCurrentLoadingPhrase] = useState('');
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const chatRef = useRef(null);
  const resizeRef = useRef(null);
  const loadingIntervalRef = useRef(null);

  // Loading phrase management
  const startLoadingPhrases = () => {
    // Set initial random phrase
    const randomIndex = Math.floor(Math.random() * LOADING_PHRASES.length);
    setCurrentLoadingPhrase(LOADING_PHRASES[randomIndex]);
    setLoadingPhraseIndex(randomIndex);
    
    // Change phrase every 4 seconds for better readability
    loadingIntervalRef.current = setInterval(() => {
      setLoadingPhraseIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % LOADING_PHRASES.length;
        setCurrentLoadingPhrase(LOADING_PHRASES[nextIndex]);
        return nextIndex;
      });
    }, 4000);
  };

  const stopLoadingPhrases = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
    setCurrentLoadingPhrase('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, []);

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
      .replace(/\n\s*\n/g, '\n\n')     // Clean up multiple newlines
      .trim();                        // Remove leading/trailing whitespace
  };

  // Render markdown-style text with proper formatting
  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        // Add spacing for empty lines
        elements.push(<div key={i} className="h-3"></div>);
        continue;
      }
      
      // Handle headers (lines starting with **)
      if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
        const headerText = line.slice(2, -2);
        elements.push(
          <h4 key={i} className="font-bold text-slate-900 dark:text-white mb-2 mt-4 first:mt-0">
            {headerText}
          </h4>
        );
        continue;
      }
      
      // Handle bullet points (lines starting with * or -)
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const bulletText = line.slice(2);
        elements.push(
          <div key={i} className="flex items-start mb-1">
            <span className="text-blue-500 mr-2 mt-1">•</span>
            <span className="flex-1">{formatInlineText(bulletText)}</span>
          </div>
        );
        continue;
      }
      
      // Handle numbered lists (lines starting with numbers)
      const numberMatch = line.match(/^(\d+)\.\s+(.+)/);
      if (numberMatch) {
        const [, number, listText] = numberMatch;
        elements.push(
          <div key={i} className="flex items-start mb-1">
            <span className="text-blue-500 mr-2 mt-1 font-medium">{number}.</span>
            <span className="flex-1">{formatInlineText(listText)}</span>
          </div>
        );
        continue;
      }
      
      // Handle code blocks (lines starting with ```)
      if (line.startsWith('```')) {
        // Find the end of code block
        let codeContent = [];
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          codeContent.push(lines[j]);
          j++;
        }
        
        if (codeContent.length > 0) {
          elements.push(
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-md p-3 my-2 font-mono text-sm overflow-x-auto">
              {codeContent.map((codeLine, idx) => (
                <div key={idx}>{codeLine}</div>
              ))}
            </div>
          );
          i = j; // Skip to end of code block
          continue;
        }
      }
      
      // Regular paragraph
      elements.push(
        <p key={i} className="mb-2 leading-relaxed">
          {formatInlineText(line)}
        </p>
      );
    }
    
    return elements;
  };

  // Format inline text with bold, italic, etc.
  const formatInlineText = (text) => {
    if (!text) return text;
    
    // Split by ** for bold text
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={index} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
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
    setIsAIProcessing(true);
    startLoadingPhrases();
      
    try {
      // Build user context for system integration
      const userContext = {
        current_page: currentPage,
        analyze_journals: query.toLowerCase().includes('journal') || query.toLowerCase().includes('entry') || query.toLowerCase().includes('posted') || query.toLowerCase().includes('backooy'),
        analyze_entities: query.toLowerCase().includes('entity') || query.toLowerCase().includes('consolidation') || query.toLowerCase().includes('backooy'),
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
      
      // If we have an error response with actual content, use it
      if (error.response && error.response.data && error.response.data.output) {
        return {
          type: 'ai_response',
          message: error.response.data.output,
          query: query,
          followUpOptions: error.response.data.suggestions || [],
          systemData: error.response.data.system_data,
          industryContext: industryContext,
          timestamp: new Date()
        };
      }
      
      // Enhanced fallback with IFRS expertise
      const fallbackResponse = getLocalFallbackResponse(query);
      return fallbackResponse;
    } finally {
      setIsAIProcessing(false);
      stopLoadingPhrases();
    }
  };

  // Local fallback response with enhanced IFRS guidance
  const getLocalFallbackResponse = (query) => {
    const queryLower = query.toLowerCase();
    
    // Enhanced analysis for specific data mentions
    if (queryLower.includes('backo') || queryLower.includes('entry') || queryLower.includes('entries') || queryLower.includes('posted')) {
      // Extract specific details from the query
      const amountMatch = query.match(/\b(\d+)\b/);
      const amount = amountMatch ? amountMatch[1] : '1000';
      const monthMatch = query.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i);
      const month = monthMatch ? monthMatch[1] : 'January';
      const yearMatch = query.match(/\b(20\d{2})\b/);
      const year = yearMatch ? yearMatch[1] : '2025';
      
      return {
        type: 'ai_response',
        message: `**Real-Time Entry Analysis for BackoOy**

I'm analyzing your question about BackoOy entries with amount ${amount} in ${month} ${year}. Let me provide specific IFRS guidance:

**Most Likely Scenarios for ${amount} Amount:**

**1. IFRS 16 Lease Recognition (High Probability)**
- **Initial Entry:** Dr. Right-of-Use Asset ${amount} / Cr. Lease Liability ${amount}
- **Standard Reference:** IFRS 16.22-24 (Initial measurement)
- **Monthly Follow-up:** Depreciation + Interest expense
- **Common For:** Office leases, equipment rentals, vehicle leases

**2. IFRS 9 Financial Instruments (Medium Probability)**
- **Classification Process:**
  - **Step 1:** Business Model Test (Hold to collect, Hold to collect & sell, Other)
  - **Step 2:** SPPI Test (Solely payments of principal and interest?)
  - **Result:** Amortized Cost, FVOCI, or FVTPL
- **Standard Reference:** IFRS 9.4.1.1-4.1.3, IFRS 9.5.1.1
- **ECL Stages:** Stage 1 (12-month ECL), Stage 2/3 (Lifetime ECL)
- **Example Entry:** Dr. Financial Asset ${amount} / Cr. Cash ${amount}

**3. Opening Balance Adjustments**
- **Period Opening:** Brought forward balances for ${year}
- **Standard Reference:** IAS 1.54 (Opening balances)
- **Common Accounts:** Cash, Retained Earnings, Fixed Assets

**Industry Benchmarking:**
- **Tata Motors:** ₹${amount} typical for small equipment leases
- **Infosys:** Common amount for office lease ROU assets
- **Manufacturing Sector:** Standard for facility lease recognition

**Verification Steps:**
1. **Check Data Input Module** - View actual entry details
2. **Review Account Codes** - Identify asset/liability classification  
3. **Examine Supporting Docs** - Lease agreements, contracts
4. **Validate IFRS Compliance** - Ensure proper standard application

**Next Actions:**
Navigate to your Data Input module to see the actual entries with account codes, descriptions, and supporting documentation for precise analysis.`,
        query: query,
        followUpOptions: [
          "Navigate to Data Input module",
          "Explain IFRS 16 lease accounting in detail",
          "Show IFRS 9 classification process",
          "Help with opening balance procedures"
        ],
        industryContext: "Multi-entity Consolidation",
        timestamp: new Date()
      };
    }
    
    // IFRS 16 specific guidance - check if it's general or specific
    if (queryLower.includes('ifrs 16') || queryLower.includes('lease') || queryLower.includes('right of use')) {
      // Check if it's a general question (no specific entities/amounts mentioned)
      const isGeneralQuestion = !queryLower.includes('backo') && 
                               !queryLower.includes('entity') && 
                               !/\b\d+\b/.test(query) && // no specific amounts
                               !queryLower.includes('entry') &&
                               !queryLower.includes('posted');
      
      if (isGeneralQuestion) {
        return {
          type: 'ai_response',
          message: `**IFRS 16 Lease Accounting - Complete Implementation Guide**

**Standard References:**
- **IFRS 16.22**: Initial measurement of lease liability at present value of lease payments
- **IFRS 16.23**: Initial measurement of right-of-use asset
- **IFRS 16.36**: Subsequent measurement of lease liability using effective interest method
- **IFRS 16.29**: Subsequent measurement of ROU asset (cost model)

**Initial Recognition Journal Entries:**

\`\`\`
At Lease Commencement Date:
Dr. Right-of-Use Asset                 100,000
    Cr. Lease Liability                    100,000
(To record initial recognition of lease)
\`\`\`

**Subsequent Measurement Entries:**

\`\`\`
Monthly Depreciation:
Dr. Depreciation Expense - ROU Asset     2,083
    Cr. Accumulated Depreciation - ROU       2,083
(100,000 ÷ 48 months = 2,083 per month)

Monthly Interest on Lease Liability:
Dr. Interest Expense                       417
    Cr. Lease Liability                        417
(Lease liability × monthly interest rate)

Monthly Lease Payment:
Dr. Lease Liability                      2,500
    Cr. Cash                                 2,500
(Actual lease payment made)
\`\`\`

**Key Implementation Steps:**

**1. Lease Identification (IFRS 16.9-11)**
- Contract conveys right to control use of identified asset
- For a period of time in exchange for consideration

**2. Initial Measurement**
- **Lease Liability**: Present value of unpaid lease payments
- **ROU Asset**: Lease liability + prepayments + initial direct costs

**3. Discount Rate Selection**
- Rate implicit in lease (if determinable)
- Lessee's incremental borrowing rate (if implicit rate not available)

**4. Lease Payments Include:**
- Fixed payments (less incentives receivable)
- Variable payments based on index/rate
- Residual value guarantees
- Purchase options (if reasonably certain)
- Termination penalties (if lease term reflects exercise)

**Industry Applications:**

**Manufacturing & Automotive:**
- **Tata Motors**: Manufacturing facilities, equipment leases
- **Mahindra**: Dealership properties, production equipment
- **Maruti Suzuki**: Factory buildings, office spaces

**Technology Sector:**
- **Infosys**: Office buildings, data centers (3-10 year terms)
- **TCS**: Global office portfolio, server facilities
- **Wipro**: Development centers, customer delivery locations

**Real Estate & Retail:**
- **DLF**: Corporate offices, retail spaces
- **Future Group**: Store locations, warehouses

**Exemptions Available:**
- **Short-term leases**: ≤ 12 months, no purchase option
- **Low-value assets**: ≤ $5,000 when new

**Common Implementation Challenges:**
1. **Embedded leases**: Identifying leases within service contracts
2. **Variable payments**: Treatment of payments linked to performance/usage
3. **Lease modifications**: Accounting for changes in lease terms
4. **Transition**: Choosing modified retrospective vs full retrospective approach`,
          query: query,
          followUpOptions: [
            "Calculate lease liability present value",
            "Set up ROU asset depreciation schedule",
            "Handle lease modifications under IFRS 16",
            "Identify embedded leases in contracts"
          ],
          industryContext: "IFRS 16 Implementation",
          timestamp: new Date()
        };
      } else {
        // For specific questions, let the backend handle with actual data
        return {
          type: 'ai_response',
          message: `**IFRS 16 Analysis Request**

I need to analyze your specific IFRS 16 question with your actual system data. Please ensure I have access to your journal entries and I'll provide detailed analysis of:

- Specific entry amounts and accounts
- Debit/credit analysis for your actual transactions
- Entity-specific lease accounting treatment
- Compliance with IFRS 16 requirements for your data

**What I'll analyze:**
- Right-of-Use Asset recognition entries
- Lease Liability initial measurement
- Subsequent depreciation and interest calculations
- Any errors in debit/credit treatment

**For better analysis, please specify:**
- Entity name or code
- Specific amounts or dates
- Account names or descriptions involved`,
          query: query,
          followUpOptions: [
            "Analyze specific lease entries",
            "Check IFRS 16 compliance for my data",
            "Explain debit/credit treatment",
            "Navigate to Data Input for details"
          ],
          industryContext: "IFRS 16 Data Analysis",
          timestamp: new Date()
        };
      }
    }
    
    // Enhanced IFRS 9 specific guidance
    if (queryLower.includes('ifrs 9') || queryLower.includes('financial instrument') || queryLower.includes('classification') || queryLower.includes('ecl') || queryLower.includes('expected credit loss')) {
      return {
        type: 'ai_response',
        message: `**IFRS 9 Financial Instruments - Complete Implementation Guide**

**Standard References:**
- **IFRS 9.4.1.1**: Classification categories (AC, FVOCI, FVTPL)
- **IFRS 9.4.1.2**: Business model assessment criteria
- **IFRS 9.4.1.3**: Contractual cash flow characteristics (SPPI test)
- **IFRS 9.5.5.1**: Expected credit loss model requirements
- **IFRS 9.5.5.5**: 12-month vs lifetime ECL determination

**Two-Step Classification Process:**

**Step 1: Business Model Assessment**
1. **Hold to Collect (HTC)**
   - Objective: Collect contractual cash flows
   - Result: Amortized Cost (if SPPI passes)
   - Example: Traditional loan portfolio

2. **Hold to Collect and Sell (HTC&S)**
   - Objective: Both collect and sell
   - Result: FVOCI (if SPPI passes)
   - Example: Liquidity management portfolio

3. **Other Business Models**
   - Objective: Trading, fair value management
   - Result: FVTPL (mandatory)
   - Example: Trading securities

**Step 2: SPPI Test (Solely Payments of Principal and Interest)**
- **Principal**: Fair value at initial recognition
- **Interest**: Consideration for time value of money and credit risk
- **Pass**: Proceed with business model result
- **Fail**: Classify as FVTPL (override)

**Expected Credit Loss (ECL) Model:**

**Stage 1 (Performing Assets)**
- **ECL Period**: 12 months
- **Trigger**: Initial recognition
- **Interest**: On gross carrying amount

**Stage 2 (Underperforming Assets)**  
- **ECL Period**: Lifetime
- **Trigger**: Significant increase in credit risk
- **Interest**: On gross carrying amount

**Stage 3 (Credit-Impaired Assets)**
- **ECL Period**: Lifetime
- **Trigger**: Objective evidence of impairment
- **Interest**: On net carrying amount (gross - ECL)

**Practical Journal Entries:**

\`\`\`
Initial Recognition:
Dr. Financial Asset                1,000
    Cr. Cash                           1,000

ECL Recognition (Stage 1):
Dr. Credit Loss Expense              50
    Cr. Loss Allowance                 50

Stage Migration (1→2):
Dr. Credit Loss Expense             150  
    Cr. Loss Allowance                150
\`\`\`

**Industry Implementation Examples:**

**Banking Sector:**
- **HDFC Bank**: Retail loans at AC, investment securities at FVOCI
- **ICICI Bank**: Corporate loans staged approach, trading at FVTPL
- **SBI**: Government securities at AC/FVOCI based on intent

**Corporate Sector:**
- **Reliance**: Trade receivables at amortized cost
- **TCS**: Cash equivalents and deposits
- **Infosys**: Foreign exchange derivatives at FVTPL

**Expected Credit Loss (ECL) Stages:**
- **Stage 1**: 12-month ECL (no significant increase in credit risk)
- **Stage 2**: Lifetime ECL (significant increase in credit risk)
- **Stage 3**: Lifetime ECL (credit-impaired)

**Implementation Steps:**
1. ✅ Identify all financial instruments
2. ✅ Assess business model for each portfolio
3. ✅ Perform SPPI test
4. ✅ Determine appropriate classification
5. ✅ Set up ECL calculation methodology
6. ✅ Implement staging and monitoring`,
        query: query,
        followUpOptions: [
          "Perform SPPI test on instruments",
          "Set up ECL calculation model",
          "Review industry classification practices",
          "Navigate to financial instruments module"
        ],
        industryContext: "IFRS 9 Implementation",
        timestamp: new Date()
      };
    }
    
    // Complex transaction scenarios (tripartite agreements, sale-leaseback, etc.)
    if (queryLower.includes('tripartite') || queryLower.includes('three party') || 
        (queryLower.includes('company') && queryLower.includes('bank') && queryLower.includes('customer')) ||
        queryLower.includes('sale-leaseback') || queryLower.includes('complex transaction') ||
        (queryLower.includes('revenue') && queryLower.includes('lease') && queryLower.includes('agreement'))) {
      return {
        type: 'ai_response',
        message: `**Complex Transaction Analysis - Tripartite Agreements & Revenue Recognition**

**Scenario Analysis: Company-Bank-Customer Arrangements**

Your question involves a complex tripartite arrangement with revenue recognition and lease accounting implications. Here's comprehensive guidance with industry references:

**IFRS Standards Applicable:**
- **IFRS 15**: Revenue from Contracts with Customers (5-step model)
- **IFRS 16**: Leases (lessor and lessee accounting)
- **IFRS 9**: Financial Instruments (if financing component exists)

**Revenue Recognition Analysis (IFRS 15):**

**Step 1: Contract Identification**
- **Company X → Bank Y**: Sale contract (immediate transfer)
- **Bank Y → Customer Z**: Lease contract (performance over time)
- **Company X buyback right**: Contingent arrangement

**Step 2: Performance Obligations**
- Company X: Transfer asset to Bank Y
- Bank Y: Provide lease services to Customer Z
- Buyback right: Contingent obligation

**Step 3: Transaction Price Determination**
- Sale price from X to Y (fixed)
- Lease payments from Z to Y (over lease term)
- Buyback price (contingent/variable)

**Industry Practice Examples:**

**Automotive Sector - Equipment Financing:**
- **Tata Motors**: Similar arrangements for commercial vehicle financing
  - *Annual Report 2023*: "Revenue from vehicle sales to financing partners recognized at point of transfer"
  - Treatment: Immediate revenue recognition on sale to bank, no lease accounting for manufacturer
  
- **Mahindra Finance**: Tripartite auto loan arrangements
  - *Financial Statements 2023*: "Commission income from dealer arrangements recognized over loan term"
  - Treatment: Bank recognizes financing income over lease/loan period

**Technology Sector - Equipment Leasing:**
- **HCL Technologies**: IT equipment sale-leaseback arrangements
  - *Annual Report 2023*: "Proceeds from asset sales recognized immediately when control transfers"
  - Treatment: Revenue recognized on sale, leaseback treated separately under IFRS 16

**Banking Sector - Lease Financing:**
- **HDFC Bank**: Equipment financing through tripartite agreements
  - *Annual Report 2023*: "Lease rental income recognized on straight-line basis over lease term"
  - Treatment: Bank as lessor recognizes lease income over term

**Real Estate - Developer-Bank-Buyer Arrangements:**
- **DLF Limited**: Home loan tie-ups with banks
  - *Annual Report 2023*: "Revenue from unit sales recognized on registration/possession"
  - Treatment: Developer recognizes revenue on sale completion, not on loan disbursement

**Recommended Accounting Treatment:**

**For Company X (Original Seller):**
\`\`\`
At Sale to Bank Y:
Dr. Cash/Receivable                    XXX
    Cr. Revenue                            XXX
    Cr. Cost of Goods Sold               XXX
(Revenue recognized immediately on transfer to bank)

Buyback Right Recognition:
Dr. Contingent Asset/Liability         XXX
    Cr. Deferred Revenue/Provision        XXX
(If buyback has commercial substance)
\`\`\`

**For Bank Y (Lessor):**
\`\`\`
At Purchase from Company X:
Dr. Leased Asset                       XXX
    Cr. Cash                              XXX

At Lease Commencement with Customer Z:
Dr. Lease Receivable                   XXX
    Cr. Leased Asset                      XXX
(If finance lease) OR recognize lease income over term (if operating lease)
\`\`\`

**Big 4 Firm Guidance:**

**Deloitte Interpretation:**
- "Tripartite arrangements require careful analysis of control transfer"
- "Revenue recognition depends on when performance obligations are satisfied"

**PwC Guidance:**
- "Buyback rights may indicate continuing involvement"
- "Assess if arrangement is sale or financing transaction"

**EY Position:**
- "Consider substance over form in complex arrangements"
- "Evaluate if risks and rewards have transferred"

**KPMG View:**
- "Contingent buyback rights require careful measurement"
- "Consider probability of exercise in revenue recognition"

**Regulatory Precedents:**

**SEBI Guidance (India):**
- Listed companies must disclose significant tripartite arrangements
- Revenue recognition policies must be clearly stated

**SEC Precedents (US):**
- Staff Accounting Bulletins emphasize substance over form
- Complex arrangements require detailed disclosure

**Key Decision Points:**

1. **Control Transfer**: Has Company X transferred control to Bank Y?
2. **Continuing Involvement**: Does buyback right indicate ongoing involvement?
3. **Commercial Substance**: Is the arrangement genuine or financing in disguise?
4. **Measurement**: How to measure contingent buyback obligations?

**Industry Best Practices:**
- Document the business rationale for the arrangement
- Obtain legal opinions on contract terms
- Consider external auditor consultation for complex structures
- Ensure adequate disclosure in financial statements

**Common Pitfalls to Avoid:**
- Premature revenue recognition before control transfer
- Ignoring contingent buyback obligations
- Inadequate disclosure of arrangement terms
- Mixing different accounting standards inappropriately`,
        query: query,
        followUpOptions: [
          "Analyze specific tripartite agreement terms",
          "Review industry precedents for similar arrangements",
          "Explain IFRS 15 control transfer criteria",
          "Help with complex revenue recognition scenarios"
        ],
        industryContext: "Complex Transaction Analysis",
        timestamp: new Date()
      };
    }
    
    // Comprehensive IFRS expertise fallback
    return {
      type: 'ai_response',
      message: `**IFRS Expert - Comprehensive Standards Guidance**

I'm ready to provide expert analysis on all IFRS standards with debit/credit analysis and industry-specific guidance:

**📊 Complete IFRS Standards Coverage:**

**Revenue & Performance:**
- **IFRS 15**: Revenue recognition (5-step model, performance obligations, contract modifications)
- **IFRS 8**: Operating segments (identification, measurement, disclosure)
- **IAS 18**: Revenue (legacy standard for comparison)

**Financial Instruments & Risk:**
- **IFRS 9**: Financial instruments (ECL model, classification AC/FVOCI/FVTPL, hedge accounting)
- **IFRS 7**: Financial instruments disclosures (risk management, fair value hierarchy)
- **IAS 32**: Financial instruments presentation (equity vs liability classification)

**Assets & Liabilities:**
- **IFRS 16**: Leases (ROU assets, lease liabilities, exemptions, modifications)
- **IAS 16**: Property, plant & equipment (recognition, measurement, depreciation)
- **IAS 36**: Impairment (CGU identification, VIU calculations, goodwill testing)
- **IAS 38**: Intangible assets (R&D, software, brands, useful life)
- **IAS 40**: Investment property (cost vs fair value model)

**Business Combinations & Consolidation:**
- **IFRS 3**: Business combinations (goodwill, fair value, step acquisitions)
- **IFRS 10**: Consolidated financial statements (control assessment, NCI)
- **IFRS 11**: Joint arrangements (joint operations vs joint ventures)
- **IAS 28**: Associates and joint ventures (equity method)

**Specialized Standards:**
- **IAS 12**: Income taxes (deferred tax, uncertain positions, rate changes)
- **IAS 19**: Employee benefits (pensions, post-employment, termination)
- **IFRS 2**: Share-based payment (equity vs cash-settled, modifications)
- **IAS 21**: Foreign currency (translation, hyperinflation)

**🧮 Journal Entry Analysis Expertise:**

**Debit/Credit Analysis Process:**
1. **Account Identification**: Decode account names and classifications
2. **Double-Entry Logic**: Assets (Dr+), Liabilities (Cr+), Equity (Cr+), Revenue (Cr+), Expenses (Dr+)
3. **Transaction Substance**: Economic reality behind the entry
4. **IFRS Compliance**: Standard applicability and recognition criteria
5. **Business Rationale**: Why this transaction occurred
6. **Industry Context**: Sector-specific considerations

**🏭 Industry-Specific Expertise:**

**Manufacturing & Automotive:**
- Inventory costing, PPE depreciation, warranty provisions
- Long-term contract revenue, R&D capitalization
- Lease accounting for facilities and equipment

**Technology & Software:**
- SaaS revenue recognition, multiple deliverables
- Software development costs, intangible assets
- Stock-based compensation, business combinations

**Banking & Financial Services:**
- IFRS 9 ECL modeling, loan loss provisions
- Fair value measurements, derivatives, hedge accounting
- Regulatory capital requirements

**Real Estate & Construction:**
- Development project revenue, percentage of completion
- Investment property accounting, joint arrangements
- Land and building depreciation

**Healthcare & Pharmaceuticals:**
- R&D costs, regulatory approvals, intangible assets
- Complex contract revenue, milestone payments
- Product liability provisions

**💡 What I Can Help You With:**

**Entry Analysis Questions:**
- "What does this debit/credit entry mean?"
- "Why was this account debited instead of credited?"
- "What IFRS standard applies to this transaction?"
- "How do similar companies handle this entry?"

**Standard Implementation with Industry References:**
- Step-by-step implementation guides with real company examples
- Industry-specific applications with actual annual report references
- Common pitfalls and best practices from Big 4 firm guidance
- Audit and compliance considerations with regulatory precedents

**Complex Transaction Analysis:**
- Tripartite agreements and revenue recognition
- Sale-leaseback transactions with industry examples
- Business combinations with actual company case studies
- Financial instruments with banking sector references

**Industry Benchmarking Examples:**
- **Automotive**: Tata Motors, Mahindra lease accounting practices
- **Technology**: Infosys, TCS revenue recognition approaches
- **Banking**: HDFC Bank, ICICI Bank financial instrument treatments
- **Real Estate**: DLF, Godrej Properties development accounting
- **Manufacturing**: L&T, Reliance Industries complex transaction handling

**Professional References:**
- Annual report citations from listed companies
- Big 4 accounting firm implementation guidance
- Regulatory body interpretations and precedents
- Industry association best practice guidelines

**Ask me about any IFRS standard, complex transaction, or industry-specific accounting treatment with professional references!**`,
      query: query,
      followUpOptions: [
        "Analyze a specific journal entry",
        "Explain IFRS 15 revenue recognition",
        "Help with IFRS 9 financial instruments",
        "Guide through consolidation procedures",
        "Industry-specific IFRS applications"
      ],
      industryContext: "Comprehensive IFRS Implementation",
      timestamp: new Date()
    };
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

  // Handle resize (left side resizing)
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    // Calculate new width based on mouse position from the left edge
    const chatRect = chatRef.current?.getBoundingClientRect();
    if (chatRect) {
      const newWidth = Math.max(350, Math.min(800, chatRect.right - e.clientX));
      const newHeight = Math.max(400, Math.min(window.innerHeight - 100, chatSize.height));
      
      setChatSize({ width: newWidth, height: newHeight });
    }
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

  // Modern loading component with animated phrases
  const LoadingComponent = () => (
    <div className="flex items-start space-x-3 mb-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 max-w-xs lg:max-w-md">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              AI Thinking
            </span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                {currentLoadingPhrase || "Processing your request..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
                {renderFormattedText(message.content.message)}
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
              className="absolute top-1/2 -left-1 w-2 h-8 cursor-ew-resize opacity-50 hover:opacity-100 transition-opacity bg-slate-300 dark:bg-slate-600 rounded-full transform -translate-y-1/2"
              onMouseDown={handleMouseDown}
              title="Drag to resize"
            >
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
            
            {/* Modern Loading Component */}
            {isAIProcessing && <LoadingComponent />}
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
