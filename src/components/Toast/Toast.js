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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components/native';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import t from 'translations/translate';

// Utils
import { noop } from 'utils/common';

// Services
import { emailSupport } from 'services/emailSupport';

// Local
import ToastCard from './ToastCard';
import AnimatedToastList from './AnimatedToastList';

import type { Props as CardProps } from './ToastCard';

type ToastOptions = {|
  autoClose?: boolean,
  onPress?: () => void,
  onClose?: () => void,
  emoji: string,
  message: string,
  supportLink?: boolean,
  link?: string,
  onLinkPress?: () => void,
|};

type ToastItem = {
  id: string,
  data: $Exact<CardProps>,
};

// Meant to be 'symbol', which is supported from flow 0.114.0
type ProviderId = $FlowFixMe;

type Instance = {
  show: (toast: ToastItem, options?: { noAnimation?: boolean }) => void;
  close: (id: string) => void;
  closeAll: () => void;
  getToasts: () => ToastItem[];
  +id: ProviderId,
};

type ListUpdate = ToastItem[] | ((prev: ToastItem[]) => ToastItem[]);

const AUTOCLOSE_DELAY = 2000;
const goToSupport = () => emailSupport();

export default class Toast {
  static _toastInstances: Instance[] = [];
  static _lastToastId = 0;
  static _justShownIds = new Set<string>();

  static _getTopInstance = (): ?Instance => Toast._toastInstances[Toast._toastInstances.length - 1];

  static addProvider = (provider: Instance) => Toast._toastInstances.push(provider);

  static removeProvider = (providerId: ProviderId) => {
    const instance = Toast._toastInstances.find(({ id }) => id === providerId);
    if (!instance) return;

    Toast._toastInstances.splice(Toast._toastInstances.indexOf(instance), 1);
    const toasts = instance.getToasts();
    const nextInstance = Toast._getTopInstance();

    if (nextInstance) {
      toasts.forEach(toast => {
        const noAnimation = !Toast._justShownIds.has(toast.id);
        nextInstance.show(toast, { noAnimation });
      });
    } else {
      toasts.forEach(({ data: { onClose = noop } }) => onClose());
    }
  }

  static show = (options: ToastOptions): string | null => {
    const instance = Toast._getTopInstance();

    if (instance) {
      const {
        link,
        onLinkPress,
        supportLink,
        autoClose = true,
        ...rest
      } = options;

      const id = (++Toast._lastToastId).toString();

      Toast._justShownIds.add(id);
      requestAnimationFrame(() => {
        Toast._justShownIds.delete(id);
      });

      const linkProps = supportLink ? {
        link: t('label.contactSupport'),
        onLinkPress: goToSupport,
      } : {
        link,
        onLinkPress,
      };

      instance.show({
        id,
        data: {
          ...linkProps,
          ...rest,
        },
      });

      if (autoClose) {
        setTimeout(() => Toast.close(id), AUTOCLOSE_DELAY);
      }

      return id;
    }

    return null;
  };

  static close = (id: string) => Toast._toastInstances.forEach(instance => instance.close(id));
  static closeAll = () => Toast._toastInstances.forEach(instance => instance.closeAll());
  static isVisible = () => Toast._toastInstances.some(instance => instance.getToasts().length > 0);
}

export const ToastProvider = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isAnimationDisabled, setAnimationDisabled] = useState(false);

  // Because sometimes the compoment unmounts with a closing modal before the
  // render function is re-run, we keep a synced copy of the array in order not
  // to miss any toast. This also ensures the isAnimationDisabled flag is always reset.
  const toastCopy = useRef<ToastItem[]>(toasts);

  const updateToasts = useCallback((update: ListUpdate, noAnimation = false) => {
    if (typeof update === 'function') {
      toastCopy.current = update(toastCopy.current);
    } else {
      toastCopy.current = update;
    }

    setAnimationDisabled(noAnimation);
    setToasts(update);
  }, []);

  const instance = useRef<Instance>({
    show: noop,
    close: noop,
    closeAll: noop,
    getToasts: () => toastCopy.current,
    id: Symbol('ToastProvider instance id'),
  });

  instance.current.show = useCallback((toast: ToastItem, { noAnimation = false } = {}) => {
    updateToasts(prev => [toast, ...prev], noAnimation);
  }, [updateToasts]);

  const close = useCallback((targetId: string) => {
    const toast = toasts.find(({ id }) => id === targetId);
    if (toast) {
      updateToasts(prev => prev.filter(({ id }) => id !== targetId));
      if (toast.data.onClose) toast.data.onClose();
    }
  }, [toasts, updateToasts]);
  instance.current.close = close;

  instance.current.closeAll = useCallback(() => {
    updateToasts([]);
    toasts.forEach(({ data: { onClose = noop } }) => onClose());
  }, [toasts, updateToasts]);

  useEffect(() => {
    const providerId = instance.current.id;

    // This proxy ensures that the identities of the instance and its methods
    // available on outside are stable.
    const instanceWrapper: Instance = {
      show: (toast, options) => instance.current.show(toast, options),
      close: id => instance.current.close(id),
      closeAll: () => instance.current.closeAll(),
      getToasts: () => toastCopy.current,
      id: providerId,
    };

    Toast.addProvider(instanceWrapper);

    return () => {
      Toast.removeProvider(providerId);
    };
  }, []);

  const renderToast = useCallback(({ id, data: { onPress = noop, ...rest } }) => (
    <ToastCard
      key={id}
      {...rest}
      onPress={() => {
        close(id);
        onPress();
      }}
      onClose={() => close(id)}
    />
  ), [close]);

  return (
    <ToastsWrapper
      forceInset={{ top: 'always', bottom: 'never' }}
      statusBarHeight={StatusBar.currentHeight}
    >
      <AnimatedToastList
        items={toasts}
        renderItem={renderToast}
        onSwipeDismiss={close}
        noAnimation={isAnimationDisabled}
      />
    </ToastsWrapper>
  );
};

const ToastsWrapper = styled(SafeAreaView)`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 1000;
  margin-top: ${({ statusBarHeight = 0 }) => statusBarHeight + 20}px;
  padding: 0px 20px;
`;
