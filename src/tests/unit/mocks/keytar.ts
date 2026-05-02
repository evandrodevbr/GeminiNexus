export function getPassword(service: string, account: string): Promise<string | null> {
  return Promise.resolve(`mock-password-for-${account}`);
}

export function setPassword(service: string, account: string, password: string): Promise<void> {
  return Promise.resolve();
}

export function deletePassword(service: string, account: string): Promise<void> {
  return Promise.resolve();
}

export function findPassword(service: string): Promise<string | null> {
  return Promise.resolve('mock-found-password');
}

export function findCredentials(
  service: string,
): Promise<Array<{ account: string; password: string }>> {
  return Promise.resolve([]);
}
