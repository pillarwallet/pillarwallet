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
import type { Node as ReactNode } from 'react';
import styled, { withTheme } from 'styled-components/native';
import { Dimensions } from 'react-native';
import type { LayoutEvent } from 'react-native/Libraries/Types/CoreEventTypes';
import isEmpty from 'lodash.isempty';
import pick from 'lodash.pick';

// Components
import Modal from 'components/Modal';
import { Wrapper } from 'components/legacy/Layout';
import HeaderBlock from 'components/HeaderBlock';

// Utils
import { spacing } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { getDeviceHeightWithoutNotch } from 'utils/common';

// Types
import type { ScrollToProps } from 'components/Modal';
import type { Theme } from 'models/Theme';
import type { OwnProps as HeaderProps } from 'components/HeaderBlock';

export type { ScrollToProps } from 'components/Modal';

type ModalProps = {|
  onModalWillHide?: () => void,
  onModalHide?: () => void,
  onModalShow?: () => void,
  avoidKeyboard?: boolean,
  scrollOffset?: number,
  scrollOffsetMax?: number,
  scrollTo?: (_: ScrollToProps) => void,
|};

type OwnProps = {|
  ...ModalProps,
  title?: string,
  children?: ReactNode,
  noClose?: boolean,
  fullScreen?: boolean,
  showHeader?: boolean,
  hideHeader?: boolean,
  centerTitle?: boolean,
  centerFloatingItem?: ReactNode,
  backgroundColor?: string,
  eventDetail?: boolean,
  noSwipeToDismiss?: boolean,
  noPadding?: boolean,
  headerLeftItems?: $PropertyType<HeaderProps, 'leftItems'>,
  sideMargins?: number,
  noTopPadding?: boolean,
  headerProps?: HeaderProps,
  insetTop?: boolean,
  onDismiss?: () => mixed,
  closeFlag?: boolean,
  fillHeight?: boolean,
  isSwipeClose?: boolean,
|};

type Props = {|
  ...OwnProps,
  theme: Theme,
|};

type State = {|
  contentHeight: number,
|};

const themes = {
  default: {
    padding: `0 ${spacing.layoutSides}px`,
    borderRadius: '30px',
  },
  fullScreen: {
    padding: 0,
    borderRadius: 0,
  },
  eventDetail: {
    padding: 0,
    borderRadius: '30px',
  },
  noPadding: {
    padding: 0,
    borderRadius: '30px',
  },
};

const getTheme = (props: Props) => {
  if (props.fullScreen) {
    return themes.fullScreen;
  }
  if (props.eventDetail) {
    return themes.eventDetail;
  }
  if (props.noPadding) {
    return themes.noPadding;
  }
  return themes.default;
};

class SlideModal extends React.Component<Props, State> {
  _modalRef = React.createRef<Modal>();

  state = {
    contentHeight: 0,
  };

  close: () => void = () => {
    this._modalRef.current?.close();
  };

  onModalBoxLayout = (event: LayoutEvent) => {
    const height = event.nativeEvent?.layout?.height || 0;
    if (this.state.contentHeight !== height) {
      this.setState({
        contentHeight: height,
      });
    }
  };

  handleDismiss = () => {
    this.props.onDismiss?.();
    this.close();
  };

