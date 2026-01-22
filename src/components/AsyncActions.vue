<template>
  <div class="q-pa-md">
    <q-item tag="label">
      <q-item-section avatar>
        <q-icon name="arrow_downward" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Move to end after 10s</q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-checkbox v-model="moveToEndEnabled" accessKey="m" />
      </q-item-section>
    </q-item>
    <q-item tag="label" :class="{ 'text-red': deleteEnabled }">
      <q-item-section avatar>
        <q-icon name="delete" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Delete after 10s</q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-checkbox v-model="deleteEnabled" accessKey="d" />
      </q-item-section>
    </q-item>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref, watch } from 'vue';

const props = defineProps<{
  bookmark: chrome.bookmarks.BookmarkTreeNode;
}>();

const $q = useQuasar();
const bridge = $q.bex;

const moveToEndEnabled = ref(false);
const deleteEnabled = ref(false);

watch(moveToEndEnabled, (enabled) => {
  if (enabled) {
    startAlarm('moveToEnd', 'moveToEnd');
  } else {
    cancelAlarm('moveToEnd');
  }
});

watch(deleteEnabled, (enabled) => {
  if (enabled) {
    startAlarm('delete', 'delete');
  } else {
    cancelAlarm('delete');
  }
});

function startAlarm(name: string, action: 'moveToEnd' | 'delete') {
  const payload = {
    name: `async-${props.bookmark.id}-${name}`,
    bookmarkId: props.bookmark.id,
    parentId: props.bookmark.parentId,
    action,
  };
  void bridge.send({ event: 'alarm.create', to: 'background', payload });
}

function cancelAlarm(name: string) {
  void bridge.send({
    event: 'alarm.cancel',
    to: 'background',
    payload: `async-${props.bookmark.id}-${name}`,
  });
}
</script>
