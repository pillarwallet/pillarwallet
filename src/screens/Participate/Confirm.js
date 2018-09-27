// @flow
import * as React from 'react';
import { Text } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import Header from 'components/Header';
import Button from 'components/Button';
import { Container, Wrapper } from 'components/Layout';

type Props = {
  navigation: NavigationScreenProp<*>,
}

const ConfirmScreen = (props: Props) => {
  const { navigation } = props;

  const navigateBack = () => {
    navigation.goBack();
  };

  const endFlow = () => {
    navigation.dismiss();
  };

  return (
    <Container>
      <Header
        onBack={navigateBack}
        title="review and confirm"
      />
      <Wrapper flex={1} regularPadding center>
        <Text>Confirm</Text>
        <Button block title="Confirm transaction" onPress={endFlow} />
      </Wrapper>
    </Container>
  );
};

export default ConfirmScreen;
