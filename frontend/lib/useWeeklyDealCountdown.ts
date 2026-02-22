"use client";

import { useEffect, useState } from "react";

type WeeklyDealValues = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const PLACEHOLDER_VALUES: WeeklyDealValues = {
  days: "--",
  hours: "--",
  minutes: "--",
  seconds: "--",
};

function pad(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

export function getWeeklyDealEndDate(now = new Date()) {
  const current = new Date(now);
  const day = current.getDay();
  const daysUntilSunday = (7 - day) % 7;

  const end = new Date(current);
  end.setDate(current.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);

  if (end.getTime() <= current.getTime()) {
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
  }

  return end;
}

export function getWeeklyDealCountdownValues(now = Date.now()): WeeklyDealValues {
  const current = new Date(now);
  const end = getWeeklyDealEndDate(current);
  const diffMs = Math.max(0, end.getTime() - current.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

export function useWeeklyDealCountdown() {
  const [values, setValues] = useState<WeeklyDealValues>(PLACEHOLDER_VALUES);

  useEffect(() => {
    const updateValues = () => {
      setValues(getWeeklyDealCountdownValues(Date.now()));
    };

    const timeoutId = window.setTimeout(updateValues, 0);
    const intervalId = window.setInterval(updateValues, 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  const mounted = values.days !== "--";

  return {
    days: values.days,
    hours: values.hours,
    minutes: values.minutes,
    seconds: values.seconds,
    mounted,
  };
}
