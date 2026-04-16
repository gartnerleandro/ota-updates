import { ArrowDownToLine, Sparkles, Wrench } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import type { ChangelogItem } from "../constants/updateChangelog";

interface UpdateRequiredModalProps {
  onUpdate: () => void;
  changelogItems?: ChangelogItem[];
}

const CHANGELOG_CONFIG = {
  feature: {
    icon: Sparkles,
    color: "#22C55E", // verde — adapata a tu theme
    background: "#F0FDF4",
  },
  fix: {
    icon: Wrench,
    color: "#3B82F6", // azul — adapta a tu theme
    background: "#EFF6FF",
  },
} as const;

export function UpdateRequiredModal({
  onUpdate,
  changelogItems,
}: UpdateRequiredModalProps) {
  const hasChangelog = changelogItems && changelogItems.length > 0;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <ArrowDownToLine size={28} color="#6366F1" />
        </View>

        <Text style={styles.title}>Actualización disponible</Text>
        <Text
          style={[
            styles.description,
            hasChangelog && styles.descriptionWithChangelog,
          ]}
        >
          Hay una nueva versión disponible. Actualiza ahora para continuar.
        </Text>

        {hasChangelog && (
          <>
            <Animated.Text
              entering={FadeInDown.delay(300).duration(250)}
              style={styles.sectionHeader}
            >
              Novedades
            </Animated.Text>
            <View style={styles.changelogList}>
              {changelogItems.map((item, index) => {
                const config = CHANGELOG_CONFIG[item.type];
                const Icon = config.icon;
                return (
                  <Animated.View
                    key={index}
                    entering={FadeInDown.delay(400 + index * 80).duration(300)}
                    style={styles.changelogItem}
                  >
                    <View
                      style={[
                        styles.changelogIcon,
                        { backgroundColor: config.background },
                      ]}
                    >
                      <Icon size={16} color={config.color} />
                    </View>
                    <Text style={styles.changelogText}>{item.description}</Text>
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={onUpdate}
        >
          <Text style={styles.buttonText}>Actualizar</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontWeight: "700",
    fontSize: 20,
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },
  descriptionWithChangelog: {
    marginBottom: 0,
  },
  sectionHeader: {
    fontWeight: "600",
    fontSize: 13,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    alignSelf: "flex-start",
    marginTop: 16,
    marginBottom: 8,
  },
  changelogList: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  changelogItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  changelogIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  changelogText: {
    flex: 1,
    fontWeight: "500",
    fontSize: 14,
    color: "#64748B",
  },
  button: {
    backgroundColor: "#6366F1", // adapta a tu color primario
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 17,
    color: "#FFFFFF",
  },
});
