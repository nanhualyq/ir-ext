<template>
  <div class="column q-pa-md full-height">
    <q-tree v-model:selected="selectedNode" :nodes="folderTree" node-key="value" label-key="label" default-expand-all
      no-connectors dense class="full-width q-mb-md" style="min-height: 200px" selected-color="primary" />
    <q-btn color="primary" label="Add Bookmark" :disable="!selectedNode" @click="addBookmark" accesskey="a" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';

interface FolderNode {
  label: string;
  value: string;
  children?: FolderNode[];
}

const $q = useQuasar();
const folderTree = ref<FolderNode[]>([]);
const selectedNode = ref<string | null>(null);
const currentTab = ref<chrome.tabs.Tab>();

onMounted(async () => {
  currentTab.value = await getCurrentTab();
  await loadFolders();
  const { lastFolderId } = await chrome.storage.sync.get('lastFolderId');
  if (lastFolderId) {
    selectedNode.value = lastFolderId;
  }
});

async function getCurrentTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab!;
}

async function loadFolders(): Promise<void> {
  const bookmarks = await chrome.bookmarks.getTree();
  const rootNode = bookmarks[0]!;
  if (rootNode.children) {
    folderTree.value = rootNode.children.flatMap((child) => extractFolders(child, 0));
  }
}

function extractFolders(node: chrome.bookmarks.BookmarkTreeNode, depth: number = 0): FolderNode[] {
  const nodes: FolderNode[] = [];
  if (node.children) {
    const prefix = '\u00A0\u00A0'.repeat(depth);
    nodes.push({
      label: `${prefix}${node.title}`,
      value: node.id,
      children: node.children.flatMap((child) => extractFolders(child, depth + 1)),
    });
  }
  return nodes;
}

async function addBookmark(): Promise<void> {
  const tab = currentTab.value!;
  const folderId = selectedNode.value!;

  try {
    await chrome.bookmarks.create({
      parentId: folderId,
      title: tab.title || 'Untitled',
      url: tab.url,
    });
    await chrome.storage.sync.set({ lastFolderId: folderId });
    $q.notify({
      type: 'success',
      message: 'Bookmark added!',
    });
    window.close();
  } catch (error) {
    $q.notify({
      type: 'error',
      message: String(error),
    });
  }
}
</script>

<style scoped>
.full-height {
  min-height: 300px;
}
</style>
