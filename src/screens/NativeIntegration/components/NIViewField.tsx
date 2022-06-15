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
import { useTranslation } from 'translations/translate';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/legacy/Layout';
import TextInput from 'components/legacy/TextInput';

// Services
import { fontStyles } from 'utils/variables';

// Utils
import { useTheme } from 'utils/themes';

type Props = {
  itemInfo: infoType;
  contractData: any;
};

type inputType =
  | 'BigNumberInput'
  | 'TokenValueInput'
  | 'AutoScaleTextInput'
  | 'CollectibleInput'
  | 'FiatValueInput'
  | 'MultilineTextInput'
  | 'TextInput'
  | 'TokenFiatValueInputs'
  | null;

type bluePrintType = {
  isApprovalNeeded: boolean;
  mapsToParameterNumber: number;
  uiComponent: inputType;
  required: boolean;
  userVisible: boolean;
  uiComponentProperties?: any;
};

type infoType = {
  internalType: string;
  name: string | null | '';
  type: string;
};

function NIViewField({ itemInfo, contractData }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [value, setValue] = React.useState();

  const inputComponent = () => {
    return (
      <TextInput
        theme={theme}
        inputWrapperStyle={{ flex: 1, paddingBottom: 0 }}
        inputProps={{
          value: value,
          editable: false,
          placeholder: t('label.address'),
          autoCapitalize: 'none',
        }}
      />
    );
  };

  return (
    <Container>
      <Title>{itemInfo.name}</Title>
      {inputComponent()}
      <Spacing h={20} />
    </Container>
  );
}

export default NIViewField;

const Container = styled.View``;

const Title = styled(Text)`
  ${fontStyles.medium};
  font-variant: tabular-nums;
`;
