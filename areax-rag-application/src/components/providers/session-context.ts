import { createContext } from "react";
import type { UserDto } from "@/model/auth/auth.dto";

export const SessionContext = createContext<UserDto | null>(null);
