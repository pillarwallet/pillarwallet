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

import * as React from 'react';
import { SafeAreaView } from 'react-navigation';
import { Image } from 'react-native';

// constants
import styled, { withTheme } from 'styled-components/native';
import { DAI } from 'constants/assetsConstants';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { BaseText } from 'components/Typography';

// types
import type { ApiUser } from 'models/Contacts';
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

type Props = {
  onModalHide: () => void,
  onConfirm: (status: ?string) => void,
  isVisible: boolean,
  manageContactType: string,
  contact: ApiUser,
  onAllow: () => void,
  allowData: AllowData,
  theme: Theme,
};


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
    isVisible,
    allowData,
    theme,
  } = props;

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
      isVisible={isVisible}
      onModalHide={onModalHide}
      noClose
      headerProps={{
        centerItems: [{ title: 'Authorize Pool Together' }],
        sideFlex: '0',
        wrapperStyle: { paddingTop: 8, paddingHorizontal: spacing.small },
      }}
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
          {
            `Allow Pool Together to spend your ${assetSymbol} and automate transactions for you. ` +
            'You will have to do it only once. All further purchases will be executed with no automation fee.'
          }
        </Paragraph>
        <Button
          secondary
          title={isDisabled ? `Not enough ${feeToken}` : 'Enable'}
          onPress={onAllow}
          regularText
          style={{ marginBottom: 28 }}
          textStyle={{ fontSize: fontSizes.medium }}
          block
          disabled={isDisabled}
        />
        <BaseText secondary>
          {`Fee ${feeDisplayValue} (${feeInFiat})`}
        </BaseText>
      </ContentWrapper>
    </SlideModal>
  );
};

export default withTheme(PoolTokenAllowModal);
