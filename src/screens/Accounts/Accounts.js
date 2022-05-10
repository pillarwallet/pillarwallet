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
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { sortBy } from 'lodash';
import t from 'translations/translate';

// components
import SlideModal from 'components/Modals/SlideModal';
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';
import RadioButton from 'components/RadioButton';

// utils
import { getAccountName, isEtherspotAccount } from 'utils/accounts';
import { calculateTotalBalance } from 'utils/totalBalances';
import { fontStyles, appFont, spacing, borderRadiusSizes } from 'utils/variables';
import { images } from 'utils/images';
import { useTheme, getThemeColors, useIsDarkTheme } from 'utils/themes';
import { formatFiat, getEnsPrefix } from 'utils/common';

// constants
import { KEY_BASED_ASSET_TRANSFER_INTRO, ENS_MIGRATION_CONFIRM } from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// actions
import { switchAccountAction } from 'actions/accountsActions';
import { fetchAllAccountsTotalBalancesAction } from 'actions/assetsActions';

// selectors
import { useFiatCurrency, useRootSelector } from 'selectors';
import { keyBasedWalletHasPositiveBalanceSelector } from 'selectors/balances';
import { totalBalancesPerAccountSelector } from 'selectors/totalBalances';
import { isEnsMigrationNeededSelector } from 'selectors/archanova';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BlockchainNetwork } from 'models/BlockchainNetwork';
import type { TotalBalancesPerAccount } from 'models/TotalBalances';
import type { NavigationScreenProp } from 'react-navigation';

const ITEM_TYPE = {
  ACCOUNT: 'ACCOUNT',
  BUTTON: 'BUTTON',
};

type ListItem = {|
  id: string,
  type: $Keys<typeof ITEM_TYPE>,
  title: string,
  mainAction: () => void | Promise<void>,
  balance?: string,
  isActive?: boolean,
  iconSource?: string,
  showKeyBasedAssetMigrationButton: boolean,
  address: string,
  username?: string,
  showEnsMigrationBanner: boolean,
|};

type Props = {|
  blockchainNetworks: BlockchainNetwork[],
  accounts: Account[],
  switchAccount: (accountId: string) => void,
  fetchAllAccountsTotalBalances: () => void,
  keyBasedWalletHasPositiveBalance: boolean,
  totalBalances: TotalBalancesPerAccount,
  name: string,
  navigation: NavigationScreenProp<*>,
|};

