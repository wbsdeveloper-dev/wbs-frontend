"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for managing modal state
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}

/**
 * Custom hook for consistent date formatting
 */
export function useDateFormat(locale = "id-ID") {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formatDate = (date: Date) => formatter.format(date);
  const formattedToday = formatter.format(new Date());

  return { formatDate, formattedToday };
}
