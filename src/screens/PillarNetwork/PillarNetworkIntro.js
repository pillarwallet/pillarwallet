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
import { FlatList, Platform } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import t from 'translations/translate';

import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/legacy/Layout';
import { BoldText, MediumText } from 'components/legacy/Typography';
import Icon from 'components/legacy/Icon';
import Image from 'components/Image';
import Button from 'components/legacy/Button';
import { LabelBadge } from 'components/LabelBadge';

import { ASSETS } from 'constants/navigationConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';

import { fontStyles } from 'utils/variables';
import { responsiveSize } from 'utils/ui';
import { delay } from 'utils/common';
import { getThemeColors, themedColors } from 'utils/themes';

import { ensureArchanovaAccountConnectedAction, setPLRTankAsInitAction } from 'actions/smartWalletActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { switchAccountAction } from 'actions/accountsActions';
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Account } from 'models/Account';
import type { Theme } from 'models/Theme';

type Props = {
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: Function,
  addNetwork: Function,
  ensureArchanovaAccountConnected: Function,
  switchAccount: Function,
  accounts: Account[],
  smartWalletState: Object,
  setPLRTankAsInit: Function,
  setActiveBlockchainNetwork: Function,
  theme: Theme,
}
type State = {
  processingCreate: boolean,
}

const CustomWrapper = styled.View`
  flex: 1;
  padding: 20px 55px 40px 46px;
`;

const Title = styled(BoldText)`
  color: ${themedColors.PPNText};
  ${fontStyles.rJumbo};
`;

const BodyText = styled(MediumText)`
  color: ${themedColors.PPNText};
  ${fontStyles.rBig};
  margin-top: ${responsiveSize(26)}px;
`;

const ListItemWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  margin-top: ${responsiveSize(19)}px;
`;

const ContentWrapper = styled.View`
  align-items: stretch;
  margin-left: ${responsiveSize(19)}px;
  flex: 1;
  flex-wrap: wrap;
`;

const Label = styled(MediumText)`
  color: ${themedColors.PPNText};
  ${fontStyles.rLarge};
`;

const Subtext = styled(MediumText)`
  color: ${themedColors.PPNText};
  ${fontStyles.rBig};
  margin-top: ${responsiveSize(10)}px;
`;

const FeatureIcon = styled(Image)`
  height: 124px;
  width: 124px;
  margin-bottom: 24px;
`;

const Wrapper = styled.View`
  position: relative;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
`;

const ButtonWrapper = styled(Wrapper)`
  padding: 0 46px 20px;
`;

const PPNIcon = require('assets/images/logo_PPN.png');

class PillarNetworkIntro extends React.Component<Props, State> {
  state = {
    processingCreate: false,
  };

  goToPLRTank = async () => {
    const {
      ensureArchanovaAccountConnected,
      navigation,
      accounts,
      switchAccount,
      setPLRTankAsInit,
      setActiveBlockchainNetwork,
    } = this.props;
    this.setState({ processingCreate: true });
    const smartAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET);
    if (!smartAccount) {
      this.setState({ processingCreate: false });
      return;
    }
    await switchAccount(smartAccount.id);
    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK);
    await delay(500);
    ensureArchanovaAccountConnected()
      .then(() => {
        this.setState({ processingCreate: false },
          () => {
            navigation.navigate(ASSETS);
            setPLRTankAsInit();
          });
      })
      .catch(() => null);
  };

  render() {
    const { processingCreate } = this.state;
    const { theme } = this.props;
    const colors = getThemeColors(theme);

    const features = [
      {
        key: 'instant',
        label: t('ppnContent.ppnFeatures.first.title'),
        subtext: t('ppnContent.ppnFeatures.first.description'),
      },
      {
        key: 'free',
        label: t('ppnContent.ppnFeatures.second.title'),
        subtext: t('ppnContent.ppnFeatures.second.description'),
      },
      {
        key: 'private',
        label: t('ppnContent.ppnFeatures.three.title'),
        subtext: t('ppnContent.ppnFeatures.three.description'),
      },
    ];


    return (
      <ContainerWithHeader
        headerProps={{
          floating: true,
          transparent: true,
          light: true,
        }}
        backgroundColor={colors.PPNSurface}
      >
        <ScrollWrapper contentContainerStyle={{ paddingTop: 80 }}>
          <CustomWrapper>
            <FeatureIcon source={PPNIcon} />
            <Title>
              {t('pillarNetwork')}
            </Title>
            <BodyText>
              {t('ppnContent.paragraph.introFirstParagraph')}
            </BodyText>
            <LabelBadge
              label={t('label.comingSoon')}
              containerStyle={{ backgroundColor: colors.orange, marginTop: 57, paddingVertical: 2 }}
              labelStyle={{ color: colors.PPNText, fontSize: responsiveSize(11) }}
            />
            <BodyText style={{ marginTop: 10 }}>
              {t('ppnContent.paragraph.introSecondParagraph')}
            </BodyText>
            <FlatList
              data={features}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <ListItemWrapper>
                  <Icon
                    name="check"
                    style={{
                      fontSize: responsiveSize(13),
                      color: colors.PPNText,
                      marginTop: responsiveSize(12),
                    }}
                  />
                  <ContentWrapper>
                    <Label>{item.label}</Label>
                    <Subtext>{item.subtext}</Subtext>
                  </ContentWrapper>
                </ListItemWrapper>
              )}
              style={{ marginTop: 20 }}
            />
          </CustomWrapper>
          <ButtonWrapper>
            <Button
              title={t('ppnContent.button.goToTank')}
              onPress={this.goToPLRTank}
              style={{
                backgroundColor: colors.PPNText,
                marginTop: 40,
                marginBottom: 20,
              }}
              textStyle={{ color: colors.PPNSurface }}
              isLoading={processingCreate}
            />
          </ButtonWrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}: RootReducerState): $Shape<Props> => ({
  accounts,
  smartWalletState,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  ensureArchanovaAccountConnected: () => dispatch(ensureArchanovaAccountConnectedAction()),
  setPLRTankAsInit: () => dispatch(setPLRTankAsInitAction()),
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(PillarNetworkIntro));
