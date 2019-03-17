import styled from 'styled-components/native';
import { SafeAreaView, TouchableOpacity } from 'react-navigation';
import { baseColors } from 'utils/variables';

export const Title = styled.Text`
  color: ${baseColors.darkGray};
  font-size: 58px;
  font-weight: bold;
`;

export const Subtitle = styled.Text`
  color: ${baseColors.mediumGray};
  font-size: 40px;
  margin: 15px 0;
`;

export const Note = styled.Text`
  color: ${baseColors.darkGray};
  font-size: 22px;
`;

export const SafeView = styled(SafeAreaView)`
  flex: 1;
  margin: 15px 0;
`;

export const Item = styled.TouchableOpacity`
  padding: ${({ hasPadding }) => !hasPadding ? 0 : '3px 12px'};
  height: 40px;
`;

export const ItemList = styled.Text`
  color: ${baseColors.darkGray};
  font-weight: ${({ isActive }) => !isActive ? 'normal' : 'bold'};
  font-size: 18;
  margin: 5px 10px 5px 20px;
`;

export const Parent = styled.View`
  ${({ levelPosition, sectionColor }) => {
    switch (levelPosition) {
      case 1:
        return `
          margin: 4px 0;
        `;
      case 2:
        return `
          margin: 0 0 4px 16px;
          border-left-width: 1px;
          border-left-color: ${sectionColor};
        `;
      default:
        return '0';
    }
  }};

  ${({ isCollapsed, sectionHeight }) => isCollapsed ? `
    height: ${sectionHeight};
    overflow: hidden;
  ` : ''}
`;

export const ParentSection = styled.View`
  background-color: ${({ sectionColor }) => sectionColor};
  height: ${({ sectionHeight }) => sectionHeight};
  padding: 3px 12px 3px 20px;
`;

export const ParentName = styled.Text`
  color: ${baseColors.snowWhite};
  font-size: ${({ sectionFontSize }) => sectionFontSize};
  font-weight: bold;
`;
