import type { Meta, StoryObj } from '@storybook/react';
import { RepositoryCard } from './RepositoryCard';
import type {
  AlexandriaEntry,
  Workspace,
  PanelActions,
  PanelEventEmitter,
  PanelEvent,
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

// Mock repository with GitHub info
const mockRepository: AlexandriaEntry = {
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
    description: 'Workspace and repository management panel for Panel Framework V2',
    stars: 42,
    primaryLanguage: 'TypeScript',
    topics: ['panel-extension', 'workspace', 'alexandria'],
    license: 'MIT',
    lastUpdated: new Date().toISOString(),
  },
};

// Mock repository without GitHub info
const mockLocalRepository: AlexandriaEntry = {
  name: 'local-project',
  path: '/Users/developer/projects/local-project' as any,
  registeredAt: new Date().toISOString(),
  hasViews: false,
  viewCount: 0,
  views: [],
};

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

const meta: Meta<typeof RepositoryCard> = {
  title: 'Components/RepositoryCard',
  component: RepositoryCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RepositoryCard>;

export const Default: Story = {
  args: {
    repository: mockRepository,
    workspace: mockWorkspace,
    actions: mockActions,
    events: mockEvents,
  },
};

export const WithoutWorkspace: Story = {
  args: {
    repository: mockRepository,
    workspace: null,
    actions: mockActions,
    events: mockEvents,
  },
};

export const LocalRepository: Story = {
  args: {
    repository: mockLocalRepository,
    workspace: mockWorkspace,
    actions: mockActions,
    events: mockEvents,
  },
};

export const PythonProject: Story = {
  args: {
    repository: {
      ...mockRepository,
      name: 'data-pipeline',
      path: '/Users/developer/projects/data-pipeline' as any,
      github: {
        ...mockRepository.github!,
        id: 'company/data-pipeline',
        owner: 'company',
        name: 'data-pipeline',
        description: 'ETL pipeline for processing large datasets',
        primaryLanguage: 'Python',
        stars: 128,
      },
    },
    workspace: mockWorkspace,
    actions: mockActions,
    events: mockEvents,
  },
};

export const RustProject: Story = {
  args: {
    repository: {
      ...mockRepository,
      name: 'fast-parser',
      path: '/Users/developer/projects/fast-parser' as any,
      github: {
        ...mockRepository.github!,
        id: 'rustlang/fast-parser',
        owner: 'rustlang',
        name: 'fast-parser',
        description: 'High-performance parser written in Rust',
        primaryLanguage: 'Rust',
        stars: 892,
      },
    },
    workspace: mockWorkspace,
    actions: mockActions,
    events: mockEvents,
  },
};

export const LongDescription: Story = {
  args: {
    repository: {
      ...mockRepository,
      name: 'super-long-name-repository',
      path: '/Users/developer/very/deep/directory/structure/projects/super-long-name-repository' as any,
      github: {
        ...mockRepository.github!,
        name: 'super-long-name-repository',
        description:
          'This is a repository with a very long description that should be truncated when displayed in the card to prevent layout issues and maintain a clean interface.',
      },
    },
    workspace: mockWorkspace,
    actions: mockActions,
    events: mockEvents,
  },
};
