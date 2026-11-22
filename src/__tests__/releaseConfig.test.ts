import appJson from '../../app.json';
import easJson from '../../eas.json';

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

describe('EAS versioning and submit', () => {
  it('keeps the version code on EAS servers', () => {
    expect(easJson.cli.appVersionSource).toBe('remote');
  });

  it('increments the version code on every production build', () => {
    expect(easJson.build.production.autoIncrement).toBe(true);
  });

  it('submits to the internal track as a draft', () => {
    expect(easJson.submit.production.android.track).toBe('internal');
    expect(easJson.submit.production.android.releaseStatus).toBe('draft');
  });

  it('keeps the service account key out of the repo', () => {
    expect(easJson.submit.production.android).not.toHaveProperty('serviceAccountKeyPath');
  });

  it.each(['preview', 'production'] as const)(
    'builds %s on the default image for the SDK',
    (profile) => {
      expect(easJson.build[profile].android).not.toHaveProperty('image');
    },
  );
});
