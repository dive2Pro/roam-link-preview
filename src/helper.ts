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

export function hasURLsCanWorkWithLinkPreview(str: string) {
  let regex = /(\[.+?\]|\(.+?\)|{{.+?}})/g;
  let matches: { start: number, end: number }[] = [];
  let offset = 0;
  let result = str.replace(regex, (match, ss, index) => {
    console.log(match, index, ss)
    matches.push({ start: index - offset, end: index + match.length - 1 - offset });
    offset += match.length;
    return '';
  });
  regex = /(https?:\/\/[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/ig;
  return regex.test(result)
}

export function replaceURLsWithLinkPreviews(str: string) {
  // Step 1: Remove brackets and their contents, and record their positions
  let regex = /(\[.+?\]|\(.+?\)|{{.+?}})/g;
  let matches: {start: number, end: number }[] = [];
  let offset = 0;
  let result = str.replace(regex, (match, ss, index) => {
    console.log(match, index, ss)
    matches.push({ start: index - offset, end: index + match.length - 1 - offset });
    offset += match.length;
    return '';
  });

  // Step 2: Match URLs and replace them with link preview tags
  regex = /(https?:\/\/[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/ig;
  result = result.replace(regex, '{{link-preview $&}}');
  // Step 3: Restore removed brackets and their contents
  matches.forEach(({ start, end }) => {
    const removed = str.slice(start, end + 1);
    result = result.slice(0, start) + removed + result.slice(start);
  });

  return result;
}

