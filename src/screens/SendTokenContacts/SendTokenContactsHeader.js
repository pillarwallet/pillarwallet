// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { fontSizes, fontWeights, baseColors } from 'utils/variables';
import { Header as NBHeader, Body, Left, Right } from 'native-base';
import Button from 'components/Button';
import ButtonIcon from 'components/ButtonIcon';

type Props = {
  onBack: Function,
  index?: number,
  nextOnPress: Function,
  amount: number,
  symbol: string,
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
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
`;

const BackIcon = styled(ButtonIcon)`
  position: relative;
  top: 10px;
`;

const SendTokenAmountHeader = (props: Props) => {
  const {
    onBack,
    nextOnPress,
    amount,
    symbol,
  } = props;

  return (
    <Header>
      <Left>
        <BackIcon icon="arrow-back" color={baseColors.clearBlue} onPress={() => onBack(null)} fontSize={28} />
      </Left>
      <Body>
        <BalanceLabel>Send</BalanceLabel>
        <BalanceAmount>{amount} {symbol}</BalanceAmount>
      </Body>
      <Right>
        <Button
          secondary
          small
          noPadding
          marginTop="20px"
          marginRight="10px"
          onPress={() => nextOnPress()}
          title="Send"
        />
      </Right>
    </Header>
  );
};

export default SendTokenAmountHeader;
