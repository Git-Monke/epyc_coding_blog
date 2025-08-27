import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { saveDraft, isDraft, deleteDraft, getDraftsArray } from '../services/drafts'
import { usePostsApi, useFilesApi } from '../hooks/useApi'
import { checkBackendConnection, postsApi } from '../services/api'

function PostEditor({ post, onBack }) {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    description: post?.description || '',
    tags: post?.tags?.join(', ') || '',
    content: post?.content || ''
  })
  const [currentDraftId, setCurrentDraftId] = useState(post?.id || null)
  const [originalPostId, setOriginalPostId] = useState(
    isDraft(post) ? post?.originalPostId : (!isDraft(post) && post?.id) || null
  )
  const [saveStatus, setSaveStatus] = useState('')
  const [isPostDraft, setIsPostDraft] = useState(isDraft(post))
  const [backendConnected, setBackendConnected] = useState(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [viewMode, setViewMode] = useState(
    !post ? 'draft' : (isPostDraft ? 'draft' : 'published')
  ) // 'draft' or 'published'
  const [hasChanges, setHasChanges] = useState(false) // Track if there are unsaved changes
  const [originalPublishedData, setOriginalPublishedData] = useState(null) // Store original published content for comparison
  const { savePost, loading: apiLoading } = usePostsApi()
  const { 
    files: apiFiles, 
    loading: filesLoading, 
    error: filesError,
    loadFiles, 
    uploadFile, 
    deleteFile: deleteApiFile 
  } = useFilesApi()
  const [localFiles, setLocalFiles] = useState([]) // For new files before upload
  const [showFileManager, setShowFileManager] = useState(false)

  // Combine API files with local files for display
  const files = [
    ...(apiFiles || []).filter(file => file && file.id && file.name), 
    ...localFiles.filter(file => file && file.id && file.name)
  ]

  // Get effective post ID for file operations
  const getPostIdForFiles = () => {
    // Use original post ID if available, otherwise current draft ID, otherwise generate temp ID
    return originalPostId || currentDraftId || 'temp'
  }

  // Check if current form data differs from original published content
  const checkForChanges = useCallback((currentData) => {
    // For new posts (no original), always consider as having changes if there's content
    if (!originalPublishedData) {
      const hasContent = currentData.title?.trim() || currentData.description?.trim() || 
                        currentData.tags?.trim() || currentData.content?.trim()
      setHasChanges(!!hasContent)
      return
    }

    // Compare with original published data
    const originalTags = Array.isArray(originalPublishedData.tags) ? 
      originalPublishedData.tags.join(', ') : (originalPublishedData.tags || '')
    
    const hasChangedData = 
      currentData.title !== (originalPublishedData.title || '') ||
      currentData.description !== (originalPublishedData.description || '') ||
      currentData.tags !== originalTags ||
      currentData.content !== (originalPublishedData.content || '')
    
    setHasChanges(hasChangedData)
  }, [originalPublishedData])

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkBackendConnection()
      setBackendConnected(connected)
    }
    checkConnection()
  }, [])

  // Load full post content if editing a published post without content
  useEffect(() => {
    const loadFullPostContent = async () => {
      // Only load if:
      // 1. We have a post
      // 2. It's not a draft
      // 3. We don't have content (meaning it came from search results)
      // 4. Backend is connected
      if (post && !isDraft(post) && !post.content && backendConnected && post.id) {
        setIsLoadingContent(true)
        setSaveStatus('Loading post content...')
        
        try {
          const fullPost = await postsApi.getPost(post.id)
          
          // Update form data with the complete content
          setFormData({
            title: fullPost.title || '',
            description: fullPost.description || '',
            tags: Array.isArray(fullPost.tags) ? fullPost.tags.join(', ') : '',
            content: fullPost.content || ''
          })
          
          setSaveStatus('')
        } catch (error) {
          console.error('Failed to load post content:', error)
          setSaveStatus('Failed to load post content')
          setTimeout(() => setSaveStatus(''), 3000)
        } finally {
          setIsLoadingContent(false)
        }
      }
    }

    if (backendConnected !== null) {
      loadFullPostContent()
    }
  }, [post, backendConnected])

  // Load files when backend connects and we have a post ID
  useEffect(() => {
    const postIdForFiles = getPostIdForFiles()
    if (backendConnected && postIdForFiles && postIdForFiles !== 'temp') {
      loadFiles(postIdForFiles)
    }
  }, [backendConnected, originalPostId, currentDraftId, loadFiles])

  // Initial change check for new posts
  useEffect(() => {
    // For new posts, check if there's any content on initial load
    if (!post && !originalPostId) {
      checkForChanges(formData)
    }
  }, []) // Run once on mount

  // Handle view mode switching - load appropriate data
  useEffect(() => {
    const loadViewData = async () => {
      if (!originalPostId) return // New post - no published version to switch to
      
      if (viewMode === 'published') {
        // Load published version
        if (backendConnected) {
          try {
            setIsLoadingContent(true)
            const publishedPost = await postsApi.getPost(originalPostId)
            const publishedFormData = {
              title: publishedPost.title || '',
              description: publishedPost.description || '',
              tags: Array.isArray(publishedPost.tags) ? publishedPost.tags.join(', ') : '',
              content: publishedPost.content || ''
            }
            
            setFormData(publishedFormData)
            // Store original published data for comparison
            setOriginalPublishedData(publishedPost)
            // No changes when viewing published version
            setHasChanges(false)
          } catch (error) {
            console.error('Failed to load published version:', error)
            setSaveStatus('Failed to load published version')
            setTimeout(() => setSaveStatus(''), 3000)
          } finally {
            setIsLoadingContent(false)
          }
        }
      } else {
        // Load draft version
        const drafts = getDraftsArray()
        const draftData = drafts.find(draft => 
          draft.id === currentDraftId || draft.originalPostId === originalPostId
        )
        if (draftData) {
          const draftFormData = {
            title: draftData.title || '',
            description: draftData.description || '',
            tags: Array.isArray(draftData.tags) ? draftData.tags.join(', ') : '',
            content: draftData.content || ''
          }
          setFormData(draftFormData)
          // Check if draft differs from published version
          checkForChanges(draftFormData)
        }
      }
    }

    loadViewData()
  }, [viewMode, originalPostId, currentDraftId, backendConnected])

  // Immediate auto-save function
  const autoSaveDraft = useCallback((data) => {
    const draftId = saveDraft({
      id: currentDraftId,
      originalPostId: originalPostId,
      title: data.title,
      description: data.description,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      content: data.content
    })
    
    if (draftId && !currentDraftId) {
      setCurrentDraftId(draftId)
      setIsPostDraft(true)
    }
  }, [currentDraftId, originalPostId])

  const handleInputChange = (field, value) => {
    const newFormData = {
      ...formData,
      [field]: value
    }
    
    setFormData(newFormData)
    
    // Auto-switch to draft view when user starts editing
    if (viewMode !== 'draft') {
      setViewMode('draft')
    }
    
    // Check for changes to determine if publish button should show
    checkForChanges(newFormData)
    
    // Auto-save immediately on every change
    autoSaveDraft(newFormData)
  }


  const handlePublish = async () => {
    if (!backendConnected) {
      setSaveStatus('Cannot publish: Backend not connected')
      setTimeout(() => setSaveStatus(''), 3000)
      return
    }

    if (!formData.title?.trim()) {
      setSaveStatus('Cannot publish: Title is required')
      setTimeout(() => setSaveStatus(''), 3000)
      return
    }

    setIsPublishing(true)
    setSaveStatus('Publishing...')
    
    try {
      const postToPublish = {
        id: originalPostId || undefined, // Use original post ID if available, let backend generate for truly new posts
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        content: formData.content
      }

      const result = await savePost(postToPublish)
      
      // Upload any local files now that we have a published post
      if (localFiles.length > 0) {
        const postIdForUpload = result?.postId || postToPublish.id
        setSaveStatus('Uploading attached files...')
        
        for (const localFile of localFiles) {
          try {
            await uploadFile(postIdForUpload, localFile.file)
          } catch (error) {
            console.error(`Failed to upload ${localFile.name}:`, error)
          }
        }
        
        // Clear local files after upload
        setLocalFiles([])
      }
      
      // Switch to published view and delete any existing draft
      if (currentDraftId) {
        try {
          deleteDraft(currentDraftId)
          setCurrentDraftId(null)
        } catch (error) {
          console.error('Failed to delete draft:', error)
        }
      }
      
      // Update post state after successful publish
      const publishedPostId = result?.postId || postToPublish.id
      if (publishedPostId) {
        setOriginalPostId(publishedPostId)
      }
      setIsPostDraft(false)
      
      // Switch to published view to show the published content
      setViewMode('published')
      
      // Reset changes state after successful publish
      setHasChanges(false)
      
      setSaveStatus('Post published successfully!')
      
      // Clear success message after delay
      setTimeout(() => {
        setSaveStatus('')
      }, 3000)
      
    } catch (error) {
      setSaveStatus(`Publish failed: ${error.message}`)
      setTimeout(() => setSaveStatus(''), 5000)
    } finally {
      setIsPublishing(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files)
    const postIdForFiles = getPostIdForFiles()
    
    if (postIdForFiles === 'temp') {
      // If we don't have a real post ID, store files locally until we have one
      const newFiles = selectedFiles.map((file, index) => ({
        id: `new_${Date.now()}_${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        file: file // Store actual file for future upload
      }))
      setLocalFiles(prev => [...prev, ...newFiles])
    } else {
      // Upload files directly to backend
      for (const file of selectedFiles) {
        try {
          setSaveStatus(`Uploading ${file.name}...`)
          await uploadFile(postIdForFiles, file)
          setSaveStatus(`${file.name} uploaded successfully`)
          setTimeout(() => setSaveStatus(''), 2000)
        } catch (error) {
          setSaveStatus(`Failed to upload ${file.name}: ${error.message}`)
          setTimeout(() => setSaveStatus(''), 3000)
        }
      }
    }
    
    // Reset input
    event.target.value = ''
  }

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return
    }

    // Check if it's a local file (starts with 'new_')
    if (fileId.startsWith('new_')) {
      setLocalFiles(prev => prev.filter(file => file.id !== fileId))
      return
    }

    // It's an API file - delete from backend
    const fileToDelete = apiFiles?.find(file => file.id === fileId)
    if (!fileToDelete) {
      setSaveStatus('File not found')
      setTimeout(() => setSaveStatus(''), 2000)
      return
    }

    const postIdForFiles = getPostIdForFiles()
    try {
      setSaveStatus(`Deleting ${fileToDelete.name}...`)
      await deleteApiFile(postIdForFiles, fileToDelete.name)
      setSaveStatus(`${fileToDelete.name} deleted successfully`)
      setTimeout(() => setSaveStatus(''), 2000)
    } catch (error) {
      setSaveStatus(`Failed to delete ${fileToDelete.name}: ${error.message}`)
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  const handleCopyFileUrl = (file) => {
    if (file.id.startsWith('new_')) {
      setSaveStatus('File must be uploaded first')
      setTimeout(() => setSaveStatus(''), 2000)
      return
    }

    // Use the URL from the file object (for API files) or generate for local files
    const url = file.url || `${localStorage.getItem('backendUrl') || 'http://localhost:760'}/public/${getPostIdForFiles()}/${file.name}`
    
    navigator.clipboard.writeText(url).then(() => {
      setSaveStatus(`Copied: ${file.name}`)
      setTimeout(() => setSaveStatus(''), 2000)
    }).catch(() => {
      setSaveStatus('Failed to copy URL')
      setTimeout(() => setSaveStatus(''), 2000)
    })
  }

  return (
    <div className="post-editor">
      <div className="editor-header">
        <div className="header-left">
          <button onClick={onBack} className="back-btn">
            ← Back to Posts
          </button>
          <div className="header-title">
            <h2>{post ? 'Edit Post' : 'New Post'}</h2>
            {isPostDraft && <span className="draft-badge">Draft</span>}
          </div>
          {/* Toggle between draft and published views */}
          {originalPostId && (
            <div className="view-toggle">
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${viewMode === 'published' ? 'active' : ''}`}
                  onClick={() => setViewMode('published')}
                  disabled={isPublishing || isLoadingContent}
                >
                  📖 Published
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'draft' ? 'active' : ''}`}
                  onClick={() => setViewMode('draft')}
                  disabled={isPublishing || isLoadingContent}
                >
                  ✏️ Draft
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="header-actions">
          {saveStatus && (
            <span className={`save-status ${isPublishing ? 'publishing' : saveStatus.includes('success') ? 'success' : saveStatus.includes('failed') || saveStatus.includes('Cannot') ? 'error' : ''}`}>
              {saveStatus}
            </span>
          )}
          {backendConnected === false && (
            <span className="save-status error">Backend offline</span>
          )}
          {viewMode === 'draft' && hasChanges && (
            <button 
              onClick={handlePublish} 
              className="publish-btn"
              disabled={isPublishing || isLoadingContent || backendConnected === false || (!formData.title?.trim())}
            >
              {isPublishing ? 'Publishing...' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {isLoadingContent && (
        <div className="loading-overlay">
          <p>🔄 Loading post content...</p>
        </div>
      )}

      <div className="editor-layout">
        <div className="editor-panel">
          <div className="form-section">
            <label htmlFor="title">Title</label>
            {viewMode === 'published' ? (
              <div className="published-title">{formData.title || 'Untitled'}</div>
            ) : (
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter post title..."
                className="title-input"
              />
            )}
          </div>

          <div className="form-section">
            <label htmlFor="description">Description</label>
            {viewMode === 'published' ? (
              <div className="published-description">{formData.description || 'No description'}</div>
            ) : (
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the post..."
                className="description-input"
                rows="3"
              />
            )}
          </div>

          <div className="form-section">
            <label htmlFor="tags">Tags</label>
            {viewMode === 'published' ? (
              <div className="published-tags">
                {formData.tags ? 
                  formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag).map(tag => (
                    <span key={tag} className="tag-display">#{tag}</span>
                  )) : 
                  <span className="no-tags">No tags</span>
                }
              </div>
            ) : (
              <input
                id="tags"
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="react, javascript, tutorial (comma-separated)"
                className="tags-input"
              />
            )}
          </div>

          <div className="form-section">
            <label htmlFor="content">Content (Markdown)</label>
            {viewMode === 'published' ? (
              <div className="published-content">
                <pre className="markdown-text">{formData.content || 'No content'}</pre>
              </div>
            ) : (
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Write your post content in Markdown..."
                className="content-textarea"
              />
            )}
          </div>

          {/* File Management Section */}
          <div className="form-section">
            <div className="file-manager-header">
              <button
                type="button"
                onClick={() => setShowFileManager(!showFileManager)}
                className="file-manager-toggle"
              >
                📎 Files & Media ({files.length})
                <span className={`toggle-icon ${showFileManager ? 'open' : ''}`}>▼</span>
              </button>
            </div>

            {showFileManager && (
              <div className="file-manager">
                <div className="file-upload-section">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileUpload}
                    className="file-input"
                    accept="image/*,application/pdf,.txt,.md"
                  />
                  <label htmlFor="file-upload" className="upload-btn">
                    + Upload Files
                  </label>
                </div>

                {files.length > 0 ? (
                  <div className="files-list">
                    {files.filter(file => file && file.id && file.name).map(file => (
                      <div key={file.id} className="file-item">
                        <div className="file-info">
                          <div className="file-icon">
                            {file.type && file.type.startsWith('image/') ? '🖼️' : '📄'}
                          </div>
                          <div className="file-details">
                            <div className="file-name" title={file.name}>
                              {file.name.length > 30 ? `${file.name.substring(0, 30)}...` : file.name}
                            </div>
                            <div className="file-meta">
                              {file.size ? formatFileSize(file.size) : 'Unknown size'} • {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : 'Unknown date'}
                            </div>
                          </div>
                        </div>
                        <div className="file-actions">
                          <button
                            onClick={() => handleCopyFileUrl(file)}
                            className="copy-url-btn"
                            title="Copy file URL"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="delete-file-btn"
                            title="Delete file"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-files">
                    <p>No files uploaded yet. Use the upload button above to add files.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="preview-panel">
          <h3>Preview</h3>
          <div className="preview-content">
            <div className="preview-header">
              {formData.title && <h1 className="preview-title">{formData.title}</h1>}
              {formData.description && <p className="preview-description">{formData.description}</p>}
              {formData.tags && (
                <div className="preview-tags">
                  {formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag).map(tag => (
                    <span key={tag} className="preview-tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="preview-markdown">
              {formData.content ? (
                <ReactMarkdown
                  components={{
                    img: ({ node, alt, src, title, ...props }) => {
                      // Handle relative URLs by making them absolute with backend URL
                      let imageSrc = src
                      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                        const backendUrl = localStorage.getItem('backendUrl') || 'http://localhost:760'
                        if (src.startsWith('/')) {
                          imageSrc = `${backendUrl}${src}`
                        } else {
                          // Handle relative paths like "image.jpg" by assuming they're in current post's folder
                          const postIdForFiles = getPostIdForFiles()
                          imageSrc = `${backendUrl}/public/${postIdForFiles}/${src}`
                        }
                      }
                      
                      return (
                        <img
                          {...props}
                          src={imageSrc}
                          alt={alt || 'Image'}
                          title={title}
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                          }}
                          onError={(e) => {
                            e.target.style.border = '1px solid #ff4444'
                            e.target.style.backgroundColor = '#ffeeee'
                          }}
                        />
                      )
                    }
                  }}
                >
                  {formData.content}
                </ReactMarkdown>
              ) : (
                <p className="preview-placeholder">Start typing markdown to see preview...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostEditor
