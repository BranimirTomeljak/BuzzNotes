import appJson from '../../app.json';

const android = appJson.expo.android;

describe('Android permissions', () => {
  it('blocks the permissions the app never uses', () => {
    expect(android.blockedPermissions).toEqual([
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ]);
  });

  it.each([
    'READ_EXTERNAL_STORAGE',
    'WRITE_EXTERNAL_STORAGE',
    'RECORD_AUDIO',
    'MODIFY_AUDIO_SETTINGS',
    'CAMERA',
    'VIBRATE',
    'INTERNET',
  ])('never blocks %s', (name) => {
    expect(android.blockedPermissions).not.toContain(`android.permission.${name}`);
  });
});
