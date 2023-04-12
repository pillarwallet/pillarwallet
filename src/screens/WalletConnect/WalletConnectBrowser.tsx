import React, { FC, useEffect } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import InAppBrowser from 'components/InAppBrowser/InAppBrowser';

// Utils
import { showServiceLaunchErrorToast } from 'utils/inAppBrowser';

const WalletConnectBrowser: FC = () => {
  const navigation = useNavigation();

  const url = navigation.getParam('url');
  const title = navigation.getParam('title');
  const iconUrl = navigation.getParam('iconUrl');
  const isBlockchainExplorer = navigation.getParam('isBlockchainExplorer');

  useEffect(() => {
    if (!url || !Linking.canOpenURL(url)) showServiceLaunchErrorToast();
  }, [url]);

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        centerItems={[{ title: title }]}
        onClose={() => {
          if (isBlockchainExplorer) navigation.dismiss();
          else navigation.goBack();
        }}
        noPaddingTop
      />
      <InAppBrowser initialUrl={url} iconUrl={iconUrl} />
    </Container>
  );
};

export default WalletConnectBrowser;
