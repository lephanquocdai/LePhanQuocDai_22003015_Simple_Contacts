import React, { useEffect, useState } from "react";
import { Text, View, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAllContacts, Contact } from "../db";

export default function Page() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

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
      <Header />
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Đang tải...</Text>
          </View>
        ) : contacts.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Chưa có liên hệ nào</Text>
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
    </View>
  );
}

function Header() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }} className="bg-white border-b border-gray-200">
      <View className="px-4 lg:px-6 h-14 flex items-center flex-row justify-between">
        <Text className="font-bold text-xl text-gray-900">Danh sách liên hệ</Text>
      </View>
    </View>
  );
}
