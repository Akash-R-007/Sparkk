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
} from 'lucide-react'

type UploadedFile = {
  id: string
  file_name: string
  file_size: number
  file_extension: string
  created_at: string
  file_path: string
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [deleteStatus, setDeleteStatus] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [alpacaChunks, setAlpacaChunks] = useState<string[] | null>(null)
  const [loadingChunks, setLoadingChunks] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchUploadedFiles = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Fetch error:', error.message)
    } else {
      setUploadedFiles(data as UploadedFile[])
    }
  }

  useEffect(() => {
    fetchUploadedFiles()
  }, [])

  const handleUpload = async () => {
    if (!files.length) {
      setUploadStatus('❌ Please select file(s)')
      return
    }

    setUploadStatus('⏳ Uploading...')

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await res.json()

        if (!res.ok) {
          console.error('❌ Upload error:', result.detail)
          setUploadStatus(`❌ Upload failed: ${result.detail}`)
          continue
        }
      } catch (err) {
        console.error('❌ Network error:', err)
        setUploadStatus('❌ Upload failed: Network error')
        continue
      }
    }

    setUploadStatus('✅ All files uploaded successfully!')
    setFiles([])
    fetchUploadedFiles()
  }

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
  }

  const handleDeleteUploadedFile = async (file: UploadedFile) => {
    setDeleteStatus(`⏳ Deleting "${file.file_name}"...`)

    try {
      const res = await fetch('http://localhost:8000/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: file.file_path,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        console.error('❌ Delete error:', result.detail)
        setDeleteStatus(`❌ Failed to delete: ${result.detail}`)
        return
      }

      setDeleteStatus(`✅ Deleted "${file.file_name}"`)
      fetchUploadedFiles()
    } catch (err) {
      console.error('❌ Network error:', err)
      setDeleteStatus('❌ Network error while deleting')
    }
  }

  const handleCreateAlpaca = async (file: UploadedFile) => {
    setLoadingChunks(true)
    setAlpacaChunks(null)

    const fullUrl = `http://localhost:8000/docs/${file.file_path}`

    try {
      const res = await fetch('/api/convert-to-alpaca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_url: fullUrl }),
      })

      const result = await res.json()

      if (!res.ok || result.error) {
        console.error('❌ Gemini error:', result.error)
        setUploadStatus(`❌ Gemini error: ${result.error}`)
      } else {
        setAlpacaChunks(result.alpaca_format)
      }
    } catch (err) {
      console.error('❌ Network error:', err)
      setUploadStatus('❌ Gemini request failed')
    } finally {
      setLoadingChunks(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Upload Form */}
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
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">Choose or Drag your file(s)</Label>
            <Input
              key={files.length}
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              multiple
              ref={fileInputRef}
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            <p className="text-sm text-gray-600 mt-2">
              {files.length === 0
                ? 'No files chosen'
                : `${files.length} file(s) chosen`}
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2 border border-gray-300 p-4 rounded-md">
              <p className="font-semibold mb-2">📄 Preview Selected Files:</p>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center text-sm border-b pb-1"
                  >
                    <div>
                      <span className="font-medium">{file.name}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
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
              className={`flex items-center gap-2 mt-2 ${
                uploadStatus.startsWith('✅')
                  ? 'text-green-600'
                  : uploadStatus.startsWith('⏳')
                  ? 'text-blue-600'
                  : 'text-red-600'
              }`}
            >
              {uploadStatus.startsWith('✅') ? (
                <CheckCircle size={16} />
              ) : uploadStatus.startsWith('⏳') ? (
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>{file.file_name}</TableCell>
                      <TableCell>{(file.file_size / 1024).toFixed(2)}</TableCell>
                      <TableCell>{file.file_extension}</TableCell>
                      <TableCell>
                        {new Date(file.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                          onClick={() => handleCreateAlpaca(file)}
                          disabled={loadingChunks}
                        >
                          {loadingChunks ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <PlusCircle size={14} />
                          )}
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          onClick={() => handleDeleteUploadedFile(file)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {deleteStatus && (
                <div
                  className={`flex items-center gap-2 mt-4 p-2 rounded-md text-sm font-medium ${
                    deleteStatus.startsWith('✅')
                      ? 'text-green-700 bg-green-100'
                      : deleteStatus.startsWith('⏳')
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

      {/* 🧠 Gemini Output */}
      {alpacaChunks && (
        <Card>
          <CardHeader>
            <CardTitle>🧠 Gemini Alpaca Format Output</CardTitle>
          </CardHeader>
          <CardContent>
            {alpacaChunks.map((chunk, index) => (
              <div
                key={index}
                className="border p-4 rounded-md bg-gray-50 mb-2 text-sm whitespace-pre-wrap"
              >
                <strong>Chunk {index + 1}:</strong>
                <br />
                {chunk}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
