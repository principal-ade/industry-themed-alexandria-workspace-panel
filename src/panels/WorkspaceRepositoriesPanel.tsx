import React, { useMemo, useEffect } from 'react';
import { useTheme } from '@a24z/industry-theme';
import { Folder, Home, Pencil, AlertTriangle } from 'lucide-react';
import type { PanelComponentProps, Workspace, AlexandriaEntry } from '../types';
import { RepositoryCard } from '../components/RepositoryCard';

export const WorkspaceRepositoriesPanel: React.FC<PanelComponentProps> = ({
  context,
  actions,
  events,
}) => {
  const { theme } = useTheme();
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [repositoryLocations, setRepositoryLocations] = React.useState<Map<string, boolean>>(
    new Map()
  );

  // Get data from context using framework's getSlice pattern
  const workspaceSlice = context.getSlice<Workspace>('workspace');
  const repositoriesSlice = context.getSlice<AlexandriaEntry[]>('workspaceRepositories');

  const workspace = workspaceSlice?.data ?? null;
  const isLoading = workspaceSlice?.loading || repositoriesSlice?.loading || false;

  // Sort repositories alphabetically by name
  const sortedRepositories = useMemo(() => {
    const repos = repositoriesSlice?.data ?? [];
    return [...repos].sort((a, b) => a.name.localeCompare(b.name));
  }, [repositoriesSlice?.data]);

  // Check locations for all repositories
  useEffect(() => {
    const checkLocations = async () => {
      if (!workspace?.id || !actions.isRepositoryInWorkspaceDirectory || !sortedRepositories.length) {
        return;
      }

      const locationMap = new Map<string, boolean>();
      await Promise.all(
        sortedRepositories.map(async (repo) => {
          try {
            const isInWorkspace = await actions.isRepositoryInWorkspaceDirectory!(repo, workspace.id);
            if (isInWorkspace !== null) {
              locationMap.set(repo.path, isInWorkspace);
            }
          } catch (error) {
            console.error(`Failed to check location for ${repo.name}:`, error);
          }
        })
      );
      setRepositoryLocations(locationMap);
    };

    checkLocations();
  }, [workspace, sortedRepositories, actions]);

  // Group repositories by location
  const { repositoriesInWorkspace, repositoriesOutsideWorkspace } = useMemo(() => {
    const inWorkspace: AlexandriaEntry[] = [];
    const outsideWorkspace: AlexandriaEntry[] = [];

    sortedRepositories.forEach((repo) => {
      const isInWorkspace = repositoryLocations.get(repo.path);
      if (isInWorkspace === true) {
        inWorkspace.push(repo);
      } else if (isInWorkspace === false) {
        outsideWorkspace.push(repo);
      } else {
        // If we don't know the location yet, don't show it in either section
        // It will appear once the location check completes
      }
    });

    return { repositoriesInWorkspace: inWorkspace, repositoriesOutsideWorkspace: outsideWorkspace };
  }, [sortedRepositories, repositoryLocations]);

  const baseContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.colors.backgroundSecondary,
  };

  const contentContainerStyle: React.CSSProperties = {
    ...baseContainerStyle,
    padding: '16px',
    gap: '12px',
  };

  // No workspace selected
  if (!workspace) {
    return (
      <div style={baseContainerStyle}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              maxWidth: '360px',
            }}
          >
            <Folder
              size={48}
              style={{
                color: theme.colors.textSecondary,
                opacity: 0.5,
              }}
            />
            <div>
              <h3
                style={{
                  margin: '0 0 8px 0',
                  color: theme.colors.text,
                  fontSize: `${theme.fontSizes[3]}px`,
                  fontWeight: theme.fontWeights.semibold,
                  fontFamily: theme.fonts.body,
                }}
              >
                No Workspace Selected
              </h3>
              <p
                style={{
                  margin: 0,
                  color: theme.colors.textSecondary,
                  fontSize: `${theme.fontSizes[1]}px`,
                  fontFamily: theme.fonts.body,
                }}
              >
                Select a workspace to see its repositories.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div style={baseContainerStyle}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              maxWidth: '360px',
            }}
          >
            <h3
              style={{
                margin: 0,
                color: theme.colors.text,
                fontSize: `${theme.fontSizes[3]}px`,
                fontWeight: theme.fontWeights.semibold,
                fontFamily: theme.fonts.body,
              }}
            >
              Loading repositories...
            </h3>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <div style={contentContainerStyle}>
      {/* Workspace header */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '4px',
          }}
        >
          {/* Left: Workspace name with edit button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: `${theme.fontSizes[2]}px`,
                fontWeight: theme.fontWeights.semibold,
                color: theme.colors.text,
                fontFamily: theme.fonts.body,
              }}
            >
              {workspace.name}
            </h3>
            <button
              type="button"
              onClick={handleToggleEditMode}
              title={isEditMode ? 'Exit edit mode' : 'Edit workspace'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                padding: 0,
                borderRadius: '4px',
                border: 'none',
                backgroundColor: isEditMode
                  ? theme.colors.backgroundTertiary || theme.colors.backgroundSecondary
                  : 'transparent',
                color: isEditMode ? theme.colors.primary : theme.colors.textSecondary,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(event) => {
                if (!isEditMode) {
                  event.currentTarget.style.backgroundColor =
                    theme.colors.backgroundTertiary || theme.colors.backgroundSecondary;
                  event.currentTarget.style.color = theme.colors.text;
                }
              }}
              onMouseLeave={(event) => {
                if (!isEditMode) {
                  event.currentTarget.style.backgroundColor = 'transparent';
                  event.currentTarget.style.color = theme.colors.textSecondary;
                }
              }}
            >
              <Pencil size={14} />
            </button>
          </div>

          {/* Right: Home directory (read-only display) */}
          {workspace.suggestedClonePath && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: 0,
              }}
            >
              <Home
                size={14}
                style={{
                  color: theme.colors.textSecondary,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: `${theme.fontSizes[0]}px`,
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fonts.monospace,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={workspace.suggestedClonePath}
              >
                {workspace.suggestedClonePath}
              </span>
            </div>
          )}
        </div>

        {/* Workspace description */}
        {workspace.description && (
          <p
            style={{
              margin: 0,
              fontSize: `${theme.fontSizes[1]}px`,
              color: theme.colors.textSecondary,
              fontFamily: theme.fonts.body,
            }}
          >
            {workspace.description}
          </p>
        )}
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Empty state */}
        {sortedRepositories.length === 0 && !isLoading && (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: theme.colors.textSecondary,
            }}
          >
            <p style={{ margin: 0 }}>No repositories in this workspace.</p>
          </div>
        )}

        {/* Repositories in workspace directory */}
        {repositoriesInWorkspace.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                paddingBottom: '4px',
              }}
            >
              <Home
                size={14}
                style={{
                  color: theme.colors.success || '#10b981',
                  flexShrink: 0,
                }}
              />
              <h4
                style={{
                  margin: 0,
                  fontSize: `${theme.fontSizes[1]}px`,
                  fontWeight: theme.fontWeights.semibold,
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fonts.body,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                In Workspace Directory
              </h4>
              <span
                style={{
                  fontSize: `${theme.fontSizes[0]}px`,
                  color: theme.colors.textTertiary || theme.colors.textSecondary,
                  fontWeight: theme.fontWeights.medium,
                }}
              >
                {repositoriesInWorkspace.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {repositoriesInWorkspace.map((repository) => (
                <RepositoryCard
                  key={repository.path}
                  repository={repository}
                  workspace={workspace}
                  actions={actions}
                  events={events}
                  isEditMode={isEditMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Repositories outside workspace directory */}
        {repositoriesOutsideWorkspace.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                paddingBottom: '4px',
              }}
            >
              <AlertTriangle
                size={14}
                style={{
                  color: theme.colors.warning || '#f59e0b',
                  flexShrink: 0,
                }}
              />
              <h4
                style={{
                  margin: 0,
                  fontSize: `${theme.fontSizes[1]}px`,
                  fontWeight: theme.fontWeights.semibold,
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fonts.body,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Outside Workspace Directory
              </h4>
              <span
                style={{
                  fontSize: `${theme.fontSizes[0]}px`,
                  color: theme.colors.textTertiary || theme.colors.textSecondary,
                  fontWeight: theme.fontWeights.medium,
                }}
              >
                {repositoriesOutsideWorkspace.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {repositoriesOutsideWorkspace.map((repository) => (
                <RepositoryCard
                  key={repository.path}
                  repository={repository}
                  workspace={workspace}
                  actions={actions}
                  events={events}
                  isEditMode={isEditMode}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
