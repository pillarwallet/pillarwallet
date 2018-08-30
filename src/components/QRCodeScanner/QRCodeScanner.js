// @flow
import * as React from 'react';
import { Vibration, Dimensions, Text, Platform, PixelRatio } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Modal from 'react-native-modal';
import Permissions from 'react-native-permissions';
import { noop } from 'utils/common';
import { baseColors } from 'utils/variables';
import Header from 'components/Header';
import styled from 'styled-components/native';

const pixelRatio = PixelRatio.get();

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

const squareSize = 250;

const viewMinScanX = (screenWidth - squareSize) / 2;
const viewMinScanY = (screenHeight - squareSize) / 2;

const SquareContainer = styled.View`
  position: absolute;
  justify-content: center;
  display: flex;
  height: ${squareSize};
  width: ${squareSize};
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

  getAndroidCoordinates = (bounds: Object[]) => {
    const leftBottom = { x: bounds[0].x / pixelRatio, y: bounds[0].y / (pixelRatio - 1.5) };
    const leftTop = { x: bounds[1].x / pixelRatio, y: bounds[1].y / (pixelRatio - 1.5) };
    const rightTop = { x: bounds[2].x / pixelRatio, y: bounds[2].y / (pixelRatio - 1.5) };
    return {
      x: Math.min(leftTop.x, leftBottom.x),
      y: Math.min(leftTop.y, rightTop.y),
    };
  }

  getIOSCoordinates = (bounds: Object) => {
    return {
      x: +bounds.origin.x,
      y: +bounds.origin.y,
    };
  }

  handleQRRead = (data: Object) => {
    const coordinates = Platform.OS === 'ios'
      ? this.getIOSCoordinates(data.bounds)
      : this.getAndroidCoordinates(data.bounds);
    const { x, y } = coordinates;
    const isInRecognitionArea = (x > viewMinScanX && y > viewMinScanY) &&
      (x < (viewMinScanX + 80) && (y < viewMinScanY + 80));
    if (!isInRecognitionArea) return;
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
          <Text style={{ color: baseColors.white }}>
            Camera permissions not granted - cannot open the QR scanner.
          </Text>
        </NoPermissions>
      </React.Fragment>
    );
  }

  renderScanner() {
    const { rectangleColor } = this.props;
    return (
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
        onBarCodeRead={this.handleQRRead}
      >
        <HeaderWrapper>
          <Header light flexStart onClose={this.handleAnimationDismiss} />
        </HeaderWrapper>
        <SquareContainer color={rectangleColor} />
      </RNCamera>
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

