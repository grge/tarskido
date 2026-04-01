/// <reference types="vite/client" />
/// <reference types="vue/ref-macros" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '@vue/runtime-core' {
  import { Router } from 'vue-router';

  interface ComponentCustomProperties {
    $router: Router;
  }
}

declare module '@vscode/markdown-it-katex' {
  import type MarkdownIt from 'markdown-it';
  const plugin: MarkdownIt.PluginSimple;
  export default plugin;
}

declare module 'md-editor-v3' {
  import { DefineComponent } from 'vue';
  export const MdEditor: DefineComponent<any, any, any>;
  export const MdPreview: DefineComponent<any, any, any>;
}

declare module 'downloadjs' {
  function download(data: any, filename?: string, mime?: string): void;
  export default download;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
