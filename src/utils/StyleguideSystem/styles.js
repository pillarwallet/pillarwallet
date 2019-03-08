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
`;

export const ItemList = styled.Text`
  color: ${baseColors.darkGray};
  font-weight: ${({ isActive }) => !isActive ? 'normal' : 'bold'};
  font-size: 18;
  margin: 5px 10px 5px 20px;
`;

export const Group = styled.View`
  margin: 8px 0;
`;

export const GroupSection = styled.View`
  background-color: ${baseColors.mediumGray};
  padding: 3px 12px 3px 20px;
`;

export const GroupName = styled.Text`
  color: ${baseColors.snowWhite};
  font-size: 20;
  font-weight: bold;
`;
