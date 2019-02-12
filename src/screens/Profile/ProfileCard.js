// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, brandColors, UIColors, fontSizes } from 'utils/variables';
import { BaseText, BoldText } from 'components/Typography';

type Props = {
  name: string,
  email: string,
}

const ProfileCardWrapper = styled.View`
  background-color: ${baseColors.snowWhite};
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
  align-items: center;
  justify-content: center;
`;

const ProfileCardAvatarText = styled(BoldText)`
  font-size: ${fontSizes.large};
  color: ${baseColors.snowWhite};
`;

const ProfileCardName = styled(BaseText)`
  font-size: ${fontSizes.large};
  color: ${UIColors.defaultTextColor};
  margin-bottom: 10px;
`;

const ProfileCardEmail = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${UIColors.defaultTextColor};
`;

const ProfileCardBackgroundSquare = styled.View`
  width: ${props => props.size};
  height: ${props => props.size};
  background-color: ${props => props.background};
  position: absolute;
  top: ${props => props.top}%;
  left: ${props => props.left}%;
`;

const generateProfileCardBackgroundSquares = (input: string) => {
  const profileCardBackgroundSquares = [];
  const seedFromName = input.split('').reduce((seed, letter) => {
    return seed + letter.charCodeAt(0);
  }, 0);

  function getRandomIntFromSeed(seed, increment) {
    const x = Math.sin(seed / ((increment + 1) * 0.9)) * 10000;
    return x - Math.floor(x);
  }

  for (let i = 0; i < 6; i++) {
    const randomInt = getRandomIntFromSeed(seedFromName, i);
    let left = randomInt * 100;
    let top = randomInt * 100;
    let size = randomInt * 20;

    if (left > 20 && left < 50) {
      left = randomInt * 20;
    } else if (left < 80 && left > 50) {
      left = 100 - (randomInt * 20);
    }

    if (top > 20 && top < 50) {
      left = randomInt * 20;
    } else if (top < 80 && top > 50) {
      top = 100 - (randomInt * 20);
    }

    if (size < 20) {
      size = 10 + (randomInt * 20);
    } else if (size > 40) {
      size = 30 - (randomInt * 20);
    }
    const color = brandColors[Math.round(randomInt * (brandColors.length - 1))];

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
  const initials = props.name
    .split(' ')
    .map(name => name.substring(0, 1))
    .join('')
    .toUpperCase();

  return (
    <ProfileCardWrapper>
      {generateProfileCardBackgroundSquares(props.name)}
      <ProfileCardAvatar>
        <ProfileCardAvatarText>{initials}</ProfileCardAvatarText>
      </ProfileCardAvatar>
      <ProfileCardName>{props.name}</ProfileCardName>
      <ProfileCardEmail>{props.email}</ProfileCardEmail>
    </ProfileCardWrapper>
  );
};

export default ProfileCard;
