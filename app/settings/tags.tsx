import { useState } from "react";
import { goBack } from "../../src/utils/navigation";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { fonts, radius, shadow, spacing, typography } from "../../src/theme/tokens";
import { useHabitStore } from "../../src/services/habitStore";
import { HabitTag } from "../../src/types/habit";
import { isValidTagLabel, SUGGESTED_TAG_EMOJIS } from "../../src/data/tags";
import { useI18n } from "../../src/languages";


export default function ManageTagsScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { t } = useI18n();
  const { tags, deleteCustomTag, addCustomTag } = useHabitStore();

  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState(SUGGESTED_TAG_EMOJIS[0]);

  const canAdd = isValidTagLabel(label);

  const handleAdd = () => {
    if (!canAdd) return;
    addCustomTag(label.trim(), emoji);
    setLabel("");
  };

  const handleDelete = (tag: HabitTag) => {
    Alert.alert(
      t("settings.tags.delete.title"),
      t("settings.tags.delete.message", { label: tag.label }),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.delete"), style: "destructive", onPress: () => deleteCustomTag(tag.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => goBack(router)} hitSlop={12} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[typography.title, { color: colors.text, flex: 1, textAlign: "center" }]} numberOfLines={1}>
          {t("settings.tags.title")}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {/* Android kenardan kenara (edge-to-edge) çizildiği için sistem pencereyi
          klavyeye göre küçültmez; iki platformda da "padding" ile içerik
          klavyenin üstüne itilir. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <FlatList
          data={tags}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surface }, shadow.raised]}>
              <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
              <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {item.label}
              </Text>
              {item.custom ? (
                <Pressable onPress={() => handleDelete(item)} hitSlop={8} style={styles.deleteButton}>
                  <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
                </Pressable>
              ) : (
                <Text style={[typography.small, { color: colors.textMuted }]}>{t("settings.tags.default")}</Text>
              )}
            </View>
          )}
        />

        <View style={[styles.addBar, { borderTopColor: colors.border, backgroundColor: colors.glassStrong }]}>
          <View style={styles.emojiRow}>
            {SUGGESTED_TAG_EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                hitSlop={4}
                style={[
                  styles.emojiOption,
                  { borderColor: e === emoji ? colors.accent : colors.border, backgroundColor: colors.surface },
                ]}
              >
                <Text style={{ fontSize: 16 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder={t("settings.tags.placeholder")}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <Pressable
              onPress={handleAdd}
              disabled={!canAdd}
              style={[styles.addButton, { backgroundColor: canAdd ? colors.black : colors.textMuted }]}
            >
              <MaterialIcons name="add" size={20} color={colors.white} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  emojiOption: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
