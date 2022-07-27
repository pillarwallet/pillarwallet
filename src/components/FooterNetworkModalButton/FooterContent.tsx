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

import React from 'react';
import { Keyboard, Platform } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import Button from 'components/core/Button';
import Modal from 'components/Modal';

// Utils
import { getNotificationsVisibleStatus } from 'utils/getNotification';

// Constants
import { GET_NOTIFICATIONS } from 'constants/navigationConstants';

// Modal
import SelectNetworkModal from 'screens/AddCash/modal/SelectNetworkModal';

interface Props {
  buttonDisable: boolean;
  onNetworkSelect: () => void;
}

function FooterContent(props: Props) {
  const { buttonDisable, onNetworkSelect } = props;
  const navigation = useNavigation();

  const openSelectNetworkModal = async () => {
    const status = await getNotificationsVisibleStatus();
    if (status === undefined) {
      Keyboard.dismiss();
      navigation.navigate(GET_NOTIFICATIONS);
    } else {
      Modal.open(() => <SelectNetworkModal networkSelected={onNetworkSelect} />);
    }
  };

  return (
    <Footer behavior={Platform.OS === 'ios' ? 'position' : null}>
      <Button onPress={openSelectNetworkModal} title={t('button.continue')} disabled={buttonDisable} />
    </Footer>
  );
}

export default FooterContent;

const Footer = styled.KeyboardAvoidingView`
  padding: 20px 20px 20px;
  margin-bottom: 20px;
`;
