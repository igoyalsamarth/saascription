import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@saascription/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "#/lib/api-client";

const onboardSchema = z.object({
  workspaceName: z.string().min(1, "Required").max(120),
  displayName: z.string().min(1, "Required").max(120),
});

type OnboardFormValues = z.infer<typeof onboardSchema>;

export function OnboardForm() {
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const seededName = useRef(false);

  const form = useForm<OnboardFormValues>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      workspaceName: "Personal",
      displayName: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = form;

  useEffect(() => {
    if (!user || seededName.current) {
      return;
    }
    const fromClerk = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (fromClerk) {
      setValue("displayName", fromClerk);
      seededName.current = true;
    }
  }, [user, setValue]);

  const createWorkspace = useMutation({
    mutationFn: async (values: OnboardFormValues) => {
      return api
        .post("workspaces", {
          json: {
            workspaceName: values.workspaceName,
            displayName: values.displayName,
          },
        })
        .json<{
          ok: boolean;
          workspace: { id: string; name: string | null };
        }>();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace", "me"] });
      await navigate({ to: "/", replace: true });
    },
  });

  const onSubmit = (values: OnboardFormValues) => {
    createWorkspace.mutate(values);
  };

  const submitError =
    createWorkspace.error instanceof Error
      ? createWorkspace.error.message
      : null;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mx-auto w-full max-w-md border-border/80 shadow-sm">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle className="text-lg">Create your workspace</CardTitle>
            <CardDescription>
              You need a workspace to use the dashboard. You can change the name
              later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={errors.workspaceName ? true : undefined}>
                <FieldLabel htmlFor="onboard-workspace-name">
                  Workspace name
                </FieldLabel>
                <Input
                  id="onboard-workspace-name"
                  autoComplete="organization"
                  aria-invalid={errors.workspaceName ? true : undefined}
                  {...register("workspaceName")}
                />
                <FieldDescription>
                  Shown in the app and on invoices.
                </FieldDescription>
                {errors.workspaceName?.message ? (
                  <FieldError>{errors.workspaceName.message}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={errors.displayName ? true : undefined}>
                <FieldLabel htmlFor="onboard-display-name">
                  Your name
                </FieldLabel>
                <Input
                  id="onboard-display-name"
                  autoComplete="name"
                  aria-invalid={errors.displayName ? true : undefined}
                  {...register("displayName")}
                />
                <FieldDescription>
                  How we&apos;ll address you in the product.
                </FieldDescription>
                {errors.displayName?.message ? (
                  <FieldError>{errors.displayName.message}</FieldError>
                ) : null}
              </Field>
            </FieldGroup>
            {submitError ? (
              <p className="mt-4 text-xs text-destructive" role="alert">
                {submitError}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || createWorkspace.isPending}
            >
              {createWorkspace.isPending ? "Saving…" : "Continue"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
