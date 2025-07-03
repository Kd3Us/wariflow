export const appConfig = {
  speedPresta: {
    apiUrl: process.env.SPEEDPRESTA_API_URL || 'https://api.speedpresta.com/api/v1/verify/token',
    apiLogoutUrl: process.env.SPEEDPRESTA_LOGOUT_API_URL || 'https://api.speedpresta.com/api/v1/revoke/token',
    appId: "StartupKitZEiuiiKW0b21UKxSCxVSmrEtsfUCeVWiMxK2NdTAWd8HE6D4hOlmzI72EnPNpq4mS4AjD9aFzDU6A3oTMaDO5BnGn4il8EbEbIeKElPaIYHWmVm7PcE7sO",
    timeout: parseInt(process.env.SPEEDPRESTA_TIMEOUT) || 10000,
  },
  auth: {
    tokenHeader: 'Authorization',
    tokenPrefix: 'Bearer ',
  },
}; 