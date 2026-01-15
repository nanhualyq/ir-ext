<template>
  <q-btn-group>
    <q-btn
      color="primary"
      icon="check"
      label="Update"
      @click="handleReplaceBookmark"
      accesskey="u"
    />
    <q-btn label="Prev" icon="arrow_back" accesskey="p" @click="handleGotoSibling(-1)" />
    <q-btn label="Next" icon="arrow_forward" accesskey="n" @click="handleGotoSibling(1)" />
    <q-btn label="ScrollLast" icon="unfold_more_double" accesskey="s" @click="handleScrollLast" />
  </q-btn-group>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { PropType } from 'vue';

const props = defineProps({
  bookmark: {
    type: Object as PropType<chrome.bookmarks.BookmarkTreeNode>,
    required: true,
  },
  currentTab: {
    type: Object as PropType<chrome.tabs.Tab>,
    required: true,
  },
});

const $q = useQuasar();

async function handleGotoSibling(offset: number) {
  const siblings = await chrome.bookmarks.getChildren(props.bookmark.parentId || '');
  if (siblings.length <= 1) {
    return;
  }
  let newIndex = props.bookmark.index || 0;
  while (true) {
    newIndex += offset;
    if (newIndex === -1) {
      newIndex = siblings.length - 1;
    }
    const newMarkbook = siblings[newIndex % siblings.length]!;
    const isFolder = !!newMarkbook.children || !newMarkbook.url;
    const isSeparator = newMarkbook.url === 'data:';
    if (isFolder || isSeparator) {
      continue;
    }
    await chrome.tabs.update(props.currentTab.id!, { url: newMarkbook.url });
    window.close();
    break;
  }
}

async function handleReplaceBookmark() {
  const pageInfo = await new Promise<chrome.bookmarks.BookmarkChangesArg>((resolve, reject) => {
    chrome.tabs.sendMessage(props.currentTab.id!, { action: 'getPageInfo' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
  try {
    await chrome.bookmarks.update(props.bookmark.id, pageInfo);
  } catch (error) {
    $q.notify({
      type: 'error',
      message: String(error),
    });
    return;
  }
  $q.notify({
    type: 'success',
    message: 'Updated!',
  });
}

function handleScrollLast() {
  void chrome.tabs.sendMessage(props.currentTab.id!, { action: 'scrollLastText' });
}
</script>
