/**
 * Alexandria Workspace Panel - Package Entry Point
 *
 * This file exports the panels array that will be consumed by the panel framework.
 */

import { WorkspaceRepositoriesPanel } from './panels/WorkspaceRepositoriesPanel';
import type { PanelDefinition, PanelContextValue } from './types';

/**
 * Exported panels array
 * This is the main export that the framework will import
 */
export const panels: PanelDefinition[] = [
  {
    metadata: {
      id: 'a24z.workspace-repositories',
      name: 'Workspace Repositories',
      icon: '📁',
      version: '1.0.0',
      author: 'a24z',
      description: 'Workspace and repository management panel for Panel Framework V2',
      slices: ['workspace', 'workspaceRepositories'],
    },
    component: WorkspaceRepositoriesPanel,

    // Optional: Called when this specific panel is mounted
    onMount: async (context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('[Workspace Repositories Panel] Mounted');
      // eslint-disable-next-line no-console
      console.log('[Workspace Repositories Panel] Current scope:', context.currentScope.type);
    },

    // Optional: Called when this specific panel is unmounted
    onUnmount: async (_context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('[Workspace Repositories Panel] Unmounting');
    },
  },
];

/**
 * Optional: Called once when the entire package is loaded.
 */
export const onPackageLoad = async () => {
  // eslint-disable-next-line no-console
  console.log('[Alexandria Workspace Panel Package] Loaded');
};

/**
 * Optional: Called once when the package is unloaded.
 */
export const onPackageUnload = async () => {
  // eslint-disable-next-line no-console
  console.log('[Alexandria Workspace Panel Package] Unloading');
};
