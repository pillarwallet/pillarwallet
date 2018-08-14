// @flow
import * as React from 'react';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import { Text, Dimensions } from 'react-native';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';
import Header from 'components/Header';
import { Container, Footer } from 'components/Layout';
import { RNCamera } from 'react-native-camera';
import { connect } from 'react-redux';
import { updateUserAvatarAction } from 'actions/userActions';
import { baseColors } from 'utils/variables';

type Props = {
  onModalHide?: Function,
  isVisible: boolean,
  modalHide: Function,
  updateUserAvatar: Function,
  permissionsGranted: boolean,
  user: Object,
};

type State = {
  showResult: boolean,
  previewBase64: string,
  imageUri: string,
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const PhotoBoundaries = styled.View`
  height: ${Dimensions.get('window').width - 40};
  width: ${Dimensions.get('window').width - 40};
  border-radius: ${Dimensions.get('window').width / 2};
  border-width: 2;
  border-style: dashed;
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

const NoPermissions = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 10;
`;

const ImageCircle = styled.Image`
  width: 160px;
  height: 160px;
  border-radius: 80px;
  resizeMode: cover;
  margin-bottom: 10px;
`;

const ResultScreen = styled.View`
   flex: 1;
   flex-direction: column;
   justify-content: center;
   align-items: center;
   padding: 30px;
   background-color: #ffffff;
`;

const ResultScreenFooter = styled.View`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 30px 0;
`;

const CameraButtonOuter = styled.TouchableOpacity`
  border: 4px solid white;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  align-self: center;
  justify-content: center;
  align-items: center;
`;

const CameraButtonInner = styled.View`
  width: 44px;
  height: 44px;
  background-color: ${baseColors.white};
  border-radius: 22px;
`;

class Camera extends React.Component<Props, State> {
  camera: ?Object;

  constructor(props: Props) {
    super(props);
    this.state = {
      showResult: false,
      previewBase64: '',
      imageUri: '',
    };
  }

  handleModalClose = () => {
    this.setState({ showResult: false });
  };

  getBackToCamera = () => {
    this.setState({ showResult: false });
  };

  takePicture = () => {
    if (this.camera) {
      return this.camera.takePictureAsync({ base64: true })
        .then((res) => {
          this.setState({
            previewBase64: `data:image/jpg;base64,${res.base64}`,
            showResult: true,
            imageUri: res.uri,
          });
        })
        .catch((err) => console.log(err)); // eslint-disable-line
    }
    return false;
  };

  setImage = async () => {
    const { user, updateUserAvatar } = this.props;
    const { imageUri } = this.state;
    const formData: any = new FormData();
    formData.append('walletId', user.walletId);
    formData.append('image', { uri: imageUri, name: 'image.jpg', type: 'multipart/form-data' });
    updateUserAvatar(user.walletId, formData);
    this.handleModalClose();
    this.props.modalHide();
  };


  renderNoPermissions = () => {
    return (
      <NoPermissions>
        <Text style={{ color: 'white' }}>
          Camera permissions not granted - cannot open camera preview.
        </Text>
      </NoPermissions>
    );
  };

  renderBottomBar = () => {
    return (
      <Footer>
        <CameraButtonOuter onPress={this.takePicture} >
          <CameraButtonInner />
        </CameraButtonOuter>
      </Footer>
    );
  };

  renderCamera = (modalHide: Function) => (
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
        type="front"
        ratio="16:9"
      >
        <Header light flexStart onClose={modalHide} />
      </RNCamera>
      <PhotoBoundariesWrapper pointerEvents="none">
        <PhotoBoundaries color={baseColors.white} />
      </PhotoBoundariesWrapper>
      {this.renderBottomBar()}
    </React.Fragment>
  );

  renderResult = () => (
    <ResultScreen>
      <ImageCircle
        source={{ uri: this.state.previewBase64 }}
      />
      <ResultScreenFooter>
        <Button marginBottom="20px" onPress={this.setImage} title="Confirm" />
        <ButtonText buttonText="Try again" onPress={this.getBackToCamera} />
      </ResultScreenFooter>
    </ResultScreen>
  );

  render() {
    const { isVisible, modalHide } = this.props;

    const cameraScreenContent = this.props.permissionsGranted
      ? this.renderCamera(modalHide)
      : this.renderNoPermissions();
    const content = this.state.showResult ? this.renderResult() : cameraScreenContent;

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
          {content}
        </Container>
      </Modal>
    );
  }
}

const mapStateToProps = ({ user: { data: user } }) => ({ user });
const mapDispatchToProps = (dispatch: Function) => ({
  updateUserAvatar: (walletId: string, formData: any) => dispatch(updateUserAvatarAction(walletId, formData)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Camera);

