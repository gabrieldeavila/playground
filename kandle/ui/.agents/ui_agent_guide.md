# UI Kit Usage Guide for AI Agents

This repository contains a reusable UI kit. Use the existing components to build interfaces without adding application-specific behavior to the kit.

## Core rule

Prefer composing existing primitives over writing custom UI. Components in `ui/components/primitives` are generic, copy-paste friendly, and independent of routing, authentication, API calls, global stores, and domain rules.

Application code owns:

- data fetching and mutations;
- business validation;
- routing and navigation logic;
- authentication and permissions;
- global state and notification queues;
- page layout and product-specific composition.

The UI kit owns presentation, interaction primitives, accessibility behavior, and reusable visual states.

## Import conventions

Use the project alias when available:

```tsx
import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import { Input } from "@/ui/components/primitives/input";
import { cn } from "@/ui/helpers/cn";
```

Use the component's public entry point. Do not import internal implementation files.

Use `react-icons` for icons:

```tsx
import { FiArrowRight } from "react-icons/fi";
```

## Choosing a component

| Need                                         | Use                         | Important behavior                                                        |
| -------------------------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| Primary or secondary action                  | `Button`                    | Supports variants, loading, disabled state, and icons.                    |
| Icon-only action                             | `IconButton`                | Always provide an accessible label.                                       |
| Visual grouping                              | `Card`                      | Compose with `Card.Header`, `Card.Title`, `Card.Body`, and `Card.Footer`. |
| Short informational label                    | `Badge`                     | Static and non-interactive; it should not look clickable.                 |
| Person or entity image                       | `Avatar`                    | Provide a fallback, preferably initials.                                  |
| Text input                                   | `Input`                     | Controlled or uncontrolled through native input props.                    |
| Multiline text                               | `Textarea`                  | Controlled or uncontrolled through native textarea props.                 |
| Simple selection                             | `Select`                    | Native select behavior with kit styling.                                  |
| Boolean choice                               | `Checkbox`                  | Use for selections and form values.                                       |
| Immediate on/off setting                     | `Switch`                    | Use when changing the setting takes effect immediately.                   |
| Exclusive choice                             | `RadioGroup`                | Keep the selected value controlled by the consumer.                       |
| Label, description, and error around a field | `FormField`                 | Connects field context and descriptive/error content.                     |
| Tabular content                              | `Table`                     | Visual only; no fetching, filtering, or pagination.                       |
| Label/value pairs                            | `DataList`                  | Compose entries with the component's item API.                            |
| Metric or KPI presentation                   | `Stat`                      | Generic visual presentation; business calculations stay outside.          |
| No-content state                             | `EmptyState`                | Compose icon, title, description, and optional action.                    |
| Loading placeholder                          | `Skeleton`                  | The consumer decides when it is shown.                                    |
| Loading indicator                            | `Spinner`                   | Use for short asynchronous operations or loading regions.                 |
| Temporary feedback                           | `Toast` and `ToastViewport` | The consumer owns queue and visibility state.                             |
| Fully composable overlay                     | `Modal`                     | Use when the consumer needs complete content control.                     |
| Standard dialog with actions                 | `StandardModal`             | Use for title, content, cancel, save, and save loading.                   |
| Section navigation                           | `Tabs`                      | Supports controlled and uncontrolled usage.                               |
| Hierarchical navigation                      | `Breadcrumb`                | The consumer provides the links and navigation behavior.                  |
| Page navigation                              | `Pagination`                | Controlled; it does not know where data comes from.                       |
| Action menu                                  | `DropdownMenu`              | The consumer owns actions and application state.                          |
| Contextual help                              | `Tooltip`                   | Never use it as the only place for essential information.                 |
| Rich contextual content                      | `Popover`                   | Use for supplemental interactive content.                                 |
| Expandable sections                          | `Accordion`                 | Use for secondary content and grouped details.                            |

