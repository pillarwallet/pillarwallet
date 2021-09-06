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
import styled, { useTheme } from 'styled-components/native';

// utils
import { resolveAssetSource } from 'utils/textInput';
import { images } from 'utils/images';
import { fontStyles } from 'utils/variables';
import { useTranslation } from 'translations/translate';

// components
import Icon from 'components/legacy/Icon';
import Image from 'components/Image';
import { BaseText, MediumText } from 'components/legacy/Typography';
import { Spacing } from 'components/legacy/Layout';

// types
import type { AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';


type Props = {
  asset: AssetOption | Collectible,
  labelText: ?string,
  onLabelPress: () => mixed,
  onAssetPress: () => mixed,
  disableAssetSelection: boolean,
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

const StyledImage = styled(Image)`
  height: 24px;
  width: 24px;
  border-radius: 12px;
  resize-mode: contain;
  ${({ source, theme }) => !source && `tint-color: ${theme.colors.text};`}
`;

const SelectorChevron = styled(Icon)`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.basic030};
`;

const ChevronWrapper = styled.View`
  width: 25px;
  align-items: center;
`;

const AssetName = styled(MediumText)`
  ${fontStyles.medium};
  flex: 1;
`;

const LabelText = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic000};
  margin-top: 1px;
`;

const ValueInputHeader = ({
  asset,
  labelText,
  onLabelPress,
  onAssetPress,
  disableAssetSelection,
}: Props) => {
  const { t } = useTranslation();

  const theme = useTheme();
  const { genericToken } = images(theme);

  const { name, iconUrl, imageUrl } = asset ?? {};

  const optionImageSource = iconUrl || imageUrl
    ? resolveAssetSource(imageUrl || iconUrl)
    : genericToken;

  return (
    <Wrapper>
      <SideWrapper onPress={onAssetPress} disabled={disableAssetSelection || !onAssetPress}>
        <StyledImage
          source={optionImageSource}
          resizeMode="contain"
          style={{ height: 24, width: 24 }}
        />

        {!disableAssetSelection && (
          <ChevronWrapper>
            <SelectorChevron name="selector" />
          </ChevronWrapper>
        )}

        <Spacing w={4} />
      </SideWrapper>

      <AssetName onPress={disableAssetSelection ? null : onAssetPress} numberOfLines={1}>
        {name ?? t('label.pleaseSelect')}
      </AssetName>

      <Spacing w={8} />

      <LabelText onPress={onLabelPress}>{labelText}</LabelText>
    </Wrapper>
  );
};

export default ValueInputHeader;
