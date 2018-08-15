// @flow
import * as React from 'react';
import Modal from 'react-native-modal';
import { Root } from 'native-base';
import styled from 'styled-components/native';
import Header from 'components/Header';
import { spacing } from 'utils/variables';
import { Container } from 'components/Layout';
import { SubTitle } from 'components/Typography';
import { Dimensions, Keyboard } from 'react-native';

const { height } = Dimensions.get('window');

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
};

const ModalWrapper = styled.View`
  width: 100%;
  ${props => props.fullScreen && `height: ${height};`}
`;

const HeaderWrapper = styled.View`
  padding-top: ${(props) => props.fullScreen ? `${spacing.rhythm}px` : '0'};
  background: green;
`;

const ModalBackground = styled.View`
  background-color: red;
  border-top-left-radius:  ${(props) => props.fullScreen ? '0' : `${spacing.rhythm}px`};
  border-top-right-radius:  ${(props) => props.fullScreen ? '0' : `${spacing.rhythm}px`};
  padding: ${(props) => props.fullScreen ? '0' : `${spacing.rhythm}px`};
  box-shadow: 10px 5px 5px rgba(0,0,0,.5);
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

const ModalContent = styled(Container)`
  background: yellow;
  ${({ fullScreen, showHeader }) => fullScreen && `
    padding: ${fullScreen && showHeader && getModalContentPadding(showHeader)};
  `}
`;

const ModalOverflow = styled.View`
  width: 100%;
  background-color: #FFFFFF;
`;

export default class SlideModal extends React.Component<Props, *> {
  static defaultProps = {
    fullScreenComponent: null,
  };

  hideModal = () => {
    Keyboard.dismiss();
    if (this.props.onModalHide) {
      this.props.onModalHide();
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
    } = this.props;

    const showModalHeader = !fullScreen || showHeader;

    const animationTiming = 500;
    return (
      <Modal
        isVisible={isVisible}
        onSwipe={this.hideModal}
        onModalHide={onModalHidden}
        onBackdropPress={this.hideModal}
        animationInTiming={animationTiming}
        animationOutTiming={animationTiming}
        animationIn="bounceInUp"
        animationOut="bounceOutDown"
        swipeDirection="down"
        hideModalContentWhileAnimating
        style={{
          margin: 0,
          justifyContent: 'flex-end',
        }}
      >
        <ModalWrapper fullScreen={fullScreen}>
          <Root>
            <ModalBackground fullScreen={fullScreen}>
              {showModalHeader &&
                <HeaderWrapper fullScreen={fullScreen}>
                  <Header noPadding={!fullScreen} title={title} onClose={this.hideModal} />
                </HeaderWrapper>
              }
              {subtitle && !fullScreen &&
                <ModalSubtitle>{subtitle}</ModalSubtitle>
              }
              <ModalContent
                fullScreen={fullScreen}
                showHeader={showHeader}
              >
                {children}
              </ModalContent>
              <ModalOverflow />
            </ModalBackground>
          </Root>

        </ModalWrapper>
        {isVisible && fullScreenComponent}
      </Modal>
    );
  }
}
