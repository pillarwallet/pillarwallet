// @flow
import * as React from 'react';
import styled from 'styled-components/native';

const PersonCardWrapper = styled.View`

`;

const PersonCardAvatar = styled.Image`

`;

const PersonCardName = styled.Text`

`;

const PersonCard = () => {
  return (
    <PersonCardWrapper>
      <PersonCardAvatar />
      <PersonCardName>John Doe</PersonCardName>
    </PersonCardWrapper>
  );
};

export default PersonCard;
