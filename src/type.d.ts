type RoamExtensionAPI = {
  settings: {
    get: (k: string) => unknown;
    getAll: () => Record<string, unknown>;
    panel: {
      create: (c: PanelConfig) => void;
    };
    set: (k: string, v: unknown) => Promise<void>;
  };
  ui: {
    commandPalette: {
      addCommand: (action: {
        label: string;
        callback: () => void;
      }) => void;
      removeCommand: (action: {
        label: string;
      }) => void;
    };
  }
};


interface Window {
  RoamLazy?: {
    JSZip: () => Promise<typeof JSZip>;
    Marked: () => Promise<typeof marked>;
    MarkedReact: () => Promise<typeof Markdown>;
  };
  roamAlphaAPI: {
    q: (query: string, ...params: unknown[]) => unknown[][];
    pull: (selector: string, id: number | string | [string, string]) => PullBlock;
    createBlock: WriteAction;
    updateBlock: WriteAction;
    createPage: WriteAction;
    moveBlock: WriteAction;
    deleteBlock: WriteAction;
    updatePage: WriteAction;
    deletePage: WriteAction;
    util: {
      generateUID: () => string;
      dateToPageTitle: (date: Date) => string;
      dateToPageUid: (date: Date) => string;
      pageTitleToDate: (title: string) => Date | null;
      uploadFile: (title: string) => Date;
    };
    data: {
      async: {
        q: (query: string) => Promise<unknown[][]>;
      };
      addPullWatch: AddPullWatch;
      block: {
        create: WriteAction;
        update: WriteAction;
        move: WriteAction;
        delete: WriteAction;
      };
      fast: {
        q: (query: string, ...params: unknown[]) => unknown[][];
      };
      page: {
        create: WriteAction;
        update: WriteAction;
        delete: WriteAction;
      };
      pull: (selector: string, id: number | string | [string, string]) => PullBlock;
      pull_many: (pattern: string, eid: string[][]) => PullBlock[];
      q: (query: string, ...params: unknown[]) => unknown[][];
      removePullWatch: (pullPattern: string, entityId: string, callback: (before: PullBlock, after: PullBlock) => void) => boolean;
      redo: () => void;
      undo: () => void;
      user: {
        upsert: () => void;
      };
    };
    ui: {
      leftSidebar: {
        open: () => Promise<void>;
        close: () => Promise<void>;
      };
      rightSidebar: {
        open: () => Promise<void>;
        close: () => Promise<void>;
        getWindows: () => SidebarWindow[];
        addWindow: SidebarAction;
        setWindowOrder: (action: {
          window: SidebarWindowInput & {
            order: number;
          };
        }) => Promise<void>;
        collapseWindow: SidebarAction;
        pinWindow: SidebarAction;
        expandWindow: SidebarAction;
        removeWindow: SidebarAction;
        unpinWindow: SidebarAction;
      };
      commandPalette: {
        addCommand: (action: {
          label: string;
          callback: () => void;
        }) => void;
        removeCommand: (action: {
          label: string;
        }) => void;
      };
      blockContextMenu: {
        addCommand: (action: {
          label: string;
          'display-conditional': (e: {
            'block-string': string,
            'block-uid': string,
            'page-uid': string,
            'read-only?': boolean
            'window-id': string,
            heading: 0 | 1 | 2 | 3 | null;
          }) => boolean
          callback: (props: {
            "block-string": string;
            "block-uid": string;
            heading: 0 | 1 | 2 | 3 | null;
            "page-uid": string;
            "read-only?": boolean;
            "window-id": string;
          }) => void;
        }) => void;
        removeCommand: (action: {
          label: string;
        }) => void;
      };
      getFocusedBlock: () => null | {
        "window-id": string;
        "block-uid": string;
      };
      slashCommand: {
        addCommand: (action: {
          label: string;
          callback: (args: {
            "block-uid": string;
            "window-id": string;
          }) => void;
        }) => void;
        removeCommand: (action: {
          label: string;
        }) => void;
      };
      components: {
        renderBlock: (args: {
          uid: string;
          el: HTMLElement;
        }) => null;
      };
      mainWindow: {
        focusFirstBlock: () => Promise<void>;
        openBlock: (p: {
          block: {
            uid: string;
          };
        }) => Promise<void>;
        openPage: (p: {
          page: {
            uid: string;
          } | {
            title: string;
          };
        }) => Promise<void>;
        getOpenPageOrBlockUid: () => Promise<string | null>;
        openDailyNotes: () => Promise<void>;
      };
      setBlockFocusAndSelection: (a: {
        location?: {
          "block-uid": string;
          "window-id": string;
        };
        selection?: {
          start: number;
          end?: number;
        };
      }) => Promise<void>;
    };
    platform: {
      isDesktop: boolean;
      isIOS: boolean;
      isMobile: boolean;
      isMobileApp: boolean;
      isPC: boolean;
      isTouchDevice: boolean;
    };
    graph: {
      name: string;
      type: "hosted" | "offline";
      isEncrypted: boolean;
    };
  };
}
