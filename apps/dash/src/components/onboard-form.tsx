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
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@saascription/ui";
import { useNavigate } from "@tanstack/react-router";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { useCreateWorkspaceMutation } from "@/services/workspace";

const schema = z.object({
  workspaceName: z.string().min(1, "Required").max(120),
  displayName: z.string().min(1, "Required").max(120),
});

type Values = z.infer<typeof schema>;

export function OnboardForm() {
  const navigate = useNavigate();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      workspaceName: "Personal",
      displayName: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const createWorkspace = useCreateWorkspaceMutation({
    onSuccess: async () => {
      await navigate({ to: "/", replace: true });
    },
  });

  const onSubmit = (values: Values) => {
    createWorkspace.mutate(values);
  };

  const submitError =
    createWorkspace.error instanceof Error
      ? createWorkspace.error.message
      : null;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <Card className="mx-auto w-full max-w-md border-border/80 shadow-sm">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle className="text-lg">Create your workspace</CardTitle>
            <CardDescription>
              You need a workspace to use the dashboard.
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
