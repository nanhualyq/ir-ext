import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    version: '0.0.8',
    permissions: ["bookmarks"],
    browser_specific_settings: {
      gecko: {
        id: "ir-ext@lyq.one",
      },
    },
    commands: {
      _execute_browser_action: {
        suggested_key: {
          default: "Alt+I",
        },
      },
    },
  },
  modules: ["@wxt-dev/module-react"],
});
