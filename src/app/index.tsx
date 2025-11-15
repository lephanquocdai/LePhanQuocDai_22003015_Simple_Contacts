import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Text, View, FlatList, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAllContacts, Contact, addContact, toggleFavorite, updateContact, deleteContact } from "../db";

export default function Page() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [editFormData, setEditFormData] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [editErrors, setEditErrors] = useState<{ name?: string; email?: string }>({});
  const [searchText, setSearchText] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const data = await getAllContacts();
      setContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Filter contacts dựa trên search text và favorite filter
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


  const validateForm = (data: { name: string; email: string }, isEdit: boolean = false): boolean => {
    const newErrors: { name?: string; email?: string } = {};
    
    // Validate name: bắt buộc
    if (!data.name.trim()) {
      newErrors.name = "Tên không được để trống";
    }
    
    // Validate email: nếu có thì phải có @
    if (data.email.trim() && !data.email.includes("@")) {
      newErrors.email = "Email phải chứa ký tự @";
    }
    
    if (isEdit) {
      setEditErrors(newErrors);
    } else {
      setErrors(newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm(formData, false)) {
      return;
    }

    try {
      const result = await addContact(
        formData.name.trim(),
        formData.phone.trim() || undefined,
        formData.email.trim() || undefined
      );

      if (result) {
        setModalVisible(false);
        setFormData({ name: "", phone: "", email: "" });
        setErrors({});
        await loadContacts(); // Refresh danh sách
      } else {
        Alert.alert("Lỗi", "Không thể thêm liên hệ. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi thêm liên hệ.");
    }
  };

  const handleEditSubmit = async () => {
    if (!editingContact) return;
    
    if (!validateForm(editFormData, true)) {
      return;
    }

    try {
      const success = await updateContact(
        editingContact.id,
        editFormData.name.trim(),
        editFormData.phone.trim() || undefined,
        editFormData.email.trim() || undefined
      );

      if (success) {
        setEditModalVisible(false);
        setEditingContact(null);
        setEditFormData({ name: "", phone: "", email: "" });
        setEditErrors({});
        await loadContacts(); // Refresh danh sách
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật liên hệ. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi cập nhật liên hệ.");
    }
  };

  const handleOpenEdit = (contact: Contact) => {
    setEditingContact(contact);
    setEditFormData({
      name: contact.name,
      phone: contact.phone || "",
      email: contact.email || "",
    });
    setEditErrors({});
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingContact(null);
    setEditFormData({ name: "", phone: "", email: "" });
    setEditErrors({});
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setFormData({ name: "", phone: "", email: "" });
    setErrors({});
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      const success = await toggleFavorite(id);
      if (success) {
        await loadContacts(); // Refresh danh sách
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật yêu thích. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi cập nhật yêu thích.");
    }
  };

  const handleDeleteContact = (contact: Contact) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa liên hệ "${contact.name}"?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteContact(contact.id);
              if (success) {
                await loadContacts(); // Refresh danh sách
              } else {
                Alert.alert("Lỗi", "Không thể xóa liên hệ. Vui lòng thử lại.");
              }
            } catch (error) {
              console.error("Error deleting contact:", error);
              Alert.alert("Lỗi", "Đã xảy ra lỗi khi xóa liên hệ.");
            }
          },
        },
      ]
    );
  };

  const handleOpenEditCallback = useCallback((contact: Contact) => {
    handleOpenEdit(contact);
  }, []);

  const handleDeleteContactCallback = useCallback((contact: Contact) => {
    handleDeleteContact(contact);
  }, []);

  const handleToggleFavoriteCallback = useCallback((id: number) => {
    handleToggleFavorite(id);
  }, []);

  const renderContactItem = useCallback(({ item }: { item: Contact }) => {
    return (
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {item.name}
          </Text>
          {item.phone && (
            <Text className="text-sm text-gray-600 mt-1">{item.phone}</Text>
          )}
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => handleOpenEditCallback(item)}
            className="mr-2 px-3 py-1 bg-blue-500 rounded"
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-medium">Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteContactCallback(item)}
            className="mr-2 px-3 py-1 bg-red-500 rounded"
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-medium">Xóa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleToggleFavoriteCallback(item.id)}
            className="ml-2 p-2"
            activeOpacity={0.7}
          >
            <Text className="text-yellow-500 text-2xl">
              {item.favorite === 1 ? "★" : "☆"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleOpenEditCallback, handleDeleteContactCallback, handleToggleFavoriteCallback]);

  return (
    <View className="flex flex-1 bg-white">
      <Header onAddPress={() => setModalVisible(true)} />
      
      {/* Search Bar và Filter */}
      <View className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <View className="mb-2">
          <Text className="text-gray-700 mb-2 font-medium">Tìm kiếm:</Text>
          <View className="flex-row items-center">
            <View className="flex-1 mr-2">
              <TextInput
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-base"
                placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2 rounded-lg ${
                showFavoritesOnly ? "bg-yellow-500" : "bg-gray-300"
              }`}
              activeOpacity={0.7}
            >
              <Text className={`text-sm font-medium ${
                showFavoritesOnly ? "text-white" : "text-gray-700"
              }`}>
                ★
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {(searchText.trim() || showFavoritesOnly) && (
          <TouchableOpacity
            onPress={() => {
              setSearchText("");
              setShowFavoritesOnly(false);
            }}
            className="self-start"
          >
            <Text className="text-blue-500 text-sm">Xóa bộ lọc</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Đang tải...</Text>
          </View>
        ) : filteredContacts.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">
              {contacts.length === 0
                ? "Chưa có liên hệ nào."
                : "Không tìm thấy liên hệ nào."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderContactItem}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleCloseModal}
            className="flex-1 bg-black/50 justify-end"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl"
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24 }}
              >
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-2xl font-bold text-gray-900">Thêm liên hệ mới</Text>
                  <TouchableOpacity onPress={handleCloseModal}>
                    <Text className="text-gray-500 text-lg">✕</Text>
                  </TouchableOpacity>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 font-medium">
                    Tên <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder="Nhập tên"
                    value={formData.name}
                    onChangeText={(text) => {
                      setFormData({ ...formData, name: text });
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                  />
                  {errors.name && (
                    <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
                  )}
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 font-medium">Số điện thoại</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder="Nhập số điện thoại"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    keyboardType="phone-pad"
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-gray-700 mb-2 font-medium">Email</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder="Nhập email"
                    value={formData.email}
                    onChangeText={(text) => {
                      setFormData({ ...formData, email: text });
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email && (
                    <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
                  )}
                </View>

                <TouchableOpacity
                  className="bg-blue-500 rounded-lg py-3 items-center"
                  onPress={handleSubmit}
                >
                  <Text className="text-white font-semibold text-base">Lưu</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseEditModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleCloseEditModal}
            className="flex-1 bg-black/50 justify-end"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl"
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24 }}
              >
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-2xl font-bold text-gray-900">Sửa liên hệ</Text>
                  <TouchableOpacity onPress={handleCloseEditModal}>
                    <Text className="text-gray-500 text-lg">✕</Text>
                  </TouchableOpacity>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 font-medium">
                    Tên <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder="Nhập tên"
                    value={editFormData.name}
                    onChangeText={(text) => {
                      setEditFormData({ ...editFormData, name: text });
                      if (editErrors.name) setEditErrors({ ...editErrors, name: undefined });
                    }}
                  />
                  {editErrors.name && (
                    <Text className="text-red-500 text-sm mt-1">{editErrors.name}</Text>
                  )}
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 font-medium">Số điện thoại</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder="Nhập số điện thoại"
                    value={editFormData.phone}
                    onChangeText={(text) => setEditFormData({ ...editFormData, phone: text })}
                    keyboardType="phone-pad"
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-gray-700 mb-2 font-medium">Email</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder="Nhập email"
                    value={editFormData.email}
                    onChangeText={(text) => {
                      setEditFormData({ ...editFormData, email: text });
                      if (editErrors.email) setEditErrors({ ...editErrors, email: undefined });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {editErrors.email && (
                    <Text className="text-red-500 text-sm mt-1">{editErrors.email}</Text>
                  )}
                </View>

                <TouchableOpacity
                  className="bg-blue-500 rounded-lg py-3 items-center"
                  onPress={handleEditSubmit}
                >
                  <Text className="text-white font-semibold text-base">Cập nhật</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Header({ onAddPress }: { onAddPress: () => void }) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }} className="bg-white border-b border-gray-200">
      <View className="px-4 lg:px-6 h-14 flex items-center flex-row justify-between">
        <Text className="font-bold text-xl text-gray-900">Danh sách liên hệ</Text>
        <TouchableOpacity
          onPress={onAddPress}
          className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
        >
          <Text className="text-white text-2xl font-bold">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
