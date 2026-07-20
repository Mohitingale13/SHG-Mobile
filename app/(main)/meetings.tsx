import { View, Text, StyleSheet, FlatList, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useData, Meeting } from "@/contexts/DataContext";
import Colors from "@/constants/colors";

function MeetingItem({ meeting }: { meeting: Meeting }) {
  const { t } = useLanguage();
  const statusColor = meeting.status === "scheduled" ? Colors.light.primary :
    meeting.status === "completed" ? Colors.light.success : Colors.light.textMuted;

  return (
    <Pressable
      style={styles.meetingCard}
      onPress={() => router.push({ pathname: "/meeting/[id]", params: { id: meeting.id } })}
    >
      <View style={[styles.dateBadge, { backgroundColor: statusColor + "15" }]}>
        <Text style={[styles.dateDay, { color: statusColor }]}>
          {new Date(meeting.scheduledDate).getDate()}
        </Text>
        <Text style={[styles.dateMonth, { color: statusColor }]}>
          {new Date(meeting.scheduledDate).toLocaleDateString("en-IN", { month: "short" })}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.agenda} numberOfLines={2}>{meeting.agenda}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {meeting.status === "scheduled" ? t("scheduled") :
                meeting.status === "completed" ? t("completed") : t("meetingCancelled")}
            </Text>
          </View>
          {meeting.attendance && meeting.attendance.length > 0 && (
            <View style={styles.attendanceBadge}>
              <Ionicons name="people-outline" size={12} color={Colors.light.textSecondary} />
              <Text style={styles.attendanceText}>{meeting.attendance.length}</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
    </Pressable>
  );
}

export default function MeetingsScreen() {
  const insets = useSafeAreaInsets();
  const { isPresident, isTreasurer } = useAuth();
  const { t } = useLanguage();
  const { meetings } = useData();

  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime(),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS === "web" ? 0 : insets.top) + 12 }]}>
        <Text style={styles.title}>{t("meetings")}</Text>
        {(isPresident || isTreasurer) && (
          <Pressable
            style={styles.addBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/create-meeting"); }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        )}
      </View>

      <FlatList
        data={sortedMeetings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MeetingItem meeting={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.light.textMuted} />
            <Text style={styles.emptyText}>{t("noMeetings")}</Text>
          </View>
        }
        scrollEnabled={sortedMeetings.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: Colors.light.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  meetingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    gap: 14,
    marginBottom: 10,
  },
  dateBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  dateDay: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    lineHeight: 24,
  },
  dateMonth: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 14,
  },
  agenda: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },
  attendanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  attendanceText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: Colors.light.textMuted,
  },
});
