import { useState, useCallback, useMemo } from "react";
import {
  getAllContacts,
  Contact,
  addContact,
  updateContact,
  deleteContact,
  toggleFavorite,
} from "../db";

interface ApiContact {
  name: string;
  phone?: string;
  email?: string;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load contacts
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllContacts();
      setContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Insert contact
  const insert = useCallback(
    async (name: string, phone?: string, email?: string) => {
      try {
        const result = await addContact(name, phone, email);
        if (result) {
          await load();
          return result;
        }
        return null;
      } catch (error) {
        console.error("Error inserting contact:", error);
        throw error;
      }
    },
    [load]
  );

  // Update contact
  const update = useCallback(
    async (id: number, name: string, phone?: string, email?: string) => {
      try {
        const success = await updateContact(id, name, phone, email);
        if (success) {
          await load();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating contact:", error);
        throw error;
      }
    },
    [load]
  );

  // Delete contact
  const remove = useCallback(
    async (id: number) => {
      try {
        const success = await deleteContact(id);
        if (success) {
          await load();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error deleting contact:", error);
        throw error;
      }
    },
    [load]
  );

  // Toggle favorite
  const toggle = useCallback(
    async (id: number) => {
      try {
        const success = await toggleFavorite(id);
        if (success) {
          await load();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error toggling favorite:", error);
        throw error;
      }
    },
    [load]
  );

  // Import contacts from API
  const importFromAPI = useCallback(
    async (apiUrl: string) => {
      try {
        setImportLoading(true);
        setImportError(null);

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiData: ApiContact[] = await response.json();

        // Map và filter dữ liệu
        const existingPhones = new Set(
          contacts.map((c) => c.phone?.toLowerCase().trim()).filter(Boolean)
        );

        let importedCount = 0;
        let skippedCount = 0;

        for (const item of apiData) {
          // Map dữ liệu: name → name, phone → phone, email → email
          const name = item.name?.trim();
          const phone = item.phone?.trim();
          const email = item.email?.trim();

          // Kiểm tra name bắt buộc
          if (!name) {
            skippedCount++;
            continue;
          }

          // Kiểm tra trùng lặp theo phone (nếu có phone)
          if (phone) {
            const phoneLower = phone.toLowerCase();
            if (existingPhones.has(phoneLower)) {
              skippedCount++;
              continue;
            }
            existingPhones.add(phoneLower);
          }

          // Insert contact
          const result = await addContact(name, phone || undefined, email || undefined);
          if (result) {
            importedCount++;
          } else {
            skippedCount++;
          }
        }

        // Reload contacts sau khi import
        await load();

        // Clear error nếu import thành công
        setImportError(null);

        return {
          success: true,
          imported: importedCount,
          skipped: skippedCount,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Lỗi không xác định";
        setImportError(errorMessage);
        console.error("Error importing contacts:", error);
        return {
          success: false,
          imported: 0,
          skipped: 0,
          error: errorMessage,
        };
      } finally {
        setImportLoading(false);
      }
    },
    [contacts, load]
  );

  // Search contacts (client-side filtering)
  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Filter theo favorite nếu bật
    if (showFavoritesOnly) {
      filtered = filtered.filter((contact) => contact.favorite === 1);
    }

    // Filter theo search text (name hoặc phone)
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter((contact) => {
        const nameMatch = contact.name.toLowerCase().includes(searchLower);
        const phoneMatch = contact.phone?.toLowerCase().includes(searchLower) || false;
        return nameMatch || phoneMatch;
      });
    }

    return filtered;
  }, [contacts, searchText, showFavoritesOnly]);

  return {
    contacts, // Export để có thể check empty state
    filteredContacts,
    loading,
    importLoading,
    importError,
    searchText,
    setSearchText,
    showFavoritesOnly,
    setShowFavoritesOnly,
    load,
    insert,
    update,
    remove,
    toggle,
    importFromAPI,
  };
};

