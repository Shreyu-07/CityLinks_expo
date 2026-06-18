import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AppProvider } from "./src/context/AppContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { StatusBar } from "react-native";
import { BG_DARK } from "./src/utils/theme";

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AppNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}
