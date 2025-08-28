// app/dashboard/DashboardClient.tsx - ENHANCED VERSION WITH PERSISTENT TRAINING STATUS
'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/client'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  FileText,
  XCircle,
  Trash2,
  PlusCircle,
  Loader2,
  Brain,
  AlertCircle,
  LogOut,
  Coffee,
  Code,
  Heart,
  Zap,
  Play,
  MessageSquare,
  X,
  Send,
  Download,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type AlpacaChunk = {
  instruction: string
  input: string
  output: string
}

type UploadedFile = {
  id: string
  file_name: string
  file_size: number
  file_extension: string
  created_at: string
  file_path: string
  alpaca_path?: string
  trained_model_path?: string
  training_status?: string
}

type TrainingStatus = {
  status: 'not_started' | 'starting' | 'training' | 'completed' | 'failed'
  message: string
  progress: number
  model_path?: string
  file_name?: string
  error?: string
  training_completed?: boolean
}

type ModelStatus = {
  trained: boolean
  message: string
  training_in_progress: boolean
  progress?: number
  model_path?: string
  file_name?: string
  training_completed?: boolean
  can_train?: boolean
  needs_retraining?: boolean
}

const API_BASE_URL = 'http://localhost:8000'

// 🎉 EASTER EGG COMPONENT!
const EasterEggModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [currentJoke, setCurrentJoke] = useState(0)

  const jokes = [
    "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem! 💡",
    "Why don't programmers like nature? It has too many bugs! 🌿",
    "What's a programmer's favorite hangout place? Foo Bar! 🍺",
    "Why do Java developers wear glasses? Because they can't C#! 👓",
    "There are only 10 types of people: those who understand binary and those who don't! 1️⃣0️⃣",
    "A SQL query goes into a bar, walks up to two tables and asks... 'Can I join you?' 🗄️",
  ]

  const nextJoke = () => {
    setCurrentJoke((prev) => (prev + 1) % jokes.length)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-lg p-8 w-full max-w-lg shadow-2xl transform animate-bounce">
        <div className="text-center text-white">
          <div className="flex justify-center items-center mb-4 space-x-2">
            <Coffee className="text-yellow-300 animate-pulse" size={32} />
            <Code className="text-green-300 animate-spin" size={32} />
            <Heart className="text-red-300 animate-pulse" size={32} />
            <Zap className="text-yellow-300 animate-bounce" size={32} />
          </div>

          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
            🎉 You Found the Secret! 🎉
          </h2>

          <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-6 backdrop-blur-sm">
            <p className="text-lg mb-2">Developer Joke #{currentJoke + 1}:</p>
            <p className="text-xl font-medium">{jokes[currentJoke]}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={nextJoke}
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-full font-semibold transition-all transform hover:scale-105"
            >
              Tell me another! 😄
            </button>

            <div>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-2 rounded-full transition-all backdrop-blur-sm"
              >
                Back to Work 💻
              </button>
            </div>
          </div>

          <p className="text-sm mt-4 opacity-80">
            Psst... try the Konami Code next time! ↑↑↓↓←→←→BA
          </p>
        </div>
      </div>
    </div>
  )
}

// Modal Component for Dataset Status
const DatasetModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
}) => {
  if (!isOpen) return null

  const bgColor = {
    success: 'bg-green-100 border-green-500',
    error: 'bg-red-100 border-red-500',
    warning: 'bg-yellow-100 border-yellow-500',
    info: 'bg-blue-100 border-blue-500',
  }[type]

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  }[type]

  const Icon = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: AlertCircle,
  }[type]

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className={`bg-white rounded-lg p-6 w-full max-w-md border-2 ${bgColor} shadow-lg pointer-events-auto`}>
        <div className={`flex items-center gap-3 mb-4 ${textColor}`}>
          <Icon size={24} />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className={`mb-4 ${textColor}`}>{message}</p>
        <button
          onClick={onClose}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors w-full"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// TRAINING PROGRESS MODAL — no backdrop (center-only visible)
