# Alexandria Workspace Panel - Design Document

## Executive Summary

This document outlines the design for creating an **Alexandria Workspace Panel** as an NPM-distributed panel extension, based on the `industry-themed-panel-starter` template and inspired by the workspace management system from the desktop-app.

**Goal:** Create a standalone, web-compatible panel package that displays and manages repositories within a workspace, similar to the WorkspaceEntriesPanel from the Electron app, but adapted for the Panel Framework V2 architecture.

---

## Project Overview

### Source Template
- **Base:** `@your-org/panel-starter` from `/Users/griever/Developer/industry-themed-panel-starter`
- **Architecture:** Panel Framework V2 compatible
- **Distribution:** NPM package with `panel-extension` keyword
- **Technology:** React 19, TypeScript, Vite

### Reference Implementation
- **Source:** Desktop app workspace panels from `/Users/griever/Developer/desktop-app/electron-app`
- **Primary Reference:** WorkspaceEntriesPanel and LocalProjectCard
- **Features to Adapt:** Repository membership management, real-time updates, visual design

---

## Architecture Comparison

### Desktop App (Current)
```
Electron Main Process (Node.js)
    ├── WorkspaceAPI (IPC)
    ├── AlexandriaAPI (IPC)
    └── File System Access
          ↓
Renderer Process (React)
    ├── WorkspacesListPanel
    ├── WorkspaceEntriesPanel
    ├── LocalProjectsPanel
    └── LocalProjectCard
```

**Data Flow:**
- IPC communication between processes
- Direct file system access via Node.js
- Local SQLite database for Alexandria entries
- Event-driven updates via IPC events

### Panel Extension (New Architecture)
```
Host Application
    ├── Panel Framework Core
    ├── Data Slice Providers (git, workspaces, repositories, etc.)
    └── Panel Registry
          ↓
NPM Panel Package
    ├── WorkspaceRepositoriesPanel
    └── RepositoryCard Component
```

**Data Flow:**
- Data provided via Panel Context (data slices)
- Actions executed via Panel Actions API
- Inter-panel communication via Event Emitter
- Web API or hosted backend for workspace storage

---

## Key Architectural Differences

| Aspect | Desktop App | Panel Extension |
|--------|-------------|-----------------|
| **Environment** | Electron (Node.js + Chromium) | Browser or web-based host |
| **Data Source** | Local SQLite + File System | Panel Context data slices + API |
| **Communication** | IPC between processes | Panel Framework API |
| **Storage** | Local file system | Cloud/hosted backend or localStorage |
| **Window Management** | Multi-window Electron | Single-page or panel navigation |
| **File Access** | Direct via Node.js | Via host actions or file API |
| **Real-time Updates** | IPC event subscriptions | Panel event emitter |

---

## Component Design

### 1. WorkspaceRepositoriesPanel

**Purpose:** Display repositories within a selected workspace

**Features:**
- Show workspace details (name, description, home directory)
- List all repositories in workspace
- Remove repository from workspace
- Repository cards with actions
- Empty state handling (no workspace, no repositories)

**Data Requirements:**
- Custom data slice: `workspace: Workspace | null` (current workspace context)
- Custom data slice: `workspaceRepositories: Repository[]` (repos in current workspace)

**Actions:**
- `actions.removeRepositoryFromWorkspace(repoId, workspaceId)`
- `actions.copyToClipboard(text)`

**Events:**
- Listens: `workspace:changed` to update when workspace context changes
- Emits: `repository:opened` when user clicks to open a repository (host handles navigation)
- Listens: `workspace:membership-changed` for repository list updates

**UI Components:**
- Workspace header with metadata (name, description, home directory)
- Repository list with cards (scrollable)
- Empty state for no repositories
- Empty state for no workspace selected

### 2. RepositoryCard (Shared Component)

**Purpose:** Display individual repository with actions

**Features:**
- Repository avatar/icon (owner/org)
- Name, path, language, description
- Copy path to clipboard
- Action buttons (open, remove)

