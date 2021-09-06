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

import React, { useRef } from 'react';
import { SafeAreaView } from 'react-navigation';
import styled from 'styled-components/native';
import t from 'translations/translate';
import { useNavigation } from 'react-navigation-hooks';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/legacy/Button';
import { MediumText, BaseText } from 'components/legacy/Typography';
import { Spacing } from 'components/legacy/Layout';

// constants
import { ACCOUNTS } from 'constants/navigationConstants';


const ModalContainer = styled.View`
  padding: 20px 0 40px;
`;

const BuyCryptoAccountNotActiveModal = () => {
  const modalRef = useRef();
  const navigation = useNavigation();

  const buttonAction = () => {
    if (modalRef.current) modalRef.current.close();
    navigation.navigate(ACCOUNTS);
  };

  return (
    <SlideModal
      ref={modalRef}
      hideHeader
    >
      <SafeAreaView>
        <ModalContainer>
          <React.Fragment>
            <MediumText center medium>{t('exchangeContent.modal.smartWalletIsNotActive.title')}</MediumText>
            <Spacing h={20} />
            <BaseText center medium>{t('exchangeContent.modal.smartWalletIsNotActive.paragraph')}</BaseText>
            <Spacing h={34} />
            <Button
              secondary
              title={t('exchangeContent.modal.smartWalletIsNotActive.button.selectAccount')}
              onPress={buttonAction}
            />
          </React.Fragment>
        </ModalContainer>
      </SafeAreaView>
    </SlideModal>
  );
};

export default BuyCryptoAccountNotActiveModal;
