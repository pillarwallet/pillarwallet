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
import styled from 'styled-components/native';
import { fontStyles, UIColors, baseColors } from 'utils/variables';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';


type Props = {
  title: string,
  content: string,
  isVisible?: boolean,
  onButtonPress: () => void,
  buttonText: string,
}

const Wrapper = styled.View`
  padding-top: 50%;
  padding-left: 16;
  padding-right: 16;
  background-color: ${UIColors.darkShadowColor};
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const ModalTitle = styled(BaseText)`
  ${fontStyles.giant};
  color: ${baseColors.white};
`;

const ModalMessage = styled(BaseText)`
  ${fontStyles.medium};
  line-height: 26;
  color: ${baseColors.white};
`;

const TextWrapper = styled.View`
  padding-left: 20;
  padding-right: 20;
`;

const ButtonWrapper = styled.View`
  height: 100%;
  justify-content: center;
`;

export default (props: Props) => {
  const {
    title, content, isVisible, onButtonPress, buttonText,
  } = props;
  const contentComponent = (
    <Wrapper>
      <TextWrapper>
        <ModalTitle>{title}</ModalTitle>
        <ModalMessage>{content}</ModalMessage>
      </TextWrapper>
      <ButtonWrapper>
        <Button
          title={buttonText}
          onPress={onButtonPress}
          height={48}
        />
      </ButtonWrapper>
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
