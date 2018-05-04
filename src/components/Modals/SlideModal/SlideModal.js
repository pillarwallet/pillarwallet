// @flow
import * as React from 'react';
import { Animated, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import ButtonIcon from 'components/ButtonIcon';
import { noop } from 'utils/common';

type Props = {
  title: string,
  onDismiss: Function,
  children?: React.Node,
  fullScreenComponent?: ?React.Node,
  modalDismissalCallback: Function,
  isVisible: boolean,
};

type State = {
  animSlideModalVertical: Animated.Value,
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
`;

const ModalHeader = styled.View`
  flex-direction: row;
  height: 30;
  width: 100%;
  align-items: center;
  justify-content: space-between;
`;

const ModalContent = styled.View`
  flex: 1;
  height: ${window.height};
  align-items: center;
  justify-content: space-around;
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

const AnimatedModalBackground = Animated.createAnimatedComponent(ModalBackground);

export default class SlideModal extends React.Component<Props, State> {
  static defaultProps = {
    onDismiss: noop,
    modalDismissalCallback: noop,
    fullScreenComponent: null,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      animSlideModalVertical: new Animated.Value(window.height),
      isVisible: props.isVisible,
    };
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.isVisible !== prevState.isVisible) {
      return {
        ...prevState,
        isVisible: nextProps.isVisible,
        animSlideModalVertical: new Animated.Value(window.height),
      };
    }
    return null;
  }

  componentDidMount() {
    const { modalDismissalCallback } = this.props;
    modalDismissalCallback(this.handleAnimationDismiss);
  }

  componentWillUnmount() {
    const { modalDismissalCallback } = this.props;
    modalDismissalCallback(noop);
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.isVisible === this.state.isVisible) return;
    Animated.parallel([
      Animated.spring(this.state.animSlideModalVertical, {
        toValue: 0,
      }),
    ]).start();
  }

  hideModal = () => {
    this.setState({
      isVisible: false,
    });
  }

  render() {
    const {
      animSlideModalVertical,
      isVisible,
    } = this.state;
    const { children, title, fullScreenComponent } = this.props;

    return (
      <Modal
        isVisible={isVisible}
        swipeDirection="down"
        onSwipe={this.hideModal}
      >
        <ModalWrapper>
          <AnimatedModalBackground style={{
            marginTop: animSlideModalVertical,
            height: (window.height * 2) - modalOffset,
            }}
          >
            <ModalHeader>
              <ModalTitle>{title}</ModalTitle>
              <CloseButton
                icon="close"
                onPress={this.hideModal}
                fontSize={36}
              />
            </ModalHeader>
            <ModalContent>
              {children}
            </ModalContent>
            <ModalOverflow />
          </AnimatedModalBackground>
s
        </ModalWrapper>
        {fullScreenComponent}
      </Modal>
    );
  }
}
