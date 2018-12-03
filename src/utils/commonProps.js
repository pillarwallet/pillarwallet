// @flow

export const scrollShadowProps = (thisClass: Object, stateKey: string) => ({
  onScrollBeginDrag: () => { thisClass.setState({ [stateKey]: true }); },
  onScrollEndDrag: (e: Object) => { thisClass.setState({ [stateKey]: !!e.nativeEvent.contentOffset.y }); },
  onMomentumScrollEnd: (e: Object) => { thisClass.setState({ [stateKey]: !!e.nativeEvent.contentOffset.y }); },
});
