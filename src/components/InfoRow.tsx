import React from 'react';
import { View, Text } from 'react-native';
import { globalStyles as styles } from '../utils/theme';

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "Not provided"}</Text>
  </View>
);
export default InfoRow;
