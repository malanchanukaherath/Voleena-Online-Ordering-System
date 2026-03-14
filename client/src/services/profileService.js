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
