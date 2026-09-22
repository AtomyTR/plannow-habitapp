// Bu dosya: toplantılara yapılan her şey.
//
// Toplantı, belirli bir tarih ve saatte olan tek seferlik bir randevudur.
// Alışkanlıktan farkı: tekrar etmez, çöp kutusu yoktur (silinince gerçekten
// silinir) ve bildirimi tek tanedir — toplantıdan istenen dakika kadar önce
// bir kez çalar.
//
// Alışkanlıklardaki ile aynı "kuşak" (generation) yarış koruması burada da
// geçerlidir: kullanıcı bildirim kurulurken toplantıyı düzenler veya silerse,
// geç gelen sonuç kaydedilmez, doğrudan iptal edilir. Olmasaydı silinen bir
// toplantı için telefon yine de bildirim çalardı.

import React, { useRef } from "react";
import { Meeting } from "../../types/habit";
import { HabitStoreValue } from "../habitStoreTypes";
import { generateId } from "../id";
import { meetingReminderChanged } from "../notifications/reminderDiff";
import { cancelMeetingReminder, scheduleMeetingReminder } from "../notifications";

type MeetingActionsDeps = {
  meetingsRef: React.MutableRefObject<Meeting[]>;
  setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
};

type MeetingActions = Pick<HabitStoreValue, "addMeeting" | "updateMeeting" | "deleteMeeting"> & {
  resyncMeeting: (meeting: Meeting) => void;
};

export function useMeetingActions(deps: MeetingActionsDeps): MeetingActions {
  const { meetingsRef, setMeetings } = deps;

  // Toplantı başına kuşak sayacı — alışkanlıklardaki ile aynı mantık, ama tek
  // bir notificationId üzerinden.
  const meetingGenerationRef = useRef<Map<string, number>>(new Map());

  function bumpMeetingGeneration(id: string) {
    const next = (meetingGenerationRef.current.get(id) ?? 0) + 1;
    meetingGenerationRef.current.set(id, next);
    return next;
  }

  function applyMeetingScheduleResult(id: string, generation: number, notificationId: string | null) {
    if (meetingGenerationRef.current.get(id) !== generation) {
      // Daha yeni bir düzenleme/silme geçersiz kıldı — bu bildirim sahipsiz.
      if (notificationId) {
        cancelMeetingReminder(notificationId).catch((error) =>
          console.error("Geçersiz kalmış toplantı hatırlatıcısı iptal edilemedi", error)
        );
      }
      return;
    }
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, notificationId: notificationId ?? undefined } : m)));
  }

  const addMeeting: HabitStoreValue["addMeeting"] = (meeting) => {
    const newMeeting: Meeting = {
      ...meeting,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    meetingsRef.current = [...meetingsRef.current, newMeeting];
    setMeetings((prev) => [...prev, newMeeting]);

    if (newMeeting.hasReminder) {
      const generation = bumpMeetingGeneration(newMeeting.id);
      scheduleMeetingReminder(newMeeting)
        .then((notificationId) => applyMeetingScheduleResult(newMeeting.id, generation, notificationId))
        .catch((error) => console.error("Toplantı hatırlatıcısı planlanamadı", error));
    }

    return newMeeting;
  };

  const updateMeeting: HabitStoreValue["updateMeeting"] = (id, patch) => {
    const current = meetingsRef.current.find((m) => m.id === id);
    if (!current) return;

    const merged: Meeting = { ...current, ...patch };
    meetingsRef.current = meetingsRef.current.map((m) => (m.id === id ? merged : m));
    setMeetings((prev) => prev.map((m) => (m.id === id ? merged : m)));

    if (meetingReminderChanged(current, merged)) {
      const generation = bumpMeetingGeneration(id);
      cancelMeetingReminder(current.notificationId)
        .then(() => (merged.hasReminder ? scheduleMeetingReminder(merged) : Promise.resolve(null)))
        .then((notificationId) => applyMeetingScheduleResult(id, generation, notificationId))
        .catch((error) => console.error("Toplantı hatırlatıcısı yeniden planlanamadı", error));
    }
  };

  const deleteMeeting: HabitStoreValue["deleteMeeting"] = (id) => {
    const current = meetingsRef.current.find((m) => m.id === id);
    if (!current) return;

    // Devam eden planı geçersiz kıl; geç dönen bir promise sahipsiz id yazamasın.
    bumpMeetingGeneration(id);

    if (current.notificationId) {
      cancelMeetingReminder(current.notificationId).catch((error) =>
        console.error("Toplantı hatırlatıcısı iptal edilemedi", error)
      );
    }

    meetingsRef.current = meetingsRef.current.filter((m) => m.id !== id);
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  // Dil değişince bekleyen hatırlatma yeni dildeki metinle yeniden kurulur.
  const resyncMeeting = (meeting: Meeting) => {
    if (!meeting.hasReminder) return;
    const generation = bumpMeetingGeneration(meeting.id);
    cancelMeetingReminder(meeting.notificationId)
      .then(() => scheduleMeetingReminder(meeting))
      .then((notificationId) => applyMeetingScheduleResult(meeting.id, generation, notificationId))
      .catch((error) => console.error("Toplantı hatırlatıcısı yeniden planlanamadı", error));
  };

  return { addMeeting, updateMeeting, deleteMeeting, resyncMeeting };
}
