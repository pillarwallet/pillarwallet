// @flow
import * as React from 'react';
import t from 'tcomb-form-native';
import TextInput from 'components/TextInput';

export const { Form } = t.form;

export const InputTemplate = (locals: Object) => {
  const { config } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    autoCapitalize: config.autoCapitalize || 'words',
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    value: locals.value,
    keyboardType: config.keyboardType || 'default',
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

  if (config.viewWidth) {
    additionalProps.viewWidth = config.viewWidth;
  }

  return (
    <TextInput
      errorMessage={errorMessage}
      id={locals.label}
      inputProps={inputProps}
      inputType={config.inputType || 'secondary'}
      noBorder
      statusIcon={config.statusIcon}
      statusIconColor={config.statusIconColor}
      fontSize={config.fontSize}
      {...additionalProps}
    />
  );
};
