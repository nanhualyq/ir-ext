<template>
  <main>
    <q-list bordered dense>
      <q-item tag="label" v-ripple v-for="b in hitBookmarks" :key="b.id" tabindex="-1">
        <q-item-section avatar>
          <q-radio v-model="selectedBookmark" :val="b" />
        </q-item-section>
        <q-item-section>
          <a :href="b.url + ''" target="_blank" tabindex="-1">{{ b.title }}</a>
        </q-item-section>
      </q-item>
    </q-list>
    <q-btn-group v-if="selectedBookmark">
      <q-btn color="primary" icon="check" label="Update" @click="replaceBookmark" accesskey="u" />
      <q-btn label="Prev" icon="arrow_back" accesskey="p" @click="gotoSibling(-1)" />
      <q-btn label="Next" icon="arrow_forward" accesskey="n" @click="gotoSibling(1)" />
      <q-btn label="ScrollLast" icon="unfold_more_double" accesskey="s" @click="scrollLast" />
    </q-btn-group>
  </main>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { onMounted, ref } from 'vue';

const $q = useQuasar()
const hitBookmarks = ref<chrome.bookmarks.BookmarkTreeNode[]>([])
const selectedBookmark = ref<chrome.bookmarks.BookmarkTreeNode>()
const currentTab = ref<chrome.tabs.Tab>()

function assert(conn: unknown, message: string) {
  if (!conn) {
    throw new Error(message)
  }
}

onMounted(async () => {
  currentTab.value = await getCurrentTab()
  hitBookmarks.value = await setHitBookmarks()
  assert(hitBookmarks.value.length, 'no bookmarks found')
  if (hitBookmarks.value.length === 1) {
    selectedBookmark.value = hitBookmarks.value[0]
  }
})

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  return tab;
}
async function setHitBookmarks() {
  const tab = currentTab.value!
  assert(tab, 'no current tab')
  const activeUrl = new URL(tab.url || '')
  const keywords = [
    activeUrl.href,
    tab.title,
    tab.title?.replace(/___lastText=.+$/, '')
  ]
  const searchParams = new URLSearchParams(activeUrl.search)
  activeUrl.search = ''
  activeUrl.hash = ''
  while (activeUrl.pathname.match(/^\/[^/]+/)) {
    activeUrl.pathname = activeUrl.pathname.replace(/\/[^/]*$/, "");
    keywords.push(activeUrl.href)
  }
  for (const [key, value] of searchParams.entries()) {
    keywords.push(`${key}=${value}`)
  }
  for (const keyword of keywords) {
    if (!keyword?.trim()) {
      continue
    }
    const b = await chrome.bookmarks.search(keyword)
    if (b.length) {
      return b
    }
  }
  return []
}
async function gotoSibling(offset: number) {
  const siblings = await chrome.bookmarks.getChildren(
    selectedBookmark.value!.parentId || '',
  )
  if (siblings.length <= 1) {
    return
  }
  let newIndex = selectedBookmark.value!.index || 0
  while (true) {
    newIndex += offset
    if (newIndex === -1) {
      newIndex = siblings.length - 1
    }
    const newMarkbook = siblings[newIndex % siblings.length]!;
    const isFolder = !!newMarkbook.children || !newMarkbook.url
    const isSeparator = newMarkbook.url === 'data:'
    if (isFolder || isSeparator) {
      continue
    }
    await chrome.tabs.update(currentTab.value!.id!, { url: newMarkbook.url });
    window.close();
    break
  }
}
async function replaceBookmark() {
  const pageInfo = await new Promise<chrome.bookmarks.BookmarkChangesArg>((resolve, reject) => {
    chrome.tabs.sendMessage(currentTab.value!.id!, { action: 'getPageInfo' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(response)
      }
    })
  })
  try {
    await chrome.bookmarks.update(selectedBookmark.value!.id, pageInfo);
  } catch (error) {
    $q.notify({
      type: 'error',
      message: String(error)
    })
    return
  }
  $q.notify({
    type: 'success',
    message: 'Updated!'
  })
}
function scrollLast() {
  void chrome.tabs.sendMessage(currentTab.value!.id!, { action: 'scrollLastText' })
}
</script>
