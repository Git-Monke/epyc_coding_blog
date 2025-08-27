import { useState } from 'react'
import { getBackendUrl, setBackendUrl, resetBackendUrl, isDefaultBackendUrl } from '../services/config'
import { checkBackendConnection } from '../services/api'

function BackendConfig() {
  const [currentUrl, setCurrentUrl] = useState(getBackendUrl())
  const [newUrl, setNewUrl] = useState(getBackendUrl())
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [showConfig, setShowConfig] = useState(false)

  const handleTestConnection = async () => {
    setIsConnecting(true)
    setConnectionStatus(null)
    
    try {
      // Clean the URL - remove trailing slash
      const cleanUrl = newUrl.replace(/\/$/, '')
      const response = await fetch(`${cleanUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (response.ok) {
        setConnectionStatus('success')
      } else {
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('error')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSave = () => {
    if (newUrl && newUrl !== currentUrl) {
      setBackendUrl(newUrl)
      setCurrentUrl(newUrl)
    }
  }

  const handleReset = () => {
    resetBackendUrl()
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success': return '#28a745'
      case 'error': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getStatusText = () => {
    if (isConnecting) return 'Testing...'
    switch (connectionStatus) {
      case 'success': return 'Connected ✓'
      case 'error': return 'Connection failed ✗'
      default: return 'Not tested'
    }
  }

  return (
    <div className="backend-config">
      <button 
        onClick={() => setShowConfig(!showConfig)}
        className="config-toggle-btn"
        title="Backend Configuration"
      >
        ⚙️
      </button>

      {showConfig && (
        <div className="config-panel">
          <h3>Backend Configuration</h3>
          
          <div className="config-section">
            <label htmlFor="backend-url">Backend URL:</label>
            <input
              id="backend-url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="http://localhost:760"
              className="url-input"
            />
          </div>

          <div className="config-actions">
            <button 
              onClick={handleTestConnection}
              disabled={isConnecting || !newUrl}
              className="test-btn"
            >
              Test Connection
            </button>
            
            <button 
              onClick={handleSave}
              disabled={!newUrl || newUrl === currentUrl}
              className="save-btn"
            >
              Save & Reload
            </button>

            {!isDefaultBackendUrl() && (
              <button 
                onClick={handleReset}
                className="reset-btn"
              >
                Reset to Default
              </button>
            )}
          </div>

          <div className="connection-status" style={{ color: getStatusColor() }}>
            <small>{getStatusText()}</small>
          </div>

          <div className="config-info">
            <small>
              Current: <code>{currentUrl}</code><br/>
              Default: <code>http://localhost:760</code>
            </small>
          </div>
        </div>
      )}
    </div>
  )
}

export default BackendConfig