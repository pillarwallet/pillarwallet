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
import { CachedImage } from 'react-native-cached-image';
import styled, { withTheme } from 'styled-components/native';
import type { Option } from 'models/Selector';
import { resolveAssetSource } from 'utils/textInput';
import { images } from 'utils/images';
import type { Theme } from 'models/Theme';
import Icon from 'components/Icon';
import { themedColors } from 'utils/themes';
import { BaseText, MediumText } from 'components/Typography';
import { fontStyles } from 'utils/variables';

type Props = {
  theme: Theme,
  asset: Option,
  labelText: string,
  onLabelPress: () => void,
  onAssetPress: () => void,
};

const Wrapper = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  height: 24px;
`;

const SideWrapper = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const Image = styled(CachedImage)`
  height: 24px;
  width: 24px;
  resize-mode: contain;
  ${({ source, theme }) => !source && `tint-color: ${theme.colors.text};`}
`;

const SelectorChevron = styled(Icon)`
  font-size: 16px;
  color: ${themedColors.secondaryText};
`;

const ChevronWrapper = styled.View`
  width: 25px;
  align-items: center;
  margin-right: 4px;
`;

const AssetName = styled(MediumText)`
  ${fontStyles.medium};
  ${({ theme }) => `color: ${theme.colors.text};`}
`;

const LabelText = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.link}
`;

const ExchangeInputHeader = (props: Props) => {
  const {
    asset, labelText, onLabelPress, onAssetPress, theme,
  } = props;
  const { id, name, imageUrl } = asset;
  const optionImageSource = resolveAssetSource(imageUrl);
  const { genericToken } = images(theme);
  return (
    <Wrapper>
      <SideWrapper onPress={onAssetPress} >
        <Image
          key={id}
          source={optionImageSource}
          fallbackSource={genericToken}
          resizeMode="contain"
          style={{ height: 24, width: 24 }}
        />
        <ChevronWrapper>
          <SelectorChevron name="selector" />
        </ChevronWrapper>
        <AssetName>{name}</AssetName>
      </SideWrapper>
      <SideWrapper onPress={onLabelPress} >
        <LabelText>{labelText}</LabelText>
      </SideWrapper>
    </Wrapper>
  );
};

export default withTheme(ExchangeInputHeader);
