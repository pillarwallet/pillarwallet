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
import { Image } from 'react-native';
import t from 'translations/translate';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

// constants
import styled, { withTheme } from 'styled-components/native';
import { DAI, ETH } from 'constants/assetsConstants';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { BaseText } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';

// utils
import { images } from 'utils/images';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// types
import type { Theme } from 'models/Theme';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Balances } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';


type StateProps = {|
  estimateErrorMessage: ?string,
  feeInfo: ?TransactionFeeInfo,
  balances: Balances,
|};

type OwnProps = {|
  onModalHide: () => void,
  onAllow: () => void,
|};

type Props = {|
  ...OwnProps,
  theme: Theme,
  assetSymbol: string,
  transactionPayload: Object,
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
  text-align: center;
`;

const ContentRow = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const daiIcon = require('assets/images/dai_color.png');
const usdcIcon = require('assets/images/usdc_color.png');
const poolTogetherLogo = require('assets/images/pool_together.png');

const PoolTokenAllowModal = ({
  onModalHide,
  onAllow,
  theme,
  estimateErrorMessage,
  assetSymbol,
  feeInfo,
  transactionPayload,
  balances,
}: Props) => {
  const modalRef = useRef();

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

  const tokenLogo = assetSymbol === DAI ? daiIcon : usdcIcon;
  const { genericToken: fallbackSource } = images(theme);
  const isDisabled = !feeInfo || !!errorMessage;

  return (
    <SlideModal
      ref={modalRef}
      onModalHide={onModalHide}
      noClose
      headerProps={({
        centerItems: [{ title: t('poolTogetherContent.title.authorizePoolTogether') }],
        sideFlex: 0,
        wrapperStyle: { paddingTop: 8, paddingHorizontal: spacing.small },
      })}
    >
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <ContentRow>
          <AssetImage
            style={{ marginRight: -11, zIndex: 1 }}
            source={tokenLogo}
            fallbackSource={fallbackSource}
          />
          <AssetImage
            style={{ marginLeft: -11, zIndex: 0 }}
            source={poolTogetherLogo}
            fallbackSource={fallbackSource}
          />
        </ContentRow>
        <Paragraph>
          {t('poolTogetherContent.paragraph.allowAutomationWithToken', { token: assetSymbol })}
        </Paragraph>
        {!!feeInfo && (
          <FeeLabelToggle
            labelText={t('label.fee')}
            txFeeInWei={feeInfo?.fee}
            gasToken={feeInfo?.gasToken}
            hasError={!!errorMessage}
            showFiatDefault
          />
        )}
        {!!errorMessage && (
          <BaseText negative style={{ marginTop: spacing.medium }}>
            {errorMessage}
          </BaseText>
        )}
        <Button
          secondary
          title={t('button.enable')}
          onPress={() => {
            if (modalRef.current) modalRef.current.close();
            onAllow();
          }}
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


const mapStateToProps = ({
  transactionEstimate: { feeInfo, errorMessage: estimateErrorMessage },
}: RootReducerState): StateProps => ({
  feeInfo,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default (withTheme(connect(combinedMapStateToProps)(PoolTokenAllowModal)): AbstractComponent<OwnProps>);
