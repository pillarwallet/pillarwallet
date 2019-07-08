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
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import Header from 'components/Header';
import SlideModal from 'components/Modals/SlideModal';
import AssetPattern from 'components/AssetPattern';
import type { NavigationScreenProp } from 'react-navigation';
import AssetButtons from 'components/AssetButtons';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import Button from 'components/Button';
import ActivityFeed from 'components/ActivityFeed';
import {
  BoldText,
  BaseText,
  Paragraph,
} from 'components/Typography';
import TankAssetBalance from 'components/TankAssetBalance';
import {
  baseColors,
  spacing,
  fontSizes,
} from 'utils/variables';

const Description = styled(Paragraph)`
  padding-bottom: 80px;
  line-height: ${fontSizes.mediumLarge};
`;

const MessageTitle = styled(BoldText)`
  font-size: ${fontSizes.small}px;
  text-align: center;
  letter-spacing: 0.03px;
  color: #3f3d56;
`;

const Message = styled(BaseText)`
  padding-top: 6px;
  font-size: ${fontSizes.extraExtraSmall}px;
  color: ${baseColors.darkGray};
  text-align: center;
`;

const AssetCardWrapper = styled.View`
  flex: 1;
  justify-content: flex-start;
  padding-top: 10px;
  padding-bottom: 30px;
  background-color: ${baseColors.snowWhite};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.mediumLightGray};
  margin-top: 4px;
`;

const TokenValue = styled(BoldText)`
  font-size: ${fontSizes.semiGiant}px;
  text-align: center;
`;

const DataWrapper = styled.View`
  margin: 0 ${spacing.large}px ${spacing.large}px;
  justify-content: center;
  align-items: center;
  padding-bottom: 8px;
`;

const ValueInFiat = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  text-align: center;
  color: ${baseColors.darkGray};
  margin-top: 5px;
`;

const ValuesWrapper = styled.View`
  flex-direction: row;
`;

const Disclaimer = styled(BaseText)`
  font-size: ${fontSizes.extraSmall}px;
  text-align: center;
  color: ${baseColors.burningFire};
  margin-top: 5px;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  onPressBack?: () => void,
  onPressReceive: () => void,
  onPressSend: () => void,
  onPressExchange: () => void,
  onPressInfo?: () => void,
  // balance: number,
  assetName: string,
  assetSymbol: string,
  assetIcon: string,
  assetIsListed: boolean,
  assetDisclaimer?: string;
  assetDescription: string;
  receiveAddress: string,
  contractAddress?: string;
  noBalance: boolean,
  isSendDisabled: boolean,
  isReceiveDisabled: boolean,
  isReceiveModalVisible: boolean,
  onReceiveModalHide: () => void,
  onOpenShareDialog: () => void,
  displayAmount: string;
  paymentNetworkBalanceFormatted?: string;
  paymentNetworkBalanceInFiatFormatted?: string;
  fiatSymbol: string;
  balanceInFiatFormatted: string;
  sendingBlockedTitle?: string;
  sendingBlockedMessage?: string;
  sendingBlockedShowButton?: boolean;
  sendingBlockedButtonIsDisabled?: boolean;
  sendingBlockedButtonText?: string;
  sendingBlockedOnPressButton?: () => void;
  historyTabs?: Object[], // TODO
  historyActiveTab?: string;
  showDescriptionModal: boolean;
  onDescriptionModalHide: () => void;
  onRefresh?: () => void;
};

