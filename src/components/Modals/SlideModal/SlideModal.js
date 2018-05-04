// @flow
import * as React from 'react';
import { Animated, Dimensions } from 'react-native';
import type { ScrollEvent } from 'react-native';
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
  animFadeInBackground: any,
  animSlideModalVertical: any,
  isVisible: boolean,
};

const window = Dimensions.get('window');
const modalOffset = 300;

const ModalWrapper = styled.View`
  position: absolute;
  width: 100%;
  height: 60%;
  alignItems: stretch;
`;

const ModalBackground = styled.View`
  backgroundColor: white;
  padding: 20px;
  borderTopLeftRadius: 20;
  borderTopRightRadius: 20;
  box-shadow: 10px 5px 5px rgba(0,0,0,.5);
`;

const ModalHeader = styled.View`
  flexDirection: row;
  height: 30;
  width: 100%;
  alignItems: center;
  justifyContent: space-between;
`;

const ModalContent = styled.View`
  flex: 1;
  height: ${window.height};
  alignItems: center;
  justifyContent: space-around;
`;

const ModalOverflow = styled.View`
  flex: 1;
  height: ${window.height};
  width: 100%;
  backgroundColor: #FFFFFF;
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
      animFadeInBackground: new Animated.Value(0),
      animSlideModalVertical: new Animated.Value(window.height),
      isVisible: props.isVisible,
    };
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.isVisible !== prevState.isVisible) {
      return {
        ...prevState,
        isVisible: nextProps.isVisible,
        animFadeInBackground: new Animated.Value(0),
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
      Animated.timing(this.state.animFadeInBackground, {
        toValue: 0.5,
        duration: 200,
      }),
      Animated.spring(this.state.animSlideModalVertical, {
        toValue: 0,
      }),
    ]).start();
  }

  handleScroll = (event: ScrollEvent) => {
    const distanceY = event.nativeEvent.contentOffset.y;
    const offsetY = -50;
    if (distanceY <= offsetY) {
      this.handleAnimationDismiss();
    }
  };

  handleAnimationDismiss = () => {
    const { onDismiss } = this.props;
    Animated.parallel([
      Animated.timing(this.state.animFadeInBackground, {
        toValue: 0,
      }),
      Animated.timing(this.state.animSlideModalVertical, {
        toValue: window.height,
        duration: 200,
      }),
    ]).start(() => {
      this.setState({
        isVisible: false,
      }, onDismiss);
    });
  };

  render() {
    const {
      animFadeInBackground,
      animSlideModalVertical,
      isVisible,
    } = this.state;
    const { children, title, fullScreenComponent } = this.props;

    if (!isVisible) return null;

    return (
      <Modal isVisible={isVisible} style={styles.modalContainer}>
        <Animated.View style={[styles.dismissOverlay, { opacity: animFadeInBackground }]} />
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
                onPress={this.handleAnimationDismiss}
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
