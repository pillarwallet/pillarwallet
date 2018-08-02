// @flow
import * as React from 'react';
import { baseColors } from 'utils/variables';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import { WebView } from 'react-native';
import { Container } from 'components/Layout';
import Header from 'components/Header';
import Spinner from 'components/Spinner';

type Props = {
  uri: string,
  fullScreenComponent?: ?React.Node,
  onModalHide?: Function,
  isVisible: boolean,
  modalHide: Function,
};

type State = {
  isIFrameLoaded: boolean,
};

const ActivityIndicatorWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const ModalWrapper = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: ${baseColors.white};
`;

export default class IFrameModal extends React.Component<Props, State> {
  static defaultProps = {
    fullScreenComponent: null,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      isIFrameLoaded: false,
    };
  }

  handleLoadIFrame = () => {
    this.setState({ isIFrameLoaded: true });
  }

  handleModalClose = () => {
    this.setState({ isIFrameLoaded: false });
  }

  render() {
    const {
      isVisible,
      modalHide,
      uri,
    } = this.props;

    const { isIFrameLoaded } = this.state;
    const animationInTiming = 300;
    const animationOutTiming = 300;
    return (
      <Modal
        isVisible={isVisible}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        animationIn="fadeIn"
        animationOut="fadeOut"
        onBackButtonPress={modalHide}
        onModalHide={this.handleModalClose}
        style={{
          margin: 0,
          justifyContent: 'flex-start',
        }}
      >
        <Container>
          <Header onClose={modalHide} />
          {!isIFrameLoaded &&
          <ActivityIndicatorWrapper>
            <Spinner />
          </ActivityIndicatorWrapper>
          }
          <WebView
            source={{ uri }}
            onLoad={this.handleLoadIFrame}
            style={{ opacity: isIFrameLoaded ? 1 : 0 }}
          />
        </Container>
      </Modal>
    );
  }
}
