// @flow
import * as React from 'react';
import { Vibration, Dimensions, Text } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Modal from 'react-native-modal';
import Permissions from 'react-native-permissions';
import { noop } from 'utils/common';
import Header from 'components/Header';
import styled from 'styled-components/native';

const AUTHORIZED = 'AUTHORIZED';
const PENDING = 'PENDING';
const DENIED = 'DENIED';

type Props = {
  onRead: Function,
  onDismiss: Function,
  reactivate: boolean,
  validator: Function,
  dataFormatter: Function,
  rectangleColor: string,
  isActive: boolean,
}

type State = {
  authorizationState: string,
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const RectangleContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: transparent;
`;

const Rectangle = styled.View`
  height: 250;
  width: 250;
  border-width: 4px;
  border-color: ${props => props.color};
  background-color: transparent;
`;

const HeaderWrapper = styled.SafeAreaView`
  margin-bottom: auto;
  width: 100%;
`;

const NoPermissions = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 10px;
`;

export default class QRCodeScanner extends React.Component<Props, State> {
  static defaultProps = {
    reactivate: false,
    rectangleColor: '#FFFFFF',
    onRead: noop,
    validator: () => true,
    dataFormatter: (x: any) => x,
  };
  camera: ?Object;
  isScanned: boolean = false;

  state = {
    authorizationState: PENDING,
  };

  componentDidUpdate(prevProps: Props) {
    if (this.props.isActive && this.state.authorizationState === PENDING) {
      this.askPermissions();
    }
    if (prevProps.isActive === this.props.isActive) return;
    this.isScanned = false;
  }

  componentDidMount() {
    if (this.props.isActive) {
      this.askPermissions();
    }
  }

  async askPermissions() {
    const status = await Permissions.request('camera');
    this.setState({
      authorizationState: status.toUpperCase() === AUTHORIZED ? AUTHORIZED : DENIED,
    });
  }

  handleQRRead = (data: Object) => {
    const { onRead, validator, dataFormatter } = this.props;
    const { data: address } = data;

    const isValid = validator(address);

    if (!this.isScanned && isValid) {
      this.isScanned = true;
      Vibration.vibrate();
      onRead(dataFormatter(address));
    }
  };

  handleAnimationDismiss = () => {
    const { onDismiss } = this.props;
    this.isScanned = false;
    onDismiss();
  };

  renderNoPermissions() {
    return (
      <React.Fragment>
        <HeaderWrapper>
          <Header light flexStart onClose={this.handleAnimationDismiss} />
        </HeaderWrapper>
        <NoPermissions>
          <Text style={{ color: 'white' }}>
            Camera permissions not granted - cannot open the QR scanner.
          </Text>
        </NoPermissions>
      </React.Fragment>
    );
  }

  renderScanner() {
    const { rectangleColor } = this.props;
    return (
      <React.Fragment>
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={{
            width: screenWidth,
            height: screenHeight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          type={RNCamera.Constants.Type.back}
          ratio="16:9"
          onBarCodeRead={this.handleQRRead}
        >
          <HeaderWrapper>
            <Header light flexStart onClose={this.handleAnimationDismiss} />
          </HeaderWrapper>
          <RectangleContainer>
            <Rectangle color={rectangleColor} />
          </RectangleContainer>
        </RNCamera>
      </React.Fragment>
    );
  }

  render() {
    const { isActive } = this.props;
    const { authorizationState } = this.state;

    if (authorizationState === PENDING) {
      return null;
    }

    const content = (authorizationState === DENIED)
      ? this.renderNoPermissions()
      : this.renderScanner();

    const animationInTiming = 300;
    const animationOutTiming = 300;

    return (
      <Modal
        isVisible={isActive}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        animationIn="fadeIn"
        animationOut="fadeOut"
        onBackButtonPress={this.handleAnimationDismiss}
        style={{
          margin: 0,
          justifyContent: 'flex-start',
        }}
      >
        {content}
      </Modal>
    );
  }
}

