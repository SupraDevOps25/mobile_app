import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CARE_TAGS,
  FEATURES,
  SCHEDULE_PROTECTIONS,
  SCHEDULE_TAGS,
} from "@/constants/onboarding";

// ─── Constants ────────────────────────────────────────────────────────────────

const CTA_LABELS = ["Get Started", "Next", "Next", "Let's Go"] as const;
const SLIDES = CTA_LABELS.map((_, index) => index);
const LAST_SLIDE_INDEX = CTA_LABELS.length - 1;

// Dynamic bg kept in style (not className) to avoid NativeWind variable warning.
const SLIDE_BTN_BG = ["#2563eb", "#1e3a8a", "#1e3a8a", "#1e3a8a"] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavSlideProps {
  onBack: () => void;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const [slide, setSlide] = useState(0);
  const router = useRouter();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();

  const isNavy = slide === 0;

  async function handleNext() {
    if (slide < LAST_SLIDE_INDEX) {
      setSlide((s) => s + 1);
      return;
    }
    try {
      await AsyncStorage.setItem("onboarding_seen", "true");
    } catch {
      // non-critical — proceed regardless
    }
    router.replace("/sign-up" as any);
  }

  function handleBack() {
    setSlide((s) => Math.max(0, s - 1));
  }

  return (
    <View
      className="flex-1"
      style={{
        // Dynamic bg in style to avoid NativeWind className-change warning
        backgroundColor: isNavy ? "#1e3a8a" : "#ffffff",
        paddingTop: topInset,
        paddingBottom: bottomInset,
      }}
    >
      <StatusBar style={isNavy ? "light" : "dark"} />

      {/*
       * ALL SLIDES ARE ALWAYS MOUNTED.
       *
       * Conditional rendering ({slide === N && <Slide />}) causes expo-image to
       * decode the photo from scratch each time the slide mounts, producing a
       * visible flash. By keeping all slides in the tree from the start, images
       * are decoded once on screen mount and appear instantly on navigation.
       *
       * Visibility is controlled with opacity + pointerEvents, not mount/unmount.
       */}
      <View style={{ flex: 1 }}>

        {/* ── Slide 0: intro (navy) ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
          pointerEvents={slide === 0 ? "auto" : "none"}
        >
          <SlideIntro />
          <View className="h-4" />
        </ScrollView>

        {/* ── Slide 1: care types (white + photo) ── */}
        <View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: slide === 1 ? 1 : 0,
          }}
          pointerEvents={slide === 1 ? "auto" : "none"}
        >
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <SlideCareTypes
              onBack={handleBack}
              onNext={() => void handleNext()}
            />
            <View className="h-4" />
          </ScrollView>
        </View>

        {/* ── Slide 2: features (white + photo) ── */}
        <View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: slide === 2 ? 1 : 0,
          }}
          pointerEvents={slide === 2 ? "auto" : "none"}
        >
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <SlideFeatures
              onBack={handleBack}
              onNext={() => void handleNext()}
            />
            <View className="h-4" />
          </ScrollView>
        </View>

        <View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: slide === 3 ? 1 : 0,
          }}
          pointerEvents={slide === 3 ? "auto" : "none"}
        >
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <SlideSubscriptionSchedule onBack={handleBack} />
            <View className="h-4" />
          </ScrollView>
        </View>

      </View>

      {/* ── Pagination dots + CTA ── */}
      <View className="px-6 pb-6">
        <View className="flex-row justify-center items-center gap-2 mb-5">
          {SLIDES.map((i) => (
            <View
              key={i}
              className="h-2 rounded-full"
              style={{
                width: i === slide ? 24 : 8,
                backgroundColor: isNavy
                  ? i === slide
                    ? "#ffffff"
                    : "rgba(255,255,255,0.35)"
                  : i === slide
                    ? "#1e3a8a"
                    : "#d1d5db",
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={() => void handleNext()}
          className="rounded-full py-4 items-center"
          style={{ backgroundColor: SLIDE_BTN_BG[slide] }}
        >
          <Text className="text-white font-semibold text-base">
            {CTA_LABELS[slide]}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Slide 0: intro (navy background) ────────────────────────────────────────

function SlideIntro() {
  return (
    <View className="items-center pt-8">
      <Image
        source={require("../assets/images/icon-white.png")}
        className="w-28 h-28"
        resizeMode="contain"
      />
      <Text className="text-white/65 text-[14px] mt-1">
        Above and Beyond Care
      </Text>

      <View className="flex-row items-center mt-6 mb-8 px-8 py-2 rounded-full border border-white/30 bg-white/10">
        <View className="w-2 h-2 rounded-full bg-green-400 mr-2" />
        <Text className="text-white text-[14px]">Your Trusted Care Platform </Text>
      </View>

      <Text className="mt-10 text-white text-[20px] font-bold text-center leading-6 tracking-wide">
        Reliable home care for your loved ones, anytime you need it.
      </Text>
      <Text className="text-white/65 text-[14px] text-center mt-6 leading-6 tracking-wide">
        Book trained caregivers and nurses in real time with ease and confidence by subscribing to a monthly care plan that fits your family&apos;s needs.
      </Text>
    </View>
  );
}

// ─── Slide 1: care types (white background + photo) ──────────────────────────

function SlideCareTypes({
  onBack,
  onNext,
}: NavSlideProps & { onNext: () => void }) {
  return (
    <View className="bg-background">
      <View className="relative" style={{ height: 390 }}>
        <ExpoImage
          source={require("../assets/images/slide2.png")}
          style={{ width: "100%", height: 390 }}
          contentFit="cover"
          contentPosition="top"
        />

        {/* 24/7 Available badge */}
        <View
          className="absolute flex-row items-center bg-white rounded-full px-3 py-1.5"
          style={{
            top: 14,
            left: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
          <Text className="text-xs font-semibold text-brand">24/7 Available</Text>
        </View>

        <NavArrow direction="left" onPress={onBack} />
        <NavArrow direction="right" onPress={onNext} />
      </View>

      <View className="px-6 pt-5">
        <View className="flex-row flex-wrap gap-2 mb-5">
          {CARE_TAGS.map((tag) => (
            <View
              key={tag.label}
              className="rounded-full px-4 py-2 items-center justify-center"
              style={{ backgroundColor: tag.bg }}
            >
              <Text className="text-sm font-medium" style={{ color: tag.color }}>
                {tag.label}
              </Text>
            </View>
          ))}
          <Text className="text-[14px] text-muted self-center ml-1">and more</Text>
        </View>

        <View className="flex-col items-center gap-0 mt-2">
          <Text className="text-foreground text-[28px] font-bold tracking-wider">
            Care That Fits
          </Text>
          <Text className="text-foreground text-[28px] font-bold tracking-wider">
            Every Stage
          </Text>
        </View>

        <Text className="text-muted text-[14px] mt-3 text-center leading-6">
          From preventive wellness to full-time support, Supracarer meets your
          family wherever they are.
        </Text>
      </View>
    </View>
  );
}

// ─── Slide 2: features (white background + photo) ────────────────────────────

function SlideFeatures({
  onBack,
  onNext,
}: NavSlideProps & { onNext: () => void }) {
  return (
    <View className="bg-background">
      <View className="relative" style={{ height: 400 }}>
        <ExpoImage
          source={require("../assets/images/slide3.jpg")}
          style={{ width: "100%", height: 390 }}
          contentFit="cover"
          contentPosition="top"
        />
        <NavArrow direction="left" onPress={onBack} />
        <NavArrow direction="right" onPress={onNext} />
      </View>

      <View className="px-6 pt-4">
        <Text className="text-foreground text-[28px] font-bold leading-[36px]">
          Fast. Trusted.{"\n"}Always Available.
        </Text>
        <Text className="text-muted text-[14px] mt-3 leading-6">
          Schedule care in real time, get matched with trained professionals,
          and receive consistent support.
        </Text>

        <View className="mt-6 gap-4">
          {FEATURES.map((feature) => (
            <View key={feature.title} className="flex-row items-start gap-3">
              <View
                className="w-10 h-10 rounded-[10px] items-center justify-center"
                style={{ backgroundColor: feature.iconBg }}
              >
                <Text className="text-lg">{feature.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-[14px]">
                  {feature.title}
                </Text>
                <Text className="text-muted text-[14px] mt-0.5 leading-[18px]">
                  {feature.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Shared: image overlay navigation arrow ───────────────────────────────────

function SlideSubscriptionSchedule({ onBack }: NavSlideProps) {
  return (
    <View className="bg-background">
      <View
        className="relative"
        style={{ height: 390, backgroundColor: "#17365d" }}
      >
        <ExpoImage
          source={require("../assets/images/slide4.jpg")}
          style={{ width: "100%", height: 390 }}
          contentFit="cover"
          contentPosition="top"
        />
        <View
          className="absolute left-0 right-0 bottom-0"
          style={{ height: 80, backgroundColor: "rgba(255,255,255,0.08)" }}
        />
        <NavArrow direction="left" onPress={onBack} />
      </View>

      <View className="px-5 pt-4">
        <View className="flex-row justify-between mb-4" style={{ gap: 8 }}>
          {SCHEDULE_TAGS.map((tag) => (
            <View key={tag.label} className="items-center flex-1">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: tag.bg }}
              >
                <Ionicons name={tag.icon} size={22} color={tag.color} />
              </View>
              <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: tag.bg }}
              >
                <Text
                  className="text-[10px] font-semibold text-center"
                  numberOfLines={1}
                  style={{ color: tag.color }}
                >
                  {tag.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text className="text-foreground text-[20px] font-bold text-center leading-[31px]">
          Monthly base subscription.
        </Text>
        <Text className="text-muted text-[13px] mt-3 text-center leading-5">
          Accept subscription-based visits, set your max visits per day,
          work within the active care plan.
        </Text>

        <View className="mt-5 gap-3">
          {SCHEDULE_PROTECTIONS.map((item) => (
            <View
              key={item}
              className="flex-row items-center rounded-2xl bg-slate-100 px-4 py-3"
            >
              <View className="w-6 h-6 rounded-full bg-green-500 items-center justify-center mr-3">
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              </View>
              <Text className="text-slate-700 text-[12px] font-semibold flex-1">
                {item}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function NavArrow({
  direction,
  onPress,
}: {
  direction: "left" | "right";
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`absolute top-1/2 -mt-[18px] w-9 h-9 rounded-full bg-white/85 items-center justify-center ${
        direction === "left" ? "left-3" : "right-3"
      }`}
    >
      <Text className="text-xl text-slate-700 leading-6">
        {direction === "left" ? "‹" : "›"}
      </Text>
    </Pressable>
  );
}
