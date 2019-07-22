// @flow
export function sendWyreTemplate(
  SENDWYRE_ENVIRONMENT: string,
  SENDWYRE_ACCOUNT_ID: string,
  secretKey: string,
  destAddress: string,
  destCurrency: string,
  sourceCurrency: string,
  sourceAmount: string,
) {
  return `
<html>
<body>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<script src="https://verify.sendwyre.com/js/widget-loader.js"></script>
<script>
  var widget = new Wyre.Widget({
    env: "${SENDWYRE_ENVIRONMENT}",
    accountId: "${SENDWYRE_ACCOUNT_ID}",
    auth: {
      type: "secretKey",
      secretKey: "${secretKey}"
    },
    operation: {
      type: "debitcard",
      dest: "ethereum:${destAddress}",
      sourceCurrency: "${sourceCurrency}",
      destCurrency: "${destCurrency}",
      sourceAmount: ${sourceAmount}
    },
    style: {
      primaryColor: "#000000"
    }
  });
  
  widget.on('complete', function(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify(e));
  });
  
  widget.on('close', function(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify(e));
  });
  
  widget.open();
</script>
</body>
</html>
`;
}
