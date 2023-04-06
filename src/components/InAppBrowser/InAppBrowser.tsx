import React, { useEffect, useRef, useState, FC } from 'react';
import { Linking, TextInput } from 'react-native';
import WebView from 'react-native-webview';
import { WebViewNavigation, WebViewNavigationEvent } from 'react-native-webview/lib/WebViewTypes';
import styled from 'styled-components/native';

// Components
import Modal from 'components/Modal';

// Utils
import { useThemeColors, useIsDarkTheme } from 'utils/themes';

// Local
import AddressBar from './AddressBar';
import BrowserOptionsModal from './BrowserOptionsModal';

const DEFAULT_URL = 'https://www.pillar.fi/';

interface IInAppBrowser {
  initialUrl?: string | null;
  iconUrl?: string | null;
}

const InAppBrowser: FC<IInAppBrowser> = ({ initialUrl = '', iconUrl }) => {
  const colors = useThemeColors();
  const isDarkTheme = useIsDarkTheme();

  const webviewRef = useRef<WebView>(null);
  const urlInputRef = useRef<TextInput>(null);

  const [url, setUrl] = useState(initialUrl);
  const [urlValue, setUrlValue] = useState(null);

  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    if (!initialUrl) setUrl(DEFAULT_URL);
  }, []);

  // Prepends 'https://' if not part of the url
  const formUrl = (url: string | null) => {
    if (!url) return null;

    if (url.substring(0, 4) == 'http') return url;

    let urlParts = url.split('://');
    return 'https://' + urlParts[urlParts.length - 1];
  };

  //#region - AddressBar Functions
  const onUrlChange = (text: string | null) => {
    setIsTyping(true);
    setUrlValue(text);
  };

  const goToUrl = () => {
    setIsTyping(false);
    setUrl(formUrl(urlValue));
    if (urlInputRef) urlInputRef.current.blur();
  };

  const onBlur = () => {
    setIsTyping(false);
    setUrlValue(null);
  };

  const refreshUrl = () => webviewRef && webviewRef.current.reload();

  const stopLoading = () => webviewRef && webviewRef.current.stopLoading();

  const openInSystemBrowser = () => Linking.openURL(url);

  const openOptionsMenu = () => {
    Modal.open(() => <BrowserOptionsModal openInSystemBrowser={openInSystemBrowser} />);
  };
  //#endregion

  //#region - BrowserFloatingActions Functions
  const goBack = () => webviewRef && webviewRef.current.goBack();

  const goForward = () => webviewRef && webviewRef.current.goForward();
  //#endregion

  //#region - WebView Functions
  const onLoad = () => setIsLoading(true);

  const onLoadEnd = ({ nativeEvent }: WebViewNavigationEvent) => {
    setIsLoading(false);
    handleLoadEnd(nativeEvent);
  };

  const handleLoadEnd = (nativeEvent: WebViewNavigation) => {
    setUrl(nativeEvent.url);
    setCanGoBack(nativeEvent.canGoBack);
    setCanGoForward(nativeEvent.canGoForward);
  };
  //#endregion

  const buttonActions = {
    goToUrl,
    refreshUrl,
    stopLoading,
    openOptionsMenu,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
  };

  return (
    <Container>
      <AddressBar
        ref={urlInputRef}
        colors={colors}
        isDarkTheme={isDarkTheme}
        url={url}
        urlValue={urlValue}
        onUrlChange={onUrlChange}
        isTyping={isTyping}
        onBlur={onBlur}
        isLoading={isLoading}
        buttonActions={buttonActions}
      />

      {/* @ts-ignore */}
      <WebView ref={webviewRef} source={{ uri: url }} onLoad={onLoad} onLoadEnd={onLoadEnd} />
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.basic050};
`;

export default InAppBrowser;
