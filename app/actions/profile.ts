"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { actionError, BusinessError, type ActionState } from "@/lib/actions";
import { uploadProfileImage } from "@/lib/storage";

export async function updateProfileAvatar(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser();

  try {
    const file = form.get("avatar");
    if (!(file instanceof File) || file.size === 0) {
      throw new BusinessError("Pilih foto profil terlebih dahulu.");
    }

    const uploaded = await uploadProfileImage(file);
    await getDb().$transaction(async (tx) => {
      await tx.user.update({ where: { id: actor.id }, data: { avatarUrl: uploaded.url } });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "PROFILE_AVATAR_UPDATED",
          entityType: "User",
          entityId: actor.id,
        },
      });
    });

    revalidatePath("/profile");
    revalidatePath("/members");
    revalidatePath("/bills");
    revalidatePath("/dashboard");
    revalidatePath("/payments/review");

    return { success: true, message: "Foto profil berhasil diperbarui." };
  } catch (error) {
    return actionError(error);
  }
}

