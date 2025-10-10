
import React, { useMemo, useState } from 'react'
import {
  Users,
  UserPlus,
  ClipboardList,
  IdCard,
  CloudDownload,
  Wallet,
  ShieldCheck,
  Target,
  BarChart3,
  Clock,
  HeartPulse,
  Workflow,
  Sparkles,
  CheckCircle2,
  GitBranch,
  Calendar,
  Briefcase,
  PieChart,
  Activity,
  Zap,
  Bell,
  Layers,
  Database,
  FileText
} from 'lucide-react'

const accentClassMap = {
  indigo: {
    badge: 'bg-indigo-100 dark:bg-indigo-500/10',
    icon: 'text-indigo-600 dark:text-indigo-300'
  },
  emerald: {
    badge: 'bg-emerald-100 dark:bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-300'
  },
  violet: {
    badge: 'bg-violet-100 dark:bg-violet-500/10',
    icon: 'text-violet-600 dark:text-violet-300'
  },
  amber: {
    badge: 'bg-amber-100 dark:bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-300'
  }
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)

const StatCard = ({ icon: Icon, title, value, change, accent = 'indigo' }) => {
  const classes = accentClassMap[accent] || accentClassMap.indigo

  return (
    <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold'>{title}</p>
          <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-white'>{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${classes.badge}`}>
          <Icon className={`h-5 w-5 ${classes.icon}`} />
        </div>
      </div>
      {change && (
        <p className='mt-4 text-sm text-slate-500 dark:text-slate-400'>
          <span className={`font-medium ${change.direction === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
            {change.value}
          </span>{' '}
          {change.label}
        </p>
      )}
    </div>
  )
}

const Section = ({ title, description, icon: Icon, children }) => (
  <section className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6'>
    <div className='flex items-center gap-3'>
      <div className='h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-300'>
        <Icon className='h-6 w-6' />
      </div>
      <div>
        <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>{title}</h2>
        {description && <p className='text-sm text-slate-500 dark:text-slate-400'>{description}</p>}
      </div>
    </div>
    {children}
  </section>
)
const employees = [
  {
    id: 'EMP-1001',
    name: 'Ava Thompson',
    role: 'Senior Financial Analyst',
    department: 'Finance and Analytics',
    manager: 'Liam Patel',
    status: 'Active',
    location: 'New York, USA',
    startDate: '2019-04-12',
    personal: {
      email: 'ava.thompson@example.com',
      phone: '(212) 555-1234',
      emergencyContact: 'Michael Thompson (Brother)',
      address: '120 Hudson Street, New York, NY'
    },
    employment: {
      type: 'Full-Time',
      history: ['Financial Analyst (2019)', 'Senior Financial Analyst (2022)'],
      documents: [
        { name: 'Employment Contract', status: 'Valid' },
        { name: 'W-4 2025', status: 'Valid' }
      ]
    },
    benefits: ['Health: Platinum PPO', '401k: 6 percent match', 'Equity: RSU Level 3']
  },
  {
    id: 'EMP-1018',
    name: 'Noah Williams',
    role: 'People Operations Lead',
    department: 'Human Resources',
    manager: 'Sofia Hernandez',
    status: 'Active',
    location: 'Austin, USA',
    startDate: '2021-01-03',
    personal: {
      email: 'noah.williams@example.com',
      phone: '(737) 555-7821',
      emergencyContact: 'Emily Williams (Spouse)',
      address: '48 Barton Springs Road, Austin, TX'
    },
    employment: {
      type: 'Full-Time',
      history: ['HR Specialist (2021)', 'People Ops Lead (2023)'],
      documents: [
        { name: 'Employment Contract', status: 'Valid' },
        { name: 'I-9 Verification', status: 'Valid' }
      ]
    },
    benefits: ['Health: Gold HMO', '401k: 5 percent match', 'Flex Plan: 1500 USD']
  },
  {
    id: 'EMP-1072',
    name: 'Sophia Chen',
    role: 'Lead Software Engineer',
    department: 'Product and Engineering',
    manager: 'Amelia Rossi',
    status: 'Active',
    location: 'Remote - Singapore',
    startDate: '2018-07-19',
    personal: {
      email: 'sophia.chen@example.com',
      phone: '+65 5550 2222',
      emergencyContact: 'Wei Chen (Father)',
      address: 'Marina Boulevard, Singapore'
    },
    employment: {
      type: 'Full-Time',
      history: ['Software Engineer (2018)', 'Senior Engineer (2020)', 'Lead Engineer (2023)'],
      documents: [
        { name: 'Employment Contract', status: 'Valid' },
        { name: 'Work Pass', status: 'Renewal Due' }
      ]
    },
    benefits: ['Health: International Plan', 'Retirement: CPF', 'Equity: RSU Level 4']
  }
]

const payrollCycles = [
  {
    id: 'PAY-2025-09',
    period: 'September 2025',
    status: 'Completed',
    processedOn: 'Sep 28, 2025',
    employees: 418,
    gross: 2860000,
    tax: 742500,
    net: 2017500,
    directDeposit: 0.97,
    notes: 'Includes retention bonuses for engineering and contractor overtime.'
  },
  {
    id: 'PAY-2025-10',
    period: 'October 2025',
    status: 'In Progress',
    processedOn: 'Oct 29, 2025',
    employees: 422,
    gross: 2895000,
    tax: 756250,
    net: 2058750,
    directDeposit: 0.99,
    notes: 'Awaiting final approvals for professional services overtime and new hire bonuses.'
  }
]

const leaveRequests = [
  {
    id: 'LV-2045',
    employee: 'Sophia Chen',
    type: 'Vacation Leave',
    duration: 'Nov 3 to Nov 14',
    days: 8,
    status: 'Approved',
    approver: 'Amelia Rossi'
  },
  {
    id: 'LV-2056',
    employee: 'Mateo Silva',
    type: 'Medical Leave',
    duration: 'Oct 1 to Oct 31',
    days: 22,
    status: 'In Progress',
    approver: 'Olivia Park'
  },
  {
    id: 'LV-2093',
    employee: 'Ivy Kapoor',
    type: 'Remote Work',
    duration: 'Oct 21 to Oct 25',
    days: 5,
    status: 'Pending',
    approver: 'Pending'
  }
]

const holidayCalendar = [
  { date: 'Nov 28, 2025', name: 'Thanksgiving Day', regions: ['United States'] },
  { date: 'Dec 25, 2025', name: 'Christmas Day', regions: ['Global'] },
  { date: 'Jan 1, 2026', name: 'New Year', regions: ['Global'] },
  { date: 'Jan 26, 2026', name: 'Republic Day', regions: ['India'] }
]
const benefitPrograms = [
  {
    name: 'Health and Wellness',
    provider: 'BlueShield Global',
    coverage: 'Medical, Dental, Vision',
    participation: 0.88,
    renewal: 'Jul 2026',
    integrations: ['Telemedicine', 'Mental Health Coaching', 'Gym Pass']
  },
  {
    name: 'Retirement and Savings',
    provider: 'Fidelity Investments',
    coverage: '401k, Roth 401k, Pension',
    participation: 0.72,
    renewal: 'Jan 2026',
    integrations: ['Payroll Sync', 'Advisor Portal']
  },
  {
    name: 'Equity and Stock Plans',
    provider: 'Morgan Equity Services',
    coverage: 'RSU, ESPP, Stock Options',
    participation: 0.64,
    renewal: 'Mar 2026',
    integrations: ['Equity Portal', 'Tax Withholding Engine']
  }
]

const salaryBands = [
  { band: 'Level 3 Senior Specialist', min: 88000, midpoint: 112000, max: 138000, population: 148 },
  { band: 'Level 4 Principal', min: 128000, midpoint: 164000, max: 198000, population: 64 },
  { band: 'Manager 2', min: 118000, midpoint: 149000, max: 186000, population: 47 }
]

const reimbursements = [
  { id: 'RB-904', employee: 'Ethan Ford', category: 'Travel Client Visit', amount: 1820, submitted: 'Oct 08', status: 'Approved' },
  { id: 'RB-918', employee: 'Lina Gomez', category: 'Remote Work Setup', amount: 640, submitted: 'Oct 14', status: 'Pending' },
  { id: 'RB-925', employee: 'Marcus Lee', category: 'Conference SaaS Summit', amount: 1215, submitted: 'Oct 16', status: 'Processing' }
]

const stockPrograms = [
  { plan: 'RSU Refresh FY25', participants: 186, granted: 42500, vesting: 'Quarterly', nextVest: 'Nov 15, 2025' },
  { plan: 'ESPP Cycle 2025-Q3', participants: 244, granted: 9100, vesting: 'Immediate', nextVest: 'Oct 31, 2025' }
]

const jobOpenings = [
  {
    id: 'JOB-8945',
    title: 'Lead Product Designer',
    department: 'Product and Design',
    openings: 2,
    stage: 'Interviewing',
    recruiter: 'Jordan Mae',
    channels: ['LinkedIn', 'Behance', 'Careers Site']
  },
  {
    id: 'JOB-8972',
    title: 'Enterprise Account Executive - DACH',
    department: 'Sales and Success',
    openings: 1,
    stage: 'Sourcing',
    recruiter: 'Elena Novak',
    channels: ['LinkedIn', 'Indeed', 'Glassdoor']
  },
  {
    id: 'JOB-9010',
    title: 'Data Scientist Risk Analytics',
    department: 'Finance and Analytics',
    openings: 3,
    stage: 'Offer',
    recruiter: 'Marcus Lee',
    channels: ['LinkedIn', 'GitHub Jobs', 'Stack Overflow Talent']
  }
]

const candidateStages = [
  { stage: 'Applied', count: 148, change: '+12%' },
  { stage: 'Screening', count: 62, change: '+8%' },
  { stage: 'Interview', count: 31, change: '+5%' },
  { stage: 'Offer', count: 9, change: '+1%' },
  { stage: 'Hired', count: 6, change: '+2%' }
]

const onboardingJourneys = [
  {
    name: 'Engineering Accelerator',
    duration: '30 days',
    completion: 0.84,
    owner: 'People Operations',
    milestones: ['Security training', 'Dev environment setup', 'Mentor assignment']
  },
  {
    name: 'Global Sales Ramp',
    duration: '45 days',
    completion: 0.72,
    owner: 'Revenue Enablement',
    milestones: ['CRM certification', 'Product bootcamp', 'Regional compliance review']
  }
]

const performanceCycles = [
  {
    name: 'FY25 Mid-Year Review',
    coverage: 'Global',
    status: 'Scoring',
    progress: 0.67,
    dueDate: 'Oct 30, 2025',
    goalsAligned: 312,
    feedbackRequests: 928
  },
  {
    name: 'Leadership 360 Program',
    coverage: 'Directors and above',
    status: 'Feedback Collection',
    progress: 0.54,
    dueDate: 'Nov 12, 2025',
    goalsAligned: 86,
    feedbackRequests: 364
  }
]

const developmentPrograms = [
  {
    name: 'AI and Analytics Academy',
    seats: 35,
    enrolled: 32,
    nextSession: 'Nov 6, 2025',
    impact: 'Upskilling product and finance teams for predictive insights.'
  },
  {
    name: 'Inclusive Leadership Lab',
    seats: 24,
    enrolled: 21,
    nextSession: 'Nov 20, 2025',
    impact: 'Supports cross functional collaboration and retention of top performers.'
  }
]
const compliancePrograms = [
  {
    id: 'CMP-311',
    name: 'SOC 2 HR Controls',
    dueDate: 'Nov 15, 2025',
    owner: 'Compliance Office',
    status: 'On Track',
    scope: ['Access reviews', 'Background checks', 'Termination process']
  },
  {
    id: 'CMP-355',
    name: 'GDPR Workforce Data Mapping',
    dueDate: 'Dec 5, 2025',
    owner: 'Legal and Privacy',
    status: 'At Risk',
    scope: ['Data classification', 'Retention schedule', 'Impact assessments']
  },
  {
    id: 'CMP-362',
    name: 'Year End Payroll Audit',
    dueDate: 'Dec 19, 2025',
    owner: 'Finance Shared Services',
    status: 'In Progress',
    scope: ['Tax reconciliation', 'Overtime review', 'Bonus accruals']
  }
]

const taxCompliance = [
  {
    name: 'US Federal Tax Withholding',
    jurisdiction: 'IRS',
    frequency: 'Monthly',
    status: 'Filed',
    nextDue: 'Nov 15, 2025',
    owner: 'Payroll Compliance'
  },
  {
    name: 'UK PAYE Submission',
    jurisdiction: 'HMRC',
    frequency: 'Monthly',
    status: 'In Progress',
    nextDue: 'Nov 19, 2025',
    owner: 'EMEA Payroll'
  },
  {
    name: 'Singapore CPF and IRAS Filing',
    jurisdiction: 'CPF Board and IRAS',
    frequency: 'Monthly',
    status: 'Filed',
    nextDue: 'Nov 14, 2025',
    owner: 'APAC Payroll'
  }
]

const selfServiceRequests = [
  { id: 'ESS-422', type: 'Personal Information Update', employee: 'Ava Thompson', submitted: 'Oct 11', status: 'Completed' },
  { id: 'ESS-437', type: 'Leave Request', employee: 'Ivy Kapoor', submitted: 'Oct 18', status: 'Manager Review' },
  { id: 'ESS-441', type: 'Expense Claim', employee: 'Liam Patel', submitted: 'Oct 20', status: 'Awaiting Finance' }
]

const automationFlows = [
  {
    name: 'Leave Approval Routing',
    owner: 'People Operations',
    successRate: 0.98,
    averageTime: '1.8 hours',
    automations: ['Slack reminders', 'Manager escalation', 'Payroll balance sync']
  },
  {
    name: 'New Hire Provisioning',
    owner: 'IT and HRIS',
    successRate: 0.94,
    averageTime: '3.2 hours',
    automations: ['Account creation', 'Equipment order', 'Training enrollment']
  },
  {
    name: 'Bonus Payout Authorization',
    owner: 'Finance',
    successRate: 0.91,
    averageTime: '6.4 hours',
    automations: ['Policy validation', 'Tax adjustment', 'Executive approval routing']
  }
]

const timesheetSummary = [
  { project: 'Enterprise Rollout', billable: 142, nonBillable: 26, overtime: 8, utilization: 0.82 },
  { project: 'R and D Innovation Lab', billable: 68, nonBillable: 54, overtime: 0, utilization: 0.56 },
  { project: 'Customer Advisory', billable: 94, nonBillable: 18, overtime: 2, utilization: 0.74 }
]

const analyticsHighlights = [
  {
    title: 'Workforce Composition',
    metric: '24 percent year over year growth',
    insight: 'Retention trending at 92 percent with stable hiring velocity.'
  },
  {
    title: 'Payroll Cost Profile',
    metric: formatCurrency(2860000),
    insight: 'Overtime costs down six percent month over month after policy refresh.'
  },
  {
    title: 'Attendance Health',
    metric: '97.2 percent punctuality',
    insight: 'Automated reminders reduced late check-ins across all regions.'
  }
]

const financialIntegrations = [
  {
    name: 'Global Banking Direct Deposit',
    partners: ['JPMorgan', 'DBS', 'Barclays'],
    status: 'Operational',
    syncFrequency: 'Hourly',
    lastSync: '5 minutes ago'
  },
  {
    name: 'General Ledger Sync',
    partners: ['Oracle NetSuite', 'SAP S4'],
    status: 'Operational',
    syncFrequency: 'Real-time',
    lastSync: '2 minutes ago'
  },
  {
    name: 'Expense Management',
    partners: ['Concur', 'Brex'],
    status: 'Degraded',
    syncFrequency: 'Daily',
    lastSync: '1 hour ago'
  }
]

const hrAlerts = [
  { type: 'info', title: 'Work pass renewal approaching', detail: 'Sophia Chen renewal due Nov 30, 2025.' },
  { type: 'warning', title: 'GDPR mapping flagged', detail: 'Data retention schedule pending legal sign off.' },
  { type: 'success', title: 'Engagement survey closed', detail: 'Participation rate 93 percent and insights published.' }
]
const HRManagementSuite = () => {
  const [activePayroll, setActivePayroll] = useState(payrollCycles[0].id)

  const totalEmployees = employees.length
  const activeEmployees = employees.filter((emp) => emp.status === 'Active').length
  const remoteEmployees = employees.filter((emp) => emp.location.toLowerCase().includes('remote')).length

  const payrollSummary = useMemo(() => {
    const selected = payrollCycles.find((cycle) => cycle.id === activePayroll) || payrollCycles[0]
    return {
      ...selected,
      depositLabel: `${Math.round(selected.directDeposit * 100)} percent via direct deposit`
    }
  }, [activePayroll])

  return (
    <div className='space-y-8'>
      <header className='bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8 shadow-sm'>
        <div className='flex flex-wrap items-center justify-between gap-6'>
          <div>
            <p className='text-sm uppercase tracking-wide text-indigo-500 font-semibold'>Human Resources Command Center</p>
            <h1 className='mt-2 text-3xl font-semibold text-slate-900 dark:text-white'>Enterprise HR Management Suite</h1>
            <p className='mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300'>
              Orchestrate the full employee lifecycle with connected modules for people data, payroll, benefits, recruitment,
              compliance, analytics, and workflow automation. Audit trails, document storage, and secure integrations with finance
              and banking systems keep everything compliant.
            </p>
          </div>
          <div className='flex gap-3 flex-wrap'>
            <button className='inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-5 py-3 text-sm font-medium shadow hover:bg-indigo-500'>
              <Sparkles className='h-4 w-4' />
              Launch Automation
            </button>
            <button className='inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'>
              <CloudDownload className='h-4 w-4' />
              Export Reports
            </button>
          </div>
        </div>
        <div className='mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
          <StatCard
            icon={Users}
            title='Total Workforce'
            value={`${totalEmployees} employees`}
            change={{ value: '+18%', direction: 'up', label: 'Growth year over year across regions' }}
            accent='indigo'
          />
          <StatCard
            icon={Target}
            title='Performance Goals'
            value='312 aligned goals'
            change={{ value: '96%', direction: 'up', label: 'Goal alignment this review cycle' }}
            accent='emerald'
          />
          <StatCard
            icon={Wallet}
            title='Latest Payroll'
            value={formatCurrency(payrollCycles[0].gross)}
            change={{ value: '-4.2%', direction: 'down', label: 'Variance against monthly forecast' }}
            accent='violet'
          />
          <StatCard
            icon={ShieldCheck}
            title='Compliance Health'
            value='92% on track'
            change={{ value: '3 audits', direction: 'up', label: 'Completed this quarter with clean findings' }}
            accent='amber'
          />
        </div>
      </header>
      <Section
        title='1. Employee Information Management'
        description='Centralise personal records, employment history, emergency contacts, and document storage with retention policies.'
        icon={IdCard}
      >
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          <div className='xl:col-span-2 space-y-4'>
            {employees.map((employee) => (
              <div key={employee.id} className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-200 dark:hover:border-indigo-500/40 transition'>
                <div className='flex flex-wrap justify-between gap-4'>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2'>
                      {employee.name}
                      <span className='inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300'>
                        {employee.department}
                      </span>
                    </h3>
                    <p className='text-sm text-slate-500 dark:text-slate-400'>
                      {employee.role} - reports to {employee.manager} - {employee.location}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs uppercase text-slate-500 dark:text-slate-400'>Status</p>
                    <p className='text-sm font-medium text-emerald-500'>{employee.status}</p>
                    <p className='text-xs text-slate-400 dark:text-slate-500'>Joined {new Date(employee.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-3'>
                  <div className='bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4'>
                    <p className='text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2'>Personal Details</p>
                    <ul className='space-y-1 text-sm text-slate-600 dark:text-slate-300'>
                      <li>Email: {employee.personal.email}</li>
                      <li>Phone: {employee.personal.phone}</li>
                      <li>Emergency: {employee.personal.emergencyContact}</li>
                      <li>Address: {employee.personal.address}</li>
                    </ul>
                  </div>
                  <div className='bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4'>
                    <p className='text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2'>Employment History</p>
                    <ul className='space-y-1 text-sm text-slate-600 dark:text-slate-300'>
                      <li>Type: {employee.employment.type}</li>
                      {employee.employment.history.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className='bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4'>
                    <p className='text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2'>Document Vault</p>
                    <ul className='space-y-1 text-sm text-slate-600 dark:text-slate-300'>
                      {employee.employment.documents.map((doc) => (
                        <li key={doc.name} className='flex items-center justify-between'>
                          <span>{doc.name}</span>
                          <span className={`text-xs font-medium ${doc.status === 'Valid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {doc.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className='mt-4'>
                  <p className='text-xs uppercase font-semibold text-slate-500 dark:text-slate-400'>Benefits Snapshot</p>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {employee.benefits.map((benefit) => (
                      <span key={benefit} className='inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-3 py-1 text-xs font-medium'>
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Directory Insights</p>
              <dl className='mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300'>
                <div className='flex justify-between'>
                  <dt>Active Workforce</dt>
                  <dd className='font-medium'>{activeEmployees} people</dd>
                </div>
                <div className='flex justify-between'>
                  <dt>Remote Workforce</dt>
                  <dd className='font-medium'>{remoteEmployees} team members</dd>
                </div>
                <div className='flex justify-between'>
                  <dt>Average Tenure</dt>
                  <dd className='font-medium'>4.3 years</dd>
                </div>
                <div className='flex justify-between'>
                  <dt>Employee NPS</dt>
                  <dd className='font-medium'>+48</dd>
                </div>
              </dl>
            </div>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/60'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Smart Alerts</p>
              <ul className='mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300'>
                {hrAlerts.map((alert) => (
                  <li key={alert.title} className='flex gap-2'>
                    <span className={`mt-1 h-2 w-2 rounded-full ${alert.type === 'success' ? 'bg-emerald-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                    <div>
                      <p className='font-medium text-slate-700 dark:text-slate-200'>{alert.title}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>{alert.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>
      <Section
        title='2. Payroll, Tax and Payslip Management'
        description='Automate payroll calculations, tax withholding, digital payslips, and direct deposit integrations with banking partners.'
        icon={Wallet}
      >
        <div className='flex flex-wrap gap-3'>
          {payrollCycles.map((cycle) => (
            <button
              key={cycle.id}
              onClick={() => setActivePayroll(cycle.id)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                activePayroll === cycle.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-200'
              }`}
            >
              {cycle.period}
            </button>
          ))}
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          <div className='lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-800/60'>
            <div className='flex justify-between items-start'>
              <div>
                <p className='text-xs uppercase font-semibold text-slate-500 dark:text-slate-400'>Payroll Cycle</p>
                <h3 className='text-xl font-semibold text-slate-900 dark:text-white'>{payrollSummary.period}</h3>
                <p className='text-sm text-slate-500 dark:text-slate-400'>Processed {payrollSummary.processedOn}</p>
              </div>
              <span className='inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300'>
                {payrollSummary.status}
              </span>
            </div>
            <div className='mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4'>
                <p className='text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-1'>Gross Payroll</p>
                <p className='text-lg font-semibold text-slate-900 dark:text-white'>{formatCurrency(payrollSummary.gross)}</p>
                <p className='text-xs text-slate-500 dark:text-slate-400'>Employees processed: {payrollSummary.employees}</p>
              </div>
              <div className='rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4'>
                <p className='text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-1'>Tax Deductions</p>
                <p className='text-lg font-semibold text-slate-900 dark:text-white'>{formatCurrency(payrollSummary.tax)}</p>
                <p className='text-xs text-slate-500 dark:text-slate-400'>{payrollSummary.depositLabel}</p>
              </div>
              <div className='rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4'>
                <p className='text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-1'>Net Payroll</p>
                <p className='text-lg font-semibold text-slate-900 dark:text-white'>{formatCurrency(payrollSummary.net)}</p>
                <p className='text-xs text-slate-500 dark:text-slate-400'>Direct deposit across four partner banks with secure bank files.</p>
              </div>
              <div className='rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4'>
                <p className='text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-1'>Automation Events</p>
                <ul className='text-xs text-slate-600 dark:text-slate-300 space-y-1'>
                  <li className='flex items-center gap-2'>
                    <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
                    Tax reports generated and shared with Finance.
                  </li>
                  <li className='flex items-center gap-2'>
                    <FileText className='h-3.5 w-3.5 text-indigo-500' />
                    Payslips published to the employee self service portal.
                  </li>
                  <li className='flex items-center gap-2'>
                    <GitBranch className='h-3.5 w-3.5 text-slate-400' />
                    Ledger exports synced to Oracle NetSuite and SAP S4.
                  </li>
                </ul>
              </div>
            </div>
            <p className='mt-6 text-sm text-slate-500 dark:text-slate-400'>{payrollSummary.notes}</p>
          </div>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Direct Deposit Partners</p>
              <ul className='mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300'>
                <li className='flex items-center justify-between'>
                  <span>JPMorgan Chase (US)</span>
                  <span className='text-xs text-emerald-500 font-medium'>Operational</span>
                </li>
                <li className='flex items-center justify-between'>
                  <span>Barclays (UK)</span>
                  <span className='text-xs text-emerald-500 font-medium'>Operational</span>
                </li>
                <li className='flex items-center justify-between'>
                  <span>DBS (APAC)</span>
                  <span className='text-xs text-amber-500 font-medium'>Latency alerts</span>
                </li>
              </ul>
            </div>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/60'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Upcoming Payroll Tasks</p>
              <ul className='mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300'>
                <li>Collect overtime approvals - due Oct 26</li>
                <li>Reconcile contractor invoices - due Oct 27</li>
                <li>Publish bonus letters - due Nov 02</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
      <Section
        title='3. Attendance, Leave and Timesheet Management'
        description='Track clock-in and clock-out activity, manage leave balances with public holidays, and capture timesheets for projects.'
        icon={Clock}
      >
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          <div className='lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs uppercase font-semibold text-slate-500 dark:text-slate-400'>Leave Requests</p>
                <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>Live approval queue</h3>
              </div>
              <button className='text-xs font-medium text-indigo-600 dark:text-indigo-300 hover:underline'>View all</button>
            </div>
            <div className='mt-4 space-y-3'>
              {leaveRequests.map((request) => (
                <div key={request.id} className='rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 flex items-center justify-between'>
                  <div>
                    <p className='font-medium text-slate-900 dark:text-white'>{request.employee}</p>
                    <p className='text-xs text-slate-500 dark:text-slate-400'>
                      {request.type} - {request.duration} - {request.days} days
                    </p>
                  </div>
                  <div className='text-right'>
                    <p
                      className={`text-xs font-semibold ${
                        request.status === 'Approved'
                          ? 'text-emerald-500'
                          : request.status === 'In Progress'
                          ? 'text-indigo-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {request.status}
                    </p>
                    <p className='text-xs text-slate-400 dark:text-slate-500'>Approver: {request.approver}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/60'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Public Holiday Calendar</p>
              <ul className='mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300'>
                {holidayCalendar.map((holiday) => (
                  <li key={holiday.name} className='flex justify-between'>
                    <span>
                      {holiday.name}
                      <span className='block text-[11px] text-slate-500 dark:text-slate-400'>Regions: {holiday.regions.join(', ')}</span>
                    </span>
                    <span className='font-medium text-slate-700 dark:text-slate-200'>{holiday.date}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Attendance Metrics</p>
              <dl className='mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300'>
                <div className='flex justify-between'>
                  <dt>Punctuality</dt>
                  <dd className='font-medium text-emerald-500'>97.2%</dd>
                </div>
                <div className='flex justify-between'>
                  <dt>Average Overtime</dt>
                  <dd className='font-medium text-slate-700 dark:text-slate-200'>3.1 hours per employee</dd>
                </div>
                <div className='flex justify-between'>
                  <dt>Absence Rate</dt>
                  <dd className='font-medium text-amber-500'>2.3%</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
          <p className='text-sm font-semibold text-slate-900 dark:text-white mb-4'>Timesheet Utilisation</p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {timesheetSummary.map((entry) => (
              <div key={entry.project} className='rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4'>
                <p className='text-sm font-medium text-slate-900 dark:text-white'>{entry.project}</p>
                <dl className='mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300'>
                  <div className='flex justify-between'>
                    <dt>Billable</dt>
                    <dd>{entry.billable} hours</dd>
                  </div>
                  <div className='flex justify-between'>
                    <dt>Non billable</dt>
                    <dd>{entry.nonBillable} hours</dd>
                  </div>
                  <div className='flex justify-between'>
                    <dt>Overtime</dt>
                    <dd>{entry.overtime} hours</dd>
                  </div>
                  <div className='flex justify-between'>
                    <dt>Utilisation</dt>
                    <dd className='font-medium text-indigo-600 dark:text-indigo-300'>{Math.round(entry.utilization * 100)}%</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Section
        title='4. Benefits, Compensation and Rewards'
        description='Manage health benefits, retirement plans, salary structures, reimbursements, and stock grants with finance integration.'
        icon={HeartPulse}
      >
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          <div className='lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
            <p className='text-sm font-semibold text-slate-900 dark:text-white'>Benefit Programs</p>
            <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
              {benefitPrograms.map((program) => (
                <div key={program.name} className='rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4'>
                  <p className='text-sm font-semibold text-slate-900 dark:text-white'>{program.name}</p>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>{program.provider}</p>
                  <p className='mt-2 text-xs text-slate-600 dark:text-slate-300'>Coverage: {program.coverage}</p>
                  <p className='text-xs text-slate-600 dark:text-slate-300'>Participation: {Math.round(program.participation * 100)}% - Renewal {program.renewal}</p>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {program.integrations.map((integration) => (
                      <span key={integration} className='inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-300'>
                        {integration}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Salary Structures</p>
              <div className='mt-3 space-y-3'>
                {salaryBands.map((band) => (
                  <div key={band.band} className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm font-medium text-slate-900 dark:text-white'>{band.band}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>Range {formatCurrency(band.min)} to {formatCurrency(band.max)}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs uppercase text-slate-500 dark:text-slate-400'>Employees</p>
                      <p className='text-sm font-medium text-slate-900 dark:text-white'>{band.population}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/60'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Reimbursements and Stock Plans</p>
              <div className='mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300'>
                {reimbursements.map((item) => (
                  <div key={item.id} className='flex justify-between'>
                    <div>
                      <p className='font-medium text-slate-900 dark:text-white'>{item.employee}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>{item.category} - submitted {item.submitted}</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium'>{formatCurrency(item.amount)}</p>
                      <p className='text-xs text-emerald-500'>{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className='mt-4 border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300'>
                {stockPrograms.map((grant) => (
                  <div key={grant.plan}>
                    <p className='text-sm font-semibold text-slate-900 dark:text-white'>{grant.plan}</p>
                    <p>Participants: {grant.participants} - Granted: {grant.granted.toLocaleString()} units - Next vest {grant.nextVest}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>
      <Section
        title='5. Recruitment, Screening and Onboarding'
        description='Publish job openings, integrate job boards, automate candidate screening, interview scheduling, and onboarding tasks.'
        icon={UserPlus}
      >
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          <div className='lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
            <p className='text-sm font-semibold text-slate-900 dark:text-white'>Job Openings</p>
            <div className='mt-4 space-y-3'>
              {jobOpenings.map((job) => (
                <div key={job.id} className='rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/40 transition'>
                  <div className='flex justify-between'>
                    <div>
                      <p className='font-medium text-slate-900 dark:text-white'>{job.title}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>{job.department} - openings {job.openings}</p>
                    </div>
                    <div className='text-right'>
                      <span className='inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300'>
                        {job.stage}
                      </span>
                      <p className='mt-1 text-[11px] text-slate-500 dark:text-slate-400'>Recruiter: {job.recruiter}</p>
                    </div>
                  </div>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {job.channels.map((channel) => (
                      <span key={channel} className='inline-flex items-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300'>
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/60'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Candidate Pipeline</p>
              <div className='mt-3 space-y-3'>
                {candidateStages.map((stage) => (
                  <div key={stage.stage} className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm font-medium text-slate-900 dark:text-white'>{stage.stage}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>AI assisted matching is active</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-semibold text-indigo-600 dark:text-indigo-300'>{stage.count}</p>
                      <p className='text-xs text-emerald-500'>{stage.change}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Onboarding Journeys</p>
              <div className='mt-3 space-y-3'>
                {onboardingJourneys.map((journey) => (
                  <div key={journey.name} className='rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3'>
                    <p className='text-sm font-semibold text-slate-900 dark:text-white'>{journey.name}</p>
                    <p className='text-xs text-slate-500 dark:text-slate-400'>Duration {journey.duration} - Owner {journey.owner}</p>
                    <p className='text-xs text-slate-600 dark:text-slate-300 mt-2'>Completion {Math.round(journey.completion * 100)}%</p>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {journey.milestones.map((milestone) => (
                        <span key={milestone} className='inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-300'>
                          {milestone}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>
      <Section
        title='6. Performance, Feedback and Development'
        description='Align goals, run performance cycles, capture 360 degree feedback, and manage talent development programs.'
        icon={Target}
      >
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          <div className='lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
            <p className='text-sm font-semibold text-slate-900 dark:text-white'>Performance Cycles</p>
            <div className='mt-4 space-y-3'>
              {performanceCycles.map((cycle) => (
                <div key={cycle.name} className='rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm font-semibold text-slate-900 dark:text-white'>{cycle.name}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>Coverage {cycle.coverage} - Due {cycle.dueDate}</p>
                    </div>
                    <span className='inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300'>
                      {Math.round(cycle.progress * 100)}% complete
                    </span>
                  </div>
                  <div className='mt-3 flex justify-between text-xs text-slate-600 dark:text-slate-300'>
                    <span>Goals aligned: {cycle.goalsAligned}</span>
                    <span>Feedback requests: {cycle.feedbackRequests}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/60'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Development Programs</p>
              <div className='mt-3 space-y-3 text-xs text-slate-600 dark:text-slate-300'>
                {developmentPrograms.map((program) => (
                  <div key={program.name}>
                    <p className='text-sm font-semibold text-slate-900 dark:text-white'>{program.name}</p>
                    <p>Enrolled {program.enrolled} of {program.seats} - Next session {program.nextSession}</p>
                    <p className='text-slate-500 dark:text-slate-400 mt-1'>{program.impact}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Feedback Automation</p>
              <ul className='mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300'>
                <li>360 feedback invites trigger via Slack and Outlook.</li>
                <li>Calibration dashboards sync with compensation planning.</li>
                <li>Coaching summaries delivered to managers weekly.</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
      <Section
        title='7. Compliance, Reporting and Government Filings'
        description='Stay audit ready with statutory reports, tax compliance tracking, and integration with government systems.'
        icon={ShieldCheck}
      >
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          <div className='lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
            <p className='text-sm font-semibold text-slate-900 dark:text-white'>Compliance Programs</p>
            <div className='mt-4 space-y-3'>
              {compliancePrograms.map((program) => (
                <div key={program.id} className='rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4'>
                  <div className='flex justify-between'>
                    <div>
                      <p className='text-sm font-semibold text-slate-900 dark:text-white'>{program.name}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>Owner {program.owner} - Due {program.dueDate}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        program.status === 'On Track'
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : program.status === 'At Risk'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'
                          : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'
                      }`}
                    >
                      {program.status}
                    </span>
                  </div>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {program.scope.map((item) => (
                      <span key={item} className='inline-flex items-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300'>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/60'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Tax and Compliance Calendar</p>
              <div className='mt-3 space-y-3 text-xs text-slate-600 dark:text-slate-300'>
                {taxCompliance.map((item) => (
                  <div key={item.name}>
                    <p className='text-sm font-semibold text-slate-900 dark:text-white'>{item.name}</p>
                    <p>{item.jurisdiction} - {item.frequency}</p>
                    <p>Status: <span className='font-medium text-emerald-500'>{item.status}</span> - Next due {item.nextDue}</p>
                    <p className='text-slate-500 dark:text-slate-400'>Owner: {item.owner}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Audit Trail Summary</p>
              <ul className='mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300'>
                <li>1,248 payroll changes captured this quarter with full audit details.</li>
                <li>Document retention policies applied automatically to HR files.</li>
                <li>Government filings distributed through secure API connectors.</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
      <Section
        title='8. Employee Self-Service and Workflow Automation'
        description='Empower employees with a self-service portal while approvals, reminders, and document routing happen automatically.'
        icon={Workflow}
      >
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          <div className='lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
            <p className='text-sm font-semibold text-slate-900 dark:text-white'>Self Service Center</p>
            <div className='mt-4 space-y-3'>
              {selfServiceRequests.map((request) => (
                <div key={request.id} className='rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 flex justify-between'>
                  <div>
                    <p className='text-sm font-semibold text-slate-900 dark:text-white'>{request.type}</p>
                    <p className='text-xs text-slate-500 dark:text-slate-400'>
                      {request.employee} - Submitted {request.submitted}
                    </p>
                  </div>
                  <span className='text-xs font-medium text-indigo-600 dark:text-indigo-300'>{request.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/60'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Automation Workflows</p>
              <div className='mt-3 space-y-3 text-xs text-slate-600 dark:text-slate-300'>
                {automationFlows.map((flow) => (
                  <div key={flow.name}>
                    <p className='text-sm font-semibold text-slate-900 dark:text-white'>{flow.name}</p>
                    <p>Owner: {flow.owner} - Success rate {Math.round(flow.successRate * 100)}%</p>
                    <p>Average completion time: {flow.averageTime}</p>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {flow.automations.map((automation) => (
                        <span key={automation} className='inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-300'>
                          {automation}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Notifications and Alerts</p>
              <ul className='mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300'>
                <li>Leave approvals auto escalate after 24 hours.</li>
                <li>Payroll variance alerts routed to finance and HR teams.</li>
                <li>Chat assistant handles policy questions around the clock.</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
      <Section
        title='9. HR Analytics and Financial Integration'
        description='Blend workforce analytics, payroll insights, expense trends, and finance integrations for proactive planning.'
        icon={BarChart3}
      >
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          <div className='lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
            <p className='text-sm font-semibold text-slate-900 dark:text-white'>Analytics Highlights</p>
            <div className='mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4'>
              {analyticsHighlights.map((highlight) => (
                <div key={highlight.title} className='rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4'>
                  <p className='text-sm font-semibold text-slate-900 dark:text-white'>{highlight.title}</p>
                  <p className='mt-2 text-lg font-semibold text-indigo-600 dark:text-indigo-300'>{highlight.metric}</p>
                  <p className='mt-2 text-xs text-slate-500 dark:text-slate-400'>{highlight.insight}</p>
                </div>
              ))}
            </div>
            <div className='mt-6 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-500/40 p-6 bg-white dark:bg-slate-900'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Financial Performance Analytics</p>
              <p className='mt-2 text-sm text-slate-600 dark:text-slate-300'>
                Compare payroll spend, benefits cost, and project utilisation against budgets. Export data to PowerBI, Tableau,
                or share via secure APIs with finance data warehouses.
              </p>
              <ul className='mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300'>
                <li>Labour cost variance negative 4.2 percent versus forecast.</li>
                <li>Bonus accrual coverage at 96 percent for Q4 commitments.</li>
                <li>Benefits spend per employee averages {formatCurrency(1620)} per quarter.</li>
              </ul>
            </div>
          </div>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Financial Integrations</p>
              <div className='mt-3 space-y-3 text-xs text-slate-600 dark:text-slate-300'>
                {financialIntegrations.map((integration) => (
                  <div key={integration.name}>
                    <p className='text-sm font-semibold text-slate-900 dark:text-white'>{integration.name}</p>
                    <p>Partners: {integration.partners.join(', ')}</p>
                    <p>Status: <span className='text-emerald-500 font-medium'>{integration.status}</span></p>
                    <p>Sync: {integration.syncFrequency} - Last sync {integration.lastSync}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/60'>
              <p className='text-sm font-semibold text-slate-900 dark:text-white'>Budgeting and Expense Insights</p>
              <ul className='mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300'>
                <li>HR budget utilisation at 78 percent of FY25 allocation.</li>
                <li>Expense reimbursement cycle averages 2.4 days.</li>
                <li>Travel spend trending plus 6 percent due to client roadshows.</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
      <Section
        title='10. Tax Engines, Compliance Connections and Automation Playbooks'
        description='Handle withholding tax, end of year filings, banking integrations, budgeting, and reusable workflow playbooks.'
        icon={Database}
      >
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
          <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/60'>
            <p className='text-sm font-semibold text-slate-900 dark:text-white'>Tax and Compliance Actions</p>
            <ul className='mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300'>
              <li>Real-time withholding adjustments applied to bonuses, raises, and reimbursements across multiple jurisdictions.</li>
              <li>Year end forms such as W-2, 1099, and P60 generated and queued for employee download.</li>
              <li>Government filings submitted via secure gateways with receipts stored in the audit trail.</li>
            </ul>
          </div>
          <div className='rounded-2xl border border-slate-200 dark:border-slate-800 p-5'>
            <p className='text-sm font-semibold text-slate-900 dark:text-white'>Workflow Playbooks</p>
            <ul className='mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300'>
              <li>Leave workflow ties attendance records, payroll adjustments, and policy compliance checks.</li>
              <li>Onboarding document packets cover contracts, benefits enrollment, and IT provisioning tasks.</li>
              <li>Compensation review playbook links performance ratings, salary bands, and equity refresh cycles.</li>
            </ul>
          </div>
        </div>
      </Section>
    </div>
  )
}

export default HRManagementSuite
