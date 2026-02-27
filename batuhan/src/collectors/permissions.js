const PERMISSION_NAMES = [
  'accelerometer',
  'background-fetch',
  'background-sync',
  'camera',
  'clipboard-read',
  'clipboard-write',
  'display-capture',
  'gyroscope',
  'geolocation',
  'local-fonts',
  'magnetometer',
  'microphone',
  'midi',
  'notifications',
  'payment-handler',
  'persistent-storage',
  'storage-access',
  'window-management',
];

export async function getPermissions() {
  if (!navigator.permissions) return { supported: false };

  const result = { supported: true };

  await Promise.all(
    PERMISSION_NAMES.map(async (name) => {
      try {
        const status = await navigator.permissions.query({ name });
        result[name] = status.state;
      } catch {
        result[name] = 'unsupported';
      }
    })
  );

  return result;
}
