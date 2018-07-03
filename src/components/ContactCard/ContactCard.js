// @flow
import * as React from 'react';
import styled from 'styled-components/native';

const ContactCardWrapper = styled.View`

`;

const ContactCardAvatar = styled.Image`

`;

const ContactCardName = styled.Text`

`;

const ContactCard = () => {
  return (
    <ContactCardWrapper>
      <ContactCardAvatar />
      <ContactCardName>John Doe</ContactCardName>
    </ContactCardWrapper>
  );
};

export default ContactCard;
