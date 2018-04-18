// @flow
import * as React from 'react';
import { View, Platform, Dimensions, Vibration } from 'react-native';
import { Camera, Permissions } from 'expo';
import styled from 'styled-components/native';

const PERMISSION_GRANTED = 'GRANTED';
const AUTHORIZED = 'AUTHORIZED';
const PENDING = 'PENDING';
const DECLINED = 'DECLINED';

const Scanner = styled(Camera)`
  flex: 1;
  alignItems: center;
  justifyContent: center;
  backgroundColor: transparent;
`;

const RectangleContainer = styled.View`
  flex: 1;
  alignItems: center;
  justifyContent: center;
  backgroundColor: transparent;
`;

const Rectangle = styled.View`
  height: 250;
  width: 250;
  borderWidth: 2;
  borderColor: ${(props) => props.color};
  backgroundColor: transparent;
`;

type Props = {
  onRead: Function,
  reactivate: boolean,
  rectangleColor: string,
}

type State = {
  authorizationState: string,
  isScanning: boolean,
}

export default class QRCodeScanner extends React.Component<Props, State> {
  static defaultProps = {
    reactivate: false,
    rectangleColor: '#00BFFF',
  };

  state = {
    authorizationState: PENDING,
    isScanning: false
  };

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      authorizationState: status.toUpperCase() === PERMISSION_GRANTED ? AUTHORIZED : DECLINED,
    });
  };

  handleQRRead = (data: Object) => {
    const { onRead, reactivate } = this.props;
    const { isScanning } = this.state
    if (!isScanning) {
      this.setState({ isScanning: true }, () => {
        Vibration.vibrate();
        onRead && onRead(data);
      });
    }

    if (isScanning && reactivate) {
      this.setState({ isScanning: false });
    }
  };

  render() {
    const { rectangleColor } = this.props;
    return (
      <Scanner type={Camera.Constants.Type.back} onBarCodeRead={this.handleQRRead}>
        <RectangleContainer>
          <Rectangle color={rectangleColor} />
        </RectangleContainer>
      </Scanner>
    );
  }
}