**Props:**
```typescript
interface RepositoryCardProps {
  repository: Repository;
  workspace?: Workspace;
  actions: {
    onOpen?: () => void;
    onRemove?: () => void;
    onCopyPath?: () => void;
  };
  showLocation?: boolean;
}
```

**UI Elements:**
- Owner/org icon or avatar
- Repository name (clickable to open)
- Path with copy button
- Language indicator with color
- Description (truncated if long)

---

## Data Model

### Core Types

**Types are imported from `@a24z/core-library`** - the same types used by the desktop app.

```typescript
import type { Workspace, WorkspaceMembership } from '@a24z/core-library';
import type { AlexandriaEntry } from '@a24z/core-library';

// Workspace interface from core-library:
interface Workspace {
  id: string;                      // Unique identifier (UUID)
  name: string;                    // Display name
  description?: string;            // Optional description
  color?: string;                  // Optional UI color (hex or theme token)
  icon?: string;                   // Optional icon identifier
  isDefault?: boolean;             // Default workspace for new clones
  createdAt: number;               // Unix timestamp
  updatedAt: number;               // Unix timestamp
  suggestedClonePath?: string;     // Optional path hint for clone suggestions
  metadata?: Record<string, unknown>;  // Extensible metadata
}

// AlexandriaEntry interface from core-library (repository with local path):
interface AlexandriaEntry extends AlexandriaRepository {
  path: ValidatedRepositoryPath;   // Local repository path
  name: string;                    // Project/repository name
  remoteUrl?: string;              // Git remote URL
  registeredAt: string;            // ISO timestamp when registered
  github?: GithubRepository;       // GitHub metadata when available
  hasViews: boolean;               // Has .alexandria/views directory
  viewCount: number;               // Number of CodebaseView files
  views: CodebaseViewSummary[];    // View summaries
  lastChecked?: string;            // Last verified timestamp
  bookColor?: string;              // Optional visual color
}

// WorkspaceMembership interface from core-library:
interface WorkspaceMembership {
  repositoryId: string;            // Repository identity (github.id or entry.name)
  workspaceId: string;             // Workspace identifier
  addedAt: number;                 // Unix timestamp when added
  metadata?: {                     // Workspace-specific metadata
    pinned?: boolean;
    notes?: string;
    [key: string]: unknown;
  };
}
```

### Panel Data Slices

**New data slices to implement (provided by host):**

```typescript
interface WorkspaceContextSlice {
  workspace: Workspace | null;
  loading: boolean;
  error?: string;
}

interface WorkspaceRepositoriesSlice {
  repositories: Repository[];
  loading: boolean;
  error?: string;
}
```

---

## Panel Actions API

### Required Host Actions

The host application must provide these actions for the panel to function:

```typescript
interface WorkspaceRepositoriesPanelActions extends PanelActions {
  // Repository membership management
  removeRepositoryFromWorkspace(repoId: string, workspaceId: string): Promise<void>;

  // Utilities
  copyToClipboard(text: string): Promise<void>;
}
```

**Note:**
- Data fetching is handled by the host via data slices, not by panel actions. The panel reacts to data slice updates rather than fetching data.
- Opening repositories is handled via events (`repository:opened`), not actions. The panel emits the event and the host decides how to handle it (navigation, new window, etc.).

---

## Event System

### Events to Emit

```typescript
// When user clicks to open a repository
{
  type: 'repository:opened',
  payload: { repositoryId: string, repository: Repository }
}
```

### Events to Listen For

```typescript
// When the workspace context changes (e.g., user switches workspaces)
{
  type: 'workspace:changed',
  payload: { workspaceId: string }
}

// When repository membership in workspace changes
{
  type: 'workspace:membership-changed',
  payload: {
    workspaceId: string,
    repositoryId: string,
    action: 'added' | 'removed'
  }
}

// When repository data changes
{
  type: 'repository:changed',
  payload: { repositoryId: string }
}
```

---

## Implementation Phases

