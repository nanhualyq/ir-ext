import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    permissions: [
      // '<all_urls>',
      'activeTab',
      'bookmarks',
      'tabs'
    ],
    "applications": {
      "gecko": {
        "id": "ir-ext@lyq.one"
      }
    },
    "commands": {
      "_execute_browser_action": {
        "suggested_key": {
          "default": "Alt+I"
        }
      }
    }

  }
});
