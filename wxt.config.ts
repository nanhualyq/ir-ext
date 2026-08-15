import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/auto-icons', '@wxt-dev/module-react'],
  manifestVersion: 3,
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    permissions: ['tabs', 'bookmarks', 'storage', 'notifications', 'alarms'],
    browser_specific_settings: {
      gecko: {
        id: 'ir-ext@lyq.one',
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+I',
        },
        description: 'Open the extension popup',
      },
    },
  },
});
