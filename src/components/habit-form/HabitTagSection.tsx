// "Etiket" bölümü: alışkanlığın hangi gruba ait olduğu (Sabah, Sağlık, Spor...).
// Etiket zorunlu değildir — "Etiketsiz" seçili kalabilir.
// Etiketlerin tümü burada düzenlenmez; "Etiketleri Yönet" ayrı bir ekrana götürür.
//
// Çiplerin sonundaki "+ Ekle" (referans ekranda çip değil, düz vurgu metni)
// yeni bir özel etiketi bu ekrandan ayrılmadan eklemeyi sağlar. Eklenen etiket
// hemen seçili hale gelir: kullanıcı "+ Ekle"ye bastıysa niyeti zaten o etiketi
// bu alışkanlığa vermektir, ayrıca dokunmasını istemek fazladan bir adım olurdu.

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import Feather from "@expo/vector-icons/Feather";
import { darkTones, fonts, spacing, tones, toneKeyForTag } from "../../theme/tokens";
import { TagIcon } from "../ui/tagIcons";
import { useHabitStore } from "../../services/habitStore";
import { Chip } from "../ui/Chip";
import { HabitTag } from "../../types/habit";
import { tagLabel } from "../../data/tags";
import { AddTagModal } from "./AddTagModal";

type HabitTagSectionProps = {
  tags: HabitTag[];
  tagId?: string;
  onTagIdChange: (tagId: string | undefined) => void;
};

export function HabitTagSection({ tags, tagId, onTagIdChange }: HabitTagSectionProps) {
  const { colors, isDark } = useAppTheme();
  const { t } = useI18n();
  const palette = isDark ? darkTones : tones;
  const router = useRouter();
  const { addCustomTag } = useHabitStore();
  const [addVisible, setAddVisible] = useState(false);

  const handleAddTag = (label: string, emoji: string) => {
    const newTag = addCustomTag(label, emoji);
    onTagIdChange(newTag.id);
  };

  return (
    <>
      <View style={styles.tagHeaderRow}>
        <Text style={[styles.heading, { color: colors.text }]}>{t("habitForm.tag.title")}</Text>
        <Pressable onPress={() => router.push("/settings/tags")} hitSlop={8}>
          <Text style={[styles.headingLink, { color: colors.accent }]}>{t("habitForm.tag.manage")}</Text>
        </Pressable>
      </View>
      <View style={styles.optionsRow}>
        <Chip label={t("habitForm.tag.none")} selected={!tagId} onPress={() => onTagIdChange(undefined)} />
        {tags.map((tag) => {
          const tone = palette[toneKeyForTag(tag.id)];
          return (
            <Chip
              key={tag.id}
              label={tagLabel(tag)}
              tone={tone}
              leading={<TagIcon tagId={tag.id} size={14} color={tone.strong} />}
              selected={tagId === tag.id}
              onPress={() => onTagIdChange(tag.id)}
            />
          );
        })}
        <Pressable
          onPress={() => setAddVisible(true)}
          accessibilityLabel={t("habitForm.tag.addA11y")}
          style={[styles.addTagButton, { borderColor: colors.accent, backgroundColor: colors.surface }]}
        >
          <Feather name="plus" size={15} color={colors.accent} />
          <Text style={[styles.addTagText, { color: colors.accent }]}>{t("common.add")}</Text>
        </Pressable>
      </View>

      <AddTagModal
        visible={addVisible}
        onSubmit={handleAddTag}
        onClose={() => setAddVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  optionsRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  heading: { fontSize: 15, fontFamily: fonts.extrabold },
  headingLink: { fontSize: 13, fontFamily: fonts.bold },
  addTagButton: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addTagText: { fontSize: 13, fontFamily: fonts.bold },
  tagHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
