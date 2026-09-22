import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { fonts, spacing } from "../../theme/tokens";
import { Toggle } from "./Toggle";

type SettingsRowProps = {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Verilirse metin bölümüne basmak bunu çağırır (örn. saat seçiciyi açmak). */
  onPressText?: () => void;
};

// Başlık + alt yazı solda, anahtar sağda (referanstaki "Hedef miktarı belirle" satırı).
export function SettingsRow({ title, description, value, onValueChange, onPressText }: SettingsRowProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      <Pressable style={styles.textCol} onPress={onPressText} disabled={!onPressText}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
        ) : null}
      </Pressable>
      <Toggle value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 6 },
  textCol: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontFamily: fonts.bold },
  description: { fontSize: 12, fontFamily: fonts.semibold },
});
