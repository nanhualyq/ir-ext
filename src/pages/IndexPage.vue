<template>
  <main>
    <q-list bordered dense>
      <q-item tag="label" v-ripple v-for="b in hitBookmarks" :key="b.id" tabindex="-1">
        <q-item-section avatar>
          <q-radio v-model="selectedBookmark" :val="b" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            <a :href="b.url + ''" target="_blank" tabindex="-1">{{ b.title }}</a>
          </q-item-label>
          <q-item-label caption>{{ bookmarkPaths[b.id] || '' }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <template v-if="selectedBookmark">
      <action-buttons :bookmark="selectedBookmark!" :current-tab="currentTab!" />
      <async-actions :bookmark="selectedBookmark!" />
    </template>
    <no-bookmark />
  </main>
</template>

<script setup lang="ts">
import ActionButtons from 'src/components/ActionButtons.vue';
import AsyncActions from 'src/components/AsyncActions.vue';
import NoBookmark from 'src/components/NoBookmark.vue';
import { onMounted, ref } from 'vue';
const hitBookmarks = ref<chrome.bookmarks.BookmarkTreeNode[]>([]);
const selectedBookmark = ref<chrome.bookmarks.BookmarkTreeNode>();
const currentTab = ref<chrome.tabs.Tab>();
const bookmarkPaths = ref<Record<string, string>>({});

onMounted(async () => {
  currentTab.value = await getCurrentTab();
  hitBookmarks.value = await setHitBookmarks();

  const paths: Record<string, string> = {};
  for (const bookmark of hitBookmarks.value) {
    paths[bookmark.id] = await getBookmarkPath(bookmark);
  }
  bookmarkPaths.value = paths;

  if (hitBookmarks.value.length === 1) {
    selectedBookmark.value = hitBookmarks.value[0];
  }
});

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab;
}
async function setHitBookmarks() {
  const tab = currentTab.value!;
  const activeUrl = new URL(tab.url || '');
  const keywords = [activeUrl.href, tab.title, tab.title?.replace(/___lastText=.+$/, '')];
  const searchParams = new URLSearchParams(activeUrl.search);
  activeUrl.search = '';
  activeUrl.hash = '';
  while (activeUrl.pathname.match(/^\/[^/]+/)) {
    activeUrl.pathname = activeUrl.pathname.replace(/\/[^/]*$/, '');
    keywords.push(activeUrl.href);
  }
  for (const [key, value] of searchParams.entries()) {
    keywords.push(`${key}=${value}`);
  }
  for (const keyword of keywords) {
    if (!keyword?.trim()) {
      continue;
    }
    const b = await chrome.bookmarks.search(keyword);
    if (b.length) {
      return b;
    }
  }
  return [];
}

async function getBookmarkPath(bookmark: chrome.bookmarks.BookmarkTreeNode): Promise<string> {
  const pathParts: string[] = [];
  let current = bookmark;

  while (current.parentId) {
    const parent = await chrome.bookmarks.get(current.parentId);
    if (parent.length > 0 && parent[0]?.title) {
      pathParts.unshift(parent[0].title);
      current = parent[0]!;
    } else {
      break;
    }
  }

  return pathParts.join(' > ');
}
</script>
