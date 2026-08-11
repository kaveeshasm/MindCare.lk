import { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getArticles } from "../services/bloggerApi";
import { router } from "expo-router";

type ReadCard = {
  id: string;
  category: string;
  title: string;
  author: string;
  minutes: string;
  image: any;
  imageIndex: number;
  remoteImageUrl?: string;
};

const extractArticleImage = (item: any) => {
  if (item.images && item.images[0]?.url) {
    return item.images[0].url;
  }
  const match = item.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

export default function ArticlesScreen() {
  const [articles, setArticles] = useState<ReadCard[]>([]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fallbackImage = require("../assets/images/ArticleBackground.png");

  const fetchArticles = async () => {
    try {
      const data = await getArticles();
      const articlesArray = Array.isArray(data) ? data : data?.items || [];

      const formatted: ReadCard[] = articlesArray.map((item: any) => {
        const bloggerImage = extractArticleImage(item);
        return {
          id: item.id,
          category: "BLOG",
          title: item.title ? item.title.replace(/<[^>]+>/g, "") : "Untitled",
          author: item.author?.displayName || "Admin",
          minutes: "5 min read",
          image: bloggerImage ? { uri: bloggerImage } : fallbackImage,
          imageIndex: -1,
          remoteImageUrl: bloggerImage || undefined,
        };
      });

      setArticles(formatted);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>All Articles</Text>

      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              if (item.remoteImageUrl) {
                router.push(`/article-detail?id=${item.id}&image=${encodeURIComponent(item.remoteImageUrl)}` as any);
              } else {
                router.push(`/article-detail?id=${item.id}&imageIndex=${item.imageIndex}` as any);
              }
            }}
          >
            <Image source={item.image} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.author}>{item.author}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    fontSize: 22,
    fontWeight: "800",
    padding: 15,
  },
  card: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
    padding: 10,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  author: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});