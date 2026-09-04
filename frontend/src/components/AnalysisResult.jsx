import React from 'react';

/**
 * AnalysisResult Component (Step 7: Real /analyze Backend Integration)
 * Sits below the main dashboard to display live remote sensing intelligence:
 * - Real analysis_type
 * - Real status
 * - Real affected_area_km2
 * - Real confidence (if provided by backend; never invented)
 * - Real AOI bounds [west, south, east, north]
 * - Real GeoJSON layer status
 * Handles: loading, success, error, and empty/no result states.
 */
function AnalysisResult({
  analysisData = null,
  lastQuery = null,
  isLoading = false,
  error = null,
}) {
  // Format affected area
  const formattedArea =
    analysisData && analysisData.affected_area_km2 != null
      ? typeof analysisData.affected_area_km2 === 'number'
        ? `${analysisData.affected_area_km2.toFixed(2)} km²`
        : `${analysisData.affected_area_km2} km²`
      : '— km²';

  // Format confidence: strictly do NOT display confidence if missing from backend response
  const hasConfidence =
    analysisData != null &&
    analysisData.confidence !== undefined &&
    analysisData.confidence !== null &&
    !isNaN(analysisData.confidence);

  const formattedConfidence = hasConfidence
    ? `${Math.round(
        analysisData.confidence <= 1
          ? analysisData.confidence * 100
          : analysisData.confidence
      )}%`
    : '—';

  // Format analysis type
  const formattedAnalysisType =
    analysisData && analysisData.analysis_type
      ? analysisData.analysis_type
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : null;

  // Format bounding box coordinates [west, south, east, north]
  const bounds = analysisData?.bounds;
  const hasBounds =
    Array.isArray(bounds) &&
    bounds.length === 4 &&
    bounds.every((n) => typeof n === 'number' && !isNaN(n));

  // Determine GeoJSON feature count
  const featureCount =
    analysisData?.result?.features && Array.isArray(analysisData.result.features)
      ? analysisData.result.features.length
      : null;

  return (
    <div className="card analysis-result-card">
      <div className="card-header">
        <div className="analysis-header-left">
          <span className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Multimodal Remote Sensing Analysis Panel
          </span>
          <span className="analysis-header-subtitle">
            Vision-Language Insights & Geospatial Telemetry
          </span>
        </div>

        {/* Dynamic Status Badge */}
        {isLoading ? (
          <span
            className="backend-pending-badge"
            style={{
              background: 'rgba(0, 180, 216, 0.15)',
              borderColor: 'var(--cyan-primary)',
              color: 'var(--cyan-primary)',
            }}
          >
            <span
              className="status-dot-amber"
              style={{ background: 'var(--cyan-primary)' }}
            ></span>
            Analyzing Satellite Image...
          </span>
        ) : error ? (
          <span
            className="backend-pending-badge"
            style={{
              background: 'rgba(247, 37, 133, 0.15)',
              borderColor: 'var(--rose-alert)',
              color: 'var(--rose-alert)',
            }}
          >
            <span
              className="status-dot-amber"
              style={{ background: 'var(--rose-alert)' }}
            ></span>
            Analysis Error
          </span>
        ) : analysisData ? (
          <span
            className="backend-pending-badge"
            style={{
              background: 'rgba(46, 196, 182, 0.15)',
              borderColor: 'var(--emerald-ndvi)',
              color: 'var(--emerald-ndvi)',
            }}
          >
            <span
              className="status-dot-amber"
              style={{ background: 'var(--emerald-ndvi)' }}
            ></span>
            Live Response ({analysisData.status || 'success'})
          </span>
        ) : (
          <span className="backend-pending-badge">
            <span className="status-dot-amber"></span>
            Ready for Analysis (Step 7)
          </span>
        )}
      </div>

      <div className="analysis-grid-layout">
        {/* Left: Detailed Analysis Summary */}
        <div className="analysis-summary-box">
          <div className="summary-title-row">
            <span className="summary-heading">Analysis Summary</span>
            {(analysisData?.original_query || lastQuery) && (
              <span className="active-query-tag">
                Target: "{analysisData?.original_query || lastQuery}"
              </span>
            )}
          </div>

          <div className="summary-content">
            {isLoading ? (
              <p className="summary-paragraph">
                Analyzing satellite image with backend Vision-Language Model and multi-spectral segmentation pipeline. Processing spectral bands and calculating affected surface area...
              </p>
            ) : error ? (
              <div
                className="summary-callout"
                style={{
                  borderLeftColor: 'var(--rose-alert)',
                  background: 'rgba(247, 37, 133, 0.08)',
                }}
              >
                <span className="callout-icon">⚠️</span>
                <span className="callout-text">
                  <strong>Backend Analysis Error:</strong> {error}
                </span>
              </div>
            ) : analysisData ? (
              <>
                <p className="summary-paragraph">
                  Backend execution complete for query "{analysisData.original_query || lastQuery}".
                  {formattedAnalysisType ? ` Identified ${formattedAnalysisType}.` : ''}
                  {analysisData.affected_area_km2 != null
                    ? ` Measured an affected surface area of ${formattedArea}.`
                    : ''}
                  {hasConfidence
                    ? ` Model inference confidence evaluated at ${formattedConfidence}.`
                    : ''}
                </p>
                <div className="summary-callout">
                  <span className="callout-icon">🛰️</span>
                  <span className="callout-text">
                    <strong>Real Telemetry Verified:</strong> Results received directly from FastAPI
                    POST /analyze endpoint. Vector polygons rendered on the Leaflet map.
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="summary-paragraph">
                  Select a satellite image (GeoTIFF / TIFF / PNG / JPG) and submit a natural language query above (e.g., "Show me the areas affected by flooding.") to trigger automated remote sensing inference and spatial vectorization.
                </p>
                <div className="summary-callout">
                  <span className="callout-icon">ℹ️</span>
                  <span className="callout-text">
                    <strong>System Ready:</strong> Real /analyze endpoint integration active.
                    Backend results will populate telemetry and Leaflet vector layers dynamically.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Metrics & Telemetry Cards */}
        <div className="analysis-metrics-grid">
          {/* 1. Detected Features */}
          <div className="telemetry-card">
            <span className="telemetry-card-label">Detected Features</span>
            <div className="telemetry-card-value-group">
              <span className="telemetry-card-value">
                {formattedAnalysisType || (isLoading ? 'Analyzing...' : '—')}
              </span>
              <span className="telemetry-card-sub">
                {analysisData?.status
                  ? `Status: ${analysisData.status}`
                  : isLoading
                  ? 'FastAPI in progress'
                  : 'Awaiting inference'}
              </span>
            </div>
          </div>

          {/* 2. Calculated Area */}
          <div className="telemetry-card">
            <span className="telemetry-card-label">Affected Area</span>
            <div className="telemetry-card-value-group">
              <span className="telemetry-card-value">
                {isLoading ? 'Computing...' : formattedArea}
              </span>
              <span className="telemetry-card-sub">
                {analysisData?.affected_area_km2 != null
                  ? `Exact: ${analysisData.affected_area_km2} km²`
                  : 'FastAPI / GeoPandas'}
              </span>
            </div>
          </div>

          {/* 3. Model Confidence */}
          <div className="telemetry-card">
            <span className="telemetry-card-label">Model Confidence</span>
            <div className="telemetry-card-value-group">
              <span className="telemetry-card-value">
                {isLoading ? '...' : formattedConfidence}
              </span>
              <span className="telemetry-card-sub">
                {hasConfidence
                  ? `Raw Score: ${analysisData.confidence}`
                  : 'Vision-Language Model'}
              </span>
            </div>
          </div>

          {/* 4. Spatial Coordinates (AOI Bounds) */}
          <div className="telemetry-card">
            <span className="telemetry-card-label">AOI Bounding Box</span>
            <div className="telemetry-card-value-group">
              {hasBounds ? (
                <>
                  <span className="telemetry-card-value telemetry-mono">
                    [{bounds[1].toFixed(2)}° N, {bounds[0].toFixed(2)}° E]
                  </span>
                  <span className="telemetry-card-sub">
                    to [{bounds[3].toFixed(2)}° N, {bounds[2].toFixed(2)}° E]
                  </span>
                </>
              ) : (
                <>
                  <span className="telemetry-card-value telemetry-mono">
                    {isLoading ? 'Fitting bounds...' : '—'}
                  </span>
                  <span className="telemetry-card-sub">
                    {isLoading ? 'Calculating AOI' : 'Awaiting bounds'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 5. GeoJSON Status */}
          <div className="telemetry-card telemetry-card-span-2">
            <span className="telemetry-card-label">GeoJSON Layer Status</span>
            <div className="telemetry-card-value-group">
              <span
                className={`telemetry-card-value telemetry-status-pill ${
                  featureCount !== null && featureCount > 0
                    ? 'active-layer-status'
                    : ''
                }`}
              >
                {isLoading
                  ? 'Generating FeatureCollection...'
                  : featureCount !== null
                  ? `FeatureCollection (${featureCount} Polygon${
                      featureCount === 1 ? '' : 's'
                    })`
                  : 'Awaiting FeatureCollection'}
              </span>
              <span className="telemetry-card-sub">
                {featureCount !== null && featureCount > 0
                  ? 'Rendered directly on Leaflet map with backend geometry'
                  : 'Vector polygons will render dynamically on the Leaflet map.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysisResult;
