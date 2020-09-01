// @flow
import * as React from 'react';
import t from 'tcomb-form-native';
import TextInput from 'components/TextInput';

export const { Form } = t.form;

export const InputTemplate = (locals: Object) => {
  const { config } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    autoCapitalize: config.autoCapitalize || 'words', // eslint-disable-line i18next/no-literal-string
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    value: locals.value,
    keyboardType: config.keyboardType || 'default', // eslint-disable-line i18next/no-literal-string
    placeholder: config.placeholder || '',
    ...config.inputProps,
  };

  const additionalProps = {};

  if (config.includeLabel) {
    additionalProps.label = locals.label;
  }

  if (config.isLoading !== undefined) {
    additionalProps.loading = config.isLoading;
  }

  if (config.rightPlaceholder) {
    additionalProps.rightPlaceholder = config.rightPlaceholder;
  }

  if (config.statusIcon || config.statusIconColor) {
    additionalProps.iconProps = {
      icon: config.statusIcon,
      color: config.statusIconColor,
    };
  }

  if (config.additionalStyle) {
    additionalProps.additionalStyle = config.additionalStyle;
  }

  return (
    <TextInput
      errorMessage={errorMessage}
      inputProps={inputProps}
      {...additionalProps}
    />
  );
};
