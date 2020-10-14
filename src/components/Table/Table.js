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
import { View } from 'react-native';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import t from 'translations/translate';
import { themedColors } from 'utils/themes';
import { fontStyles } from 'utils/variables';
import { formatUnits } from 'utils/common';
import { BaseText, MediumText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import ProfileImage from 'components/ProfileImage';
import { ETH } from 'constants/assetsConstants';
import type { GasToken } from 'models/Transaction';
import TableAmount from './TableAmount';

export { default as TableAmount } from './TableAmount';


type Props = {
  children?: React.Node,
  title?: string,
};

type TableUserProps = {
  ensName?: ?string,
  address: string,
};

type TableFeeProps = {
  txFeeInWei: BigNumber | number,
  gasToken: ?GasToken,
};

export const TableRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
`;

export const TableLabel = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.secondaryText};
`;

export const TableTotal = styled(MediumText)`
  ${fontStyles.regular};
`;

const TableUserWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const TableUser = ({ ensName, address }: TableUserProps) => {
  address = t('ellipsedMiddleString', {
    stringStart: address.slice(0, 6),
    stringEnd: address.slice(-6),
  });

  return (
    <TableUserWrapper>
      <ProfileImage
        userName={ensName || address}
        diameter={16}
        noShadow
        borderWidth={0}
        initialsSize={10}
      />
      <Spacing w={8} />
      <BaseText regular>{ensName || address}</BaseText>
    </TableUserWrapper>
  );
};

export const TableFee = ({ txFeeInWei, gasToken }: TableFeeProps) => {
  const decimals = gasToken?.decimals || 18;
  const formattedFee = txFeeInWei ? formatUnits(txFeeInWei.toString(), decimals) : '0';
  const feeTokenSymbol = gasToken?.symbol || ETH;
  return <TableAmount amount={formattedFee} token={feeTokenSymbol} />;
};

const Divider = styled.View`
  height: 1px;
  width: 100%;
  background-color: ${themedColors.tertiary};
`;

const Table = ({ children, title }: Props) => {
  return (
    <View>
      {!!title && (
        <>
          <MediumText big>{title}</MediumText>
          <Spacing h={16} />
        </>
      )}
      {React.Children.map(children, (child, index) => {
        return (
          <>
            {index > 0 && <Divider />}
            {child}
          </>
        );
      })}
    </View>
  );
};

export default Table;
