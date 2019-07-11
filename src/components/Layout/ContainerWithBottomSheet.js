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
import * as React from 'react';
import { StatusBar } from 'react-native';
import styled from 'styled-components/native';
import isEqual from 'lodash.isequal';
import BottomSheet from '../BottomSheet';
import { ContainerOuter, ContainerInner } from './Layout';

type Props = {
  children?: React.Node,
  center?: boolean,
  color?: string,
  style?: Object,
  inset?: Object,
  onLayout?: Function,
  innerStyle?: Object,
  bottomSheetChildren: React.Node,
  bottomSheetProps?: Object,
  hideSheet?: boolean,
};

type State = {
  screenHeight: number,
  constantScreenHeight: number,
};

export const Center = styled.View`
  align-items: center;
`;

export default class ContainerWithBottomSheet extends React.Component<Props, State> {
  sheetHeaderHeight: number;
  constructor(props: Props) {
    super(props);
    this.sheetHeaderHeight = 0;
    this.state = {
      screenHeight: 0,
      constantScreenHeight: 0,
    };
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  render() {
    const {
      inset = {},
      color,
      style,
      center,
      children,
      bottomSheetChildren,
      bottomSheetProps = {},
      hideSheet,
    } = this.props;

    const { screenHeight, constantScreenHeight } = this.state;
    const bottomPadding = !hideSheet && screenHeight && Object.keys(bottomSheetProps).length
    && !!bottomSheetProps.sheetHeight
      ? (bottomSheetProps.sheetHeight - 30)
      : 0;

    return (
      <ContainerOuter
        color={color}
        style={style}
        forceInset={{ top: 'always', ...inset }}
        androidStatusbarHeight={StatusBar.currentHeight}
      >
        <ContainerInner
          center={center}
          style={{ paddingBottom: bottomPadding + this.sheetHeaderHeight }}
          onLayout={(event) => {
            this.setState({ screenHeight: event.nativeEvent.layout.height });
            if (!constantScreenHeight) this.setState({ constantScreenHeight: event.nativeEvent.layout.height });
          }}
        >
          {children}
          {!!screenHeight && !hideSheet &&
          <BottomSheet
            {...bottomSheetProps}
            screenHeight={screenHeight}
            constantScreenHeight={constantScreenHeight}
            onHeaderLayout={(height) => { this.sheetHeaderHeight = height; }}
          >
            {bottomSheetChildren}
          </BottomSheet>
          }
        </ContainerInner>
      </ContainerOuter>
    );
  }
}
