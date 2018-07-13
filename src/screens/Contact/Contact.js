// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontWeights, fontSizes } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import ScreenHeader from 'components/ScreenHeader';

const ContactHeader = styled.View`
  height: 200px;
  background: ${baseColors.warmPurple};
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
        </ContactHeader>

      </Wrapper>
    </Container>
  );
};

export default Contact;
