// @flow
import * as React from 'react';
import Modal from 'react-native-modal';
import { Root } from 'native-base';
import styled from 'styled-components/native';
import Header from 'components/Header';
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
};

const ModalWrapper = styled.View`
  position: absolute;
  width: 100%;
  ${props => props.fullScreen && `height: ${height};`}
`;

const ModalBackground = styled.View`
  background-color: white;
  border-top-left-radius:  ${(props) => props.fullScreen ? '0' : '20px'};
  border-top-right-radius:  ${(props) => props.fullScreen ? '0' : '20px'};
  padding: ${(props) => props.fullScreen ? '60px 0 80px' : '20px'};
  box-shadow: 10px 5px 5px rgba(0,0,0,.5);
  ${props => props.fullScreen && 'height: 100%;'}
`;

const ModalSubtitle = styled(SubTitle)`
  padding: ${(props) => props.fullScreen ? '20px 20px 0' : '10px 0'};
`;

const ModalContent = styled.View`
  ${props => props.fullScreen && 'height: 100%;'}
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
    } = this.props;
    const animationTiming = 600;
    return (
      <Modal
        isVisible={isVisible}
        onSwipe={this.hideModal}
        onModalHide={onModalHidden}
        onBackdropPress={this.hideModal}
        animationInTiming={animationTiming}
        animationOutTiming={animationTiming}
        animationIn="slideInUp"
        animationOut="slideOutDown"
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
              {!fullScreen &&
                <Header noPadding title={title} onClose={this.hideModal} />
              }
              {subtitle &&
                <ModalSubtitle fullScreen={fullScreen}>{subtitle}</ModalSubtitle>
              }
              <ModalContent fullScreen={fullScreen}>
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
