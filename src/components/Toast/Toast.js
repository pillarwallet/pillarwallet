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
import Intercom from 'react-native-intercom';
import t from 'translations/translate';

import { noop } from 'utils/common';

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

type Instance = {
  show: (options: ToastItem) => void;
  close: (id: string) => void;
  closeAll: () => void;
  count: () => number;
};

const AUTOCLOSE_DELAY = 2000;

const ToastsWrapper = styled(SafeAreaView)`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 1000;
  margin-top: ${({ statusBarHeight = 0 }) => statusBarHeight}px;
  padding: 40px 20px;
`;

const toastInstances: Instance[] = [];

const Toast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const instance = useRef<Instance>({
    show: noop,
    close: noop,
    closeAll: noop,
    count: () => 0,
  });

  instance.current.show = useCallback((toast: ToastItem) => setToasts(prev => [toast, ...prev]), []);

  const close = useCallback((targetId: string) => {
    const toast = toasts.find(({ id }) => id === targetId);
    if (toast) {
      setToasts(prev => prev.filter(({ id }) => id !== targetId));
      if (toast.data.onClose) toast.data.onClose();
    }
  }, [toasts]);
  instance.current.close = close;

  instance.current.closeAll = useCallback(() => {
    setToasts([]);
    toasts.forEach(({ data: { onClose = noop } }) => onClose());
  }, [toasts]);

  instance.current.count = useCallback(() => toasts.length, [toasts.length]);

  useEffect(() => {
    // This proxy ensures that the identities of the instance and its methods
    // available on outside are stable.
    const instanceWrapper: Instance = {
      show: toast => instance.current.show(toast),
      close: id => instance.current.close(id),
      closeAll: () => instance.current.closeAll(),
      count: () => instance.current.count(),
    };

    toastInstances.push(instanceWrapper);

    return () => {
      const index = toastInstances.indexOf(instanceWrapper);
      if (index !== -1) toastInstances.splice(index, 1);
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
      />
    </ToastsWrapper>
  );
};

const getTopInstance = (): ?Instance => toastInstances[toastInstances.length - 1];
const goToSupport = () => Intercom.displayMessenger();
const closeWithDelay = (id: string) => setTimeout(() => Toast.close(id), AUTOCLOSE_DELAY);

let lastToastId = 0;

Toast.show = (options: ToastOptions): string | null => {
  const instance = getTopInstance();

  if (instance) {
    const {
      link,
      onLinkPress,
      supportLink,
      autoClose = false,
      ...rest
    } = options;

    const id = (++lastToastId).toString();

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

    if (autoClose) closeWithDelay(id);
    return id;
  }

  return null;
};

Toast.close = (id: string) => toastInstances.forEach(instance => instance.close(id));
Toast.closeAll = () => toastInstances.forEach(instance => instance.closeAll());
Toast.isVisible = () => toastInstances.some(instance => instance.count() > 0);

export default Toast;
