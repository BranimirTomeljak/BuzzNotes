// screens/RecordingsScreen.js
import React, { useEffect, useState } from "react";
import {
  Button,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

export default function RecordingsScreen({ route }) {
  const { hive } = route.params;
  const [recordings, setRecordings] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    const directory = `${FileSystem.documentDirectory}recordings/${hive}`;

    FileSystem.getInfoAsync(directory)
      .then(({ exists }) => {
        if (!exists) {
          return FileSystem.makeDirectoryAsync(directory, {
            intermediates: true,
          });
        }
      })
      .then(() => FileSystem.readDirectoryAsync(directory))
      .then((files) => setRecordings(files))
      .catch((error) => console.error(error));
  }, [hive]);

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") return;

    const newRecording = new Audio.Recording();
    try {
      await newRecording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const userResponse = await new Promise((resolve) => {
        Alert.alert(
          "Boja",
          "Odaberi boju, ovisno o važnosti",
          [
            { text: "RED", onPress: () => resolve("ffad99") },
            { text: "YELLOW", onPress: () => resolve("ffff99") },
            { text: "GREEN", onPress: () => resolve("99ff99") },
          ],
          { cancelable: false }
        );
      });
      const date = new Date();
      const newUri = `${
        FileSystem.documentDirectory
      }recordings/${hive}/${date.getDate()}.${
        date.getMonth() + 1
      }.${date.getFullYear()}q${date.getHours()}x${date.getMinutes()}x${date.getSeconds()}w${userResponse}.m4a`;
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });
      setRecordings((prev) => [...prev, newUri]);
      setIsRecording(false);
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };

  const playSound = async (uri) => {
    if (!uri.startsWith("file://"))
      uri = `${FileSystem.documentDirectory}recordings/${hive}/${uri}`;
    const { sound } = await Audio.Sound.createAsync({ uri });
    setSound(sound);
    await sound.playAsync();
  };

  const deleteRecording = async (filename) => {
    if (filename.startsWith("file://")) var uri = filename;
    else
      var uri = `${FileSystem.documentDirectory}recordings/${hive}/${filename}`;
    try {
      await FileSystem.deleteAsync(uri);
      setRecordings((prev) =>
        prev.filter((recording) => recording !== filename)
      );
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <View>
      {isRecording ? (
        <Button title="Stop" onPress={stopRecording} color="red" />
      ) : (
        <Button title="Start" onPress={startRecording} />
      )}
      {/* Display list of recordings if available */}
      {recordings.length > 0 && recordings.map((recording, index) => (
        console.log(recording),
        <View
          key={index}
          style={[
            styles.recordingItem,
            { backgroundColor: "#" + recording.split("w")[1].split(".")[0] },
          ]}
        >
          <TouchableOpacity onPress={() => playSound(recording)}>
            <Text>
              {recording.split("q")[0] +
                " " +
                recording.split("q")[1].split("x")[0].padStart(2, "0") +
                ":" +
                recording.split("q")[1].split("x")[1].padStart(2, "0")}
            </Text>
          </TouchableOpacity>
          <Button
            title="Izbriši"
            onPress={() => deleteRecording(recording)}
            color="red"
          />
        </View>
      ))}
      {/* Display a message if there are no recordings */}
      {recordings.length === 0 && <Text>Snimite novu snimku</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  recordingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});
