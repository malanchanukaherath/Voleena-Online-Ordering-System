import backendApi from './backendApi';

export const getCustomerProfile = async () => {
  return backendApi.get('/api/v1/customers/me');
};

export const updateCustomerProfile = async (payload) => {
  return backendApi.put('/api/v1/customers/me', payload);
};

export const changeCustomerPassword = async (payload) => {
  return backendApi.put('/api/v1/customers/me/password', payload);
};

export const getCustomerAddresses = async () => {
  return backendApi.get('/api/v1/customers/me/addresses');
};

export const createCustomerAddress = async (payload) => {
  return backendApi.post('/api/v1/customers/me/addresses', payload);
};

export const updateCustomerAddress = async (addressId, payload) => {
  return backendApi.put(`/api/v1/customers/me/addresses/${addressId}`, payload);
};

export const deleteCustomerAddress = async (addressId) => {
  return backendApi.delete(`/api/v1/customers/me/addresses/${addressId}`);
};

export const requestPhoneVerificationOTP = async () => {
  return backendApi.post('/api/v1/customers/me/phone-verification/request');
};

export const verifyPhoneVerificationOTP = async (otp) => {
  return backendApi.post('/api/v1/customers/me/phone-verification/verify', { otp });
};
