import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Play, 
  Download, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star,
  Clock,
  Users,
  Award,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Video,
  BarChart3
} from 'lucide-react'

const Training = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'ifrs',
    level: 'beginner',
    duration: '',
    instructor: '',
    materials: []
  })

  useEffect(() => {
    loadTrainingData()
  }, [])

  const loadTrainingData = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockCourses = [
        {
          id: 1,
          title: 'IFRS 9 Financial Instruments Masterclass',
          description: 'Comprehensive training on financial instruments classification, measurement, and impairment',
          category: 'ifrs',
          level: 'advanced',
          duration: '8 hours',
          instructor: 'Dr. Sarah Johnson',
          rating: 4.8,
          enrolledStudents: 156,
          completionRate: 87,
          materials: [
            { type: 'video', title: 'Introduction to IFRS 9', duration: '45 min' },
            { type: 'document', title: 'Classification Guide', duration: '30 min' },
            { type: 'quiz', title: 'Assessment Test', duration: '20 min' }
          ],
          status: 'active',
          lastUpdated: '2024-01-15'
        },
        {
          id: 2,
          title: 'Consolidation Fundamentals',
          description: 'Learn the basics of financial consolidation and multi-entity reporting',
          category: 'consolidation',
          level: 'beginner',
          duration: '6 hours',
          instructor: 'Prof. Michael Chen',
          rating: 4.6,
          enrolledStudents: 203,
          completionRate: 92,
          materials: [
            { type: 'video', title: 'Consolidation Basics', duration: '60 min' },
            { type: 'document', title: 'Practice Exercises', duration: '45 min' },
            { type: 'quiz', title: 'Final Assessment', duration: '30 min' }
          ],
          status: 'active',
          lastUpdated: '2024-01-12'
        },
        {
          id: 3,
          title: 'Audit Materiality Assessment',
          description: 'Understanding and applying materiality concepts in financial audits',
          category: 'audit',
          level: 'intermediate',
          duration: '4 hours',
          instructor: 'Lisa Rodriguez',
          rating: 4.7,
          enrolledStudents: 89,
          completionRate: 78,
          materials: [
            { type: 'video', title: 'Materiality Concepts', duration: '40 min' },
            { type: 'document', title: 'Case Studies', duration: '35 min' },
            { type: 'quiz', title: 'Materiality Quiz', duration: '25 min' }
          ],
          status: 'active',
          lastUpdated: '2024-01-10'
        },
        {
          id: 4,
          title: 'Tax Compliance for IFRS',
          description: 'Tax implications and compliance requirements under IFRS standards',
          category: 'tax',
          level: 'intermediate',
          duration: '5 hours',
          instructor: 'David Thompson',
          rating: 4.5,
          enrolledStudents: 134,
          completionRate: 81,
          materials: [
            { type: 'video', title: 'Tax Basics', duration: '50 min' },
            { type: 'document', title: 'Compliance Checklist', duration: '40 min' },
            { type: 'quiz', title: 'Tax Assessment', duration: '30 min' }
          ],
          status: 'active',
          lastUpdated: '2024-01-08'
        }
      ]
      setCourses(mockCourses)

      const mockEnrolled = [
        {
          id: 1,
          courseId: 1,
          progress: 75,
          lastAccessed: '2024-01-15',
          completedMaterials: 2,
          totalMaterials: 3,
          certificate: null
        },
        {
          id: 2,
          courseId: 2,
          progress: 100,
          lastAccessed: '2024-01-14',
          completedMaterials: 3,
          totalMaterials: 3,
          certificate: '2024-01-14'
        }
      ]
      setEnrolledCourses(mockEnrolled)
    } catch (error) {
      console.error('Error loading training data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.description || !newCourse.category) return
    
    try {
      const course = {
        id: Date.now(),
        ...newCourse,
        rating: 0,
        enrolledStudents: 0,
        completionRate: 0,
        status: 'active',
        lastUpdated: new Date().toISOString().split('T')[0]
      }
      
      setCourses([...courses, course])
      setNewCourse({ title: '', description: '', category: 'ifrs', level: 'beginner', duration: '', instructor: '', materials: [] })
      setShowAddCourse(false)
    } catch (error) {
      console.error('Error adding course:', error)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category) => {
    switch (category) {
      case 'ifrs': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'consolidation': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'audit': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'tax': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'quiz': return <BarChart3 className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading training materials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Training Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Professional development and certification courses</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddCourse(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Certificates
          </button>
        </div>
      </div>

      {/* Training Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrolled Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {courses.reduce((sum, course) => sum + course.enrolledStudents, 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(courses.reduce((sum, course) => sum + course.completionRate, 0) / courses.length)}%
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {courses.reduce((sum, course) => sum + parseInt(course.duration), 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="ifrs">IFRS Standards</option>
              <option value="consolidation">Consolidation</option>
              <option value="audit">Audit</option>
              <option value="tax">Tax</option>
            </select>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Available Courses */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Available Courses</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredCourses.length} of {courses.length} courses available
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(course.category)}`}>
                      {course.category.toUpperCase()}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{course.rating}</span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{course.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{course.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span>Instructor: {course.instructor}</span>
                  <span>{course.duration}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>{course.enrolledStudents} students</span>
                  <span>{course.completionRate}% completion</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Course Materials:</p>
                  {course.materials.slice(0, 2).map((material, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                      {getMaterialIcon(material.type)}
                      <span>{material.title}</span>
                      <span>({material.duration})</span>
                    </div>
                  ))}
                  {course.materials.length > 2 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      +{course.materials.length - 2} more materials
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                  <button className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                    Enroll
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Learning Progress */}
      {enrolledCourses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Learning Progress</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track your enrolled courses and progress</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {enrolledCourses.map((enrollment) => {
                const course = courses.find(c => c.id === enrollment.courseId)
                if (!course) return null
                
                return (
                  <div key={enrollment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                      <div className="flex items-center space-x-2">
                        {enrollment.progress === 100 ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <Clock className="h-3 w-3 mr-1" />
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{enrollment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Materials: {enrollment.completedMaterials}/{enrollment.totalMaterials}</span>
                      <span>Last accessed: {enrollment.lastAccessed}</span>
                    </div>
                    
                    {enrollment.certificate && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Certificate earned on {enrollment.certificate}
                          </span>
                          <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
                            Download
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* New Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Course</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Title</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter course title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                  placeholder="Enter course description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="ifrs">IFRS Standards</option>
                  <option value="consolidation">Consolidation</option>
                  <option value="audit">Audit</option>
                  <option value="tax">Tax</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
                <select
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (hours)</label>
                <input
                  type="number"
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter duration in hours"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructor</label>
                <input
                  type="text"
                  value={newCourse.instructor}
                  onChange={(e) => setNewCourse({...newCourse, instructor: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter instructor name"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddCourse}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Course
              </button>
              <button
                onClick={() => setShowAddCourse(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedCourse.title}</h3>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Course Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="ml-2 font-medium">{selectedCourse.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Level:</span>
                    <span className="ml-2 font-medium">{selectedCourse.level}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="ml-2 font-medium">{selectedCourse.duration}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Instructor:</span>
                    <span className="ml-2 font-medium">{selectedCourse.instructor}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedCourse.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Course Materials</h4>
                <div className="space-y-2">
                  {selectedCourse.materials.map((material, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getMaterialIcon(material.type)}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{material.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{material.duration}</p>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                        Start
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Play className="h-4 w-4 mr-2 inline" />
                  Enroll Now
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                  <Download className="h-4 w-4 mr-2 inline" />
                  Download Syllabus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Training
