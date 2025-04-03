import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getErrorMessage } from "@/types/error";
import { ForumCategory, ForumPost, ForumReply, ForumCategoryData, ForumPostData, ForumReplyData } from "@/types/forum";
import { UserProfile } from "./UserService"; // For potential author joins

/**
 * @fileoverview Service for interacting with the forum backend (tables and RPCs).
 */

export const ForumService = {

  // == Category Functions ==

  /**
   * Fetches all forum categories, ordered by display_order.
   * @returns {Promise<ForumCategory[]>}
   */
  async getCategories(): Promise<ForumCategory[]> {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching forum categories:", error);
      toast.error(`Error fetching categories: ${getErrorMessage(error)}`);
      return [];
    }
  },

  /**
   * Creates or updates a forum category (Admin only).
   * Uses the manage_forum_category RPC function.
   * @param {ForumCategoryData} categoryData - Category data including optional id for updates.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async saveCategory(categoryData: ForumCategoryData): Promise<boolean> {
    try {
      // Assuming manage_forum_category handles both create (id=null) and update (id provided)
      const { error } = await supabase.rpc('manage_forum_category', {
        p_id: categoryData.id || null,
        p_name: categoryData.name,
        p_description: categoryData.description,
        p_rules: categoryData.rules,
        p_display_order: categoryData.display_order,
        p_delete: false // Explicitly not deleting here
      });
      if (error) throw error;
      toast.success(`Category ${categoryData.id ? 'updated' : 'created'} successfully`);
      return true;
    } catch (error) {
      console.error("Error saving forum category:", error);
      toast.error(`Error saving category: ${getErrorMessage(error)}`);
      return false;
    }
  },

  /**
   * Deletes a forum category (Admin only).
   * Uses the manage_forum_category RPC function.
   * @param {string} categoryId - The ID of the category to delete.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async deleteCategory(categoryId: string): Promise<boolean> {
    try {
      // Use the same RPC but set p_delete to true and pass minimal other data
      const { error } = await supabase.rpc('manage_forum_category', {
        p_id: categoryId,
        p_name: '', // Required by function signature? Provide dummy if needed
        p_description: null,
        p_rules: null,
        p_display_order: 0,
        p_delete: true
      });
      if (error) throw error;
      toast.success("Category deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting forum category:", error);
      toast.error(`Error deleting category: ${getErrorMessage(error)}`);
      return false;
    }
  },

  // == Post Functions ==

  /**
   * Fetches posts for a specific category, ordered by pinned status and last activity.
   * Optionally joins author information.
   * @param {string} categoryId - The ID of the category.
   * @returns {Promise<ForumPost[]>}
   */
  async getPostsByCategory(categoryId: string): Promise<ForumPost[]> {
     // Define the select query, potentially joining author profile
     const selectQuery = `
       *,
       author:profiles ( id, name, avatar_url )
     `;
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(selectQuery)
        .eq('category_id', categoryId)
        .eq('is_deleted', false)
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      // Cast author to the correct type if joined
      return (data || []).map(post => ({
          ...post,
          author: post.author as unknown as Pick<UserProfile, 'id' | 'name'> | null // Removed avatarUrl
      }));
    } catch (error) {
      console.error("Error fetching posts by category:", error);
      toast.error(`Error fetching posts: ${getErrorMessage(error)}`);
      return [];
    }
  },

  /**
   * Fetches a single post by its ID, optionally joining author info.
   * @param {string} postId - The ID of the post.
   * @returns {Promise<ForumPost | null>}
   */
  async getPostById(postId: string): Promise<ForumPost | null> {
    const selectQuery = `
      *,
      author:profiles ( id, name, avatar_url )
    `;
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(selectQuery)
        .eq('id', postId)
        .eq('is_deleted', false) // Optionally allow fetching deleted posts for admins?
        .single();

      if (error) {
        // Handle 'PGRST116' (resource not found) gracefully
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
       // Cast author
       return data ? { ...data, author: data.author as unknown as Pick<UserProfile, 'id' | 'name'> | null } : null; // Removed avatarUrl
    } catch (error) {
      console.error("Error fetching post by ID:", error);
      toast.error(`Error fetching post: ${getErrorMessage(error)}`);
      return null;
    }
  },

  /**
   * Creates a new forum post using the RPC function.
   * @param {ForumPostData} postData - Data for the new post.
   * @returns {Promise<string | null>} The ID of the new post or null on failure.
   */
  async createPost(postData: ForumPostData): Promise<string | null> {
    try {
      const { data: postId, error } = await supabase.rpc('create_forum_post', {
        p_category_id: postData.category_id,
        p_title: postData.title,
        p_content: postData.content
      });
      if (error) throw error;
      toast.success("Post created successfully");
      return postId;
    } catch (error) {
      console.error("Error creating forum post:", error);
      toast.error(`Error creating post: ${getErrorMessage(error)}`);
      return null;
    }
  },

  /**
   * Pins or unpins a forum post (Admin only).
   * Uses the pin_forum_post RPC function.
   * @param {string} postId - The ID of the post.
   * @param {boolean} pinStatus - True to pin, false to unpin.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async pinPost(postId: string, pinStatus: boolean): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('pin_forum_post', {
        p_post_id: postId,
        p_pin_status: pinStatus
      });
      if (error) throw error;
      toast.success(`Post ${pinStatus ? 'pinned' : 'unpinned'} successfully`);
      return true;
    } catch (error) {
      console.error("Error pinning/unpinning post:", error);
      toast.error(`Error updating pin status: ${getErrorMessage(error)}`);
      return false;
    }
  },

  /**
   * Deletes (soft) a forum post (Admin only).
   * Uses the delete_forum_post RPC function.
   * @param {string} postId - The ID of the post to delete.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('delete_forum_post', { p_post_id: postId });
      if (error) throw error;
      toast.success("Post deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting forum post:", error);
      toast.error(`Error deleting post: ${getErrorMessage(error)}`);
      return false;
    }
  },

  // == Reply Functions ==

  /**
   * Fetches replies for a specific post, ordered by creation date.
   * Optionally joins author information.
   * @param {string} postId - The ID of the post.
   * @returns {Promise<ForumReply[]>}
   */
  async getRepliesByPost(postId: string): Promise<ForumReply[]> {
    const selectQuery = `
      *,
      author:profiles ( id, name, avatar_url )
    `;
    try {
      const { data, error } = await supabase
        .from('forum_replies')
        .select(selectQuery)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
       // Cast author
       return (data || []).map(reply => ({
           ...reply,
           author: reply.author as unknown as Pick<UserProfile, 'id' | 'name'> | null // Removed avatarUrl
       }));
    } catch (error) {
      console.error("Error fetching replies:", error);
      toast.error(`Error fetching replies: ${getErrorMessage(error)}`);
      return [];
    }
  },

  /**
   * Creates a new forum reply using the RPC function.
   * This RPC should handle updating post activity and sending notifications.
   * @param {ForumReplyData} replyData - Data for the new reply.
   * @returns {Promise<string | null>} The ID of the new reply or null on failure.
   */
  async createReply(replyData: ForumReplyData): Promise<string | null> {
    try {
      const { data: replyId, error } = await supabase.rpc('create_forum_reply', {
        p_post_id: replyData.post_id,
        p_content: replyData.content
      });
      if (error) throw error;
      toast.success("Reply posted successfully");
      return replyId;
    } catch (error) {
      console.error("Error creating forum reply:", error);
      toast.error(`Error posting reply: ${getErrorMessage(error)}`);
      return null;
    }
  },

  /**
   * Deletes (soft) a forum reply (Admin only).
   * Uses the delete_forum_reply RPC function.
   * @param {string} replyId - The ID of the reply to delete.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async deleteReply(replyId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('delete_forum_reply', { p_reply_id: replyId });
      if (error) throw error;
      toast.success("Reply deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting forum reply:", error);
      toast.error(`Error deleting reply: ${getErrorMessage(error)}`);
      return false;
    }
  },
};