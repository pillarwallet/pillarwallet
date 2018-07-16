// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontWeights, fontSizes } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import { CHAT } from 'constants/navigationConstants';
import ScreenHeader from 'components/ScreenHeader';

const imageChat = require('assets/images/btn_chat.png');

const ChatButton = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  margin: 40px 14px;
  padding: 0 6px;
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
`;

const ChatButtonImage = styled.Image`
  width: 27px;
  height: 27px;
  justify-content: center;
  display: flex;
`;

const ChatButtonText = styled.Text`
  color: ${baseColors.electricBlue};
  text-align: center;
  font-weight: 600;
  margin-top: 10px;
`;

const ContactHeader = styled.View`
  height: 200px;
  background: ${baseColors.electricBlue};
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px     ;
  shadow-opacity: 0.1;
  border-radius: 12px;
  align-items: center;
`;

const ContactHeaderBody = styled.View`
  height: 200px;
  margin-top: -48px;
  justify-content: center;
`;

const ContactHeaderName = styled.Text`
  font-size: ${fontSizes.extraExtraLarge};
  color: ${baseColors.white};
  font-weight: ${fontWeights.bold}'
`;

const ContactHeaderAvatarWrapper = styled.View`
  height: 64px;
  width: 64px;
  margin-top: -16px;
  border: 2px solid ${baseColors.white};
  background: ${baseColors.mediumGray};
  border-radius: 32px;
  margin-right: 14px;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px     ;
  shadow-opacity: 0.1;
`;

const ContactHeaderAvatar = styled.Image`

`;

type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
}

const Contact = (props: Props) => {
  const contact = props.navigation.getParam('contact', {});
  return (
    <Container>
      <ScreenHeader title="contact" onBack={props.navigation.goBack} />
      <Wrapper regularPadding>
        <ContactHeader>
          <ContactHeaderAvatarWrapper >
            <ContactHeaderAvatar />
          </ContactHeaderAvatarWrapper>
          <ContactHeaderBody>
            <ContactHeaderName>
              {contact.username}
            </ContactHeaderName>
          </ContactHeaderBody>
          <ChatButton onPress={() => { props.navigation.navigate(CHAT, { contact }); }}>
            <ImageHolder>
              <ChatButtonImage source={imageChat} />
            </ImageHolder>
            <ChatButtonText>CHAT</ChatButtonText>
          </ChatButton>
        </ContactHeader>
      </Wrapper>
    </Container>
  );
};

export default Contact;
