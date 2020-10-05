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

import React, { useRef } from 'react';
import type { AbstractComponent } from 'react';
import { SafeAreaView } from 'react-navigation';
import { Image } from 'react-native';
import t from 'translations/translate';

// constants
import styled, { withTheme } from 'styled-components/native';
import { DAI } from 'constants/assetsConstants';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { BaseText } from 'components/Typography';

// types
import type { Theme } from 'models/Theme';

// utils
import { images } from 'utils/images';

export type AllowData = {
  assetSymbol: string,
  feeDisplayValue: string,
  feeInFiat: string,
  isDisabled?: boolean,
  feeToken: string,
};

type OwnProps = {|
  onModalHide: () => void,
  onAllow: () => void,
  allowData: AllowData,
|};

type Props = {|
  ...OwnProps,
  theme: Theme,
|};

const ContentWrapper = styled(SafeAreaView)`
  width: 100%;
  padding-bottom: 40px;
  align-items: center;
`;

const AssetImage = styled(Image)`
  margin-top: 4px;
  width: 64px;
  height: 64px;
`;

const Paragraph = styled(BaseText)`
  ${fontStyles.medium};
  margin-top: 20px;
  margin-bottom: 34px;
  text-align: center;
`;

const ContentRow = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const daiIcon = require('assets/images/dai_color.png');
const usdcIcon = require('assets/images/usdc_color.png');
const poolTogetherLogo = require('assets/images/pool_together.png');

const PoolTokenAllowModal = (props: Props) => {
  const {
    onModalHide,
    onAllow,
    allowData,
    theme,
  } = props;

  const modalRef = useRef();

  if (!allowData) {
    return null;
  }

  const {
    feeToken,
    feeDisplayValue,
    feeInFiat,
    assetSymbol,
    isDisabled,
  } = allowData;

  const tokenLogo = assetSymbol === DAI ? daiIcon : usdcIcon;
  const { genericToken: fallbackSource } = images(theme);

  return (
    <SlideModal
      ref={modalRef}
      onModalHide={onModalHide}
      noClose
      headerProps={({
        centerItems: [{ title: t('poolTogetherContent.title.authorizePoolTogether') }],
          sideFlex: 0,
          wrapperStyle: { paddingTop: 8, paddingHorizontal: spacing.small },
      })}
    >
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <ContentRow>
          <AssetImage
            style={{ marginRight: -11, zIndex: 1 }}
            source={tokenLogo}
            fallbackSource={fallbackSource}
          />
          <AssetImage
            style={{ marginLeft: -11, zIndex: 0 }}
            source={poolTogetherLogo}
            fallbackSource={fallbackSource}
          />
        </ContentRow>
        <Paragraph>
          {t('poolTogetherContent.paragraph.allowAutomationWithToken', { token: assetSymbol })}
        </Paragraph>
        <Button
          secondary
          title={isDisabled ? t('label.notEnoughToken', { token: feeToken }) : t('button.enable')}
          onPress={() => {
            if (modalRef.current) modalRef.current.close();
            onAllow();
          }}
          regularText
          style={{ marginBottom: 28 }}
          textStyle={{ fontSize: fontSizes.medium }}
          block
          disabled={isDisabled}
        />
        <BaseText secondary>
          {t('label.feeTokenFiat', { tokenValue: feeDisplayValue, fiatValue: feeInFiat })}
        </BaseText>
      </ContentWrapper>
    </SlideModal>
  );
};

export default (withTheme(PoolTokenAllowModal): AbstractComponent<OwnProps>);
