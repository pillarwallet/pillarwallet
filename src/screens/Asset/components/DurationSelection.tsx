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
import React, { useState } from 'react';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Utils
import { useThemeColors } from 'utils/themes';

// Components
import Text from 'components/core/Text';

const DurationSelection = () => {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [selectedDuration, setSelectedDuration] = useState(t('button.twentyfour_hour'));

  const durationList = [
    t('button.one_hour'),
    t('button.twentyfour_hour'),
    t('button.seven_day'),
    t('button.one_month'),
    t('button.one_year'),
  ];

  const renderText = (title) => (
    <Button
      key={title}
      isSelected={title === selectedDuration}
      onPress={() => {
        setSelectedDuration(title);
      }}
      testID={`${TAG}-button-enable`}
      accessibilityLabel={`${TAG}-button-enable`}
    >
      <Text variant={'small'} color={title === selectedDuration ? colors.basic010 : colors.basic030}>
        {title}
      </Text>
    </Button>
  );

  return <RowContainer>{durationList.map(renderText)}</RowContainer>;
};

const TAG = 'DURATION-SELECTION';

export default DurationSelection;

const RowContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  width: 90%;
`;

const Button = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background-color: ${({ theme, isSelected }) => (isSelected ? theme.colors.basic080 : 'transparent')};
`;
