import { addDays, differenceInCalendarDays, getDay } from "date-fns";
import { toDateOnly } from "../lib/date";

export type ChoreRecurrenceType =
  | "NONE"
  | "DAILY"
  | "EVERY_N_DAYS"
  | "WEEKLY"
  | "SPECIFIC_DAYS";

export interface ChoreScheduleInput {
  recurrenceType: ChoreRecurrenceType;
  startDate: Date;
  today: Date;
  horizon: Date;
  recurrenceInterval?: number | null;
  daysOfWeek?: number[];
}

export interface ChoreSchedule {
  dueDates: Date[];
  nextDueDate: Date | null;
}

function getIntervalAlignedDate(anchor: Date, from: Date, stepDays: number) {
  if (anchor >= from) return anchor;

  const daysSinceAnchor = differenceInCalendarDays(from, anchor);
  const stepsToAdvance = Math.ceil(daysSinceAnchor / stepDays);

  return addDays(anchor, stepsToAdvance * stepDays);
}

function getNextSpecificDayAfter(date: Date, daysOfWeek: number[]) {
  let candidate = addDays(date, 1);

  while (!daysOfWeek.includes(getDay(candidate))) {
    candidate = addDays(candidate, 1);
  }

  return candidate;
}

export function calculateChoreSchedule({
  recurrenceType,
  startDate,
  today,
  horizon,
  recurrenceInterval,
  daysOfWeek = [],
}: ChoreScheduleInput): ChoreSchedule {
  const normalizedToday = toDateOnly(today);
  const normalizedHorizon = toDateOnly(horizon);
  const normalizedStartDate = toDateOnly(startDate);
  const dueDates: Date[] = [];
  let nextDueDate: Date | null = normalizedStartDate;

  if (normalizedHorizon < normalizedToday) {
    return { dueDates, nextDueDate };
  }

  switch (recurrenceType) {
    case "NONE": {
      if (
        normalizedStartDate >= normalizedToday &&
        normalizedStartDate <= normalizedHorizon
      ) {
        dueDates.push(normalizedStartDate);
      }
      nextDueDate = dueDates.length > 0 ? null : normalizedStartDate;
      break;
    }
    case "DAILY": {
      let date = getIntervalAlignedDate(normalizedStartDate, normalizedToday, 1);
      while (date <= normalizedHorizon) {
        dueDates.push(date);
        date = addDays(date, 1);
      }
      nextDueDate = date;
      break;
    }
    case "EVERY_N_DAYS": {
      const interval =
        recurrenceInterval && recurrenceInterval > 0
          ? Math.floor(recurrenceInterval)
          : 1;
      let date = getIntervalAlignedDate(
        normalizedStartDate,
        normalizedToday,
        interval,
      );
      while (date <= normalizedHorizon) {
        dueDates.push(date);
        date = addDays(date, interval);
      }
      nextDueDate = date;
      break;
    }
    case "WEEKLY": {
      let date = getIntervalAlignedDate(normalizedStartDate, normalizedToday, 7);
      while (date <= normalizedHorizon) {
        dueDates.push(date);
        date = addDays(date, 7);
      }
      nextDueDate = date;
      break;
    }
    case "SPECIFIC_DAYS": {
      if (daysOfWeek.length === 0) break;

      let date =
        normalizedStartDate < normalizedToday
          ? normalizedToday
          : normalizedStartDate;
      while (date <= normalizedHorizon) {
        if (daysOfWeek.includes(getDay(date))) {
          dueDates.push(date);
        }
        date = addDays(date, 1);
      }
      nextDueDate =
        dueDates.length > 0
          ? getNextSpecificDayAfter(dueDates[dueDates.length - 1], daysOfWeek)
          : normalizedStartDate;
      break;
    }
  }

  return { dueDates, nextDueDate };
}
