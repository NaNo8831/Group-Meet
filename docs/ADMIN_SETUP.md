# Admin Setup — First Super Admin Bootstrap

This document describes how to create the first Super Admin manually. This is the bootstrap path until the Super Admin invite flow is built in Sprint 014.

## Prerequisites

- Supabase project is configured and the migration `supabase/migrations/006_admin_auth.sql` has been applied in the Supabase SQL Editor.
- You have access to the Supabase dashboard for the project.

## Steps

### 1. Apply the migration

In the Supabase dashboard, open **SQL Editor** and run the contents of `supabase/migrations/006_admin_auth.sql`. This adds the `auth_user_id` column to the `admins` table and sets up the required RLS policies.

### 2. Create a Supabase Auth user

1. In the Supabase dashboard, go to **Authentication → Users**.
2. Click **Add user → Create new user**.
3. Enter the Super Admin's **email** and a **password**.
4. Click **Create user**.

### 3. Confirm the user manually

If email delivery is not yet configured (DNS not set up), the user will not receive a confirmation email. Confirm manually:

1. In **Authentication → Users**, find the user you just created.
2. Click the user row to open the detail panel.
3. Click **Send confirmation email** — or — use the **Confirm user** action in the overflow menu (this marks them as confirmed without sending email).

### 4. Insert the admin record

In the **SQL Editor**, insert a row into the `admins` table. Replace the values with the real email and optionally the Supabase Auth user ID:

```sql
-- Minimal insert — auth_user_id will be backfilled automatically on first login
INSERT INTO admins (email, role, is_active)
VALUES ('your-email@example.com', 'super_admin', true);
```

If you want to pre-fill the `auth_user_id` (recommended):

```sql
-- Find the auth user ID
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Insert with auth_user_id
INSERT INTO admins (auth_user_id, email, role, is_active)
VALUES ('<auth-user-uuid>', 'your-email@example.com', 'super_admin', true);
```

### 5. Log in

Navigate to `/admin/login` and sign in with the email and password you set in step 2.

On first login, if `auth_user_id` was not pre-filled, the system will automatically backfill it from the email match.

---

## Creating Additional Admins

Until the Super Admin invite flow (Sprint 014) is built, additional admin accounts must be created manually using the same process:

1. Create a Supabase Auth user for the admin.
2. Confirm the user.
3. Insert a row into the `admins` table with `role = 'admin'` (or `'super_admin'` if elevating).

---

## Deactivating an Admin

To deactivate an admin without deleting their account history:

```sql
UPDATE admins SET is_active = false WHERE email = 'admin@example.com';
```

The account will be denied access on next login attempt. The Supabase Auth user is not deleted — only the `is_active` flag is checked.
