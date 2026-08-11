import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getArticleById } from "../services/bloggerApi";
import RenderHtml from "react-native-render-html";

const { width } = Dimensions.get("window");

const cleanHtml = (html: string) => {
  if (!html) return "";
  return html
    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/gi, "")
    // Remove paragraphs with only br or nbsp
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, "")
    .replace(/<p>\s*&nbsp;\s*<\/p>/gi, "")
    // Unwrap paragraphs inside list items to prevent double margins
    .replace(/<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/gi, "<li>$1</li>")
    // Remove standalone br tags at the start/end of div or container tags
    .replace(/(<div>|<div\s+[^>]*>)\s*<br\s*\/?>/gi, "$1")
    .replace(/<br\s*\/?>\s*(<\/div>)/gi, "$1")
    // Remove standalone br tags before or after major block elements
    .replace(/<br\s*\/?>\s*(<p|<div|<h)/gi, "$1")
    .replace(/(<\/p>|<\/div>|<\/h\d>)\s*<br\s*\/?>/gi, "$1")
    // Remove multiple consecutive br tags
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br />")
    .trim();
};

const baseStyle = {
  fontFamily: "Inter",
  fontSize: 15,
  lineHeight: 24,
  color: "#3B4450",
} as const;

const tagsStyles = {
  body: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 24,
    color: "#3B4450",
  },
  p: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 24,
    color: "#3B4450",
    marginBottom: 16,
  },
  h1: {
    fontFamily: "Inter-Bold",
    fontSize: 22,
    color: "#171717",
    marginTop: 0,
    marginBottom: 8,
    lineHeight: 28,
  },
  h2: {
    fontFamily: "Inter-Bold",
    fontSize: 20,
    color: "#171717",
    marginTop: 0,
    marginBottom: 8,
    lineHeight: 26,
  },
  h3: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
    color: "#171717",
    marginTop: 0,
    marginBottom: 8,
    lineHeight: 24,
  },
  h4: {
    fontFamily: "Inter-Bold",
    fontSize: 16,
    color: "#171717",
    marginTop: 0,
    marginBottom: 6,
    lineHeight: 22,
  },
  h5: {
    fontFamily: "Inter-Bold",
    fontSize: 14,
    color: "#171717",
    marginTop: 0,
    marginBottom: 6,
    lineHeight: 20,
  },
  h6: {
    fontFamily: "Inter-Bold",
    fontSize: 12,
    color: "#171717",
    marginTop: 0,
    marginBottom: 4,
    lineHeight: 18,
  },
  strong: {
    fontFamily: "Inter-Bold",
    color: "#171717",
  },
  b: {
    fontFamily: "Inter-Bold",
    color: "#171717",
  },
  i: {
    fontFamily: "Inter",
    fontStyle: "italic" as const,
  },
  em: {
    fontFamily: "Inter",
    fontStyle: "italic" as const,
  },
  span: {
    fontFamily: "Inter",
  },
  div: {
    fontFamily: "Inter",
  },
  ul: {
    marginTop: 8,
    marginBottom: 16,
    paddingLeft: 20,
    listStyleType: "disc" as const,
  },
  ol: {
    marginTop: 8,
    marginBottom: 16,
    paddingLeft: 20,
    listStyleType: "decimal" as const,
  },
  li: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 24,
    color: "#3B4450",
    marginBottom: 8,
  },
  img: {
    alignSelf: "center",
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  a: {
    color: "#0E97F0",
    textDecorationLine: "underline" as const,
  },
} as const;

export default function ArticleDetailScreen() {
  const { id, imageIndex, image } = useLocalSearchParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fallbackImage = require("../assets/images/ArticleBackground.png");

  const coverImageSource = image
    ? { uri: decodeURIComponent(image as string) }
    : fallbackImage;

  useEffect(() => {
    const fetchSingleArticle = async () => {
      try {
        if (id) {
          const data = await getArticleById(id as string);
          setArticle(data);
        }
      } catch (error) {
        console.log("Failed to load article:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSingleArticle();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E97F0" />
        <Text style={styles.loadingText}>Loading article...</Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Oops! We couldn't find that article.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>
            {article.title?.replace(/<[^>]+>/g, "")}
          </Text>

          {/* Meta */}
          <Text style={styles.meta}>
            {article.author?.displayName || "Admin"} •{" "}
            {article.published
              ? new Date(article.published).toLocaleDateString("en-US", {
                  month: "long",
                  day: "2-digit",
                  year: "numeric",
                })
              : ""}
          </Text>

          {/* Cover image (only if not already embedded in HTML content) */}
          {coverImageSource && !/<img[^>]+/i.test(article.content || "") ? (
            <Image source={coverImageSource} style={styles.coverInContent} />
          ) : null}

          {/* HTML Content */}
          <RenderHtml
            contentWidth={width - 40}
            source={{ html: cleanHtml(article.content || "") }}
            baseStyle={baseStyle}
            tagsStyles={tagsStyles}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  backButton: {
    paddingVertical: 10,
  },

  backText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 16,
    color: "#0E97F0",
  },

  cover: {
    width: "100%",
    height: 220,
  },

  coverInContent: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 20,
  },

  content: {
    padding: 20,
  },

  title: {
    fontFamily: "Inter-Bold",
    fontSize: 24,
    color: "#171717",
    marginBottom: 8,
    lineHeight: 32,
  },

  meta: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#8A95A3",
    marginBottom: 20,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontFamily: "Inter",
    marginTop: 12,
    color: "#646B75",
    fontSize: 14,
  },

  errorText: {
    fontFamily: "Inter",
    fontSize: 16,
    color: "#C64545",
  },
});