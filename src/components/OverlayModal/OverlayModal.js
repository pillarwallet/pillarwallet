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
import { type LayoutEvent } from 'react-native/Libraries/Types/CoreEventTypes';
import SlideModal from 'components/Modals/SlideModal/SlideModal-old';
import styled from 'styled-components/native';
import { fontStyles, UIColors, baseColors } from 'utils/variables';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import { getDeviceHeight } from 'utils/common';


type Props = {
  title: string,
  content: string,
  isVisible?: boolean,
  onButtonPress: () => void,
  buttonText: string,
};

type State = {
  bottomSpaceHeight: number,
};

const Wrapper = styled.View`
  padding-left: 16;
  padding-right: 16;
  background-color: ${UIColors.darkShadowColor};
  flex: 1;
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
  height: ${({ height }) => height};
  justify-content: center;
`;

const Spacer = styled.View`
  height: 30%;
`;

export default class OverlayModal extends React.Component<Props, State> {
  state: State = {
    bottomSpaceHeight: 0,
  };

  handleTextLayout = (e: LayoutEvent) => {
    const { y, height } = e.nativeEvent.layout;
    this.setState({ bottomSpaceHeight: getDeviceHeight() - y - height });
  };

  render() {
    const {
      title, content, isVisible, onButtonPress, buttonText,
    } = this.props;
    const { bottomSpaceHeight } = this.state;
    return (
      <SlideModal
        isVisible={isVisible}
        hideHeader
        noTopPadding
        fullScreen
        noSwipeToDismiss
        backgroundColor="transparent"
      >
        <Wrapper>
          <Spacer />
          <TextWrapper onLayout={this.handleTextLayout}>
            <ModalTitle>{title}</ModalTitle>
            <ModalMessage>{content}</ModalMessage>
          </TextWrapper>
          <ButtonWrapper height={bottomSpaceHeight}>
            <Button title={buttonText} onPress={onButtonPress} height={48} />
          </ButtonWrapper>
        </Wrapper>
      </SlideModal>
    );
  }
}
