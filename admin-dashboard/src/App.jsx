import { useState, useRef } from 'react'
import './App.css'
import PostsList from './components/PostsList'
import PostEditor from './components/PostEditor'
import BackendConfig from './components/BackendConfig'

function App() {
  const [currentPage, setCurrentPage] = useState('posts-list')
  const [selectedPost, setSelectedPost] = useState(null)
  const postsListRef = useRef()

  const navigateToEditor = (post = null) => {
    setSelectedPost(post)
    setCurrentPage('post-editor')
  }

  const navigateToPostsList = () => {
    setSelectedPost(null)
    setCurrentPage('posts-list')
    // Refresh drafts when returning from editor with safety checks
    setTimeout(() => {
      try {
        if (postsListRef.current?.refreshDrafts) {
          postsListRef.current.refreshDrafts()
        }
      } catch (error) {
        console.error('Failed to refresh drafts:', error)
      }
    }, 100) // Increased delay to ensure PostsList is fully mounted and ready
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'posts-list':
        return <PostsList ref={postsListRef} onNewPost={() => navigateToEditor()} onEditPost={navigateToEditor} />
      case 'post-editor':
        return <PostEditor post={selectedPost} onBack={navigateToPostsList} />
      default:
        return <PostsList ref={postsListRef} onNewPost={() => navigateToEditor()} onEditPost={navigateToEditor} />
    }
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h1>Blog Admin</h1>
        <div className="nav-links">
          <button 
            className={currentPage === 'posts-list' ? 'active' : ''}
            onClick={() => setCurrentPage('posts-list')}
          >
            Posts
          </button>
          <BackendConfig />
        </div>
      </nav>
      
      <main className="main-content">
        {renderCurrentPage()}
      </main>
    </div>
  )
}

export default App
