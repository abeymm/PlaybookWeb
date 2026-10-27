"use client";

/**
 * Page-wide state for /book: the course picked in the hero drives the buy link, the price and the
 * sticky buy bar on phones. Everything else is static copy.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  BOOK_SHOP,
  DEFAULT_COURSE_ID,
  buyUrlFor,
  courseById,
  priceFor,
  purchasableCourses,
  type LaunchCourse,
  type ShopSettings,
} from "@/lib/book/catalog";

export type BookStore = {
  courses: readonly LaunchCourse[];
  course: LaunchCourse;
  selectCourse: (id: string) => void;
  buyUrl: string;
  price: string;
  shop: ShopSettings;
};

const BookStoreContext = createContext<BookStore | null>(null);

export function BookStoreProvider({ children }: { children: ReactNode }) {
  const [courseId, setCourseId] = useState(DEFAULT_COURSE_ID);
  const value = useMemo<BookStore>(() => {
    const course = courseById(courseId);
    return {
      courses: purchasableCourses(),
      course,
      selectCourse: setCourseId,
      buyUrl: buyUrlFor(course),
      price: priceFor(course),
      shop: BOOK_SHOP,
    };
  }, [courseId]);
  return <BookStoreContext.Provider value={value}>{children}</BookStoreContext.Provider>;
}

export function useBookStore(): BookStore {
  const store = useContext(BookStoreContext);
  if (!store) throw new Error("useBookStore must be used inside BookStoreProvider");
  return store;
}
