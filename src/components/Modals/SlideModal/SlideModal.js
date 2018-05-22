// @flow
import * as React from 'react';
import { Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import ButtonIcon from 'components/ButtonIcon';

type Props = {
  title: string,
  children?: React.Node,
  fullScreenComponent?: ?React.Node,
  onModalHide?: Function,
  isVisible: boolean,
};

type State = {
  isVisible: boolean,
};

const window = Dimensions.get('window');
const modalOffset = 300;

const ModalWrapper = styled.View`
  position: absolute;
  width: 100%;
  height: 60%;
  align-items: stretch;
`;

const ModalBackground = styled.View`
  background-color: white;
  padding: 20px;
  border-top-left-radius: 20;
  border-top-right-radius: 20;
  box-shadow: 10px 5px 5px rgba(0,0,0,.5);
  height: ${(window.height * 2) - modalOffset};
`;

const ModalHeader = styled.View`
  flex-direction: row;
  height: 30;
  margin-bottom: 30;
  width: 100%;
  align-items: center;
  justify-content: space-between;
`;

const ModalContent = styled.View`
  flex: 1;
  height: ${window.height};
  align-items: center;
`;

const ModalOverflow = styled.View`
  flex: 1;
  height: ${window.height};
  width: 100%;
  background-color: #FFFFFF;
`;

const ModalTitle = styled.Text`
  font-size: 24px;
  font-weight: 700;
`;

const CloseButton = styled(ButtonIcon)`
  position: relative;
  top: -10px;
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

  hideModal = () => {
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
    } = this.props;
    const animationInTiming = 800;
    const animationOutTiming = 400;
    return (
      <Modal
        isVisible={isVisible}
        onSwipe={this.hideModal}
        onModalHide={onModalHide}
        onBackdropPress={this.hideModal}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        animationIn="bounceInUp"
        animationOut="bounceOutDown"
        swipeDirection="down"
        style={{
          margin: 0,
        }}
      >
        <ModalWrapper>
          <ModalBackground>
            <ModalHeader>
              <ModalTitle>{title}</ModalTitle>
              <CloseButton
                icon="close"
                onPress={this.hideModal}
                fontSize={36}
              />
            </ModalHeader>
            <ModalContent>
              {isVisible && children}
            </ModalContent>
            <ModalOverflow />
          </ModalBackground>
        </ModalWrapper>
        {fullScreenComponent}
      </Modal>
    );
  }
}
