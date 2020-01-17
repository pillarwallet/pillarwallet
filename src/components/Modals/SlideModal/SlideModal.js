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
import Modal from 'react-native-modal';
import styled, { withTheme } from 'styled-components/native';
import Header from 'components/Header';
import Root from 'components/Root';
import Toast from 'components/Toast';
import { Wrapper } from 'components/Layout';
import { spacing } from 'utils/variables';
import { SubTitle } from 'components/Typography';
import { Keyboard } from 'react-native';
import { getThemeColors, themedColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

export type ScrollToProps = {
  x?: number,
  y: number,
  animated: boolean,
}

type Props = {
  title?: string,
  fullWidthTitle?: boolean,
  noBlueDotOnTitle?: boolean,
  dotColor?: string,
  children?: React.Node,
  subtitle?: string,
  fullScreenComponent?: ?React.Node,
  onModalHide?: Function,
  onModalHidden?: Function,
  onModalShow?: Function,
  noClose?: boolean,
  fullScreen?: boolean,
  isVisible: boolean,
  showHeader?: boolean,
  centerTitle?: boolean,
  noWrapTitle?: boolean,
  backgroundColor?: string,
  avoidKeyboard?: boolean,
  eventDetail?: boolean,
  eventType?: string,
  eventData?: ?Object,
  scrollOffset?: ?number,
  subtitleStyles?: ?Object,
  titleStyles?: ?Object,
  noSwipeToDismiss?: boolean,
  scrollOffsetMax?: ?number,
  handleScrollTo?: (ScrollToProps) => void,
  onSwipeComplete?: () => void,
  theme: Theme,
};

const themes = {
  default: {
    padding: `0 ${spacing.rhythm}px`,
    borderRadius: '30px',
  },
  fullScreen: {
    padding: 0,
    borderRadius: 0,
  },
  eventDetail: {
    padding: 0,
    borderRadius: '30px',
    isTransparent: true,
  },
};

const getTheme = (props: Props) => {
  if (props.fullScreen) {
    return themes.fullScreen;
  }
  if (props.eventDetail) {
    return themes.eventDetail;
  }
  return themes.default;
};

const HeaderWrapper = styled.View`
  width: 100%;
`;

const ContentWrapper = styled.View`
  width: 100%;
  height: 100%;
  ${props => props.fullScreen ? 'padding-top: 20px;' : ''}
  ${props => props.bgColor && props.fullScreen ? `background-color: ${props.bgColor};` : ''}  
`;

const Backdrop = styled.TouchableWithoutFeedback`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
`;

const ModalBackground = styled.View`
  border-top-left-radius: ${props => props.customTheme.borderRadius};
  border-top-right-radius: ${props => props.customTheme.borderRadius};
  padding: ${props => props.customTheme.padding};
  box-shadow: 0px 2px 7px rgba(0,0,0,.1);
  elevation: 1;
  margin-top: auto;
  background-color: ${({ customTheme, theme }) => customTheme.isTransparent ? 'transparent' : theme.colors.card};
`;

const ModalSubtitle = styled(SubTitle)`
  padding: 10px 0;
  color: ${themedColors.primary};
`;

const getModalContentPadding = (showHeader: boolean) => {
  if (showHeader) {
    return '0';
  }
  return `${spacing.rhythm}px 0 0`;
};

const ModalContent = styled.View`
  flex-direction: column;
  ${({ fullScreen, showHeader }) => fullScreen && showHeader && `
    padding: ${getModalContentPadding(showHeader)};
  `}
  ${({ fullScreen }) => fullScreen && `
    flex: 1;
  `}
`;

const ModalOverflow = styled.View`
  width: 100%;
  height: 100px;
  margin-bottom: -100px;
  background-color: ${themedColors.card};
`;

class SlideModal extends React.Component<Props, *> {
  static defaultProps = {
    fullScreenComponent: null,
    subtitleStyles: {},
    titleStyles: {},
  };

  hideModal = () => {
    const { onSwipeComplete } = this.props;
    Keyboard.dismiss();
    const TIMEOUT = Toast.isVisible() ? 150 : 0;
    if (Toast.isVisible()) {
      Toast.close();
    }
    const timer = setTimeout(() => {
      if (this.props.onModalHide) {
        this.props.onModalHide();
      }
      clearTimeout(timer);
    }, TIMEOUT);
    if (onSwipeComplete) onSwipeComplete();
  };

  handleScroll = (p: ScrollToProps) => {
    const { handleScrollTo } = this.props;
    if (Toast.isVisible()) {
      Toast.close();
    }
    if (handleScrollTo) handleScrollTo(p);
  };

  render() {
    const {
      children,
      title,
      fullWidthTitle,
      noBlueDotOnTitle,
      dotColor,
      fullScreenComponent,
      onModalHidden,
      onModalShow,
      noClose,
      fullScreen,
      subtitle,
      isVisible,
      showHeader,
      centerTitle,
      noWrapTitle,
      backgroundColor: bgColor,
      avoidKeyboard,
      eventDetail,
      scrollOffset,
      subtitleStyles,
      titleStyles,
      noSwipeToDismiss,
      scrollOffsetMax,
      theme,
    } = this.props;

    const customTheme = getTheme(this.props);
    const colors = getThemeColors(theme);
    const backgroundColor = bgColor || colors.surface;

    const showModalHeader = !fullScreen || showHeader;

    const modalInner = (
      <React.Fragment>
        {showModalHeader &&
          <HeaderWrapper>
            <Header
              noMargin={!fullScreen}
              centerTitle={centerTitle}
              noWrapTitle={noWrapTitle}
              noPadding={!fullScreen}
              title={title}
              titleStyles={titleStyles}
              fullWidthTitle={fullWidthTitle}
              noBlueDotOnTitle={noBlueDotOnTitle || !title}
              dotColor={dotColor}
              onClose={!noClose ? this.hideModal : () => {}}
              noClose={noClose}
            />
          </HeaderWrapper>
        }
        {subtitle &&
          <ModalSubtitle
            style={subtitleStyles}
          >
            {subtitle}
          </ModalSubtitle>
        }
        <ModalContent
          fullScreen={fullScreen}
          showHeader={showHeader}
        >
          {children}
        </ModalContent>
        <ModalOverflow />
      </React.Fragment>
    );


    const modalContent = () => {
      if (fullScreen) {
        return (
          <Wrapper fullScreen>
            {modalInner}
          </Wrapper>
        );
      }

      if (eventDetail) {
        return (
          <ModalBackground customTheme={customTheme}>
            { children }
          </ModalBackground>
        );
      }

      return (
        <ModalBackground customTheme={customTheme}>
          { modalInner }
        </ModalBackground>
      );
    };

    const animationTiming = 400;
    return (
      <Modal
        isVisible={isVisible}
        scrollTo={this.handleScroll}
        onSwipeComplete={this.hideModal}
        onModalHide={onModalHidden}
        onModalShow={onModalShow}
        onBackdropPress={this.hideModal}
        backdropOpacity={fullScreen ? 1 : 0.7}
        backdropColor={fullScreen ? backgroundColor : '#000000'}
        onBackButtonPress={this.hideModal}
        animationInTiming={animationTiming}
        animationOutTiming={animationTiming}
        scrollOffset={scrollOffset}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        swipeDirection={!noSwipeToDismiss ? 'down' : null}
        avoidKeyboard={avoidKeyboard}
        scrollOffsetMax={scrollOffsetMax}
        style={{
          margin: 0,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Root>
          <ContentWrapper fullScreen={fullScreen} bgColor={backgroundColor}>
            {!fullScreen &&
              <Backdrop onPress={this.hideModal}>
                <ContentWrapper />
              </Backdrop>
            }
            {modalContent()}
          </ContentWrapper>
        </Root>
        {isVisible && fullScreenComponent}
      </Modal>
    );
  }
}

export default withTheme(SlideModal);
