import { getAuthContext, getProfile } from "../_shared/auth.ts";
import { success } from "../_shared/response.ts";

export async function handleAuthMe(request: Request) {
  const auth = await getAuthContext(request);
  const profile = await getProfile(auth.user.id);

  return success({
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      userRole: profile.user_role,
      isActive: profile.is_active,
      avatarPath: profile.avatar_path,
    },
  });
}
