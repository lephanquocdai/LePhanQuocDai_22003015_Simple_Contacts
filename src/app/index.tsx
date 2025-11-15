import React, { useEffect, useState, useCallback } from "react";
import { Text, View, FlatList, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Contact } from "../db";
import { useContacts } from "../hooks/useContacts";

export default function Page() {
  const {
    contacts,
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
  } = useContacts();

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [editFormData, setEditFormData] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [editErrors, setEditErrors] = useState<{ name?: string; email?: string }>({});

  // MockAPI URL - bạn có thể thay đổi URL này
  const MOCKAPI_URL = "https://67da1f0735c87309f52b0841.mockapi.io/contacts";

  const handleImportFromAPI = useCallback(async () => {
    const result = await importFromAPI(MOCKAPI_URL);
    
    if (result.success) {
      Alert.alert(
        "Import thành công",
        `Đã import ${result.imported} liên hệ.\n${result.skipped > 0 ? `Bỏ qua ${result.skipped} liên hệ trùng lặp.` : ""}`
      );
    } else {
      Alert.alert(
        "Import thất bại",
        result.error || "Không thể import liên hệ từ API."
      );
    }
  }, [importFromAPI]);

  useEffect(() => {
    load();
  }, [load]);


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

  const handleSubmit = useCallback(async () => {
    if (!validateForm(formData, false)) {
      return;
    }

    try {
      const result = await insert(
        formData.name.trim(),
        formData.phone.trim() || undefined,
        formData.email.trim() || undefined
      );

      if (result) {
        setModalVisible(false);
        setFormData({ name: "", phone: "", email: "" });
        setErrors({});
      } else {
        Alert.alert("Lỗi", "Không thể thêm liên hệ. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi thêm liên hệ.");
    }
  }, [formData, insert]);

  const handleEditSubmit = useCallback(async () => {
    if (!editingContact) return;
    
    if (!validateForm(editFormData, true)) {
      return;
    }

    try {
      const success = await update(
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
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật liên hệ. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi cập nhật liên hệ.");
    }
  }, [editingContact, editFormData, update]);

  const handleOpenEdit = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setEditFormData({
      name: contact.name,
      phone: contact.phone || "",
      email: contact.email || "",
    });
    setEditErrors({});
    setEditModalVisible(true);
  }, []);

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

  const handleToggleFavorite = useCallback(async (id: number) => {
    try {
      const success = await toggle(id);
      if (!success) {
        Alert.alert("Lỗi", "Không thể cập nhật yêu thích. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi cập nhật yêu thích.");
    }
  }, [toggle]);

  const handleDeleteContact = useCallback((contact: Contact) => {
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
              const success = await remove(contact.id);
              if (!success) {
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
  }, [remove]);

  const renderContactItem = useCallback(({ item }: { item: Contact }) => {
    const isFavorite = item.favorite === 1;
    return (
      <View
        className={`flex-row items-center justify-between px-4 py-3 border-b ${
          isFavorite
            ? "bg-yellow-50 border-yellow-200"
            : "bg-white border-gray-200"
        }`}
      >
        <View className="flex-1 flex-row items-center">
          {isFavorite && (
            <Text className="text-yellow-500 text-xl mr-2">★</Text>
          )}
          <View className="flex-1">
            <Text
              className={`text-lg font-semibold ${
                isFavorite ? "text-yellow-900" : "text-gray-900"
              }`}
            >
              {item.name}
            </Text>
            {item.phone && (
              <Text
                className={`text-sm mt-1 ${
                  isFavorite ? "text-yellow-700" : "text-gray-600"
                }`}
              >
                {item.phone}
              </Text>
            )}
          </View>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => handleOpenEdit(item)}
            className="mr-2 px-3 py-1 bg-blue-500 rounded"
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-medium">Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteContact(item)}
            className="mr-2 px-3 py-1 bg-red-500 rounded"
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-medium">Xóa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleToggleFavorite(item.id)}
            className="ml-2 p-2"
            activeOpacity={0.7}
          >
            <Text className="text-yellow-500 text-2xl">
              {isFavorite ? "★" : "☆"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleOpenEdit, handleDeleteContact, handleToggleFavorite]);

  return (
    <View className="flex flex-1 bg-white">
      <Header
        onAddPress={() => setModalVisible(true)}
        onImportPress={handleImportFromAPI}
        importLoading={importLoading}
      />
      {importError && (
        <View className="px-4 py-2 bg-red-50 border-b border-red-200">
          <Text className="text-red-600 text-sm">
            Lỗi import: {importError}
          </Text>
        </View>
      )}
      
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
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-6xl mb-4">📇</Text>
            <Text className="text-xl font-semibold text-gray-800 mb-2 text-center">
              {contacts.length === 0
                ? "Chưa có liên hệ nào"
                : "Không tìm thấy liên hệ nào"}
            </Text>
            <Text className="text-gray-500 text-center mb-4">
              {contacts.length === 0
                ? "Nhấn nút + ở trên để thêm liên hệ mới"
                : "Thử thay đổi từ khóa tìm kiếm hoặc tắt bộ lọc"}
            </Text>
            {(searchText.trim() || showFavoritesOnly) && (
              <TouchableOpacity
                onPress={() => {
                  setSearchText("");
                  setShowFavoritesOnly(false);
                }}
                className="mt-2 px-4 py-2 bg-blue-500 rounded-lg"
              >
                <Text className="text-white font-medium">Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
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

function Header({
  onAddPress,
  onImportPress,
  importLoading,
}: {
  onAddPress: () => void;
  onImportPress: () => void;
  importLoading: boolean;
}) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }} className="bg-white border-b border-gray-200">
      <View className="px-4 lg:px-6 h-14 flex items-center flex-row justify-between">
        <Text className="font-bold text-xl text-gray-900">Danh sách liên hệ</Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={onImportPress}
            disabled={importLoading}
            className={`px-3 py-1.5 rounded-lg ${
              importLoading ? "bg-gray-400" : "bg-green-500"
            }`}
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-medium">
              {importLoading ? "Đang import..." : "Import từ API"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAddPress}
            className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
          >
            <Text className="text-white text-2xl font-bold">+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
