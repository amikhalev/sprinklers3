export interface RouteParams {
  deviceId: string;
  programId: string;
}

export const routerRouteParams: RouteParams = {
  deviceId: ":deviceId",
  programId: ":programId"
};

export const home = "/";
export const messagesTest = "/messagesTest";

export const login = "/login";
export const logout = "/logout";

export function device(deviceId?: string | number): string {
  return `/devices/${deviceId || ""}`;
}

export function program(
  deviceId: string | number,
  programId?: string | number
): string {
  return `${device(deviceId)}/programs/${programId}`;
}
