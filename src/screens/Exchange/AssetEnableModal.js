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
import { SafeAreaView } from 'react-navigation';
import { CachedImage } from 'react-native-cached-image';
import { getEnv } from 'configs/envConfig';

// constants
import styled, { withTheme } from 'styled-components/native';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { BaseText } from 'components/Typography';

// types
import type { Theme } from 'models/Theme';

// utils
import { images } from 'utils/images';

import type { EnableData } from './ExchangeOffers';


type Props = {
  onModalHide: () => void,
  onConfirm: (status: ?string) => void,
  isVisible: boolean,
  onEnable: () => void,
  enableData: EnableData,
  theme: Theme,
};


const ContentWrapper = styled(SafeAreaView)`
  width: 100%;
  padding-bottom: 40px;
  align-items: center;
`;

const AssetImage = styled(CachedImage)`
  margin-top: 4px;
  width: 64px;
  height: 64px;
`;

const Paragraph = styled(BaseText)`
  ${fontStyles.medium};
  margin-top: 20px;
  margin-bottom: 34px;
`;

const AssetEnableModal = (props: Props) => {
  const {
    onModalHide,
    onEnable,
    isVisible,
    enableData,
    theme,
  } = props;

  if (!enableData) {
    return null;
  }

  const {
    providerName,
    feeDisplayValue,
    feeInFiat,
    assetSymbol,
    assetIcon,
    isDisabled,
  } = enableData;
  const fullIconUrl = `${getEnv('SDK_PROVIDER')}/${assetIcon}?size=3`;

  const { genericToken: fallbackSource } = images(theme);
  return (
    <SlideModal
      isVisible={isVisible}
      onModalHide={onModalHide}
      noClose
      headerProps={{
        centerItems: [{ title: `Enable ${assetSymbol}` }],
        sideFlex: '0',
        wrapperStyle: { paddingTop: 8, paddingHorizontal: spacing.small },
      }}
    >
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <AssetImage
          source={{ uri: fullIconUrl }}
          fallbackSource={fallbackSource}
        />
        <Paragraph>
          {`Once enabled, it will be available for exchanging on ${providerName}`}
        </Paragraph>
        <Button
          secondary
          title={isDisabled ? 'Not enough ETH' : 'Enable'}
          onPress={onEnable}
          regularText
          style={{ marginBottom: 28 }}
          textStyle={{ fontSize: fontSizes.medium }}
          block
          disabled={isDisabled}
        />
        <BaseText secondary>
          {`Fee ${feeDisplayValue} (${feeInFiat})`}
        </BaseText>
      </ContentWrapper>
    </SlideModal>
  );
};

export default withTheme(AssetEnableModal);
