// @flow
import * as React from 'react';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';
import styled from 'styled-components/native';

const ContactCardWrapper = styled.View`
  background: ${baseColors.white};
  border: 1px solid ${baseColors.lightGray};
  margin-bottom: -4px;
  height: 75px;
  padding: 14px;
  border-radius: 4px;
  justify-content: flex-start;
  flex-direction: row;
  align-items: center;

`;

const ContactCardAvatar = styled.Image`

`;

const ContactCardAvatarWrapper = styled.View`
  height: 44px;
  width: 44px;
  border: 2px solid ${baseColors.white};
  background: ${baseColors.mediumGray};
  border-radius: 22px;
  margin-right: 14px;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 4px     ;
  shadow-opacity: 0.1;
`;

const ContactCardName = styled.Text`
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
`;

const ContactCard = () => {
  return (
    <ContactCardWrapper>
      <ContactCardAvatarWrapper>
        <ContactCardAvatar />
      </ContactCardAvatarWrapper>
      <ContactCardName>John Doe</ContactCardName>
    </ContactCardWrapper>
  );
};

export default ContactCard;
