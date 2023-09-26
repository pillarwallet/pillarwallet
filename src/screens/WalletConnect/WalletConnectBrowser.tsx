import React, { FC, useEffect } from 'react';
import { Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp as NavigationScreenProp } from '@react-navigation/native-stack';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import InAppBrowser from 'components/InAppBrowser/InAppBrowser';

// Utils
import { showServiceLaunchErrorToast } from 'utils/inAppBrowser';

// type
import type { Route } from '@react-navigation/native';

const WalletConnectBrowser: FC = () => {
  const navigation: NavigationScreenProp<any> = useNavigation();
  const route: Route = useRoute();

  const url = route?.params?.url;
  const title = route?.params?.title;
  const iconUrl = route?.params?.iconUrl;
  const isBlockchainExplorer = route?.params?.isBlockchainExplorer;

  useEffect(() => {
    if (!url || !Linking.canOpenURL(url)) showServiceLaunchErrorToast();
  }, [url]);

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        centerItems={[{ title: title }]}
        onClose={() => {
          if (isBlockchainExplorer) navigation.goBack();
          else navigation.goBack();
        }}
        noPaddingTop
      />
      <InAppBrowser initialUrl={url} iconUrl={iconUrl} />
    </Container>
  );
};

export default WalletConnectBrowser;
