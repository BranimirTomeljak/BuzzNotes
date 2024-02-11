// screens/ByColorScreen.js
import React, { useEffect, useState } from "react";
import {
    Button,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

export default function ByColorScreen() {
    const [recordings, setRecordings] = useState([]);
    const [sound, setSound] = useState(null);
    const colors = ["ffad99", "ffff99", "99ff99"];
    const hives = ["hive1", "hive2", "hive3"]; // replace with your actual hives

    useEffect(() => {
        const fetchRecordings = async () => {
            let allRecordings = [];
            for (let hive of hives) {
                const directory = `${FileSystem.documentDirectory}recordings/${hive}`;
                const files = await FileSystem.readDirectoryAsync(directory);
                const hiveRecordings = files.map((file) => ({
                    hive,
                    file,
                    color: file.split("w")[1].split(".")[0],
                }));
                allRecordings.push(...hiveRecordings);
            }
            setRecordings(allRecordings);
        };

        fetchRecordings();
    }, []);

    const playSound = async (uri, hive) => {
        uri = `${FileSystem.documentDirectory}recordings/${hive}/${uri}`;
        const { sound } = await Audio.Sound.createAsync({ uri });
        setSound(sound);
        await sound.playAsync();
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
            {colors.map((color) => (
                <View key={color}>
                    <Text style={{ color: `#${color}` }}>{color}</Text>
                    {recordings
                        .filter((recording) => recording.color === color)
                        .map((recording, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => playSound(recording.file, recording.hive)}
                            >
                                <Text>
                                    {recording.hive}: {recording.file}
                                </Text>
                            </TouchableOpacity>
                        ))}
                </View>
            ))}
        </View>
    );
}