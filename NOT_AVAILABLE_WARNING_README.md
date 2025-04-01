# "Not Available" Warning Implementation

This package adds a warning feature to the patient questionnaire that displays a warning when users select the "Not Available" option for any question. This helps ensure users are aware that selecting "Not Available" may lead to a significantly reduced risk score.

## Files Created/Modified

1. **src/components/questionnaires/QuestionnaireForm.enhanced.tsx**
   - Enhanced version of the QuestionnaireForm component
   - Tracks questions with "Not Available" selected
   - Displays a warning at the top of the form
   - Highlights "Not Available" options in dropdown menus
   - Adds warning tooltips to "Not Available" options

2. **src/components/questionnaires/QuestionnaireContainer.enhanced.tsx**
   - Enhanced version of the QuestionnaireContainer component
   - Uses the enhanced QuestionnaireForm component

3. **src/pages/PatientQuestionnaire.enhanced.tsx**
   - Enhanced version of the PatientQuestionnaire page
   - Uses the enhanced QuestionnaireContainer component

4. **update-app-for-enhanced-questionnaire.js**
   - Script to update App.tsx to use the enhanced PatientQuestionnaire component

## Implementation Details

### Warning Display

The warning is displayed in several ways:

1. **Global Warning Banner**: A warning banner appears at the top of the form when any "Not Available" option is selected, listing all questions with "Not Available" selected.

2. **Visual Highlighting**: 
   - Dropdown fields with "Not Available" selected have an amber/yellow border and background
   - "Not Available" options in dropdown menus are highlighted with amber/yellow text

3. **Warning Tooltips**: 
   - Warning icons appear next to "Not Available" options
   - Tooltips explain that selecting "Not Available" may lead to a reduced risk score

### Technical Implementation

1. **Tracking "Not Available" Selections**:
   ```typescript
   // Track questions with "not available" selected
   const [notAvailableSelections, setNotAvailableSelections] = useState<string[]>([]);
   
   // Update notAvailableSelections whenever answers change
   useEffect(() => {
     const newNotAvailableSelections = Object.entries(answers)
       .filter(([_, value]) => String(value).toLowerCase() === 'not_available' || String(value).toLowerCase() === 'not available')
       .map(([questionId]) => questionId);
     
     setNotAvailableSelections(newNotAvailableSelections);
   }, [answers]);
   ```

2. **Displaying the Warning Banner**:
   ```typescript
   {showNotAvailableWarning && (
     <Alert className="mb-6" variant="default">
       <AlertTriangle className="h-4 w-4 text-amber-500" />
       <AlertDescription className="text-amber-700 bg-amber-50">
         <p className="font-medium mb-1">Warning: "Not Available" options selected</p>
         <p>Please note that selecting "Not Available" for the following questions may lead to a significantly reduced risk score:</p>
         <ul className="list-disc pl-5 mt-1">
           {notAvailableSelections.map(questionId => (
             <li key={questionId}>{getQuestionTextById(questionId)}</li>
           ))}
         </ul>
         <p className="mt-2">If possible, please provide actual values for more accurate results.</p>
       </AlertDescription>
     </Alert>
   )}
   ```

3. **Highlighting "Not Available" Options**:
   ```typescript
   // Check if this is a "not available" option
   const isNotAvailableOption = value.toLowerCase() === 'not_available' || 
                               value.toLowerCase() === 'not available';

   return (
     <SelectItem
       key={value}
       value={value}
       className={isNotAvailableOption ? 'text-amber-700 bg-amber-50' : ''}
     >
       {text}
       {/* Add warning icon for "not available" options */}
       {isNotAvailableOption && (
         <TooltipProvider>
           <Tooltip>
             <TooltipTrigger asChild>
               <AlertTriangle className="h-3 w-3 inline-block ml-1 text-amber-500" />
             </TooltipTrigger>
             <TooltipContent className="max-w-[300px] p-4">
               <p className="text-sm">Selecting "Not Available" may lead to a significantly reduced risk score.</p>
             </TooltipContent>
           </Tooltip>
         </TooltipProvider>
       )}
     </SelectItem>
   );
   ```

## How to Implement

1. **Copy the Enhanced Files**:
   - Copy the enhanced component files to your project

2. **Update App.tsx**:
   - Run the update script to modify App.tsx:
   ```
   node update-app-for-enhanced-questionnaire.js
   ```

3. **Test the Implementation**:
   - Start your development server
   - Navigate to the patient questionnaire
   - Select "Not Available" for any question to see the warning

## Customization

You can customize the warning messages and styling by modifying the following parts of the code:

1. **Warning Message**: Edit the text in the `AlertDescription` component in QuestionnaireForm.enhanced.tsx

2. **Warning Styling**: Modify the CSS classes for the warning elements:
   - `text-amber-700` - Text color
   - `bg-amber-50` - Background color
   - `border-amber-500` - Border color

3. **Warning Conditions**: Modify the condition in the `useEffect` hook that tracks "Not Available" selections if you need to change what triggers the warning.

## Troubleshooting

If you encounter issues:

1. **Component Not Found Errors**: Ensure all the enhanced component files are in the correct locations

2. **Styling Issues**: Check that your project has the necessary UI components and styles imported

3. **Warning Not Appearing**: Verify that your dropdown options use "not_available" or "not available" as their values

4. **Rollback**: If needed, restore App.tsx from the backup created by the update script