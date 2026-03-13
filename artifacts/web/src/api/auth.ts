import type { LoginRequest, LoginResponse } from "@/types/auth";
import { apiFetch } from "./client";

export function login(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
