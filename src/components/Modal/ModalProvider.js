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

import React, { useContext, useCallback } from 'react';

import type { Node as ReactNode } from 'react';

export type ModalOptions = {
  render: () => ReactNode,
};

type ProviderState = {
  stack: ModalOptions[],
};

const ModalStackContext = React.createContext<ModalOptions[]>([]);
const ModalNextIndexContext = React.createContext<number>(0);
const ModalStackCloseContext = React.createContext<(index: number) => void>(() => {});
export const ModalCloseContext = React.createContext<() => void>(() => {});

export const ModalStack = () => {
  const stack = useContext(ModalStackContext);
  const index = useContext(ModalNextIndexContext);
  const closeInStack = useContext(ModalStackCloseContext);
  const close = useCallback(() => closeInStack(index), [closeInStack, index]);

  return (index < stack.length ? (
    <ModalNextIndexContext.Provider value={index + 1}>
      <ModalCloseContext.Provider value={close}>
        {stack[index].render()}
      </ModalCloseContext.Provider>
    </ModalNextIndexContext.Provider>
  ) : null);
};

class ModalProvider extends React.Component<{}, ProviderState> {
  static _instances: ModalProvider[] = [];
  static _topInstance: ModalProvider | null;

  static getTopInstance(): ModalProvider | null {
    const len = ModalProvider._instances.length;
    return len === 0 ? null : ModalProvider._instances[len - 1] ?? null;
  }

  state = {
    stack: [],
  }

  open = (options: ModalOptions) => {
    this.setState({ stack: [...this.state.stack, options] });
  }

  close = (index: number) => {
    const { stack } = this.state;

    if (stack.length > 0) {
      this.setState({
        stack: stack.slice(0, index).concat(stack.slice(index + 1)),
      });
    }
  }

  componentDidMount() {
    ModalProvider._instances.push(this);
  }

  componentWillUnmount() {
    const selfIndex = ModalProvider._instances.indexOf(this);
    if (selfIndex !== -1) {
      ModalProvider._instances.splice(selfIndex, 1);
    }
  }

  render() {
    return (
      <ModalStackCloseContext.Provider value={this.close}>
        <ModalStackContext.Provider value={this.state.stack}>
          <ModalNextIndexContext.Provider value={0}>
            <ModalStack />
          </ModalNextIndexContext.Provider>
        </ModalStackContext.Provider>
      </ModalStackCloseContext.Provider>
    );
  }
}

export default ModalProvider;
