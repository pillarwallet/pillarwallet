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
import React, { useRef, useState } from 'react';
import t from 'translations/translate';
import { useNavigation } from 'react-navigation-hooks';
import { Animated, StyleSheet, View } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useIsDarkTheme } from 'utils/themes';

// Constants
import { BRIDGE_TAB, SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Selectors
import { useIsExchangeAvailable, accountsSelector, useRootSelector, useSupportedAssetsPerChain } from 'selectors';

// Components
import FloatingButtons from 'components/FloatingButtons';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Config
import { ETHERSPOT_RAMP_CURRENCY_TOKENS } from 'configs/rampConfig';

// Utils
import { onRamperWidgetUrl, pelerinWidgetUrl } from 'utils/fiatToCrypto';
import { showServiceLaunchErrorToast } from 'utils/inAppBrowser';
import { getActiveAccount } from 'utils/accounts';

const AnimatedFloatingActions = ({ assetData }) => {
  const navigation = useNavigation();
  const isDarkTheme = useIsDarkTheme();

  const isExchangeAvailable = useIsExchangeAvailable();
  const [disableFront, setDisableFront] = useState(false);

  const { contractAddress, token, chain } = assetData;

  const accounts = useRootSelector(accountsSelector);
  const activeAccount = getActiveAccount(accounts);
  const supportedAssets = useSupportedAssetsPerChain();

  const flipAnimation = useRef(new Animated.Value(0)).current;
  let flipRotation = 0;
  flipAnimation.addListener(({ value }) => (flipRotation = value));
  const flipToFrontStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };
  const flipToBackStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  const flipToFront = () => {
    setTimeout(() => {
      setDisableFront(true);
    }, 500);

    Animated.timing(flipAnimation, {
      toValue: 180,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };
  const flipToBack = () => {
    setDisableFront(false);
    Animated.timing(flipAnimation, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const sellOnPelerin = async () => {
    const url = await pelerinWidgetUrl(false, null, null, null, 'sell', token, chain);
    await openInAppBrowser(url);
  };

  const buyOnPelerin = async () => {
    const url = await pelerinWidgetUrl(false, null, null, null, 'buy', token, chain);
    await openInAppBrowser(url);
  };

  const buyOnRamp = async () => {
    const url = onRamperWidgetUrl(activeAccount, supportedAssets);
    await openInAppBrowser(url);
  };

  const openInAppBrowser = async (url) => {
    const isAvailable = await InAppBrowser.isAvailable();

    if (url && isAvailable) {
      InAppBrowser.open(url, {
        // iOS Properties
        dismissButtonStyle: 'close',
        // Android Properties
        showTitle: true,
        enableUrlBarHiding: true,
        enableDefaultShare: true,
      });
    } else showServiceLaunchErrorToast();
  };

  const mtPelerinSupportedAssetsInString = firebaseRemoteConfig.getString(REMOTE_CONFIG.MT_PELERIN_SUPPORTED_ASSETS);
  const isPelerinSupported = JSON.parse(mtPelerinSupportedAssetsInString).supportedAssets.includes(token);

  const isRampSupported = ETHERSPOT_RAMP_CURRENCY_TOKENS.includes(token || chain.toUpperCase() + '_' + token);

  const buttons = [
    (isPelerinSupported || isRampSupported) && {
      title: t('label.buy'),
      iconName: isDarkTheme ? 'buy' : 'buy-light',
      onPress: isPelerinSupported ? buyOnPelerin : buyOnRamp,
    },
    isExchangeAvailable && {
      title: t('button.swap'),
      iconName: 'exchange',
      onPress: () => {
        if (!!flipRotation) flipToBack();
        else flipToFront();
      },
    },
    {
      title: t('button.send'),
      iconName: 'send',
      onPress: () => navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, { assetData }),
    },
    isPelerinSupported && {
      title: t('label.sell'),
      iconName: isDarkTheme ? 'sell' : 'sell-light',
      onPress: sellOnPelerin,
    },
  ];

  const exchangeButtons = [
    {
      title: t('label.buy') + ' ' + token,
      iconName: 'arrow-down',
      onPress: () => {
        if (!!flipRotation) flipToBack();
        else flipToFront();
        navigation.navigate(BRIDGE_TAB, { toAssetAddress: contractAddress, chain });
      },
    },
    {
      title: t('label.sell') + ' ' + token,
      iconName: 'arrow-up',
      onPress: () => {
        if (!!flipRotation) flipToBack();
        else flipToFront();
        navigation.navigate(BRIDGE_TAB, { fromAssetAddress: contractAddress, chain });
      },
    },
  ];

  return (
    <View style={style.cardWrapper}>
      <Animated.View style={[{ ...style.cardFront, ...flipToBackStyle }, disableFront && { zIndex: 111 }]}>
        <FloatingButtons items={exchangeButtons} />
      </Animated.View>
      <Animated.View style={{ ...style.cardBack, ...flipToFrontStyle }}>
        <FloatingButtons items={!disableFront ? buttons : []} />
      </Animated.View>
    </View>
  );
};

const style = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
  },
  cardFront: {
    minHeight: 100,
    backfaceVisibility: 'hidden',
    width: '100%',
  },
  cardBack: {
    backfaceVisibility: 'hidden',
    minHeight: 100,
    position: 'absolute',
    width: '100%',
  },
});

export default AnimatedFloatingActions;