  render() {
    const {
      children,
      title,
      noClose,
      fullScreen,
      showHeader,
      hideHeader,
      centerTitle,
      backgroundColor: bgColor,
      eventDetail,
      noSwipeToDismiss,
      theme,
      noPadding,
      headerLeftItems,
      sideMargins,
      noTopPadding,
      headerProps = {},
      insetTop,
      centerFloatingItem,
      closeFlag = false,
      fillHeight,
      isSwipeClose,
    } = this.props;

    const customTheme = getTheme(this.props);
    const colors = getThemeColors(theme);
    const backgroundColor = bgColor || colors.basic070;
    const { height } = Dimensions.get('window');

    const showModalHeader = ((!fullScreen || showHeader) && !hideHeader) || !isEmpty(headerProps);
    let leftItems = [];
    const centerItems = centerTitle ? [{ title }] : [];
    const rightItems = [
      {
        close: !noClose,
      },
    ];
    if (!centerTitle) {
      leftItems.push({ title });
    }
    if (headerLeftItems) {
      leftItems = [...leftItems, ...headerLeftItems];
    }

    if (closeFlag) this.handleDismiss();

    const handleBar = showModalHeader && !fullScreen && <HandleBar />;

    const header = (
      <>
        {!!showModalHeader && (
          // $FlowFixMe: flow update to 0.122
          <HeaderBlock
            leftItems={leftItems}
            centerItems={centerItems}
            rightItems={rightItems}
            noPaddingTop
            onClose={this.handleDismiss}
            wrapperStyle={{ backgroundColor: 'transparent' }}
            noHorizontalPadding={!fullScreen && !noPadding}
            leftSideFlex={centerTitle ? undefined : 4}
            noBack
            forceInsetTop={insetTop ? 'always' : 'never'} // eslint-disable-line i18next/no-literal-string
            {...headerProps}
          />
        )}

        {!showModalHeader && !fullScreen && <HandleBar />}
      </>
    );

    const modalInner = (
      <React.Fragment>
        {handleBar}
        {header}
        <ModalContent fullScreen={fullScreen} showHeader={showHeader} fillHeight={fillHeight}>
          {children}
        </ModalContent>
        <ModalOverflow />
      </React.Fragment>
    );

    const modalContent = () => {
      if (fullScreen) {
        return (
          <Wrapper onLayout={this.onModalBoxLayout} fullScreen>
            {modalInner}
          </Wrapper>
        );
      }

      if (eventDetail) {
        return (
          <ModalBackground
            disabled
            onLayout={this.onModalBoxLayout}
            customTheme={customTheme}
            sideMargins={sideMargins}
          >
            {children}
          </ModalBackground>
        );
      }

      return (
        <ModalBackground
          activeOpacity={1}
          onLayout={this.onModalBoxLayout}
          customTheme={customTheme}
          sideMargins={sideMargins}
        >
          {modalInner}
        </ModalBackground>
      );
    };

    const animationTiming = 400;

    /* eslint-disable i18next/no-literal-string */
    const fwdProps: ModalProps = pick(
      this.props,
      'onModalWillHide',
      'onModalHide',
      'onModalShow',
      'scrollOffset',
      'scrollOffsetMax',
      'scrollTo',
      'avoidKeyboard',
    );
    /* eslint-enable i18next/no-literal-string */

    const onClose = () => Modal.closeAll();

    return (
      <Modal
        ref={this._modalRef}
        backdropOpacity={fullScreen ? 1 : 0.7}
        backdropColor={fullScreen ? backgroundColor : '#000000'}
        animationInTiming={animationTiming}
        animationOutTiming={animationTiming}
        swipeDirection={noSwipeToDismiss ? undefined : 'down'}
        onBackButtonPress={this.handleDismiss}
        onSwipeComplete={!isSwipeClose ? this.handleDismiss : undefined}
        style={{
          margin: 0,
          position: 'relative',
          zIndex: 10,
        }}
        {...fwdProps}
      >
        <ContentWrapper fullScreen={fullScreen} bgColor={backgroundColor} noTopPadding={noTopPadding}>
          <TouchableBackground activeOpacity={1} onPress={onClose} />

          <Wrapper style={[wrapperStyle, { top: height - this.state.contentHeight }]}>
            {!!centerFloatingItem && centerFloatingItem}
          </Wrapper>

          {modalContent()}
        </ContentWrapper>
      </Modal>
    );
  }
}

export type SlideModalInstance = SlideModal;

const ThemedSlideModal: React.AbstractComponent<OwnProps, SlideModal> = withTheme(SlideModal);
export default ThemedSlideModal;

const getModalContentPadding = (showHeader: boolean) => {
  if (showHeader) {
    return '0';
  }
  return `${spacing.rhythm}px 0 0`;
};

const wrapperStyle = {
  position: 'absolute',
  alignSelf: 'center',
  zIndex: 11,
  width: '100%',
  height: 70,
};

const ContentWrapper = styled.View`
  width: 100%;
  height: 100%;
  ${(props) => (props.fullScreen && !props.noTopPadding ? 'padding-top: 20px;' : '')}
  ${(props) => (props.bgColor && props.fullScreen ? `background-color: ${props.bgColor};` : '')}
`;

const TouchableBackground = styled.TouchableOpacity`
  flex: 1;
  z-index: 10;
`;

const ModalBackground = styled.TouchableOpacity`
  border-top-left-radius: ${(props) => props.customTheme.borderRadius};
  border-top-right-radius: ${(props) => props.customTheme.borderRadius};
  overflow: hidden;
  padding: ${(props) => props.customTheme.padding};
  box-shadow: 0px 2px 7px rgba(0, 0, 0, 0.1);
  elevation: 1;
  margin-top: auto;
  background-color: ${({ customTheme, theme }) => (customTheme.isTransparent ? 'transparent' : theme.colors.basic050)};
  margin-horizontal: ${({ sideMargins }) => sideMargins || 0}px;
`;

const ModalContent = styled.View`
  flex-direction: column;
  ${({ fullScreen, showHeader }) =>
    fullScreen &&
    showHeader &&
    `
    padding: ${getModalContentPadding(showHeader)};
  `}
  ${({ fullScreen }) =>
    fullScreen &&
    `
    flex: 1;
  `}
  ${({ fillHeight }) =>
    fillHeight &&
    `
    height: ${getDeviceHeightWithoutNotch()}px;
  `}
`;

const ModalOverflow = styled.View`
  width: 100%;
  height: 100px;
  margin-bottom: -100px;
  background-color: ${({ theme }) => theme.colors.basic050};
`;

const HandleBar = styled.View`
  width: 38px;
  height: 5px;
  background-color: ${({ theme }) => theme.colors.modalHandleBar};
  border-radius: 2.5px;
  margin-top: ${spacing.medium}px;
  align-self: center;
`;
