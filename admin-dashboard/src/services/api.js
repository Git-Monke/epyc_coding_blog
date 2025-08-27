import axios from 'axios'
import { getBackendUrl } from './config'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getBackendUrl(),
  timeout: 10000, // 10 seconds for regular requests
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message)
    
    // Handle common error cases
    if (error.response?.status === 404) {
      throw new Error('Resource not found')
    } else if (error.response?.status === 500) {
      throw new Error('Server error occurred')
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Make sure the backend is running on port 760.')
    } else {
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }
)

// Posts API
export const postsApi = {
  // Search posts (also used for getting all posts with empty search)
  async getPosts(search = '', page = 0) {
    try {
      const response = await api.get('/search', {
        params: { s: search, p: page }
      })
      
      return {
        posts: response.data.hits || [],
        totalPages: response.data.totalPages || 1,
        processingTime: response.data.processingTimeMs || 0,
        query: response.data.query || search
      }
    } catch (error) {
      throw error
    }
  },

  // Get single post by ID
  async getPost(id) {
    try {
      const response = await api.get(`/posts/${id}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Create or update post
  async savePost(post) {
    try {
      const postData = {
        id: post.id || undefined, // Let backend generate ID if not provided
        title: post.title,
        description: post.description,
        tags: Array.isArray(post.tags) ? post.tags : [],
        content: post.content
      }

      const response = await api.post('/posts', postData)
      return {
        taskId: response.data.taskId,
        postId: response.data.postId
      }
    } catch (error) {
      throw error
    }
  },

  // Delete post
  async deletePost(id) {
    try {
      const response = await api.delete(`/posts/${id}`)
      return {
        taskId: response.data.taskId,
        postId: response.data.postId
      }
    } catch (error) {
      throw error
    }
  }
}

// Files API
export const filesApi = {
  // Upload file to post
  async uploadFile(postId, file, onProgress) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const config = {
        timeout: 30000, // 30 seconds for file uploads
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(percentCompleted)
        }
      }

      const response = await api.post(`/uploads/${postId}`, formData, config)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get files for post
  async getFiles(postId) {
    try {
      const response = await api.get(`/uploads/${postId}`)
      
      // Handle both response formats: array of filenames or {files: []} object
      let filenames = response.data
      if (response.data && typeof response.data === 'object' && Array.isArray(response.data.files)) {
        filenames = response.data.files
      } else if (!Array.isArray(response.data)) {
        filenames = []
      }
      
      return filenames.map(filename => ({
        id: `file_${postId}_${filename}`, // Create unique ID
        name: filename,
        url: `${getBackendUrl()}/public/${postId}/${filename}`,
        // Note: Backend doesn't provide size/date info, would need enhancement
      }))
    } catch (error) {
      // If folder doesn't exist, return empty array
      if (error.response?.status === 404) {
        return []
      }
      throw error
    }
  },

  // Delete file
  async deleteFile(postId, filename) {
    try {
      const response = await api.delete(`/uploads/${postId}/${filename}`)
      return response.data
    } catch (error) {
      throw error
    }
  }
}

// Utility function to check if backend is running
export const checkBackendConnection = async () => {
  try {
    await api.get('/health')
    return true
  } catch (error) {
    return false
  }
}

export default api