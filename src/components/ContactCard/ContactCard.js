// @flow
import * as React from 'react';
import { baseColors, UIColors, fontSizes, fontWeights } from 'utils/variables';
import styled from 'styled-components/native';

type Props = {
  onPress: Function,
}

const ContactCardWrapper = styled.TouchableHighlight`
  background: ${baseColors.white};
  border: 1px solid ${UIColors.defaultBorderColor};
  margin-bottom: -4px;
  height: 75px;
  padding: 14px;
  border-radius: 4px;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px     ;
  shadow-opacity: 0.1;
`;

const ContactCardInner = styled.View`
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
  shadow-radius: 2px     ;
  shadow-opacity: 0.1;
`;

const ContactCardName = styled.Text`
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
`;

export default class ContactCard extends React.Component<Props> {
  render() {
    return (
      <ContactCardWrapper
        onPress={this.props.onPress}
        underlayColor={baseColors.lightGray}
      >
        <ContactCardInner>
          <ContactCardAvatarWrapper>
            <ContactCardAvatar />
          </ContactCardAvatarWrapper>
          <ContactCardName>John Doe</ContactCardName>
        </ContactCardInner>
      </ContactCardWrapper>
    );
  }
}

