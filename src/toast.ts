import { Toaster } from "@blueprintjs/core";

let toaster: ReturnType<typeof Toaster.create> | null = null;

/**
 * Shared toaster so every part of the extension reports feedback the same way.
 *
 * @blueprintjs/core is an external (provided by Roam), so `Toaster.create()`
 * returns a singleton per call target — caching it avoids creating a new
 * container on every toast.
 */
export const showToast = (props: {
  intent: "success" | "warning" | "danger" | "primary";
  message: string;
}) => {
  try {
    if (!toaster) {
      toaster = Toaster.create();
    }
    toaster.show({ timeout: 2500, ...props });
  } catch (e) {
    console.warn("LinkPreview: unable to show toast", e);
  }
};
