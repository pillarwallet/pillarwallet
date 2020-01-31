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
import { Alert, BackHandler, Platform } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';

// constants
import { BACKUP_WALLET_IN_SETTINGS_FLOW } from 'constants/navigationConstants';

// components
import { ScrollWrapper, Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { MediumText, Paragraph } from 'components/Typography';
import Animation from 'components/Animation';
import ButtonText from 'components/ButtonText';

// util
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { getThemeColors } from 'utils/themes';

// models, types
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp,
  isBackedUp: boolean,
  isImported: boolean,
  theme: Theme,
};

const animationSuccess = require('assets/animations/transactionSentConfirmationAnimation.json');

const Title = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-bottom: ${spacing.small}px;
`;

const skipPrompt = (callback) => Alert.alert(
  'Are you sure?',
  'You are going to skip your Private Key backup, but no at all worries – you can still do it later!',
  [
    { text: 'Confirm skip', onPress: () => callback() },
    { text: 'Dismiss', style: 'cancel' },
  ],
  { cancelable: true },
);

class RecoveryPortalSetupComplete extends React.PureComponent<Props> {
  componentDidMount() {
    if (Platform.OS !== 'android') return;
    BackHandler.addEventListener('hardwareBackPress', this.handleBack);
  }

  componentWillUnmount() {
    if (Platform.OS !== 'android') return;
    BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
  }

  handleBack = () => this.props.navigation.dismiss();

  render() {
    const {
      isBackedUp,
      isImported,
      navigation,
      theme,
    } = this.props;

    const colors = getThemeColors(theme);
    const isWalletBackupNeeded = !isImported && !isBackedUp;

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Recovery Portal' }],
          rightItems: [{ close: true }],
          noBack: true,
          onClose: this.handleBack,
        }}
      >
        <ScrollWrapper contentContainerStyle={{ paddingVertical: spacing.large }}>
          <Wrapper flex={1} center regularPadding>
            <Animation source={animationSuccess} />
            <Title center>Recovery device setup is now complete</Title>
            <Paragraph small>
              It is important that you also write down and secure your private key back up phrase
              in order to recover your primary Pillar account. This is the only way to recover your
              password to the Pillar Recovery Portal. Pillar cannot help you retrieve your wallet.
            </Paragraph>
            {isWalletBackupNeeded &&
              <Button
                block
                title="Backup my Private Key"
                onPress={() => navigation.navigate(BACKUP_WALLET_IN_SETTINGS_FLOW)}
                marginTop={50}
                marginBottom={spacing.large}
              />
            }
            {isWalletBackupNeeded &&
              <ButtonText
                buttonText="Skip (at my own risk)"
                onPress={() => skipPrompt(this.handleBack)}
                color={colors.negative}
                fontSize={fontSizes.medium}
                medium
              />
            }
            {!isWalletBackupNeeded &&
              <Button
                block
                title="Magic"
                onPress={() => navigation.dismiss()}
                marginTop={50}
              />
            }
          </Wrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  wallet: { backupStatus: { isBackedUp, isImported } },
}: RootReducerState): $Shape<Props> => ({
  isBackedUp,
  isImported,
});

export default withTheme(connect(mapStateToProps)(RecoveryPortalSetupComplete));
