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
import { Platform } from 'react-native';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import t from 'translations/translate';

import { MediumText, BaseText } from 'components/Typography';
import Progress from 'components/Progress';
import { Spacing } from 'components/Layout';
import Icon from 'components/Icon';
import ProfileImage from 'components/ProfileImage';
import {
  formatAmount,
  formatUnits,
  getDecimalPlaces,
  findEnsNameCaseInsensitive,
  isCaseInsensitiveMatch,
} from 'utils/common';
import { getThemeColors } from 'utils/themes';
import { getAssetDataByAddress, getAssetsAsList } from 'utils/assets';
import { hasStreamEnded, getStreamProgress, streamCountDownDHMS } from 'utils/sablier';
import { activeAccountAddressSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { SABLIER_INCOMING_STREAM, SABLIER_OUTGOING_STREAM } from 'constants/navigationConstants';
import { DARK_THEME } from 'constants/appSettingsConstants';

import type { RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { Stream } from 'models/Sablier';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Assets, Asset } from 'models/Asset';
import type { Theme } from 'models/Theme';


type Props = {
  stream: Stream,
  navigation: NavigationScreenProp<*>,
  activeAccountAddress: string,
  ensRegistry: EnsRegistry,
  supportedAssets: Asset[],
  assets: Assets,
  theme: Theme,
};

const Container = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
`;

const TimeContainer = styled.View``;
const AssetContainer = styled.View`
  flex: 1;
`;

const DirectionIcon = styled(Icon)`
  color: ${({ color }) => color};
  text-align: center;
  font-size: 30px;
  margin: ${Platform.OS === 'ios' ? '-15px -7px' : '0'};
`;

const DirectionIconWrapper = styled.View`
  background-color: ${({ theme: { current, colors }, isOutgoing }) => {
    if (current === DARK_THEME) {
      if (isOutgoing) return colors.negative;
      return colors.positive;
    }
    return colors.buttonSecondaryBackground;
  }};
  width: 16px;
  height: 16px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
`;

const AmountContainer = styled.View`
  flex-direction: row;
  align-items: center;
`;


class SablierStream extends React.Component<Props> {
  isOutgoingStream = () => {
    const { stream, activeAccountAddress } = this.props;
    return isCaseInsensitiveMatch(stream.sender, activeAccountAddress);
  };

  navigateToDetails = () => {
    const { navigation, stream } = this.props;
    const isOutgoingStream = this.isOutgoingStream();
    navigation.navigate(isOutgoingStream ? SABLIER_OUTGOING_STREAM : SABLIER_INCOMING_STREAM, { stream });
  };

  render() {
    const {
      stream, theme, ensRegistry, assets, supportedAssets,
    } = this.props;
    const tokenAddress = stream.token.id;

    const token = getAssetDataByAddress(getAssetsAsList(assets), supportedAssets, tokenAddress);

    const formattedAmount = formatAmount(formatUnits(stream.deposit, token.decimals), getDecimalPlaces(token.symbol));

    const streamProgress = getStreamProgress(stream);

    const colors = getThemeColors(theme);

    const streamCanceled = !!stream.cancellation;
    const streamEnded = hasStreamEnded(stream);

    const { days, hours, minutes } = streamCountDownDHMS(stream);
    let remainingTimeString = '';
    if (days > 0) {
      remainingTimeString = t('timeDaysHours', { days, hours });
    } else {
      remainingTimeString = t('timeHoursMinutes', { hours, minutes });
    }

    const isOutgoing = this.isOutgoingStream();
    const progressBarColor = isOutgoing ? colors.negative : colors.positive;
    const directionIconName = isOutgoing ? 'sent' : 'received'; // eslint-disable-line i18next/no-literal-string

    let streamStatus = '';
    if (streamCanceled) {
      streamStatus = t('sablierContent.status.canceled');
    } else if (streamEnded) {
      streamStatus = t('sablierContent.status.ended');
    } else {
      streamStatus = t('sablierContent.status.remaining');
    }

    const userAddress = isOutgoing ? stream.recipient : stream.sender;
    const username = findEnsNameCaseInsensitive(ensRegistry, userAddress) || userAddress;

    const directionIconColor = theme.current === DARK_THEME ? colors.link : progressBarColor;

    return (
      <Container onPress={this.navigateToDetails}>
        <ProfileImage
          userName={username}
          diameter={48}
          noShadow
          borderWidth={0}
        />
        <Spacing w={12} />
        <AssetContainer>
          <AmountContainer>
            <DirectionIconWrapper isOutgoing={isOutgoing}>
              <DirectionIcon name={directionIconName} color={directionIconColor} />
            </DirectionIconWrapper>
            <Spacing w={6} />
            <MediumText big>{t('tokenValue', { value: formattedAmount, token: token.symbol })}</MediumText>
          </AmountContainer>
          <Spacing h={15} />
          <Progress
            fullStatusValue={1}
            currentStatusValue={streamProgress}
            colorStart={progressBarColor}
            colorEnd={progressBarColor}
            height={4}
            barPadding={0}
            emptyBarBackgroundColor={colors.tertiary}
          />
        </AssetContainer>
        <Spacing w={44} />
        <TimeContainer>
          {!streamEnded && !streamCanceled && <BaseText big>{remainingTimeString}</BaseText>}
          <BaseText regular secondary>{streamStatus}</BaseText>
        </TimeContainer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  ensRegistry: { data: ensRegistry },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  ensRegistry,
  supportedAssets,
});


const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState, props) => ({
  ...structuredSelector(state, props),
  ...mapStateToProps(state),
});

export default withNavigation(withTheme(connect(combinedMapStateToProps)(SablierStream)));
