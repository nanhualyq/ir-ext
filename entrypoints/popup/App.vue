<script lang="ts" setup>
import { sendMessage } from '../messaging'

const currentTab: Ref<Browser.tabs.Tab | null> = ref(null)
const hitBookmarks: Ref<Browser.bookmarks.BookmarkTreeNode[]> = ref([])
const targetBookmark: Ref<Browser.bookmarks.BookmarkTreeNode | null> = ref(null)

function assert(conn: any, message: string) {
    if (!conn) {
        throw new Error(message)
    }
}

onMounted(async () => {
    currentTab.value = await getCurrentTab()
    assert(currentTab.value, 'no current tab')
    hitBookmarks.value = await getHitBookmarks(currentTab.value)
    assert(hitBookmarks.value.length, 'no hit bookmarks')
    targetBookmark.value = hitBookmarks.value[0]
})

async function getCurrentTab() {
    const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true
    });
    return tab;
}
async function getHitBookmarks(tab: Browser.tabs.Tab) {
    const activeUrl = new URL(tab.url || '')
    const keywords = [
        activeUrl.href,
        tab.title
    ]
    while (activeUrl.pathname.match(/^\/[^/]+/)) {
        activeUrl.pathname = activeUrl.pathname.replace(/\/[^/]*$/, "");
        keywords.push(activeUrl.href)
    }

    for (const [key, value] of activeUrl.searchParams.entries()) {
        keywords.push(`${key}=${value}`)
    }
    for (const keyword of keywords) {
        if (!keyword?.trim()) {
            continue
        }
        const b = await browser.bookmarks.search(keyword)
        if (b.length) {
            return b
        }
    }
    return []
}
async function readSibling(offset: number) {
    const siblings = await browser.bookmarks.getChildren(
        targetBookmark.value!.parentId || '',
    )
    let newIndex = targetBookmark.value!.index || 0
    while (1) {
        newIndex += offset
        if (newIndex === -1) {
            newIndex = siblings.length - 1
        }
        const newMarkbook = siblings[newIndex % siblings.length];
        const isFolder = newMarkbook.children || !newMarkbook.url
        const isSeparator = newMarkbook.url === 'data:'
        if (isFolder || isSeparator) {
            continue
        }
        browser.tabs.update(currentTab.value?.id, { url: newMarkbook.url });
        window.close();
        break
    }
}
const updateResult = ref('')
async function replaceBookmark() {
    const { url, title } = await sendMessage('getPageInfo', undefined, currentTab.value?.id!)
    updateResult.value = ''
    try {
        await browser.bookmarks.update(targetBookmark.value!.id, {
            url,
            title,
        });
    } catch (error) {
        updateResult.value = `<span style="color: red;">${error}</span>`
        return
    }
    updateResult.value = '<span style="color: green;">Updated</span>'
}
</script>

<template>
    <p v-for="bookmark in hitBookmarks" :key="bookmark.id" class="ellipsis" style="max-width: 50rem;">
        <input type="radio" name="targetBookmark" :value="bookmark" v-model="targetBookmark" autofocus>
        <a :href="bookmark.url" target="_blank">{{ bookmark.title }}</a>
    </p>
    <div v-show="targetBookmark">
        <div>
            <button accesskey="u" @click="replaceBookmark">Update</button>
            <p v-html="updateResult"></p>
        </div>
        <p>
            <button accesskey="p" @click="readSibling(-1)">Prev</button>
            <button accesskey="n" @click="readSibling(1)">Next</button>
        </p>
    </div>
</template>

<style scoped></style>