### Phase 1: Project Setup
- [x] Initialize from panel-starter template
- [ ] Update package.json with proper naming
- [ ] Configure TypeScript types for workspace domain
- [ ] Set up Storybook with workspace mock data
- [ ] Install additional dependencies (if needed)

### Phase 2: Core Components
- [ ] Install `@a24z/core-library` dependency
- [ ] Import types (Workspace, AlexandriaEntry, WorkspaceMembership)
- [ ] Build RepositoryCard component
- [ ] Create mock data providers for development

### Phase 3: Workspace Repositories Panel
- [ ] Implement WorkspaceRepositoriesPanel
- [ ] Add workspace header display
- [ ] Add repository removal functionality
- [ ] Implement empty states (no workspace, no repos)
- [ ] Create Storybook stories

### Phase 4: Integration
- [ ] Define required panel actions interface
- [ ] Implement event handlers
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test inter-panel communication

### Phase 5: Polish
- [ ] Apply industry-theme styling
- [ ] Add animations and transitions
- [ ] Implement empty states
- [ ] Add keyboard shortcuts
- [ ] Performance optimization
- [ ] Accessibility audit

### Phase 6: Documentation
- [ ] Write comprehensive README
- [ ] Document required host actions
- [ ] Document data slice requirements
- [ ] Create integration guide
- [ ] Add code examples

---

## Technical Considerations

### State Management

**Local State:**
- Component-level state for UI interactions (modals, editing, etc.)
- React useState and useReducer for simple state

**Global State:**
- Panel context for shared data (workspaces, repositories)
- Event emitter for cross-panel communication
- No external state library needed (React context sufficient)

### Data Reactivity Pattern

**The panel receives data via context and reacts to changes:**

```typescript
const WorkspaceRepositoriesPanel: React.FC<PanelComponentProps> = ({
  context,
  actions,
  events
}) => {
  // Data comes from context (provided by host)
  const workspace = context.data.workspace; // Workspace | null
  const repositories = context.data.workspaceRepositories; // Repository[]
  const isLoading = context.isSliceLoading('workspace') ||
                    context.isSliceLoading('workspaceRepositories');

  // Panel simply reacts to context changes - no manual fetching needed
  // When host updates the data slices, component re-renders automatically

  if (!workspace) {
    return <EmptyState message="No workspace selected" />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (repositories.length === 0) {
    return <EmptyState message="No repositories in this workspace" />;
  }

  return (
    <div>
      <WorkspaceHeader workspace={workspace} />
      <RepositoryList repositories={repositories} actions={actions} />
    </div>
  );
};
```

**Event Listening (for side effects only):**
```typescript
useEffect(() => {
  // Listen to events if you need to perform side effects
  // (e.g., show notifications, scroll to new items)
  const unsubscribe = events.subscribe('workspace:membership-changed', (event) => {
    if (event.payload.action === 'removed') {
      console.log('Repository removed from workspace');
    }
  });
  return unsubscribe;
}, []);
```

### Storage Strategy

**Option 1: Host-Provided Storage**
- Host application manages workspace data
- Panels interact via actions API
- Storage implementation hidden from panels

**Option 2: Cloud Backend**
- REST API for workspace CRUD
- Authentication handled by host
- Panels make HTTP requests via actions

**Option 3: Local Storage (Limited)**
- Use browser localStorage for simple cases
- Limitations: no cross-device sync, size limits
- Good for MVP/prototyping

**Recommended:** Option 1 (Host-Provided Storage) for maximum flexibility

### Error Handling

**Pattern:**
```typescript
try {
  await actions.createWorkspace(data);
  // Success feedback
} catch (error) {
  console.error('Failed to create workspace:', error);
  setError(error.message);
  // Show user-friendly error message
}
```

**Error States:**
- Network errors (if using API)
- No workspace context available
- Repository not found
- Permission errors (insufficient access to add/remove repos)
- Operation failures (add/remove failed)

---

## Visual Design

### Design System
- **Base:** `@a24z/industry-theme`
- **Icons:** Lucide React
- **Colors:** Theme-aware (primary, success, warning, error)
- **Typography:** Theme fonts with hierarchy
- **Spacing:** 4px grid system

