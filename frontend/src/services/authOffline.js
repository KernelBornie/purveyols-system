import { saveAuth, getAuth } from './persistentStore';

export const storeOfflineAuth = async (token, user) => {
  await saveAuth('token', token);
  await saveAuth('user', user);
};

export const getOfflineAuth = async () => {
  const token = await getAuth('token');
  const user = await getAuth('user');
  return { token, user };
};

export const clearOfflineAuth = async () => {
  await saveAuth('token', null);
  await saveAuth('user', null);
};
