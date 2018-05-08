// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { brandColors, UIColors } from 'utils/variables';

type Props = {
  name: string,
  email: string,
}

const ProfileCardWrapper = styled.View`
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid ${UIColors.defaultBorderColor};
  width: 100%;
  padding: 20px;
  align-items: center;
`;

const ProfileCardAvatar = styled.View`
  width: 60px;
  height: 60px;
  background-color: #d8d8d8;
  border: 1px solid ${UIColors.defaultBorderColor};
  border-radius: 30px;
  margin-bottom: 10px;
`;

const ProfileCardName = styled.Text`
  font-size: 22px;
  color: ${UIColors.defaultTextColor};
  margin-bottom: 10px;
`;

const ProfileCardEmail = styled.Text`
  font-size: 16px;
  color: ${UIColors.defaultTextColor};
`;

const ProfileCardBackgroundSquare = styled.View`
  width: ${props => props.size};
  height: ${props => props.size};
  background-color: ${props => props.background};
  position: absolute;
  top: ${props => props.top};
  left: ${props => props.left};
`;

const generateProfileCardBackgroundSquares = (input: string) => {
  const profileCardBackgroundSquares = [];
  let seedFromName = 0;


  for (let i = 0; i < input.length; i += 1) {
    seedFromName += input[i].charCodeAt(0);
  }

  function getRandomIntFromSeed() {
    const x = Math.sin(seedFromName += 1) * 10000;
    return x - Math.floor(x);
  }

  for (let i = 0; i < 6; i += 1) {
    let left = getRandomIntFromSeed() * 100;
    let top = getRandomIntFromSeed() * 100;
    let size = getRandomIntFromSeed() * 20;

    if (left > 20 && left < 50) {
      left = getRandomIntFromSeed() * 20;
    } else if (left < 80 && left > 50) {
      left = 100 - (getRandomIntFromSeed() * 20);
    }

    if (top > 20 && top < 50) {
      left = getRandomIntFromSeed() * 20;
    } else if (top < 80 && top > 50) {
      top = 100 - (getRandomIntFromSeed() * 20);
    }

    if (size < 20) {
      size = 10 + (getRandomIntFromSeed() * 20);
    } else if (size > 40) {
      size = 30 - (getRandomIntFromSeed() * 20);
    }

    left += '%';
    top += '%';

    const color = brandColors[Math.round(getRandomIntFromSeed() * brandColors.length)];

    profileCardBackgroundSquares.push(
      <ProfileCardBackgroundSquare
        key={i}
        background={color}
        size={size}
        left={left}
        top={top}
      />,
    );
  }

  return profileCardBackgroundSquares;
};

const ProfileCard = (props: Props) => {
  return (
    <ProfileCardWrapper>
      {generateProfileCardBackgroundSquares(props.name)}
      <ProfileCardAvatar />
      <ProfileCardName>{props.name}</ProfileCardName>
      <ProfileCardEmail>{props.email}</ProfileCardEmail>
    </ProfileCardWrapper>
  );
};

export default ProfileCard;
