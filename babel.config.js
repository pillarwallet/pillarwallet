module.exports = function(api) {
  api.cache(false);

  const presets = [
    "module:metro-react-native-babel-preset",
    "module:react-native-dotenv",
  ];

  const plugins = [
    [
      "module-resolver",
      {
        root: [
          "./src"
        ],
      },
    ],
    [
      "babel-plugin-styled-components",
    ],
    [
      "transform-inline-environment-variables",
    ],
  ];

  const env = {
    development: {
      plugins: [
        "babel-plugin-styled-components",
      ],
    },
  };

  return {
    presets,
    plugins,
    env,
  };
};
