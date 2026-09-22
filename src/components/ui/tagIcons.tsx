import { isHabitIcon } from "../../data/habitIcons";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

// Etiket → ikon eşlemesi (YeniAliskanlik.html'deki etiket çiplerinin ikonları).
// Referanstaki inline SVG'ler Feather ikon setidir; Feather'da karşılığı
// olmayan "koşu" için MaterialCommunityIcons kullanılır. Kullanıcının kendi
// etiketleri ve etiketsiz alışkanlıklar için genel bir ikon gösterilir.
type Props = { tagId?: string; size: number; color: string };

export function TagIcon({ tagId, size, color }: Props) {
  switch (tagId) {
    case "morning":
    case "noon":
      return <Feather name="sun" size={size} color={color} />;
    case "afternoon":
    case "before-sleep":
      return <Feather name="clock" size={size} color={color} />;
    case "evening":
      return <Feather name="droplet" size={size} color={color} />;
    case "sport":
      return <MaterialCommunityIcons name="run" size={size} color={color} />;
    case "food":
      return <Feather name="book" size={size} color={color} />;
    case "bad-habits":
      return <Feather name="x" size={size} color={color} />;
    default:
      return <Feather name="check" size={size} color={color} />;
  }
}

// Bir alışkanlığın ikonu: kullanıcı bir ikon seçtiyse o, seçmediyse (eski
// kayıtlar) etiketin ikonu.
export function HabitIcon({
  icon,
  tagId,
  size,
  color,
}: {
  icon?: string;
  tagId?: string;
  size: number;
  color: string;
}) {
  if (isHabitIcon(icon)) return <MaterialCommunityIcons name={icon} size={size} color={color} />;
  return <TagIcon tagId={tagId} size={size} color={color} />;
}
