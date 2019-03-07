import styled from 'styled-components/native';
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
