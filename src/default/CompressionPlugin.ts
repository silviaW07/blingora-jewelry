import CompressionPlugin from 'compression-webpack-plugin';
export default {
  name: 'compression-plugin',
  setup(api: any) {
    if (process.env.NODE_ENV === 'production') {
      api.modifyBundlerChain((chain: any) => {
        chain.plugin('compression').use(CompressionPlugin, [
          {
            algorithm: 'gzip',
            test: /\.(js|css|html|json|svg|txt)$/,
            threshold: 10240,
            minRatio: 0.8,
          },
        ]);
      });
    }
  },
};