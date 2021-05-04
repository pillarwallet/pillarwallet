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
import styled, { withTheme } from 'styled-components/native';
import t from 'translations/translate';
import { useNavigation } from 'react-navigation-hooks';

// components
import { MediumText, BaseText } from 'components/Typography';
import IconButton from 'components/IconButton';
import ShadowedCard from 'components/ShadowedCard';
import Image from 'components/Image';
import { Spacing } from 'components/Layout';

// utils
import { spacing, fontSizes } from 'utils/variables';
import { getThemeColors } from 'utils/themes';

// hooks
import useWalletConnect from 'hooks/useWalletConnect';

// constants
import { WALLETCONNECT_CALL_REQUEST_SCREEN } from 'constants/navigationConstants';

// types
import type { Theme } from 'models/Theme';


type Props = {
  theme: Theme,
  showLastOneOnly?: boolean,
};

const ActionCircleButton = styled(IconButton)`
  height: 24px;
  width: 24px;
  border-radius: 12px;
  margin: 0 0 0 10px;
  justify-content: center;
  align-items: center;
  background: ${({ accept, theme }) => accept ? theme.colors.primary : 'transparent'};
`;

const ItemContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
`;

const CardWrapper = styled.View`
  padding: 0 ${spacing.layoutSides}px 8px;
  width: 100%
  margin-bottom: ${spacing.small}px; 
`;

const Header = styled(MediumText)`
  padding: 18px ${spacing.layoutSides}px 8px;
`;

const WalletConnectCallRequestList = ({
  theme,
  showLastOneOnly,
}: Props) => {
  const navigation = useNavigation();
  const { cancelCallRequest, callRequests } = useWalletConnect();

  const colors = getThemeColors(theme);

  const renderRequest = ({ item }) => {
    const { name, icon } = item;

    return (
      <CardWrapper>
        <ShadowedCard borderRadius={30}>
          <ItemContainer>
            <Image
              style={{
                height: 50,
                width: 50,
                borderRadius: 7,
              }}
              source={{ uri: icon }}
            />
            <Spacing w={15} />
            <BaseText regular style={{ flex: 1 }}>
              {t('walletConnectContent.label.requestFrom', { name })}
            </BaseText>
            <ActionCircleButton
              color={colors.secondaryText}
              margin={0}
              icon="close"
              fontSize={fontSizes.regular}
              onPress={() => cancelCallRequest(item)}
            />
            <ActionCircleButton
              color={colors.control}
              margin={0}
              accept
              icon="check"
              fontSize={fontSizes.small}
              onPress={() => navigation.navigate(WALLETCONNECT_CALL_REQUEST_SCREEN, { callId: item.callId })}
            />
          </ItemContainer>
        </ShadowedCard>
      </CardWrapper>
    );
  };

  if (!callRequests.length) return null;

  if (showLastOneOnly) {
    return renderRequest({ item: callRequests[callRequests.length - 1] });
  }

  return (
    <React.Fragment>
      <Header regular accent>{t('walletConnectContent.title.requestsList')}</Header>
      <FlatList
        data={callRequests}
        renderItem={renderRequest}
        keyExtractor={({ callId }) => `walletconnect-call-request-${callId}`}
        contentContainerStyle={{ paddingTop: 10 }}
      />
    </React.Fragment>
  );
}

export default withTheme(WalletConnectCallRequestList);
