## Pillar Wallet WebView Messaging Interface

This document specifies the message bridge between the Pillar Wallet native app and the web app loaded inside the in-app WebView.

The page in the WebView communicates with the native app using `window.ReactNativeWebView.postMessage` (Web → App) and receives app responses via `window.addEventListener('message', ...)` (App → Web).

### Boot-time URL Parameters

The WebView is loaded with the following query parameters appended to the URL:

- `devicePlatform`: `'ios' | 'android'`
- `eoaAddress`: EOA address of the currently active account (if available)

Example URL:

```text
https://<pillarx-endpoint>?devicePlatform=ios&eoaAddress=0xabc...def
```

### Sending Messages to the Native App (Web → App)

Send messages using:

```js
window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
```

Where `payload` is a JSON-serializable object with at minimum:

```json
{
  "type": "<RequestType>",
  "value": "<RequestValue>",
  "data": "<Optional stringified JSON>"
}
```

`data` is optional and, when present, should be a stringified JSON payload for the request.

### Message Types (Web → App)

#### 1) Authentication Requests

- Get Private Key

  - Request:
    ```json
    { "type": "pillarXAuthRequest", "value": "pk" }
    ```
  - Response (App → Web):
    ```json
    {
      "type": "pillarWalletPkResponse",
      "value": { "pk": "0x<privateKey>" }
    }
    ```

- Open Settings
  - Request:
    ```json
    { "type": "pillarXAuthRequest", "value": "settings" }
    ```
  - Response: none (the native app navigates to Settings)

#### 2) Navigation Requests

- Open External URL
  - Request:
    ```json
    {
      "type": "pillarXNavigationRequest",
      "value": "openExternalUrl",
      "data": { "url": "https://example.com" }
    }
    ```
  - Response: none (the native app opens the URL in the system browser)
  - Description: Opens a URL in the native browser (Safari on iOS, Chrome on Android) outside of the WebView. This is useful for links that need to open in the host operating system's native browser, such as payment checkout pages or external authentication flows.

#### 3) Signing Requests

Send signing requests with:

- `type`: `"pillarXSigningRequest"`
- `value`: one of `"signMessage" | "signTransaction" | "signTypedData" | "signAuthorization"` OR a single stringified JSON containing `{ type, data }`
- `data` (or `params`): stringified JSON containing the parameters required by the specific signing action

The native app signs using a device-secured private key via a viem custom account. References:

- toAccount: `https://viem.sh/docs/accounts/local/toAccount`
- signMessage: `https://viem.sh/docs/accounts/local/signMessage`
- signTransaction: `https://viem.sh/docs/accounts/local/signTransaction`
- signTypedData: `https://viem.sh/docs/accounts/local/signTypedData`

All signing responses are returned as (App → Web):

```json
{
  "type": "pillarWalletSigningResponse",
  "value": { "result": "<signedResult>" }
}
```

On error:

````json
{
  "type": "pillarWalletSigningResponse",
  "value": { "error": "<message>" }
}
``;

Supported actions and expected `data` shapes (after parsing the stringified JSON):

- signMessage
  - Request example:
    ```json
    {
      "type": "pillarXSigningRequest",
      "value": "signMessage",
      "data": "{\"message\":\"hello world\"}"
    }
    ```
  - With raw hex:
    ```json
    {
      "type": "pillarXSigningRequest",
      "value": "signMessage",
      "data": "{\"message\":{\"raw\":\"0x68656c6c6f20776f726c64\"}}"
    }
    ```
  - Data shape: `{ "message": string | { "raw": Hex } }`

- signTransaction
  - Request example:
    ```json
    {
      "type": "pillarXSigningRequest",
      "value": "signTransaction",
      "data": "{\"chainId\":1,\"to\":\"0xabc...\",\"value\":\"0x38d7ea4c68000\",\"gas\":\"0x5208\"}"
    }
    ```
  - Data shape: viem transaction object (e.g., `to`, `value`, `gas`, `gasPrice` or `maxFeePerGas`/`maxPriorityFeePerGas`, `nonce`, `chainId`, `data`, etc.)

