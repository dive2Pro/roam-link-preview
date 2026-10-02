let uninstalls: Function[] = [];

export const extension_helper = {
  on_uninstall: (cb: Function) => {
    uninstalls.push(cb);
  },
  uninstall() {
    uninstalls.forEach((fn) => {
      fn();
    });
    uninstalls = [];
  },
};

export const appendToTopbar = (name: string) => {
  //Add button (thanks Tyler Wince!)
  var nameToUse = name; //Change to whatever

  var checkForButton = document.getElementById(nameToUse + "-icon");
  if (!checkForButton) {
    checkForButton = document.createElement("span");
    var roamTopbar = document.getElementsByClassName("rm-topbar");
    var nextIconButton = roamTopbar[0].lastElementChild;
    var flexDiv = document.createElement("div");
    flexDiv.className = "rm-topbar__spacer-sm";
    nextIconButton.insertAdjacentElement("afterend", checkForButton);
  }
  return checkForButton;
};



export const isValidUrl = (url: string) => {
  const regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
  const validUrl = regex.test(url);
  return validUrl
}

/**
 * Matches a single `{{link-preview <url>}}` component.
 *
 * The `[^}]+` body intentionally stops at the first `}` (unlike the greedy
 * `(.+)` used elsewhere) so that two adjacent components on the same block are
 * never swallowed into one match. The closing brace accepts both `}` and `}}`
 * so a non-standard `{{link-preview: url}}` written by hand is still matched.
 */
const LINK_PREVIEW_RE = /\{\{link-preview:?\s+([^}]+?)\s*\}\}?/gi;

/** Extract every link-preview component (with its URL) from a block string, in order. */
export const extractLinkPreviews = (input: string) => {
  const matches: { start: number; end: number; raw: string; url: string }[] = [];
  let m: RegExpExecArray | null;
  LINK_PREVIEW_RE.lastIndex = 0;
  while ((m = LINK_PREVIEW_RE.exec(input)) !== null) {
    matches.push({
      start: m.index,
      end: m.index + m[0].length,
      raw: m[0],
      url: m[1],
    });
    // Guard against a zero-length match looping forever.
    if (m.index === LINK_PREVIEW_RE.lastIndex) {
      LINK_PREVIEW_RE.lastIndex++;
    }
  }
  return matches;
};

/**
 * Remove the `index`-th link-preview component from a block string, leaving the
 * bare URL behind so the text is still useful ("还原为 URL").
 *
 * When `expectedUrl` is provided and the indexed component does not match it,
 * we fall back to the first component whose URL does — this keeps the action
 * correct even if the rendered order drifted from the stored order.
 */
export const restoreLinkPreviewByIndex = (
  input: string,
  index: number,
  expectedUrl?: string
) => {
  const matches = extractLinkPreviews(input);
  if (!matches.length) {
    return { string: input, restored: false };
  }

  let target = matches[index];

  if (expectedUrl && (!target || target.url !== expectedUrl)) {
    target = matches.find((item) => item.url === expectedUrl);
  }
  if (!target) {
    return { string: input, restored: false };
  }

  const next = input.slice(0, target.start) + target.url + input.slice(target.end);
  return { string: next, restored: true };
};

/** True when the block string contains at least one link-preview component. */
export const hasLinkPreviewComponent = (input: string) =>
  extractLinkPreviews(input).length > 0;


export const clickOnEl = (el: Element) => {
  "mouseover mousedown mouseup click".split(" ").forEach((type) => {
    el.dispatchEvent(
      new MouseEvent(type, {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1
      })
    );
  });
}

export function hasURLsCanWorkWithLinkPreview(input: string) {
  const pattern = /\[.*?\]\(.*?\)|\{{2}.*?\}{2}/g;
  const splitStrings1: { sub: string, start: number, end: number }[] = [];
  input.replace(pattern, (sub, index) => {
    splitStrings1.push({
      sub,
      start: index,
      end: index + sub.length,
    });
    return '';
  })

  let index = 0;
  return splitStrings1.length ? splitStrings1.some(item => {
    const r = input.substring(index, item.start).match(/(https?:\/\/[^\s]+)/g)
    index = item.end
    return r;
  }) : input.match(/(https?:\/\/[^\s]+)/g)
}

export function replaceURLsWithLinkPreviews(input: string) {
  const pattern = /\[.*?\]\(.*?\)|\{{2}.*?\}{2}/g;
  const splitStrings1: { sub: string, start: number, end: number }[] = [];
  input.replace(pattern, (sub, index) => {
    splitStrings1.push({
      sub,
      start: index,
      end: index + sub.length,
    });
    return '';
  })

  const splitStrings2: { type: string, content: string }[] = [];
  if (splitStrings1.length) {

    let index = 0;

    splitStrings1.forEach(item => {
      splitStrings2.push({ type: 'text', content: input.substring(index, item.start) });
      splitStrings2.push({ type: 'match', content: item.sub });
      index = item.end
    })
    splitStrings2.push({
      type: 'text',
      content: input.substring(index)
    })
  } else {
    splitStrings2.push({ type: 'text', content: input })
  }

  const result = splitStrings2.map(item => {
    if (item.type === 'match') {
      return item.content
    }
    if (item.type === 'text') {
      // NOTE: must replace EVERY url in the segment, not just the first one.
      // Using a non-global `String.replace(link, ...)` only converted one url
      // per text run, so a block with several links was only partly converted.
      return item.content.replace(/(https?:\/\/[^\s]+)/g, (link) => `{{link-preview ${link}}}`)
    }
  }).join("")

  return result;
}

