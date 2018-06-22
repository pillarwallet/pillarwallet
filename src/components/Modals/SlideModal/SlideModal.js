// @flow
import * as React from 'react';
import { baseColors } from 'utils/variables';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import Title from 'components/Title';
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

const ModalWrapper = styled.View`
  position: absolute;
  width: 100%;
`;

const ModalBackground = styled.View`
  background-color: white;
  padding: 20px;
  border-top-left-radius: 20;
  border-top-right-radius: 20;
  box-shadow: 10px 5px 5px rgba(0,0,0,.5);
`;

const ModalHeader = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: space-between;
`;

const ModalContent = styled.View`
  padding: 10px 0px;
`;

const ModalOverflow = styled.View`
  width: 100%;
  background-color: #FFFFFF;
`;


const CloseButton = styled(ButtonIcon)`
  position: relative;
  top: -15px;
  right: -10px;
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
          justifyContent: 'flex-end',
        }}
      >
        <ModalWrapper>
          <ModalBackground>
            <ModalHeader>
              <Title noMargin title={title} />
              <CloseButton
                icon="close"
                onPress={this.hideModal}
                fontSize={36}
                color={baseColors.electricBlue}
              />
            </ModalHeader>
            <ModalContent>
              {isVisible && children}
            </ModalContent>
            <ModalOverflow />
          </ModalBackground>
        </ModalWrapper>
        {isVisible && fullScreenComponent}
      </Modal>
    );
  }
}
