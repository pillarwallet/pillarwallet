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
import SlideModal from 'components/Modals/SlideModal';
import styled, { withTheme } from 'styled-components/native';
import { fontStyles, UIColors } from 'utils/variables';
import { BaseText } from 'components/Typography';
import type { Theme } from 'models/Theme';


type Props = {
    title: string,
    content: string,
    theme: Theme,
    isVisible?: Boolean,
}

const Wrapper = styled.View`
    padding-top: 50%;
    padding-left: 35;
    padding-right: 35;
    background-color: ${UIColors.darkShadowColor};
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
`;

const ModalTitle = styled(BaseText)`
  ${fontStyles.giant};
  color: #FFFFFF;
`;

const ModalMessage = styled(BaseText)`
  ${fontStyles.medium};
  line-height: 26;
  color: #FFFFFF;
`;

const OverlayModal = (props: Props) => {
  const { title, content, isVisible } = props;
  const contentComponent = (
    <Wrapper>
      <ModalTitle>{title}</ModalTitle>
      <ModalMessage>{content}</ModalMessage>
    </Wrapper>
  );

  return (
    <SlideModal
      isVisible={isVisible}
      hideHeader
      fullScreen
      noSwipeToDismiss
      backgroundColor="transparent"
      fullScreenComponent={contentComponent}
    />
  );
};

export default withTheme(OverlayModal);