const AccountsModal = ({
  fetchAllAccountsTotalBalances,
  accounts,
  switchAccount,
  blockchainNetworks,
  keyBasedWalletHasPositiveBalance,
  totalBalances,
  navigation,
  name,
}: Props) => {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const isDarkTheme = useIsDarkTheme();
  const fiatCurrency = useFiatCurrency();
  const isEnsMigrationNeeded = useRootSelector(isEnsMigrationNeededSelector);
  const modalRef = useRef(null);

  useEffect(() => {
    fetchAllAccountsTotalBalances();
  }, [fetchAllAccountsTotalBalances]);

  const { smartWalletIcon } = images(theme);
  const activeBlockchainNetwork = blockchainNetworks.find(({ isActive }) => !!isActive);
  const isEthereumActive = activeBlockchainNetwork?.id === BLOCKCHAIN_NETWORK_TYPES.ETHEREUM;

  const setAccountActive = async (account: Account) => {
    await switchAccount(account.id);
    navigation.goBack(null);
  };

  const renderListItem = (item) => {
    const {
      title,
      balance,
      mainAction,
      isActive,
      id,
      showKeyBasedAssetMigrationButton,
      address,
      username,
      showEnsMigrationBanner,
    } = item;

    return (
      <Container
        key={`${id}`}
        onPress={() => {
          modalRef.current?.close();
          if (isActive) navigation.goBack(null);
          else mainAction();
        }}
      >
        <ContainerView isSelected={isActive}>
          <RowContainer>
            <RadioButton visible={isActive} />
            <TitleContainer>
              <TextContent numberOfLines={1} style={isActive && { fontFamily: appFont.medium }}>
                {title}
              </TextContent>
            </TitleContainer>
            <Value style={isActive && { fontFamily: appFont.medium }}>{balance}</Value>
          </RowContainer>
          <TextContent style={addressText} numberOfLines={1}>
            {`${address.substring(0, 4)}...${address.substring(address.length - 4)}${
              isActive && username ? ` (${username})` : ''
            }`}
          </TextContent>
          <MigrationButtons>
            {showKeyBasedAssetMigrationButton && (
              <RowContainer>
                <IconContainer
                  name={isDarkTheme ? 'asset-migration-dark' : 'asset-migration'}
                  onPress={() => navigation.navigate(KEY_BASED_ASSET_TRANSFER_INTRO)}
                />
                <BannerText color={colors.link} onPress={() => navigation.navigate(KEY_BASED_ASSET_TRANSFER_INTRO)}>
                  {' '}
                  {t('label.assetMigrate', { mediumText: true, color: colors.link })}
                </BannerText>
              </RowContainer>
            )}
            {showEnsMigrationBanner && (
              <RowContainer>
                <IconContainer
                  name={isDarkTheme ? 'ens-migration-dark' : 'ens-migration'}
                  onPress={() => navigation.navigate(ENS_MIGRATION_CONFIRM)}
                />
                <BannerText color={colors.link} onPress={() => navigation.navigate(ENS_MIGRATION_CONFIRM)}>
                  {' '}
                  {t('label.ensMigrate', { mediumText: true, color: colors.link })}
                </BannerText>
              </RowContainer>
            )}
          </MigrationButtons>
        </ContainerView>
      </Container>
    );
  };

  // etherspot account first
  const sortedAccounts = sortBy(accounts, ({ type }) => (type === ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET ? -1 : 1));

  const isKeyBasedAssetsMigrationEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.KEY_BASED_ASSETS_MIGRATION);

  const accountsList: ListItem[] = sortedAccounts.map((account: Account): ListItem => {
    const { id, isActive, type } = account;
    const isActiveWallet = !!isActive && isEthereumActive;

    const totalBalance = calculateTotalBalance(totalBalances[id] ?? {});
    const totalBalanceFormatted = formatFiat(totalBalance, fiatCurrency);

    return {
      id: `ACCOUNT_${id}`,
      type: ITEM_TYPE.ACCOUNT,
      title: getAccountName(type),
      balance: totalBalanceFormatted,
      mainAction: () => setAccountActive(account),
      isActive: isActiveWallet,
      iconSource: smartWalletIcon,
      showKeyBasedAssetMigrationButton: isKeyBasedAssetsMigrationEnabled && keyBasedWalletHasPositiveBalance,
      address: id,
      username: name ? `${name}${getEnsPrefix()}` : '',
      showEnsMigrationBanner: isEtherspotAccount(account) && isEnsMigrationNeeded,
    };
  });

  return (
    <SlideModal ref={modalRef} noPadding noClose showHeader centerTitle title={t('title.accounts')}>
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        {accountsList.map((item) => renderListItem(item))}
      </ContentWrapper>
    </SlideModal>
  );
};

const addressText = { fontSize: 14, marginLeft: 32 + 12 };

const ContentWrapper = styled.View`
  padding: ${spacing.medium}px 0px;
  align-items: center;
`;

const TitleContainer = styled.View`
  flex-direction: column;
  flex: 1;
`;

const ContainerView = styled.View`
  background-color: ${({ theme, isSelected }) => (isSelected ? theme.colors.basic60 : theme.colors.basic050)};
  margin: 0 ${spacing.medium}px;
  padding: ${spacing.mediumLarge}px;
  border-radius: ${borderRadiusSizes.medium}px;
  flex-direction: column;
  flex: 1;
`;

const TouchableContainer = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
`;

const Container = styled(TouchableContainer)`
  background-color: ${({ theme }) => theme.colors.basic050};
  flex-direction: row;
  border-radius: ${borderRadiusSizes.defaultContainer}px;
`;

const Value = styled(Text)`
  ${fontStyles.big};
  font-variant: tabular-nums;
`;

const RowContainer = styled.View`
  justify-content: center;
  flex-direction: row;
  padding: ${spacing.small}px;
`;

const TextContent = styled(Text)`
  ${fontStyles.big};
  padding: 0 ${spacing.medium}px 0 ${0}px;
`;

const BannerText = styled(Text)`
  ${fontStyles.medium};
  padding-left: ${spacing.extraSmall}px;
`;

const IconContainer = styled(Icon)``;

const MigrationButtons = styled.View`
  flex-direction: column;
  margin-left: 32px;
  align-items: flex-start;
  justify-content: flex-start;
`;

const mapStateToProps = ({
  accounts: { data: accounts },
  blockchainNetwork: { data: blockchainNetworks },
}: RootReducerState): $Shape<Props> => ({
  accounts,
  blockchainNetworks,
});

const structuredSelector = createStructuredSelector({
  keyBasedWalletHasPositiveBalance: keyBasedWalletHasPositiveBalanceSelector,
  totalBalances: totalBalancesPerAccountSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
  fetchAllAccountsTotalBalances: () => dispatch(fetchAllAccountsTotalBalancesAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AccountsModal);
