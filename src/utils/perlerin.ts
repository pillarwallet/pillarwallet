import { Account, AccountStates, GatewayTransactionStates, NotificationTypes, Sdk } from 'etherspot';
import { map } from 'rxjs/operators';

// constants
import { CHAIN_ID } from 'constants/chainConstants';

// utils
import { chainFromChainId } from 'utils/chains';

// services
import etherspotService from 'services/etherspot';

export const buildUrlOptions = (options: { [key: string]: string }): string => {
  let optionStr = '';
  Object.keys(options).map((key: string) => {
    let value = options[key];
    optionStr += `${!optionStr ? '?' : '&'}${key}=${encodeURIComponent(value)}`;
  });
  return optionStr;
};

export const buildMtPelerinOptions = (code: string, address: string) => {
  let onRampOptions = {
    lang: 'en',
    tab: 'buy',
    tabs: 'buy',
    chain: 'matic_mainnet',
    net: 'matic_mainnet',
    nets: 'arbitrum_mainnet,avalanche_mainnet,bsc_mainnet,fantom_mainnet,mainnet,optimism_mainnet,xdai_mainnet',
    crys: 'AVAX,BNB,BTCB,BUSD,DAI,ETH,FRAX,LUSD,MAI,MATIC,RBTC,RDOC,RIF,USDC,USDT,WBTC,WETH,XCHF,XDAI,XTZ',
    rfr: 'etherspot',
    bsc: 'GBP',
    bdc: 'MATIC',
    mode: 'dark',
    hash: '',
    code: code,
    addr: address || '',
  };

  return onRampOptions;
};

export const getPelerinUrl = async (
  deployingAccount = false,
  setDeployingAccount?: (value: boolean) => void,
  showAlert?: (message: string) => void,
) => {
  const chainId: number = CHAIN_ID.POLYGON;
  const chain = chainFromChainId[chainId];

  const sdk: Sdk | undefined = etherspotService.getSdkForChain(chain);
  const account: Account | undefined = await etherspotService.getAccount(chain);

  let base64Hash = '';
  const code = Math.floor(Math.random() * 8999) + 1000;
  const message = 'MtPelerin-' + code;
  let onRampOptions = buildMtPelerinOptions(code.toString(), account.address);

  if (account?.state === AccountStates.UnDeployed) {
    if (deployingAccount) {
      !!showAlert && showAlert('Deploying Etherspot wallet, please try again later.');
      return;
    }

    !!setDeployingAccount && setDeployingAccount(true);
    const hash: string = await etherspotService.setBatchDeployAccount(chain, true);
    !!setDeployingAccount && setDeployingAccount(false);

    if (!hash || hash === AccountStates.Deployed || hash === AccountStates.UnDeployed) {
      !!showAlert && showAlert('Failed to deploy the Etherspot wallet');
      return;
    }

    sdk?.notifications$
      .pipe(
        map(async (notification) => {
          if (notification?.type === NotificationTypes.GatewayBatchUpdated) {
            const submittedBatch = await sdk.getGatewaySubmittedBatch({
              hash,
            });

            const failedStates = [
              GatewayTransactionStates.Canceling,
              GatewayTransactionStates.Canceled,
              GatewayTransactionStates.Reverted,
            ];

            if (submittedBatch?.transaction?.state && failedStates.includes(submittedBatch?.transaction?.state)) {
              !!showAlert && showAlert('Failed to deploy the Etherspot wallet');
            } else if (submittedBatch?.transaction?.state === GatewayTransactionStates.Sent) {
              const signature = await sdk.signMessage({ message });
              base64Hash = Buffer.from(signature.replace('0x', ''), 'hex').toString('base64');

              if (!base64Hash) {
                !!showAlert && showAlert('There was an error getting the signature, please try again.');
                return;
              }

              onRampOptions.hash = base64Hash;
              const options = buildUrlOptions(onRampOptions);
              const url = `https://buy.mtpelerin.com/${options}`;
              return url;
            }
          }
        }),
      )
      .subscribe();
  } else {
    const signature = await sdk.signMessage({ message });
    base64Hash = Buffer.from(signature.replace('0x', ''), 'hex').toString('base64');
    if (!base64Hash) {
      !!showAlert && showAlert('There was an error getting the signature, please try again.');
      return;
    }

    onRampOptions.hash = base64Hash;
    const options = buildUrlOptions(onRampOptions);
    const url = `https://buy.mtpelerin.com/${options}`;
    return url;
  }
};
