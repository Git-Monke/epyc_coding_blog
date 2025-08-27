const DRAFTS_STORAGE_KEY = 'blog_drafts'

// Generate unique draft ID
export const generateDraftId = () => {
  return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Save draft to localStorage
export const saveDraft = (draft) => {
  try {
    const drafts = loadDrafts()
    const draftToSave = {
      ...draft,
      id: draft.id || generateDraftId(),
      isDraft: true,
      lastModified: new Date().toISOString(),
      created: draft.created || new Date().toISOString(),
      // Preserve original post ID if this draft was created from a published post
      originalPostId: draft.originalPostId || null
    }
    
    drafts[draftToSave.id] = draftToSave
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
    return draftToSave.id
  } catch (error) {
    console.error('Error saving draft:', error)
    return null
  }
}

// Load all drafts from localStorage
export const loadDrafts = () => {
  try {
    const draftsJson = localStorage.getItem(DRAFTS_STORAGE_KEY)
    return draftsJson ? JSON.parse(draftsJson) : {}
  } catch (error) {
    console.error('Error loading drafts:', error)
    return {}
  }
}

// Load specific draft by ID
export const loadDraft = (id) => {
  try {
    const drafts = loadDrafts()
    return drafts[id] || null
  } catch (error) {
    console.error('Error loading draft:', error)
    return null
  }
}

// Delete draft from localStorage
export const deleteDraft = (id) => {
  try {
    const drafts = loadDrafts()
    delete drafts[id]
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
    return true
  } catch (error) {
    console.error('Error deleting draft:', error)
    return false
  }
}

// Get all drafts as array
export const getDraftsArray = () => {
  const drafts = loadDrafts()
  return Object.values(drafts).sort((a, b) => 
    new Date(b.lastModified) - new Date(a.lastModified)
  )
}

// Check if post is a draft
export const isDraft = (post) => {
  return post && post.isDraft === true
}