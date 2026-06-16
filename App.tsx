import React from "react";
import { AppProvider } from "./src/context/AppContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { StatusBar } from "react-native";
import { BG_DARK } from "./src/utils/theme";

export default function App() {
  return (
    <AppProvider>
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <AppNavigator />
    </AppProvider>
  );
}
