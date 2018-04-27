// @flow
import * as React from 'react';
import { FooterTab, Button, Icon } from 'native-base';
import { Text } from 'react-native';
import Footer from 'components/Footer';

const NavigationFooter = () => {
  return (
    <Footer type="navigation">
      <FooterTab>
        <Button vertical>
          <Icon name="apps" />
          <Text>Apps</Text>
        </Button>
        <Button vertical>
          <Icon name="camera" />
          <Text>Camera</Text>
        </Button>
        <Button vertical active>
          <Icon active name="navigate" />
          <Text>Navigate</Text>
        </Button>
        <Button vertical>
          <Icon name="person" />
          <Text>Contact</Text>
        </Button>
      </FooterTab>
    </Footer>
  );
};

export default NavigationFooter;
