// @flow
import * as React from 'react';
import { Text, Dimensions, Platform, StatusBar } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import ImagePicker from 'react-native-image-crop-picker';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';
import Header from 'components/Header';
import { Footer } from 'components/Layout';
import IconButton from 'components/IconButton';
import Spinner from 'components/Spinner';
import { RNCamera } from 'react-native-camera';
import { connect } from 'react-redux';
import { updateUserAvatarAction } from 'actions/userActions';
import { baseColors, fontSizes } from 'utils/variables';
import Svg, { Path, LinearGradient, Stop } from 'react-native-svg';
import { handleImagePickAction } from 'actions/profileActions';

type Props = {
  onModalHide?: Function,
  isVisible: boolean,
  modalHide: Function,
  updateUserAvatar: Function,
  permissionsGranted: boolean,
  user: Object,
  navigation: NavigationScreenProp<*>,
  handleImagePick: Function,
  isPickingImage: boolean,
};

type State = {
  showResult: boolean,
  previewBase64: string,
  imageUri: string,
  cameraType: string,
  isFlashOn: boolean,
  isHardwareFlashOn: boolean,
  isFrontFlashVisible: boolean,
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const HeaderWrapper = styled.SafeAreaView`
  margin-bottom: auto;
  width: 100%;
`;

const HeaderWrapperCamera = styled.SafeAreaView`
  margin-bottom: auto;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
`;

const FrontFlash = styled.View`
  height: ${screenHeight}px;
  width: ${screenWidth}px;
  position: absolute;
  top: 0;
  left: 0;
  background-color: ${baseColors.blanchedAlmond};
`;

const PhotoBoundaries = styled.View`
  height: ${screenWidth - 40};
  width: ${screenWidth - 40};
  border-radius: ${(screenWidth - 40) / 2};
  border-width: 2;
  border-color: ${props => props.color};
  background-color: transparent;
`;

const PhotoBoundariesWrapper = styled.View`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  justify-content: center;
  align-items: center;
`;

const Overlay = styled(Svg)`
  position: absolute; 
  top: 0;
  left: 0;
`;

const NoPermissions = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 10px;
`;

const PreviewWrapper = styled.View`
  width: 160px;
  height: 160px;
  border-radius: 80px;
  justify-content: center;
  align-items: center; 
`;

const ImageCircle = styled.Image`
  width: 160px;
  height: 160px;
  border-radius: 80px;
`;

const ResultScreen = styled.View`
  height: ${screenHeight}px;
  width: ${screenWidth}px;
  position: absolute;
  top: 0;
  left: 0;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 30px;
  background-color: #ffffff;
  z-index: 2;
`;

const ResultScreenFooter = styled.View`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 30px 0;
`;

const CameraButtonOuter = styled.TouchableOpacity`
  border: 3px solid white;
  width: 72px;
  height: 72px;
  border-radius: 36px;
  align-self: center;
  justify-content: center;
  align-items: center;
`;

const CameraButtonInner = styled.View`
  width: 26px;
  height: 26px;
  background-color: ${baseColors.electricBlue};
`;

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
`;

const FRONT = 'front';
const BACK = 'back';
const FLASH_ON = 'on';
const FLASH_OFF = 'off';

class Camera extends React.Component<Props, State> {
  camera: ?Object;
  hardwareFlashTimeout: TimeoutID;
  frontFlashTimeout: TimeoutID;

  constructor(props: Props) {
    super(props);
    this.state = {
      showResult: false,
      previewBase64: '',
      imageUri: '',
      cameraType: FRONT,
      isFlashOn: false,
      isHardwareFlashOn: false,
      isFrontFlashVisible: false,
    };
  }

  handleModalClose = () => {
    this.setState({ showResult: false });
  };

  getBackToCamera = () => {
    this.setState({
      showResult: false,
      previewBase64: '',
      imageUri: '',
    });
  };

  takePicture = () => {
    const { isFlashOn, cameraType } = this.state;
    if (this.camera) {
      if (isFlashOn && cameraType === FRONT) {
        this.setState({ isFrontFlashVisible: true });
        this.frontFlashTimeout = setTimeout(() => {
          this.setState({ isFrontFlashVisible: false });
          clearTimeout(this.frontFlashTimeout);
        }, 500);
      }

      if (!isFlashOn) {
        this.setState({
          showResult: true,
        });
      }

      return this.camera.takePictureAsync({
        mirrorImage: cameraType === FRONT,
      })
        .then((res) => {
          this.setState({
            showResult: true,
            previewBase64: res.uri,
            imageUri: res.uri,
          });
        })
        .catch((err) => console.log(err)); // eslint-disable-line
    }
    return false;
  };

  openGallery = async () => {
    this.props.handleImagePick(true, null);

    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropperCircleOverlay: true,
      cropping: true,
    })
      .then((image) => {
        this.props.handleImagePick(false);
        this.setState({
          previewBase64: image.path,
          showResult: true,
          imageUri: image.path,
        });
      })
      .catch((err) => console.log(err)); // eslint-disable-line
  };

  setImage = async () => {
    const { user, updateUserAvatar } = this.props;
    const { imageUri } = this.state;
    const formData: any = new FormData();
    formData.append('walletId', user.walletId);
    formData.append('image', { uri: imageUri, name: 'image.jpg', type: 'multipart/form-data' });
    updateUserAvatar(user.walletId, formData);
    this.props.modalHide();
  };

  handleFlash = () => {
    this.setState({
      isFlashOn: !this.state.isFlashOn,
      isHardwareFlashOn: this.state.cameraType === BACK && !this.state.isFlashOn,
    });
  };

  handleCameraFlip = () => {
    this.setState({
      cameraType: this.state.cameraType === FRONT ? BACK : FRONT,
      isHardwareFlashOn: false,
    });

    if (this.state.cameraType === FRONT && this.state.isFlashOn) {
      this.hardwareFlashTimeout = setTimeout(() => {
        this.setState({
          isHardwareFlashOn: true,
        });
        clearTimeout(this.hardwareFlashTimeout);
      }, 500);
    }
  };

  closeCamera = () => {
    const { modalHide } = this.props;
    this.setState({
      showResult: false,
      previewBase64: '',
      imageUri: '',
      cameraType: FRONT,
      isFlashOn: false,
      isHardwareFlashOn: false,
      isFrontFlashVisible: false,
    });
    modalHide();
  };

  renderNoPermissions = () => {
    const { modalHide } = this.props;
    return (
      <React.Fragment>
        <HeaderWrapper>
          <Header light flexStart onClose={modalHide} />
        </HeaderWrapper>
        <NoPermissions>
          <Text style={{ color: 'white' }}>
            Camera permissions not granted - cannot open camera preview.
          </Text>
        </NoPermissions>
      </React.Fragment>
    );
  };

  renderBottomBar = () => {
    return (
      <Footer>
        <FooterInner>
          <IconButton
            icon="gallery"
            onPress={() => this.openGallery()}
            fontSize={fontSizes.extraLarge}
            color={baseColors.white}
          />
          <CameraButtonOuter onPress={this.takePicture} >
            <CameraButtonInner />
          </CameraButtonOuter>
          <IconButton
            icon="flip"
            onPress={() => this.handleCameraFlip()}
            fontSize={fontSizes.extraLarge}
            color={baseColors.white}
          />
        </FooterInner>
      </Footer>
    );
  };

  renderCamera = () => {
    const {
      cameraType,
      isFlashOn,
      isHardwareFlashOn,
      isFrontFlashVisible,
    } = this.state;

    const cutOutD = screenWidth - 40;
    const cutOutR = cutOutD / 2;
    const centerYpos = Platform.OS === 'ios' ? screenHeight / 2 : (screenHeight - StatusBar.currentHeight) / 2;
    const overlayPath = `
    M 0 0 h${screenWidth} v${screenHeight} h-${screenWidth}Z
    M 20,${centerYpos} m 0,0
    a ${cutOutR},${cutOutR} 0 1,0 ${cutOutD},0
    a ${cutOutR},${cutOutR} 0 1,0 -${cutOutD},0
    `;
    const overlayColor = isFlashOn && cameraType === FRONT ? baseColors.blanchedAlmond : baseColors.black;
    const flashIcon = isFlashOn ? 'flash-on' : 'flash-off';
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
          ratio="16:9"
          type={cameraType}
          flashMode={isHardwareFlashOn ? FLASH_ON : FLASH_OFF}
        />
        <Overlay height={screenHeight} width={screenWidth}>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={overlayColor} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={overlayColor} stopOpacity="0.7" />
          </LinearGradient>
          <Path
            d={overlayPath}
            fill="url(#grad)"
            fill-rule="evenodd"
          />
        </Overlay>
        {!!isFrontFlashVisible && <FrontFlash />}
        <HeaderWrapperCamera>
          <Header light flexStart onClose={this.closeCamera} onBack={this.handleFlash} backIcon={flashIcon} />
        </HeaderWrapperCamera>
        <PhotoBoundariesWrapper pointerEvents="none">
          <PhotoBoundaries color={baseColors.white} />
        </PhotoBoundariesWrapper>
        {this.renderBottomBar()}
      </React.Fragment>
    );
  };

  render() {
    const { isVisible, modalHide } = this.props;

    const cameraScreenContent = this.props.permissionsGranted
      ? this.renderCamera()
      : this.renderNoPermissions();

    const preview = this.state.previewBase64
      ? (
        <ImageCircle
          resizeMode="cover"
          source={{ uri: this.state.previewBase64 }}
        />
      )
      : (<Spinner />);

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
        {cameraScreenContent}
        {!!this.state.showResult &&
          <ResultScreen>
            <PreviewWrapper>
              {preview}
            </PreviewWrapper>
            <ResultScreenFooter>
              <Button marginBottom="20px" onPress={this.setImage} title="Confirm" />
              <ButtonText buttonText="Try again" onPress={this.getBackToCamera} />
            </ResultScreenFooter>
          </ResultScreen>
        }
      </Modal>
    );
  }
}

const mapStateToProps = ({ user: { data: user } }) => ({ user });
const mapDispatchToProps = (dispatch: Function) => ({
  updateUserAvatar: (walletId: string, formData: any) => dispatch(updateUserAvatarAction(walletId, formData)),
  handleImagePick: (isPickingImage: boolean) => dispatch(handleImagePickAction(isPickingImage)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Camera);