### Layout Patterns

**Card-Based:**
```
┌─────────────────────────────────┐
│ Workspace Name          [Edit]  │
│ Description text here...        │
│ 🏠 /home/workspace              │
│ 12 repositories                 │
└─────────────────────────────────┘
```

**List View:**
```
┌─────────────────────────────────┐
│ [+] Add Repository              │
├─────────────────────────────────┤
│ ┌───────────────────────────┐   │
│ │ Repository Card 1         │   │
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │ Repository Card 2         │   │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

### Interaction Patterns
- **Hover:** Subtle background color change
- **Active:** Border highlight
- **Loading:** Skeleton screens or spinners
- **Empty:** Icon + helpful message + action button
- **Selection:** Border + background color
- **Inline Editing:** Click to edit with save/cancel

---

## Testing Strategy

### Storybook Stories

**WorkspaceRepositoriesPanel:**
- Default (workspace with repositories)
- Empty workspace (no repositories)
- No workspace selected
- Loading state
- Removing repository (with confirmation)

### Mock Data

Create comprehensive mocks in `src/mocks/`:
- `workspaceContext.tsx` - Mock workspace data provider
- `workspaceActions.tsx` - Mock actions with console logging
- Sample workspaces with varying data
- Sample repositories with git status

---

## Migration Path from Desktop App

### Differences to Address

1. **File System Access**
   - Desktop: Direct via Node.js
   - Panel: Via host actions or File System Access API
   - **Solution:** Abstract file operations behind actions API

2. **Window Management**
   - Desktop: Multi-window Electron
   - Panel: Panel navigation or host-managed windows
   - **Solution:** Use `navigateToPanel()` action

3. **Storage**
   - Desktop: Local SQLite database
   - Panel: Host-provided or cloud backend
   - **Solution:** Define storage interface, let host implement

4. **Real-time Updates**
   - Desktop: IPC events
   - Panel: Event emitter or WebSocket
   - **Solution:** Use panel event system

### Code Reuse Opportunities

**Components to Adapt:**
- LocalProjectCard UI → RepositoryCard component (simplified - no window state, no location tracking)

**Logic to Extract:**
- Repository sorting (alphabetical by name)
- Language color mapping
- Path display utilities
- Copy to clipboard functionality

---

## Package Configuration

### package.json

```json
{
  "name": "@your-org/alexandria-workspace-panel",
  "version": "1.0.0",
  "description": "Workspace and repository management panel for Panel Framework V2",
  "keywords": ["panel-extension", "workspace", "alexandria"],
  "main": "dist/panels.bundle.js",
  "types": "dist/index.d.ts",
  "files": ["dist/", "README.md", "LICENSE"],
  "peerDependencies": {
    "react": ">=19.0.0",
    "react-dom": ">=19.0.0"
  },
  "dependencies": {
    "lucide-react": "^0.552.0",
    "clsx": "^2.1.1",
    "@a24z/core-library": "^0.1.32"
  }
}
```

### Panel Registration

```typescript
// src/index.tsx
import { WorkspaceRepositoriesPanel } from './panels/WorkspaceRepositoriesPanel';