## Composition patterns

### Button

```tsx
<Button variant="primary" size="md" onClick={handleContinue}>
  Continue
</Button>

<Button
  variant="secondary"
  isLoading={isSaving}
  disabled={!isValid}
  onClick={handleSave}
>
  Save changes
</Button>
```

Use `disabled` for a state owned by the consuming feature. Use `isLoading` while an asynchronous action is in progress. Do not add product-specific submission or tracking logic to the Button.

For icon buttons, the icon must not be the only accessible name:

```tsx
<IconButton aria-label="Open settings" onClick={handleOpenSettings}>
  <FiSettings aria-hidden="true" />
</IconButton>
```

Decorative icons inside text buttons should use `aria-hidden="true"`.

### Card

```tsx
<Card>
  <Card.Header>
    <Card.Title>Account settings</Card.Title>
  </Card.Header>

  <Card.Body>
    <p>Content is defined by the consuming feature.</p>
  </Card.Body>

  <Card.Footer>
    <Button variant="ghost" onClick={handleCancel}>
      Cancel
    </Button>
    <Button onClick={handleSave}>Save</Button>
  </Card.Footer>
</Card>
```

Use composition instead of inventing props such as `title`, `icon`, `footerText`, or `status`.

### Forms

Form controls are independent of React Hook Form, Zod, and application context. Connect them to any form solution from the consuming application.

```tsx
<FormField
  label="Email"
  description="We will use this address for account notifications."
  error={emailError}
>
  <Input
    name="email"
    type="email"
    value={email}
    onChange={(event) => setEmail(event.target.value)}
  />
</FormField>
```

Rules:

- Keep business validation outside the primitives.
- Use the field error state for visual and accessible feedback.
- Preserve native props such as `name`, `value`, `onChange`, `required`, `disabled`, and `placeholder`.
- Use refs when the consuming feature needs focus or measurement.
- Do not duplicate labels or descriptive IDs if `FormField` already provides them.

### Modal

Use `Modal` for full composition control. Use `StandardModal` for the standard title/content/cancel/save pattern.

```tsx
<StandardModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Edit profile"
  onCancel={handleCancel}
  onSave={handleSave}
  saveLoading={isSaving}
>
  <FormField label="Display name" error={nameError}>
    <Input value={name} onChange={handleNameChange} />
  </FormField>
</StandardModal>
```

Modal behavior:

- The modal uses a portal, backdrop, Escape handling, and scroll locking.
- Cancel closes the `StandardModal` through the configured cancel behavior.
- The save callback decides when the modal closes, allowing validation and asynchronous errors to be handled by the consumer.
- Fetching, mutation logic, and business validation stay outside the modal.

### Toast

`Toast` is a visual primitive. The consuming application owns its queue, state, triggering logic, and placement strategy.

```tsx
<ToastViewport position="bottom-right">
  <Toast
    variant="success"
    title="Changes saved"
    description="Your profile was updated successfully."
    duration={4000}
    onClose={handleClose}
  />
</ToastViewport>
```

Use `success`, `error`, `warning`, or `info` according to the message. Add an action only when the user has a meaningful follow-up action.

### Table and pagination

```tsx
<Table>
  <Table.Caption>Registered users</Table.Caption>
  <Table.Header>
    <Table.Row>
      <Table.Head>Name</Table.Head>
      <Table.Head>Status</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {rows.map((row) => (
      <Table.Row key={row.id}>
        <Table.Cell>{row.name}</Table.Cell>
        <Table.Cell>
          <Badge variant="success">Active</Badge>
        </Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
</Table>

<Pagination
  page={page}
  pageCount={pageCount}
  onPageChange={setPage}
/>
```

The consumer owns rows, fetching, filtering, sorting, pagination, loading, empty states, and error states. Do not place these concerns inside `Table`.

## Styling and layout

