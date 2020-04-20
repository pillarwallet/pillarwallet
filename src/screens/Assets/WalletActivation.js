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
import { ScrollView, Linking, View } from 'react-native';
import { TX_DETAILS_URL } from 'react-native-dotenv';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { fontStyles } from 'utils/variables';
import { BaseText, MediumText } from 'components/Typography';
import Button from 'components/Button';
import InviteBanner from 'screens/People/InviteBanner';
import { goToInvitationFlowAction } from 'actions/referralsActions';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

const Title = styled(MediumText)`
  ${fontStyles.large};
  margin: 0 14px;
  text-align: center;
`;

const Text = styled(BaseText)`
  ${fontStyles.medium};
  margin: 35px 0;
`;

const ButtonsWrapper = styled.View`
  width: 100%;
  margin-bottom: 32px;
`;

const title = 'Smart Wallet is being activated';

// eslint-disable-next-line quotes
const text = `It won’t take long. While activation is in progress, \
feel free to explore exciting features of Pillar Smart Wallet`;

type Props = {
  referralsFeatureEnabled: boolean,
  goToInvitationFlow: () => void,
  deploymentHash: ?string,
}

class WalletActivation extends React.PureComponent<Props> {
  handleFaq = () => {
    Linking.openURL('https://help.pillarproject.io/en/articles/3935106-smart-wallet-faq');
  };

  handleEtherscan = () => {
    const { deploymentHash } = this.props;
    if (deploymentHash) {
      Linking.openURL(`${TX_DETAILS_URL}${deploymentHash}`);
    }
  };

  render() {
    const { referralsFeatureEnabled, goToInvitationFlow } = this.props;

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Title>{title}</Title>
        <Text>{text}</Text>
        <ButtonsWrapper>
          <Button
            height={48}
            title="Smart Wallet FAQ"
            onPress={this.handleFaq}
            textStyle={fontStyles.medium}
          />
          <View style={{ height: 4 }} />
          <Button
            primaryInverted
            height={48}
            title="See on Etherscan"
            onPress={this.handleEtherscan}
            textStyle={fontStyles.medium}
            style={{ borderColor: 'transparent' }}
          />
        </ButtonsWrapper>
        {referralsFeatureEnabled && (
          <InviteBanner title="Invite friends" onInvitePress={goToInvitationFlow} />
        )}
      </ScrollView>
    );
  }
}

const mapStateToProps = ({
  featureFlags: {
    data: { REFERRALS_ENABLED: referralsFeatureEnabled },
  },
}: RootReducerState): $Shape<Props> => ({
  referralsFeatureEnabled,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(WalletActivation);