const TrainingProgressModal = ({
  isOpen,
  onClose,
  trainingStatus,
  fileName,
  onDownload,
}: {
  isOpen: boolean
  onClose: () => void
  trainingStatus: TrainingStatus
  fileName: string
  onDownload?: () => void
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Center modal only — outer area is non-interactive */}
      <div className="pointer-events-auto bg-white rounded-lg shadow-xl max-w-md w-full relative">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="text-purple-600" size={20} />
            Training Progress
          </h3>
          {(trainingStatus.status === 'completed' || trainingStatus.status === 'failed') && (
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">File: {fileName}</p>
            <p className="text-sm font-medium text-gray-800">{trainingStatus.message}</p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                trainingStatus.status === 'completed' 
                  ? 'bg-green-500' 
                  : trainingStatus.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, trainingStatus.progress))}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span className="uppercase font-medium">{trainingStatus.status}</span>
            <span>{Math.round(trainingStatus.progress)}%</span>
          </div>

          {trainingStatus.status === 'training' && (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm">Training in progress...</span>
            </div>
          )}

          {trainingStatus.status === 'completed' && (
            <div className="text-center py-4">
              <CheckCircle className="text-green-500 mx-auto mb-2" size={40} />
              <p className="text-green-600 font-medium text-lg">Training Completed!</p>
              <p className="text-sm text-gray-500 mt-1">Model is ready for testing</p>
              {onDownload && (
                <div className="mt-3">
                  <button
                    onClick={onDownload}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  >
                    <Download size={16} /> Download Model
                  </button>
                </div>
              )}
            </div>
          )}

          {trainingStatus.status === 'failed' && (
            <div className="text-center py-4">
              <XCircle className="text-red-500 mx-auto mb-2" size={40} />
              <p className="text-red-600 font-medium text-lg">Training Failed</p>
              {trainingStatus.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                  <p className="text-xs text-red-600 text-left break-words">{trainingStatus.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {(trainingStatus.status === 'completed' || trainingStatus.status === 'failed') && (
          <div className="p-6 border-t bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// TEST MODEL MODAL — no backdrop (center-only visible)
const TestModelModal = ({
  isOpen,
  onClose,
  fileId,
  fileName,
}: {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
}) => {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTest = async () => {
    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    setIsLoading(true)
    setError('')
    setAnswer('')

    try {
      const response = await fetch(`${API_BASE_URL}/test-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          question: question.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Test failed')
      }

      if (result.success) {
        setAnswer(result.answer)
      } else {
        setError(result.error || 'Test failed')
      }
    } catch (err: any) {
      console.error('Test error:', err)
      setError(err.message || 'Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setQuestion('')
    setAnswer('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col relative">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={20} />
            Test Trained Model
          </h3>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              Testing model for: <span className="font-medium text-gray-800">{fileName}</span>
            </p>
          </div>

          <div>
            <Label htmlFor="test-question" className="text-sm font-medium text-gray-700">
              Your Question
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="test-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask something about your trained data..."
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleTest()
                  }
                }}
              />
              <button
                onClick={handleTest}
                disabled={isLoading || !question.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                {isLoading ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500" />
                <span className="text-sm font-medium">Error:</span>
              </div>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {answer && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="text-green-600" size={16} />
                <span className="font-medium text-green-800">AI Response:</span>
              </div>
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border">
                {answer}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardClient() {
  const router = useRouter()

  // --- STATE ---
  const [files, setFiles] = useState<File[]>([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [deleteStatus, setDeleteStatus] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [alpacaChunks, setAlpacaChunks] = useState<AlpacaChunk[] | null>(null)
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [trainingFileId, setTrainingFileId] = useState<string | null>(null)
  const [checkingDatasetId, setCheckingDatasetId] = useState<string | null>(null)

  // NEW STATE FOR TRAINING & TESTING
  const [trainingStatuses, setTrainingStatuses] = useState<{ [fileId: string]: TrainingStatus }>({})
  const [showTrainingModal, setShowTrainingModal] = useState<string | null>(null)
  const [showTestModal, setShowTestModal] = useState<string | null>(null)
  const [modelStatuses, setModelStatuses] = useState<{ [fileId: string]: ModelStatus }>({})

  // Easter EGG STATE
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const [keySequence, setKeySequence] = useState<string[]>([])

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- AUTH CHECKED STATE ---
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const hasRunAuthCheck = useRef(false)

  // ---------- ALL HOOKS MUST BE ABOVE ANY EARLY RETURN ----------

  // ENHANCED: Check model status with persistent state
  const checkModelStatus = async (fileId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/check-model-status/${fileId}`)
      const result: ModelStatus = await response.json()
      
      setModelStatuses(prev => ({
        ...prev,
        [fileId]: result
      }))
      
      // If training in progress, update training status
      if (result.training_in_progress && result.progress !== undefined) {
        setTrainingStatuses(prev => ({
          ...prev,
          [fileId]: {
            status: 'training',
            message: result.message || 'Training in progress...',
            progress: result.progress || 50
          }
        }))
      }
      
      // If training completed, ensure we show completed status
      if (result.trained && result.training_completed) {
        setTrainingStatuses(prev => ({
          ...prev,
          [fileId]: {
            status: 'completed',
            message: 'Training completed successfully!',
            progress: 100,
            model_path: result.model_path
          }
        }))
      }
    } catch (error) {
      console.error('Error checking model status:', error)
      // Fail silently for model status checks to avoid blocking UI
      setModelStatuses(prev => ({
        ...prev,
        [fileId]: {
          trained: false,
          message: 'Error checking status',
          training_in_progress: false
        }
      }))
    }
  }

  // ENHANCED: Fetch uploaded files with better status handling
  const fetchUploadedFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Fetch error:', error.message)
        return
      }
      
      setUploadedFiles(data as UploadedFile[])
      
      // Check model status for each file (with delay to prevent rate limiting)
      if (data && data.length > 0) {
        data.forEach((file: UploadedFile, index: number) => {
          setTimeout(() => {
            checkModelStatus(file.id)
          }, index * 200) // Stagger requests by 200ms
        })
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  // Auth check effect (with retry on rate limit)
  useEffect(() => {
    if (hasRunAuthCheck.current) {
      setIsCheckingAuth(false)
      return
    }
    hasRunAuthCheck.current = true

    let isMounted = true
    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

    const checkAuthOnceWithRetry = async () => {
      try {
        const first = await supabase.auth.getSession()
        if (first.error) {
          const msg = first.error.message?.toLowerCase?.() || ''
          if (msg.includes('rate limit')) {
            await sleep(700)
            const second = await supabase.auth.getSession()
            if (second.error) {
              setAuthError(second.error.message || 'Authentication rate limit. Please try again.')
              if (isMounted) setIsCheckingAuth(false)
              router.replace('/login')
              return
            }
            if (!second.data.session?.user) {
              router.replace('/login')
              if (isMounted) setIsCheckingAuth(false)
              return
            }
            if (isMounted) setIsCheckingAuth(false)
            return
          } else {
            setAuthError(first.error.message || 'Authentication error.')
            router.replace('/login')
            if (isMounted) setIsCheckingAuth(false)
            return
          }
        }
        if (!first.data.session?.user) {
          router.replace('/login')
          if (isMounted) setIsCheckingAuth(false)
          return
        }
      } catch (error: any) {
        console.error('Auth check failed:', error)
        setAuthError(error?.message || 'Authentication failed.')
        router.replace('/login')
      } finally {
        if (isMounted) setIsCheckingAuth(false)
      }
    }

    checkAuthOnceWithRetry()
    return () => {
      isMounted = false
    }
  }, [router])

  // Easter EGG LOGIC effect
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      if (key === 'd' || key === 'e' || key === 'b' || key === 'u' || key === 'g') {
        setKeySequence((prev) => {
          const newSeq = [...prev, key].slice(-5)
          if (newSeq.join('') === 'debug') {
            setShowEasterEgg(true)
            return []
          }
          return newSeq
        })
      }

      const konamiCode = [
        'arrowup',
        'arrowup',
        'arrowdown',
        'arrowdown',
        'arrowleft',
        'arrowright',
        'arrowleft',
        'arrowright',
        'b',
        'a',
      ]
      if (
        konamiCode.includes(key) ||
        key === 'arrowup' ||
        key === 'arrowdown' ||
        key === 'arrowleft' ||
        key === 'arrowright'
      ) {
        setKeySequence((prev) => {
          const newSeq = [...prev, key].slice(-10)
          if (newSeq.join(',') === konamiCode.join(',')) {
            setShowEasterEgg(true)
            return []
          }
          return newSeq
        })
      }
    }

    let clickCount = 0
    const titleClickHandler = () => {
      clickCount++
      if (clickCount === 3) {
        setShowEasterEgg(true)
        clickCount = 0
      }
      setTimeout(() => {
        clickCount = 0
      }, 1000)
    }

    document.addEventListener('keydown', handleKeyPress)
    const dashboardTitle = document.querySelector('h1')
    dashboardTitle?.addEventListener('click', titleClickHandler)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      dashboardTitle?.removeEventListener('click', titleClickHandler)
    }
  }, [])

  // ENHANCED: Better error handling in effects
  useEffect(() => {
    fetchUploadedFiles().catch(console.error)
  }, [])

  // ENHANCED: Training status polling with better persistence
  useEffect(() => {
    const interval = setInterval(() => {
      // Poll training status for files that are training
      Object.keys(trainingStatuses).forEach((fileId) => {
        const status = trainingStatuses[fileId]
        if (status && (status.status === 'training' || status.status === 'starting')) {
          pollTrainingStatus(fileId)
        }
      })
      
      // Also check model statuses to catch completed training
      Object.keys(modelStatuses).forEach((fileId) => {
        const modelStatus = modelStatuses[fileId]
        if (modelStatus && modelStatus.training_in_progress) {
          checkModelStatus(fileId)
        }
      })
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [trainingStatuses, modelStatuses])

  // ---------- END: ALL HOOKS ABOVE ANY EARLY RETURN ----------

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // ---------- HELPERS / HANDLERS ----------
  const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setModal({ isOpen: true, title, message, type })
  }

  const showTimedStatus = (message: string) => {
    setUploadStatus(message)
    setTimeout(() => {
      setUploadStatus('')
    }, 3500)
  }

  const showTimedDeleteStatus = (message: string) => {
    setDeleteStatus(message)
    setTimeout(() => {
      setDeleteStatus('')
    }, 3500)
  }

  const closeModal = () => {
    setModal({ ...modal, isOpen: false })
  }

  const handleLogout = async () => {
    try {
      console.log('Starting comprehensive logout...')
      await supabase.auth.signOut({ scope: 'global' })
      await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      localStorage.clear()
      sessionStorage.clear()
      const cookies = document.cookie.split(';')
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/dashboard`
      }
      window.history.replaceState(null, '', '/login')
      window.location.replace('/login')
    } catch (err) {
      console.error('Logout failed:', err)
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/login')
    }
  }

  // ENHANCED: Poll training status with better error handling
  const pollTrainingStatus = async (fileId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/training-status/${fileId}`)
      if (!response.ok) {
        console.error('Training status request failed:', response.status)
        return
      }
      
      const result = await response.json()

      // Handle different response formats
      let statusObj: any = result
      if (result.status && typeof result.status === 'object') {
        statusObj = result.status
      }

      const statusString = statusObj.status?.toString() || 'unknown'
      const progressNum = Number(statusObj.progress || statusObj.percent || 0)

      setTrainingStatuses(prev => ({
        ...prev,
        [fileId]: {
          status: statusString as any,
          message: statusObj.message || 'Training in progress...',
          progress: Math.max(0, Math.min(100, progressNum)),
          model_path: statusObj.model_path,
          error: statusObj.error,
          training_completed: statusString === 'completed'
        }
      }))

      // If training completed, update model status and refresh file list
      if (statusString === 'completed') {
        setModelStatuses(prev => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            trained: true,
            training_in_progress: false,
            training_completed: true,
            message: 'Training completed successfully'
          }
        }))
        
        // Show success notification
        const file = uploadedFiles.find(f => f.id === fileId)
        if (file) {
          showModal(
            'Training Completed!', 
            `Training for "${file.file_name}" completed successfully. You can now test the model or download it.`, 
            'success'
          )
        }
        
        // Refresh file list to update database info
        fetchUploadedFiles()
      }

      // If failed
      if (statusString === 'failed') {
        setModelStatuses(prev => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            trained: false,
            training_in_progress: false,
            message: 'Training failed'
          }
        }))
        
        const file = uploadedFiles.find(f => f.id === fileId)
        showModal(
          'Training Failed', 
          `Training for "${file?.file_name || fileId}" failed: ${statusObj.error || statusObj.message || 'Unknown error'}`, 
          'error'
        )
      }
    } catch (error) {
      console.error('Error polling training status:', error)
    }
  }

  const handleUpload = async () => {
    if (!files.length) {
      showTimedStatus('Please select file(s)')
      return
    }

    setUploadStatus('Uploading...')

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData,
        })

        let result
        try {
          result = await res.json()
        } catch {
          showTimedStatus('Upload failed: Invalid JSON response')
          continue
        }

        if (!res.ok) {
          console.error('Upload error:', result.detail || result)
          showTimedStatus(`Upload failed: ${result.detail || 'Unknown error'}`)
          continue
        }
      } catch (err) {
        console.error('Network error:', err)
        showTimedStatus('Upload failed: Network error')
        continue
      }
    }

    showTimedStatus('All files uploaded successfully!')
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    fetchUploadedFiles()
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleDeleteUploadedFile = async (file: UploadedFile) => {
    setDeletingFileId(file.id)
    setDeleteStatus(`Deleting "${file.file_name}"...`)

    try {
      const res = await fetch(`${API_BASE_URL}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: file.file_path }),
      })

      let result
      try {
        result = await res.json()
      } catch {
        showTimedDeleteStatus('Delete failed: Invalid JSON response')
        setDeletingFileId(null)
        return
      }

      if (!res.ok) {
        console.error('Delete error:', result.detail || result)
        showTimedDeleteStatus(`Failed to delete: ${result.detail || 'Unknown error'}`)
        setDeletingFileId(null)
        return
      }

      showTimedDeleteStatus(`Deleted "${file.file_name}"`)
      fetchUploadedFiles()
    } catch (err) {
      console.error('Network error:', err)
      showTimedDeleteStatus('Network error while deleting')
    } finally {
      setDeletingFileId(null)
    }
  }

  const checkDatasetExists = async (file: UploadedFile): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/check-dataset/${file.file_path}`)
      const result = await res.json()

      if (result.exists) {
        showModal(
          'Dataset Already Exists',
          `A dataset has already been generated for "${file.file_name}". Use the training button to train with the existing dataset.`,
          'info',
        )
        return true
      }

      return false
    } catch (err) {
      console.error('Error checking dataset:', err)
      showModal('Error', 'Failed to check if dataset exists. Please try again.', 'error')
      return false
    }
  }

  const handleCreateAlpaca = async (file: UploadedFile) => {
    setCheckingDatasetId(file.id)

    const exists = await checkDatasetExists(file)
    setCheckingDatasetId(null)

    if (exists) {
      fetchUploadedFiles()
      return
    }

    setLoadingFileId(file.id)
    setAlpacaChunks(null)
    setUploadStatus('Generating Alpaca format...')

    try {
      const res = await fetch(`${API_BASE_URL}/generate-gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: file.file_path }),
      })

      const result = await res.json()

      if (!res.ok || result?.error || result?.detail) {
        const errMsg = result?.error || result?.detail || 'Unknown error'
        console.error('Gemini error:', errMsg)
        showTimedStatus(`Gemini error: ${errMsg}`)
        showModal('Generation Failed', `Failed to generate dataset: ${errMsg}`, 'error')
        setLoadingFileId(null)
        return
      }

      if (!result.alpaca_format || !Array.isArray(result.alpaca_format) || result.alpaca_format.length === 0) {
        showTimedStatus('Gemini response missing valid alpaca_format')
        showModal('Generation Failed', 'Invalid response from AI model. Please try again.', 'error')
        setLoadingFileId(null)
        return
      }

      if (!file.file_name) {
        showTimedStatus('Missing file_name, cannot save Alpaca JSON')
        showModal('Save Failed', 'Missing file information. Cannot save dataset.', 'error')
        setLoadingFileId(null)
        return
      }

      setAlpacaChunks(result.alpaca_format)
      showTimedStatus(`Dataset generated successfully! ${result.alpaca_format.length} Q&A pairs created.`)

      const saveRes = await fetch(`${API_BASE_URL}/save-alpaca-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alpaca_format: result.alpaca_format,
          file_name: file.file_name,
        }),
      })

      const saveResult = await saveRes.json()

      if (!saveRes.ok || saveResult?.error) {
        showTimedStatus(`Generated but not saved: ${saveResult?.error || 'Unknown error'}`)
        showModal('Save Warning', 'Dataset was generated but could not be saved. Please try again.', 'warning')
      } else {
        showTimedStatus('Dataset created successfully!')
        showModal(
          'Dataset Created Successfully!',
          `Dataset has been generated and saved for "${file.file_name}". You can now use the training button to train your model.`,
          'success',
        )
        fetchUploadedFiles()
      }
    } catch (err) {
      console.error('Gemini request failed:', err)
      showTimedStatus('Dataset generation failed')
      showModal('Network Error', 'Failed to connect to the AI service. Please check your connection and try again.', 'error')
    } finally {
      setLoadingFileId(null)
    }
  }

  // ENHANCED: Handle training with better status management
  const handleTraining = async (file: UploadedFile) => {
    if (!file.alpaca_path) {
      showModal(
        'No Dataset Available',
        `No dataset found for "${file.file_name}". Please generate a dataset first using the Create button.`,
        'warning',
      )
      return
    }

    // Check current model status
    const currentModelStatus = modelStatuses[file.id]
    if (currentModelStatus?.trained && currentModelStatus?.training_completed) {
      showModal('Model Already Trained', 'This model has already been trained successfully. You can test it now!', 'info')
      return
    }

    // Check if training is in progress
    const currentTrainingStatus = trainingStatuses[file.id]
    if (currentTrainingStatus && (currentTrainingStatus.status === 'training' || currentTrainingStatus.status === 'starting')) {
      setShowTrainingModal(file.id)
      return
    }

    setTrainingFileId(file.id)

    try {
      const response = await fetch(`${API_BASE_URL}/start-training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: file.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Training failed to start')
      }

      // Set training status immediately
      setTrainingStatuses(prev => ({
        ...prev,
        [file.id]: {
          status: 'training',
          message: result?.status?.message || result?.message || 'Training started...',
          progress: typeof result?.progress === 'number' ? result.progress : 5,
          model_path: result?.model_path || undefined,
        }
      }))

      // Update model status to reflect training in progress
      setModelStatuses(prev => ({
        ...prev,
        [file.id]: {
          ...prev[file.id],
          trained: false,
          training_in_progress: true,
          message: 'Training in progress'
        }
      }))

      // Show training modal
      setShowTrainingModal(file.id)

      // Start polling immediately
      setTimeout(() => pollTrainingStatus(file.id), 1000)

      showModal('Training Started', `Training has started for "${file.file_name}". This may take several minutes.`, 'info')

    } catch (err: any) {
      console.error('Training error:', err)
      showModal('Training Failed', err.message || 'Failed to start training. Please try again.', 'error')
    } finally {
      setTrainingFileId(null)
    }
  }

  // ENHANCED: Download model with proper error handling
  const downloadModel = async (fileId: string) => {
    try {
      // Check if model is actually trained before attempting download
      const modelStatus = modelStatuses[fileId]
      if (!modelStatus?.trained) {
        showModal('Download Error', 'Model is not trained yet. Please complete training first.', 'warning')
        return
      }

      const response = await fetch(`${API_BASE_URL}/download-model/${fileId}`)
      
      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({ detail: 'Download failed' }))
        throw new Error(errorResult.detail || 'Failed to download model')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `model_${fileId}.zip`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '')
        }
      }
      
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      showModal('Download Started', `Model download started: ${filename}`, 'success')
      
    } catch (err: any) {
      console.error('Download error:', err)
      showModal('Download Error', err.message || 'Failed to download model. Please try again.', 'error')
    }
  }

  // ENHANCED: Handle testing with better validation
  const handleTesting = (file: UploadedFile) => {
    const modelStatus = modelStatuses[file.id]
    
    if (!modelStatus?.trained || !modelStatus?.training_completed) {
      showModal(
        'Model Not Ready', 
        'Please complete model training first before testing. The model must be fully trained to respond to questions.', 
        'warning'
      )
      return
    }
    
    setShowTestModal(file.id)
  }

  // Helper functions for better status management
  const hasDataset = (file: UploadedFile): boolean => {
    return Boolean(file.alpaca_path && file.alpaca_path.trim() !== '')
  }

  const isModelTrained = (fileId: string): boolean => {
    const modelStatus = modelStatuses[fileId]
    return Boolean(modelStatus?.trained && modelStatus?.training_completed)
  }

  const isTrainingInProgress = (fileId: string): boolean => {
    const modelStatus = modelStatuses[fileId]
    const trainingStatus = trainingStatuses[fileId]
    
    return Boolean(
      modelStatus?.training_in_progress || 
      (trainingStatus && (trainingStatus.status === 'training' || trainingStatus.status === 'starting'))
    )
  }

  const getTrainingStatus = (fileId: string): TrainingStatus | null => {
    return trainingStatuses[fileId] || null
  }

  const getModelStatus = (fileId: string): ModelStatus | null => {
    return modelStatuses[fileId] || null
  }

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Easter EGG MODAL */}
      <EasterEggModal isOpen={showEasterEgg} onClose={() => setShowEasterEgg(false)} />

      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <h1
            className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            title="Triple-click me!"
          >
            Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        {/* Dataset Status Modal */}
        <DatasetModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          title={modal.title}
          message={modal.message}
          type={modal.type}
        />

        {/* Training Progress Modal */}
        {showTrainingModal && (
          <TrainingProgressModal
            isOpen={Boolean(showTrainingModal)}
            onClose={() => setShowTrainingModal(null)}
            trainingStatus={getTrainingStatus(showTrainingModal) || {
              status: 'not_started',
              message: 'Unknown status',
              progress: 0
            }}
            fileName={uploadedFiles.find(f => f.id === showTrainingModal)?.file_name || 'Unknown'}
            onDownload={() => {
              if (showTrainingModal) downloadModel(showTrainingModal)
            }}
          />
        )}

        {/* Test Model Modal */}
        {showTestModal && (
          <TestModelModal
            isOpen={Boolean(showTestModal)}
            onClose={() => setShowTestModal(null)}
            fileId={showTestModal}
            fileName={uploadedFiles.find(f => f.id === showTestModal)?.file_name || 'Unknown'}
          />
        )}

        {/* Upload Card */}
        <Card
          className="border-2 border-dashed border-gray-300 p-4 hover:border-gray-400 transition-colors"
          onDrop={(e) => {
            e.preventDefault()
            const droppedFiles = Array.from(e.dataTransfer.files)
            setFiles((prev) => [...prev, ...droppedFiles])
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              Upload Document(s)
              <span className="text-xs text-gray-400 ml-auto" title="Try typing 'debug'">
                v3.1
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">Choose or Drag your file(s)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                ref={fileInputRef}
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              <p className="text-sm text-gray-600 mt-2">
                {files.length === 0 ? 'No files chosen' : `${files.length} file(s) chosen`}
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2 border border-gray-300 p-4 rounded-md">
                <p className="font-semibold mb-2">Preview Selected Files:</p>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex justify-between items-center text-sm border-b pb-1">
                      <div>
                        <span className="font-medium">{file.name}</span>
                        <span className="text-gray-500 text-xs ml-2">({(file.size / 1024).toFixed(2)} KB)</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleUpload}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Upload
            </button>

            {uploadStatus && (
              <div
                aria-live="polite"
                className={`flex items-center gap-2 mt-2 ${
                  uploadStatus.includes('success')
                    ? 'text-green-600'
                    : uploadStatus.includes('...')
                    ? 'text-blue-600'
                    : 'text-red-600'
                }`}
              >
                {uploadStatus.includes('success') ? (
                  <CheckCircle size={16} />
                ) : uploadStatus.includes('...') ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                <span>{uploadStatus}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Uploaded Files Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              Uploaded Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadedFiles.length === 0 ? (
              <p className="text-gray-500">No files uploaded yet.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Size (KB)</TableHead>
                      <TableHead>Extension</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      <TableHead>Dataset</TableHead>
                      <TableHead>Model Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedFiles.map((file) => {
                      const trainingStatus = getTrainingStatus(file.id)
                      const modelStatus = getModelStatus(file.id)
                      const isTraining = isTrainingInProgress(file.id)
                      const isModelReady = isModelTrained(file.id)
                      
                      return (
                        <TableRow key={file.id}>
                          <TableCell className="font-medium">{file.file_name}</TableCell>
                          <TableCell>{(file.file_size / 1024).toFixed(2)}</TableCell>
                          <TableCell>{file.file_extension}</TableCell>
                          <TableCell>{new Date(file.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {hasDataset(file) ? (
                                <>
                                  <CheckCircle size={16} className="text-green-500" />
                                  <span className="text-green-600 text-sm font-medium">Ready</span>
                                </>
                              ) : (
                                <>
                                  <XCircle size={16} className="text-gray-400" />
                                  <span className="text-gray-500 text-sm">Not Generated</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isModelReady ? (
                                <>
                                  <CheckCircle size={16} className="text-green-500" />
                                  <span className="text-green-600 text-sm font-medium">Trained</span>
                                </>
                              ) : isTraining ? (
                                <>
                                  <Loader2 size={16} className="text-blue-500 animate-spin" />
                                  <span className="text-blue-600 text-sm font-medium">
                                    Training ({trainingStatus?.progress || 0}%)
                                  </span>
                                </>
                              ) : modelStatus?.needs_retraining ? (
                                <>
                                  <AlertCircle size={16} className="text-yellow-500" />
                                  <span className="text-yellow-600 text-sm font-medium">Needs Retraining</span>
                                </>
                              ) : (
                                <>
                                  <XCircle size={16} className="text-gray-400" />
                                  <span className="text-gray-500 text-sm">Not Trained</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="space-x-2 text-right">
                            {/* Create Dataset Button */}
                            <button
                              className={`px-3 py-2 rounded text-white transition-colors text-sm min-w-[80px] ${
                                hasDataset(file) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                              }`}
                              onClick={() => handleCreateAlpaca(file)}
                              disabled={Boolean(
                                loadingFileId === file.id ||
                                  deletingFileId === file.id ||
                                  checkingDatasetId === file.id ||
                                  hasDataset(file),
                              )}
                              title={hasDataset(file) ? 'Dataset already exists' : 'Generate Dataset'}
                            >
                              {loadingFileId === file.id ? (
                                <Loader2 className="animate-spin mx-auto" size={16} />
                              ) : checkingDatasetId === file.id ? (
                                <Loader2 className="animate-spin mx-auto" size={16} />
                              ) : (
                                <>
                                  <PlusCircle size={14} className="inline mr-1" />
                                  {hasDataset(file) ? 'Created' : 'Create'}
                                </>
                              )}
                            </button>

                            {/* Train Model Button */}
                            <button
                              className={`px-3 py-2 rounded text-white transition-colors text-sm min-w-[80px] ${
                                hasDataset(file) && !isModelReady && !isTraining
                                  ? 'bg-purple-500 hover:bg-purple-600'
                                  : isTraining
                                  ? 'bg-blue-500 hover:bg-blue-600'
                                  : isModelReady
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-gray-400 cursor-not-allowed'
                              }`}
                              onClick={() => isTraining ? setShowTrainingModal(file.id) : handleTraining(file)}
                              disabled={Boolean(
                                !hasDataset(file) || 
                                trainingFileId === file.id || 
                                loadingFileId === file.id || 
                                deletingFileId === file.id ||
                                (isModelReady && !isTraining)
                              )}
                              title={
                                !hasDataset(file) 
                                  ? 'Generate dataset first'
                                  : isModelReady
                                  ? 'Already trained'
                                  : isTraining
                                  ? 'View training progress'
                                  : 'Train with this dataset'
                              }
                            >
                              {trainingFileId === file.id ? (
                                <Loader2 className="animate-spin mx-auto" size={16} />
                              ) : isTraining ? (
                                <>
                                  <Play size={14} className="inline mr-1" />
                                  Progress
                                </>
                              ) : (
                                <>
                                  <Brain size={14} className="inline mr-1" />
                                  {isModelReady ? 'Trained' : 'Train'}
                                </>
                              )}
                            </button>

                            {/* Test Model Button */}
                            <button
                              className={`px-3 py-2 rounded text-white transition-colors text-sm min-w-[80px] ${
                                isModelReady ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-400 cursor-not-allowed'
                              }`}
                              onClick={() => handleTesting(file)}
                              disabled={!isModelReady}
                              title={isModelReady ? 'Test your trained model' : 'Train model first'}
                            >
                              <MessageSquare size={14} className="inline mr-1" />
                              Test
                            </button>

                            {/* Download Button: Only enabled if model is fully trained and training_completed */}
                            <button
                              className={`px-3 py-2 rounded text-white transition-colors text-sm min-w-[80px] ${
                                isModelTrained(file.id)
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-gray-300 cursor-not-allowed'
                              }`}
                              onClick={() => isModelTrained(file.id) && downloadModel(file.id)}
                              disabled={!isModelTrained(file.id)}
                              title={isModelTrained(file.id) ? 'Download trained model' : 'Model not available'}
                            >
                              <Download size={14} className="inline mr-1" />
                              Download
                            </button>

                            {/* Delete Button */}
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded transition-colors text-sm min-w-[80px]"
                              onClick={() => handleDeleteUploadedFile(file)}
                              disabled={Boolean(deletingFileId === file.id || loadingFileId === file.id)}
                              title="Delete File"
                            >
                              {deletingFileId === file.id ? (
                                <Loader2 className="animate-spin mx-auto" size={16} />
                              ) : (
                                <>
                                  <Trash2 size={14} className="inline mr-1" />
                                  Delete
                                </>
                              )}
                            </button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {deleteStatus && (
                  <div
                    aria-live="polite"
                    className={`flex items-center gap-2 mt-4 p-2 rounded-md text-sm font-medium ${
                      deleteStatus.includes('Deleted')
                        ? 'text-green-700 bg-green-100'
                        : deleteStatus.includes('Deleting')
                        ? 'text-blue-700 bg-blue-100'
                        : 'text-red-700 bg-red-100'
                    }`}
                  >
                    <span>{deleteStatus}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Alpaca Output Preview */}
        {alpacaChunks && (
          <Card>
            <CardHeader>
              <CardTitle>Alpaca Format Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md">
                <p className="text-green-800 font-medium">
                  Dataset generated successfully! {alpacaChunks.length} Q&A pairs created.
                </p>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-4">
                {alpacaChunks.map((chunk, index) => (
                  <div key={index} className="border p-4 rounded-md bg-gray-50 text-sm whitespace-pre-line">
                    <div className="font-semibold mb-2 text-blue-600">Q&A Pair #{index + 1}</div>
                    <div className="mb-2">
                      <strong className="text-purple-600">Instruction:</strong> {chunk.instruction}
                    </div>
                    <div className="mb-2">
                      <strong className="text-orange-600">Input:</strong> {chunk.input}
                    </div>
                    <div>
                      <strong className="text-green-600">Output:</strong> {chunk.output}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-gray-400 mt-8">
          <p>Pro tip: Upload → Create Dataset → Train Model → Test AI!</p>
        </div>
      </div>
    </div>
  )
}