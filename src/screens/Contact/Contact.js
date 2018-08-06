// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontSizes } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import { BoldText } from 'components/Typography';
import Button from 'components/Button';
import { CHAT } from 'constants/navigationConstants';
import SlideModal from 'components/Modals/SlideModal';
import Header from 'components/Header';
import ProfileImage from 'components/ProfileImage';

const imageChat = require('assets/images/btn_chat.png');

const ChatButton = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  margin: 40px 14px;
  padding: 6px;
`;

const ImageHolder = styled.View`
  border-radius: 50;
  width: 54px;
  height: 54px;
  background: ${baseColors.lightGray};
  justify-content: center;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow: .5px 1px 1px ${baseColors.mediumGray};
  elevation: 6;
  z-index: 2;
`;

const ChatButtonImage = styled.Image`
  width: 27px;
  height: 27px;
  justify-content: center;
  display: flex;
`;

const ChatButtonText = styled(BoldText)`
  color: ${baseColors.electricBlue};
  text-align: center;
  margin-top: 10px;
`;

const ContactWapper = styled.View`
  height: 218px;
  position: relative;
  justify-content: flex-end;
  margin-top: 30px;
`;

const ContactHeader = styled.View`
  height: 200px;
  background: ${baseColors.cyan};
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px;
  shadow-opacity: 0.1;
  border-radius: 12px;
  align-items: center;
  position: relative;
  z-index: -1;
  padding-top: 46px;
`;

const ContactHeaderBody = styled.View`
  height: 200px;
  margin-top: -48px;
  justify-content: center;
`;

const ContactHeaderName = styled(BoldText)`
  font-size: ${fontSizes.extraExtraLarge};
  color: ${baseColors.white};
`;

const ContactHeaderAvatarWrapper = styled.View`
  height: 64px;
  width: 64px;
  border: 2px solid ${baseColors.white};
  background: ${baseColors.cyan};
  border-radius: 32px;
  margin-right: 14px;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px     ;
  shadow-opacity: 0.1;
  position: absolute;
  top: 0;
  left: 50%;
  margin-left: -32px;
`;

type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
}

type State = {
  isOptionsModalActive: boolean,
}

export default class Contact extends React.Component<Props, State> {
  state = {
    isOptionsModalActive: false,
  }

  openOptionsModal = () => {
    this.setState({
      isOptionsModalActive: true,
    });
  }

  closeOptionsModal = () => {
    this.setState({
      isOptionsModalActive: false,
    });
  }

  render() {
    const { navigation } = this.props;
    const { isOptionsModalActive } = this.state;
    const contact = navigation.getParam('contact', {});

    return (
      <Container>
        <Header
          title="contact"
          onBack={() => navigation.goBack(null)}
          onNextPress={this.openOptionsModal}
          nextIcon="more"
        />
        <Wrapper regularPadding>
          <ContactWapper>
            <ContactHeader>
              <ContactHeaderBody>
                <ContactHeaderName>
                  {contact.username}
                </ContactHeaderName>
              </ContactHeaderBody>
            </ContactHeader>
            <ContactHeaderAvatarWrapper >
              <ProfileImage
                uri={contact.avatar}
                userName={contact.username}
                diameter={60}
                textStyle={{ fontSize: 32 }}
              />
            </ContactHeaderAvatarWrapper>
          </ContactWapper>
          <ChatButton onPress={() => { navigation.navigate(CHAT, { contact }); }}>
            <ImageHolder>
              <ChatButtonImage source={imageChat} />
            </ImageHolder>
            <ChatButtonText>CHAT</ChatButtonText>
          </ChatButton>
        </Wrapper>
        <SlideModal
          title="manage"
          isVisible={isOptionsModalActive}
          onModalHide={this.closeOptionsModal}
        >
          <Button secondary block marginBottom="10px" onPress={() => {}} title="Mute" />
          <Button secondary block marginBottom="10px" onPress={() => {}} title="Remove connection" />
          <Button secondary danger block marginBottom="10px" onPress={() => {}} title="Report / Block" />
        </SlideModal>
      </Container>
    );
  }
}
