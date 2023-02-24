// Partial definitions of types for react-redux from flow-typed repository

declare module "react-redux" {
  declare export function useDispatch<D>(): D;

  declare export function useSelector<S, SS>(
    selector: (state: S) => SS,
    equalityFn?: (a: SS, b: SS) => boolean,
  ): SS;

  declare export function useStore<Store>(): Store;

  declare export var Provider: any;
  declare export var createProvider: any;
  declare export var connect: any;
  declare export var connectAdvanced: any;
  declare export var batch: any;

  declare export default {
    Provider: typeof Provider,
    createProvider: typeof createProvider,
    connect: typeof connect,
    connectAdvanced: typeof connectAdvanced,
    useDispatch: typeof useDispatch,
    useSelector: typeof useSelector,
    useStore: typeof useStore,
    batch: typeof batch,
    ...
  };
}
