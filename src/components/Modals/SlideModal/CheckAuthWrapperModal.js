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

// CheckAuthWrapperModal is a copy of the old version of <SlideModal>
// (controlled by isVisible prop) with unused and unchanging props removed.
//
// (old) <SlideMedal> props with constant values were:
// {
//   centerTitle: true,
//   showHeader: true,
//   fullScreen: true,
// }
//
// Can be deleted after <CheckAuth> is refactored to use the new modal mechanism.

import * as React from 'react';
import Modal from 'react-native-modal';
import styled, { withTheme } from 'styled-components/native';
import Root from 'components/Root';
import Toast from 'components/Toast';
import { Wrapper } from 'components/legacy/Layout';
import HeaderBlock from 'components/HeaderBlock';
import { Keyboard } from 'react-native';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

export type ScrollToProps = {
  x?: number,
  y: number,
  animated: boolean,
}

type Props = {|
  title?: string,
  children?: React.Node,
  onModalHide?: Function,
  isVisible: boolean,
  theme: Theme,
|};

const ContentWrapper = styled.View`
  width: 100%;
  height: 100%;
  padding-top: 20px;
  background-color: ${({ theme }) => theme.colors.basic070};
`;

const ModalContent = styled.View`
  flex-direction: column;
  flex: 1;
  padding: 0;
`;

const ModalOverflow = styled.View`
  width: 100%;
  height: 100px;
  margin-bottom: -100px;
  background-color: ${({ theme }) => theme.colors.basic050};
`;

class CheckAuthWrapperModal extends React.Component<Props, *> {
  constructor(props) {
    super(props);
    this.state = {
      contentHeight: 0,
    };
  }

  hideModal = () => {
    Keyboard.dismiss();
    const TIMEOUT = Toast.isVisible() ? 150 : 0;
    if (Toast.isVisible()) {
      Toast.closeAll();
    }
    const timer = setTimeout(() => {
      if (this.props.onModalHide) {
        this.props.onModalHide();
      }
      clearTimeout(timer);
    }, TIMEOUT);
  };

  onModalBoxLayout = (event) => {
    const height = event.nativeEvent?.layout?.height || 0;
    if (this.state.contentHeight !== height) {
      this.setState({
        contentHeight: height,
      });
    }
  }

  render() {
    const {
      children,
      title,
      isVisible,
      theme,
    } = this.props;

    const colors = getThemeColors(theme);

    const modalInner = (
      <React.Fragment>
        <HeaderBlock
          leftItems={[]}
          centerItems={[{ title }]}
          rightItems={[{ close: true }]}
          noPaddingTop
          onClose={this.hideModal}
          wrapperStyle={{ backgroundColor: 'transparent' }}
          noBack
          forceInsetTop="never" // eslint-disable-line i18next/no-literal-string
        />
        <ModalContent>
          {children}
        </ModalContent>
        <ModalOverflow />
      </React.Fragment>
    );

    const animationTiming = 400;
    return (
      <Modal
        isVisible={isVisible}
        onSwipeComplete={this.hideModal}
        onBackdropPress={this.hideModal}
        backdropOpacity={1}
        backdropColor={colors.basic070}
        onBackButtonPress={this.hideModal}
        animationInTiming={animationTiming}
        animationOutTiming={animationTiming}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        swipeDirection="down"
        style={{
          margin: 0,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Root>
          <ContentWrapper>
            <Wrapper onLayout={this.onModalBoxLayout} fullScreen>
              {modalInner}
            </Wrapper>
          </ContentWrapper>
        </Root>
      </Modal>
    );
  }
}

export default (withTheme(CheckAuthWrapperModal): React.AbstractComponent<$Diff<Props, { theme: Theme }>>);
