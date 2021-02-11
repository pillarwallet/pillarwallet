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
import { SafeAreaView } from 'react-navigation';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// actions
import { switchToGasTokenRelayerAction } from 'actions/smartWalletActions';

// components
import { Spacing } from 'components/Layout';
import { BaseText, MediumText } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import Image from 'components/Image';

// constants
import { PLR } from 'constants/assetsConstants';
import { SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER } from 'constants/smartWalletConstants';
import { TX_PENDING_STATUS } from 'constants/historyConstants';

// utils
import { spacing } from 'utils/variables';

// types
import type { Assets } from 'models/Asset';
import type { Dispatch } from 'reducers/rootReducer';
import type { Transaction } from 'models/Transaction';

type DispatchProps = {|
  switchToGasTokenRelayer: () => void,
|};

type OwnProps = {|
  accountAssets: Assets,
  accountHistory: Transaction[],
  onMigrated?: () => void,
|};

type Props = {|
  ...DispatchProps,
  ...OwnProps,
|};

type State = {|
  switchPressed: boolean,
|};

const ModalContainer = styled.View`
  padding: 20px ${spacing.layoutSides}px 40px;
`;

class RelayerMigrationModal extends React.PureComponent<Props, State> {
  modalRef = React.createRef();

  state = {
    switchPressed: false,
  };

  onSwitchPress = () => {
    this.setState({ switchPressed: true }, () => {
      const { switchToGasTokenRelayer, onMigrated } = this.props;
      switchToGasTokenRelayer();
      if (onMigrated) onMigrated();
      if (this.modalRef.current) this.modalRef.current.close();
    });
  };

  render() {
    const {
      accountAssets,
      accountHistory,
    } = this.props;
    const { switchPressed } = this.state;
    const { iconUrl } = accountAssets[PLR] || {};
    const isSwitchPending = accountHistory.some(({ tag, status }) => {
      return tag === SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER && status === TX_PENDING_STATUS;
    });
    const buttonTitle = switchPressed || isSwitchPending
      ? t('relayerMigrationContent.modal.switch.label.waitingForConfirmation')
      : t('relayerMigrationContent.modal.switch.button.switch');
    const subtitle = switchPressed || isSwitchPending
      ? t('relayerMigrationContent.modal.switch.label.switchPending')
      : t('relayerMigrationContent.modal.switch.label.freeSwitching');

    return (
      <SlideModal
        ref={this.modalRef}
        hideHeader
      >
        <SafeAreaView forceInset={{ top: 'never', bottom: 'always' }}>
          <ModalContainer>
            <MediumText center medium>{t('relayerMigrationContent.modal.switch.title')}</MediumText>
            <Spacing h={18} />
            {iconUrl &&
            <Image
              style={{ width: 64, height: 64, alignSelf: 'center' }}
              source={{ uri: `${getEnv().SDK_PROVIDER}/${iconUrl}?size=2` }}
              resizeMode="contain"
            />
            }
            <Spacing h={20} />
            <BaseText medium>{t('relayerMigrationContent.modal.switch.paragraph')}</BaseText>
            <Spacing h={30} />
            <Button
              title={buttonTitle}
              disabled={isSwitchPending || switchPressed}
              onPress={this.onSwitchPress}
            />
            <Spacing h={30} />
            <BaseText regular center secondary>{subtitle}</BaseText>
          </ModalContainer>
        </SafeAreaView>
      </SlideModal>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  switchToGasTokenRelayer: () => dispatch(switchToGasTokenRelayerAction()),
});

export default (connect(null, mapDispatchToProps)(RelayerMigrationModal): React.AbstractComponent<OwnProps>);
