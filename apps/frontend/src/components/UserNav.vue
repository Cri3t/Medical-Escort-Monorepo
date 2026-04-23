<script setup lang="ts">
import { computed } from "vue";
import { LogOut, UserRound } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
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

const maskedPhone = computed(() => {
  const phone = props.user.phone;

  if (!phone || phone.length < 7) {
    return "暂无手机号";
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
});

const nickname = computed(() => props.user.nickname || "未设置昵称");

function handleLogout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  router.push("/auth");
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
      <DropdownMenuItem
        class="text-red-600 focus:bg-red-50 focus:text-red-700"
        @select="handleLogout"
      >
        <LogOut class="h-4 w-4" aria-hidden="true" />
        <span>退出登录</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
