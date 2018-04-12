// @flow
import * as React from 'react';
import { FlatList } from 'react-native';
import type { Asset } from 'models/Asset';
import AssetCard from 'components/AssetCard';

type Props = {
  assets: Asset[]
}

const AssetCardList = (props: Props) => {
  return (
    <FlatList
      data={props.assets}
      renderItem={({ item }: {item: Asset}) => (
        <AssetCard name={item.name} amount={item.amount} color={item.color} />
      )}
    />
  );
};
export default AssetCardList;
