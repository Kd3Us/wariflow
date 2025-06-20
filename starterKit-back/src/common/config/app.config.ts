export const appConfig = {
  speedPresta: {
    apiUrl: process.env.SPEEDPRESTA_API_URL || 'https://api.speedpresta.com/api/v1/verify/token',
    timeout: parseInt(process.env.SPEEDPRESTA_TIMEOUT) || 10000,
  },
  auth: {
    tokenHeader: 'Authorization',
    tokenPrefix: 'Bearer ',
  },
}; 