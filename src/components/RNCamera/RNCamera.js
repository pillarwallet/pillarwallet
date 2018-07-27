// @flow
import * as React from 'react';
import { baseColors, fontSizes } from 'utils/variables';
import Modal from 'react-native-modal';
import styled from 'styled-components/native';
import { View, TouchableOpacity, Text, Dimensions, Platform } from 'react-native';
import ButtonIcon from 'components/ButtonIcon';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';
import { Container } from 'components/Layout';
import { Camera, FileSystem } from 'expo';
import { Ionicons } from '@expo/vector-icons';
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
  currentCaptureUrl: string,
};

const ModalWrapper = styled.View`
  flex: 1;
  background-color: #ffffff;
  position: relative;
`;

const PhotoBoundariesWrapper = styled.View`
  flex: 1;
  alignItems: center;
  justifyContent: center;
  backgroundColor: transparent;
`;

const PhotoBoundaries = styled.View`
  height: ${Dimensions.get('window').width};
  width: ${Dimensions.get('window').width};
  border-radius: ${Dimensions.get('window').width / 2};
  borderWidth: 2;
  borderStyle: dashed;
  borderColor: ${props => props.color};
  backgroundColor: transparent;
`;

const CloseButton = styled(ButtonIcon)`
  position: absolute;
  right: 16px;
  top: 20px;
  zIndex: 5;
`;

const BottomBar = styled.View`
  position: absolute;
  bottom: 6px;
  left:0;
  width: 100%;
  padding-bottom: 5px;
  background-color: transparent;
  align-self: center;
  justify-content: center;
  flex: 0.12;
  flexDirection: row;
  zIndex: 20;
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

class RNCamera extends React.Component<Props, State> {
  camera: ?Object;

  constructor(props: Props) {
    super(props);
    this.state = {
      showResult: false,
      previewBase64: '',
      currentCaptureUrl: '',
    };
  }

  handleModalClose = () => {
    this.setState({ showResult: false });
  }

  componentDidMount() {
    FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}profile`).catch(e => {
      console.log(e, 'Directory exists'); // eslint-disable-line
    });
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
            currentCaptureUrl: res.uri,
            showResult: true,
          });
        })
        .catch((err) => console.log(err)); // eslint-disable-line
    }
    return false;
  };

  setImage = async () => {
    const { user, updateUserAvatar } = this.props;
    const { currentCaptureUrl } = this.state;
    const newImageUrl = `${FileSystem.documentDirectory}profile/${Date.now()}.jpg`;
    await FileSystem.moveAsync({
      from: currentCaptureUrl,
      to: newImageUrl,
    });
    const formData : any = new FormData();
    formData.append('walletId', user.walletId);
    formData.append('image', { uri: newImageUrl, name: 'image.jpg', type: 'multipart/form-data' });
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
      <BottomBar>
        <View style={{ flex: 0.4 }}>
          <TouchableOpacity
            onPress={this.takePicture}
            style={{ alignSelf: 'center' }}
          >
            <Ionicons name="ios-radio-button-on" size={70} color="white" />
          </TouchableOpacity>
        </View>
      </BottomBar>
    );
  }

  renderCamera = () =>
    (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000000',
        }}
      >
        <Camera
          ref={ref => {
            this.camera = ref;
          }}
          style={{
            width: screenWidth,
            height: Platform.OS === 'ios' ? screenHeight : cameraHeight,
            justifyContent: 'flex-end',
            position: 'relative',
          }}
          type="front"
          ratio="16:9"
        >
          <PhotoBoundariesWrapper>
            <PhotoBoundaries color="#ffffff" />
          </PhotoBoundariesWrapper>
        </Camera>
        {this.renderBottomBar()}
      </View>
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
        <ModalWrapper>
          <Container color={baseColors.black}>{content}</Container>
          <CloseButton
            icon="close"
            onPress={modalHide}
            color={this.state.showResult ? baseColors.darkGray : '#ffffff'}
            fontSize={fontSizes.small}
          />
        </ModalWrapper>
      </Modal>
    );
  }
}

const mapStateToProps = ({ user: { data: user } }) => ({ user });
const mapDispatchToProps = (dispatch: Function) => ({
  updateUserAvatar: (walletId: string, formData: any) => dispatch(updateUserAvatarAction(walletId, formData)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RNCamera);

