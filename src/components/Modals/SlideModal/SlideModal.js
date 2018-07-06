// @flow
import * as React from 'react';
import { baseColors } from 'utils/variables';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import Title from 'components/Title';
import { SubTitle } from 'components/Typography';
import ButtonIcon from 'components/ButtonIcon';
import { Platform, Dimensions, Keyboard } from 'react-native';

const { height } = Dimensions.get('window');

type Props = {
  title: string,
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
  padding: ${(props) => props.fullScreen ? 0 : 20}px;
  box-shadow: 10px 5px 5px rgba(0,0,0,.5);
  ${props => props.fullScreen && 'padding-top: 60px;'}
  ${props => props.fullScreen && 'height: 100%;'}
`;

const ModalHeader = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  ${props => props.fullScreen && 'padding: 0 20px;'}
`;

const ModalSubtitle = styled(SubTitle)`
  padding: ${(props) => props.fullScreen ? '20px 20px 0' : '20px 0'};
`;

const ModalContent = styled.View`
  ${props => props.fullScreen && 'height: 100%;'}
`;

const ModalOverflow = styled.View`
  width: 100%;
  background-color: #FFFFFF;
`;


const CloseButton = styled(ButtonIcon)`
  position: absolute;
  right: ${(props) => props.fullScreen ? 8 : -8}px;
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
        hideModalContentWhileAnimating
        style={{
          margin: 0,
          justifyContent: 'flex-end',
        }}
      >
        <ModalWrapper fullScreen={fullScreen}>
          <ModalBackground fullScreen={fullScreen}>
            <ModalHeader fullScreen={fullScreen}>
              <Title noMargin title={title} />
              <CloseButton
                icon="close"
                onPress={this.hideModal}
                fontSize={Platform.OS === 'ios' ? 36 : 30}
                color={baseColors.darkGray}
                fullScreen={fullScreen}
              />
            </ModalHeader>
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
