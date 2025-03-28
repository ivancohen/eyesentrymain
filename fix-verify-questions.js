// Script to fix verify-questions.js TypeScript errors
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function fixVerifyQuestions() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING VERIFY-QUESTIONS.JS");
    console.log("=".repeat(80));
    
    // Path to verify-questions.js
    const filePath = path.join(__dirname, 'src', 'utils', 'verify-questions.js');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log("❌ File not found:", filePath);
      return;
    }
    
    // Backup the original file
    const backupPath = path.join(__dirname, 'src', 'utils', 'verify-questions.js.backup');
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Backed up original file to ${backupPath}`);
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix 1: Rename the file to .ts
    const tsFilePath = path.join(__dirname, 'src', 'utils', 'verify-questions.ts');
    fs.writeFileSync(tsFilePath, content);
    console.log(`✅ Created TypeScript version at ${tsFilePath}`);
    
    // Fix 2: Create a simple JavaScript version without TypeScript syntax
    const jsContent = `// JavaScript version of verify-questions.js
// TypeScript version is available at verify-questions.ts
// This file is a simplified version without TypeScript syntax

import { supabase } from '@/lib/supabase';

// Simple class to verify questions
export class QuestionVerifier {
  constructor() {
    this.questionCache = new Map();
  }
  
  // Fetch questions
  async fetchQuestions() {
    try {
      if (this.questionCache.size > 0) {
        return Array.from(this.questionCache.values());
      }
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      
      // Cache the questions
      if (data) {
        data.forEach(question => {
          this.questionCache.set(question.id, question);
        });
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  }
  
  // Fetch dropdown options
  async fetchDropdownOptions(questionId) {
    try {
      const response = await supabase
        .from('dropdown_options')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });
      
      if (response.error) throw response.error;
      
      const data = response.data;
      return data ?? [];
    } catch (error) {
      console.error(\`Error fetching dropdown options for question \${questionId}:\`, error);
      return [];
    }
  }
  
  // Update question order
  async updateQuestionOrder(questionId, newOrder, pageCategory) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ display_order: newOrder, page_category: pageCategory })
        .eq('id', questionId);
      
      if (error) throw error;
      
      // Clear cache to ensure fresh data
      this.questionCache.clear();
      
      return true;
    } catch (error) {
      console.error('Error updating question order:', error);
      return false;
    }
  }
  
  // Save question
  async saveQuestion(questionData, userId) {
    if (!questionData.question) {
      return { success: false };
    }
    
    try {
      // Add created_by if userId is provided
      if (userId) {
        questionData.created_by = userId;
      }
      
      // Insert or update the question
      const { data, error } = await supabase
        .from('questions')
        .upsert([questionData])
        .select();
      
      if (error) throw error;
      
      // Clear cache to ensure fresh data
      this.questionCache.clear();
      
      return { success: true, id: data?.[0]?.id };
    } catch (error) {
      console.error('Error saving question:', error);
      return { success: false };
    }
  }
  
  // Save multiple questions
  async saveMultipleQuestions(questions, userId) {
    try {
      // Add created_by to each question if userId is provided
      if (userId) {
        questions = questions.map(q => ({ ...q, created_by: userId }));
      }
      
      // Insert or update the questions
      const { data, error } = await supabase
        .from('questions')
        .upsert(questions)
        .select();
      
      if (error) throw error;
      
      // Clear cache to ensure fresh data
      this.questionCache.clear();
      
      return { 
        success: true, 
        ids: data?.map(q => q.id) || [] 
      };
    } catch (error) {
      console.error('Error saving multiple questions:', error);
      return { success: false };
    }
  }
  
  // Log question event
  async logQuestionEvent(eventType, questionId, details) {
    try {
      const { error } = await supabase
        .from('question_events')
        .insert([{
          event_type: eventType,
          question_id: questionId,
          details: details || {}
        }]);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error logging question event:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const questionVerifier = new QuestionVerifier();
`;
    
    // Write the simplified JavaScript version
    fs.writeFileSync(filePath, jsContent);
    console.log(`✅ Created simplified JavaScript version at ${filePath}`);
    
    console.log("\n=".repeat(80));
    console.log("FIX COMPLETED");
    console.log("=".repeat(80));
    console.log("\nThe file has been fixed in two ways:");
    console.log("1. Created a TypeScript version (.ts) with the original content");
    console.log("2. Replaced the JavaScript version (.js) with a simplified version without TypeScript syntax");
    console.log("\nYou can now try building again with:");
    console.log("npm run build");
    
  } catch (error) {
    console.error("\n❌ Error fixing verify-questions.js:", error.message);
    process.exit(1);
  }
}

// Run the function
fixVerifyQuestions()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });