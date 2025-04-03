# Forum Implementation Plan

This document outlines the plan for adding a message board/forum feature to the EyeSentry application.

**1. Database Schema (Supabase Tables)**

*   **`forum_categories`**: Stores information about each forum category.
    *   `id` (uuid, primary key, default: `gen_random_uuid()`)
    *   `name` (text, not null, unique)
    *   `description` (text, nullable)
    *   `rules` (text, nullable) - Rules specific to this category, displayed at the top.
    *   `display_order` (integer, default: 0) - For ordering categories.
    *   `created_at` (timestamptz, default: `now()`)
    *   `created_by` (uuid, foreign key -> `profiles.id`) - Admin who created it.
*   **`forum_posts`**: Stores individual posts (threads).
    *   `id` (uuid, primary key, default: `gen_random_uuid()`)
    *   `category_id` (uuid, not null, foreign key -> `forum_categories.id`)
    *   `author_id` (uuid, not null, foreign key -> `profiles.id`) - Doctor who created it.
    *   `title` (text, not null)
    *   `content` (text, not null)
    *   `is_pinned` (boolean, default: false) - Set by admins.
    *   `is_deleted` (boolean, default: false) - For soft deletes by admins.
    *   `created_at` (timestamptz, default: `now()`)
    *   `last_activity_at` (timestamptz, default: `now()`) - Updated on new reply.
*   **`forum_replies`**: Stores replies to posts.
    *   `id` (uuid, primary key, default: `gen_random_uuid()`)
    *   `post_id` (uuid, not null, foreign key -> `forum_posts.id`)
    *   `author_id` (uuid, not null, foreign key -> `profiles.id`) - Doctor who replied.
    *   `content` (text, not null)
    *   `is_deleted` (boolean, default: false) - For soft deletes by admins.
    *   `created_at` (timestamptz, default: `now()`)

**2. Backend Logic (Supabase)**

*   **RLS Policies:**
    *   `forum_categories`: Admins: ALL; Authenticated Users (Doctors): SELECT.
    *   `forum_posts`: Authenticated Users (Doctors): SELECT (where `is_deleted` = false), INSERT. Admins: ALL. Authors: SELECT (even if deleted?).
    *   `forum_replies`: Authenticated Users (Doctors): SELECT (where `is_deleted` = false), INSERT. Admins: ALL. Authors: SELECT (even if deleted?).
*   **Database Functions (RPC):**
    *   `create_forum_post(p_category_id uuid, p_title text, p_content text)`: Inserts into `forum_posts`. Returns new post ID.
    *   `create_forum_reply(p_post_id uuid, p_content text)`: Inserts into `forum_replies`, updates `forum_posts.last_activity_at`, *and* inserts into `notifications` table targeting the original post author. Returns new reply ID.
    *   `delete_forum_post(p_post_id uuid)`: (Admin only) Sets `forum_posts.is_deleted = true`.
    *   `delete_forum_reply(p_reply_id uuid)`: (Admin only) Sets `forum_replies.is_deleted = true`.
    *   `pin_forum_post(p_post_id uuid, p_pin_status boolean)`: (Admin only) Updates `forum_posts.is_pinned`.
    *   `manage_forum_category(p_id uuid, p_name text, p_description text, p_rules text, p_display_order integer, p_delete boolean)`: (Admin only) Handles create/update/delete for categories. Delete should likely be soft or prevent deletion if posts exist.
*   **Triggers (Alternative for Notifications/Activity):**
    *   A trigger on `forum_replies` insert could update `forum_posts.last_activity_at`.
    *   A trigger on `forum_replies` insert could insert into the `notifications` table.

**3. Frontend Implementation**

*   **Types (`src/types/forum.ts`):** Define `ForumCategory`, `ForumPost`, `ForumReply` interfaces matching the DB schema.
*   **Service (`src/services/ForumService.ts`):** Create functions to interact with the tables and RPCs (e.g., `getCategories`, `getPosts`, `getReplies`, `createPost`, `createReply`, admin functions).
*   **UI Components:**
    *   **Forum Structure:**
        *   `src/components/forum/ForumCategoryList.tsx`: Displays categories, links to `/forum/:categoryId`.
        *   `src/components/forum/ForumPostList.tsx`: Displays posts for a category (pinned first), links to `/forum/post/:postId`, includes "Create Post" button.
        *   `src/components/forum/ForumPostView.tsx`: Shows post content, category rules (if any), replies, and `ForumReplyForm.tsx`. Includes delete buttons for admins.
        *   `src/components/forum/ForumReplyForm.tsx`: Simple textarea and submit button.
        *   `src/components/forum/ForumPostForm.tsx`: Dialog/form for creating a new post (title, content).
    *   **Admin:**
        *   `src/components/admin/ForumCategoryManager.tsx`: Table/form UI for admins to CRUD categories, set rules, and manage display order.
    *   **Integration:**
        *   Modify `src/pages/NewAdmin.tsx`: Add a "Forum Management" section linking to the admin management UI.
        *   Modify `src/pages/Doctor.tsx`: Add a `Card` component below "Clinical Information" with a title like "Doctor Forum", description, and a button linking to `/forum`.
*   **Pages:**
    *   `src/pages/Forum.tsx`: Main entry point. Could display `ForumCategoryList` or handle routing based on URL parameters.
*   **Routing (`src/App.tsx`):** Add routes:
    *   `/forum` (protected for Doctors/Admins) -> `Forum.tsx` (shows categories)
    *   `/forum/:categoryId` (protected) -> `Forum.tsx` (shows posts for the category)
    *   `/forum/post/:postId` (protected) -> `Forum.tsx` (shows post and replies)
    *   `/admin/forum` (protected for Admins) -> Could redirect to `/admin?section=forum` or be a dedicated route.
*   **Notifications:** Ensure the notification component used by doctors checks for and displays notifications of type `new_forum_reply` (or similar).

**4. Styling:** Utilize existing `shadcn/ui` components and Tailwind CSS.

**5. Mermaid Diagram (Simplified Data Flow):**

```mermaid
graph TD
    subgraph User Interaction
        A[Doctor on Dashboard] --> B(Forum Card);
        B --> C[/forum];
        C --> D[Category List];
        D -- Select --> E[/forum/:catId];
        E --> F[Post List];
        F -- Select --> G[/forum/post/:postId];
        G --> H[Post View + Replies];
        H --> I[Reply Form];
        F -- Create --> J[New Post Form];
        I -- Submit --> K{Backend: Create Reply};
        J -- Submit --> L{Backend: Create Post};
    end

    subgraph Admin Interaction
        AA[Admin Dashboard] --> BB[/admin?section=forum];
        BB --> CC[Category Manager];
        CC -- CRUD --> DD{Backend: Category Mgmt};
        F -- Pin/Delete --> EE{Backend: Post Mgmt};
        H -- Delete --> FF{Backend: Reply Mgmt};
    end

    subgraph Backend Logic
        K -- Insert --> ReplyTable[DB: forum_replies];
        K -- Update --> PostTable[DB: forum_posts];
        K -- Insert --> NotificationTable[DB: notifications];
        L -- Insert --> PostTable;
        DD -- CRUD --> CategoryTable[DB: forum_categories];
        EE -- Update --> PostTable;
        FF -- Update --> ReplyTable;
    end

    subgraph Notifications
        NotificationTable -- Read --> NotifySystem[Notification System];
        NotifySystem -- Display --> Author[Post Author];
    end