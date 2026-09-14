import { requireUser, roleLabels } from "@/lib/auth/session";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarUploadForm } from "@/components/profile/avatar-upload-form";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="page-stack max-w-2xl">
      <header>
        <p className="page-eyebrow">Akun pribadi</p>
        <h1 className="page-title">Profil saya</h1>
      </header>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">{user.name}</CardTitle>
          <CardDescription>Foto ini dapat dilihat oleh seluruh penghuni kontrakan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUploadForm name={user.name} avatarUrl={user.avatarUrl} />
          <div className="flex flex-col gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="break-all text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="secondary">{roleLabels[user.role]}</Badge>
          </div>
          <form action={logout}>
            <Button variant="outline" className="min-h-11 w-full sm:w-auto">Keluar dari akun</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
