// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontWeights, fontSizes } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import Title from 'components/Title';

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

const Contact = () => {
  return (
    <Container>
      <Wrapper regularPadding>
        <Title title="contact" />
        <ContactHeader>
          <ContactHeaderAvatarWrapper >
            <ContactHeaderAvatar />
          </ContactHeaderAvatarWrapper>
          <ContactHeaderBody>
            <ContactHeaderName>
              John Doe
            </ContactHeaderName>
          </ContactHeaderBody>
        </ContactHeader>

      </Wrapper>
    </Container>
  );
};

export default Contact;