- signTypedData (EIP-712)
  - Request example:
    ```json
    {
      "type": "pillarXSigningRequest",
      "value": "signTypedData",
      "data": "{\"domain\":{...},\"types\":{...},\"primaryType\":\"...\",\"message\":{...}}"
    }
    ```
  - Data shape: `{ domain, types, primaryType, message }`

- signAuthorization
  - Request example:
    ```json
    {
      "type": "pillarXSigningRequest",
      "value": "signAuthorization",
      "data": "{\"...\":\"...\"}"
    }
    ```
  - Data shape: Parameters required by `pkAccount.signAuthorization()` (specific shape depends on implementation)

Notes:

- You may also provide a single stringified JSON in `value` that includes both fields:
  ```json
  {
    "type": "pillarXSigningRequest",
    "value": "{\"type\":\"signMessage\",\"data\":{\"message\":\"hello world\"}}"
  }
````

- The app first attempts to parse `data.value` as JSON; if it cannot, it expects parameters in `data.data` or `data.params`.

### Receiving Messages from the Native App (App → Web)

Install a message listener in the web page:

```js
function onNativeMessage(event) {
  try {
    const payload = JSON.parse(event.data);
    if (payload?.type === 'pillarWalletPkResponse') {
      // payload.value = { pk: string }
    }
    if (payload?.type === 'pillarWalletSigningResponse') {
      // payload.value = { result: string } or { error: string }
    }
  } catch (e) {
    // ignore
  }
}

window.addEventListener('message', onNativeMessage);
```

### Example Snippets

- Request Private Key

  ```js
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'pillarXAuthRequest',
      value: 'pk',
    }),
  );
  ```

- Open Settings

  ```js
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'pillarXAuthRequest',
      value: 'settings',
    }),
  );
  ```

- Open External URL

  ```js
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'pillarXNavigationRequest',
      value: 'openExternalUrl',
      data: { url: 'https://example.com' },
    }),
  );
  ```

- Sign Message

  ```js
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'pillarXSigningRequest',
      value: 'signMessage',
      data: JSON.stringify({ message: 'hello world' }),
    }),
  );
  ```

- Sign Transaction

  ```js
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'pillarXSigningRequest',
      value: 'signTransaction',
      data: JSON.stringify({
        chainId: 1,
        to: '0xabc...',
        value: '0x38d7ea4c68000', // 0.001 ETH
        // include gas fields as needed (EIP-1559 or legacy)
      }),
    }),
  );
  ```

- Sign Typed Data

  ```js
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'pillarXSigningRequest',
      value: 'signTypedData',
      data: JSON.stringify({
        domain: { name: 'MyDapp', version: '1', chainId: 1 },
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
          ],
          Mail: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'contents', type: 'string' },
          ],
        },
        primaryType: 'Mail',
        message: { from: '0x...', to: '0x...', contents: 'Hi' },
      }),
    }),
  );
  ```

- Sign Authorization
  ```js
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'pillarXSigningRequest',
      value: 'signAuthorization',
      data: JSON.stringify({
        // Authorization parameters as required by signAuthorization
      }),
    }),
  );
  ```

### Error Handling

On failure, the app responds with:

```json
{
  "type": "pillarWalletSigningResponse",
  "value": { "error": "<message>" }
}
```

Common causes:

- Missing or malformed `data`
- Invalid `value` (unsupported signing type)
- Private key not yet available/unlocked on the device

### Security Considerations

- The private key is only exposed when explicitly requested via `{ type: 'pillarXAuthRequest', value: 'pk' }`. Request it only when absolutely necessary.
- Validate and sanitize inputs before sending them to the bridge.
- Gate sensitive actions with explicit user consent in the web app as needed.

### viem References

- Custom account via toAccount: `https://viem.sh/docs/accounts/local/toAccount`
- signMessage: `https://viem.sh/docs/accounts/local/signMessage`
- signTransaction: `https://viem.sh/docs/accounts/local/signTransaction`
- signTypedData: `https://viem.sh/docs/accounts/local/signTypedData`
- signAuthorization: Custom account method (implementation-specific)
