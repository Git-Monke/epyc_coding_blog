# Admin Dashboard TODO

This file tracks the implementation plan for the blog admin dashboard.

## Phase 1: Setup & Dependencies
- [x] Check current dependencies in package.json
- [x] Install react-markdown for markdown preview
- [x] Verify axios is available (already installed)

## Phase 2: Basic Structure
- [x] Replace default App.jsx with basic routing structure
- [x] Create simple navigation bar with "Posts" section
- [x] Set up basic page routing (Posts List, Post Editor)

## Phase 3: Posts List Page (Static First)
- [x] Create PostsList component with hardcoded mock data
- [x] Display posts as cards with title, description, tags
- [x] Add "New Post" button
- [x] Add "Edit" and "Delete" buttons on each card
- [x] Add search input field (non-functional initially)

## Phase 4: Post Editor (Static First)
- [x] Create PostEditor component with form fields (title, description, tags, content)
- [x] Add basic textarea for markdown content
- [x] Add "Save Draft" and "Publish" buttons
- [x] Create side-by-side layout (50% editor, 50% preview)

## Phase 5: Markdown Preview
- [x] Add markdown preview panel using react-markdown
- [x] Connect preview to live update from markdown input
- [x] Add basic markdown styling for preview panel

## Phase 6: Draft System (localStorage)
- [x] Create localStorage service functions (save/load/delete drafts)
- [x] Auto-save drafts as user types
- [x] Load existing drafts in editor
- [x] Show draft indicator in UI
- [x] Handle draft vs published post states

## Phase 7: File Management (Static First)
- [ ] Add file upload section to PostEditor
- [ ] Create file list display showing uploaded files
- [ ] Add "Upload" button with file picker
- [ ] Add "Delete" button for each file
- [ ] Add "Copy URL" button for each file
- [ ] Display file names and basic info

## Phase 8: API Service Layer
- [x] Create api/posts.js with functions:
  - getPosts(search, page)
  - getPost(id)
  - createPost(post)
  - updatePost(id, post)
  - deletePost(id)
- [x] Create api/files.js with functions:
  - uploadFile(postId, file)
  - getFiles(postId)
  - deleteFile(postId, filename)
- [x] Configure axios baseURL for backend (port 760)

## Phase 9: Connect Posts List to Backend
- [x] Replace hardcoded data with API calls
- [x] Connect search functionality to backend /search endpoint
- [x] Handle loading states and errors
- [x] Implement pagination if needed (backend supports it)

## Phase 10: Connect Post Editor to Backend
- [x] Load existing posts from backend in editor
- [x] Implement "Publish" button to POST/PUT to backend
- [x] Handle post creation (new posts) vs updates (existing posts)
- [x] Show success/error messages for publish operations

## Phase 11: Connect File Management to Backend
- [ ] Connect file upload to POST /uploads/:postId
- [ ] Connect file list to GET /uploads/:postId
- [ ] Connect file deletion to DELETE /uploads/:postId/:resourceName
- [ ] Generate correct file URLs for copying (based on backend file structure)
- [ ] Handle upload progress and errors

## Phase 12: Integration & Bug Fixes
- [ ] Test complete flow: create post → add files → save draft → publish
- [ ] Test post editing: load existing → edit → publish changes
- [ ] Test file management: upload → copy URL → use in markdown → preview
- [ ] Fix any routing issues between list and editor
- [ ] Handle edge cases (empty states, API errors, etc.)

## Phase 13: Refactoring
- [ ] Extract reusable components:
  - PostCard component
  - FileUpload component  
  - MarkdownEditor component
  - SearchBar component
- [ ] Create custom hooks:
  - useDrafts for localStorage operations
  - useApi for API calls with loading states
- [ ] Organize file structure better
- [ ] Add PropTypes or TypeScript interfaces if desired

## Phase 14: Basic Styling & UX
- [ ] Add CSS for card grid layout
- [ ] Style the side-by-side editor layout
- [ ] Add basic form styling
- [ ] Improve file upload UI (drag-drop zone)
- [ ] Add loading spinners and better error messages
- [ ] Make responsive for ultra-wide monitors
- [ ] Add basic animations/transitions

## Notes
- Backend runs on port 760
- Posts have fields: id, title, tags[], description, content
- Files are organized by postId in backend (/public/:postId/:filename)
- Draft system is localStorage only, published posts go to backend
- No authentication needed (IP-based auth already in place)
- Focus on functionality over visual polish
