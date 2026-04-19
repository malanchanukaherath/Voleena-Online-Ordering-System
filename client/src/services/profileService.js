import backendApi from './backendApi';

// Code Review: Function getCustomerProfile in client\src\services\profileService.js. Used in: client/src/pages/Checkout.jsx, client/src/pages/Profile.jsx, client/src/services/profileService.js.
export const getCustomerProfile = async () => {
  return backendApi.get('/api/v1/customers/me');
};

// Code Review: Function updateCustomerProfile in client\src\services\profileService.js. Used in: client/src/pages/Profile.jsx, client/src/services/profileService.js.
export const updateCustomerProfile = async (payload) => {
  return backendApi.put('/api/v1/customers/me', payload);
};

// Code Review: Function changeCustomerPassword in client\src\services\profileService.js. Used in: client/src/pages/Profile.jsx, client/src/services/profileService.js.
export const changeCustomerPassword = async (payload) => {
  return backendApi.put('/api/v1/customers/me/password', payload);
};

// Code Review: Function getCustomerAddresses in client\src\services\profileService.js. Used in: client/src/pages/Checkout.jsx, client/src/pages/Profile.jsx, client/src/services/profileService.js.
export const getCustomerAddresses = async () => {
  return backendApi.get('/api/v1/customers/me/addresses');
};

// Code Review: Function createCustomerAddress in client\src\services\profileService.js. Used in: client/src/pages/Profile.jsx, client/src/services/profileService.js.
export const createCustomerAddress = async (payload) => {
  return backendApi.post('/api/v1/customers/me/addresses', payload);
};

// Code Review: Function updateCustomerAddress in client\src\services\profileService.js. Used in: client/src/pages/Profile.jsx, client/src/services/profileService.js.
export const updateCustomerAddress = async (addressId, payload) => {
  return backendApi.put(`/api/v1/customers/me/addresses/${addressId}`, payload);
};

// Code Review: Function deleteCustomerAddress in client\src\services\profileService.js. Used in: client/src/pages/Profile.jsx, client/src/services/profileService.js.
export const deleteCustomerAddress = async (addressId) => {
  return backendApi.delete(`/api/v1/customers/me/addresses/${addressId}`);
};

// Code Review: Function requestPhoneVerificationOTP in client\src\services\profileService.js. Used in: client/src/pages/Profile.jsx, client/src/services/profileService.js.
export const requestPhoneVerificationOTP = async () => {
  return backendApi.post('/api/v1/customers/me/phone-verification/request');
};

// Code Review: Function verifyPhoneVerificationOTP in client\src\services\profileService.js. Used in: client/src/pages/Profile.jsx, client/src/services/profileService.js.
export const verifyPhoneVerificationOTP = async (otp) => {
  return backendApi.post('/api/v1/customers/me/phone-verification/verify', { otp });
};
