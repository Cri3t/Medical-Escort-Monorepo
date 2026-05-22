<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ClipboardCheck, Languages, LogOut, UserRound } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { setLocale, type SupportedLocale } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserNavUser {
  nickname?: string;
  phone?: string;
  role?: string;
}

interface UserNavProps {
  displayName: string;
  user: UserNavUser;
}

const props = defineProps<UserNavProps>();
const router = useRouter();
const { locale, t } = useI18n();

const currentLocale = computed(() => locale.value as SupportedLocale);

const maskedPhone = computed(() => {
  const phone = props.user.phone;

  if (!phone || phone.length < 7) {
    return t("userNav.noPhone");
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
});

const nickname = computed(() => props.user.nickname || t("userNav.nicknameFallback"));

const isAdmin = computed(() => props.user.role === "ADMIN");

const nextLanguageLabel = computed(() =>
  currentLocale.value === "en" ? t("common.chinese") : t("common.english"),
);

function goEscortReviews() {
  router.push("/admin/escort-reviews");
}

function handleLogout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  router.push("/auth");
}

function toggleLocale() {
  setLocale(currentLocale.value === "en" ? "zh-CN" : "en");
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        class="h-10 rounded-lg bg-slate-100 px-4 text-slate-700 shadow-none hover:bg-slate-200"
      >
        <UserRound class="h-4 w-4" aria-hidden="true" />
        <span>{{ displayName }}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56" align="end">
      <DropdownMenuLabel class="font-normal">
        <div class="flex flex-col gap-1">
          <p class="text-sm font-medium leading-none text-slate-950">
            {{ nickname }}
          </p>
          <p class="text-xs leading-none text-slate-500">
            {{ maskedPhone }}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem v-if="isAdmin" @select="goEscortReviews">
        <ClipboardCheck class="h-4 w-4" aria-hidden="true" />
        <span>{{ t("userNav.escortReviews") }}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="isAdmin" />
      <DropdownMenuItem @select="toggleLocale">
        <Languages class="h-4 w-4" aria-hidden="true" />
        <span>{{ t("common.language") }}: {{ nextLanguageLabel }}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        class="text-red-600 focus:bg-red-50 focus:text-red-700"
        @select="handleLogout"
      >
        <LogOut class="h-4 w-4" aria-hidden="true" />
        <span>{{ t("userNav.logout") }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
