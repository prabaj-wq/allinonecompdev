import React from 'react'
import { Handle, Position } from 'reactflow'
import {
  Play,
  Square,
  GitBranch,
  Database,
  FileText,
  CheckCircle,
  AlertCircle,
  Settings,
  Users,
  BarChart3,
} from 'lucide-react'

// Node Type Definitions
const StartNode = ({ data }) => (
  <div className="px-4 py-3 rounded-lg bg-green-600 border-2 border-green-400 shadow-lg">
    <div className="flex items-center gap-2 text-white font-semibold">
      <Play size={16} />
      {data.label || 'Start'}
    </div>
    <Handle type="source" position={Position.Right} />
  </div>
)

const EndNode = ({ data }) => (
  <div className="px-4 py-3 rounded-lg bg-red-600 border-2 border-red-400 shadow-lg">
    <div className="flex items-center gap-2 text-white font-semibold">
      <Square size={16} />
      {data.label || 'End'}
    </div>
    <Handle type="target" position={Position.Left} />
  </div>
)

const ProcessNode = ({ data }) => (
  <div className="px-4 py-3 rounded-lg bg-blue-600 border-2 border-blue-400 shadow-lg min-w-[180px]">
    <div className="flex items-center gap-2 text-white font-semibold">
      <Settings size={16} />
      {data.label || 'Process'}
    </div>
    {data.config?.description && (
      <p className="text-xs text-blue-100 mt-1">{data.config.description}</p>
    )}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
)

const DecisionNode = ({ data }) => (
  <div className="px-4 py-3 rounded-lg bg-yellow-500 border-2 border-yellow-300 shadow-lg min-w-[180px] text-center">
    <div className="flex items-center justify-center gap-2 text-white font-semibold">
      <GitBranch size={16} />
      {data.label || 'Decision'}
    </div>
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} id="yes" />
    <Handle type="source" position={Position.Right} id="no" />
  </div>
)

const DataNode = ({ data }) => (
  <div className="px-4 py-3 rounded-lg bg-purple-600 border-2 border-purple-400 shadow-lg min-w-[180px]">
    <div className="flex items-center gap-2 text-white font-semibold">
      <Database size={16} />
      {data.label || 'Data'}
    </div>
    {data.config?.description && (
      <p className="text-xs text-purple-100 mt-1">{data.config.description}</p>
    )}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
)

const ApprovalNode = ({ data }) => (
  <div className="px-4 py-3 rounded-lg bg-indigo-600 border-2 border-indigo-400 shadow-lg min-w-[180px]">
    <div className="flex items-center gap-2 text-white font-semibold">
      <CheckCircle size={16} />
      {data.label || 'Approval'}
    </div>
    {data.config?.description && (
      <p className="text-xs text-indigo-100 mt-1">{data.config.description}</p>
    )}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
)

const DocumentNode = ({ data }) => (
  <div className="px-4 py-3 rounded-lg bg-orange-600 border-2 border-orange-400 shadow-lg min-w-[180px]">
    <div className="flex items-center gap-2 text-white font-semibold">
      <FileText size={16} />
      {data.label || 'Document'}
    </div>
    {data.config?.description && (
      <p className="text-xs text-orange-100 mt-1">{data.config.description}</p>
    )}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
)

const NotificationNode = ({ data }) => (
  <div className="px-4 py-3 rounded-lg bg-cyan-600 border-2 border-cyan-400 shadow-lg min-w-[180px]">
    <div className="flex items-center gap-2 text-white font-semibold">
      <AlertCircle size={16} />
      {data.label || 'Notification'}
    </div>
    {data.config?.description && (
      <p className="text-xs text-cyan-100 mt-1">{data.config.description}</p>
    )}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
)

const ReportNode = ({ data }) => (
  <div className="px-4 py-3 rounded-lg bg-emerald-600 border-2 border-emerald-400 shadow-lg min-w-[180px]">
    <div className="flex items-center gap-2 text-white font-semibold">
      <BarChart3 size={16} />
      {data.label || 'Report'}
    </div>
    {data.config?.description && (
      <p className="text-xs text-emerald-100 mt-1">{data.config.description}</p>
    )}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
)

const AssignmentNode = ({ data }) => (
  <div className="px-4 py-3 rounded-lg bg-fuchsia-600 border-2 border-fuchsia-400 shadow-lg min-w-[180px]">
    <div className="flex items-center gap-2 text-white font-semibold">
      <Users size={16} />
      {data.label || 'Assignment'}
    </div>
    {data.config?.description && (
      <p className="text-xs text-fuchsia-100 mt-1">{data.config.description}</p>
    )}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
)

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  process: ProcessNode,
  decision: DecisionNode,
  data: DataNode,
  approval: ApprovalNode,
  document: DocumentNode,
  notification: NotificationNode,
  report: ReportNode,
  assignment: AssignmentNode,
}

export default nodeTypes