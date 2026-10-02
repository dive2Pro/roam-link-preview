import { Button, IconName } from "@blueprintjs/core";
import React from "react";
import ReactDOM from "react-dom";
import {
  clickOnEl,
  extension_helper,
  isValidUrl,
  restoreLinkPreviewByIndex,
} from "./helper";
import { showToast } from "./toast";
import "./style.less";


const { useState, useEffect } = React

/** fetch() with an AbortController-based timeout so a hung request can't leave
 * the card shimmering forever. */
const fetchWithTimeout = async (input: string, init: RequestInit, ms: number) => {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), ms) : null
  try {
    return await window.fetch(input, { ...init, signal: controller ? controller.signal : undefined })
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}


const savecache = (url: string, obj: {}) => {
  localStorage.setItem(KEY + `-${url}`, JSON.stringify(obj))
}

const KEY = 'roam-rich-card'

const loadcache = (url: string) => {
  const cache = localStorage.getItem(KEY + `-${url}`)
  if (cache) {
    // console.log(cache, ' - cache')
    return JSON.parse(cache)
  }
}

// NOTE: the unused `headers` block that used to live here was removed — the
// request goes through the preview service, and those headers were never sent.

type Response = {
  contentType: string;
  description: string;
  favicons: string[]
  images: string[]
  mediaType: string;
  siteName: string;
  title: string
  url: string;
  videos: string[]
}

/**
 * Uses the native `title` attribute instead of Blueprint's <Tooltip>.
 *
 * Blueprint's Tooltip renders its target inside a wrapper element and hangs
 * onMouseLeave on that wrapper. Our buttons are absolutely positioned inside
 * the card and the whole action group fades in/out via opacity, so the wrapper
 * never received a matching mouseleave and the portal'd tooltip stayed on
 * screen forever. A native tooltip cannot get stuck and costs no extra DOM.
 */
function ActionButton(props: {
  icon: IconName;
  title: string;
  onClick: () => void;
}) {
  return (
    <Button
      icon={props.icon}
      small
      minimal
      title={props.title}
      aria-label={props.title}
      className="link-action-btn"
      onClick={e => {
        // Keep the card's <a> from navigating / opening a new tab.
        e.stopPropagation();
        e.preventDefault();
        props.onClick();
      }}
    />
  )
}

/** Buttons that appear on hover, top-right of every card. */
function CardActions(props: { onRestore: () => void; url: string }) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    const ok = await copyToClipboard(props.url)
    if (ok) {
      setCopied(true)
      showToast({ intent: "success", message: "Link copied to clipboard" })
      setTimeout(() => setCopied(false), 1500)
    } else {
      showToast({
        intent: "warning",
        message: "Copy failed, please copy the link manually",
      })
    }
  }

  return <div className="link-actions">
    <ActionButton
      icon={copied ? "tick" : "duplicate"}
      title={copied ? "Copied" : "Copy link"}
      onClick={onCopy}
    />
    <ActionButton
      icon="undo"
      title="Turn back into plain URL"
      onClick={props.onRestore}
    />
  </div>
}

/**
 * navigator.clipboard is unavailable in non-secure contexts, which is common in
 * the Roam desktop / mobile apps. Fall back to a temporary textarea + the
 * legacy execCommand API so copying still works there.
 */
const copyToClipboard = async (text: string) => {
  const clipboard = navigator.clipboard
  if (clipboard && typeof clipboard.writeText === "function") {
    try {
      await clipboard.writeText(text)
      return true
    } catch (e) {
      // fall through to the legacy path (e.g. permission denied)
    }
  }

  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.top = "-1000px"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    const ok = document.execCommand("copy")
    document.body.removeChild(textarea)
    return ok
  } catch (e) {
    return false
  }
}

export function EditIcon(props: { onClick: () => void }) {
  return <Button icon="edit" small className="edit-btn" onClick={e => {
    e.stopPropagation();
    e.preventDefault();
    props.onClick();
  }} />
}

/**
 * The preview service returns some assets as protocol-relative URLs
 * (e.g. `//n.sinaimg.cn/...` on Sina pages). Resolve them against the page
 * being previewed so they load consistently over https.
 */
const resolveUrl = (asset: string, base: string) => {
  if (!asset) {
    return asset;
  }
  try {
    return new URL(asset, base).href;
  } catch (e) {
    return asset;
  }
}

