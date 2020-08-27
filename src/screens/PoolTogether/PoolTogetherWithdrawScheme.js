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
import { CachedImage } from 'react-native-cached-image';
import t from 'translations/translate';

// components
import { MediumText, BaseText } from 'components/Typography';
import DynamicSizeImage from 'components/DynamicSizeImage';
import ProfileImage from 'components/ProfileImage';
import { Spacing } from 'components/Layout';


type ImageObject = {
  uri: string,
}

type Props = {
  wrapperStyle?: Object,
  toValue: number | string,
  toValueInFiat: string,
  toAssetCode: string,
  imageSource: ?string | ImageObject,
  user: Object,
};

const arrowDownGrey = require('assets/icons/arrow_down_grey.png');

const SchemeWrapper = styled.View`
  justify-content: flex-start;
  align-items: center;
`;

const LogoWrapper = styled.View`
  width: 100%;
  align-items: center;
  padding-top: 20px;
`;

const PoolTogetherWithdrawScheme = (props: Props) => {
  const {
    wrapperStyle,
    toValue,
    toValueInFiat,
    toAssetCode,
    imageSource,
    user,
  } = props;

  const { profileImage, lastUpdateTime, username } = user;
  const userImageUri = profileImage ? `${profileImage}?t=${lastUpdateTime || 0}` : null;

  return (
    <SchemeWrapper style={wrapperStyle}>
      <LogoWrapper>
        <DynamicSizeImage
          imageSource={imageSource}
          fallbackWidth={64}
          fallbackHeight={64}
        />
        <Spacing h={8} />
        <BaseText medium>{t('poolTogether')}</BaseText>
      </LogoWrapper>
      <Spacing h={16} />
      <CachedImage
        style={{ width: 17, height: 41 }}
        source={arrowDownGrey}
        resizeMode="contain"
      />
      <Spacing h={16} />
      <ProfileImage
        uri={userImageUri}
        userName={username}
        diameter={64}
        noShadow
        borderWidth={0}
      />
      <Spacing h={8} />
      <BaseText medium>{user.username}</BaseText>
      <Spacing h={20} />
      <MediumText giant center>
        {toValue}
        <MediumText big> {toAssetCode}</MediumText>
      </MediumText>
      <Spacing h={8} />
      <BaseText small secondary>{toValueInFiat}</BaseText>
    </SchemeWrapper>
  );
};

export default PoolTogetherWithdrawScheme;