export const panels = [
  {
    id: 'your-org.workspace-repositories',
    name: 'Workspace Repositories',
    icon: '📁',
    component: WorkspaceRepositoriesPanel,
    onMount: (context) => {
      console.log('Workspace repositories panel mounted');
    },
    onDataChange: (slice, data) => {
      if (slice === 'workspace' || slice === 'workspaceRepositories') {
        console.log(`${slice} updated:`, data);
      }
    }
  }
];
```

---

## Dependencies

### Core (Peer)
- `react@^19.0.0` - UI framework (from host)
- `react-dom@^19.0.0` - DOM rendering (from host)

### Bundled
- `lucide-react@^0.552.0` - Icon library
- `clsx@^2.1.1` - Conditional classNames
- `@a24z/core-library@^0.1.32` - Core types (Workspace, AlexandriaEntry)

### Dev Dependencies
- `typescript@^5.0.4` - Type checking
- `vite@^6.0.7` - Build tool
- `@storybook/react-vite@^8.5.0` - Component development
- `eslint@^9.32.0` - Code linting
- `prettier@^3.6.2` - Code formatting

### Production (Bundled)
- `@a24z/industry-theme` - Design system (available on NPM)

---

## Success Criteria

### Functional Requirements (v1.0)
- [ ] Display current workspace information (name, description, home directory)
- [ ] List all repositories in current workspace
- [ ] Remove repositories from workspace (with confirmation)
- [ ] Open/navigate to repositories
- [ ] Copy repository paths to clipboard
- [ ] React to data slice updates automatically
- [ ] Error handling and user feedback
- [ ] Empty state handling (no workspace, no repositories)

### Deferred to Future Versions
- [ ] Add repositories to workspace (v2.0)

### Non-Functional Requirements
- [ ] TypeScript type safety (100% coverage)
- [ ] Comprehensive Storybook stories
- [ ] Responsive design
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Performance (< 100ms interaction response)
- [ ] Bundle size (< 50KB gzipped)

### Documentation Requirements
- [ ] README with integration guide
- [ ] API documentation for required actions
- [ ] Data slice documentation
- [ ] Event system documentation
- [ ] Code examples and snippets

---

## Open Questions

1. ✅ **Workspace Context:** Via data slice
2. ✅ **Add Repository Flow:** Not needed for first version
3. ✅ **Repository Navigation:** Fire `repository:opened` event, host handles it
4. ✅ **Git Data:** Not needed for first version - just display repository metadata
5. ✅ **Themes:** Yes, `@a24z/industry-theme` is available on NPM
6. ✅ **Real-time Sync:** Data slices get updated by host, panel reacts to changes

---

## Next Steps

1. **Review this design document** with stakeholders
2. **Answer open questions** to finalize architecture
3. **Set up project** from panel-starter template
4. **Create mock data** for Storybook development
5. **Build core components** in isolation
6. **Implement panels** with event-driven communication
7. **Test integration** with host application
8. **Document and publish** to NPM

---

## Appendix

### File Structure (Proposed)

```
industry-themed-alexandria-workspace-panel/
├── src/
│   ├── panels/
│   │   ├── WorkspaceRepositoriesPanel.tsx
│   │   └── WorkspaceRepositoriesPanel.stories.tsx
│   ├── components/
│   │   ├── RepositoryCard.tsx
│   │   ├── RepositoryCard.stories.tsx
│   │   ├── WorkspaceHeader.tsx
│   │   ├── EmptyState.tsx
│   │   └── RemoveRepositoryConfirmation.tsx
│   ├── types/
│   │   ├── workspace.ts
│   │   ├── repository.ts
│   │   └── panel.ts (extends base panel types)
│   ├── utils/
│   │   ├── languageColors.ts
│   │   └── pathUtils.ts
│   ├── mocks/
│   │   ├── panelContext.tsx
│   │   ├── workspaceData.ts
│   │   └── repositoryData.ts
│   └── index.tsx
├── dist/ (generated)
├── .storybook/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

### Reference Links

- Panel Starter: `/Users/griever/Developer/industry-themed-panel-starter`
- Desktop App Panels: `/Users/griever/Developer/desktop-app/electron-app/src/renderer/panels/components/`
- Panel Framework Core: `@principal-ade/panel-framework-core`

---

## UI Components to Copy from Desktop App

The following UI patterns and code can be copied directly from the desktop app with minimal modifications:

### 1. WorkspaceEntriesPanel → WorkspaceRepositoriesPanel

**File:** `/Users/griever/Developer/desktop-app/electron-app/src/renderer/panels/components/WorkspaceEntriesPanel.tsx`

**Copy these sections:**

