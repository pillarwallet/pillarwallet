// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

// NOTE: This component is written with toasts in mind, and because of this:
// - it's not optimized for lists with large number of items;
// - while toasts have variable height depending on content, they're meant to
//   be small, so for the sake of simplicity the initial offset (above the top
//   of the screen) is hardcoded;
// - the chosen enter animation assumes new elements are always added to the
//   top of the list.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Node as ReactNode } from 'react';
import { Animated, Easing, View, PanResponder, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import omit from 'lodash.omit';

import { noop } from 'utils/common';
import { getChanges, hasChanges, applyAdditions } from './changes';

type Item<T> = {
  id: string,
  data: T,
};

type Props<T> = {
  items: Item<T>[],
  renderItem: (Item<T>) => ReactNode,
  onSwipeDismiss?: (id: string) => void,
  noAnimation?: boolean,
};

type Dict<T> = { [id: string]: T };

type AnimationInfo = {
  fade: Animated.Value,
  x: Animated.Value,
  y: Animated.Value,
  yTarget: number,
  panResponder: { panHandlers: $FlowFixMe },
  swiped: number,
}

type RenderedToasts<T> = {
  order: string[],
  data: Dict<T>,
};

const TOAST_GAP = 10;
const INITIAL_Y_OFFSET = -200;
const SWIPE_VELOCITY_THRESHOLD = 0.2;
const FADE_OUT_DURATION = 300;
const SWIPE_EXIT_DURATION = 100;

const positionSpringConfig = {
  speed: 15,
  bounciness: 6,
  useNativeDriver: true,
};

const positionDisabledConfig = {
  duration: 0,
  useNativeDriver: true,
};

const exitFadeConfig = {
  duration: FADE_OUT_DURATION,
  easing: Easing.out(Easing.exp),
  useNativeDriver: true,
};

const exitSwipeConfig = {
  duration: SWIPE_EXIT_DURATION,
  easing: Easing.linear,
  useNativeDriver: true,
};

const isSwipeGesture = ({ vx, dx }) =>
  Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD ||
    Math.abs(dx) > Dimensions.get('window').width / 2;

const defaultSwipeResponderOptions = {
  onStartShouldSetPanResponder: () => false,
  onStartShouldSetPanResponderCapture: () => false,
  onMoveShouldSetPanResponder: (_, { dx }) => Math.abs(dx) > 5,
  onMoveShouldSetPanResponderCapture: () => false,
  onPanResponderMove: noop,
  onPanResponderTerminationRequest: () => true,
  onPanResponderRelease: noop,
  onPanResponderTerminate: noop,
  onShouldBlockNativeResponder: () => true,
};

const updatedItemMap = <T>(items: Item<T>[], prev: Dict<T>): Dict<T> => {
  const update = {};
  let hasUpdate = false;
  items.forEach(({ id, data }) => {
    if (prev[id] !== data) {
      update[id] = data;
      hasUpdate = true;
    }
  });

  return hasUpdate ? { ...prev, ...update } : prev;
};

const ItemWrapper = Animated.createAnimatedComponent(styled.View`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`);

// Component state & auxillary data
//
// `items` prop is the array that drives all changes from the parent component
//
// `open` is an array of toast IDs. When `items` changes, it's compared against
// `open` to detect updates (see `getChanges`) and react to them by adjusting
// the rest of the state or run animations. Afterwards, `open` is updated to
// match the toasts in `items`, so it can be used for the next comparison. Only
// toasts in this array take up space and push others down.
//
// `rendered.data` is the component's own copy of the provided toast configs,
// kept so the contents of toasts that disappeared from `items` can still be
// rendered during the closing animation.
//
// `rendered.order` array holds the IDs of toasts visible on the screen at the
// moment. This includes the ones that were recently removed from `items` and
// are in the process of disapearing with animation. This is the array that is
// used in the rendering part of the component.
//
// These two objects are grouped together to ensure that the data of a toast
// listed in `rendered.order` is always available.
//
// `toastHeight` is a mapping from toast ID to its component height needed for
// layout, and is updated using the onLayout event.
//
// For every toast, `animation` holds an AnimationInfo object:
// - fade: used for the fade-out effect on exit
// - x: used for swipe gesture
// - y: all toasts are positioned manually, translates directly to the offset from
//     the top of the list
// - yTarget: at what offset the toast will end up when the animation finishes;
//     used to decide if `y` should be animated again
// - panResponder: result of PanResponder.create used to handle the swipe gesture
// - swiped: initially set to 0; after the toast is swiped, 1 or -1 depending
//     on swipe direction; the `onSwipeDismiss` callback in the parent
//     component is expected to remove the toast from the `items` array -
//     afterwards the value of this variable allows to determine if the toast's
//     removal should be animated before the data is deleted (0), or not (1/-1)
//
// Some additional values are kept in refs for use in callbacks, which
// otherwise would have to be recreated on every update.

const AnimatedToastList = <T>({
  items,
  renderItem,
  onSwipeDismiss,
  noAnimation = false,
}: Props<T>) => {
  const [open, setOpen] = useState<string[]>([]);
  const [rendered, setRendered] = useState<RenderedToasts<T>>({ order: [], data: {} });
  const [toastHeight, setToastHeight] = useState<Dict<number>>({});

  const animation = useRef<Dict<AnimationInfo>>({});
  const swipeDismissCallback = useRef<(id: string) => void>(noop);
  swipeDismissCallback.current = onSwipeDismiss ?? noop;
  const disableAnimation = useRef(noAnimation);
  disableAnimation.current = noAnimation;

  const cleanUpAfterExit = useCallback((id: string) => {
    delete animation.current[id];
    setRendered(prev => ({
      order: prev.order.filter(x => x !== id),
      data: omit(prev.data, id),
    }));
    setToastHeight(prev => omit(prev, id));
  }, []);

  const startFadeExitAnimation = useCallback((id: string) => {
    if (!animation.current[id]) return;
    Animated.timing(animation.current[id].fade, {
      toValue: 0,
      ...exitFadeConfig,
      ...(disableAnimation.current ? { duration: 0 } : {}),
    }).start(() => cleanUpAfterExit(id));
  }, [cleanUpAfterExit]);

  const setupAnimation = useCallback(({ id }) => {
    const initYValue = INITIAL_Y_OFFSET;
    const xPosition = new Animated.Value(0);

    const clearSwipe = () => {
      const transition = disableAnimation.current
        ? Animated.timing(xPosition, { toValue: 0, ...positionDisabledConfig })
        : Animated.spring(xPosition, { toValue: 0, ...positionSpringConfig });

      transition.start();
    };

    const finishSwipe = ({ vx, dx }) => {
      // NOTE: The original gestureState object may be mutated, so any values
      // used in callbacks need to be copied to local variables first.
      const swipeDirection = Math.sign(Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD ? vx : dx);

      Animated.timing(xPosition, {
        toValue: swipeDirection * Dimensions.get('window').width,
        ...exitSwipeConfig,
        ...(disableAnimation.current ? { duration: 0 } : {}),
      }).start(() => {
        // Make sure the toast hadn't been removed before the animation ended
        if (!animation.current[id]) return;
        animation.current[id].swiped = swipeDirection;
        swipeDismissCallback.current(id);
      });
    };

    const handleRelease = (_, gestureState) => {
      if (isSwipeGesture(gestureState)) {
        finishSwipe(gestureState);
      } else {
        clearSwipe();
      }
    };

    animation.current[id] = {
      fade: new Animated.Value(1),
      x: xPosition,
      y: new Animated.Value(initYValue),
      yTarget: initYValue,
      swiped: 0,
      panResponder: PanResponder.create({
        ...defaultSwipeResponderOptions,
        onPanResponderMove: Animated.event([null, { dx: xPosition }], { useNativeDriver: false }),
        onPanResponderRelease: handleRelease,
        onPanResponderTerminate: clearSwipe,
      }),
    };
  }, []);

  useEffect(() => {
    // Update new or changed toast data

    setRendered((prev: RenderedToasts<T>) => {
      const data = updatedItemMap(items, prev.data);
      return prev.data === data ? prev : { ...prev, data };
    });
  }, [items]);

  useEffect(() => {
    // Handle toast insertions and removals

    const itemIds = items.map(({ id }) => id);
    const changes = getChanges(open, itemIds);
    if (!hasChanges(changes)) return;

    changes.add.forEach(setupAnimation);
    changes.remove.forEach(({ id }) => {
      if (animation.current[id].swiped) {
        cleanUpAfterExit(id);
      } else {
        startFadeExitAnimation(id);
      }
    });

    setOpen(itemIds);
    if (changes.add.length > 0) {
      setRendered(prev => ({
        order: applyAdditions(prev.order, changes.add),
        data: updatedItemMap(items, prev.data),
      }));
    }
  }, [items, open, setupAnimation, startFadeExitAnimation, cleanUpAfterExit]);

  useEffect(() => {
    // Recalculate toast positions

    let y = 0;
    open.filter(id => id in toastHeight).forEach(id => {
      const anim = animation.current[id];

      if (anim && y !== anim.yTarget) {
        anim.yTarget = y;
        anim.y.stopAnimation(() => {
          const transition = disableAnimation.current
            ? Animated.timing(anim.y, { toValue: y, ...positionDisabledConfig })
            : Animated.spring(anim.y, { toValue: y, ...positionSpringConfig });

          transition.start();
        });
      }

      y += toastHeight[id] + TOAST_GAP;
    });
  }, [open, toastHeight]);

  // Without setting the height manually, the wrapper View collapses to 0
  // because all of its children are absolutely positioned, and on Android the
  // toasts stop reacting to touches.
  const totalHeight = open.length > 0
    ? open.map(id => toastHeight[id] ?? 0).reduce((x, y) => x + y + TOAST_GAP)
    : 0;

  return (
    <View style={{ height: totalHeight }}>
      {[...rendered.order].reverse().map(id => {
        const {
          fade,
          x,
          y,
          panResponder,
        } = animation.current[id];

        const updateToastHeight = ({ nativeEvent: { layout: { height } } }) => {
          const next = Math.ceil(height);
          if (toastHeight[id] !== next) {
            setToastHeight(prev => ({ ...prev, [id]: next }));
          }
        };

        return (
          <ItemWrapper
            key={id}
            onLayout={updateToastHeight}
            {...panResponder.panHandlers}
            style={{
              opacity: fade,
              transform: [
                { translateX: x },
                { translateY: y },
              ],
            }}
          >
            {renderItem({ id, data: rendered.data[id] })}
          </ItemWrapper>
        );
      })}
    </View>
  );
};

export default AnimatedToastList;
