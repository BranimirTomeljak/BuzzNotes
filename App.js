// App.js
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HiveScreen from "./screens/HiveScreen";
import RecordingsScreen from "./screens/RecordingsScreen";
import MainMenuScreen from "./screens/MainMenu"; // import the new screen
import ByColorScreen from "./screens/ByColorScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="MainMenu">
          <Stack.Screen name="MainMenu" component={MainMenuScreen} />
          <Stack.Screen name="BuzzNotes" component={HiveScreen} />
          <Stack.Screen name="Snimke" component={RecordingsScreen} />
          {/* Add the new screen to your stack navigator */}
          <Stack.Screen name="ByColorScreen" component={ByColorScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
