import { extension_helper, isValidUrl } from "./helper";
import { initExtension } from "./extension";
import { Toaster } from '@blueprintjs/core'

function onload({ extensionAPI }: { extensionAPI: RoamExtensionAPI }) {
  initExtension();
  extensionAPI.ui
    .commandPalette
    .addCommand({
      label: 'Paste link as Link Card',
      callback: async () => {
        const focusedBlock = window.roamAlphaAPI.ui.getFocusedBlock();
        const str = window.roamAlphaAPI.q(`[:find ?e . :where [?b :block/uid "${focusedBlock["block-uid"]}"] [?b :block/string ?e]]`) as unknown as string;
        const link = await navigator.clipboard.readText();
        if (!isValidUrl(link)) {
          Toaster.create().show({
            intent: 'warning',
            message: `${link} is not a valid link`
          });
          return;
        }
        const newString = `${str}{{link-preview ${link}}}`
        await window.roamAlphaAPI.data.block.update({
          block: {
            uid: focusedBlock["block-uid"],
            string: newString
          }
        });
        setTimeout(() => {

          window.roamAlphaAPI.ui.setBlockFocusAndSelection({
            location: focusedBlock,
            selection: {
              start: newString.length,
              end: newString.length
            }
          })
        }, 10)

      }
    })
}

function onunload() {
  extension_helper.uninstall();
}

export default {
  onload,
  onunload,
};
