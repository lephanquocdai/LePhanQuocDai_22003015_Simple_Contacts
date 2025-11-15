import * as SQLite from 'expo-sqlite';

// Mở hoặc tạo database
const db = SQLite.openDatabaseSync('contacts.db');

export interface Contact {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  favorite: number;
  created_at: number;
}

/**
 * Khởi tạo database và tạo bảng contacts nếu chưa tồn tại
 * Seed dữ liệu mẫu nếu bảng trống
 */
export const initDB = async (): Promise<void> => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        favorite INTEGER DEFAULT 0,
        created_at INTEGER
      );
    `);
    console.log('✅ Database initialized successfully');
    
    // Kiểm tra xem bảng có dữ liệu chưa
    const count = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM contacts'
    );
    
    // Nếu bảng trống, seed dữ liệu mẫu
    if (count && count.count === 0) {
      const sampleContacts = [
        { name: 'Nguyễn Văn A', phone: '0901234567', favorite: 1 },
        { name: 'Trần Thị B', phone: '0912345678', favorite: 0 },
        { name: 'Lê Văn C', phone: '0923456789', favorite: 1 },
      ];
      
      for (const contact of sampleContacts) {
        await db.runAsync(
          'INSERT INTO contacts (name, phone, favorite, created_at) VALUES (?, ?, ?, ?)',
          [contact.name, contact.phone, contact.favorite, Date.now()]
        );
      }
      console.log('✅ Sample contacts seeded successfully');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

/**
 * Lấy tất cả contacts
 */
export const getAllContacts = async (): Promise<Contact[]> => {
  try {
    const result = await db.getAllAsync<Contact>(
      'SELECT * FROM contacts ORDER BY created_at DESC'
    );
    return result || [];
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    return [];
  }
};

/**
 * Lấy contact theo ID
 */
export const getContactById = async (id: number): Promise<Contact | null> => {
  try {
    const result = await db.getFirstAsync<Contact>(
      'SELECT * FROM contacts WHERE id = ?',
      [id]
    );
    return result || null;
  } catch (error) {
    console.error('❌ Error fetching contact:', error);
    return null;
  }
};

/**
 * Thêm contact mới
 */
export const addContact = async (
  name: string,
  phone?: string,
  email?: string
): Promise<number | null> => {
  try {
    const result = await db.runAsync(
      'INSERT INTO contacts (name, phone, email, favorite, created_at) VALUES (?, ?, ?, ?, ?)',
      [name, phone || null, email || null, 0, Date.now()]
    );
    console.log('✅ Contact added:', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('❌ Error adding contact:', error);
    return null;
  }
};

/**
 * Cập nhật contact
 */
export const updateContact = async (
  id: number,
  name: string,
  phone?: string,
  email?: string
): Promise<boolean> => {
  try {
    await db.runAsync(
      'UPDATE contacts SET name = ?, phone = ?, email = ? WHERE id = ?',
      [name, phone || null, email || null, id]
    );
    console.log('✅ Contact updated:', id);
    return true;
  } catch (error) {
    console.error('❌ Error updating contact:', error);
    return false;
  }
};

/**
 * Xóa contact
 */
export const deleteContact = async (id: number): Promise<boolean> => {
  try {
    await db.runAsync('DELETE FROM contacts WHERE id = ?', [id]);
    console.log('✅ Contact deleted:', id);
    return true;
  } catch (error) {
    console.error('❌ Error deleting contact:', error);
    return false;
  }
};

/**
 * Toggle favorite status của contact
 */
export const toggleFavorite = async (id: number): Promise<boolean> => {
  try {
    const contact = await getContactById(id);
    if (!contact) return false;
    
    await db.runAsync(
      'UPDATE contacts SET favorite = ? WHERE id = ?',
      [contact.favorite === 1 ? 0 : 1, id]
    );
    console.log('✅ Favorite toggled:', id);
    return true;
  } catch (error) {
    console.error('❌ Error toggling favorite:', error);
    return false;
  }
};

/**
 * Xóa tất cả contacts (for testing)
 */
export const clearAllContacts = async (): Promise<boolean> => {
  try {
    await db.runAsync('DELETE FROM contacts');
    console.log('✅ All contacts cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing contacts:', error);
    return false;
  }
};

export default db;
