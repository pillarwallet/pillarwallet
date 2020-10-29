# Modals

## Basic usage: `Modal.open()`

To open a modal, call `Modal.open(render)`, where `render` is a function that
returns a `React.Node`.

The root component of the result should be `<Modal>` imported from `components/Modal`.
It can be indirect. For example, if `<BoxModal>` is defined as

```js
const BoxModal = () => (
  <Modal> ... </Modal>
);
```

then calling `Modal.open(() => <BoxModal />)` will work as intended.

## `Modal.closeAll()`

Will close visible modals and queue any new ones to display after the animation
completes.

## Creating new modals

The component from `./Modal` should be used as the main wrapper for any modal.
It renders `react-native-modal` and passes through most of its props, but does
not take `isVisible`. The assumption is that modals become visible when they
get included in the component tree, on calling `Modal.open`, and stay that way
until they're closed and removed from the stack.

It's important to note that props passed in the render function given
to `Modal.open` won't be updated on later re-renders of the parent component.
If the content inside the modal should update in response to Redux actions, the
modal component itself should be wrapped with `connect`. Likewise, if there are
stateful elements in the modal (e.g. toggles, text inputs) then this state
should also be defined in the modal, not the parent.

`<Modal>` instance can be closed by calling `.close()` on a ref passed to it.
Expanding the example above, a modal that closes itself on a button press would
look like this:

```js
const BoxModal = () => {
  const ref = useRef();

  return (
    <Modal ref={ref}>
      <Button onPress={() => ref.current?.close()} />
    </Modal>
  );
};
```

## Implementation

`ModalProvider` is another part aside from the `Modal` class that makes modals
work. Modals are organized in a stack. `ModalProvider` is responsible for
keeping track of modals on the stack and rendering them, which is why it's
necessary for it to be included somewhere in the application.

There should be only one instance of `<ModalProvider>` rendered at a time. It's
not possible to show modals in two separate places simultaneously, so any
additional ones are ignored.

The "public" `modal.close` function doesn't close the modal directly - instead
it's redirected to the `<ModalProvider>` instance, which updates the stack and
calls the inner one (`modal.closeRNModal`).

In order to display multiple modals one over another, each modal on the stack
needs to be rendered as a child of the one before it. At the same time, any
component that wants to render as a modal should have the ability to set the
props of `<Modal>` directly to have control over layout and scrollable content.

To deal with those constraints, `<ModalProvider>` passes the needed extra data
via context. It's divided into three parts:

- `ModalStackContext`: an array with all open modals
- `ModalNextIndexContext`: where in the stack is the next modal to render
- `ModalIdContext`: the id of the current modal (when asking to be closed,
  a modal needs a way to identify itself to its `ModalProvider`)

`ModalStackContext` is set at the root of `<ModalProvider>` and stays the same
for all modals.

The `<ModalStack>` helper renders the "rest" of the stack and advances the
index kept in `ModalNextIndexContext`. It's included in `<ModalProvider>` to
start rendering modals and in each `<Modal>` to enable the recursion.

Some of the complexity of `ModalProvider`'s state is due to the order of
navigation event notification and screen changes, which would otherwise cause
problems with modals opened on entering a screen (e.g. the introduction overlay
on the Exchange screen).
