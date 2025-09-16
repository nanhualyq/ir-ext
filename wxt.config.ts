import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    version: '0.2.7',
    permissions: [
      'bookmarks',
      'activeTab', // 生产上没有这个，读不到当前tab的url和title
      // 'tabs'
    ],
    "browser_specific_settings": {
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
