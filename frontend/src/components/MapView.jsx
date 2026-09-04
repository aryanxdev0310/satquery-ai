import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  LayersControl,
  useMap,
  useMapEvents,
  ZoomControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker asset icon URLs in Vite / Webpack bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * LOCAL DEMO GEOJSON DATA
 * Retained for backward compatibility when no real backend analysis has been executed yet.
 */
export const DEMO_PUNE_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Demo Analysis Area',
        type: 'DEMO DATA / PLACEHOLDER',
        status: 'Sample Vector Boundary (Pre-Analysis Placeholder)',
        message: 'Live backend GeoJSON will appear here once /analyze is executed.',
        region: 'Pune AOI (Mula-Mutha Watershed)',
        area_approx: '~38.2 km²',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [73.805, 18.515],
            [73.845, 18.565],
            [73.910, 18.545],
            [73.895, 18.490],
            [73.825, 18.480],
            [73.805, 18.515],
          ],
        ],
      },
    },
  ],
};

/**
 * Helper component to ensure Leaflet recalculates dimensions when mounted
 * inside dynamic CSS grid / flex dashboard cards.
 */
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/**
 * Helper component to update coordinate telemetry readouts on pan/zoom events.
 */
function MapTelemetryTracker({ onTelemetryUpdate }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onTelemetryUpdate({
        lat: center.lat.toFixed(4),
        lng: center.lng.toFixed(4),
        zoom,
      });
    },
  });
  return null;
}

/**
 * Helper component to fit map bounds to the backend-provided bounds
 * format [west, south, east, north] or the GeoJSON layer bounds.
 */
function MapBoundsFitter({ bounds, geoJsonData }) {
  const map = useMap();

  useEffect(() => {
    // 1. If backend bounds provided: [west, south, east, north]
    if (
      bounds &&
      Array.isArray(bounds) &&
      bounds.length === 4 &&
      bounds.every((n) => typeof n === 'number' && !isNaN(n))
    ) {
      const [west, south, east, north] = bounds;
      try {
        // Convert to Leaflet LatLngBounds: [[south, west], [north, east]]
        const leafletBounds = [
          [south, west],
          [north, east],
        ];
        map.fitBounds(leafletBounds, { padding: [35, 35], maxZoom: 16 });
        return;
      } catch (err) {
        console.warn('MapBoundsFitter error fitting backend bounds:', err);
      }
    }

    // 2. Fallback: If valid GeoJSON features exist, fit map to GeoJSON layer bounds
    if (
      geoJsonData &&
      geoJsonData.type === 'FeatureCollection' &&
      Array.isArray(geoJsonData.features) &&
      geoJsonData.features.length > 0
    ) {
      try {
        const tempLayer = L.geoJSON(geoJsonData);
        const layerBounds = tempLayer.getBounds();
        if (layerBounds.isValid()) {
          map.fitBounds(layerBounds, { padding: [35, 35], maxZoom: 16 });
        }
      } catch (err) {
        console.warn('MapBoundsFitter error fitting GeoJSON layer:', err);
      }
    }
  }, [bounds, geoJsonData, map]);

  return null;
}

/**
 * MapView Component
 * Renders an interactive Leaflet map centered on satellite analysis regions.
 * Supports:
 * - Real backend GeoJSON FeatureCollection rendering (all features)
 * - Automatic bounds fitting based on backend response.bounds [west, south, east, north]
 * - Layer replacement and clean unmounting to avoid duplicate layers
 * - OpenStreetMap, Esri Satellite, and CartoDB Dark basemaps
 * - Layer popup telemetry showing class, index_used, threshold
 * - Backward compatibility with demo polygon when no backend analysis has run
 */
