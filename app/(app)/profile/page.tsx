import { requireUser, roleLabels } from "@/lib/auth/session";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarUploadForm } from "@/components/profile/avatar-upload-form";

export default async function ProfilePage() {
  const user = await requireUser();
  return <div className="space-y-6"><h1 className="text-3xl font-semibold">Profil saya</h1><Card className="max-w-2xl"><CardHeader><CardTitle>{user.name}</CardTitle></CardHeader><CardContent className="space-y-6"><AvatarUploadForm name={user.name} avatarUrl={user.avatarUrl} /><div className="border-t pt-5"><p className="break-all text-muted-foreground">{user.email}</p><p className="mt-2">{roleLabels[user.role]}</p></div><form action={logout}><Button variant="outline" className="min-h-11">Keluar dari akun</Button></form></CardContent></Card></div>;
}
