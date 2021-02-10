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

import React, { useRef } from 'react';
import type { AbstractComponent } from 'react';
import { SafeAreaView } from 'react-navigation';
import { getEnv } from 'configs/envConfig';
import styled, { withTheme } from 'styled-components/native';
import t from 'translations/translate';
import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import Image from 'components/Image';
import { fontStyles, spacing } from 'utils/variables';
import { BaseText } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';

// constants
import { ETH } from 'constants/assetsConstants';

// utils
import { images } from 'utils/images';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { Balances } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';

// local
import type { EnableData } from './ExchangeOffers';


type StateProps = {|
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateErrorMessage: ?string,
  balances: Balances,
|};

type OwnProps = {|
  onModalHide: () => void,
  onEnable: () => void,
  enableData: EnableData,
  transactionPayload: Object,
|};

type Props = {|
  ...StateProps,
  ...OwnProps,
  theme: Theme,
|};

const ContentWrapper = styled(SafeAreaView)`
  width: 100%;
  padding-bottom: 40px;
  align-items: center;
`;

const AssetImage = styled(Image)`
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
    enableData,
    theme,
    estimateErrorMessage,
    feeInfo,
    isEstimating,
    balances,
    transactionPayload,
  } = props;

  const modalRef = useRef();

  const {
    providerName,
    assetSymbol,
    assetIcon,
  } = enableData;

  const fullIconUrl = `${getEnv().SDK_PROVIDER}/${assetIcon}?size=3`;

  const { genericToken: fallbackSource } = images(theme);

  let notEnoughForFee;
  if (feeInfo) {
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, {
      ...transactionPayload,
      txFeeInWei: feeInfo.fee,
      gasToken: feeInfo.gasToken,
    });
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const isDisabled = !!errorMessage || isEstimating;

  return (
    <SlideModal
      ref={modalRef}
      onModalHide={onModalHide}
      noClose
      headerProps={({
        centerItems: [{ title: t('exchangeContent.modal.enableAsset.title', { asset: assetSymbol }) }],
        sideFlex: 0,
        wrapperStyle: { paddingTop: 8, paddingHorizontal: spacing.small },
      })}
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
          hasError={!!errorMessage}
        />
        <Button
          secondary
          title={errorMessage || t('exchangeContent.modal.enableAsset.button.enable')}
          onPress={() => {
            if (modalRef.current) modalRef.current.close();
            onEnable();
          }}
          style={{ marginTop: 28 }}
          disabled={isDisabled}
        />
      </ContentWrapper>
    </SlideModal>
  );
};

const mapStateToProps = ({
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<StateProps> => ({
  feeInfo,
  isEstimating,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default (withTheme(connect(combinedMapStateToProps)(AssetEnableModal)): AbstractComponent<OwnProps>);