#### Empty State (No Workspace)
Lines 179-234 - Complete empty state UI with Folder icon
```typescript
// Copy entire empty state section
if (!currentWorkspace) {
  return (
    <div style={baseContainerStyle}>
      <div style={{ flex: 1, display: 'flex', ... }}>
        <Folder size={48} />
        <h3>No Workspace Selected</h3>
        <p>Select a workspace from...</p>
      </div>
    </div>
  );
}
```

#### Loading State
Lines 238-275 - Loading state UI
```typescript
if (loading) {
  return (
    <div style={baseContainerStyle}>
      <h3>Loading repositories...</h3>
    </div>
  );
}
```

#### Workspace Header Section
Lines 280-441 - Complete workspace header with:
- Workspace name display
- ~~Add button~~ (remove for v1.0)
- Home directory display with icon
- Remove home directory button
- Description text

**Modifications needed:**
- Remove Add button and `showAddModal` state (lines 309-340)
- Remove home directory editing functionality (not in panel scope - just display)
- Keep description display as-is

#### Repository List Container
Lines 443-474 - Scrollable repository list
```typescript
<div style={{ flex: 1, overflowY: 'auto', ... }}>
  {repositories.map(repoData => (
    <LocalProjectCard key={repoData.repository.path} ... />
  ))}

  {/* Empty state for no repos */}
  {repositories.length === 0 && !loading && (
    <div style={{ padding: '32px', textAlign: 'center' }}>
      <p>No repositories in this workspace.</p>
    </div>
  )}
</div>
```

### 2. LocalProjectCard → RepositoryCard

**File:** `/Users/griever/Developer/desktop-app/electron-app/src/renderer/panels/components/LocalProjectCard.tsx`

**Copy these sections:**

#### Core Card Layout
Lines 236-261 - Card container with hover states
```typescript
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '4px',
    backgroundColor: isHighlighted ? `${highlightColor}15` : 'transparent',
    border: isHighlighted ? `1px solid ${highlightColor}40` : '1px solid transparent',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  }}
  onClick={handleOpenRepository} // Modified: emit event instead
  onMouseEnter={...}
  onMouseLeave={...}
>
```

#### Repository Avatar
Lines 262-278 - Owner avatar display
```typescript
<RepositoryAvatar
  customAvatarUrl={avatarUrl}
  size={32}
  type="owner"
  fallbackIcon={<div>{entry.name[0]?.toUpperCase() || '?'}</div>}
/>
```

**Note:** Need to check if `RepositoryAvatar` component is available or create simple avatar fallback.

#### Repository Info Section
Lines 281-376 - Repository name, path, language, description
```typescript
<div style={{ flex: 1, minWidth: 0, ... }}>
  {/* Repository name */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span style={{ fontSize: theme.fontSizes[2], ... }}>
      {entry.name}
    </span>
  </div>

  {/* Copy path button */}
  <div onClick={handleCopyPath} style={{ ... }}>
    {copiedPath ? <Check size={12} /> : <Copy size={12} />}
    {entry.path}
  </div>

  {/* Language and description */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    {entry.github?.primaryLanguage && (
      <div>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getLanguageColor(...) }} />
        {entry.github.primaryLanguage}
      </div>
    )}
    {entry.github?.description && <span>{entry.github.description}</span>}
  </div>
</div>
```

#### Copy Path Handler
Lines 206-215 - Copy to clipboard functionality
```typescript
const handleCopyPath = async (e: React.MouseEvent) => {
  e.stopPropagation();
  try {
    await navigator.clipboard.writeText(entry.path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  } catch (err) {
    console.error('Failed to copy path:', err);
  }
};
```

**Modification:** Use `actions.copyToClipboard(entry.path)` instead of direct clipboard API.

#### Action Buttons Section (Simplified for v1.0)
Lines 378-588 - Action buttons

**Copy for v1.0:**
- ~~Location indicator~~ (not needed without workspace directory concept)
- ~~Move to workspace button~~ (not needed)
- **Open button** (lines 453-507) - **Modify to emit event**
- **Remove button** (lines 509-553) - **Keep as-is**
- ~~Delete Alexandria entry button~~ (defer to v2.0)

