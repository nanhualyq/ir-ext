import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  getPageInfo(): any,
  getBookmarkByUrl(url: string): any,
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();

export default defineUnlistedScript(() => {})