- Use `cn` to merge classes.
- Reuse the shared design tokens instead of introducing arbitrary colors, spacing, radii, or shadows.
- Let the parent control layout, width, and margins. Primitives should not impose page-specific spacing.
- Use native Tailwind v4 utilities when available.
- For custom CSS variables, use the canonical syntax such as `bg-(--color-accent)` or `shadow-(--button-shadow)`.
- Do not use `utility-[var(--token)]` when the canonical `utility-(--token)` syntax applies.
- Avoid hardcoded `#000000` and `#FFFFFF` when a shared token or semantic color is available.
- Preserve the kit's dark chromatic surfaces, subtle borders, shared radii, shadows, and restrained motion.
- Use responsive layout classes in the consuming page or parent composition rather than embedding application layout rules in primitives.

## State ownership

Keep state at the narrowest useful scope:

- Input values belong to the consuming form.
- Modal open state belongs to the consuming feature.
- Selected tabs, pagination, and filters belong to the consuming page or feature.
- Toast queues belong to the consuming application.
- API data and mutations belong to the consuming application.

Do not add global state, fetching, context, authentication, routing, or domain-specific callbacks to a reusable primitive.

## Accessibility requirements

Before using a component, verify:

- Every interactive control is keyboard accessible.
- Every icon-only control has a clear `aria-label`.
- Decorative icons use `aria-hidden="true"`.
- Images have meaningful `alt` text, or empty alt text when purely decorative.
- Form labels are associated with their controls.
- Errors and descriptions are available to assistive technology and are not communicated by color alone.
- Focus states remain visible.
- Dialogs can be operated with the keyboard and do not trap users without a way to close them.
- Tooltips do not contain the only copy of essential information.
- Loading, disabled, empty, and error states are understandable without relying on animation.
- Motion respects `prefers-reduced-motion`.
- Tables remain usable on small screens, including horizontal overflow where necessary.

## Component-specific boundaries

- `Badge` is informational and static. Do not add click behavior, cursor tracking, glow, or interaction animations.
- `Table` does not perform fetching, filtering, pagination, virtualization, or sorting.
- `Pagination` is controlled and does not fetch data.
- `Toast` does not manage a global notification queue.
- `Modal` and `StandardModal` do not submit forms or perform API operations.
- `Select` remains a native styled select unless the consuming application explicitly needs a different interaction model.
- `Avatar` should have a useful fallback and should handle image failure gracefully.
- `EmptyState` should remain a visual composition with an optional action; the action's behavior belongs to the consumer.
- `Stat` presents values and trends but does not calculate business metrics.

## Do not do this

- Do not recreate an existing primitive with custom markup and styles.
- Do not add React Query, Zustand, Redux, React Hook Form, Zod, API services, or application context to a primitive.
- Do not add product-specific components such as `UserCard`, `CheckoutModal`, or `AdminTable` to the reusable kit.
- Do not add domain props such as `user`, `order`, `isAdmin`, `fetchData`, or `onSubmitUser` to generic components.
- Do not turn `Badge` into a clickable element.
- Do not put business validation, permissions, routing, or authentication in the UI kit.
- Do not duplicate token values in consuming compositions when shared tokens already exist.
- Do not use a tooltip as a replacement for visible essential content.

## Consumer checklist

Before delivering an interface built with this kit, confirm:

- [ ] Existing primitives were reused wherever possible.
- [ ] Composition was preferred over adding custom component APIs.
- [ ] Application state and business logic remain outside the primitives.
- [ ] Shared tokens and `cn` are used for styling.
- [ ] Loading, disabled, error, empty, and fallback states are represented where relevant.
- [ ] Keyboard navigation, focus, labels, ARIA, and reduced motion were reviewed.
- [ ] Icon-only controls have accessible names.
- [ ] No unnecessary dependency or global state was introduced.

**Expected outcome:** interfaces should feel consistent with the design system while keeping all data, behavior, and product decisions in the consuming application.
