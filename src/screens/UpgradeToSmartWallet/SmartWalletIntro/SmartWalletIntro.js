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
import { StyleSheet } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-cached-image';
// import { utils } from 'ethers';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Wrapper } from 'components/Layout';
import { MediumText, BoldText } from 'components/Typography';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import { LabelBadge } from 'components/LabelBadge';
import Button from 'components/Button';
import SlideModal from 'components/Modals/SlideModal';

import { baseColors, fontStyles } from 'utils/variables';
import { responsiveSize } from 'utils/ui';
// import { formatAmount, getCurrencySymbol, getGasPriceWei } from 'utils/common';
// import { getRate } from 'utils/assets';

import { CHOOSE_ASSETS_TO_TRANSFER, EXCHANGE, ASSETS } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';

import { deploySmartWalletAction } from 'actions/smartWalletActions';
// import smartWalletService from 'services/smartWallet';


type Props = {
  navigation: NavigationScreenProp<*>,
  addNetwork: Function,
  baseFiatCurrency: ?string,
  deploySmartWallet: Function,
}

type State = {
  showDeployPayOptions: boolean,
}

const CustomWrapper = styled.View`
  flex: 1;
  padding: 20px 55px 20px 46px;
`;

const Title = styled(BoldText)`
  color: ${baseColors.persianBlue};
  ${fontStyles.rJumbo};
`;

const BodyText = styled(MediumText)`
  color: ${baseColors.persianBlue};
  ${fontStyles.rBig};
  margin-top: ${responsiveSize(26)}px;
`;

// const FeeText = styled(MediumText)`
//   color: ${baseColors.darkGray};
//   font-size: ${fontSizes.rMedium}px;
//   line-height: ${responsiveSize(22)}px;
//   margin-top: ${responsiveSize(16)}px;
// `;

const ButtonWrapper = styled(Wrapper)`
  margin: 30px 0 50px;
  padding: 0 46px;
`;

const ActionsWrapper = styled(Wrapper)`
  margin: 10px -20px 50px;
  border-bottom-width: ${StyleSheet.hairlineWidth}px;
  border-top-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${baseColors.mediumLightGray};
`;


const FeatureIcon = styled(CachedImage)`
  height: 124px;
  width: 124px;
  margin-bottom: 24px;
`;

const smartWalletIcon = require('assets/images/logo_smart_wallet.png');

class SmartWalletIntro extends React.PureComponent<Props, State> {
  state = {
    showDeployPayOptions: false,
  };

  render() {
    const { showDeployPayOptions } = this.state;
    const {
      navigation,
      baseFiatCurrency,
      deploySmartWallet,
      // gasInfo,
      // rates,
    } = this.props;
    const isDeploy = navigation.getParam('deploy', false);

    // const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    // const gasPriceWei = getGasPriceWei(gasInfo);
    // const deployEstimate = smartWalletService.getDeployEstimate(gasPriceWei);
    // const feeSmartContractDeployEth = formatAmount(utils.formatEther(deployEstimate));
    // const feeSmartContractDeployFiat = parseFloat(feeSmartContractDeployEth) * getRate(rates, ETH, fiatCurrency);
    // const fiatSymbol = getCurrencySymbol(fiatCurrency);
    //
    // const smartContractDeployFee =
    //   `~${feeSmartContractDeployEth} ETH (${fiatSymbol}${feeSmartContractDeployFiat.toFixed(2)})`;

    return (
      <ContainerWithHeader
        headerProps={{ floating: true }}
        backgroundColor={baseColors.zircon}
      >
        <ScrollWrapper contentContainerStyle={{ paddingTop: 80 }}>
          <CustomWrapper>
            <FeatureIcon source={smartWalletIcon} />
            <Title>
              Smart Wallet
            </Title>
            <BodyText>
              Your new Pillar Smart Wallet is powered by a personal smart contract. This provides better asset
              management, security and recovery functionality.
            </BodyText>
            <BodyText>
              In order to enable your Smart Wallet, it needs to be deployed which comes with a small fee.
            </BodyText>
            <BodyText>
              Pillar also recommends that you transfer most of your assets to your Smart Wallet due to the benefits
              listed.
            </BodyText>
            { /* <FeeText>{smartContractDeployFee}</FeeText> */ }
          </CustomWrapper>
          <ButtonWrapper>
            <Button
              block
              title={isDeploy ? 'Deploy' : 'Proceed'}
              onPress={() => { this.setState({ showDeployPayOptions: true }); }}
              style={{
                backgroundColor: baseColors.persianBlue,
                marginTop: 40,
                marginBottom: 20,
                borderRadius: 6,
              }}
              textStyle={{ color: baseColors.white }}
            />
            { /* <ListItemChevron
              label="Enable with PLR available"
              onPress={() => () => navigation.navigate(CHOOSE_ASSETS_TO_TRANSFER)}
              color={baseColors.persianBlue}
              bordered
            /> */ }
          </ButtonWrapper>
          <SlideModal
            // title={}
            isVisible={showDeployPayOptions}
            onModalHide={() => { this.setState({ showDeployPayOptions: false }); }}
          >
            <ActionsWrapper>
              <ListItemChevron
                label="I don't have tokens"
                subtext="Buy ETH with credit card"
                onPress={() => {
                  this.setState({ showDeployPayOptions: false }, () => {
                    navigation.navigate(EXCHANGE, {
                      fromAssetCode: baseFiatCurrency || defaultFiatCurrency,
                      toAssetCode: 'ETH',
                    });
                  });
                }}
                color={baseColors.persianBlue}
                bordered
                subtextAddon={(<LabelBadge label="NEW" />)}
              />
              <ListItemChevron
                label="I have tokens"
                subtext="Use ETH to deploy contract"
                onPress={() => {
                  this.setState({ showDeployPayOptions: false }, () => {
                    if (isDeploy) {
                      deploySmartWallet();
                      navigation.navigate(ASSETS);
                    } else {
                      navigation.navigate(CHOOSE_ASSETS_TO_TRANSFER);
                    }
                  });
                }}
                color={baseColors.persianBlue}
                bordered
              />
            </ActionsWrapper>
          </SlideModal>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  // history: { gasInfo },
  // rates: { data: rates },
}) => ({
  baseFiatCurrency,
  // gasInfo,
  // rates,
});


const mapDispatchToProps = (dispatch: Function) => ({
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SmartWalletIntro);
