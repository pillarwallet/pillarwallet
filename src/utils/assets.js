// @flow
export function transformAssetsToObject(assetsArray: Object[] = []): Object {
  return assetsArray.reduce((memo, asset) => {
    memo[asset.symbol] = asset;
    return memo;
  }, {});
}
