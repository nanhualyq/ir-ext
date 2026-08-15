// ── Pending action storage ────────────────────────────────────────────
interface PendingAction {
  type: 'delete' | 'moveToEnd';
  bookmarkId: string;
  bookmarkTitle: string;
}

let pending: PendingAction | null = null;

// ── Helpers ──────────────────────────────────────────────────────────
const ALARM_NAME = 'pendingAction';
const DELAY_SECONDS = 10;

function notify(
  title: string,
  message: string,
  opts?: { priority?: number },
): string {
  const id = `ir-ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  browser.notifications.create(id, {
    type: 'basic',
    iconUrl: browser.runtime.getURL('/icon/96.png'),
    title,
    message,
    priority: opts?.priority ?? 2,
  } as any);
  return id;
}

async function executePending() {
  if (!pending) return;

  const { type, bookmarkId } = pending;
  pending = null;

  try {
    if (type === 'delete') {
      await browser.bookmarks.remove(bookmarkId);
      notify('✅ Bookmark deleted', 'The bookmark has been removed.', {
        priority: 0,
      });
    } else {
      // Move to end
      const [bookmark] = await browser.bookmarks.get(bookmarkId);
      if (!bookmark?.parentId) {
        notify('❌ Action failed', 'Could not find bookmark parent.');
        return;
      }

      const allChildren = await browser.bookmarks.getChildren(bookmark.parentId);
      const urlChildren = allChildren.filter(
        (c) =>
          (c as any).type !== 'separator' &&
          typeof c.url === 'string' &&
          c.url.length > 0,
      );

      if (urlChildren.length <= 1) {
        notify('ℹ️ Already at end', 'This bookmark is already the only one.', {
          priority: 0,
        });
        return;
      }

      const isLast =
        urlChildren[urlChildren.length - 1]?.id === bookmarkId;

      if (isLast) {
        notify(
          'ℹ️ Already at end',
          'This bookmark is already at the end.',
          { priority: 0 },
        );
        return;
      }

      await browser.bookmarks.move(bookmarkId, {
        index: urlChildren.length - 1,
      });
      notify('✅ Bookmark moved', 'The bookmark has been moved to the end.', {
        priority: 0,
      });
    }
  } catch (err: any) {
    notify('❌ Action failed', err?.message ?? 'Unknown error');
  }
}

function cancelPending() {
  if (!pending) return;
  browser.alarms.clear(ALARM_NAME);
  const title =
    pending.type === 'delete' ? 'Bookmark deletion' : 'Bookmark move';
  notify('↩️ Action cancelled', `${title} has been cancelled.`, {
    priority: 0,
  });
  pending = null;
}

// ── Background entry point ───────────────────────────────────────────
export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // ── Message handler ──────────────────────────────────────────────
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'searchBookmarks') {
      browser.bookmarks.search(message.query).then(sendResponse);
      return true;
    }

    if (message.type === 'scheduleDelete') {
      cancelPending();

      notify(
        '⚠️ Scheduled: Delete bookmark',
        `"${message.bookmarkTitle}" will be deleted in ${DELAY_SECONDS} seconds.`,
      );

      pending = {
        type: 'delete',
        bookmarkId: message.bookmarkId,
        bookmarkTitle: message.bookmarkTitle,
      };

      browser.alarms.create(ALARM_NAME, {
        delayInMinutes: DELAY_SECONDS / 60,
      });

      sendResponse({ ok: true });
      return true;
    }

    if (message.type === 'scheduleMoveToEnd') {
      cancelPending();

      notify(
        '⚠️ Scheduled: Move bookmark to end',
        `"${message.bookmarkTitle}" will be moved to the end in ${DELAY_SECONDS} seconds.`,
      );

      pending = {
        type: 'moveToEnd',
        bookmarkId: message.bookmarkId,
        bookmarkTitle: message.bookmarkTitle,
      };

      browser.alarms.create(ALARM_NAME, {
        delayInMinutes: DELAY_SECONDS / 60,
      });

      sendResponse({ ok: true });
      return true;
    }

    if (message.type === 'cancelPendingAction') {
      cancelPending();
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === 'getPendingAction') {
      sendResponse(
        pending ? { type: pending.type, bookmarkId: pending.bookmarkId } : null,
      );
      return true;
    }
  });

  // ── Alarm handler (10s delay) ──────────────────────────────────
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
      await executePending();
    }
  });
});
