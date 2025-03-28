# Sync Recommendations Solution

## Understanding the Problem

After thorough investigation, we identified that the core issue with risk assessment recommendations was:

1. The system has **hardcoded database entries** in the `risk_assessment_advice` table
2. Recommendations entered by administrators in the admin panel are stored as **separate entries** in the same table
3. The doctor questionnaire view only shows recommendations from the **hardcoded entries**
4. There was no mechanism to sync content between admin-entered recommendations and hardcoded entries

## Why The Direct SQL Solution Works Best

Instead of trying to modify all the TypeScript code to use a different data access pattern, we've created a database-level solution that:

1. **Maintains the current code** - No risky changes to TypeScript code that could introduce new bugs
2. **Directly addresses the root cause** - Ensures admin-entered recommendations update hardcoded entries
3. **Works automatically** - Once set up, it continuously syncs all future recommendations

## How The Solution Works

Our solution creates a PostgreSQL database trigger that:

1. Activates whenever a recommendation is inserted or updated in the `risk_assessment_advice` table
2. Identifies which hardcoded entry corresponds to the same risk level
3. Updates the hardcoded entry with the same recommendation text
4. Logs the synchronization for verification

## Implementation Details

The SQL script does the following:

1. Creates a view to easily identify hardcoded entries
2. Creates a trigger function that syncs updates from admin entries to hardcoded entries
3. Establishes the trigger to run on inserts and updates
4. Runs a one-time sync of existing admin recommendations

## Benefits of This Approach

1. **Zero code changes** - No TypeScript modifications means no risk of breaking existing functionality
2. **Automatic operation** - Once set up, it works without requiring further intervention
3. **Centralized logic** - The database handles all synchronization logic
4. **Resilient to updates** - The system will continue to work even if code is updated in the future

## Why Other Approaches Didn't Work

1. **Direct RPC functions**: Required code changes and didn't address the underlying issue of duplicate entries
2. **Modifying service pattern**: Would require changes across multiple files, increasing risk
3. **Client-side fixes**: Couldn't guarantee consistent recommendation display

## Testing & Verification

After implementation, you can verify the solution by:

1. Entering distinctive recommendations in the admin panel
2. Viewing a patient questionnaire to see those recommendations 
3. Checking the database to confirm both entries contain the same text

## Conclusion

This SQL-based approach provides the most direct and maintainable solution to the problem. By handling the synchronization at the database level, we ensure that admin-entered recommendations are consistently displayed in the doctor questionnaire view without modifying any application code.