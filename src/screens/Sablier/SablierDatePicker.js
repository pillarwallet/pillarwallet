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

import React, { useState, useRef } from 'react';
import type { AbstractComponent } from 'react';
import styled, { withTheme } from 'styled-components/native';
import { addHours, addDays } from 'date-fns';
import DatePicker from 'react-native-date-picker';
import t from 'translations/translate';

// components
import SlideModal from 'components/Modals/SlideModal';
import { MediumText, TextLink } from 'components/Typography';
import { Spacing } from 'components/Layout';
import TimingInput from 'components/TimingInput';
import Button from 'components/Button';

// utils
import { getThemeColors, getThemeType } from 'utils/themes';

// constants
import { DATE_PICKER } from 'constants/sablierConstants';
import { DARK_THEME } from 'constants/appSettingsConstants';

import type { Theme } from 'models/Theme';

type OwnProps = {|
  picker: $Values<typeof DATE_PICKER>,
  initialDate: ?Date,
  minimumDate: Date,
  maximumDate: ?Date,
  onConfirm: (date: Date) => void,
|};

type Props = {|
  ...OwnProps,
  theme: Theme,
|}

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const PickerWrapper = styled.View`
  padding: 18px 20px;
`;

const SablierDatePicker = ({
  picker,
  initialDate,
  minimumDate,
  maximumDate,
  theme,
  onConfirm,
}: Props) => {
  const colors = getThemeColors(theme);

  const [date, setDate] = useState(initialDate);
  const filled = date ?? minimumDate;

  const header = picker === DATE_PICKER.START_TIME ? (
    <Row>
      <MediumText labelTertiary regular>{t('sablierContent.label.start')}</MediumText>
      <TextLink onPress={() => setDate(minimumDate)}>
        {t('sablierContent.button.startImmediately')}
      </TextLink>
    </Row>
  ) : (
    <Row>
      <MediumText labelTertiary regular>{t('sablierContent.label.start')}</MediumText>
      <Row>
        <TextLink onPress={() => setDate(addHours(filled, 1))}>
          {t('sablierContent.button.plusHour')}
        </TextLink>
        <Spacing w={10} />
        <TextLink onPress={() => setDate(addDays(filled, 1))}>
          {t('sablierContent.button.plusDay')}
        </TextLink>
        <Spacing w={10} />
        <TextLink onPress={() => setDate(addDays(filled, 30))}>
          {t('sablierContent.button.plus30Days')}
        </TextLink>
      </Row>
    </Row>
  );

  const modalRef = useRef();

  return (
    <SlideModal
      ref={modalRef}
      hideHeader
      noPadding
    >
      <PickerWrapper>
        {header}
        <Spacing h={8} />
        <TimingInput value={date} filled={getThemeType(theme) === DARK_THEME} />
        <Spacing h={20} />
        <DatePicker
          date={filled}
          onDateChange={setDate}
          androidVariant="nativeAndroid"
          mode="datetime"
          textColor={getThemeType(theme) === DARK_THEME ? colors.activeTabBarIcon : colors.text}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          style={{ alignSelf: 'center' }}
        />
        <Spacing h={20} />
        <Button
          title={t('button.next')}
          onPress={() => {
            if (date) onConfirm(date);
            if (modalRef.current) modalRef.current.close();
          }}
          disabled={!date}
        />
      </PickerWrapper>
    </SlideModal>
  );
};

export default (withTheme(SablierDatePicker): AbstractComponent<OwnProps>);
