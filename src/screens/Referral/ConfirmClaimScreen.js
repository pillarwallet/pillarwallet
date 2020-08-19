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
import { connect } from 'react-redux';
import { View } from 'react-native';
import t from 'translations/translate';

import type { NavigationScreenProp } from 'react-navigation';
import type { ClaimTokenAction } from 'actions/referralsActions';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { RewardsByCompany } from 'reducers/referralsReducer';

import { LightText, MediumText } from 'components/Typography';
import { Container } from 'components/Layout';
import Button from 'components/Button';
import Header from 'components/Header';
import styled from 'styled-components/native';
import AssetPattern from 'components/AssetPattern';
import { fontSizes } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { getCampaignRewardText } from 'utils/referrals';
import { claimTokensAction } from 'actions/referralsActions';
import ProcessingClaim from './ProcessingClaim';
import ErrorClaim from './ErrorClaim';


const Center = styled.View`
  alignItems: stretch;
  margin-top: 30px;
  margin-bottom: 50px;
  margin-horizontal: 20px;
`;

const MainWrapper = styled.View`
  flex: 1;
  flexDirection: column;
  justifyContent: space-between;
`;

const assetData = {
  token: 'PLR',
  iconColor: 'https://api-qa-core.pillarproject.io/asset/images/tokens/icons/plrColor.png?size=3',
};

const TokenValue = styled(MediumText)`
  font-size: ${fontSizes.giant}px;
  text-align: center;
`;

const TextCode = styled(LightText)`
  font-size: ${fontSizes.big}px;
  color: ${themedColors.secondaryText};
  text-align: center;
  margin-bottom: 30px;
`;

type Props = {
  claimTokens: Function,
  user: Object,
  navigation: NavigationScreenProp<*>,
  rewardsByCampaign: RewardsByCompany,
};

type State = {
  isFetching: boolean,
  isError: boolean,
};


class ConfirmClaimScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isFetching: false,
      isError: false,
    };
  }

  handleClaim = () => {
    const { navigation, claimTokens, user } = this.props;
    const code = navigation.getParam('code', 'No code');
    this.setState({ isError: false, isFetching: true });
    claimTokens({ walletId: user.walletId, code }, ({ error }) => {
      if (error) {
        this.setState({ isError: true, isFetching: false });
      } else {
        navigation.goBack();
      }
    });
  };

  render() {
    const { navigation, rewardsByCampaign } = this.props;
    const code = navigation.getParam('code', t('referralsContent.label.noReferralCode'));
    const { isFetching, isError } = this.state;
    const rewardText = getCampaignRewardText(rewardsByCampaign.pillar);

    return (
      <Container>
        <Header gray title={t('referralsContent.title.claimTokens')} onBack={() => navigation.goBack(null)} />
        <MainWrapper>
          <TextCode>{t('referralsContent.label.fromCode', { code })}</TextCode>
          {isError && <ErrorClaim />}
          {isFetching && <ProcessingClaim />}
          {!(isError || isFetching) &&
            <View style={{ flex: 2 }}>
              <AssetPattern
                token={assetData.token}
                icon={assetData.iconColor}
                isListed
              />
              <TokenValue>
                {rewardText}
              </TokenValue>
            </View>
          }
          <Center>
            <Button disabled={isFetching || isError} onPress={this.handleClaim} title={t('button.claim')} />
          </Center>
        </MainWrapper>
      </Container>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  claimTokens: (props: ClaimTokenAction, callback: Function) => dispatch(claimTokensAction(props, callback)),
});

const mapStateToProps = ({
  user: { data: user },
  referrals: { rewardsByCampaign },
}: RootReducerState): $Shape<Props> => ({
  user,
  rewardsByCampaign,
});

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmClaimScreen);
