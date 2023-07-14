// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import React, { FC, useState, useEffect } from 'react';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useTranslationWithPrefix } from 'translations/translate';
import { Platform } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useNavigation } from 'react-navigation-hooks';

// Constants
import { RECEIVE_TOKENS_WARNING } from 'constants/navigationConstants';

// Selectors
import {
  useActiveAccount,
  useRootSelector,
  useOnboardingFetchingSelector,
  useFiatCurrency,
  viewedReceiveTokensWarningSelector,
} from 'selectors';

// Utils
import { formatFiatValue, formatFiatChangeExtended } from 'utils/format';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';
import { isKeyBasedAccount } from 'utils/accounts';
import { showServiceLaunchErrorToast } from 'utils/inAppBrowser';

// Hooks
import { useAppHoldings } from 'hooks/apps';

// Components
import Text from 'components/core/Text';
import AddCashModal from 'screens/AddCash/modal/AddCashModal';
import Modal from 'components/Modal';
import { BalanceSelectionLoader } from 'components/SkeletonLoader/OnboardingLoaders';

// Local
import SpecialButton from './components/SpecialButton';

type IBalanceSection = {
  balanceInFiat: BigNumber;
  changeInFiat?: BigNumber;
  showBalance?: boolean;
  onBalanceClick?: () => void;
};

const BalanceSection: FC<IBalanceSection> = ({ balanceInFiat, changeInFiat, showBalance, onBalanceClick }) => {
  const { t, tRoot } = useTranslationWithPrefix('home.balance');
  const colors = useThemeColors();
  const navigation = useNavigation();

  const fiatCurrency = useFiatCurrency();
  const activeAccount = useActiveAccount();
  const { totalBalanceOfHoldings } = useAppHoldings();

  const isFetching = useOnboardingFetchingSelector();

  const initialBalance = changeInFiat ? balanceInFiat.minus(changeInFiat) : null;
  const formattedChange = formatFiatChangeExtended(changeInFiat, initialBalance, fiatCurrency);

  balanceInFiat = balanceInFiat.plus(totalBalanceOfHoldings);

  const viewedReceiveTokensWarning = useRootSelector(viewedReceiveTokensWarningSelector);

  const [addCashUrl, setAddCashUrl] = useState(null);

  const openBrowser = async (url: string) => {
    const isAvailable = await InAppBrowser.isAvailable();

    if (url && isAvailable) {
      InAppBrowser.open(url, {
        // iOS Properties
        dismissButtonStyle: 'close',
        // Android Properties
        showTitle: true,
        enableUrlBarHiding: true,
        enableDefaultShare: true,
      });
    } else showServiceLaunchErrorToast();

    setAddCashUrl(null);
  };

  useEffect(() => {
    if (!addCashUrl) return;

    // Delay open Add Cash URL so that it doesn't close with the modal
    setTimeout(() => openBrowser(addCashUrl), 500);
  }, [addCashUrl]);

  const openAddCashModal = () => {
    Modal.open(() => <AddCashModal setAddCashUrl={setAddCashUrl} />);
  };

  const onAddCashPress = () => {
    if (viewedReceiveTokensWarning) {
      openAddCashModal();
    } else {
      navigation.navigate(RECEIVE_TOKENS_WARNING, { onContinue: openAddCashModal });
    }
  };

  return (
    <>
      <Container>
        <FirstColumn>
          {isFetching ? (
            <BalanceSelectionLoader />
          ) : (
            <TouchableContainer onPress={onBalanceClick}>
              <BalanceText numberOfLines={1} adjustsFontSizeToFit>
                {showBalance ? formatFiatValue(balanceInFiat, fiatCurrency) : '***'}
              </BalanceText>
            </TouchableContainer>
          )}
          {!!formattedChange && (
            <ProfitContainer>
              <ProfitLabel color={colors.secondaryText}>{t('lastWeek')}</ProfitLabel>
              <ProfitValue color={colors.positive}>{formattedChange}</ProfitValue>
            </ProfitContainer>
          )}
        </FirstColumn>

        {!isKeyBasedAccount(activeAccount) && (
          <SecondColumn>
            <SpecialButton title={tRoot('button.buyTokens')} iconName="add-cash" onPress={onAddCashPress} />
          </SecondColumn>
        )}
      </Container>
    </>
  );
};

export default BalanceSection;

const wrapperStyle = {
  zIndex: 1999,
  position: 'relative',
  alignSelf: 'flex-end',
  width: 150,
  height: 10,
  top: Platform.OS === 'ios' ? -20 : -10,
};

const Container = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 0 ${spacing.layoutSides}px;
`;

const FirstColumn = styled.View`
  flex: 1;
  justify-content: center;
  margin-right: ${spacing.large}px;
`;

const SecondColumn = styled.View`
  justify-content: center;
`;

const BalanceText = styled(Text)`
  font-size: 36px;
  font-variant: tabular-nums;
`;

const ProfitContainer = styled.View`
  flex-direction: row;
  margin-top: ${spacing.extraSmall}px;
`;
const ProfitLabel = styled(Text)`
  margin-right: 6px;
`;

const ProfitValue = styled(Text)`
  font-variant: tabular-nums;
`;

const TouchableContainer = styled.TouchableOpacity``;
