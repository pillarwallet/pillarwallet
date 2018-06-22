// @flow
import styled from 'styled-components/native';
import { Picker } from 'native-base';

export const CountryPicker = styled(Picker)`
  flex: 1;
  align-self: flex-end;
`;

export const CountryPickerWrapper = styled.View`
  width: 100%;
  margin-bottom: 20px;
  flex-direction: row;
  justify-content: space-between;
  border-bottom-width: 1px;
  border-color: rgb(151,151,151);
`;
