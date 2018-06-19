// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { fontSizes, UIColors } from 'utils/variables';
import { Header as NBHeader, Body, Left, Right, Icon } from 'native-base';
import Button from 'components/Button';
import { TouchableOpacity } from 'react-native';


type Props = {
  onBack: Function,
  index?: number,
  onNext: Function,
  amount: number,
  symbol: string,
}

const Header = styled(NBHeader)`
  background-color: #fff;
  border-bottom-width: 0;
  elevation: 0;
`;

const BalanceLabel = styled.Text`
  font-size: ${fontSizes.extraSmall};
  align-self: center;
  line-height: 12px;
  margin-top: 8px;
`;

const BalanceAmount = styled.Text`
  font-size: ${fontSizes.small};
  align-self: center;
  line-height: 20px;
`;

const SendTokenAmountHeader = (props: Props) => {
  const {
    onBack,
    onNext,
    amount,
    symbol,
  } = props;

  return (
    <Header>
      <Left style={{ flex: 1 }}>
        <TouchableOpacity onPress={onBack}>
          <Icon
            name="chevron-left"
            type="Feather"
            style={{
              color: UIColors.primary,
              fontSize: fontSizes.extraExtraLarge,
            }}
            onPress={() => onBack(null)}
          />
        </TouchableOpacity>
      </Left>
      <Body style={{ flex: 1 }}>
        <BalanceLabel>Send</BalanceLabel>
        <BalanceAmount>{amount} {symbol}</BalanceAmount>
      </Body>
      <Right style={{ flex: 1 }}>
        <Button
          secondary
          small
          noPadding
          marginTop="20px"
          marginRight="10px"
          onPress={() => onNext()}
          title="Send"
        />
      </Right>
    </Header>
  );
};

export default SendTokenAmountHeader;
