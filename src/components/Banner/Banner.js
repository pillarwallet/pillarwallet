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
import styled, { withTheme } from 'styled-components/native';

import IconButton from 'components/IconButton';
import Image from 'components/Image';
import { Paragraph } from 'components/Typography';
import { fontSizes, spacing } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import type { Theme } from 'models/Theme';


type Props = {
  bannerText: string,
  onClose: () => void,
  onPress?: () => void,
  wrapperStyle?: Object,
  isVisible?: boolean,
  imageProps?: Object,
  theme: Theme,
};

const Wrapper = styled.View`
`;

const BannerContentWrapper = styled.TouchableOpacity`
  position: relative;
  background-color: ${({ theme }) => theme.colors.basic050};
  border: 1px solid ${({ theme }) => theme.colors.basic080};
  border-radius: 6px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
`;

const BannerTextWrapper = styled.View`
  padding: ${spacing.medium}px 26px ${spacing.medium}px ${spacing.mediumLarge}px;
  flex-shrink: 1;
`;

const Close = styled(IconButton)`
  height: 16px;
  width: 16px;
  position: absolute;
  top: 6px;
  right: 8px;
`;

const BannerParagraph = styled(Paragraph)`
  margin: 8px 0;
`;

const BannerImage = styled(Image)`
  align-self: flex-end;
`;

const Banner = (props: Props) => {
  const {
    bannerText,
    onClose,
    isVisible,
    wrapperStyle,
    imageProps,
    onPress,
    theme,
  } = props;

  const colors = getThemeColors(theme);

  if (!isVisible) return null;
  return (
    <Wrapper style={{ padding: spacing.mediumLarge, ...wrapperStyle }}>
      <BannerContentWrapper onPress={onPress} disabled={!onPress}>
        <BannerTextWrapper>
          <BannerParagraph small>
            {bannerText}
          </BannerParagraph>
        </BannerTextWrapper>
        {!!imageProps && <BannerImage {...imageProps} resizeMode="contain" />}
        <Close
          icon="rounded-close"
          color={colors.basic020}
          onPress={onClose}
          fontSize={fontSizes.small}
          horizontalAlign="flex-end"
          hitSlop={{
            top: 8, bottom: 10, left: 10, right: 8,
          }}
        />
      </BannerContentWrapper>
    </Wrapper>
  );
};

export default withTheme(Banner);
