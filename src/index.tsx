import {
  extension_helper,
  hasURLsCanWorkWithLinkPreview,
  isValidUrl,
  replaceURLsWithLinkPreviews,
} from "./helper";
import { initExtension } from "./extension";
import { showToast } from "./toast";

function onload({ extensionAPI }: { extensionAPI: RoamExtensionAPI }) {
  initExtension();
  extensionAPI.ui.commandPalette.addCommand({
    label: "Paste link as Link Card",
    callback: async () => {
      const focusedBlock = window.roamAlphaAPI.ui.getFocusedBlock();
      const str = window.roamAlphaAPI.q(
        `[:find ?e . :where [?b :block/uid "${focusedBlock["block-uid"]}"] [?b :block/string ?e]]`
      ) as unknown as string;
      const link = await navigator.clipboard.readText();
      if (!isValidUrl(link)) {
        showToast({
          intent: "warning",
          message: `${link} is not a valid link`,
        });
        return;
      }
      const newString = `${str}{{link-preview ${link}}}`;
      await window.roamAlphaAPI.data.block.update({
        block: {
          uid: focusedBlock["block-uid"],
          string: newString,
        },
      });
      setTimeout(() => {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: focusedBlock,
          selection: {
            start: newString.length,
            end: newString.length,
          },
        });
      }, 10);
    },
  });
  window.roamAlphaAPI.ui.blockContextMenu.addCommand({
    label: "Convert Link to Link Card",
    callback: (e) => {
      window.roamAlphaAPI.updateBlock({
        block: {
          string: replaceURLsWithLinkPreviews(e["block-string"]),
          uid: e["block-uid"],
        },
      });
    },
    // @ts-ignore
    "display-conditional": (e) => {
      return hasURLsCanWorkWithLinkPreview(e["block-string"]);
    },
  });

  window.roamAlphaAPI.ui.slashCommand.addCommand({
    label: "Link Preview: Covert Link to Link Card",
    callback: (args) => {
      const blockUid = args["block-uid"];
      const result = window.roamAlphaAPI.q(
        `[:find ?s . :where [?b :block/uid "${blockUid}"] [?b :block/string ?s]]`
      );
      // `q` can hand back a nested array depending on the Roam build, so
      // normalise before treating it as the block string.
      const blockString = Array.isArray(result) ? result[0] : result;

      if (typeof blockString !== "string" || !blockString) {
        return "";
      }

      const newString = replaceURLsWithLinkPreviews(blockString);
      if (newString === blockString) {
        return "";
      }

      window.roamAlphaAPI.updateBlock({
        block: {
          string: newString,
          uid: blockUid,
        },
      });
      return "";
    },
  });
  extension_helper.on_uninstall(() => {
    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label: "Convert Link to Link Card",
    });
    window.roamAlphaAPI.ui.slashCommand.removeCommand({
      label: "Link Preview: Covert Link to Link Card",
    });
  });
}

function onunload() {
  extension_helper.uninstall();
}

export default {
  onload,
  onunload,
};
