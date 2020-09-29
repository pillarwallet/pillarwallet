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

import React, { useState } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled, { withTheme } from 'styled-components/native';
import t from 'translations/translate';
import TextInput from 'components/TextInput';
import PercentsInputAccessoryHolder, {
  INPUT_ACCESSORY_NATIVE_ID,
} from 'components/PercentsInputAccessory/PercentsInputAccessoryHolder';
import SelectorOptions from 'components/SelectorOptions';
import CollectibleImage from 'components/CollectibleImage';
import { MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import Input from 'components/Input';

import { formatAmount, isValidNumber } from 'utils/common';
import { themedColors, getThemeColors } from 'utils/themes';
import { images } from 'utils/images';
import { calculateMaxAmount } from 'utils/assets';

import { COLLECTIBLES, TOKENS, defaultFiatCurrency } from 'constants/assetsConstants';
import { getBalanceInFiat, getFormattedBalanceInFiat, getAssetBalanceFromFiat } from 'screens/Exchange/utils';

import { accountBalancesSelector } from 'selectors/balances';
import { visibleActiveAccountAssetsWithBalanceSelector } from 'selectors/assets';
import { activeAccountMappedCollectiblesSelector } from 'selectors/collectibles';

import type { RootReducerState } from 'reducers/rootReducer';
import type { Rates, Balances } from 'models/Asset';
import type { Option, HorizontalOption } from 'models/Selector';
import type { Theme } from 'models/Theme';

import ValueInputHeader from './ValueInputHeader';

export type ExternalProps = {
  disabled?: boolean,
  customAssets?: Option[],
  customBalances?: Balances,
  selectorOptionsTitle?: string,
  assetData: Option,
  onAssetDataChange: (Option) => void,
  value: string,
  onValueChange: (string) => void,
  horizontalOptions?: HorizontalOption[],
  showCollectibles?: boolean,
  txFeeInfo?: Object,
  hideMaxSend?: boolean,
  updateTxFee?: (string, number) => Object,
  leftSideSymbol?: string,
  getInputRef?: (Input) => void,
  onFormValid?: (boolean) => void,
};

type InnerProps = {
  assets: Option[],
  balances: Balances,
  baseFiatCurrency: ?string,
  rates: Rates,
  collectibles: Option[],
  theme: Theme,
};

type Props = InnerProps & ExternalProps;

const CollectibleWrapper = styled.View`
  align-items: center;
`;

const SelectorChevron = styled(Icon)`
  font-size: 16px;
  color: ${themedColors.secondaryText};
`;

export const getErrorMessage = (
  amount: string,
  assetBalance: string,
  assetSymbol: string,
): string => {
  const isValid = isValidNumber(amount);
  if (!isValid) {
    return t('error.amount.invalidNumber');
  } else if (Number(assetBalance) < Number(amount)) {
    return t('error.amount.notEnoughToken', { token: assetSymbol });
  }
  return '';
};

export const ValueInput = (props: Props) => {
  const {
    disabled,
    assets,
    customAssets,
    balances,
    customBalances,
    baseFiatCurrency,
    rates,
    selectorOptionsTitle = t('transactions.title.valueSelectorModal'),
    assetData,
    onAssetDataChange,
    value,
    onValueChange,
    horizontalOptions,
    showCollectibles,
    txFeeInfo,
    hideMaxSend,
    updateTxFee,
    collectibles,
    theme,
    leftSideSymbol,
    getInputRef,
    onFormValid,
  } = props;

  const [valueInFiat, setValueInFiat] = useState<string>('');
  const [displayFiatAmount, setDisplayFiatAmount] = useState<boolean>(false);
  const [isAssetSelectorVisible, setIsAssetSelectorVisible] = useState<boolean>(false);
  const [errorMessageState, setErrorMessageState] = useState<?string>(null);

  const assetSymbol = assetData.symbol || '';
  const assetBalance = +formatAmount((customBalances || balances)[assetSymbol]?.balance);
  const maxValue = calculateMaxAmount(assetSymbol, assetBalance, txFeeInfo?.fee, txFeeInfo?.gasToken).toString();

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

  const formattedMaxValueInFiat = getFormattedBalanceInFiat(fiatCurrency, maxValue, rates, assetSymbol);
  const formattedValueInFiat = getFormattedBalanceInFiat(fiatCurrency, value, rates, assetSymbol);

  const handleValueChange = (newValue: string) => {
    let errorMessage = null;
    if (displayFiatAmount) {
      setValueInFiat(newValue);
      const convertedValue = getAssetBalanceFromFiat(baseFiatCurrency, newValue, rates, assetSymbol).toString();
      onValueChange(convertedValue);

      errorMessage = getErrorMessage(convertedValue, maxValue, assetSymbol);
    } else {
      setValueInFiat(getBalanceInFiat(fiatCurrency, newValue, rates, assetSymbol).toString());
      onValueChange(newValue);
      errorMessage = getErrorMessage(newValue, maxValue, assetSymbol);
    }
    if (errorMessage) {
      setErrorMessageState(errorMessage);
    }
  };

  const handleUsePercent = async (percent: number) => {
    let newTxFeeInfo = txFeeInfo;
    if (updateTxFee) {
      newTxFeeInfo = await updateTxFee(assetSymbol, percent / 100);
    }
    const newMaxValue = formatAmount(calculateMaxAmount(
      assetSymbol,
      assetBalance,
      newTxFeeInfo?.fee,
      newTxFeeInfo?.gasToken,
    ));
    const maxValueInFiat = getBalanceInFiat(fiatCurrency, newMaxValue, rates, assetSymbol);
    onValueChange((parseFloat(newMaxValue) * (percent / 100)).toString());
    setValueInFiat((maxValueInFiat * (percent / 100)).toString());
  };

  const onInputBlur = () => {
    PercentsInputAccessoryHolder.removeAccessory();
  };

  const onInputFocus = () => {
    PercentsInputAccessoryHolder.addAccessory(handleUsePercent);
  };

  const getCustomLabel = () => {
    return (
      <ValueInputHeader
        asset={assetData}
        onAssetPress={() => setIsAssetSelectorVisible(true)}
        labelText={hideMaxSend ? null : `${formatAmount(maxValue, 2)} ${assetSymbol} (${formattedMaxValueInFiat})`}
        onLabelPress={() => !disabled && handleUsePercent(100)}
      />
    );
  };

  const assetsOptions = customAssets || assets;

  const inputProps = {
    value: displayFiatAmount ? valueInFiat : value,
    maxLength: 42,
    customLabel: getCustomLabel(),
    onChange: handleValueChange,
    placeholder: '0',
    keyboardType: 'decimal-pad',
    editable: !disabled,
    inputAccessoryViewID: INPUT_ACCESSORY_NATIVE_ID,
    onBlur: onInputBlur,
    onFocus: onInputFocus,
  };

  const errorMessage = disabled ? null : getErrorMessage(value, maxValue, assetSymbol);

  React.useEffect(() => {
    if (onFormValid) {
      onFormValid(!errorMessage);
    }
  }, [value, assetData]);

  let optionTabs;
  if (showCollectibles) {
    optionTabs = [
      { name: t('label.tokens'), options: assetsOptions, id: TOKENS },
      { name: t('label.collectibles'), options: collectibles, id: COLLECTIBLES },
    ];
  }

  const colors = getThemeColors(theme);
  const { towellie: genericCollectible } = images(theme);

  const { tokenType = TOKENS } = assetData;

  return (
    <>
      {tokenType === TOKENS && (
        <TextInput
          style={{ width: '100%' }}
          hasError={!!errorMessage}
          errorMessage={errorMessage || errorMessageState}
          inputProps={inputProps}
          numeric
          itemHolderStyle={{ borderRadius: 10 }}
          onRightAddonPress={() => setIsAssetSelectorVisible(true)}
          leftSideText={displayFiatAmount
            ? t('tokenValue', { value: formatAmount(value || '0', 2), token: assetSymbol || '' })
            : formattedValueInFiat
          }
          onLeftSideTextPress={() => setDisplayFiatAmount(!displayFiatAmount)}
          rightPlaceholder={displayFiatAmount ? fiatCurrency : assetSymbol}
          leftSideSymbol={leftSideSymbol}
          getInputRef={getInputRef}
          inputWrapperStyle={{ zIndex: 10 }}
        />
      )}
      {tokenType === COLLECTIBLES && (
        <CollectibleWrapper>
          <MediumText medium onPress={() => setIsAssetSelectorVisible(true)}>{assetData.name}
            <SelectorChevron name="selector" color={colors.labelTertiary} />
          </MediumText>
          <CollectibleImage
            source={{ uri: assetData.imageUrl }}
            fallbackSource={genericCollectible}
            resizeMode="contain"
            width={180}
            height={180}
          />
        </CollectibleWrapper>
      )}
      <SelectorOptions
        isVisible={isAssetSelectorVisible}
        title={selectorOptionsTitle}
        options={assetsOptions}
        horizontalOptionsData={horizontalOptions}
        onOptionSelect={(option) => {
          onAssetDataChange(option);
          setIsAssetSelectorVisible(false);
        }}
        onHide={() => setIsAssetSelectorVisible(false)}
        optionTabs={optionTabs}
      />
    </>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  rates,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  assets: visibleActiveAccountAssetsWithBalanceSelector,
  collectibles: activeAccountMappedCollectiblesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


export default withTheme(connect(combinedMapStateToProps)(ValueInput));
