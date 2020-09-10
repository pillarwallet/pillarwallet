// @flow

const Config: Function = jest.fn(() => {
  return {
    fetch: jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(),
        respInfo: { status: 200 },
        path: () => 'localString',
      }),
    ),
  };
});

export default {
  DocumentDir: () => {},
  ImageCache: {
    get: {
      clear: () => {},
    },
  },
  fs: {
    dirs: {
      MainBundleDir: () => {},
      CacheDir: () => {},
      DocumentDir: () => {},
    },
  },
  config: Config,
};
