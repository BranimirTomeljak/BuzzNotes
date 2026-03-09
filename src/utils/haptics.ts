import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web';

/** Light tap — priority cycle, toggle, navigation */
export function hapticLight() {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap — record start/stop, save */
export function hapticMedium() {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Warning — delete confirm */
export function hapticWarning() {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** Success — save complete, solve toggle */
export function hapticSuccess() {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
