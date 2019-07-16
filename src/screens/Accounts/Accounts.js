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
import { FlatList } from 'react-native';
import styled from 'styled-components/native';
import isEqual from 'lodash.isequal';
import { CachedImage } from 'react-native-cached-image';

// components
import { BaseText, BoldText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ShadowedCard from 'components/ShadowedCard';
import { Note } from 'components/Note';

// utils
import { baseColors } from 'utils/variables';

// types
import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  navigation: NavigationScreenProp<*>,
}

const CardRow = styled.View`
   flex-direction: row;
   width: 100%;
   align-items: center;
`;

const CardImage = styled(CachedImage)`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${baseColors.darkGray};
  margin-right: 20px;
`;

const CardContent = styled.View`
  flex-direction: column;
`;

const CardTitle = styled(BoldText)`
  color: ${baseColors.slateBlack};
  font-size: 17px;
  width: 100%;
`;

const CardSubtitle = styled(BaseText)`
  color: ${baseColors.coolGrey};
  font-size: 13px;
  line-height: 15px;
  margin-top: 4px;
`;

const accountList = [
  {
    key: 'ethereum',
    title: 'Ethereum',
    icon: '',
    screenKey: '',
  },
  {
    key: 'pillarNetwork',
    title: 'Pillar Network',
    icon: '',
    screenKey: '',
    note: {
      note: 'Instant, free and private transactions',
      emoji: 'sunglasses',
    },
  },
  {
    key: 'bitcoin',
    title: 'Bitcoin',
    icon: '',
    screenKey: '',
  },
];

const genericToken = require('assets/images/tokens/genericToken.png');

class AssetsScreen extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps);
    return !isEq;
  }

  renderAccounts = ({ item: account }: Object) => {
    const { navigation } = this.props;
    const {
      icon,
      title,
      note,
      screenKey,
    } = account;
    return (
      <ShadowedCard
        wrapperStyle={{ marginBottom: 10, width: '100%' }}
        contentWrapperStyle={{ padding: 20 }}
        onPress={() => navigation.navigate(screenKey)}
      >
        <CardRow>
          <CardImage source={{ uri: icon }} fallbackSource={genericToken} />
          <CardContent>
            <CardTitle>{title}</CardTitle>
            <CardSubtitle>Balance 1,430.58</CardSubtitle>
          </CardContent>
        </CardRow>
        {!!note &&
          <Note {...note} containerStyle={{ marginTop: 14 }} />
        }
      </ShadowedCard>
    );
  };

  render() {
    return (
      <ContainerWithHeader
        color={baseColors.white}
        headerProps={{
          leftItems: [
            { userIcon: true },
            {
              title: 'Accounts',
              color: baseColors.aluminium,
            },
          ],
          rightItems: [{ close: true }],
        }}
      >
        <FlatList
          data={accountList}
          keyExtractor={(item) => item.key}
          style={{ width: '100%' }}
          contentContainerStyle={{ width: '100%', padding: 20 }}
          renderItem={this.renderAccounts}
        />
      </ContainerWithHeader>
    );
  }
}

export default AssetsScreen;
