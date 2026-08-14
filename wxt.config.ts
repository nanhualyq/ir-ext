import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    permissions: ['tabs', 'bookmarks', 'storage'],
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
