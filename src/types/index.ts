/**
 * Panel Framework types
 * Re-exports framework types and adds workspace-specific types
 */

// Re-export framework types
export type {
  PanelContextValue,
  PanelEventEmitter,
  PanelEvent,
  PanelEventType,
  PanelDefinition,
  PanelMetadata,
  PanelLifecycleHooks,
  DataSlice,
  WorkspaceMetadata,
  RepositoryMetadata,
  ActiveFileSlice,
  FileTreeSource,
} from '@principal-ade/panel-framework-core';

// Import base types for extension
import type {
  PanelActions as FrameworkPanelActions,
  PanelComponentProps as FrameworkPanelComponentProps,
} from '@principal-ade/panel-framework-core';

/**
 * Extended PanelActions with workspace-specific actions
 */
export interface PanelActions extends FrameworkPanelActions {
  /** Remove a repository from a workspace */
  removeRepositoryFromWorkspace?(repositoryId: string, workspaceId: string): Promise<void>;
  /** Copy text to clipboard */
  copyToClipboard?(text: string): Promise<void>;
  /** Check if repository is in workspace directory */
  isRepositoryInWorkspaceDirectory?(repository: AlexandriaEntry, workspaceId: string): Promise<boolean | null>;
  /** Move repository to workspace directory */
  moveRepositoryToWorkspaceDirectory?(repository: AlexandriaEntry, workspaceId: string): Promise<string>;
}

/**
 * Panel component props with our extended actions
 */
export interface PanelComponentProps extends Omit<FrameworkPanelComponentProps, 'actions'> {
  actions: PanelActions;
}

// Import types from core-library
import type {
  Workspace,
  WorkspaceMembership,
  AlexandriaEntry,
  GithubRepository,
} from '@a24z/core-library';

// Re-export core-library types
export type { Workspace, WorkspaceMembership, AlexandriaEntry, GithubRepository };

/**
 * Repository selected event payload
 * Emitted when a repository card is clicked for preview/context purposes
 */
export interface RepositorySelectedPayload {
  repositoryId: string;
  repository: AlexandriaEntry;
  repositoryPath: string;
}

/**
 * Repository opened event payload
 * Emitted when explicitly opening a repository (e.g., via Open button)
 */
export interface RepositoryOpenedPayload {
  repositoryId: string;
  repository: AlexandriaEntry;
}

/**
 * Workspace changed event payload
 */
export interface WorkspaceChangedPayload {
  workspaceId: string;
}

/**
 * Workspace membership changed event payload
 */
export interface WorkspaceMembershipChangedPayload {
  workspaceId: string;
  repositoryId: string;
  action: 'added' | 'removed';
}
