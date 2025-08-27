import { useState, useCallback } from 'react'

/**
 * Custom hook for managing API call states (loading, error, data)
 * @param {Function} apiFunction - The API function to call
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export const useApi = (apiFunction) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiFunction(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err.message || 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}

/**
 * Hook specifically for handling posts API calls
 */
export const usePostsApi = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchInfo, setSearchInfo] = useState({
    totalPages: 0,
    processingTime: 0,
    query: ''
  })

  const loadPosts = useCallback(async (search = '', page = 0) => {
    setLoading(true)
    setError(null)
    
    try {
      const { postsApi } = await import('../services/api')
      const result = await postsApi.getPosts(search, page)
      
      setPosts(result.posts)
      setSearchInfo({
        totalPages: result.totalPages,
        processingTime: result.processingTime,
        query: result.query
      })
      
      return result
    } catch (err) {
      setError(err.message || 'Failed to load posts')
      setPosts([])
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const savePost = useCallback(async (post) => {
    setLoading(true)
    setError(null)
    
    try {
      const { postsApi } = await import('../services/api')
      const result = await postsApi.savePost(post)
      return result
    } catch (err) {
      setError(err.message || 'Failed to save post')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deletePost = useCallback(async (postId) => {
    setLoading(true)
    setError(null)
    
    try {
      const { postsApi } = await import('../services/api')
      const result = await postsApi.deletePost(postId)
      
      // Remove from local state
      setPosts(prev => prev.filter(post => post.id !== postId))
      
      return result
    } catch (err) {
      setError(err.message || 'Failed to delete post')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    posts,
    loading,
    error,
    searchInfo,
    loadPosts,
    savePost,
    deletePost,
    setPosts
  }
}

/**
 * Hook for handling files API calls
 */
export const useFilesApi = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const loadFiles = useCallback(async (postId) => {
    setLoading(true)
    setError(null)
    
    try {
      const { filesApi } = await import('../services/api')
      const result = await filesApi.getFiles(postId)
      setFiles(result)
      return result
    } catch (err) {
      setError(err.message || 'Failed to load files')
      setFiles([])
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadFile = useCallback(async (postId, file) => {
    setLoading(true)
    setError(null)
    setUploadProgress(0)
    
    try {
      const { filesApi } = await import('../services/api')
      
      const result = await filesApi.uploadFile(
        postId, 
        file, 
        (progress) => setUploadProgress(progress)
      )
      
      // Refresh files list after upload
      await loadFiles(postId)
      
      return result
    } catch (err) {
      setError(err.message || 'Failed to upload file')
      throw err
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }, [loadFiles])

  const deleteFile = useCallback(async (postId, filename) => {
    setLoading(true)
    setError(null)
    
    try {
      const { filesApi } = await import('../services/api')
      const result = await filesApi.deleteFile(postId, filename)
      
      // Remove from local state
      setFiles(prev => prev.filter(file => file.name !== filename))
      
      return result
    } catch (err) {
      setError(err.message || 'Failed to delete file')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    files,
    loading,
    error,
    uploadProgress,
    loadFiles,
    uploadFile,
    deleteFile,
    setFiles
  }
}

export default useApi