function MapView({ geoJsonData = null, bounds = null, isLoading = false }) {
  // Default coordinates centered on Pune, India
  const defaultCenter = [18.5204, 73.8567];
  const defaultZoom = 12;

  // Telemetry state
  const [telemetry, setTelemetry] = useState({
    lat: '18.5204',
    lng: '73.8567',
    zoom: defaultZoom,
  });

  // Layer toggles
  const [showDemoLayer, setShowDemoLayer] = useState(true);
  const [searchQuery, setSearchQuery] = useState('Pune, Maharashtra, India');

  // Verify whether real backend GeoJSON is provided
  const hasRealGeoJson = Boolean(
    geoJsonData &&
    geoJsonData.type === 'FeatureCollection' &&
    Array.isArray(geoJsonData.features)
  );

  const realFeatureCount = hasRealGeoJson ? geoJsonData.features.length : 0;

  // Active GeoJSON data: Real backend FeatureCollection takes priority
  const activeGeoJson = hasRealGeoJson
    ? geoJsonData
    : showDemoLayer
    ? DEMO_PUNE_GEOJSON
    : null;

  const isDemo = !hasRealGeoJson;

  // Unique key to guarantee React-Leaflet unmounts the previous layer and renders the newest
  const layerKey = hasRealGeoJson
    ? `real-${realFeatureCount}-${bounds ? bounds.join('-') : 'nobounds'}-${JSON.stringify(
        geoJsonData.features?.[0]?.geometry || {}
      ).slice(0, 32)}`
    : `demo-${showDemoLayer ? 'active' : 'inactive'}`;

  // Custom styling for the GeoJSON polygon layer
  const geoJsonStyle = (feature) => {
    if (isDemo) {
      return {
        color: '#ffb703',
        weight: 2.5,
        dashArray: '6, 6',
        fillColor: '#ffb703',
        fillOpacity: 0.25,
      };
    }

    // Real backend polygon styling based on properties.class
    const props = feature?.properties || {};
    const featureClass = (props.class || '').toLowerCase();

    let strokeColor = '#00b4d8';
    let fillColor = '#0077b6';

    if (featureClass.includes('water') || featureClass.includes('flood')) {
      strokeColor = '#00b4d8';
      fillColor = '#0077b6';
    } else if (featureClass.includes('veg') || featureClass.includes('forest')) {
      strokeColor = '#2ec4b6';
      fillColor = '#2ec4b6';
    } else if (featureClass.includes('urban') || featureClass.includes('built')) {
      strokeColor = '#ffb703';
      fillColor = '#ffb703';
    }

    return {
      color: strokeColor,
      weight: 2.5,
      fillColor: fillColor,
      fillOpacity: 0.45,
    };
  };

  // Attach popup & hover interactions to each feature
  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};

    if (hasRealGeoJson) {
      // Real backend feature popup
      const className = props.class
        ? props.class.replace(/_/g, ' ').toUpperCase()
        : 'DETECTED FEATURE';
      const indexUsed = props.index_used || 'MNDWI';
      const threshold = props.threshold != null ? props.threshold : '0.0';

      const popupHtml = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; line-height: 1.45; min-width: 220px; color: #0b132b;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1;">
            <strong style="font-size: 13px; color: #070d1e;">${className}</strong>
            <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">LIVE BACKEND</span>
          </div>
          <div style="margin-bottom: 4px; color: #334155; font-size: 11.5px;">
            <strong>Spectral Index:</strong> ${indexUsed}
          </div>
          <div style="margin-bottom: 6px; color: #334155; font-size: 11.5px;">
            <strong>Threshold:</strong> ${threshold}
          </div>
          <div style="font-size: 10.5px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 4px; margin-top: 4px;">
            FastAPI POST /analyze Vector Polygon
          </div>
        </div>
      `;
      layer.bindPopup(popupHtml);
    } else {
      // Demo placeholder popup
      const title = props.name || 'Demo Analysis Area';
      const msg = props.message || 'Backend GeoJSON will appear here in a later step.';
      const region = props.region || 'Pune Region';

      const popupHtml = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; line-height: 1.45; min-width: 200px; color: #0b132b;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1;">
            <strong style="font-size: 13px; color: #070d1e;">${title}</strong>
          </div>
          <div style="margin-bottom: 6px; font-weight: 500; color: #0077b6;">
            📍 ${region}
          </div>
          <p style="margin: 0 0 8px 0; color: #334155; font-size: 11.5px;">
            ${msg}
          </p>
          <div style="display: inline-block; background: #fff3cd; color: #856404; border: 1px solid #ffeeba; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">
            ⚠️ DEMO DATA (STEP 4)
          </div>
        </div>
      `;
      layer.bindPopup(popupHtml);
    }

    // Subtle hover effect
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 3.5,
          fillOpacity: 0.65,
        });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(geoJsonStyle(feature));
      },
    });
  };

  return (
    <div className="map-panel">
      {/* Top Location Search & Real-time Telemetry Bar */}
      <div className="map-top-bar">
        <div className="location-indicator">
          <div className="location-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <input
            type="text"
            className="location-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AOI (e.g. Pune, Maharashtra)..."
          />
        </div>

        <div className="telemetry-readout">
          <span className="telemetry-item">
            <span className="telemetry-label">COORD:</span>
            <span className="telemetry-val">
              {telemetry.lat}° N, {telemetry.lng}° E
            </span>
          </span>
          <span className="telemetry-item">
            <span className="telemetry-label">ZOOM:</span>
            <span className="telemetry-val">{telemetry.zoom}x</span>
          </span>
          <span className="telemetry-item">
            <span className="telemetry-label">CRS:</span>
            <span className="telemetry-val">EPSG:4326</span>
          </span>
        </div>
      </div>

      {/* Layer Controls Bar */}
      <div className="map-controls-panel">
        <div className="control-group">
          <span className="control-group-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            Analysis Layer:
          </span>

          {hasRealGeoJson ? (
            <span
              className="pill-btn active"
              style={{ cursor: 'default' }}
              title="Live backend GeoJSON layer active"
            >
              🛰️ Live Backend GeoJSON ({realFeatureCount} Feature{realFeatureCount === 1 ? '' : 's'})
            </span>
          ) : (
            <button
              type="button"
              className={`pill-btn ${showDemoLayer ? 'active' : ''}`}
              onClick={() => setShowDemoLayer((prev) => !prev)}
              title="Toggle Demo Analysis Polygon"
            >
              {showDemoLayer ? '👁️ Demo Analysis Layer (ON)' : '👁️ Demo Analysis Layer (OFF)'}
            </button>
          )}
        </div>

        {/* Status Notice Tag */}
        {hasRealGeoJson ? (
          <div
            className="demo-notice-tag"
            style={{
              color: 'var(--emerald-ndvi)',
              background: 'rgba(46, 196, 182, 0.1)',
              borderColor: 'rgba(46, 196, 182, 0.3)',
            }}
          >
            <span
              className="status-dot-amber"
              style={{ background: 'var(--emerald-ndvi)' }}
            ></span>
            <span>
              {realFeatureCount > 0
                ? `${realFeatureCount} Polygon${realFeatureCount === 1 ? '' : 's'} Delineated`
                : 'No Polygons Detected in Image'}
            </span>
          </div>
        ) : (
          <div className="demo-notice-tag" title="Step 4 Testing Notice">
            <span className="status-dot-amber"></span>
            <span>Awaiting /analyze GeoJSON (Demo Placeholder Active)</span>
          </div>
        )}
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="map-canvas-container interactive-map-wrapper">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Zoom Control at top-left below toolbar */}
          <ZoomControl position="topleft" />

          {/* Re-calculate map dimensions on mount */}
          <MapResizeHandler />

          {/* Update live coordinates on pan/zoom */}
          <MapTelemetryTracker onTelemetryUpdate={setTelemetry} />

          {/* Auto-fit map to backend bounds [west, south, east, north] or GeoJSON layer */}
          <MapBoundsFitter bounds={bounds} geoJsonData={geoJsonData} />

          {/* Base Layer Switcher */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="OpenStreetMap Standard">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Satellite Imagery (Esri)">
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Dark Matter (CartoDB)">
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Render GeoJSON FeatureCollection when active */}
          {activeGeoJson && activeGeoJson.features && activeGeoJson.features.length > 0 && (
            <GeoJSON
              key={layerKey}
              data={activeGeoJson}
              style={geoJsonStyle}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>

        {/* Spectral & Legend Overlay (Bottom Right) */}
        <div className="map-legend">
          <div className="legend-title">Geospatial Spectral Legend</div>
          {hasRealGeoJson ? (
            <>
              <div className="legend-item">
                <span
                  className="legend-color"
                  style={{ background: '#00b4d8' }}
                ></span>
                <span>Detected Flood / Inundation Zone</span>
              </div>
              <div className="legend-item">
                <span
                  className="legend-color"
                  style={{ background: '#2ec4b6' }}
                ></span>
                <span>Vegetation / High Spectral Index</span>
              </div>
              <div className="legend-footer">
                <span>
                  {realFeatureCount} Feature{realFeatureCount === 1 ? '' : 's'} Rendered • Click polygon for telemetry
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="legend-item">
                <span
                  className="legend-color"
                  style={{
                    background: '#ffb703',
                    border: '1px dashed #ffffff',
                  }}
                ></span>
                <span>Demo Analysis Area (Placeholder Polygon)</span>
              </div>
              <div className="legend-item">
                <span
                  className="legend-color"
                  style={{ background: '#00b4d8' }}
                ></span>
                <span>Flood / Water (Future GeoJSON)</span>
              </div>
              <div className="legend-item">
                <span
                  className="legend-color"
                  style={{ background: '#2ec4b6' }}
                ></span>
                <span>Vegetation / NDVI (Future GeoJSON)</span>
              </div>
              <div className="legend-footer">
                <span>Center: Pune [18.52° N, 73.85° E] • Click polygon for popup</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapView;
