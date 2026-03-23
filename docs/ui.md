Here is a clean, structured **Markdown document** you can use as your UI / Frontend specification.

You can save this as:

```
frontend-spec.md
```

---

# Edge Workspace — Frontend & UI Specification

## 1. Overview

Edge Workspace is a multi-user collaborative application with the following core modules:

* Group Chat
* Image Gallery
* File Storage
* Collaborative Notes

The UI is designed to be:

* Minimal
* Dark-first
* Clean and distraction-free
* Fast and responsive
* Workspace-focused

This document defines layout structure, components, interactions, states, and UX details.

---

# 2. Layout Architecture

## 2.1 Global Layout Structure

```
| Global Sidebar | Workspace Sidebar | Main Content Area |
```

### Global Sidebar (Fixed, Narrow)

Width: 56–72px
Purpose: App-level navigation

Contains:

* Logo (top)
* Home
* Workspaces
* Settings
* Profile avatar (bottom)

Behavior:

* Icon-only
* Tooltip on hover
* Active state highlight
* Collapsible (optional future feature)

---

## 2.2 Workspace Sidebar (Primary Navigation)

Width: 240–280px
Purpose: Workspace-specific navigation

Structure:

Workspace Header:

* Workspace avatar
* Workspace name
* Member count
* Invite button

Navigation Sections:

* Overview
* 💬 Group Chat
* 🖼 Gallery
* 📁 Files
* 📝 Notes

Notes section:

* List of documents
* “+ New Note” button
* Optional nested hierarchy (future)

Files section:

* Toggle (Grid / List)
* Upload button

Behavior:

* Scrollable if content exceeds height
* Active tab highlighted
* Right-click context menu (optional future)

---

## 2.3 Main Content Area

Flexible layout depending on module:

* Chat layout
* Gallery grid
* File list/grid
* Editor interface

Should:

* Fill remaining width
* Be scrollable independently
* Maintain consistent padding (24–32px)

---

# 3. Design System

## 3.1 Theme

Dark-first UI.

Background layers:

* Base background: Very dark gray
* Sidebar: Slightly darker
* Cards: Slight contrast
* Borders: Subtle low-opacity

Avoid:

* Harsh whites
* Strong gradients
* Heavy shadows

---

## 3.2 Typography

* Clean sans-serif font
* Clear hierarchy:

Headings:

* H1: Workspace title
* H2: Section title
* H3: Component titles

Body:

* 14–16px base size

Chat:

* Slightly smaller for compact feel

---

## 3.3 Spacing Rules

Use consistent spacing scale:

* 4px micro spacing
* 8px small spacing
* 16px section spacing
* 24–32px layout spacing

Never overcrowd.

---

# 4. Module Specifications

---

# 4.1 Group Chat

## Layout

```
| Channel List (optional future) | Messages Area |
```

For v1:
Single channel: “General”

## Chat Header

* Channel name
* Online member count
* Settings icon

## Messages Area

Each message contains:

* Avatar
* Username
* Timestamp
* Message content
* Reactions (future)

Message types:

* User message
* System message (user joined)
* Edited message

## Message Input

Bottom fixed input:

* Text area
* Auto-expand
* Send button
* File attachment icon

UX:

* Enter = send
* Shift+Enter = newline
* Typing indicator
* Auto-scroll to bottom
* New message indicator if scrolled up

---

# 4.2 Image Gallery

## Layout

Masonry-style responsive grid.

Image card contains:

* Image preview
* Uploader avatar
* Upload date (hover)
* Optional tag

## Interactions

* Click → Fullscreen modal
* ESC to close
* Arrow keys to navigate
* Drag and drop upload
* Upload progress indicator

## Empty State

Illustration + “Upload your first image”

---

# 4.3 Files Module

## View Modes

### Grid View

* File icon
* Name
* Size
* Upload date

### List View

Columns:

* Name
* Uploaded by
* Size
* Date

## File Card

* Icon based on file type
* Hover highlight
* Right-click context menu:

  * Download
  * Rename
  * Delete
  * Copy link

## Upload UX

* Drag and drop overlay
* Progress bar
* Success animation

---

# 4.4 Notes (Collaborative Editor)

This is the most important UI.

## Editor Layout

```
| Document Title |
| ----------------|
| Editable Area  |
```

Minimal chrome.

## Features

* Title editable
* Real-time cursor presence
* Avatar stack (top right)
* Live typing sync
* Auto-save indicator
* Slash command (future)

## Editor Behavior

* Markdown-based or block-based
* Clean whitespace
* No heavy toolbar
* Context toolbar on selection (optional)

## Presence UI

* Colored cursors
* User name label
* Avatar stack
* “User is typing…”

---

# 5. Workspace Management UI

## Invite Members Modal

Fields:

* Email input
* Role selector (Admin / Member)
* Send invite

## Members Panel

* Avatar
* Name
* Role badge
* Remove option (admin only)

---

# 6. State & Loading UX

## Loading States

* Skeleton for messages
* Skeleton for file list
* Skeleton for gallery grid
* Editor loading shimmer

## Empty States

Each module must have:

* Illustration
* Clear explanation
* Primary action button

Example:
“No files yet”
→ “Upload File”

---

# 7. Navigation Behavior

* URL-based routing
* Deep link to:

  * Specific document
  * Specific workspace
* Browser back support
* Persistent workspace state

---

# 8. Responsiveness

## Desktop (Primary Target)

Full layout.

## Tablet

* Collapse workspace sidebar
* Use toggle button

## Mobile (Optional v1 skip)

* Stack layout
* Tab navigation instead of sidebar

---

# 9. Performance Considerations

Frontend must:

* Lazy load images
* Virtualize long chat lists
* Debounce editor sync
* Optimistic UI updates
* Cache workspace data

---

# 10. Component Breakdown

## Core Components

* AppLayout
* GlobalSidebar
* WorkspaceSidebar
* ChatView
* MessageItem
* MessageInput
* GalleryView
* ImageCard
* FileView
* FileCard
* NotesEditor
* PresenceAvatars
* InviteModal
* MembersPanel

---

# 11. UX Principles

1. No clutter.
2. Fast feedback.
3. Clear hierarchy.
4. Subtle animations.
5. Strong empty states.
6. Clear role boundaries.
7. Smooth transitions.

---

# 12. v1 Scope Definition

Must Have:

* Workspace creation
* Group chat (real-time)
* File upload
* Image gallery
* Single collaborative note
* Invite members

Not in v1:

* Version history
* Threads
* Advanced permissions
* AI tools
* Notifications system

---

# 13. Future Enhancements (Optional)

* Multiple chat channels
* Nested notes
* Reactions
* Activity feed
* Notifications panel
* Search across workspace
* Keyboard command palette

---

# Final Goal

The frontend should:

* Feel like a real SaaS product
* Demonstrate clean system thinking
* Clearly separate modules
* Showcase real-time UI patterns
* Look production-ready

---

If you want, next I can generate:

* Component file structure for Next.js
* Tailwind design tokens
* State management plan
* Or a detailed UX flow diagram

