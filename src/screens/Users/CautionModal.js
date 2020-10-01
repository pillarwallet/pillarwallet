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
import { ScrollView } from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import styled from 'styled-components/native';
import t from 'translations/translate';

import { MediumText, BaseText } from 'components/Typography';
import Button from 'components/Button';
import ModalBox from 'components/ModalBox/ModalBox-old';
import { Spacing } from 'components/Layout';


type Props = {
  isVisible: boolean,
  onButtonPress: () => void,
  onModalHide: () => void,
  focusedField: ?string,
};

const cautionImage = require('assets/images/profileAttention.png');

const ModalWrapper = styled.View`
  padding: 32px 45px 30px;
  align-items: center;
`;

const CautionImage = styled(CachedImage)`
  width: 144px;
  height: 144px;
`;

const CautionModal = (props: Props) => {
  const {
    isVisible, onButtonPress, onModalHide, focusedField,
  } = props;
  const body = focusedField === 'phone'
    ? t('profileContent.modal.updatingData.paragraph.phoneChanged')
    : t('profileContent.modal.updatingData.paragraph.emailChanged');
  const buttonText = focusedField === 'phone'
    ? t('profileContent.modal.updatingData.button.changePhone')
    : t('profileContent.modal.updatingData.button.changeEmail');
  return (
    <ModalBox
      isVisible={isVisible}
      onModalHide={onModalHide}
      modalStyle={{ marginVertical: 80 }}
    >
      <ScrollView>
        <ModalWrapper>
          <MediumText center large>{t('profileContent.modal.updatingData.title')}</MediumText>
          <Spacing h={38} />
          <CautionImage source={cautionImage} />
          <Spacing h={12} />
          <BaseText center regular>
            {body}
          </BaseText>
          <Spacing h={32} />
          <Button secondary small title={buttonText} onPress={onButtonPress} />
        </ModalWrapper>
      </ScrollView>
    </ModalBox>
  );
};

export default CautionModal;
