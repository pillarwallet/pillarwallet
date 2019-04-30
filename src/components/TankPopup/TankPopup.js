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
import styled from 'styled-components/native';
import { TouchableOpacity } from 'react-native';
import { BoldText, BaseText, MediumText } from 'components/Typography';
import PopModal from 'components/Modals/PopModal';
import Button from 'components/Button';
import Tank from 'components/Tank';
import { baseColors, fontSizes } from 'utils/variables';
import { toggleTankModalAction } from 'actions/tankActions';
import { connect } from 'react-redux';

type Props = {
  tankData: {
    totalStake: number,
    availableStake: number,
  },
  isModalVisible: boolean,
  toggleTankModal: Function,
};

const HeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 15px;
  border-bottom-width: 1px;
  border-color: #3c7ac9;
`;

const FooterRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  width: 100%;
`;

const Column = styled.View`
  flex-direction: column;
  justify-content: flex-start;
  align-items: ${props => props.flowRight ? 'flex-end' : 'flex-start'};
  ${props => props.alignSelf ? `align-self: ${props.alignSelf}` : ''};
`;

const FooterColumn = styled.View`
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 50%;
  ${props => props.isRight ? 'padding-left: 8px;' : 'padding-right : 8px;'}
`;

const Body = styled.View`
  padding: 40px 0;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const BoldTitle = styled(BoldText)`
  color: ${baseColors.white};
  font-size: ${fontSizes.medium}px;
`;

const LinkText = styled(BaseText)`
  color: #93c7ff;
  opacity: 0.7;
  font-size: ${fontSizes.extraSmall}px;
  margin-top: 4px;
`;

const StatusText = styled(BaseText)`
  color: ${props => props.active ? baseColors.emerald : baseColors.fireEngineRed};
  font-size: ${fontSizes.extraExtraSmall}px;
  letter-spacing: 0.15;
`;

const SmallText = styled(BaseText)`
  color: ${baseColors.white};
  font-size: ${fontSizes.extraExtraSmall}px;
  letter-spacing: 0.1;
  margin-top: 9px;
`;

const ValueLabel = styled(BaseText)`
  color: ${baseColors.greyser};
  font-size: ${fontSizes.extraSmall}px;
`;

const ValueText = styled(MediumText)`
  color: ${baseColors.white};
  font-size: ${fontSizes.medium}px;
`;

const Status = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  margin-top: 7px;
`;

const StatusIcon = styled.View`
  height: 8px;
  width: 8px;
  border-radius: 4px;
  background-color: ${props => props.active ? baseColors.emerald : baseColors.fireEngineRed};
  margin-right: 5px;
`;

class TankPopup extends React.Component<Props> {
  closeModal = () => {
    this.props.toggleTankModal();
  };

  render() {
    const { isModalVisible, tankData } = this.props;
    const { totalStake, availableStake } = tankData;

    return (
      <PopModal
        isVisible={isModalVisible}
        onModalHide={this.closeModal}
        onModalHiden={() => {}}
        bgColor={baseColors.royalBlue}
        bgColor2={baseColors.blumine}
      >
        <HeaderRow>
          <Column>
            <BoldTitle>Pillar Payment Network</BoldTitle>
            <Status>
              <StatusIcon active />
              <StatusText active>ACTIVE</StatusText>
            </Status>
          </Column>
          <TouchableOpacity onPress={() => {}}>
            <LinkText>
              What is it?
            </LinkText>
          </TouchableOpacity>
        </HeaderRow>
        <Body>
          <Column flowRight alignSelf="flex-start">
            <ValueLabel>Total stake</ValueLabel>
            <ValueText>{`${totalStake} PLR`}</ValueText>
          </Column>
          <Tank value={70} wrapperStyle={{ marginHorizontal: 24 }} />
          <Column alignSelf="flex-end">
            <ValueLabel>Available</ValueLabel>
            <ValueText>{`${availableStake} PLR`}</ValueText>
          </Column>
        </Body>
        <FooterRow>
          <FooterColumn>
            <Button secondaryTransparent title="Settle" block noPadding />
            <SmallText>17 assets available</SmallText>
          </FooterColumn>
          <FooterColumn isRight>
            <Button title="Top up" block noPadding />
            <SmallText>1,985 PLR till level up</SmallText>
          </FooterColumn>
        </FooterRow>
      </PopModal>
    );
  }
}


const mapStateToProps = ({
  tank: { data: tankData, isModalVisible },
}) => ({
  tankData,
  isModalVisible,
});

const mapDispatchToProps = (dispatch: Function) => ({
  toggleTankModal: () => { dispatch(toggleTankModalAction()); },
});

export default connect(mapStateToProps, mapDispatchToProps)(TankPopup);
