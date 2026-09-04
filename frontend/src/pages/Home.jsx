import React, { useState } from 'react';
import ChatBox from '../components/ChatBox';
import ImageUpload from '../components/ImageUpload';
import MapView from '../components/MapView';
import AnalysisResult from '../components/AnalysisResult';
import { analyzeSatelliteImage } from '../services/api';

/**
 * Home Page Component (Step 7: Real /analyze Backend Integration)
 * Connects the Satellite Image Upload, Natural Language Query interface,
 * Interactive Leaflet Map, and Analysis Results panel directly to the
 * FastAPI POST /analyze backend endpoint.
 */
function Home({ activeTab = 'dashboard' }) {
  // Chat conversation state
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Welcome to SatQuery AI — Vision-Language Assistant for Multimodal Remote Sensing. Select or drop a satellite image (GeoTIFF/TIFF/PNG/JPG) and submit a query (e.g. "Show me the areas affected by flooding.") to trigger real-time AI analysis.',
      note: 'Step 7 Active: Connected to FastAPI POST /analyze',
      timestamp: 'Ready',
    },
  ]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState(null);

  // Analysis state from live backend response
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // File Upload Handlers (Step 5 functionality preserved)
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    // Clear previous analysis when a new file is uploaded
    setAnalysisData(null);
    setAnalysisError(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setAnalysisData(null);
    setAnalysisError(null);
  };

  // Reset conversation handler
  const handleClearChat = () => {
    setMessages([]);
    setLastSubmittedQuery(null);
    setAnalysisData(null);
    setAnalysisError(null);
  };

  // User query submission handler: Real POST /analyze integration
  const handleSendMessage = async (queryText) => {
    // 1. Prevent duplicate submission while loading
    if (isLoading) return;

    const trimmedQuery = queryText.trim();
    if (!trimmedQuery) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 2. Verify an image has been selected
    if (!selectedFile) {
      const userMessage = {
        sender: 'user',
        text: trimmedQuery,
        timestamp: timeStr,
      };

      const warningMessage = {
        sender: 'assistant',
        text: 'Please select or upload a satellite image (GeoTIFF / TIFF / PNG / JPG) before submitting an analysis query.',
        note: '⚠️ Missing satellite image input for POST /analyze',
        timestamp: timeStr,
      };

      setMessages((prev) => [...prev, userMessage, warningMessage]);
      setAnalysisError('Please select a satellite image before submitting an analysis query.');
      return;
    }

    // 3. User message and loading state
    setLastSubmittedQuery(trimmedQuery);
    setIsLoading(true);
    setAnalysisError(null);

    const userMessage = {
      sender: 'user',
      text: trimmedQuery,
      timestamp: timeStr,
    };

    const pendingAssistantMessage = {
      sender: 'assistant',
      text: `Analyzing satellite image "${selectedFile.name}" with query: "${trimmedQuery}"...`,
      note: '🛰️ Processing remote sensing pipeline via POST /analyze',
      timestamp: timeStr,
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, pendingAssistantMessage]);

    // 4. Execute real POST /analyze request
    try {
      const response = await analyzeSatelliteImage(selectedFile, trimmedQuery);
      setAnalysisData(response);
      setAnalysisError(null);

      const successTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const analysisTypeFormatted = response.analysis_type
        ? response.analysis_type.replace(/_/g, ' ')
        : 'features';
      const areaText =
        response.affected_area_km2 != null
          ? ` Measured affected area: ${
              typeof response.affected_area_km2 === 'number'
                ? response.affected_area_km2.toFixed(2)
                : response.affected_area_km2
            } km².`
          : '';
      const confidenceText =
        response.confidence != null
          ? ` Confidence: ${Math.round(
              response.confidence <= 1 ? response.confidence * 100 : response.confidence
            )}%.`
          : '';

      const featuresCount = response.result?.features?.length || 0;

      // Replace pending message with completed response
      setMessages((prev) => [
        ...prev.filter((m) => !m.isLoading),
        {
          sender: 'assistant',
          text: `Analysis complete: Identified ${analysisTypeFormatted}.${areaText}${confidenceText} Results rendered on map and telemetry panel below.`,
          note: `✓ Status: ${response.status || 'success'} • ${featuresCount} polygon feature${
            featuresCount === 1 ? '' : 's'
          } rendered`,
          timestamp: successTime,
        },
      ]);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisData(null);
      setAnalysisError(error.message);

      const errTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Clean, user-friendly error formatting
      let userFriendlyErrorMessage = error.message;
      if (error.status === 500) {
        userFriendlyErrorMessage =
          'Analysis failed on the server. The backend encountered an internal error processing the satellite image.';
      }

      setMessages((prev) => [
        ...prev.filter((m) => !m.isLoading),
        {
          sender: 'assistant',
          text: `Analysis failed: ${userFriendlyErrorMessage}`,
          note: `⚠️ Status: ${error.status || 'Network Disconnect'}`,
          timestamp: errTime,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-dashboard-layout">
      {/* Informative Mission Header Strip */}
      <section className="mission-banner">
        <div className="banner-left">
          <span className="banner-tag">SIH 2026 • SIH26167</span>
          <span className="banner-title">
            Multimodal Remote Sensing & Vision-Language Pipeline
          </span>
        </div>
        <div className="banner-right">
          <span className="banner-pill">Indian Space Research Organisation (ISRO)</span>
          <span className="banner-pill banner-pill-highlight">
            Step 7: Real /analyze Backend Integration Active
          </span>
        </div>
      </section>

      {/* MAIN DASHBOARD: 2-Column Layout */}
      <section className="dashboard-main-grid">
        {/* LEFT COLUMN: Image Upload + Chat Interface */}
        <div className="dashboard-left-panel">
          {/* Satellite Image Upload Box (Step 5 functionality preserved) */}
          <ImageUpload
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
          />

          {/* Natural Language ChatBox */}
          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            isLoading={isLoading}
          />
        </div>

        {/* RIGHT COLUMN: Map Panel */}
        <div className="dashboard-right-panel">
          <MapView
            geoJsonData={analysisData?.result || null}
            bounds={analysisData?.bounds || null}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* ANALYSIS RESULT PANEL (Placed below main dashboard) */}
      <section className="dashboard-bottom-panel" id="analysis-panel">
        <AnalysisResult
          analysisData={analysisData}
          lastQuery={lastSubmittedQuery}
          isLoading={isLoading}
          error={analysisError}
        />
      </section>

      {/* About Section Modal / Card when About tab is clicked */}
      {activeTab === 'about' && (
        <div className="about-modal-backdrop">
          <div className="about-modal-card">
            <div className="about-modal-header">
              <h2>About SatQuery AI</h2>
              <span className="card-badge">ISRO SIH26167</span>
            </div>
            <p className="about-modal-desc">
              <strong>SatQuery AI</strong> is an interactive Vision-Language Assistant developed for the Smart India Hackathon 2026 under the aegis of the Indian Space Research Organisation (ISRO).
            </p>
            <div className="about-features-list">
              <div className="about-feature-item">
                <span className="about-feat-icon">🛰️</span>
                <div>
                  <strong>Multimodal Remote Sensing:</strong> Integrates optical imagery (Sentinel-2, Landsat-8) and multi-spectral GeoTIFF raster arrays.
                </div>
              </div>
              <div className="about-feature-item">
                <span className="about-feat-icon">💬</span>
                <div>
                  <strong>Natural Language Queries:</strong> Enables conversational inquiries such as flood mapping, vegetation NDVI, and urban expansion detection.
                </div>
              </div>
              <div className="about-feature-item">
                <span className="about-feat-icon">🗺️</span>
                <div>
                  <strong>Geospatial Vectorization:</strong> Renders standard GeoJSON FeatureCollections on interactive maps with GeoPandas and PostGIS backend pipelines.
                </div>
              </div>
            </div>
            <div className="about-modal-footer">
              <span>Roadmap Status: STEP 7 (Real /analyze Backend Integration)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
