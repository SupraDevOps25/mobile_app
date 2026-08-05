"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Spinner,
} from "@/components/ui";
import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
} from "@/services/auth/auth.queries";
import {
  passwordSchema,
  profileSchema,
  type PasswordInput,
  type ProfileInput,
} from "@/schemas/settings/settings.schema";

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", phone: "" },
  });
  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  // Seed the profile form once loaded.
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      });
    }
  }, [profile, profileForm]);

  const onSaveProfile = profileForm.handleSubmit((v) =>
    updateProfile.mutate(v),
  );
  const onChangePassword = passwordForm.handleSubmit((v) =>
    changePassword.mutate(
      { currentPassword: v.currentPassword, newPassword: v.newPassword },
      { onSuccess: () => passwordForm.reset() },
    ),
  );

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your admin account details and password."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-brand">
          <Spinner size={26} />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Profile */}
          <Card>
            <CardHeader title="Profile" />
            {profile && (
              <p className="mb-4 text-sm text-muted">
                Signed in as{" "}
                <span className="font-medium text-ink">{profile.email}</span>{" "}
                (email is not editable here).
              </p>
            )}

            {updateProfile.isSuccess && (
              <p className="mb-4 rounded-field bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Profile updated.
              </p>
            )}
            {updateProfile.isError && (
              <p className="mb-4 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
                {updateProfile.error instanceof Error
                  ? updateProfile.error.message
                  : "Couldn't save your profile."}
              </p>
            )}

            <form onSubmit={onSaveProfile} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="First name"
                  error={profileForm.formState.errors.firstName?.message}
                >
                  <Input {...profileForm.register("firstName")} />
                </Field>
                <Field
                  label="Last name"
                  error={profileForm.formState.errors.lastName?.message}
                >
                  <Input {...profileForm.register("lastName")} />
                </Field>
              </div>
              <Field
                label="Phone"
                error={profileForm.formState.errors.phone?.message}
              >
                <Input
                  placeholder="+233201234567"
                  {...profileForm.register("phone")}
                />
              </Field>
              <Button type="submit" loading={updateProfile.isPending}>
                Save profile
              </Button>
            </form>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader title="Change password" />

            {changePassword.isSuccess && (
              <p className="mb-4 rounded-field bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Password changed.
              </p>
            )}
            {changePassword.isError && (
              <p className="mb-4 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
                {changePassword.error instanceof Error
                  ? changePassword.error.message
                  : "Couldn't change your password."}
              </p>
            )}

            <form onSubmit={onChangePassword} className="space-y-4" noValidate>
              <Field
                label="Current password"
                error={passwordForm.formState.errors.currentPassword?.message}
              >
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register("currentPassword")}
                />
              </Field>
              <Field
                label="New password"
                error={passwordForm.formState.errors.newPassword?.message}
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("newPassword")}
                />
              </Field>
              <Field
                label="Confirm new password"
                error={passwordForm.formState.errors.confirmPassword?.message}
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("confirmPassword")}
                />
              </Field>
              <Button type="submit" loading={changePassword.isPending}>
                Change password
              </Button>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
