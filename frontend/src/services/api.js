/**
 * SatQuery AI Frontend API Service
 * Centralized API client for communicating with the FastAPI backend.
 *
 * Current Backend Status:
 * - Base URL: http://127.0.0.1:8000 (configurable via VITE_API_BASE_URL)
 * - POST /upload: multipart/form-data with field 'file'
 * - POST /query: application/json with field 'query'
 * - POST /analyze: multipart/form-data with fields 'file' and 'query' (Step 7 Real Integration)
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * Custom error class for API client failures, capturing HTTP status
 * and structured backend error responses.
 */
export class ApiError extends Error {
  constructor(message, status = null, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Internal helper to perform fetch requests with unified error handling.
 * Handles Network Failures, HTTP 400, HTTP 404, HTTP 500, and extracts
 * server error details without inventing fake results.
 *
 * @param {string} endpoint - API path (e.g., '/upload', '/query', '/analyze')
 * @param {RequestInit} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} Parsed response data (JSON or text)
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  let response;

  try {
    response = await fetch(url, options);
  } catch (networkError) {
    // Clean handling of network failure (e.g. backend offline, connection refused, CORS issue)
    throw new ApiError(
      `Network failure: Unable to connect to backend at ${API_BASE_URL}. Please ensure the FastAPI server is running. (${networkError.message})`,
      null,
      networkError
    );
  }

  // Handle non-2xx HTTP responses (HTTP 400, 404, 500, etc.)
  if (!response.ok) {
    let errorData = null;
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = await response.text();
      }
    } catch {
      // Body could not be parsed as JSON or text
    }

    // Extract detail string if provided by FastAPI (FastAPI standard: { "detail": ... })
    const serverDetail = errorData?.detail
      ? Array.isArray(errorData.detail)
        ? errorData.detail.map((err) => err.msg || JSON.stringify(err)).join('; ')
        : typeof errorData.detail === 'string'
        ? errorData.detail
        : JSON.stringify(errorData.detail)
      : errorData?.message || (typeof errorData === 'string' && errorData.length < 250 ? errorData : null);

    let message;
    switch (response.status) {
      case 400:
        message = serverDetail
          ? `Bad Request (HTTP 400): ${serverDetail}`
          : 'Bad Request (HTTP 400): The server rejected the request due to invalid parameters or malformed syntax.';
        break;
      case 404:
        message = serverDetail
          ? `Not Found (HTTP 404): ${serverDetail}`
          : `Not Found (HTTP 404): The requested endpoint '${endpoint}' does not exist on the server.`;
        break;
      case 500:
        message = serverDetail
          ? `Internal Server Error (HTTP 500): ${serverDetail}`
          : 'Internal Server Error (HTTP 500): The backend server encountered an unexpected condition while processing analysis.';
        break;
      default:
        message = serverDetail
          ? `HTTP Error ${response.status}: ${serverDetail}`
          : `Request failed with HTTP status ${response.status} (${response.statusText}).`;
        break;
    }

    throw new ApiError(message, response.status, errorData);
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  }

  return await response.text();
}

/**
 * Upload a satellite image file to the backend.
 *
 * Endpoint: POST /upload
 * Request Format: multipart/form-data
 * Field: file
 *
 * NOTE: The Content-Type header is intentionally NOT manually set so the browser
 * can automatically attach the boundary parameter required for multipart/form-data.
 *
 * @param {File|Blob} file - The satellite image File object (PNG, JPG, TIFF, GeoTIFF)
 * @returns {Promise<any>} The server response payload
 */
export async function uploadFile(file) {
  if (!file) {
    throw new Error('uploadFile: A valid File or Blob object is required.');
  }

  const formData = new FormData();
  // Field name specified as 'file' by backend documentation
  formData.append('file', file);

  return await apiRequest('/upload', {
    method: 'POST',
    body: formData,
    // Do not manually set 'Content-Type': the browser sets multipart/form-data; boundary=...
  });
}

/**
 * Submit a natural language query to the backend.
 *
 * Endpoint: POST /query
 * Request Format: application/json
 * Field: query (no additional or invented fields)
 *
 * @param {string} query - The natural language query string
 * @returns {Promise<any>} The server response payload
 */
export async function submitQuery(query) {
  if (typeof query !== 'string' || !query.trim()) {
    throw new Error('submitQuery: A non-empty query string is required.');
  }

  return await apiRequest('/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query.trim(),
    }),
  });
}

/**
 * Submit a satellite image along with a natural language query to the finalized
 * POST /analyze backend endpoint for remote sensing segmentation and analysis.
 *
 * Endpoint: POST /analyze
 * Request Format: multipart/form-data
 * Fields:
 * - file: satellite GeoTIFF file (.tif / .tiff) or optical image
 * - query: natural-language analysis query string
 *
 * @param {File|Blob} file - Selected satellite image File object
 * @param {string} query - Natural language query string (e.g. "Show me the areas affected by flooding.")
 * @returns {Promise<object>} Backend response object with GeoJSON FeatureCollection, bounds, affected_area_km2, confidence
 */
export async function analyzeSatelliteImage(file, query) {
  if (!file) {
    throw new Error('analyzeSatelliteImage: A valid satellite image file (.tif / .tiff) is required.');
  }

  if (typeof query !== 'string' || !query.trim()) {
    throw new Error('analyzeSatelliteImage: A non-empty query string is required.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('query', query.trim());

  return await apiRequest('/analyze', {
    method: 'POST',
    body: formData,
    // Do NOT manually set Content-Type header - browser will attach multipart/form-data with boundary
  });
}

export default {
  API_BASE_URL,
  uploadFile,
  submitQuery,
  analyzeSatelliteImage,
  ApiError,
};
