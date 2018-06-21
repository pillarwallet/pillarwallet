// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';

const CircleImage = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
`;

const ImageTouchable = styled.TouchableOpacity`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #d8d8d8;
`;

const AvatarText = styled.Text`
  font-size: ${fontSizes.large};
  font-weight: ${fontWeights.bold};
  color: ${baseColors.white};
`;

type Props = {
  uri?: string,
  userName: string,
}

export default class ProfileImage extends React.Component<Props> {
  render() {
    const { uri, userName } = this.props;

    const initials = userName
      .split(' ')
      .map(name => name.substring(0, 1))
      .join('')
      .toUpperCase();

    return (
      <ImageTouchable>
        {!uri && <AvatarText>{initials}</AvatarText>}
        {!!uri && <CircleImage source={{ uri }} />}
      </ImageTouchable>
    );
  }
}

