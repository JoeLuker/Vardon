#!/bin/bash

# Architecture principles validation script
# This script checks for common architecture violations in the codebase

echo "🔍 Checking for architecture violations..."

# Directory to search in
DIR="src"

# Check for duplicate implementations (Enhanced, New, V2 classes)
echo -e "\n📋 Checking for duplicate implementations..."
ENHANCED_FILES=$(grep -r "class Enhanced" --include="*.ts" --include="*.js" $DIR | wc -l)
NEW_FILES=$(grep -r "class New" --include="*.ts" --include="*.js" $DIR | wc -l)
V2_FILES=$(grep -r "class.*V[0-9]" --include="*.ts" --include="*.js" $DIR | wc -l)

if [ $ENHANCED_FILES -gt 0 ] || [ $NEW_FILES -gt 0 ] || [ $V2_FILES -gt 0 ]; then
  echo "❌ Found potential duplicate implementations:"
  [ $ENHANCED_FILES -gt 0 ] && echo "  - $ENHANCED_FILES classes with 'Enhanced' prefix"
  [ $NEW_FILES -gt 0 ] && echo "  - $NEW_FILES classes with 'New' prefix"
  [ $V2_FILES -gt 0 ] && echo "  - $V2_FILES classes with version numbers"
  
  # Show the actual files
  echo -e "\n📋 Details:"
  grep -r "class Enhanced" --include="*.ts" --include="*.js" $DIR
  grep -r "class New" --include="*.ts" --include="*.js" $DIR
  grep -r "class.*V[0-9]" --include="*.ts" --include="*.js" $DIR
else
  echo "✅ No duplicate implementation classes found"
fi

# Check for .new.ts files
echo -e "\n📋 Checking for .new.ts files..."
NEW_TS_FILES=$(find $DIR -name "*.new.ts" | wc -l)

if [ $NEW_TS_FILES -gt 0 ]; then
  echo "❌ Found $NEW_TS_FILES .new.ts files:"
  find $DIR -name "*.new.ts"
else
  echo "✅ No .new.ts files found"
fi

# Check for direct Supabase access
echo -e "\n📋 Checking for direct Supabase access in components..."
DIRECT_DB_ACCESS=$(grep -r "from('.*').select" --include="*.svelte" --include="*.ts" --exclude="*supabase*" --exclude="*gameRules.api*" $DIR | wc -l)

if [ $DIRECT_DB_ACCESS -gt 0 ]; then
  echo "❌ Found $DIRECT_DB_ACCESS instances of direct database access:"
  grep -r "from('.*').select" --include="*.svelte" --include="*.ts" --exclude="*supabase*" --exclude="*gameRules.api*" $DIR
else
  echo "✅ No direct database access found in components"
fi

# Check for missing capability interfaces
echo -e "\n📋 Checking for capabilities missing interfaces..."
for CAPABILITY_DIR in $(find $DIR -type d -name "*Capability*"); do
  if [ ! -f "$CAPABILITY_DIR/types.ts" ]; then
    echo "❌ Missing types.ts in: $CAPABILITY_DIR"
  fi
done

# Check for duplicate readme files
echo -e "\n📋 Checking for duplicate readme files..."
find $DIR -name "README*.md" | sort | uniq -c | sort -nr | awk '$1 > 1 {print}'

echo -e "\n🏁 Architecture check complete!"