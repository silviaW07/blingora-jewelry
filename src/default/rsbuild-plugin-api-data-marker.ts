import path from 'path';

export interface ApiDataMarkerPluginOptions {
  entryName?: string;
  runtimePath?: string;
  enabled?: boolean;
}

export default function apiDataMarkerPlugin(
  options: ApiDataMarkerPluginOptions = {}
): { name: string; setup: (api: any) => void } {
  return {
    name: 'rsbuild-plugin-api-data-marker',
    setup(api: any) {
      if (options.enabled === false) {
        return;
      }

      api.modifyBundlerChain((chain: any) => {
        const entryName = options.entryName || 'index';
        const runtimePath =
          options.runtimePath ||
          path.resolve(__dirname, './api-data-marker-runtime-v3.ts');

        chain.entry(entryName).prepend(runtimePath);
      });
    },
  };
}

