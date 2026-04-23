import request from "@/utils/request";

export interface PublicEscortProfile {
  id: string;
  userId: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    nickname: string | null;
  };
}

export function getPublicProfiles() {
  return request.get<unknown, PublicEscortProfile[]>("/escort-profile/public");
}
