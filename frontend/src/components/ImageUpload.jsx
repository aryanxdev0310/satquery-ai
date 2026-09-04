import React, { useState, useEffect, useRef } from 'react';

/**
 * ImageUpload Component (Step 5: Satellite Image Upload & Preview)
 * Allows selecting/dropping satellite imagery from local filesystem.
 * Supports: PNG, JPG/JPEG, TIFF, and GeoTIFF (.tif, .tiff, .geotiff).
 * 
 * Features:
 * - Local file selection & drag-and-drop
 * - Browser image preview for PNG/JPG/JPEG
 * - Dedicated metadata info view for TIFF/GeoTIFF raster files
 * - File size formatting
 * - Replace file option (select a new file directly)
 * - Remove / Clear file option
 * - Stores File object in React state (prepared for multipart/form-data)
 * - Zero backend API calls (strictly client-side for Step 5)
 */
function ImageUpload({ selectedFile, onFileSelect, onFileRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Supported remote sensing formats
  const acceptedFormats = '.png,.jpg,.jpeg,.tif,.tiff,.geotiff,image/png,image/jpeg,image/tiff';

  // Manage preview object URL with proper cleanup to prevent memory leaks
  useEffect(() => {
    if (!selectedFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    // Standard web optical formats can be previewed in <img> tags
    const isBrowserPreviewable = /\.(png|jpe?g|webp)$/i.test(selectedFile.name);
    if (isBrowserPreviewable) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      // TIFF / GeoTIFF contains multi-spectral raster data not natively decoded by standard HTML <img>
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Validate and handle file
  const processFile = (file) => {
    if (!file) return;

    // Check extension
    const isValid = /\.(png|jpe?g|tif|tiff|geotiff)$/i.test(file.name);
    if (!isValid) {
      alert('Please upload a valid satellite image format: PNG, JPG/JPEG, TIFF, or GeoTIFF (.tif/.tiff).');
      return;
    }

    onFileSelect(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset file input value so the same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Clear / remove the currently selected file
  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemove();
  };

  // Replace file: triggers the file picker directly
  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  // Helper to format bytes into readable KB/MB/GB
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Determine file type category
  const isGeoTiff = selectedFile && /\.(tif|tiff|geotiff)$/i.test(selectedFile.name);
  const fileExt = selectedFile ? selectedFile.name.split('.').pop().toUpperCase() : '';

  return (
    <div className="card upload-card">
      {/* Card Header */}
      <div className="card-header">
        <span className="card-title">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          Satellite Image Source
        </span>
        <span className="card-badge">Step 5 Active</span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Upload State: No file selected yet */}
      {!selectedFile ? (
        <div
          className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <div className="upload-icon-container">
            <svg
              className="upload-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <p className="upload-title">Select or Drop Satellite Image</p>
          <p className="upload-subtitle">Supports GeoTIFF, TIFF, PNG, JPG, JPEG</p>

          <button
            type="button"
            className="btn-upload-browse"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m8 16 4-4 4 4" />
            </svg>
            Choose Image File
          </button>
        </div>
      ) : (
        /* File Selected State */
        <div className="file-preview-card">
          {/* Visual Preview or GeoTIFF Info Badge */}
          {previewUrl ? (
            <div className="preview-thumb-wrapper" title="Optical Image Preview">
              <img src={previewUrl} alt="Satellite Preview" className="preview-thumb" />
              <span className="preview-type-pill">{fileExt}</span>
            </div>
          ) : (
            <div className="geotiff-badge" title="Multi-Spectral Raster Dataset">
              <span className="geotiff-icon">🛰️</span>
              <span className="geotiff-label">{isGeoTiff ? 'GeoTIFF' : fileExt}</span>
              <span className="geotiff-sub">Raster</span>
            </div>
          )}

          {/* File Metadata Details */}
          <div className="file-info">
            <div className="file-name" title={selectedFile.name}>
              {selectedFile.name}
            </div>
            <div className="file-meta-row">
              <span className="file-size">{formatFileSize(selectedFile.size)}</span>
              <span className="file-tag">
                {isGeoTiff ? 'Multi-Spectral GeoTIFF' : `${fileExt} Optical Image`}
              </span>
            </div>
            {isGeoTiff && (
              <div className="file-sub-notice">
                <span>Raster array stored in memory for backend analysis</span>
              </div>
            )}
          </div>

          {/* Action Buttons: Replace and Remove */}
          <div className="file-actions">
            <button
              type="button"
              className="btn-replace-file"
              onClick={handleReplace}
              title="Select a different satellite image"
            >
              Replace
            </button>
            <button
              type="button"
              className="btn-remove-file"
              onClick={handleClear}
              title="Remove satellite image"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
