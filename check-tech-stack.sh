#!/bin/bash

echo "🔍 TECH STACK COMPLIANCE AUDIT"
echo "================================"
echo ""

# Check Apollo Client v4 imports
echo "1. Apollo Client v4 Imports:"
echo "   Checking for correct import syntax..."
WRONG_IMPORTS=$(grep -r "from '@apollo/client'" app/\(pages\) --include="*.tsx" 2>/dev/null | grep -v "from '@apollo/client/react'" | wc -l)
CORRECT_IMPORTS=$(grep -r "from '@apollo/client/react'" app/\(pages\) --include="*.tsx" 2>/dev/null | wc -l)
echo "   ✅ Correct imports (from '@apollo/client/react'): $CORRECT_IMPORTS"
echo "   ⚠️  Wrong imports (from '@apollo/client'): $WRONG_IMPORTS"
echo ""

# Check for 'use client' directive
echo "2. Client Components:"
TOTAL_PAGES=$(find app/\(pages\) -name "*.tsx" | wc -l)
CLIENT_PAGES=$(grep -l "'use client'" app/\(pages\)/**/*.tsx 2>/dev/null | wc -l)
echo "   Total pages: $TOTAL_PAGES"
echo "   Pages with 'use client': $CLIENT_PAGES"
echo ""

# Check Material-UI imports
echo "3. Material-UI Imports:"
MUI_V6=$(grep -r "@mui/material" app/\(pages\) --include="*.tsx" 2>/dev/null | wc -l)
echo "   @mui/material imports: $MUI_V6"
echo ""

# Check GraphQL queries/mutations
echo "4. GraphQL Integration:"
GRAPHQL_PAGES=$(grep -l "useQuery\|useMutation\|useLazyQuery" app/\(pages\) --include="*.tsx" 2>/dev/null | wc -l)
echo "   Pages using GraphQL hooks: $GRAPHQL_PAGES"
echo ""

# Check Indonesian field names in GraphQL
echo "5. Indonesian Field Names (Sample Check):"
INDO_FIELDS=$(grep -r "namaLengkap\|noHP\|statusPembayaran\|penggunaanAir" app/\(pages\) --include="*.tsx" 2>/dev/null | wc -l)
echo "   Indonesian field usage: $INDO_FIELDS occurrences"
echo ""

echo "================================"
echo "Detailed check starting..."
echo ""

