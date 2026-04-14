---
name: react-hook-form
description: React Hook Form v7 patterns for building performant forms with MUI, Valibot validation, useFieldArray, and React Router integration. Use when creating or modifying forms, adding validation, working with Controller/useController, or handling form submission via clientAction.
license: MIT
---

# React Hook Form

React Hook Form manages form state with minimal re-renders using uncontrolled inputs and subscription-based updates. This project uses RHF for complex forms (Parts) while simpler forms (Locations, Users) use plain `useState`.

## Project-Specific Context

- **Validation**: Valibot with `valibotResolver` (not Zod) — schemas in `partSchema.ts`
- **UI library**: Material UI — all fields use `Controller` or `useController`
- **Form structure**: `FormProvider` + `useFormContext` for multi-section forms
- **Submission**: RHF `handleSubmit` → `useSubmit` → React Router `clientAction`
- **Default values**: Pre-built from server data via `buildDefaultValues()` mapper
- **Dynamic fields**: `useFieldArray` for bins and vendors with primary-item logic
- **Custom inputs**: `MoneyField` and `DecimalField` use `useController` for locale-aware formatting
- **Unsaved changes**: `isDirty` from `formState` feeds into `useUnsavedChangesGuard`

## When to Apply

- Creating or modifying form components
- Adding field validation (Valibot schemas)
- Integrating MUI components with Controller
- Working with dynamic field arrays (bins, vendors)
- Building custom form inputs (money, decimal, date)
- Handling form submission through React Router
- Optimizing form performance (re-renders, subscriptions)

## References

| Reference                          | Use When                                                  |
| ---------------------------------- | --------------------------------------------------------- |
| `references/form-setup.md`        | Configuring useForm, defaultValues, validation mode       |
| `references/mui-integration.md`   | Wrapping MUI components with Controller/useController     |
| `references/validation.md`        | Valibot schemas, cross-field validation, resolver caching |
| `references/field-arrays.md`      | Dynamic lists (bins, vendors), append/remove/update       |
| `references/submission.md`        | handleSubmit → useSubmit → clientAction flow              |
| `references/performance.md`       | watch vs useWatch, formState proxy, re-render isolation   |

## Critical Patterns

### FormProvider for Multi-Section Forms

```tsx
const methods = useForm({
  resolver: valibotResolver(partCreateSchema),
  defaultValues: buildDefaultValues(initialData, options),
});

<FormProvider {...methods}>
  <PartIdentitySection />
  <PricingSection />
  <VendorSection />
</FormProvider>
```

### MUI TextField with Controller

```tsx
<Controller
  name="description"
  control={control}
  render={({field, fieldState}) => (
    <TextField
      {...field}
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
    />
  )}
/>
```

### Hidden Submit Button Pattern

```tsx
// Form exposes a hidden button; page-level Save triggers it
<button
  id="part-form-submit"
  type="button"
  onClick={methods.handleSubmit(handleFormSubmit)}
  style={{display: 'none'}}
/>

// Page component clicks it
document.getElementById('part-form-submit')?.click();
```

## Further Documentation

https://react-hook-form.com/docs
