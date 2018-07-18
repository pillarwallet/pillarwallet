// @flow
import * as React from 'react';
import { Vibration, Animated, Dimensions, Platform } from 'react-native';
import { Camera, Permissions } from 'expo';
import { noop } from 'utils/common';
import ButtonIcon from 'components/ButtonIcon';
import styled from 'styled-components/native';

const window = Dimensions.get('window');

const PERMISSION_GRANTED = 'GRANTED';
const AUTHORIZED = 'AUTHORIZED';
const PENDING = 'PENDING';
const DECLINED = 'DECLINED';

const Wrapper = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  zIndex: 2;
`;

const Overlay = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  backgroundColor: rgba(0, 0, 0, .3);
  zIndex: 3;
`;

const Scanner = styled(Camera)`
  alignItems: center;
  justifyContent: center;
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
  borderWidth: 4;
  borderColor: ${props => props.color};
  backgroundColor: transparent;
`;

const CloseButton = styled(ButtonIcon)`
  position: absolute;
  right: 16px;
  top: 20px;
  zIndex: 5;
`;

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
  isScanned: boolean,
  animFadeIn: Object,
  isActive: boolean,
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const cameraHeight = screenWidth * (16 / 9);

export default class QRCodeScanner extends React.Component<Props, State> {
  static defaultProps = {
    reactivate: false,
    rectangleColor: '#FFFFFF',
    onRead: noop,
    validator: () => true,
    dataFormatter: (x: any) => x,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      authorizationState: PENDING,
      isScanned: false,
      isActive: props.isActive,
      animFadeIn: new Animated.Value(0),
    };
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.isActive !== prevState.isActive) {
      return {
        ...prevState,
        isScanned: !nextProps.isActive,
        isActive: nextProps.isActive,
        animFadeIn: new Animated.Value(0),
      };
    }
    return null;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.state.isActive && this.state.authorizationState === PENDING) {
      this.askPermissions();
    }
    if (prevState.isActive === this.state.isActive) return;
    Animated.timing(this.state.animFadeIn, {
      toValue: 1,
      duration: 250,
    }).start();
  }

  componentDidMount() {
    if (this.props.isActive) {
      this.askPermissions();
    }
  }

  async askPermissions() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      authorizationState: status.toUpperCase() === PERMISSION_GRANTED ? AUTHORIZED : DECLINED,
    });
  }

  handleQRRead = (data: Object) => {
    const { onRead, validator, dataFormatter } = this.props;
    const { isScanned } = this.state;
    const { data: address } = data;

    const isValid = validator(address);

    if (!isScanned && isValid) {
      this.setState({ isScanned: true }, () => {
        Vibration.vibrate();
        onRead(dataFormatter(address));
      });
    }
  };

  handleAnimationDismiss = () => {
    const { onDismiss } = this.props;
    Animated.timing(this.state.animFadeIn, {
      toValue: 0,
      duration: 250,
    }).start(() => {
      this.setState({
        isActive: false,
        isScanned: false,
      }, onDismiss);
    });
  };

  render() {
    const { isActive, animFadeIn } = this.state;
    const { rectangleColor } = this.props;
    if (!isActive) {
      return null;
    }
    return (
      <Wrapper>
        <Animated.View style={{ opacity: animFadeIn, height: window.height }}>
          <Scanner
            type={Camera.Constants.Type.back}
            ratio="16:9"
            style={{ width: screenWidth, height: Platform.OS === 'ios' ? screenHeight : cameraHeight }}
            onBarCodeRead={this.handleQRRead}
          >
            <RectangleContainer>
              <Rectangle color={rectangleColor} />
            </RectangleContainer>
          </Scanner>
          <Overlay />
          <CloseButton
            icon="close"
            onPress={this.handleAnimationDismiss}
            color={rectangleColor}
            fontSize={Platform.OS === 'ios' ? 46 : 36}
          />
        </Animated.View>
      </Wrapper>
    );
  }
}

