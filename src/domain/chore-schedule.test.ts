import { describe, expect, it } from "vitest";
import { calculateChoreSchedule } from "./chore-schedule";

function localDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, 8);
}

function dateKeys(dates: Date[]) {
  return dates.map((date) => date.toISOString().slice(0, 10));
}

describe("calculateChoreSchedule", () => {
  const today = localDate(2026, 9, 7);
  const horizon = localDate(2026, 9, 21);

  it("creates a one-off chore inside the scheduling window", () => {
    const schedule = calculateChoreSchedule({
      recurrenceType: "NONE",
      startDate: localDate(2026, 9, 10),
      today,
      horizon,
    });

    expect(dateKeys(schedule.dueDates)).toEqual(["2026-09-10"]);
    expect(schedule.nextDueDate).toBeNull();
  });

  it("does not recreate an expired one-off chore", () => {
    const schedule = calculateChoreSchedule({
      recurrenceType: "NONE",
      startDate: localDate(2026, 9, 1),
      today,
      horizon,
    });

    expect(schedule.dueDates).toEqual([]);
    expect(schedule.nextDueDate?.toISOString().slice(0, 10)).toBe("2026-09-01");
  });

  it("fills a daily window inclusively and advances the cursor", () => {
    const schedule = calculateChoreSchedule({
      recurrenceType: "DAILY",
      startDate: today,
      today,
      horizon: localDate(2026, 9, 9),
    });

    expect(dateKeys(schedule.dueDates)).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
    ]);
    expect(schedule.nextDueDate?.toISOString().slice(0, 10)).toBe("2026-09-10");
  });

  it("keeps every-N-days recurrence aligned with its original anchor", () => {
    const schedule = calculateChoreSchedule({
      recurrenceType: "EVERY_N_DAYS",
      recurrenceInterval: 3,
      startDate: localDate(2026, 9, 1),
      today,
      horizon,
    });

    expect(dateKeys(schedule.dueDates)).toEqual([
      "2026-09-07",
      "2026-09-10",
      "2026-09-13",
      "2026-09-16",
      "2026-09-19",
    ]);
    expect(schedule.nextDueDate?.toISOString().slice(0, 10)).toBe("2026-09-22");
  });

  it("preserves the weekday for weekly chores that started in the past", () => {
    const schedule = calculateChoreSchedule({
      recurrenceType: "WEEKLY",
      startDate: localDate(2026, 8, 31),
      today,
      horizon,
    });

    expect(dateKeys(schedule.dueDates)).toEqual([
      "2026-09-07",
      "2026-09-14",
      "2026-09-21",
    ]);
    expect(schedule.nextDueDate?.toISOString().slice(0, 10)).toBe("2026-09-28");
  });

  it("schedules selected weekdays and advances to the next selected day", () => {
    const schedule = calculateChoreSchedule({
      recurrenceType: "SPECIFIC_DAYS",
      startDate: localDate(2026, 9, 1),
      today,
      horizon: localDate(2026, 9, 13),
      daysOfWeek: [1, 4],
    });

    expect(dateKeys(schedule.dueDates)).toEqual([
      "2026-09-07",
      "2026-09-10",
    ]);
    expect(schedule.nextDueDate?.toISOString().slice(0, 10)).toBe("2026-09-14");
  });

  it("returns no occurrences for a specific-days rule with no weekdays", () => {
    const schedule = calculateChoreSchedule({
      recurrenceType: "SPECIFIC_DAYS",
      startDate: today,
      today,
      horizon,
      daysOfWeek: [],
    });

    expect(schedule.dueDates).toEqual([]);
    expect(schedule.nextDueDate?.toISOString().slice(0, 10)).toBe("2026-09-07");
  });
});
