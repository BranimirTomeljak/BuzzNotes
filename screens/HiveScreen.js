import React from "react";
import { Button, View, TextInput, Alert, StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system";

export default function HiveScreen({ navigation }) {
    const [hives, setHives] = React.useState([]);
    const [newHiveName, setNewHiveName] = React.useState("");

    React.useEffect(() => {
        FileSystem.readDirectoryAsync(FileSystem.documentDirectory + "recordings")
            .then((files) => {
                const sortedFiles = files.sort((a, b) => Number(a) - Number(b));
                setHives(sortedFiles);
            })
            .catch((error) => console.error(error));
    }, []);

    const createNewHive = () => {
        if (
            hives
                .map((hive) => hive.toLowerCase())
                .includes(newHiveName.toLowerCase())
        ) {
            Alert.alert("Greška", "Košnica s tim imenom već postoji.");
            return;
        }
        if (newHiveName.trim() === "") {
            Alert.alert("Greška", "Unesite ime za novu košnicu.");
            return;
        }

        const newHivePath = `${FileSystem.documentDirectory}${newHiveName}`;

        FileSystem.makeDirectoryAsync(newHivePath, { intermediates: true })
            .then(() => {
                setHives((prevHives) => [...prevHives, newHiveName]);
                setNewHiveName("");
            })
            .catch((error) => console.error(error));
    };

    const deleteHive = async (hive) => {
        const hivePath = `${FileSystem.documentDirectory}recordings/${hive}`;

        try {
            await FileSystem.deleteAsync(hivePath, { idempotent: true });
            setHives((prevHives) => prevHives.filter((h) => h !== hive));
        } catch (error) {
            console.error(error);
        }
      };

    return (
        <View>
            <TextInput
                value={newHiveName}
                onChangeText={setNewHiveName}
                placeholder="Ime nove košnice"
            />
            <Button title="dodaj" onPress={createNewHive} color="green" />
            {hives.map((hive) => (
                <View key={hive} style={styles.buttonContainer}>
                    <View style={styles.addButton}>
                        <Button
                            key={hive}
                            title={`${hive}`}
                            onPress={() => navigation.navigate("Snimke", { hive })}
                        />
                    </View>
                    <View style={styles.deleteButton}>
                        <Button
                            title="izbriši"
                            color="red"
                            onPress={() => deleteHive(hive)}
                        />
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 10,
    },
    addButton: {
        width: "80%",
    },
    deleteButton: {
        width: "20%",
    },
});
