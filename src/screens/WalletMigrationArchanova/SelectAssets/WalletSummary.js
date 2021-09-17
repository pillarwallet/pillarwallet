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
import * as React from 'react';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import BalanceView from 'components/BalanceView';
import Text from 'components/core/Text';
import TextWithCopy from 'components/display/TextWithCopy';

// Utils
import { useThemeColors } from 'utils/themes';
import { objectFontStyles, spacing } from 'utils/variables';

type Props = {
  walletAddress: ?string,
  totalValueInFiat: number,
};

const WalletSummary = ({ walletAddress, totalValueInFiat }: Props) => {
  const { t, tRoot } = useTranslationWithPrefix('walletMigrationArchanova.selectAssets');
  const colors = useThemeColors();

  return (
    <Container>
      <BalanceView balance={totalValueInFiat} />

      <Text color={colors.secondaryText} style={styles.migratinFrom}>
        {t('migratingFrom')}
      </Text>

      {!!walletAddress && (
        <TextWithCopy
          textToCopy={walletAddress}
          toastText={tRoot('toast.addressCopiedToClipboard')}
          textStyle={styles.address}
          iconColor={colors.link}
        >
          {walletAddress}
        </TextWithCopy>
      )}
    </Container>
  );
};

export default WalletSummary;

const styles = {
  migratinFrom: {
    marginTop: spacing.extraSmall,
    marginBottom: spacing.small,
  },
  address: {
    ...objectFontStyles.small,
  },
};

const Container = styled.View`
  align-items: center;
  padding: ${spacing.medium}px 0 ${spacing.medium}px;
`;
