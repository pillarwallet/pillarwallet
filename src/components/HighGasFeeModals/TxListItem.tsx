import React, { FC } from 'react';
import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing, fontSizes } from 'utils/variables';

interface ITxListItem {
  title: string;
  component?: JSX.Element;
}

const TxListItem: FC<ITxListItem> = ({ title, component }) => {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    title: {
      fontSize: fontSizes.big,
      color: colors.basic030,
    },
  });

  const renderComponentProp = () => {
    if (component) return component;
    return null;
  };

  return (
    <ItemRow>
      <Text style={styles.title}>{title}</Text>
      {renderComponentProp()}
    </ItemRow>
  );
};

export default TxListItem;

const ItemRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: ${spacing.large}px 0px;
`;
