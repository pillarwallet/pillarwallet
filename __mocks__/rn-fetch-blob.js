// @flow

const Config: Function = jest.fn(() => {
  return {
    fetch: jest.fn((method, url) => {
      if (url.includes('FAIL_FETCH')) {
        return Promise.reject();
      }
      return Promise.resolve({
        json: () => Promise.resolve(),
        respInfo: { status: 200 },
        path: () => url,
      });
    }),
  };
});

export default {
  DocumentDir: () => {},
  fs: {
    dirs: {
      MainBundleDir: () => {},
      CacheDir: () => {},
      DocumentDir: () => {},
    },
  },
  config: Config,
};
