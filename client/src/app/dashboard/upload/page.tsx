// upload.tsx
'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

type AllowedType = 'pdf' | 'image';

const Upload = () => {


  const [fileType, setFileType] = useState<AllowedType>('pdf');
  const [fileData, setFileData] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const router = useRouter();

  const acceptString = fileType === 'pdf'
    ? 'application/pdf'
    : 'image/*';

  const extension = fileType === 'pdf' ? '.pdf' : 'image';

  const validateFile = (file: File) => {
    if (fileType === 'pdf' && file.type !== 'application/pdf') {
      return false;
    }
    if (fileType === 'image' && !file.type.startsWith('image/')) {
      return false;
    }
    return true;
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!validateFile(file)) {
      setError(`Please upload a valid ${extension}`);
      return;
    }
    setFileData(file);
    setError('');
    setPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleFile(e.target.files?.[0]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  /* ------------------------------------------------------------------ */
  /* 3. Upload                                                          */
  /* ------------------------------------------------------------------ */
  const handleUpload = async () => {
    if (!fileData) {
      setError('No file selected.');
      return;
    }
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return;
    }
    const formData = new FormData();
    formData.append(fileType === 'pdf' ? 'file' : 'image', fileData);

    try {
      const endpoint =
        fileType === 'pdf'
          ? 'http://localhost:5000/api/pdf/upload'
          : 'http://localhost:5000/api/pdf/image'; 
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || res.statusText);
      }

      const data = await res.json();
      setPreview(data.file_text || data.text || 'Upload successful!');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 space-y-6"
      >
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-slate-800">
          Upload Your File
        </h1>

        {/* Type Selector */}
        <div className="flex justify-center">
          <select
            value={fileType}
            onChange={(e) => {
              setFileType(e.target.value as AllowedType);
              setFileData(null);
              setPreview(null);
              setError('');
            }}
            className="bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
          </select>
        </div>

        {/* Drop-zone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors
            ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
        >
          <input
            type="file"
            accept={acceptString}
            className="hidden"
            onChange={handleFileChange}
            // multiple
          />
          <AnimatePresence>
            {!fileData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center space-y-2"
              >
                <svg
                  className="w-10 h-10 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm text-slate-600">
                  Drag & drop or click to select
                </span>
                <span className="text-xs text-slate-400">
                  Only {extension} files allowed
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {fileData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="font-semibold text-slate-700">{fileData.name}</p>
              <p className="text-xs text-slate-500">
                {(fileData.size / 1024).toFixed(1)} KB
              </p>
            </motion.div>
          )}
        </label>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}

        {/* Upload Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpload}
          disabled={!fileData}
          className={`w-full font-semibold py-3 rounded-xl transition
            ${fileData
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          Upload {fileType === 'pdf' ? 'PDF' : 'Image'}
        </motion.button>

        {/* Preview */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <h2 className="text-lg font-semibold mb-2 text-slate-700">
                Preview
              </h2>
              <pre className="bg-slate-100 rounded-lg p-4 text-sm max-h-60 overflow-auto">
                {preview}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Upload;