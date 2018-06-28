// @flow
import * as React from 'react';
import { baseColors } from 'utils/variables';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import { Platform, WebView, ActivityIndicator } from 'react-native';
import ButtonIcon from 'components/ButtonIcon';

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

const ModalWrapper = styled.View`
  flex: 1;
  background-color: #ffffff;
`;

const ModalHeader = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 20px 0 20px;
`;

const CloseButton = styled(ButtonIcon)`
  position: relative;
  top: -15px;
  right: -10px;
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
    const animationInTiming = 800;
    const animationOutTiming = 400;
    return (
      <Modal
        isVisible={isVisible}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        animationIn="bounceInUp"
        animationOut="bounceOutDown"
        onBackButtonPress={modalHide}
        onModalHide={this.handleModalClose}
        style={{
          margin: 0,
          justifyContent: 'flex-start',
        }}
      >
        <ModalWrapper>
          <ModalHeader style={{ marginTop: Platform.OS === 'ios' ? 20 : 0 }}>
            <CloseButton
              icon="close"
              onPress={modalHide}
              fontSize={36}
              color={baseColors.darkGray}
            />
          </ModalHeader>
          {!isIFrameLoaded &&
            <ActivityIndicator
              animating
              color="#111"
              size="large"
            />
          }
          <WebView
            source={{ uri }}
            onLoad={this.handleLoadIFrame}
            style={{ opacity: isIFrameLoaded ? 1 : 0 }}
          />
        </ModalWrapper>
      </Modal>
    );
  }
}
