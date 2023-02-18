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
