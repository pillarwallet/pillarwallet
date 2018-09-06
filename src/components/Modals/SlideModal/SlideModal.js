// @flow
import * as React from 'react';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import Header from 'components/Header';
import Root from 'components/Root';
import Toast from 'components/Toast';
import { Container } from 'components/Layout';
import { spacing, baseColors } from 'utils/variables';
import { SubTitle } from 'components/Typography';
import { Keyboard } from 'react-native';

type Props = {
  title?: string,
  children?: React.Node,
  subtitle?: string,
  fullScreenComponent?: ?React.Node,
  onModalHide?: Function,
  onModalHidden?: Function,
  fullScreen?: boolean,
  isVisible: boolean,
  showHeader?: boolean,
  centerTitle?: boolean,
  backgroundColor?: string,
  avoidKeyboard?: boolean,
};

const ModalWrapper = styled.View`
  width: 100%;
  height: 100%;
`;

const HeaderWrapper = styled.View`
`;

const ModalBackground = styled.View`
  border-top-left-radius:  ${(props) => props.fullScreen ? '0' : `${spacing.rhythm}px`};
  border-top-right-radius:  ${(props) => props.fullScreen ? '0' : `${spacing.rhythm}px`};
  padding: ${(props) => props.fullScreen ? '0' : `0 ${spacing.rhythm}px`};
  box-shadow: 10px 5px 5px rgba(0,0,0,.5);
  margin-top: auto;
  background: ${baseColors.white};
`;

const ModalSubtitle = styled(SubTitle)`
  padding: 10px 0;
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
  background-color: ${baseColors.white};
`;

export default class SlideModal extends React.Component<Props, *> {
  static defaultProps = {
    fullScreenComponent: null,
  };

  hideModal = () => {
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
  }

  handleScroll = () => {
    if (Toast.isVisible()) {
      Toast.close();
    }
  }

  render() {
    const {
      children,
      title,
      fullScreenComponent,
      onModalHidden,
      fullScreen,
      subtitle,
      isVisible,
      showHeader,
      centerTitle,
      backgroundColor,
      avoidKeyboard,
    } = this.props;

    const showModalHeader = !fullScreen || showHeader;

    const modalInner = (
      <React.Fragment>
        {showModalHeader &&
          <HeaderWrapper fullScreen={fullScreen}>
            <Header
              noMargin={!fullScreen}
              centerTitle={centerTitle}
              noPadding={!fullScreen}
              title={title}
              onClose={this.hideModal}
            />
          </HeaderWrapper>
        }
        {subtitle &&
          <ModalSubtitle>{subtitle}</ModalSubtitle>
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
          <Container color={backgroundColor}>
            {modalInner}
          </Container>
        );
      }
      return modalInner;
    };

    const animationTiming = 400;
    return (
      <Modal
        isVisible={isVisible}
        scrollTo={this.handleScroll}
        onSwipe={this.hideModal}
        onModalHide={onModalHidden}
        onBackdropPress={this.hideModal}
        animationInTiming={animationTiming}
        animationOutTiming={animationTiming}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        swipeDirection="down"
        avoidKeyboard={avoidKeyboard}
        style={{
          margin: 0,
        }}
      >
        <ModalWrapper fullScreen={fullScreen}>
          <Root>
            <ModalBackground fullScreen={fullScreen}>
              {modalContent()}
            </ModalBackground>
          </Root>
        </ModalWrapper>
        {isVisible && fullScreenComponent}
      </Modal>
    );
  }
}
