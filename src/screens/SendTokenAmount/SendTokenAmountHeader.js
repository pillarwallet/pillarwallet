// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { fontSizes, fontWeights } from 'utils/variables';
import { Header as NBHeader, Body, Left, Right } from 'native-base';
import Button from 'components/Button';

type Props = {
  onBack: Function,
  index?: number,
  balanceAmount: string,
  symbol: string,
  nextOnPress: Function,
}

const Header = styled(NBHeader)`
  background-color: #fff;
  border-bottom-width: 0;
`;

const BalanceLabel = styled.Text`
  font-size: ${fontSizes.small};
  font-weight: ${fontWeights.bold};
  margin-top: 20px;
`;

const BalanceAmount = styled.Text`
  font-size: ${fontSizes.small};
  font-weight: ${fontWeights.bold};
`;

const SendTokenAmountHeader = (props: Props) => {
  const {
    onBack,
    balanceAmount,
    symbol,
    nextOnPress,
  } = props;

  return (
    <Header>
      <Left>
        <Button
          secondary
          small
          noPadding
          marginTop="20px"
          marginLeft="10px"
          onPress={() => onBack(null)}
          title="Cancel"
        />
      </Left>
      <Body>
        <BalanceLabel>Available Balance</BalanceLabel>
        <BalanceAmount>{balanceAmount} {symbol}</BalanceAmount>
      </Body>
      <Right>
        <Button
          secondary
          small
          noPadding
          marginTop="20px"
          marginRight="10px"
          onPress={nextOnPress}
          title="Next"
        />
      </Right>
    </Header>
  );
};

export default SendTokenAmountHeader;
