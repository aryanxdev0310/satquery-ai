import React, { useState, useRef } from 'react';
import {
  Upload,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
  Sparkles,
  Layers,
  HardDrive,
  Globe2,
  Info,
  Check,
  X
} from 'lucide-react';

export default function ImageUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // RGB Analysis States
  const [isAnalyzingRGB, setIsAnalyzingRGB] = useState(false);
  const [rgbAnalysisResult, setRgbAnalysisResult] = useState(null);
  const [rgbAnalysisError, setRgbAnalysisError] = useState(null);

  // Multispectral Analysis States
  const [isAnalyzingMS, setIsAnalyzingMS] = useState(false);
  const [msAnalysisResult, setMsAnalysisResult] = useState(null);
  const [msAnalysisError, setMsAnalysisError] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadResult(null);
    setUploadError(null);
    setRgbAnalysisResult(null);
    setRgbAnalysisError(null);
    setMsAnalysisResult(null);
    setMsAnalysisError(null);

    // Generate local preview URL if image
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadResult(null);
    setUploadError(null);
    setRgbAnalysisResult(null);
    setRgbAnalysisError(null);
    setMsAnalysisResult(null);
    setMsAnalysisError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      setUploadResult(result);
    } catch (err) {
      console.error('Upload Error:', err);
      setUploadError(err.message || 'Failed to connect to SatQuery upload API at http://127.0.0.1:8000/api/upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyzeRGB = async () => {
    if (!selectedFile) return;

    setIsAnalyzingRGB(true);
    setRgbAnalysisResult(null);
    setRgbAnalysisError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'RGB Analysis failed' }));
        throw new Error(errorData.detail || `Analysis failed with status ${response.status}`);
      }

      const result = await response.json();
      setRgbAnalysisResult(result);
    } catch (err) {
      console.error('RGB Analysis Error:', err);
      setRgbAnalysisError(err.message || 'Failed to analyze RGB image.');
    } finally {
      setIsAnalyzingRGB(false);
    }
  };

  const handleAnalyzeMultispectral = async () => {
    if (!selectedFile) return;

    setIsAnalyzingMS(true);
    setMsAnalysisResult(null);
    setMsAnalysisError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/analyze/multispectral', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Multispectral Analysis failed' }));
        throw new Error(errorData.detail || `Multispectral analysis failed with status ${response.status}`);
      }

      const result = await response.json();
      setMsAnalysisResult(result);
    } catch (err) {
      console.error('Multispectral Analysis Error:', err);
      setMsAnalysisError(err.message || 'Failed to perform multispectral analysis.');
    } finally {
      setIsAnalyzingMS(false);
    }
  };

  return (
    <div>
      {/* 1. Upload Card */}
      <div className="card">
        <h2 className="card-title">Satellite Image Ingestion</h2>
        <p className="card-subtitle">
          Upload satellite scenes (PNG, JPEG, TIFF, GeoTIFF, WebP, JP2) to store in SatQuery AI pipeline.
        </p>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.tif,.tiff,.jp2"
          style={{ display: 'none' }}
        />

        {/* Dropzone */}
        <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
          <Upload className="dropzone-icon" size={40} style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
            {selectedFile ? 'Change selected image' : 'Click to browse satellite image'}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Supports PNG, JPEG, TIFF, GeoTIFF, JP2, WebP
          </p>
        </div>

        {/* Selected File Action Area */}
        {selectedFile && (
          <div className="preview-container">
            {previewUrl ? (
              <img src={previewUrl} alt="Satellite Preview" className="preview-thumb" />
            ) : (
              <FileImage size={40} color="var(--accent-blue)" />
            )}

            <div className="preview-info">
              <div className="preview-name">{selectedFile.name}</div>
              <div className="preview-size">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Image file'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="spinner" />
                    Uploading...
                  </>
                ) : (
                  'Upload to Server'
                )}
              </button>

              {/* Action Buttons shown after upload succeeds */}
              {uploadResult && (
                <>
                  <button
                    className="btn"
                    onClick={handleAnalyzeRGB}
                    disabled={isAnalyzingRGB}
                    style={{
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {isAnalyzingRGB ? (
                      <>
                        <Loader2 className="spinner" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        RGB Analysis
                      </>
                    )}
                  </button>

                  <button
                    className="btn"
                    onClick={handleAnalyzeMultispectral}
                    disabled={isAnalyzingMS}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)'
                    }}
                  >
                    {isAnalyzingMS ? (
                      <>
                        <Loader2 className="spinner" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Globe2 size={16} />
                        Multispectral Analysis
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Upload Success Alert */}
        {uploadResult && (
          <div className="alert alert-success">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <CheckCircle2 size={20} />
                <span>Upload Successful!</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn"
                  onClick={handleAnalyzeRGB}
                  disabled={isAnalyzingRGB}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399'
                  }}
                >
                  {isAnalyzingRGB ? 'Analyzing RGB...' : 'RGB Analysis →'}
                </button>

                <button
                  className="btn"
                  onClick={handleAnalyzeMultispectral}
                  disabled={isAnalyzingMS}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    background: 'rgba(6, 182, 212, 0.2)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    color: '#38bdf8'
                  }}
                >
                  {isAnalyzingMS ? 'Analyzing MS...' : 'Multispectral Analysis →'}
                </button>
              </div>
            </div>

            <p style={{ color: 'var(--text-primary)', margin: '0.25rem 0 0.5rem 0' }}>
              {uploadResult.message}
            </p>

            <div className="meta-row">
              <span className="meta-key">Filename:</span>
              <span className="meta-val">{uploadResult.filename}</span>
            </div>
            <div className="meta-row">
              <span className="meta-key">File Path:</span>
              <span className="meta-val">{uploadResult.file_path}</span>
            </div>
            <div className="meta-row">
              <span className="meta-key">Identifier:</span>
              <span className="meta-val">{uploadResult.identifier}</span>
            </div>
          </div>
        )}

        {/* Upload Error Alert */}
        {uploadError && (
          <div className="alert alert-error">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <AlertCircle size={20} />
              <span>Upload Failed</span>
            </div>
            <p style={{ color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>{uploadError}</p>
          </div>
        )}
      </div>

      {/* 2. RGB Analysis Results Card */}
      {rgbAnalysisResult && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-emerald)'
                }}
              >
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>RGB Image Analysis</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Basic spatial dimensions & RGB color band statistics
                </span>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              RGB Statistics
            </div>
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1.25rem'
            }}
          >
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <Layers size={15} />
                <span>Dimensions & Format</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {rgbAnalysisResult.width} × {rgbAnalysisResult.height} px
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                Format: {rgbAnalysisResult.format}
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <HardDrive size={15} />
                <span>Channels & Size</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {rgbAnalysisResult.channels} Channels
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {(rgbAnalysisResult.file_size_bytes / (1024 * 1024)).toFixed(2)} MB ({rgbAnalysisResult.file_size_bytes.toLocaleString()} bytes)
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Minimum RGB Values</div>
              <div style={{ fontSize: '1.05rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                [{rgbAnalysisResult.min_rgb.join(', ')}]
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Maximum RGB Values</div>
              <div style={{ fontSize: '1.05rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                [{rgbAnalysisResult.max_rgb.join(', ')}]
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RGB Analysis Error Alert */}
      {rgbAnalysisError && (
        <div className="alert alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <AlertCircle size={20} />
            <span>RGB Analysis Failed</span>
          </div>
          <p style={{ color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>{rgbAnalysisError}</p>
        </div>
      )}

      {/* 3. Multispectral Analysis Results Card */}
      {msAnalysisResult && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)'
                }}
              >
                <Globe2 size={20} />
              </div>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Multispectral Satellite Analysis</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Spectral band detection & Vegetation/Water/Built-up index calculations
                </span>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                background: msAnalysisResult.multispectral_capable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                color: msAnalysisResult.multispectral_capable ? 'var(--accent-emerald)' : '#eab308',
                border: `1px solid ${msAnalysisResult.multispectral_capable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`
              }}
            >
              {msAnalysisResult.status}
            </div>
          </div>

          {/* Detected Bands Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Detected Image Bands ({msAnalysisResult.channels} Channels):
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {msAnalysisResult.detected_bands.map((band, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    background: band.includes('NIR') || band.includes('SWIR')
                      ? 'rgba(6, 182, 212, 0.2)'
                      : 'rgba(30, 41, 59, 0.8)',
                    color: band.includes('NIR') || band.includes('SWIR')
                      ? 'var(--accent-cyan)'
                      : 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {band}
                </span>
              ))}
            </div>
          </div>

          {/* Spectral Indices Cards (NDVI, NDWI, NDBI) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* NDVI Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>NDVI</span>
                {msAnalysisResult.indices.ndvi.available ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Check size={14} /> Available
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <X size={14} /> Not Available
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Normalized Difference Vegetation Index
              </div>

              {msAnalysisResult.indices.ndvi.available ? (
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                    Mean: {msAnalysisResult.indices.ndvi.mean}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Min: {msAnalysisResult.indices.ndvi.min} • Max: {msAnalysisResult.indices.ndvi.max}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(30, 41, 59, 0.5)', padding: '0.6rem', borderRadius: '6px' }}>
                  {msAnalysisResult.indices.ndvi.message}
                </div>
              )}
            </div>

            {/* NDWI Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>NDWI</span>
                {msAnalysisResult.indices.ndwi.available ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Check size={14} /> Available
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <X size={14} /> Not Available
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Normalized Difference Water Index
              </div>

              {msAnalysisResult.indices.ndwi.available ? (
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    Mean: {msAnalysisResult.indices.ndwi.mean}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Min: {msAnalysisResult.indices.ndwi.min} • Max: {msAnalysisResult.indices.ndwi.max}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(30, 41, 59, 0.5)', padding: '0.6rem', borderRadius: '6px' }}>
                  {msAnalysisResult.indices.ndwi.message}
                </div>
              )}
            </div>

            {/* NDBI Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>NDBI</span>
                {msAnalysisResult.indices.ndbi.available ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Check size={14} /> Available
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <X size={14} /> Not Available
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Normalized Difference Built-up Index
              </div>

              {msAnalysisResult.indices.ndbi.available ? (
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                    Mean: {msAnalysisResult.indices.ndbi.mean}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Min: {msAnalysisResult.indices.ndbi.min} • Max: {msAnalysisResult.indices.ndbi.max}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(30, 41, 59, 0.5)', padding: '0.6rem', borderRadius: '6px' }}>
                  {msAnalysisResult.indices.ndbi.message}
                </div>
              )}
            </div>
          </div>

          {/* Explanation Box */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem',
              borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              gap: '0.6rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}
          >
            <Info size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Processing Note: </strong>
              {msAnalysisResult.explanation}
            </div>
          </div>
        </div>
      )}

      {/* Multispectral Analysis Error Alert */}
      {msAnalysisError && (
        <div className="alert alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <AlertCircle size={20} />
            <span>Multispectral Analysis Failed</span>
          </div>
          <p style={{ color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>{msAnalysisError}</p>
        </div>
      )}
    </div>
  );
}