function LinkPreview({ url, edit, actions }: {
  url: string,
  edit: JSX.Element,
  actions: JSX.Element
}) {
  let [loading, setLoading] = useState(true)
  const [preview, setPreviewData] = useState({} as Response)
  const [isUrlValid, setUrlValidation] = useState(false)
  const [failed, setFailed] = useState(false)


  useEffect(() => {
    async function fetchData() {

      const fetch = window.fetch
      if (isValidUrl(url)) {
        setUrlValidation(true)
      } else {
        return {}
      }
      console.log('loading: ', url)
      setLoading(true)

      const cache = await loadcache(url)
      if (cache) {
        setPreviewData(cache)
      } else {
        try {
          const response = await fetchWithTimeout(
            `https://preview-link-phi.vercel.app/api/preview-link?url=${encodeURIComponent(url)}`,
            {},
            15000
          )
          if (!response.ok) {
            throw new Error(`preview service responded ${response.status}`)
          }
          const data = await response.json()
          setPreviewData(data)
          savecache(url, data)
        } catch (e) {
          console.warn('LinkPreview: failed to load preview for', url, e)
          setFailed(true)
        }
      }
      setLoading(false)

    }
    fetchData()
  }, [url])

  if (!isUrlValid) {
    console.warn(
      'LinkPreview Error: You need to provide url in props to render the component', url
    )
    return null
  }

  // Degrade gracefully: if the preview service is unreachable or slow, show a
  // plain link card instead of an empty box so the block stays usable.
  if (failed) {
    return (
      <div className="link-preview">
        <a target="_blank" href={url} className='link-anchor'>
          {edit}
          {actions}
          <div className={'link-preview-section link-preview-fallback'}>
            <div className={'link-description'}>
              <div className={'link-data'}>
                <div className={'link-title'}>{url}</div>
                <div className={'link-description-content'}>
                  Preview unavailable — click to open the link.
                </div>
              </div>
            </div>
          </div>
        </a>
      </div>
    )
  }

  // If the user wants to use its own element structure with the fetched data
  if (loading) {
    return (
      <div className="link-preview">
        <div
          className={`link-preview-section link-image-loader`}
        >
          {edit}
          {actions}

          <div className={`link-description`}>

            <div className={`link-data`}>
              <div className={`link-title`}></div>
              <div className={'link-description-content '}>
              </div>
            </div>

            <div className={'domain'}>
              {/* <img className="" src={""} /> */}

            </div>
          </div>
          <div className={'link-image'}>

          </div>

        </div>
      </div>

    )
  } else {
    return (
      <div className="link-preview">
        <a target="_blank" href={url} className='link-anchor'>
          {edit}
          {actions}
          <div
            className={'link-preview-section'}
          >
            <div className={'link-description'}>

              <div className={'link-data'}>
                <div className={'link-title'}>{preview.title}</div>
                <div className={'link-description-content'}>
                  {preview.description}
                </div>
              </div>

              <div className={'domain'}>
                {preview.favicons?.[0] && <img className="link-favicon" src={preview.favicons[0]} />}
                <span className={'link-url'}>{url}</span>
              </div>
            </div>
            <div className={'link-image'}>
              {/* `images` may be absent entirely when the page has no og:image —
                  reading `.length` off undefined used to throw and blank the card. */}
              {preview.images?.[0] && (
                <img
                  src={resolveUrl(preview.images[0], url)}
                  alt={preview.description}
                  loading="lazy"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
            </div>

          </div>
        </a>
      </div>

    )
  }
}


const renderNode = (node: HTMLButtonElement) => {
  const block = node.closest("[id^='block-input']");
  if (!block) {
    return
  }
  let uid = block.getAttribute("id").substr(-9);
  const reg = /{{link-preview(:*) (.+)}}/gi;
  const linkPreviewElements = Array.from(block.querySelectorAll(".rm-xparser-default-link-preview"))
  let index = 0;
  while (linkPreviewElements.length) {
    const linkButton = linkPreviewElements[index];
    const cardIndex = index; // capture: `index` keeps moving after the render
    const rmRef = linkButton.closest(".rm-block-ref")
    if (rmRef) {
      uid = rmRef.getAttribute("data-uid")
    }
    const str = window.roamAlphaAPI.pull("[:block/string]", [":block/uid", uid])[":block/string"]

    let result = reg.exec(str);
    const url = result[2];

    const mountPoint = linkPreviewElements[index++].parentElement
    // console.log(linkButton, url, result, linkPreviewElements, block, );
    ReactDOM.render(<LinkPreview url={url}
      edit={
        <EditIcon onClick={() => {
          clickOnEl(block)
        }} />
      }
      actions={<CardActions url={url} onRestore={() => {
        restoreCardToUrl(uid, cardIndex, url)
      }} />}
    />, mountPoint)
    result = reg.exec(str);
    if (!result) {
      break
    }
  }

}

/**
 * Replace the `index`-th link-preview component of a block with its bare URL.
 *
 * We re-read the block string at click time instead of trusting the string
 * captured during render — the user may have edited the block since.
 */
const restoreCardToUrl = (uid: string, index: number, url: string) => {
  try {
    const str = window.roamAlphaAPI.pull("[:block/string]", [":block/uid", uid])?.[":block/string"]
    if (typeof str !== "string") {
      showToast({ intent: "warning", message: "Could not read the block" })
      return
    }

    const { string: next, restored } = restoreLinkPreviewByIndex(str, index, url)
    if (!restored) {
      showToast({ intent: "warning", message: "Link card not found in this block" })
      return
    }

    window.roamAlphaAPI.updateBlock({ block: { uid, string: next } })
  } catch (e) {
    console.error("LinkPreview: failed to restore link", e)
    showToast({ intent: "danger", message: "Failed to restore the link" })
  }
}

const process = (node: Node) => {
  Array.from((node as HTMLElement)?.querySelectorAll(".bp3-button")).filter(d => d.tagName === 'BUTTON')
    .forEach(d => {
      setTimeout(() => {
        renderNode(d as HTMLButtonElement);

      }, 10)
    })
}

const isNode = (node: HTMLElement) => node.innerHTML
export function initExtension() {
  const observer = new MutationObserver((ms) => {
    ms.forEach(m => {
      m.addedNodes.forEach(node => {
        isNode(node as HTMLElement) && process(node);
      }
      )
    })
  });
  process(document.body);
  observer.observe(document.body, { childList: true, subtree: true });
  extension_helper.on_uninstall(() => {
    observer.disconnect();
  })
}
