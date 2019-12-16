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

import IconButton from 'components/IconButton';
import { Paragraph } from 'components/Typography';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';

type Props = {
  bannerText: string,
  onClose: () => void,
  onPress?: () => void,
  wrapperStyle?: Object,
  isVisible?: boolean,
  imageProps?: Object,
}

const Wrapper = styled.View`
`;

const BannerContentWrapper = styled.TouchableOpacity`
  position: relative;
  background-color: ${themedColors.card};
  border: 1px solid ${themedColors.border};
  border-radius: 6px;
  flex-direction: row;
  align-items: flex-end;
  overflow: hidden;
`;

const BannerTextWrapper = styled.View`
  padding: ${spacing.medium}px ${spacing.mediumLarge}px;
  flex-shrink: 1;
`;

const Close = styled(IconButton)`
  height: 44px;
  width: 44px;
  position: absolute;
  top: 0;
  right: 16px;
`;

const BannerParagraph = styled(Paragraph)`
  margin: 8px 0;
`;

const BannerImage = styled(CachedImage)`
`;

export const Banner = (props: Props) => {
  const {
    bannerText,
    onClose,
    isVisible,
    wrapperStyle,
    imageProps,
    onPress,
  } = props;

  if (!isVisible) return null;
  return (
    <Wrapper style={{ padding: spacing.mediumLarge, ...wrapperStyle }}>
      <BannerContentWrapper onPress={onPress} dsiabled={!onPress}>
        <BannerTextWrapper>
          <BannerParagraph>
            {bannerText}
          </BannerParagraph>
        </BannerTextWrapper>
        {!!imageProps && <BannerImage {...imageProps} resizeMode="contain" />}
        <Close
          icon="close"
          color={baseColors.coolGrey}
          onPress={onClose}
          fontSize={fontSizes.small}
          horizontalAlign="flex-end"
        />
      </BannerContentWrapper>
    </Wrapper>
  );
};