const AssetView = (props: Props) => {
  const {
    onPressBack,
    onPressReceive,
    onPressSend,
    onPressExchange,
    onPressInfo,
    // balance,
    assetName,
    assetSymbol,
    assetIcon,
    assetIsListed,
    assetDescription,
    receiveAddress,
    noBalance,
    isSendDisabled,
    isReceiveDisabled,
    isReceiveModalVisible,
    onReceiveModalHide,
    onOpenShareDialog,
    displayAmount,
    paymentNetworkBalanceFormatted,
    paymentNetworkBalanceInFiatFormatted,
    fiatSymbol,
    balanceInFiatFormatted,
    assetDisclaimer,
    sendingBlockedTitle,
    sendingBlockedMessage,
    sendingBlockedShowButton,
    sendingBlockedButtonText,
    sendingBlockedButtonIsDisabled,
    sendingBlockedOnPressButton,
    navigation,
    historyTabs,
    historyActiveTab,
    showDescriptionModal,
    onDescriptionModalHide,
    contractAddress,
  } = props;

  const paymentNetwork = (paymentNetworkBalanceFormatted || '0') !== '0';

  return (
    <Container color={baseColors.white} inset={{ bottom: 0 }}>
      <Header
        onBack={onPressBack}
        title={assetName}
        onNextPress={onPressInfo}
        nextIcon={onPressInfo && 'info-circle-inverse'}
        nextIconSize={onPressInfo && fontSizes.extraLarge}
      />
      <ScrollWrapper>
        <AssetPattern
          token={assetSymbol}
          icon={assetIcon}
          contractAddress={contractAddress}
          isListed={assetIsListed}
        />

        <DataWrapper>
          <TokenValue>
            {displayAmount} {assetSymbol}
          </TokenValue>
          {paymentNetwork && paymentNetworkBalanceFormatted &&
          <TankAssetBalance
            monoColor
            amount={paymentNetworkBalanceFormatted}
            wrapperStyle={{ marginBottom: 18 }}
          />
          }
          {assetIsListed &&
            <ValuesWrapper>
              <ValueInFiat>
                {fiatSymbol}{balanceInFiatFormatted}
              </ValueInFiat>
              {paymentNetwork && (
                <ValueInFiat>
                   + {fiatSymbol}{paymentNetworkBalanceInFiatFormatted}
                </ValueInFiat>
              )}
            </ValuesWrapper>
          }
          {!assetIsListed && assetDisclaimer &&
          <Disclaimer>
            {assetDisclaimer}
          </Disclaimer>
          }
        </DataWrapper>

        <AssetCardWrapper>
          { /*
          <View style={{ paddingHorizontal: spacing.mediumLarge, paddingTop: 10 }}>
            <TruncatedText lines={1} text={assetData.description} />
          </View
          > */}
          <AssetButtons
            onPressReceive={onPressReceive}
            onPressSend={onPressSend}
            onPressExchange={onPressExchange}
            noBalance={noBalance}
            isSendDisabled={isSendDisabled}
            isReceiveDisabled={isReceiveDisabled}
          />
          {isSendDisabled &&
          <Wrapper regularPadding style={{ marginTop: 30, alignItems: 'center' }}>
            <MessageTitle>{sendingBlockedTitle}</MessageTitle>
            <Message>{sendingBlockedMessage}</Message>
            {sendingBlockedShowButton &&
            <Button
              marginTop="20px"
              height={52}
              title={sendingBlockedButtonText || ''}
              disabled={sendingBlockedButtonIsDisabled}
              onPress={sendingBlockedOnPressButton}
            />
            }
          </Wrapper>
          }
        </AssetCardWrapper>
        {historyTabs &&
        <ActivityFeed
          feedTitle="transactions."
          navigation={navigation}
          backgroundColor={baseColors.white}
          showArrowsOnly
          noBorder
          wrapperStyle={{ marginTop: 10 }}
          tabs={historyTabs}
          activeTab={historyActiveTab}
        /> }
      </ScrollWrapper>

      <ReceiveModal
        isVisible={isReceiveModalVisible}
        onModalHide={onReceiveModalHide}
        address={receiveAddress}
        handleOpenShareDialog={onOpenShareDialog}
      />
      <SlideModal
        title={assetName}
        isVisible={showDescriptionModal}
        onModalHide={onDescriptionModalHide}
      >
        <Description small light>{assetDescription}</Description>
      </SlideModal>
    </Container>
  );
};

export default AssetView;
