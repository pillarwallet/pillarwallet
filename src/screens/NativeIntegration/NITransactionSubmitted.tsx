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
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';
import t from 'translations/translate';

// Components
import { Container, Wrapper } from 'components/legacy/Layout';
import Title from 'components/legacy/Title';
import Button from 'components/core/Button';
import Spinner from 'components/Spinner';
import Image from 'components/Image';

// Utils
import { spacing } from 'utils/variables';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Actions
import { viewTransactionOnBlockchainAction } from 'actions/historyActions';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors';

// Services
import etherspotService from 'services/etherspot';
import { catchError } from 'services/nativeIntegration';

function NITransactionSubmitted() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const fromAddress = useRootSelector(activeAccountAddressSelector);
  const transactionInfo = useNavigationParam('transactionInfo');
  const { chain = CHAIN.ETHEREUM, batchHash } = transactionInfo;

  const illustrationIcon = require('assets/images/illustration.png');

  const [isResolvingHash, setisResolvingHash] = useState(false);
  const [hash, setHash] = useState();

  useEffect(() => {
    const handleHashChange = async () => {
      if (!hash && batchHash) {
        setisResolvingHash(true);
        const hash = await etherspotService.waitForTransactionHashFromSubmittedBatch(chain, batchHash).catch(() => catchError('Transaction hash failed!'))
        if (hash) setHash(hash);
        setisResolvingHash(false);
      }
    };
    handleHashChange();
  }, [transactionInfo]);

  const viewOnBlockchain = () => { dispatch(viewTransactionOnBlockchainAction(chain, { hash, batchHash, fromAddress })); };

  const handleDismissal = () => { navigation.dismiss(); };

  const renderSuccess = () => {
    return (
      <ButtonContainer>
        <ButtonWrapper>
          <Button onPress={handleDismissal} title={t('button.ok')} />
        </ButtonWrapper>
        {isResolvingHash ? (
          <LoadingSpinner size={25} />
        ) : (
          <Button variant="text" title={t('button.viewOnBlockchain')} onPress={viewOnBlockchain} />
        )}
      </ButtonContainer>
    );
  };

  return (
    <Container>
      <Wrapper flex={1} center regularPadding>
        <Title fullWidth title={t('label.transaction_submitted')} titleStyles={titleStyle} align="center" />
        <IllustrationIcon source={illustrationIcon} />
        {renderSuccess()}
      </Wrapper>
    </Container>
  );
}

export default NITransactionSubmitted;

const titleStyle = {
  fontSize: 28,
};

const ButtonWrapper = styled.View`
  width: 100%;
  margin: 0px ${spacing.layoutSides}px 20px;
`;

const IllustrationIcon = styled(Image)`
  width: 80%;
  aspect-ratio: 1;
  margin-right: ${spacing.small}px;
  margin-bottom: 30%;
`;

const ButtonContainer = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const LoadingSpinner = styled(Spinner)`
  margin-top: ${spacing.large}px;
  align-items: center;
  justify-content: center;
`;
