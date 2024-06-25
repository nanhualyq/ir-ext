<script lang="ts">
    import { onMount } from "svelte";

    // async function openListPage() {
    //     browser.tabs.create({ url: "#list" });
    // }

    interface Bookmark {
        index: number;
        id: string;
        title: string;
        url: string;
        parentId: string;
    }
    interface Tab {
        id: number;
        url: string;
        title: string;
    }

    let bookmarks: Bookmark[] = [];
    let targetBookmark: Bookmark;
    let currentTab: Tab;
    // {
    //     "id": "ynB_a2z3WKKH",
    //     "title": "Getting Started",
    //     "index": 0,
    //     "dateAdded": 1718878492769,
    //     "type": "bookmark",
    //     "url": "https://www.mozilla.org/firefox/?utm_medium=firefox-desktop&utm_source=bookmarks-toolbar&utm_campaign=new-users&utm_content=-global",
    //     "parentId": "toolbar_____"
    // }
    onMount(async () => {
        currentTab = (await getCurrentTab()) as Tab;
        const res = await getOldBookmarks();
        if (Array.isArray(res)) {
            bookmarks = res as Bookmark[];
        }
        if (bookmarks.length === 1) {
            targetBookmark = bookmarks[0];
        }
    });

    async function getCurrentTab() {
        const [tab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
            lastFocusedWindow: true,
        });
        return tab;
    }

    async function getOldBookmarks() {
        if (!currentTab) {
            return;
        }
        const url = new URL(currentTab.url + "");

        const bookmarks = await browser.bookmarks.search({
            url: url.href,
        });
        if (bookmarks.length) {
            return bookmarks;
        }

        if (!url.protocol.includes("http")) {
            return;
        }

        while (1) {
            if (url.hash) {
                if (url.hash.lastIndexOf("&") >= 0) {
                    url.hash = url.hash.slice(0, url.hash.lastIndexOf("&"));
                } else if (url.hash.lastIndexOf("?") >= 0) {
                    url.hash = url.hash.slice(0, url.hash.lastIndexOf("?"));
                } else {
                    url.hash = "";
                }
            } else if (url.searchParams.size) {
                const lastKey = [...url.searchParams.keys()][
                    url.searchParams.size - 1
                ];
                url.searchParams.delete(lastKey);
            } else if (url.pathname) {
                url.pathname = url.pathname.replace(/\/[^/]*$/, "");
            }

            const bookmarks = await browser.bookmarks.search(url.href);

            if (bookmarks.length > 0) {
                return bookmarks;
            }
            if (
                url.pathname === "/" &&
                url.href === url.origin + url.pathname
            ) {
                return;
            }
        }
    }

    let updatePromise: Promise<any> | undefined;
    async function replaceBookmark() {
        if (!currentTab) {
            return;
        }
        const { url, title } = await browser.tabs.sendMessage(
            currentTab.id,
            "getPageInfo",
        );
        updatePromise = browser.bookmarks.update(targetBookmark.id, {
            url,
            title,
        });
    }

    async function readSibling(offset: number) {
        const siblings = await browser.bookmarks.getChildren(
            targetBookmark.parentId,
        );
        const newMarkbook = siblings[targetBookmark.index + offset];
        if (newMarkbook) {
            browser.tabs.update(currentTab.id, { url: newMarkbook.url });
            window.close();
        }
    }
    function cutText(text = "", max = 128) {
        let str = text.slice(0, max);
        if (str.length < text.length) {
            str += "...";
        }
        return str;
    }
</script>

{#each bookmarks as item (item.id)}
    <p>
        <label>
            <input type="radio" bind:group={targetBookmark} value={item} />
            {item.parentId} / {cutText(item.title)} (
            <a href={item.url}>{cutText(item.url)}</a>
            )
        </label>
    </p>
{:else}
    <h2>No Match Bookmark</h2>
{/each}

<!-- svelte-ignore a11y-accesskey -->
<button accesskey="u" on:click={replaceBookmark} disabled={!targetBookmark}
    >Update</button
>
{#if updatePromise}
    {#await updatePromise}
        <span>Updating...</span>
    {:then res}
        <span style="color: green;">Success!</span>
    {:catch error}
        <span style="color: red;">{error}</span>
    {/await}
{/if}

<p>
    <!-- svelte-ignore a11y-accesskey -->
    <button
        accesskey="p"
        on:click={() => readSibling(-1)}
        disabled={!targetBookmark}>Prev</button
    >
    <!-- svelte-ignore a11y-accesskey -->
    <button
        accesskey="n"
        on:click={() => readSibling(1)}
        disabled={!targetBookmark}>Next</button
    >
</p>
