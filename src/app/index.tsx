import React, { useEffect, useState } from "react";
import { Text, View, FlatList, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAllContacts, Contact, addContact } from "../db";

export default function Page() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await getAllContacts();
      setContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; email?: string } = {};
    
    // Validate name: bắt buộc
    if (!formData.name.trim()) {
      newErrors.name = "Tên không được để trống";
    }
    
    // Validate email: nếu có thì phải có @
    if (formData.email.trim() && !formData.email.includes("@")) {
      newErrors.email = "Email phải chứa ký tự @";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
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

  const handleCloseModal = () => {
    setModalVisible(false);
    setFormData({ name: "", phone: "", email: "" });
    setErrors({});
  };

  const renderContactItem = ({ item }: { item: Contact }) => {
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
        {item.favorite === 1 && (
          <Text className="text-yellow-500 text-xl ml-2">⭐</Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex flex-1 bg-white">
      <Header onAddPress={() => setModalVisible(true)} />
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Đang tải...</Text>
          </View>
        ) : contacts.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Chưa có liên hệ nào.</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
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
