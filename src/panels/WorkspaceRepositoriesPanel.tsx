import React, { useMemo } from 'react';
import { useTheme } from '@a24z/industry-theme';
import { Folder, Home } from 'lucide-react';
import type { PanelComponentProps, Workspace, AlexandriaEntry } from '../types';
import { RepositoryCard } from '../components/RepositoryCard';

export const WorkspaceRepositoriesPanel: React.FC<PanelComponentProps> = ({
  context,
  actions,
  events,
}) => {
  const { theme } = useTheme();

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
          {/* Left: Workspace name */}
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
          gap: '4px',
        }}
      >
        {/* Repository list */}
        {sortedRepositories.map((repository) => (
          <RepositoryCard
            key={repository.path}
            repository={repository}
            workspace={workspace}
            actions={actions}
            events={events}
          />
        ))}

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
      </div>
    </div>
  );
};