**Open Button - Modified:**
```typescript
const handleOpenRepository = (e?: React.MouseEvent) => {
  if (e) e.stopPropagation();
  // Emit event instead of calling WindowService
  events.emit('repository:opened', {
    repositoryId: repository.id,
    repository: repository
  });
};

// Button UI - keep the same
<button
  type="button"
  onClick={handleOpenRepository}
  title="Open repository"
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    gap: '4px',
    borderRadius: '4px',
    border: `1px solid ${theme.colors.success}`,
    backgroundColor: `${theme.colors.success}15`,
    color: theme.colors.success,
    ...
  }}
>
  <FolderOpen size={12} />
  Open
</button>
```

**Remove Button - Keep as-is but use panel actions:**
```typescript
const handleRemoveFromWorkspace = async (e: React.MouseEvent) => {
  e.stopPropagation();

  if (!workspace?.id) return;

  if (!confirm(`Remove ${repository.name} from workspace "${workspace.name}"?...`)) {
    return;
  }

  try {
    setIsRemoving(true);
    await actions.removeRepositoryFromWorkspace(repository.id, workspace.id);
  } catch (error) {
    console.error('Failed to remove repository:', error);
    alert(`Failed to remove: ${error.message}`);
  } finally {
    setIsRemoving(false);
  }
};
```

### 3. Language Colors Utility

**File:** `/Users/griever/Developer/desktop-app/electron-app/src/renderer/panels/components/LocalProjectCard.tsx`

**Copy directly:** Lines 601-625 - `getLanguageColor()` function
```typescript
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f7df1e',
    Python: '#3776ab',
    Java: '#b07219',
    Go: '#00add8',
    Rust: '#dea584',
    Ruby: '#cc342d',
    PHP: '#777bb4',
    'C++': '#00599c',
    C: '#555555',
    'C#': '#239120',
    Swift: '#fa7343',
    Kotlin: '#7f52ff',
    Dart: '#0175c2',
    Vue: '#4fc08d',
    HTML: '#e34c26',
    CSS: '#1572b6',
    Shell: '#89e051',
    PowerShell: '#012456',
  };
  return colors[language] || '#6e7681';
}
```

Place in: `src/utils/languageColors.ts`

### 4. Animations

**File:** `/Users/griever/Developer/desktop-app/electron-app/src/renderer/panels/components/LocalProjectCard.tsx`

**Copy:** Lines 14-28 - Spin animation for loading states
```typescript
if (typeof document !== 'undefined') {
  const styleId = 'local-project-card-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}
```

Or use CSS-in-JS alternative with `@keyframes` in styled components.

### 5. Theme Usage Patterns

**Copy these patterns directly:**

```typescript
// Import
import { useTheme } from '@a24z/industry-theme';

// Usage
const { theme } = useTheme();

// Common styles
backgroundColor: theme.colors.backgroundSecondary
color: theme.colors.text
fontSize: `${theme.fontSizes[2]}px`
fontWeight: theme.fontWeights.semibold
fontFamily: theme.fonts.body
borderRadius: '4px'
transition: 'all 0.15s ease'

// Hover states
onMouseEnter={(e) => {
  e.currentTarget.style.backgroundColor = theme.colors.backgroundTertiary;
}}
onMouseLeave={(e) => {
  e.currentTarget.style.backgroundColor = 'transparent';
}}
```

### 6. Icons from Lucide React

**Already in use, same imports:**
```typescript
import {
  Folder,        // Empty state
  Home,          // Workspace home directory
  X,             // Remove buttons
  Copy,          // Copy path
  Check,         // Copied confirmation
  FolderOpen,    // Open repository
  Loader2,       // Loading states
} from 'lucide-react';
```

---

## Implementation Strategy: Copy First, Adapt Second

### Step 1: Copy Base Structures
1. Copy `WorkspaceEntriesPanel.tsx` → `WorkspaceRepositoriesPanel.tsx`
2. Copy `LocalProjectCard.tsx` → `RepositoryCard.tsx`
3. Copy `getLanguageColor()` → `src/utils/languageColors.ts`

