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

import React, { useContext } from 'react';
import type { Node as ReactNode } from 'react';
import { Keyboard } from 'react-native';

export type ModalOptions = {|
  render: () => ReactNode,
|}

type ModalState = {|
  ...ModalOptions,
  id: string,
  openedAt: Date,
|};

// `pending` is null, except for the case when ModalProvider is in process of
// closing all visible modals. While that happens, other open/close operations
// should be performed on the `pending` array. Afterwards, all modals from
// `pending` are moved to `stack` to be rendered.

type State = {|
  stack: ModalState[],
  pending: null | ModalState[],
|};

type ModalInstance = {
  closeRNModal: () => Promise<void>,
};

const ModalStackContext = React.createContext<ModalState[]>([]);
const ModalNextIndexContext = React.createContext<number>(0);

export const EMPTY_MODAL_ID = 'default value for modal id context';
export const ModalIdContext = React.createContext<string>(EMPTY_MODAL_ID);

export const ModalStack = () => {
  const stack = useContext(ModalStackContext);
  const index = useContext(ModalNextIndexContext);
  const options = stack[index];

  return (index < stack.length ? (
    <ModalNextIndexContext.Provider value={index + 1}>
      <ModalIdContext.Provider value={options.id}>
        {options.render()}
      </ModalIdContext.Provider>
    </ModalNextIndexContext.Provider>
  ) : null);
};

class ModalProvider extends React.Component<{||}, State> {
  static _activeInstance: ModalProvider | null = null;
  static getInstance(): ModalProvider | null {
    return this._activeInstance;
  }

  state: State = {
    stack: [],
    pending: null,
  }

  _idCounter = 0;
  modalInstances: Map<string, ModalInstance> = new Map();

  componentDidMount() {
    if (ModalProvider._activeInstance === null) {
      ModalProvider._activeInstance = this;
    }
  }

  componentWillUnmount() {
    if (ModalProvider._activeInstance === this) {
      ModalProvider._activeInstance = null;
    }
  }

  open: (options: ModalOptions) => void = (options: ModalOptions) => {
    const id = (this._idCounter++).toString();
    const fullOptions = {
      ...options,
      id,
      openedAt: new Date(),
    };

    this.setState(({ stack, pending }) =>
      pending === null
        ? { stack: [...stack, fullOptions] }
        : { pending: [...pending, fullOptions] },
    );
  }

  close: (id: string) => void = (id: string) => {
    const matchModal = ({ id: _id }) => _id === id;

    if (this.state.pending !== null) {
      this.setState(({ pending }) => ({
        pending: pending && pending.filter(m => !matchModal(m)),
      }));

      return;
    }

    const index = this.state.stack.findIndex(matchModal);
    const instance = this.modalInstances.get(id);
    if (!instance || index === -1) return;

    (async () => {
      Keyboard.dismiss();

      // If this is the modal on top of the stack, close with animation before
      // removing from state. The other case shouldn't happen, so while we make
      // sure the proper element was removed from stack array, there is no
      // special handling.
      if (index === this.state.stack.length - 1) {
        await instance.closeRNModal();
      }

      this.setState(({ stack }) => ({
        stack: stack.filter(m => !matchModal(m)),
      }));
    })();
  }

  closeAll = () => {
    const now = new Date();

    // In case closeAll was called because of a navigation event, it might have
    // happened after the destination screen was rendered with a different modal,
    // so modals opened right before this moment are ignored.
    const wasJustOpened = ({ openedAt }) => now - openedAt < 100;

    this.setState(({ stack, pending }) => pending === null ? ({
      stack: stack.filter(m => !wasJustOpened(m)),
      pending: stack.filter(wasJustOpened),
    }) : {
      stack,
      pending: pending.filter(wasJustOpened),
    }, async () => {
      await Promise.all(this.state.stack.map(({ id }) => {
        const modal = this.modalInstances.get(id);
        return modal && modal.closeRNModal();
      }));

      this.setState(({ stack, pending }) => ({
        stack: pending ?? stack,
        pending: null,
      }));
    });
  }

  render() {
    return (
      <ModalStackContext.Provider value={this.state.stack}>
        <ModalNextIndexContext.Provider value={0}>
          <ModalStack />
        </ModalNextIndexContext.Provider>
      </ModalStackContext.Provider>
    );
  }
}

export default ModalProvider;
