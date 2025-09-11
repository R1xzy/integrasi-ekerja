#!/bin/bash

# Script untuk update semua API dari createAuthMiddleware ke requireAuth

API_FILES=(
    "src/app/api/reviews/route.ts"
    "src/app/api/reviews/[id]/route.ts"
    "src/app/api/providers/services/[id]/route.ts"
    "src/app/api/providers/portfolio/route.ts"
    "src/app/api/providers/profile/route.ts"
    "src/app/api/admin/categories/[id]/route.ts"
    "src/app/api/admin/faqs/route.ts"
    "src/app/api/admin/faqs/[id]/route.ts"
)

for file in "${API_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Updating $file..."
        
        # Replace import statement
        sed -i '' 's/import { createAuthMiddleware } from '\''@\/lib\/jwt'\'';/import { requireAuth } from '\''@\/lib\/api-helpers'\'';/g' "$file"
        
        # Replace auth usage patterns
        sed -i '' 's/const authHeader = request\.headers\.get('\''authorization'\'');[[:space:]]*const auth = createAuthMiddleware(\[\[^]]*\]);[[:space:]]*const authResult = auth(authHeader);[[:space:]]*if (!authResult\.success) {[[:space:]]*return createErrorResponse(authResult\.message || '\''Authentication [^'\'']*'\'', authResult\.status || [0-9]*);[[:space:]]*}/const authResult = await requireAuth(request, [role_array]); if (authResult instanceof Response) return authResult;/g' "$file"
        
        echo "Done updating $file"
    else
        echo "File $file not found, skipping..."
    fi
done

echo "All API files have been updated!"