### Step 2: Remove Desktop-Specific Code
From **WorkspaceRepositoriesPanel:**
- Remove IPC service imports (`WorkspaceService`, `FileSystemService`)
- Remove "Add repository" button and modal
- Remove home directory editing (keep display only, make read-only)
- Remove event subscriptions (replace with reactive data from context)

From **RepositoryCard:**
- Remove `WindowService` and window state tracking
- Remove `WorkspaceService` imports
- Remove `AlexandriaService` import
- Remove location indicator logic
- Remove "Move to workspace" button
- Remove "Delete entry" button (defer to v2.0)
- Remove `useSelectedRepository` context (README selection not needed)

### Step 3: Adapt to Panel Framework
**WorkspaceRepositoriesPanel:**
```typescript
// Change from props to panel props
interface WorkspaceEntriesPanelProps {
  selectedWorkspace?: Workspace | null;
}
// To:
const WorkspaceRepositoriesPanel: React.FC<PanelComponentProps> = ({
  context,
  actions,
  events
}) => {
  const workspace = context.data.workspace;
  const repositories = context.data.workspaceRepositories;
  const isLoading = context.isSliceLoading('workspace') ||
                    context.isSliceLoading('workspaceRepositories');

  // Remove all useEffect data fetching
  // Data comes from context automatically
}
```

**RepositoryCard:**
```typescript
// Change handler to emit event
const handleOpenRepository = (e?: React.MouseEvent) => {
  if (e) e.stopPropagation();
  events.emit('repository:opened', {
    repositoryId: repository.id,
    repository: repository
  });
};

// Use panel actions
const handleRemoveFromWorkspace = async (e: React.MouseEvent) => {
  e.stopPropagation();
  await actions.removeRepositoryFromWorkspace(repository.id, workspace.id);
};

const handleCopyPath = async (e: React.MouseEvent) => {
  e.stopPropagation();
  await actions.copyToClipboard(repository.path);
  setCopiedPath(true);
  setTimeout(() => setCopiedPath(false), 2000);
};
```

### Step 4: Simplify State Management
Remove complex state management:
- No window state tracking
- No location checking
- No workspace membership subscriptions (data comes from slices)
- Keep only UI state: `copiedPath`, `isRemoving`

### Step 5: Use Shared Types from core-library
Import types directly - no mapping needed:
```typescript
// Same imports as desktop app - types are identical
import type { Workspace, WorkspaceMembership } from '@a24z/core-library';
import type { AlexandriaEntry } from '@a24z/core-library';

// That's it! Use these types directly in your components
// Workspace.suggestedClonePath is the home directory
// AlexandriaEntry is the repository with local path
```

### Estimated Code Reuse
- **90%** of UI styles and layout can be copied directly
- **80%** of component structure remains the same
- **60%** of handlers need modification (remove IPC, use panel actions/events)
- **100%** of visual design patterns are reusable
- **100%** of theme integration is identical

---

**Document Version:** 1.2 (Refined MVP Scope)
**Last Updated:** 2025-11-14
**Author:** Claude Code
**Status:** Draft - Awaiting Review

---

## Changelog

**v1.1** - Removed WorkspaceManagementPanel to simplify scope
- Focus on WorkspaceRepositoriesPanel and RepositoryCard only
- Workspace selection/management handled by host application
- Reduced required actions to repository membership only
- Simplified event system
- Updated implementation phases

**v1.2** - Answered open questions and refined scope
- Workspace context provided via data slice
- Removed "Add repository" feature from v1.0 (deferred to v2.0)
- Clarified reactive data pattern (no manual fetching)
- Removed git status data requirement
- Confirmed `@a24z/industry-theme` available on NPM
- Data slices updated by host, panel reacts to changes
- Simplified required actions (only remove, open, copyToClipboard)
- Opening repositories fires `repository:opened` event (host handles navigation)
- Confirmed using `@a24z/core-library` for types (Workspace, AlexandriaEntry)
