'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
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
import { CheckCircle, FileText, XCircle } from 'lucide-react'

type UploadedFile = {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_extension: string
  created_at: string
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

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
      setStatus('❌ Please select file(s)')
      return
    }

    setStatus('⏳ Uploading...')

    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const filePath = `documents/${Date.now()}-${file.name}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        })

      if (uploadError) {
        console.error('❌ Upload error:', uploadError.message)
        setStatus(`❌ Upload failed for ${file.name}: ${uploadError.message}`)
        continue
      }

      // Insert file metadata into 'documents' table
      const { error: dbError } = await supabase.from('documents').insert([
        {
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_extension: fileExt,
        },
      ])

      if (dbError) {
        console.error('❌ Metadata save error:', dbError.message)
        setStatus(`❌ Metadata save failed for ${file.name}: ${dbError.message}`)
        continue
      }
    }

    setStatus('✅ All files uploaded successfully!')
    setFiles([])
    fetchUploadedFiles()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            Upload Document(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">Choose your file(s)</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </div>
          <Button onClick={handleUpload}>Upload</Button>
          {status && (
            <div
              className={`flex items-center gap-2 mt-2 ${
                status.startsWith('✅')
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {status.startsWith('✅') ? (
                <CheckCircle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              <span>{status}</span>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size (KB)</TableHead>
                  <TableHead>Extension</TableHead>
                  <TableHead>Uploaded At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>{file.file_name}</TableCell>
                    <TableCell>{file.file_type}</TableCell>
                    <TableCell>{(file.file_size / 1024).toFixed(2)}</TableCell>
                    <TableCell>{file.file_extension}</TableCell>
                    <TableCell>
                      {new Date(file.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
