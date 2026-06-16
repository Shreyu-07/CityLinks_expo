import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export const pickPhoto = async (callback: (b64: string) => void) => {
  Alert.alert("Photo", "Choose source", [
    {
      text: "Camera",
      onPress: async () => {
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.8, allowsEditing: true });
        if (!result.canceled && result.assets[0]?.base64)
          callback(`data:image/jpeg;base64,${result.assets[0].base64}`);
      },
    },
    {
      text: "Gallery",
      onPress: async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.8, allowsEditing: true });
        if (!result.canceled && result.assets[0]?.base64)
          callback(`data:image/jpeg;base64,${result.assets[0].base64}`);
      },
    },
    { text: "Cancel", style: "cancel" },
  ]);
};
