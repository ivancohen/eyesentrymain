#!/bin/bash
echo "==================================================="
echo "Creating Specialist Response Order Restore Point"
echo "==================================================="
echo

echo "Creating database restore point..."
cd supabase
npx supabase sql -f create_specialist_response_order_restore_point.sql

echo
echo "Done! The specialist response order restore point has been created."
echo "To restore the system to this state, run:"
echo "  ./restore-specialist-response-order.sh"
echo