import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

export default function FrontPageScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.half}
        onPress={() => navigation.navigate('BuzzNotes')}
      >
        <Text style={styles.buttonText}>Košnice</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.half}
        onPress={() => navigation.navigate('ByColorScreen')}
      >
        <Text style={styles.buttonText}>Prioriteti</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  half: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d9d9d9',
    borderWidth: 2,

  },
  buttonText: {
    fontSize: 35,
  },
});