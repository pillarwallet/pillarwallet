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
import React from 'react';
import type { Node as ReactNode, AbstractComponent } from 'react';
import styled, { withTheme } from 'styled-components/native';
import isEmpty from 'lodash.isempty';
import pick from 'lodash.pick';

import Modal from 'components/Modal';
import { Wrapper } from 'components/Layout';
import HeaderBlock from 'components/HeaderBlock';

import { spacing } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';

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
|}

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
    isTransparent: true,
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

const ContentWrapper = styled.View`
  width: 100%;
  height: 100%;
  ${props => props.fullScreen && !props.noTopPadding ? 'padding-top: 20px;' : ''}
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
  overflow: hidden;
  padding: ${props => props.customTheme.padding};
  box-shadow: 0px 2px 7px rgba(0,0,0,.1);
  elevation: 1;
  margin-top: auto;
  background-color: ${({ customTheme, theme }) => customTheme.isTransparent ? 'transparent' : theme.colors.card};
  margin-horizontal: ${({ sideMargins }) => sideMargins || 0}px;
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

class SlideModal extends React.Component<Props, State> {
  _modalRef = React.createRef<Modal>();

  state = {
    contentHeight: 0,
  };

  close: () => void = () => {
    if (this._modalRef.current) this._modalRef.current.close();
  }

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
    } = this.props;

    const customTheme = getTheme(this.props);
    const colors = getThemeColors(theme);
    const backgroundColor = bgColor || colors.surface;

    const showModalHeader = ((!fullScreen || showHeader) && !hideHeader) || !isEmpty(headerProps);
    let leftItems = [];
    const centerItems = centerTitle ? [{ title }] : [];
    const rightItems = [{
      close: !noClose,
    }];
    if (!centerTitle) {
      leftItems.push({ title });
    }
    if (headerLeftItems) {
      leftItems = [...leftItems, ...headerLeftItems];
    }

    const modalInner = (
      <React.Fragment>
        {showModalHeader &&
          <HeaderBlock
            leftItems={leftItems}
            centerItems={centerItems}
            rightItems={rightItems}
            noBottomBorder
            noPaddingTop
            onClose={this.close}
            wrapperStyle={{ backgroundColor: 'transparent' }}
            noHorizonatalPadding={!fullScreen && !noPadding}
            leftSideFlex={centerTitle ? undefined : 4}
            noBack
            forceInsetTop={insetTop ? 'always' : 'never'} // eslint-disable-line i18next/no-literal-string
            {...headerProps}
          />
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
          <Wrapper onLayout={this.onModalBoxLayout} fullScreen>
            {modalInner}
          </Wrapper>
        );
      }

      if (eventDetail) {
        return (
          <ModalBackground onLayout={this.onModalBoxLayout} customTheme={customTheme} sideMargins={sideMargins}>
            { children }
          </ModalBackground>
        );
      }

      return (
        <ModalBackground onLayout={this.onModalBoxLayout} customTheme={customTheme} sideMargins={sideMargins}>
          { modalInner }
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

    return (
      <Modal
        ref={this._modalRef}
        backdropOpacity={fullScreen ? 1 : 0.7}
        backdropColor={fullScreen ? backgroundColor : '#000000'}
        animationInTiming={animationTiming}
        animationOutTiming={animationTiming}
        swipeDirection={noSwipeToDismiss ? undefined : 'down'}
        style={{
          margin: 0,
          position: 'relative',
          zIndex: 10,
        }}
        {...fwdProps}
      >
        <ContentWrapper fullScreen={fullScreen} bgColor={backgroundColor} noTopPadding={noTopPadding}>
          {!fullScreen && (
            <Backdrop onPress={this.close}>
              <ContentWrapper />
            </Backdrop>
          )}
          {!!centerFloatingItem && (
            <Wrapper
              style={{
                elevation: 2,
                zIndex: 11,
                marginTop: -1 * this.state.contentHeight,
                marginBottom: 0,
              }}
            >
              {centerFloatingItem}
            </Wrapper>
          )}
          {modalContent()}
        </ContentWrapper>
      </Modal>
    );
  }
}

// withTheme:
// - is implicitly typed as any;
// - uses innerRef prop instead of forwarding until v4;
//   see: https://styled-components.com/docs/api#deprecated-innerref-prop;
//
// so the type of wrapped component is set manually to make prop validation
// of SlideModal work.

type Ref<T> = ((null | T) => mixed) | { current: null | T };
type ThemedProps = {| ...OwnProps, innerRef: Ref<SlideModal> |};
const ThemedSlideModal: AbstractComponent<ThemedProps, SlideModal> = withTheme(SlideModal);

// Exported because some calls to React.createRef need this to be passed as type parameter.
export type SlideModalInstance = SlideModal;

export default React.forwardRef<OwnProps, SlideModalInstance>((props, ref) => (
  <ThemedSlideModal {...props} innerRef={ref} />
));
