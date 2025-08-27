// Backend configuration management
const BACKEND_URL_KEY = 'blog_admin_backend_url'
const DEFAULT_BACKEND_URL = 'http://localhost:760'

export const getBackendUrl = () => {
  return localStorage.getItem(BACKEND_URL_KEY) || DEFAULT_BACKEND_URL
}

export const setBackendUrl = (url) => {
  // Clean up URL - remove trailing slash
  const cleanUrl = url.replace(/\/$/, '')
  localStorage.setItem(BACKEND_URL_KEY, cleanUrl)
  
  // Reload the page to reinitialize API with new URL
  window.location.reload()
}

export const resetBackendUrl = () => {
  localStorage.removeItem(BACKEND_URL_KEY)
  window.location.reload()
}

export const isDefaultBackendUrl = () => {
  return getBackendUrl() === DEFAULT_BACKEND_URL
}