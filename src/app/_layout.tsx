import "../global.css";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { initDB } from "../db";

export default function Layout() {
  useEffect(() => {
    // Khởi tạo database khi app load
    initDB().catch((error) => {
      console.error("Failed to initialize database:", error);
    });
  }, []);

  return <Slot />;
}
