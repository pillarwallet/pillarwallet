// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { fontSizes, fontWeights } from 'utils/variables';
import { Header as NBHeader, Body, Left, Right } from 'native-base';
import ButtonIcon from 'components/ButtonIcon';

type Props = {
  onBack: Function,
  index?: number,
  balanceAmount: string,
  symbol: string,
}

const Wrapper = styled(NBHeader)`
  background-color: #fff;
  border-bottom-width: 0;
`;

const BackIcon = styled(ButtonIcon)`
  position: relative;
  top: 10px;
`;

const BalanceLabel = styled.Text`
  font-size: ${fontSizes.small};
  font-weight: ${fontWeights.bold};
  margin-top: 20px;
`;

const BalanceAmount = styled.Text`
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
`;

const SendTokenAmountHeader = (props: Props) => {
  const { onBack, balanceAmount, symbol } = props;

  return (
    <Wrapper>
      <Left />
      <Body>
        <BalanceLabel>Available Balance</BalanceLabel>
        <BalanceAmount>{balanceAmount} {symbol}</BalanceAmount>
      </Body>
      <Right>
        <BackIcon icon="close" color="#000" onPress={() => onBack(null)} fontSize={36} />
      </Right>
    </Wrapper>
  );
};

export default SendTokenAmountHeader;
