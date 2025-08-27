import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getDraftsArray, deleteDraft, isDraft } from '../services/drafts'
import { usePostsApi } from '../hooks/useApi'
import { checkBackendConnection } from '../services/api'

const PostsList = forwardRef(function PostsList({ onNewPost, onEditPost }, ref) {
  const [searchQuery, setSearchQuery] = useState('')
  const [backendConnected, setBackendConnected] = useState(null)
  const [drafts, setDrafts] = useState([])
  const { posts: apiPosts, loading, error, loadPosts, deletePost: deleteApiPost } = usePostsApi()

  // Load drafts on mount and create refresh function
  const refreshDrafts = useCallback(() => {
    try {
      setDrafts(getDraftsArray())
    } catch (error) {
      console.error('Failed to refresh drafts:', error)
      setDrafts([]) // Fallback to empty array
    }
  }, [])

  useEffect(() => {
    refreshDrafts()
  }, [])

  // Expose refreshDrafts function to parent component
  useImperativeHandle(ref, () => ({
    refreshDrafts
  }), [refreshDrafts])

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId
      return (query) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          loadPosts(query, 0)
        }, 300) // Search after 300ms of inactivity
      }
    })(),
    [loadPosts]
  )

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkBackendConnection()
      setBackendConnected(connected)
    }
    checkConnection()
  }, [])

  // Load posts on mount and when backend connection changes
  useEffect(() => {
    if (backendConnected) {
      loadPosts('', 0) // Load all posts initially
    }
  }, [backendConnected, loadPosts])

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (backendConnected) {
      debouncedSearch(query)
    }
  }

  // Combine published posts with drafts, avoiding duplicates
  const publishedPosts = backendConnected ? apiPosts : []
  
  // Create a map of posts by ID, preferring published over drafts
  const postsMap = new Map()
  
  // Add published posts first (these take priority)
  publishedPosts.forEach(post => {
    postsMap.set(post.id, { ...post, hasPublished: true })
  })
  
  // Add drafts only if no published version exists, or add draft indicator
  drafts.forEach(draft => {
    const originalId = draft.originalPostId || draft.id
    if (postsMap.has(originalId)) {
      // Published version exists, just add draft indicator
      postsMap.set(originalId, { 
        ...postsMap.get(originalId), 
        hasDraft: true,
        draftLastModified: draft.lastModified 
      })
    } else {
      // No published version, show the draft
      postsMap.set(originalId, { 
        ...draft, 
        hasDraft: true, 
        hasPublished: false 
      })
    }
  })
  
  // Convert back to array and sort
  const allPosts = Array.from(postsMap.values()).sort((a, b) => {
    // Sort by last modified date, whether from draft or published
    const aDate = a.draftLastModified || a.publishedDate || a.lastModified || '2000-01-01'
    const bDate = b.draftLastModified || b.publishedDate || b.lastModified || '2000-01-01'
    return new Date(bDate) - new Date(aDate)
  })

  const handleDeletePost = async (post) => {
    if (isDraft(post)) {
      if (window.confirm('Are you sure you want to delete this draft?')) {
        deleteDraft(post.id)
        // Refresh drafts immediately
        refreshDrafts()
      }
    } else {
      if (window.confirm('Are you sure you want to delete this published post?')) {
        try {
          await deleteApiPost(post.id)
          // The usePostsApi hook automatically removes it from the list
        } catch (error) {
          alert(`Failed to delete post: ${error.message}`)
        }
      }
    }
  }

  const handleRetryConnection = async () => {
    setBackendConnected(null) // Show loading state
    const connected = await checkBackendConnection()
    setBackendConnected(connected)
    if (connected) {
      loadPosts(searchQuery, 0)
    }
  }

  return (
    <div className="posts-list">
      <div className="posts-header">
        <div className="search-section">
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={backendConnected ? "Search posts..." : "Search disabled (backend offline)"}
            className="search-input"
            disabled={!backendConnected}
          />
        </div>
        <button 
          onClick={onNewPost}
          className="new-post-btn"
        >
          + New Post
        </button>
      </div>

      {/* Backend Status */}
      {backendConnected === false && (
        <div className="backend-status error">
          <p>⚠️ Backend server is not connected. Published posts are not available.</p>
          <button onClick={handleRetryConnection} className="retry-btn">
            Retry Connection
          </button>
        </div>
      )}

      {backendConnected === null && (
        <div className="backend-status loading">
          <p>🔄 Checking backend connection...</p>
        </div>
      )}

      {error && backendConnected && (
        <div className="backend-status error">
          <p>❌ Error loading posts: {error}</p>
          <button onClick={() => loadPosts(searchQuery, 0)} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && backendConnected && (
        <div className="loading-state">
          <p>🔄 Loading posts...</p>
        </div>
      )}

      {/* Posts Grid */}
      <div className="posts-grid">
        {allPosts.length > 0 ? allPosts.map(post => (
          <div key={post.id} className="post-card" onClick={() => onEditPost(post)}>
            <div className="post-content">
              <div className="post-title-row">
                <h3 className="post-title">{post.title || 'Untitled Draft'}</h3>
                <div className="post-badges">
                  {!post.hasPublished && <span className="draft-badge">Draft Only</span>}
                  {post.hasPublished && post.hasDraft && <span className="draft-indicator">Has Draft</span>}
                </div>
              </div>
              <p className="post-description">{post.description || 'No description'}</p>
              <div className="post-tags">
                {post.tags && post.tags.length > 0 ? post.tags.map(tag => (
                  <span key={tag} className="tag">#{tag}</span>
                )) : <span className="no-tags">No tags</span>}
              </div>
              {isDraft(post) && post.lastModified && (
                <p className="post-modified">
                  Last modified: {new Date(post.lastModified).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="post-actions">
              <button 
                onClick={(e) => {
                  e.stopPropagation() // Prevent card click
                  onEditPost(post)
                }}
                className="edit-btn"
              >
                Edit
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation() // Prevent card click
                  handleDeletePost(post)
                }}
                className="delete-btn"
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        )) : !loading && (
          <div className="empty-posts">
            <p>
              {searchQuery 
                ? `No posts found for "${searchQuery}"` 
                : backendConnected === false 
                  ? 'No drafts found. Backend is offline, so published posts are not available.' 
                  : 'No posts found. Create your first post!'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

export default PostsList