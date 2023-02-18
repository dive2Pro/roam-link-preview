import { Button } from "@blueprintjs/core";
import React from "react";
import ReactDOM from "react-dom";
import { clickOnEl, extension_helper, isValidUrl } from "./helper";
import "./style.less";


const { useState, useEffect } = React


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

// let headers = {} as Record<string, string>

let headers = new Headers();

headers.append('Content-Type', 'application/json');
headers.append('Accept', 'application/json');

headers.append('Access-Control-Allow-Origin', 'http://roamresearch');
headers.append('Access-Control-Allow-Credentials', 'true');

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

function EditIcon(props: { onClick: () => void }) {
  return <Button icon="edit" small className="edit-btn" onClick={e => {
    e.stopPropagation();
    e.preventDefault();
    props.onClick();
  }} />
}

function LinkPreview({ url, edit }: { url: string, edit: JSX.Element }) {
  let [loading, setLoading] = useState(true)
  const [preview, setPreviewData] = useState({} as Response)
  const [isUrlValid, setUrlValidation] = useState(false)


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
        const response = await fetch(`https://preview-link-phi.vercel.app/api/preview-link?url=${url}`, {
        })
        // const response = getLinkPreview(url, { headers })
        const data = await response.json()
        setPreviewData(data)
        savecache(url, data)
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

  // If the user wants to use its own element structure with the fetched data
  if (loading) {
    return (
      <div className="link-preview">
        <div
          className={`link-preview-section link-image-loader`}
        >
          {edit}

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
                <img className="link-favicon" src={preview.favicons?.[0]} />
                <span className={'link-url'}>{url}</span>
              </div>
            </div>
            <div className={'link-image'}>
              {preview.images.length && <img src={preview.images[0]} alt={preview.description} />}
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
    console.log(node, ' = block node')
    return
  }
  const uid = block.getAttribute("id").substr(-9);
  const str = window.roamAlphaAPI.pull("[:block/string]", [":block/uid", uid])[":block/string"]
  const reg = /{{link-preview(:*) (.+)}}/gi;
  const linkPreviewElements = Array.from(block.querySelectorAll(".rm-xparser-default-link-preview"))
  let result = reg.exec(str);
  let index = 0;
  while (result && linkPreviewElements.length) {
    const url = result[2];
    // console.log(linkPreviewElements[index], url, result, linkPreviewElements, block, );
    // console.log(linkPreviewElements[index].parentElement, '@@')
    ReactDOM.render(<LinkPreview url={url} edit={
      <EditIcon onClick={() => {
        clickOnEl(block)
      }} />
    } />, linkPreviewElements[index++].parentElement)
    result = reg.exec(str);
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
