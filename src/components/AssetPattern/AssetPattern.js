// @flow
import * as React from 'react';
import { Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';
import { CachedImage } from 'react-native-cached-image';

type State = {
}

type Props = {
  token: string,
  icon: string,
  contractAddress: string,
  isListed: boolean,
}

const windowWidth = Dimensions.get('window').width;

const PatternWrapper = styled.View`
  width: 100%;
  height: 280px;
`;

const IconWrapper = styled.View`
  height: ${props => props.diameter}px;
  width: ${props => props.diameter}px;
  border-radius: ${props => props.borderRadius}px;
  opacity: ${props => props.opacity};
  border: 2px solid ${baseColors.white};
  position: absolute;
  z-index: ${props => props.zIndex};
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  justify-content: center;
  align-items: center;
  elevation: 6;
  background-color: ${props => props.isListed ? baseColors.white : baseColors.mediumGray};
`;

export default class AssetPattern extends React.Component<Props, State> {
  generatePattern = (token: string, icon: string, contractAddress: string, isListed: boolean) => {
    const paternDetails = [];

    const addressParts = contractAddress.split('');
    const intsFromAddress = addressParts.filter((item) => { return parseInt(item, 10) || parseInt(item, 10) === 0; });

    // intsFromAddress[0] is always 0;
    const firstItemPositionPositivity = intsFromAddress[1] ? parseInt(intsFromAddress[1], 10) % 2 === 0 : false;
    const secondItemPositionPositivity = intsFromAddress[2] ? parseInt(intsFromAddress[2], 10) % 2 === 0 : false;
    const compositionSymetrySideYAxis = intsFromAddress[3] ? parseInt(intsFromAddress[3], 10) % 2 === 0 : false;
    const compositionSymetryInnerYAxis = intsFromAddress[4] ? parseInt(intsFromAddress[4], 10) % 2 === 0 : false;
    const sideIconsTop = intsFromAddress[5] ? parseInt(intsFromAddress[5], 10) / 2 : 0;
    const innerIconsTop = intsFromAddress[6] ? parseInt(intsFromAddress[6], 10) : 0;
    const sideIconsLeft = intsFromAddress[7] ? (parseInt(intsFromAddress[7], 10) * 4) + 80 : 110;
    const innerIconsLeft = intsFromAddress[8] ? (parseInt(intsFromAddress[8], 10) * 4) + 80 : 110;
    const firstDiameterDecrease = parseInt(intsFromAddress[2], 10) < 5 ? 30 : 15;
    const secondDiameterDecrease = parseInt(intsFromAddress[2], 10) >= 5 ? 30 : 15;

    for (let i = 0; i < 5; i++) {
      let diameter = 110;
      let opacity = 1;
      let zIndex = 3;
      const horizontalCenter = windowWidth / 2;
      const verticalCenter = 280 / 2;
      let top = verticalCenter - (diameter / 2);
      let left = (windowWidth - diameter) / 2;

      const topSideChange = (up: boolean, change) => {
        if (up) return (change + diameter) * -1;
        return change;
      };

      if (i === 1 || i === 4) {
        zIndex = 1;
        opacity = 0.1;
        diameter -= firstDiameterDecrease;
        top = verticalCenter + topSideChange(firstItemPositionPositivity, sideIconsTop);
        if (!compositionSymetrySideYAxis && i === 4) {
          top = verticalCenter + topSideChange(!firstItemPositionPositivity, sideIconsTop);
        }
      }

      if (i === 2 || i === 3) {
        top = verticalCenter + topSideChange(secondItemPositionPositivity, innerIconsTop);
        if (!compositionSymetryInnerYAxis && i === 4) {
          top = verticalCenter + topSideChange(!secondItemPositionPositivity, innerIconsTop);
        }
        zIndex = 2;
        opacity = 0.5;
        diameter -= secondDiameterDecrease;
      }

      if (i === 1) {
        left = horizontalCenter - sideIconsLeft - (diameter / 2);
      }

      if (i === 2) {
        left = horizontalCenter - ((innerIconsLeft + diameter) / 2);
      }

      if (i === 3) {
        left = horizontalCenter + ((innerIconsLeft - diameter) / 2);
      }

      if (i === 4) {
        left = horizontalCenter + (sideIconsLeft - (diameter / 2));
      }

      paternDetails.push(
        <IconWrapper
          key={i}
          diameter={diameter}
          borderRadius={diameter / 2}
          opacity={opacity}
          zIndex={zIndex}
          top={top}
          left={left}
          isListed={isListed}
        >
          <CachedImage
            key={token}
            style={{
            height: diameter - 4,
            width: diameter - 4,
            }}
            source={{ uri: icon }}
            resizeMode="contain"
          />
        </IconWrapper>,
      );
    }

    return paternDetails;
  };


  render() {
    const {
      token,
      icon,
      contractAddress,
      isListed,
    } = this.props;

    return (
      <PatternWrapper>
        {this.generatePattern(token, icon, contractAddress, isListed)}
      </PatternWrapper>
    );
  }
}
