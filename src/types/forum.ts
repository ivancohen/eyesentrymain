/**
 * @fileoverview TypeScript interfaces for the forum feature data structures.
 */

import { UserProfile } from "@/services/UserService"; // Corrected import path

/**
 * Represents a forum category.
 * Matches the `forum_categories` table schema.
 */
export interface ForumCategory {
  id: string; // uuid
  name: string;
  description?: string | null;
  rules?: string | null;
  display_order: number;
  created_at: string; // timestamptz
  created_by: string; // uuid (references profiles.id)
  // Optional: Add profile data if joining created_by user
  // created_by_profile?: Pick<UserProfile, 'id' | 'name'>;
}

/**
 * Represents a forum post (thread).
 * Matches the `forum_posts` table schema.
 */
export interface ForumPost {
  id: string; // uuid
  category_id: string; // uuid
  author_id: string; // uuid
  title: string;
  content: string;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string; // timestamptz
  last_activity_at: string; // timestamptz
  // Optional joined data
  author?: Pick<UserProfile, 'id' | 'name'> | null; // Added optional author
  // category_name?: string; // Example if category name is joined
  // author?: Pick<UserProfile, 'id' | 'name' | 'avatarUrl'>;
  // Optional: Add reply count if calculated
  // reply_count?: number;
}

/**
 * Represents a reply to a forum post.
 * Matches the `forum_replies` table schema.
 */
export interface ForumReply {
  id: string; // uuid
  post_id: string; // uuid
  author_id: string; // uuid
  content: string;
  is_deleted: boolean;
  created_at: string; // timestamptz
  // Optional joined data
  author?: Pick<UserProfile, 'id' | 'name'> | null; // Added optional author
  // author?: Pick<UserProfile, 'id' | 'name' | 'avatarUrl'>;
}

// Type for creating/updating categories (subset of ForumCategory)
export type ForumCategoryData = Omit<ForumCategory, 'id' | 'created_at' | 'created_by'> & { id?: string };

// Type for creating posts
export type ForumPostData = Pick<ForumPost, 'category_id' | 'title' | 'content'>;

// Type for creating replies
export type ForumReplyData = Pick<ForumReply, 'post_id' | 'content'>;