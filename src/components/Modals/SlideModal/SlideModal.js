// @flow
import * as React from 'react';
import Modal from 'react-native-modal';
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
  fullScreen?: boolean,
  isVisible: boolean,
};

type State = {
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

export default class SlideModal extends React.Component<Props, State> {
  static defaultProps = {
    fullScreenComponent: null,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      isVisible: props.isVisible,
    };
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.isVisible !== prevState.isVisible) {
      return {
        isVisible: nextProps.isVisible,
      };
    }
    return null;
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return this.state.isVisible !== nextState.isVisible;
  }

  componentDidUpdate() {
    Keyboard.dismiss();
  }

  hideModal = () => {
    Keyboard.dismiss();
    this.setState({
      isVisible: false,
    });
  }

  render() {
    const {
      isVisible,
    } = this.state;
    const {
      children,
      title,
      fullScreenComponent,
      onModalHide,
      fullScreen,
      subtitle,
    } = this.props;
    const animationInTiming = 600;
    const animationOutTiming = 600;
    return (
      <Modal
        isVisible={isVisible}
        onSwipe={this.hideModal}
        onModalHide={onModalHide}
        onBackdropPress={this.hideModal}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
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
          <ModalBackground fullScreen={fullScreen}>
            {!fullScreen &&
              <Header noPadding title={title} onClose={this.hideModal} />
            }
            <ModalSubtitle fullScreen={fullScreen}>{subtitle}</ModalSubtitle>
            <ModalContent fullScreen={fullScreen}>
              {children}
            </ModalContent>
            <ModalOverflow />
          </ModalBackground>
        </ModalWrapper>
        {isVisible && fullScreenComponent}
      </Modal>
    );
  }
}
