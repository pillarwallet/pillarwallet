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
import styled, { withTheme } from 'styled-components/native';
import ImagePicker from 'react-native-image-crop-picker';
import { RNCamera } from 'react-native-camera';
import { connect } from 'react-redux';
import SvgOverlay, { Path, LinearGradient, Stop, Circle } from 'react-native-svg';
import t from 'translations/translate';

import Modal from 'components/Modal';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';
import Header from 'components/Header';
import { Footer } from 'components/Layout';
import IconButton from 'components/IconButton';
import Spinner from 'components/Spinner';
import { BaseText } from 'components/Typography';

import { updateUserAvatarAction } from 'actions/userActions';
import { handleImagePickAction } from 'actions/appSettingsActions';

import { fontSizes } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { printLog } from 'utils/common';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme, ThemeColors } from 'models/Theme';
import type { User } from 'models/User';

type StateProps = {|
  user: User,
|};

type DispatchProps = {|
  updateUserAvatar: Function,
  handleImagePick: Function,
|};

type OwnProps = {|
  permissionsGranted: boolean,
|};

type Props = {|
  ...StateProps,
  ...DispatchProps,
  ...OwnProps,
  theme: Theme,
|};

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

const FRONT_FLASH_COLOR = '#ffe8ce';

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
  background-color: ${FRONT_FLASH_COLOR};
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
  background-color: ${themedColors.surface};
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
  background-color: ${themedColors.primary};
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
  modalRef = React.createRef<Modal>();

  state = {
    showResult: false,
    previewBase64: '',
    imageUri: '',
    cameraType: FRONT,
    isFlashOn: false,
    isHardwareFlashOn: false,
    isFrontFlashVisible: false,
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
        .catch((err) => printLog(err));
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
        printLog(err);
      });
  };

  setImage = async () => {
    const { user, updateUserAvatar } = this.props;
    const { imageUri } = this.state;
    const formData: any = new FormData();
    formData.append('walletId', user.walletId);
    formData.append('image', { uri: imageUri, name: 'image.jpg', type: 'multipart/form-data' });
    updateUserAvatar(user.walletId, formData);
    this.closeCamera();
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
    if (this.modalRef.current) this.modalRef.current.close();
  };

  renderNoPermissions = () => {
    return (
      <React.Fragment>
        <HeaderWrapper>
          <Header light flexStart onClose={this.closeCamera} />
        </HeaderWrapper>
        <NoPermissions>
          <BaseText style={{ color: 'white' }}>{t('paragraph.cameraPermissionMissing')}</BaseText>
        </NoPermissions>
      </React.Fragment>
    );
  };

  renderBottomBar = (colors: ThemeColors) => {
    return (
      <Footer>
        <FooterInner>
          <IconButton
            icon="gallery"
            onPress={this.openGallery}
            fontSize={fontSizes.large}
            color={colors.control}
          />
          <CameraButtonOuter onPress={this.takePicture}>
            <CameraButtonInner />
          </CameraButtonOuter>
          <IconButton
            icon="flip"
            onPress={this.handleCameraFlip}
            fontSize={fontSizes.large}
            color={colors.control}
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
    const { theme } = this.props;
    const colors = getThemeColors(theme);

    const cutOutD = screenWidth - 40;
    const cutOutR = cutOutD / 2;
    const centerYpos = screenHeight / 2;

    /* eslint-disable i18next/no-literal-string */
    const overlayPath = `
    M 0 0 h${screenWidth} v${screenHeight} h-${screenWidth}Z
    M 20,${centerYpos} m 0,0
    a ${cutOutR},${cutOutR} 0 1,0 ${cutOutD},0
    a ${cutOutR},${cutOutR} 0 1,0 -${cutOutD},0
    `;
    /* eslint-enable i18next/no-literal-string */

    const overlayColor = isFlashOn && cameraType === FRONT ? FRONT_FLASH_COLOR : '#000000';
    const flashIcon = isFlashOn ? 'flash-on' : 'flash-off'; // eslint-disable-line i18next/no-literal-string
    return (
      <React.Fragment>
        <RNCamera
          captureAudio={false}
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
            stroke={colors.control}
            strokeWidth="2"
          />
        </SvgOverlay>
        {!!isFrontFlashVisible && <FrontFlash />}
        <HeaderWrapperCamera>
          <Header light flexStart onClose={this.closeCamera} onBack={this.handleFlash} backIcon={flashIcon} />
        </HeaderWrapperCamera>
        {this.renderBottomBar(colors)}
      </React.Fragment>
    );
  };

  render() {
    const { permissionsGranted } = this.props;

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
        ref={this.modalRef}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        animationIn="fadeIn"
        animationOut="fadeOut"
        hideModalContentWhileAnimating
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
            <Button marginBottom="20px" onPress={this.setImage} title={t('button.confirm')} />
            <ButtonText buttonText={t('button.tryAgain')} onPress={this.getBackToCamera} />
          </ResultScreenFooter>
        </ResultScreen>
        }
      </Modal>
    );
  }
}

const mapStateToProps = ({ user: { data: user } }: RootReducerState): StateProps => ({ user });
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  updateUserAvatar: (walletId: string, formData: any) => dispatch(updateUserAvatarAction(walletId, formData)),
  handleImagePick: (isPickingImage: boolean) => dispatch(handleImagePickAction(isPickingImage)),
});

type ExportedComponent = React.AbstractComponent<OwnProps>;
export default (withTheme(connect(mapStateToProps, mapDispatchToProps)(Camera)): ExportedComponent);
