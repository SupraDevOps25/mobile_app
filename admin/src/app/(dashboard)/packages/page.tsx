"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  Spinner,
} from "@/components/ui";
import {
  useCreatePackage,
  useDeletePackage,
  usePackages,
  useUpdatePackage,
} from "@/services/packages/packages.queries";
import {
  PACKAGE_TYPES,
  PACKAGE_TYPE_LABELS,
  type Package,
  type PackageType,
} from "@/services/packages/packages.types";
import {
  inclusionsToText,
  packageFormSchema,
  textToInclusions,
  type PackageFormValues,
} from "@/schemas/packages/package.schema";
import { formatGhs } from "@/lib/format";

const inputClass =
  "w-full rounded-field bg-field px-3.5 py-2.5 text-sm text-ink placeholder:text-faint border border-transparent transition-colors focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15";

export default function PackagesPage() {
  const { data, isLoading, isError, error } = usePackages();
  const createPkg = useCreatePackage();
  const updatePkg = useUpdatePackage();
  const deletePkg = useDeletePackage();

  const packages = useMemo(() => data ?? [], [data]);
  const missingTypes = useMemo(
    () => PACKAGE_TYPES.filter((t) => !packages.some((p) => p.type === t)),
    [packages],
  );

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
  });

  const mutating = mode === "create" ? createPkg : updatePkg;

  function openCreate() {
    reset({
      type: missingTypes[0],
      name: "",
      tagline: "",
      priceGhs: 0,
      inclusions: "",
    });
    createPkg.reset();
    setMode("create");
    setOpen(true);
  }

  function openEdit(pkg: Package) {
    reset({
      type: pkg.type,
      name: pkg.name,
      tagline: pkg.tagline,
      priceGhs: pkg.priceGhs,
      inclusions: inclusionsToText(pkg.inclusions),
    });
    updatePkg.reset();
    setMode("edit");
    setOpen(true);
  }

  const onSubmit = handleSubmit(async (v) => {
    const inclusions = textToInclusions(v.inclusions);
    try {
      if (mode === "create") {
        await createPkg.mutateAsync({
          type: v.type,
          name: v.name,
          tagline: v.tagline,
          priceGhs: v.priceGhs,
          inclusions,
        });
      } else {
        await updatePkg.mutateAsync({
          type: v.type,
          input: {
            name: v.name,
            tagline: v.tagline,
            priceGhs: v.priceGhs,
            inclusions,
          },
        });
      }
      setOpen(false);
    } catch {
      // Error is surfaced from the mutation state inside the modal.
    }
  });

  async function handleDelete(pkg: Package) {
    const ok = window.confirm(
      `Remove the ${pkg.name} package from the catalog? Families won't be able to subscribe to it (existing subscriptions are unaffected).`,
    );
    if (!ok) return;
    await deletePkg.mutateAsync(pkg.type).catch(() => {});
  }

  return (
    <>
      <PageHeader
        title="Packages"
        subtitle="Edit the care catalog — name, tagline, price and what's included."
        actions={
          missingTypes.length > 0 ? (
            <Button onClick={openCreate}>Add package</Button>
          ) : undefined
        }
      />

      {deletePkg.isError && (
        <p className="mb-4 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
          {deletePkg.error instanceof Error
            ? deletePkg.error.message
            : "Couldn't remove that package."}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-brand">
          <Spinner size={26} />
        </div>
      ) : isError ? (
        <Card className="text-center">
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load packages."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {packages.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-ink">{p.name}</h3>
                    <Badge tone="slate">{PACKAGE_TYPE_LABELS[p.type]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{p.tagline}</p>
                </div>
                <p className="shrink-0 text-lg font-bold text-ink">
                  {formatGhs(p.priceGhs)}
                </p>
              </div>

              <ul className="mt-4 flex-1 space-y-1.5">
                {p.inclusions.map((inc, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted">
                    <span className="text-brand">•</span>
                    {inc}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex gap-2 border-t border-line pt-4">
                <Button variant="subtle" size="sm" onClick={() => openEdit(p)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deletePkg.isPending && deletePkg.variables === p.type}
                  onClick={() => handleDelete(p)}
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "create" ? "Add package" : "Edit package"}
      >
        {mutating.isError && (
          <p className="mb-4 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
            {mutating.error instanceof Error
              ? mutating.error.message
              : "Couldn't save the package."}
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Type" error={errors.type?.message}>
            {mode === "create" ? (
              <select className={inputClass} {...register("type")}>
                {missingTypes.map((t) => (
                  <option key={t} value={t}>
                    {PACKAGE_TYPE_LABELS[t as PackageType]}
                  </option>
                ))}
              </select>
            ) : (
              <input className={inputClass} disabled {...register("type")} />
            )}
          </Field>

          <Field label="Name" error={errors.name?.message}>
            <Input placeholder="Wellness" {...register("name")} />
          </Field>

          <Field label="Tagline" error={errors.tagline?.message}>
            <Input
              placeholder="Light, proactive support for independent living"
              {...register("tagline")}
            />
          </Field>

          <Field label="Price (GHS / month)" error={errors.priceGhs?.message}>
            <Input
              type="number"
              min={0}
              step="1"
              {...register("priceGhs", { valueAsNumber: true })}
            />
          </Field>

          <Field
            label="Inclusions (one per line)"
            error={errors.inclusions?.message}
          >
            <textarea
              rows={5}
              placeholder={"Weekly nurse visit\nMedication reminders\n24/7 phone support"}
              className={inputClass}
              {...register("inclusions")}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={mutating.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={mutating.isPending}>
              {mode === "create" ? "Create package" : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
