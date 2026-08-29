export const environment = {
  production: false,
  apiUrl: `${window.location.protocol}//${window.location.hostname}:3000`,
  apiPrefix: '',
  apiCapabilities: {
    cart: true,
    checkout: true
  }
}
