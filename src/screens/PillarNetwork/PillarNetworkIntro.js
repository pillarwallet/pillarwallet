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
import { FlatList } from 'react-native';
import { CachedImage } from 'react-native-cached-image';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import { BoldText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import Button from 'components/Button';
import { baseColors, fontSizes } from 'utils/variables';
import { responsiveSize } from 'utils/ui';
import { ASSETS } from 'constants/navigationConstants';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { addNetworkAction } from 'actions/blockchainNetworkActions';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  addNetwork: Function,
}
const CustomWrapper = styled.View`
  flex: 1;
  padding: 20px 55px 20px 46px;
`;

const Title = styled(BoldText)`
  color: ${baseColors.pomegranate};
  font-size: ${fontSizes.rJumbo}px;
`;

const BodyText = styled(MediumText)`
  color: ${baseColors.pomegranate};
  font-size: ${fontSizes.rMedium}px;
  line-height: ${fontSizes.rExtraLarge}px;
  margin-top: ${responsiveSize(26)}px;
`;

const ListItemWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  margin-top: ${responsiveSize(19)}px;
`;

const ContentWrapper = styled.View`
  align-items: flex-start;
  margin-left: ${responsiveSize(19)}px;
`;

const Label = styled(BoldText)`
  color: ${baseColors.pomegranate};
  font-size: ${fontSizes.rLarge}px;
  line-height: ${responsiveSize(34)}px;
`;

const Subtext = styled(BoldText)`
  color: ${baseColors.pomegranate};
  font-size: ${fontSizes.rMedium}px;
  line-height: ${responsiveSize(34)}px;
  margin-top: ${responsiveSize(10)}px;
`;

const FeatureIcon = styled(CachedImage)`
  height: 124px;
  width: 124px;
  margin-bottom: 24px;
`;

const features = [
  {
    key: 'instant',
    label: 'Instant.',
    subtext: 'Like, seriously. Instant transactions.',
  },
  {
    key: 'free',
    label: 'Free.',
    subtext: 'Transaction fees are on us.',
  },
  {
    key: 'private',
    label: 'Private.',
    subtext: 'It’s in Pillar DNA.',
  },
];

const PPNIcon = require('assets/images/logo_PPN.png');

class PillarNetworkIntro extends React.Component<Props> {
  createPLRTank = () => {
    const { navigation, addNetwork } = this.props;
    addNetwork({
      id: BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK,
      title: 'Pillar network',
      isActive: false,
    });
    navigation.navigate(ASSETS);
  };

  render() {
    return (
      <ContainerWithHeader
        headerProps={{
          rightItems: [{ userIcon: true }],
          floating: true,
          transparent: true,
          light: true,
        }}
        backgroundColor={baseColors.ultramarine}
      >
        <ScrollWrapper contentContainerStyle={{ paddingTop: 80 }}>
          <CustomWrapper>
            <FeatureIcon source={PPNIcon} />
            <Title>
              Pillar Network
            </Title>
            <BodyText>
              Store your assets in a personal smart contract and control access through an intuitive key management
              system.
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
                      color: baseColors.pomegranate,
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
            <Button
              block
              title="Create PLR Tank"
              onPress={this.createPLRTank}
              roundedCorners
              style={{ backgroundColor: baseColors.pomegranate, marginTop: 40, marginBottom: 20 }}
              textStyle={{ color: baseColors.ultramarine }}
            />
          </CustomWrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapDispatchToProps = (dispatch: Function) => ({
  addNetwork: (network: Object) => dispatch(addNetworkAction(network)),
});

export default connect(null, mapDispatchToProps)(PillarNetworkIntro);
