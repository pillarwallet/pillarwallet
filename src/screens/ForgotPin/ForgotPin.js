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
import t from 'translations/translate';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';

// constants
import { IMPORT_WALLET_LEGALS, FORGOT_PIN } from 'constants/navigationConstants';

// components
import { Wrapper } from 'components/legacy/Layout';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { Paragraph } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';

// utils
import { spacing } from 'utils/variables';

// types
import type { OnValidPinCallback } from 'models/Wallet';

type Props = {
  checkPin: (pin: string, onValidPin: ?OnValidPinCallback) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

const FooterParagraph = styled(Paragraph)`
  margin-bottom: ${spacing.rhythm}px;
`;

const FooterWrapper = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
`;

class ForgotPin extends React.Component<Props, {}> {
  goBackToPin = () => {
    this.props.navigation.goBack(null);
  };

  toImportWallet = () => {
    this.props.navigation.navigate(IMPORT_WALLET_LEGALS, { navigateTo: FORGOT_PIN });
  };

  render() {
    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: t('auth:title.forgotPin') }],
          rightItems: [{ close: true }],
          noBack: true,
          onClose: this.goBackToPin,
        }}
        footer={
          <FooterWrapper>
            <FooterParagraph>{t('auth:paragraph.restoreWalletWarning')}</FooterParagraph>
            <Button
              leftIconName="down-arrow"
              danger
              marginBottom={4}
              onPress={this.toImportWallet}
              title={t('auth:title.importWallet')}
              testID={`${TAG}-button-import_wallet`}
              // eslint-disable-next-line i18next/no-literal-string
              accessibilityLabel={`${TAG}-button-import_wallet`}
            />
            <Button
              onPress={this.goBackToPin}
              transparent
              title={t('auth:button.backToPin')}
              testID={`${TAG}-button-back`}
              // eslint-disable-next-line i18next/no-literal-string
              accessibilityLabel={`${TAG}-button-back`}
            />
          </FooterWrapper>
        }
      >
        <Wrapper regularPadding style={{ marginTop: spacing.layoutSides }}>
          <Paragraph>{t('auth:paragraph.restoreWalletInstructions')}</Paragraph>
          <Paragraph light>{t('auth:paragraph.restoreWalletGetReady')}</Paragraph>
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({ wallet: { data: wallet } }) => ({ wallet });

export default connect(mapStateToProps)(ForgotPin);

const TAG = 'ForgotPin';
