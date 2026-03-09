import { Alert, Platform } from 'react-native';

export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => void,
  cancelText: string,
  deleteText: string,
) {
  if (Platform.OS === 'web') {
    if (confirm(message)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel' },
      { text: deleteText, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
