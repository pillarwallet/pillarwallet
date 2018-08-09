// @flow
import * as React from 'react';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import { TouchableOpacity, Text, Dimensions, Platform } from 'react-native';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';
import Header from 'components/Header';
import { Container, Footer } from 'components/Layout';
import { RNCamera } from 'react-native-camera';
import Icon from 'components/Icon';
import { connect } from 'react-redux';
import { updateUserAvatarAction } from 'actions/userActions';

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
};

const PhotoBoundaries = styled.View`
  height: ${Dimensions.get('window').width - 40};
  width: ${Dimensions.get('window').width - 40};
  border-radius: ${Dimensions.get('window').width / 2};
  border-width: 2;
  border-style: dashed;
  border-color: ${props => props.color};
  background-color: transparent;
  margin-bottom: 40px;
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

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const cameraHeight = screenWidth * (16 / 9);

class Camera extends React.Component<Props, State> {
  camera: ?Object;

  constructor(props: Props) {
    super(props);
    this.state = {
      showResult: false,
      previewBase64: '',
    };
  }

  handleModalClose = () => {
    this.setState({ showResult: false });
  }

  getBackToCamera = () => {
    this.setState({ showResult: false });
  }

  takePicture = () => {
    if (this.camera) {
      return this.camera.takePictureAsync({ base64: true })
        .then((res) => {
          this.setState({
            previewBase64: `data:image/jpg;base64,${res.base64}`,
            showResult: true,
          });
        })
        .catch((err) => console.log(err)); // eslint-disable-line
    }
    return false;
  };

  setImage = async () => {
    // const { user, updateUserAvatar } = this.props;
    // const { currentCaptureUrl } = this.state;
    // const newImageUrl = `${FileSystem.documentDirectory}profile/${Date.now()}.jpg`;
    // await FileSystem.moveAsync({
    //   from: currentCaptureUrl,
    //   to: newImageUrl,
    // });
    // const formData : any = new FormData();
    // formData.append('walletId', user.walletId);
    // formData.append('image', { uri: newImageUrl, name: 'image.jpg', type: 'multipart/form-data' });
    // updateUserAvatar(user.walletId, formData);
    // this.handleModalClose();
    // this.props.modalHide();

    // Jegor, look at the code above! It uses a derprecated Expo Filesystem module
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
        <TouchableOpacity
          onPress={this.takePicture}
          style={{ alignSelf: 'center' }}
        >
          <Icon name="send" style={{color: 'white'}} />
        </TouchableOpacity>
      </Footer>
    );
  }

  renderCamera = () =>
    (

      <React.Fragment>
        <RNCamera
          ref={ref => {
            this.camera = ref;
        }}
          style={{
            width: screenWidth,
            height: Platform.OS === 'ios' ? screenHeight : cameraHeight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          type="front"
          ratio="16:9"
        >
          <PhotoBoundaries color="#ffffff" />
        </RNCamera>
        {this.renderBottomBar()}
      </React.Fragment>
    );

  renderResult = () =>
    (
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
    const {
      isVisible,
      modalHide,
    } = this.props;

    const cameraScreenContent = this.props.permissionsGranted
      ? this.renderCamera()
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
          <Header overlay light onClose={modalHide} />
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

