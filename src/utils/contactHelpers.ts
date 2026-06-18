import { Linking, Platform } from "react-native";

export const handleCall = (phone: string) => {
  const url = `tel:${phone.replace(/\s+|-/g, "")}`;
  Linking.canOpenURL(url).then((ok) => { if (ok) Linking.openURL(url); });
};

export const handleWhatsApp = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  const url = `whatsapp://send?phone=91${cleaned}`;
  Linking.openURL(url).catch(() => alert("WhatsApp is not installed on your device"));
};
