// @flow
import * as React from 'react';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import { Platform, Dimensions, Keyboard } from 'react-native';
import Header from 'components/Header';

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
  flex: 1;
  width: 100%;
  height: ${height};
  padding: ${Platform.OS === 'ios' ? '40px 0 80px' : '20px 0 80px'};
  background-color: #ffffff;
`;

const ModalOverflow = styled.View`
  width: 100%;
  background-color: #FFFFFF;
`;

export default class KeyboardAvoidModal extends React.Component<Props, State> {
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
  };

  render() {
    const {
      isVisible,
    } = this.state;
    const {
      children,
      fullScreenComponent,
      onModalHide,
      subtitle,
    } = this.props;
    const animationTiming = 500;
    return (
      <Modal
        isVisible={isVisible}
        onSwipe={this.hideModal}
        onModalHide={onModalHide}
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
        <ModalWrapper>
          <Header subtitle title={subtitle} onClose={this.hideModal} />
          {children}
          <ModalOverflow />
        </ModalWrapper>
        {isVisible && fullScreenComponent}
      </Modal>
    );
  }
}
