import type { Meta, StoryObj } from '@storybook/react';
import { WorkspaceRepositoriesPanel } from './WorkspaceRepositoriesPanel';
import { createPanelContext, createDataSlice } from '@principal-ade/panel-framework-core';
import type {
  PanelComponentProps,
  PanelActions,
  PanelEventEmitter,
  PanelEvent,
  Workspace,
  AlexandriaEntry,
} from '../types';

// Mock workspace
const mockWorkspace: Workspace = {
  id: 'workspace-1',
  name: 'Active Projects',
  description: 'Currently active development projects',
  createdAt: Date.now() - 86400000 * 30,
  updatedAt: Date.now(),
  suggestedClonePath: '/Users/developer/workspaces/active',
};

// Mock repositories
const mockRepositories: AlexandriaEntry[] = [
  {
    name: 'alexandria-workspace-panel',
    path: '/Users/developer/projects/alexandria-workspace-panel' as any,
    remoteUrl: 'https://github.com/a24z-ai/alexandria-workspace-panel',
    registeredAt: new Date().toISOString(),
    hasViews: true,
    viewCount: 3,
    views: [],
    github: {
      id: 'a24z-ai/alexandria-workspace-panel',
      owner: 'a24z-ai',
      name: 'alexandria-workspace-panel',
      description:
        'Workspace and repository management panel for Panel Framework V2',
      stars: 42,
      primaryLanguage: 'TypeScript',
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    name: 'data-pipeline',
    path: '/Users/developer/projects/data-pipeline' as any,
    remoteUrl: 'https://github.com/company/data-pipeline',
    registeredAt: new Date().toISOString(),
    hasViews: false,
    viewCount: 0,
    views: [],
    github: {
      id: 'company/data-pipeline',
      owner: 'company',
      name: 'data-pipeline',
      description: 'ETL pipeline for processing large datasets',
      stars: 128,
      primaryLanguage: 'Python',
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    name: 'fast-parser',
    path: '/Users/developer/projects/fast-parser' as any,
    remoteUrl: 'https://github.com/rustlang/fast-parser',
    registeredAt: new Date().toISOString(),
    hasViews: true,
    viewCount: 1,
    views: [],
    github: {
      id: 'rustlang/fast-parser',
      owner: 'rustlang',
      name: 'fast-parser',
      description: 'High-performance parser written in Rust',
      stars: 892,
      primaryLanguage: 'Rust',
      lastUpdated: new Date().toISOString(),
    },
  },
];

// Mock actions
const mockActions: PanelActions = {
  openFile: (filePath: string) => {
    console.log('Open file:', filePath);
  },
  navigateToPanel: (panelId: string) => {
    console.log('Navigate to panel:', panelId);
  },
  notifyPanels: <T,>(event: PanelEvent<T>) => {
    console.log('Notify panels:', event);
  },
};

// Mock events
const mockEvents: PanelEventEmitter = {
  emit: <T,>(event: PanelEvent<T>) => {
    console.log('Emit event:', event);
  },
  on: <T,>(_type: string, _handler: (event: PanelEvent<T>) => void) => {
    console.log('Subscribe to event:', _type);
    return () => console.log('Unsubscribe from event:', _type);
  },
  off: <T,>(_type: string, _handler: (event: PanelEvent<T>) => void) => {
    console.log('Unsubscribe from event:', _type);
  },
};

const meta: Meta<typeof WorkspaceRepositoriesPanel> = {
  title: 'Panels/WorkspaceRepositoriesPanel',
  component: WorkspaceRepositoriesPanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WorkspaceRepositoriesPanel>;

export const Default: Story = {
  args: {
    context: createPanelContext(
      {
        type: 'workspace',
        workspace: { name: mockWorkspace.name, path: mockWorkspace.suggestedClonePath || '' },
      },
      [
        createDataSlice<Workspace>('workspace', 'workspace', mockWorkspace),
        createDataSlice<AlexandriaEntry[]>('workspaceRepositories', 'workspace', mockRepositories),
      ]
    ),
    actions: mockActions,
    events: mockEvents,
  } as PanelComponentProps,
};

export const NoWorkspaceSelected: Story = {
  args: {
    context: createPanelContext(
      {
        type: 'workspace',
      },
      [
        createDataSlice<Workspace>('workspace', 'workspace', null),
        createDataSlice<AlexandriaEntry[]>('workspaceRepositories', 'workspace', []),
      ]
    ),
    actions: mockActions,
    events: mockEvents,
  } as PanelComponentProps,
};

export const EmptyWorkspace: Story = {
  args: {
    context: createPanelContext(
      {
        type: 'workspace',
        workspace: { name: mockWorkspace.name, path: mockWorkspace.suggestedClonePath || '' },
      },
      [
        createDataSlice<Workspace>('workspace', 'workspace', mockWorkspace),
        createDataSlice<AlexandriaEntry[]>('workspaceRepositories', 'workspace', []),
      ]
    ),
    actions: mockActions,
    events: mockEvents,
  } as PanelComponentProps,
};

export const Loading: Story = {
  args: {
    context: createPanelContext(
      {
        type: 'workspace',
        workspace: { name: mockWorkspace.name, path: mockWorkspace.suggestedClonePath || '' },
      },
      [
        createDataSlice<Workspace>('workspace', 'workspace', mockWorkspace, { loading: true }),
        createDataSlice<AlexandriaEntry[]>('workspaceRepositories', 'workspace', [], { loading: true }),
      ]
    ),
    actions: mockActions,
    events: mockEvents,
  } as PanelComponentProps,
};

export const WorkspaceWithoutHomeDirectory: Story = {
  args: {
    context: createPanelContext(
      {
        type: 'workspace',
        workspace: { name: mockWorkspace.name, path: '' },
      },
      [
        createDataSlice<Workspace>('workspace', 'workspace', {
          ...mockWorkspace,
          suggestedClonePath: undefined,
        }),
        createDataSlice<AlexandriaEntry[]>('workspaceRepositories', 'workspace', mockRepositories),
      ]
    ),
    actions: mockActions,
    events: mockEvents,
  } as PanelComponentProps,
};

export const ManyRepositories: Story = {
  args: {
    context: createPanelContext(
      {
        type: 'workspace',
        workspace: { name: mockWorkspace.name, path: mockWorkspace.suggestedClonePath || '' },
      },
      [
        createDataSlice<Workspace>('workspace', 'workspace', mockWorkspace),
        createDataSlice<AlexandriaEntry[]>('workspaceRepositories', 'workspace', [
          ...mockRepositories,
          {
            name: 'api-gateway',
            path: '/Users/developer/projects/api-gateway' as any,
            remoteUrl: 'https://github.com/company/api-gateway',
            registeredAt: new Date().toISOString(),
            hasViews: false,
            viewCount: 0,
            views: [],
            github: {
              id: 'company/api-gateway',
              owner: 'company',
              name: 'api-gateway',
              description: 'Microservices API gateway',
              stars: 56,
              primaryLanguage: 'Go',
              lastUpdated: new Date().toISOString(),
            },
          },
          {
            name: 'web-app',
            path: '/Users/developer/projects/web-app' as any,
            remoteUrl: 'https://github.com/company/web-app',
            registeredAt: new Date().toISOString(),
            hasViews: true,
            viewCount: 5,
            views: [],
            github: {
              id: 'company/web-app',
              owner: 'company',
              name: 'web-app',
              description: 'Main web application frontend',
              stars: 203,
              primaryLanguage: 'JavaScript',
              lastUpdated: new Date().toISOString(),
            },
          },
          {
            name: 'mobile-app',
            path: '/Users/developer/projects/mobile-app' as any,
            remoteUrl: 'https://github.com/company/mobile-app',
            registeredAt: new Date().toISOString(),
            hasViews: false,
            viewCount: 0,
            views: [],
            github: {
              id: 'company/mobile-app',
              owner: 'company',
              name: 'mobile-app',
              description: 'Cross-platform mobile application',
              stars: 78,
              primaryLanguage: 'Dart',
              lastUpdated: new Date().toISOString(),
            },
          },
        ]),
      ]
    ),
    actions: mockActions,
    events: mockEvents,
  } as PanelComponentProps,
};
