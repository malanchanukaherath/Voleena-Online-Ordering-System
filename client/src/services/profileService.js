import backendApi from './backendApi';

// Simple: This gets the customer profile.
export const getCustomerProfile = async () => {
  return backendApi.get('/api/v1/customers/me');
};

// Simple: This updates the customer profile.
export const updateCustomerProfile = async (payload) => {
  return backendApi.put('/api/v1/customers/me', payload);
};

// Simple: This updates the customer password.
export const changeCustomerPassword = async (payload) => {
  return backendApi.put('/api/v1/customers/me/password', payload);
};

// Simple: This gets the customer addresses.
export const getCustomerAddresses = async () => {
  return backendApi.get('/api/v1/customers/me/addresses');
};

// Simple: This creates the customer address.
export const createCustomerAddress = async (payload) => {
  return backendApi.post('/api/v1/customers/me/addresses', payload);
};

// Simple: This updates the customer address.
export const updateCustomerAddress = async (addressId, payload) => {
  return backendApi.put(`/api/v1/customers/me/addresses/${addressId}`, payload);
};

// Simple: This removes or clears the customer address.
export const deleteCustomerAddress = async (addressId) => {
  return backendApi.delete(`/api/v1/customers/me/addresses/${addressId}`);
};

// Simple: This handles request phone verification otp logic.
export const requestPhoneVerificationOTP = async () => {
  return backendApi.post('/api/v1/customers/me/phone-verification/request');
};

// Simple: This checks if the phone verification otp is correct.
export const verifyPhoneVerificationOTP = async (otp) => {
  return backendApi.post('/api/v1/customers/me/phone-verification/verify', { otp });
};
