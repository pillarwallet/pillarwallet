// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { Dimensions } from 'react-native';
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
import { BaseText } from 'components/Typography';
import { RNCamera } from 'react-native-camera';
import { connect } from 'react-redux';
import { updateUserAvatarAction } from 'actions/userActions';
import { baseColors, fontSizes, UIColors } from 'utils/variables';
import SvgOverlay, { Path, LinearGradient, Stop, Circle } from 'react-native-svg';
import { handleImagePickAction } from 'actions/appSettingsActions';

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
  background-color: ${UIColors.defaultBackgroundColor};
  z-index: 10;
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
  listeners: Object[];
  camera: ?Object;
  hardwareFlashTimeout: TimeoutID;
  frontFlashTimeout: TimeoutID;

  state = {
    showResult: false,
    previewBase64: '',
    imageUri: '',
    cameraType: FRONT,
    isFlashOn: false,
    isHardwareFlashOn: false,
    isFrontFlashVisible: false,
  };

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
    this.setState({ previewBase64: '' });

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
        forceUpOrientation: true,
        fixOrientation: true,
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
    const { handleImagePick } = this.props;
    handleImagePick(true);

    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropperCircleOverlay: true,
      cropping: true,
    })
      .then((image) => {
        handleImagePick(false);
        this.setState({
          previewBase64: image.path,
          showResult: true,
          imageUri: image.path,
        });
      })
      .catch((err) => {
        handleImagePick(false);
        console.log(err); // eslint-disable-line
      });
  };

  setImage = async () => {
    const { user, updateUserAvatar, modalHide } = this.props;
    const { imageUri } = this.state;
    const formData: any = new FormData();
    formData.append('walletId', user.walletId);
    formData.append('image', { uri: imageUri, name: 'image.jpg', type: 'multipart/form-data' });
    updateUserAvatar(user.walletId, formData);
    modalHide();
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
          <BaseText style={{ color: 'white' }}>
            Camera permissions not granted - cannot open camera preview.
          </BaseText>
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
            onPress={this.openGallery}
            fontSize={fontSizes.extraLarge}
            color={baseColors.white}
          />
          <CameraButtonOuter onPress={this.takePicture} >
            <CameraButtonInner />
          </CameraButtonOuter>
          <IconButton
            icon="flip"
            onPress={this.handleCameraFlip}
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
    const { isVisible } = this.props;

    const cutOutD = screenWidth - 40;
    const cutOutR = cutOutD / 2;
    const centerYpos = screenHeight / 2;
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
        {!!isVisible &&
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
        }
        <SvgOverlay
          height={screenHeight}
          width={screenWidth}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <LinearGradient id="grad" x1="0%" y1="0" x2="0%" y2={screenHeight}>
            <Stop offset="0%" stopColor={overlayColor} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={overlayColor} stopOpacity="0.7" />
          </LinearGradient>
          <Path
            d={overlayPath}
            fill="url(#grad)"
            fill-rule="evenodd"
          />
          <Circle
            cx={screenWidth / 2}
            cy={screenHeight / 2}
            r={cutOutR}
            fill="none"
            stroke={baseColors.white}
            strokeWidth="2"
          />
        </SvgOverlay>
        {!!isFrontFlashVisible && <FrontFlash />}
        <HeaderWrapperCamera>
          <Header light flexStart onClose={this.closeCamera} onBack={this.handleFlash} backIcon={flashIcon} />
        </HeaderWrapperCamera>
        {this.renderBottomBar()}
      </React.Fragment>
    );
  };

  render() {
    const { isVisible, modalHide, permissionsGranted } = this.props;

    const cameraScreenContent = permissionsGranted
      ? this.renderCamera()
      : this.renderNoPermissions();

    const preview = this.state.previewBase64
      ? <ImageCircle resizeMode="cover" source={{ uri: this.state.previewBase64 }} />
      : <Spinner />;

    const animationInTiming = 300;
    const animationOutTiming = !this.state.imageUri ? 300 : 1;

    return (
      <Modal
        isVisible={isVisible}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        animationIn="fadeIn"
        animationOut="fadeOut"
        hideModalContentWhileAnimating
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

