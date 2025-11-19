import React, { useState, useEffect } from 'react';
import { useTheme } from '@a24z/industry-theme';
import { FolderOpen, X, Copy, Check, Loader2, Home, AlertTriangle, MoveRight } from 'lucide-react';
import type { AlexandriaEntry, Workspace } from '@a24z/core-library';
import type { PanelActions, PanelEventEmitter } from '../types';
import { getLanguageColor } from '../utils/languageColors';

// Add spin animation styles to document if not already present
if (typeof document !== 'undefined') {
  const styleId = 'repository-card-animations';
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

export interface RepositoryCardProps {
  repository: AlexandriaEntry;
  workspace?: Workspace | null;
  actions: PanelActions;
  events: PanelEventEmitter;
}

export const RepositoryCard: React.FC<RepositoryCardProps> = ({
  repository,
  workspace,
  actions,
  events,
}) => {
  const { theme } = useTheme();
  const [isRemoving, setIsRemoving] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [isInWorkspaceDirectory, setIsInWorkspaceDirectory] = useState<boolean | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Check if repository is in workspace directory
  useEffect(() => {
    const checkLocation = async () => {
      if (!workspace?.id || !actions.isRepositoryInWorkspaceDirectory) {
        setIsInWorkspaceDirectory(null);
        return;
      }

      try {
        const result = await actions.isRepositoryInWorkspaceDirectory(repository, workspace.id);
        setIsInWorkspaceDirectory(result);
      } catch (error) {
        console.error('Failed to check repository location:', error);
        setIsInWorkspaceDirectory(null);
      }
    };

    checkLocation();
  }, [repository, workspace, actions]);

  const handleSelectRepository = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Emit repository:selected event for preview/context purposes
    events.emit({
      type: 'repository:selected',
      source: 'workspace-repositories-panel',
      timestamp: Date.now(),
      payload: {
        repositoryId: repository.github?.id || repository.name,
        repository: repository,
        repositoryPath: repository.path,
      },
    });
  };

  const handleOpenRepository = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Emit repository:opened event for opening repository dashboard
    events.emit({
      type: 'repository:opened',
      source: 'workspace-repositories-panel',
      timestamp: Date.now(),
      payload: {
        repositoryId: repository.github?.id || repository.name,
        repository: repository,
      },
    });
  };

  const handleRemoveFromWorkspace = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!workspace?.id) return;

    if (
      !confirm(
        `Remove ${repository.name} from workspace "${workspace.name}"?\n\nThis will not delete any files, only remove the repository from this workspace.`
      )
    ) {
      return;
    }

    try {
      setIsRemoving(true);
      const repositoryId = repository.github?.id || repository.name;
      await actions.removeRepositoryFromWorkspace?.(repositoryId, workspace.id);
    } catch (error) {
      console.error('Failed to remove repository from workspace:', error);
      alert(
        `Failed to remove repository: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCopyPath = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await actions.copyToClipboard?.(repository.path);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    } catch (err) {
      console.error('Failed to copy path:', err);
    }
  };

  const handleMoveToWorkspace = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!workspace?.id || !actions.moveRepositoryToWorkspaceDirectory) return;

    if (
      !confirm(
        `Move ${repository.name} to ${workspace.suggestedClonePath}?\n\nThis will move all files to the workspace directory.`
      )
    ) {
      return;
    }

    try {
      setIsMoving(true);
      await actions.moveRepositoryToWorkspaceDirectory(repository, workspace.id);
      setIsInWorkspaceDirectory(true);
    } catch (error) {
      console.error('Failed to move repository:', error);
      alert(
        `Failed to move repository: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsMoving(false);
    }
  };

  // Get avatar URL - use GitHub owner if available
  const avatarUrl = repository.github?.owner
    ? `https://github.com/${repository.github.owner}.png`
    : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '4px',
        backgroundColor: 'transparent',
        border: '1px solid transparent',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
      }}
      onClick={handleSelectRepository}
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor =
          theme.colors.backgroundTertiary || theme.colors.backgroundSecondary;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Owner avatar or placeholder */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          flexShrink: 0,
          overflow: 'hidden',
          backgroundColor: theme.colors.backgroundTertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={repository.github?.owner || repository.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              color: theme.colors.textSecondary,
              fontSize: `${theme.fontSizes[1]}px`,
              fontWeight: theme.fontWeights.semibold,
            }}
          >
            {repository.name[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Repository name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: `${theme.fontSizes[2]}px`,
              fontWeight: theme.fontWeights.medium,
              color: theme.colors.text,
            }}
          >
            {repository.name}
          </span>
        </div>

        {/* Copy path button */}
        <div
          onClick={handleCopyPath}
          style={{
            fontSize: `${theme.fontSizes[0]}px`,
            color: copiedPath
              ? theme.colors.success || '#10b981'
              : theme.colors.textTertiary || theme.colors.textSecondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.15s ease',
          }}
          title={copiedPath ? 'Copied!' : `Click to copy: ${repository.path}`}
          onMouseEnter={(event) => {
            if (!copiedPath) {
              event.currentTarget.style.color = theme.colors.textSecondary;
            }
          }}
          onMouseLeave={(event) => {
            if (!copiedPath) {
              event.currentTarget.style.color =
                theme.colors.textTertiary || theme.colors.textSecondary;
            }
          }}
        >
          {copiedPath ? <Check size={12} /> : <Copy size={12} />}
          {repository.path}
        </div>

        {/* Language and description */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: `${theme.fontSizes[0]}px`,
            color: theme.colors.textSecondary,
          }}
        >
          {repository.github?.primaryLanguage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: getLanguageColor(
                    repository.github.primaryLanguage
                  ),
                }}
              />
              {repository.github.primaryLanguage}
            </div>
          )}
          {repository.github?.description && (
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {repository.github.description}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          flexShrink: 0,
          alignItems: 'center',
        }}
      >
        {/* Location indicator */}
        {workspace && workspace.suggestedClonePath && isInWorkspaceDirectory !== null && (
          <div
            title={
              isInWorkspaceDirectory
                ? `In workspace directory: ${workspace.suggestedClonePath}`
                : 'Outside workspace directory'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: isInWorkspaceDirectory
                ? `${theme.colors.success || '#10b981'}15`
                : `${theme.colors.warning || '#f59e0b'}15`,
              color: isInWorkspaceDirectory
                ? theme.colors.success || '#10b981'
                : theme.colors.warning || '#f59e0b',
            }}
          >
            {isInWorkspaceDirectory ? <Home size={14} /> : <AlertTriangle size={14} />}
          </div>
        )}

        {/* Move to workspace button */}
        {workspace && workspace.suggestedClonePath && isInWorkspaceDirectory === false && (
          <button
            type="button"
            onClick={handleMoveToWorkspace}
            disabled={isMoving}
            title={`Move to ${workspace.suggestedClonePath}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 10px',
              gap: '4px',
              borderRadius: '4px',
              border: `1px solid ${theme.colors.primary || '#3b82f6'}`,
              backgroundColor: `${theme.colors.primary || '#3b82f6'}15`,
              color: theme.colors.primary || '#3b82f6',
              fontSize: `${theme.fontSizes[0]}px`,
              fontWeight: theme.fontWeights.medium,
              cursor: isMoving ? 'wait' : 'pointer',
              opacity: isMoving ? 0.6 : 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(event) => {
              if (!isMoving) {
                event.currentTarget.style.backgroundColor = `${theme.colors.primary || '#3b82f6'}25`;
              }
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = `${theme.colors.primary || '#3b82f6'}15`;
            }}
          >
            {isMoving ? (
              <Loader2
                size={12}
                style={{
                  animation: 'spin 1s linear infinite',
                }}
              />
            ) : (
              <MoveRight size={12} />
            )}
            {isMoving ? 'Moving...' : 'Move'}
          </button>
        )}

        {/* Open button */}
        <button
          type="button"
          onClick={handleOpenRepository}
          title="Open repository"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
            gap: '4px',
            borderRadius: '4px',
            border: `1px solid ${theme.colors.success || '#10b981'}`,
            backgroundColor: `${theme.colors.success || '#10b981'}15`,
            color: theme.colors.success || '#10b981',
            fontSize: `${theme.fontSizes[0]}px`,
            fontWeight: theme.fontWeights.medium,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = `${theme.colors.success || '#10b981'}25`;
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = `${theme.colors.success || '#10b981'}15`;
          }}
        >
          <FolderOpen size={12} />
          Open
        </button>

        {/* Remove from workspace button */}
        {workspace && (
          <button
            type="button"
            onClick={handleRemoveFromWorkspace}
            disabled={isRemoving}
            title={`Remove from workspace "${workspace.name}"`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              padding: 0,
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              color: theme.colors.textSecondary,
              cursor: isRemoving ? 'wait' : 'pointer',
              opacity: isRemoving ? 0.6 : 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(event) => {
              if (!isRemoving) {
                event.currentTarget.style.backgroundColor =
                  theme.colors.error || '#ef4444';
                event.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent';
              event.currentTarget.style.color = theme.colors.textSecondary;
            }}
          >
            {isRemoving ? (
              <Loader2
                size={14}
                style={{
                  animation: 'spin 1s linear infinite',
                }}
              />
            ) : (
              <X size={14} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
