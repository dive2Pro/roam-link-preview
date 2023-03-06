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
  return splitStrings1.some(item => {
    console.log(item, ' --', input.substring(index, item.start))
    const r = input.substring(index, item.start).match(/(https?:\/\/[^\s]+)/g)
    index = item.end
    return r;
  })
}

export function replaceURLsWithLinkPreviews(input: string) {
  const pattern = /\[.*?\]\(.*?\)|\{{2}.*?\}{2}/g;
  const splitStrings1: { sub: string,  start: number, end: number }[] = [];
  input.replace(pattern, (sub, index) => {
    splitStrings1.push({
      sub,
      start: index,
      end: index + sub.length,
    });
    return '';
  })

  const splitStrings2: {type: string, content: string}[] = [];
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
  // console.log(splitStrings2, ' = 2')

  const result = splitStrings2.map(item => {
    if (item.type === 'match') {
      return item.content
    }
    if (item.type === 'text') {
      const linkPattern = /(https?:\/\/[^\s]+)/g;
      const linkMatch = item.content.match(linkPattern);
      console.log(linkMatch, ' = match')
      if (linkMatch) {
        const link = linkMatch[0];
        const newMatch = item.content.replace(link, `{{link-preview ${link}}}`);
        return newMatch
      }
      return item.content
    }
  }).join("")

  return result;
}

