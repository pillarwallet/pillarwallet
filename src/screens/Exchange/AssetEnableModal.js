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
import styled, { withTheme } from 'styled-components/native';
import t from 'translations/translate';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { BaseText } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';

// types
import type { Theme } from 'models/Theme';

// utils
import { images } from 'utils/images';

import type { TransactionFeeInfo } from 'models/Transaction';
import type { EnableData } from './ExchangeOffers';


type Props = {
  onModalHide: () => void,
  onConfirm: (status: ?string) => void,
  isVisible: boolean,
  onEnable: () => void,
  enableData: EnableData,
  theme: Theme,
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateErrorMessage: ?string,
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
    estimateErrorMessage,
    feeInfo,
    isEstimating,
  } = props;

  if (!enableData) {
    return null;
  }

  const {
    providerName,
    // feeDisplayValue,
    // feeInFiat,
    assetSymbol,
    assetIcon,
  } = enableData;
  const fullIconUrl = `${getEnv().SDK_PROVIDER}/${assetIcon}?size=3`;

  const { genericToken: fallbackSource } = images(theme);

  const isDisabled = !!estimateErrorMessage || isEstimating;

  return (
    <SlideModal
      isVisible={isVisible}
      onModalHide={onModalHide}
      noClose
      headerProps={{
        centerItems: [{ title: t('exchangeContent.modal.enableAsset.title', { asset: assetSymbol }) }],
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
          {t('exchangeContent.modal.enableAsset.paragraph', { providerName })}
        </Paragraph>
        <FeeLabelToggle
          txFeeInWei={feeInfo?.fee}
          gasToken={feeInfo?.gasToken}
          isLoading={isEstimating}
          hasError={!!estimateErrorMessage}
        />
        <Button
          secondary
          title={estimateErrorMessage || t('exchangeContent.modal.enableAsset.button.enable')}
          onPress={onEnable}
          regularText
          style={{ marginTop: 28 }}
          textStyle={{ fontSize: fontSizes.medium }}
          block
          disabled={isDisabled}
        />
      </ContentWrapper>
    </SlideModal>
  );
};

export default withTheme(AssetEnableModal);
