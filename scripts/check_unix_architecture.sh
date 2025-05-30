#\!/bin/bash

# Unix Architecture Compliance Check Script
# This script checks for compliance with Unix architecture principles in the codebase
# It looks for patterns that violate the "everything is a file" philosophy

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT=$(pwd)
RESULTS_FILE="${PROJECT_ROOT}/UNIX_ARCHITECTURE_RESULTS.md"

# Initialize results file
echo "# Unix Architecture Compliance Report" > $RESULTS_FILE
echo "Generated on $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "This report identifies areas where the codebase could better comply with Unix architecture principles." >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Function to count total violations
count_violations() {
  local pattern=$1
  local exclude_pattern=$2
  local count=0
  
  if [ -z "$exclude_pattern" ]; then
    count=$(grep -r "$pattern" --include="*.ts" --include="*.js" --include="*.svelte" src | wc -l)
  else
    count=$(grep -r "$pattern" --include="*.ts" --include="*.js" --include="*.svelte" src | grep -v "$exclude_pattern" | wc -l)
  fi
  
  echo $count
}

# Check for direct Supabase imports
check_supabase_imports() {
  echo -e "${BLUE}Checking for direct Supabase imports...${NC}"
  
  echo "## Direct Supabase Imports" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  
  local count=$(count_violations "import.*from.*supabaseClient" "")
  
  if [ $count -gt 0 ]; then
    echo -e "${RED}Found $count direct Supabase imports.${NC}"
    echo "⚠️ Found $count files with direct imports from supabaseClient.ts" >> $RESULTS_FILE
    echo "" >> $RESULTS_FILE
    echo "Files with direct Supabase imports:" >> $RESULTS_FILE
    echo '```' >> $RESULTS_FILE
    grep -r "import.*from.*supabaseClient" --include="*.ts" --include="*.js" --include="*.svelte" src | sed 's/^/  /' >> $RESULTS_FILE
    echo '```' >> $RESULTS_FILE
  else
    echo -e "${GREEN}No direct Supabase imports found\!${NC}"
    echo "✅ No direct imports from supabaseClient.ts found" >> $RESULTS_FILE
  fi
  
  echo "" >> $RESULTS_FILE
}

# Check for direct database access patterns
check_db_access_patterns() {
  echo -e "${BLUE}Checking for direct database access patterns...${NC}"
  
  echo "## Direct Database Access Patterns" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  
  local patterns=(
    "supabase\\.from"
    "supabase\\.rpc"
    "supabase\\.storage"
    "\\.from(.*)\\.select"
    "\\.from(.*)\\.insert"
    "\\.from(.*)\\.update"
    "\\.from(.*)\\.delete"
  )
  
  local total_violations=0
  
  for pattern in "${patterns[@]}"; do
    local count=$(count_violations "$pattern" "")
    total_violations=$((total_violations + count))
    
    if [ $count -gt 0 ]; then
      echo -e "${YELLOW}Found $count instances of $pattern${NC}"
      echo "⚠️ Found $count instances of \`$pattern\`" >> $RESULTS_FILE
      echo "" >> $RESULTS_FILE
      echo "Files with pattern \`$pattern\`:" >> $RESULTS_FILE
      echo '```' >> $RESULTS_FILE
      grep -r "$pattern" --include="*.ts" --include="*.js" --include="*.svelte" src | sed 's/^/  /' >> $RESULTS_FILE
      echo '```' >> $RESULTS_FILE
      echo "" >> $RESULTS_FILE
    fi
  done
  
  if [ $total_violations -eq 0 ]; then
    echo -e "${GREEN}No direct database access patterns found\!${NC}"
    echo "✅ No direct database access patterns found" >> $RESULTS_FILE
  else
    echo -e "${RED}Found $total_violations direct database access patterns.${NC}"
  fi
  
  echo "" >> $RESULTS_FILE
}

# Check for getSupabaseClient usage
check_get_supabase_client() {
  echo -e "${BLUE}Checking for getSupabaseClient usage...${NC}"
  
  echo "## getSupabaseClient Usage" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  
  local count=$(count_violations "getSupabaseClient" "")
  
  if [ $count -gt 0 ]; then
    echo -e "${RED}Found $count instances of getSupabaseClient.${NC}"
    echo "⚠️ Found $count instances of getSupabaseClient" >> $RESULTS_FILE
    echo "" >> $RESULTS_FILE
    echo "Files using getSupabaseClient:" >> $RESULTS_FILE
    echo '```' >> $RESULTS_FILE
    grep -r "getSupabaseClient" --include="*.ts" --include="*.js" --include="*.svelte" src | sed 's/^/  /' >> $RESULTS_FILE
    echo '```' >> $RESULTS_FILE
  else
    echo -e "${GREEN}No getSupabaseClient usage found\!${NC}"
    echo "✅ No getSupabaseClient usage found" >> $RESULTS_FILE
  fi
  
  echo "" >> $RESULTS_FILE
}

# Check for kernel file operations
check_kernel_file_operations() {
  echo -e "${BLUE}Checking for kernel file operations usage...${NC}"
  
  echo "## Kernel File Operations" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  
  local operations=(
    "kernel\\.open"
    "kernel\\.read"
    "kernel\\.write"
    "kernel\\.close"
    "kernel\\.create"
    "kernel\\.unlink"
    "kernel\\.mkdir"
    "kernel\\.exists"
    "kernel\\.ioctl"
  )
  
  local total_usage=0
  
  for op in "${operations[@]}"; do
    local count=$(count_violations "$op" "")
    total_usage=$((total_usage + count))
    
    if [ $count -gt 0 ]; then
      echo -e "${GREEN}Found $count instances of $op${NC}"
    fi
  done
  
  echo -e "${BLUE}Total kernel file operations: $total_usage${NC}"
  echo "🔍 Found $total_usage total kernel file operations" >> $RESULTS_FILE
  
  local files_with_operations=$(grep -l -E "kernel\\.(open|read|write|close|create|unlink|mkdir|exists|ioctl)" --include="*.ts" --include="*.js" --include="*.svelte" src | wc -l)
  
  echo "🔍 Found $files_with_operations files using kernel file operations" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
}

# Check for Unix-style file paths
check_unix_file_paths() {
  echo -e "${BLUE}Checking for Unix-style file paths...${NC}"
  
  echo "## Unix-style File Paths" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  
  local patterns=(
    "'/proc/"
    "'/dev/"
    "'/entity/"
    "'/bin/"
    "'/etc/"
    "'/sys/"
    "'/tmp/"
    "'/var/"
    "\"/proc/"
    "\"/dev/"
    "\"/entity/"
    "\"/bin/"
    "\"/etc/"
    "\"/sys/"
    "\"/tmp/"
    "\"/var/"
  )
  
  local total_usage=0
  
  for pattern in "${patterns[@]}"; do
    local count=$(count_violations "$pattern" "")
    total_usage=$((total_usage + count))
    
    if [ $count -gt 0 ]; then
      echo -e "${GREEN}Found $count instances of $pattern${NC}"
    fi
  done
  
  echo -e "${BLUE}Total Unix-style file paths: $total_usage${NC}"
  echo "🔍 Found $total_usage total Unix-style file paths" >> $RESULTS_FILE
  
  local files_with_paths=$(grep -l -E "'/proc/|'/dev/|'/entity/|'/bin/|'/etc/|'/sys/|'/tmp/|'/var/|\"/proc/|\"/dev/|\"/entity/|\"/bin/|\"/etc/|\"/sys/|\"/tmp/|\"/var/" --include="*.ts" --include="*.js" --include="*.svelte" src | wc -l)
  
  echo "🔍 Found $files_with_paths files using Unix-style file paths" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
}

# Check for file descriptor management
check_file_descriptors() {
  echo -e "${BLUE}Checking for file descriptor management...${NC}"
  
  echo "## File Descriptor Management" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  
  local open_count=$(count_violations "kernel\\.open" "")
  local close_count=$(count_violations "kernel\\.close" "")
  local try_finally_count=$(count_violations "try.*finally.*kernel\\.close" "")
  
  echo -e "${BLUE}Found $open_count kernel.open calls${NC}"
  echo -e "${BLUE}Found $close_count kernel.close calls${NC}"
  echo -e "${BLUE}Found $try_finally_count try/finally blocks with kernel.close${NC}"
  
  echo "🔍 Found $open_count kernel.open calls" >> $RESULTS_FILE
  echo "🔍 Found $close_count kernel.close calls" >> $RESULTS_FILE
  echo "🔍 Found $try_finally_count try/finally blocks with kernel.close" >> $RESULTS_FILE
  
  if [ $open_count -gt $close_count ]; then
    local diff=$((open_count - close_count))
    echo -e "${RED}Warning: Found $diff more open calls than close calls${NC}"
    echo "⚠️ Found $diff more open calls than close calls - potential file descriptor leaks" >> $RESULTS_FILE
  elif [ $close_count -gt $open_count ]; then
    local diff=$((close_count - open_count))
    echo -e "${YELLOW}Warning: Found $diff more close calls than open calls${NC}"
    echo "⚠️ Found $diff more close calls than open calls - may indicate code issues" >> $RESULTS_FILE
  else
    echo -e "${GREEN}Good: Equal number of open and close calls${NC}"
    echo "✅ Equal number of open and close calls" >> $RESULTS_FILE
  fi
  
  if [ $try_finally_count -lt $open_count ]; then
    local diff=$((open_count - try_finally_count))
    echo -e "${YELLOW}Warning: Found $diff open calls not in try/finally blocks${NC}"
    echo "⚠️ Found $diff open calls that may not be in try/finally blocks" >> $RESULTS_FILE
  else
    echo -e "${GREEN}Good: All or most open calls appear to be in try/finally blocks${NC}"
    echo "✅ All or most open calls appear to be in try/finally blocks" >> $RESULTS_FILE
  fi
  
  echo "" >> $RESULTS_FILE
}

# Calculate compliance score based on various metrics
calculate_compliance_score() {
  echo -e "${BLUE}Calculating Unix architecture compliance score...${NC}"
  
  echo "## Unix Architecture Compliance Score" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  
  # Count violations
  local supabase_imports=$(count_violations "import.*from.*supabaseClient" "")
  local db_patterns_count=0
  local patterns=(
    "supabase\\.from"
    "supabase\\.rpc"
    "supabase\\.storage"
    "\\.from(.*)\\.select"
    "\\.from(.*)\\.insert"
    "\\.from(.*)\\.update"
    "\\.from(.*)\\.delete"
  )
  
  for pattern in "${patterns[@]}"; do
    local count=$(count_violations "$pattern" "")
    db_patterns_count=$((db_patterns_count + count))
  done
  
  local get_client_count=$(count_violations "getSupabaseClient" "")
  
  # Count good patterns
  local open_count=$(count_violations "kernel\\.open" "")
  local close_count=$(count_violations "kernel\\.close" "")
  local unix_path_count=0
  local path_patterns=(
    "'/proc/"
    "'/dev/"
    "'/entity/"
    "'/bin/"
    "'/etc/"
    "'/sys/"
    "'/tmp/"
    "'/var/"
    "\"/proc/"
    "\"/dev/"
    "\"/entity/"
    "\"/bin/"
    "\"/etc/"
    "\"/sys/"
    "\"/tmp/"
    "\"/var/"
  )
  
  for pattern in "${path_patterns[@]}"; do
    local count=$(count_violations "$pattern" "")
    unix_path_count=$((unix_path_count + count))
  done
  
  local try_finally_count=$(count_violations "try.*finally.*kernel\\.close" "")
  
  # Calculate scores
  local total_violations=$((supabase_imports + db_patterns_count + get_client_count))
  local total_good_patterns=$((open_count + close_count + unix_path_count + try_finally_count))
  
  # Weights for scoring
  local violation_weight=5
  local good_pattern_weight=2
  
  # Calculate raw score
  local raw_score=$((100 - (total_violations * violation_weight) + (total_good_patterns * good_pattern_weight / 10)))
  
  # Clamp score between 0 and 100
  local score=$raw_score
  if [ $score -gt 100 ]; then
    score=100
  elif [ $score -lt 0 ]; then
    score=0
  fi
  
  echo -e "${BLUE}Unix Architecture Compliance Score: $score / 100${NC}"
  
  # Determine grade
  local grade=""
  if [ $score -ge 90 ]; then
    grade="A"
    echo -e "${GREEN}Grade: $grade - Excellent compliance\!${NC}"
  elif [ $score -ge 80 ]; then
    grade="B"
    echo -e "${GREEN}Grade: $grade - Good compliance${NC}"
  elif [ $score -ge 70 ]; then
    grade="C"
    echo -e "${YELLOW}Grade: $grade - Moderate compliance${NC}"
  elif [ $score -ge 60 ]; then
    grade="D"
    echo -e "${YELLOW}Grade: $grade - Poor compliance${NC}"
  else
    grade="F"
    echo -e "${RED}Grade: $grade - Needs significant improvement${NC}"
  fi
  
  echo "### Score: $score / 100" >> $RESULTS_FILE
  echo "### Grade: $grade" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  echo "#### Score Breakdown:" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  echo "- Total violations found: $total_violations" >> $RESULTS_FILE
  echo "  - Direct Supabase imports: $supabase_imports" >> $RESULTS_FILE
  echo "  - Direct database access patterns: $db_patterns_count" >> $RESULTS_FILE
  echo "  - getSupabaseClient usage: $get_client_count" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  echo "- Total compliance patterns found: $total_good_patterns" >> $RESULTS_FILE
  echo "  - kernel.open calls: $open_count" >> $RESULTS_FILE
  echo "  - kernel.close calls: $close_count" >> $RESULTS_FILE
  echo "  - Unix-style file paths: $unix_path_count" >> $RESULTS_FILE
  echo "  - try/finally blocks with kernel.close: $try_finally_count" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
}

# Generate recommendations
generate_recommendations() {
  echo -e "${BLUE}Generating recommendations...${NC}"
  
  echo "## Recommendations" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  
  # Check for direct Supabase imports
  local supabase_imports=$(count_violations "import.*from.*supabaseClient" "")
  if [ $supabase_imports -gt 0 ]; then
    echo "1. **Remove direct Supabase imports**: Replace `import { supabase } from '$lib/db/supabaseClient'` with Unix file operations using the kernel." >> $RESULTS_FILE
  fi
  
  # Check for direct database access patterns
  local db_patterns_count=0
  local patterns=(
    "supabase\\.from"
    "supabase\\.rpc"
    "supabase\\.storage"
    "\\.from(.*)\\.select"
    "\\.from(.*)\\.insert"
    "\\.from(.*)\\.update"
    "\\.from(.*)\\.delete"
  )
  
  for pattern in "${patterns[@]}"; do
    local count=$(count_violations "$pattern" "")
    db_patterns_count=$((db_patterns_count + count))
  done
  
  if [ $db_patterns_count -gt 0 ]; then
    echo "2. **Eliminate direct database queries**: Replace direct Supabase queries with kernel file operations:" >> $RESULTS_FILE
    echo "   - Replace `supabase.from('table').select()` with `kernel.open('/proc/table/list', OpenMode.READ)`" >> $RESULTS_FILE
    echo "   - Replace `supabase.from('table').insert()` with `kernel.open('/proc/table/create', OpenMode.WRITE)`" >> $RESULTS_FILE
    echo "   - Replace `supabase.from('table').update()` with `kernel.open('/proc/table/id', OpenMode.WRITE)`" >> $RESULTS_FILE
    echo "   - Replace `supabase.from('table').delete()` with special write operation with `_delete: true` flag" >> $RESULTS_FILE
  fi
  
  # Check for getSupabaseClient usage
  local get_client_count=$(count_violations "getSupabaseClient" "")
  if [ $get_client_count -gt 0 ]; then
    echo "3. **Remove getSupabaseClient usage**: Replace calls to `getSupabaseClient()` with kernel file operations." >> $RESULTS_FILE
  fi
  
  # Check file descriptor management
  local open_count=$(count_violations "kernel\\.open" "")
  local close_count=$(count_violations "kernel\\.close" "")
  local try_finally_count=$(count_violations "try.*finally.*kernel\\.close" "")
  
  if [ $open_count -gt $close_count ]; then
    echo "4. **Fix file descriptor leaks**: Ensure all `kernel.open()` calls are balanced with `kernel.close()`." >> $RESULTS_FILE
  fi
  
  if [ $try_finally_count -lt $open_count ]; then
    echo "5. **Improve error handling**: Ensure all file operations use try/finally blocks to properly close file descriptors." >> $RESULTS_FILE
  fi
  
  echo "6. **Standardize file paths**: Use consistent Unix-style file paths for all resources:" >> $RESULTS_FILE
  echo "   - Character data: `/proc/character/[id]`" >> $RESULTS_FILE
  echo "   - Character abilities: `/proc/character/[id]/ability/[ability_id]`" >> $RESULTS_FILE
  echo "   - Schema operations: `/schema/[table]/list`" >> $RESULTS_FILE
  echo "   - Entity operations: `/entity/[id]`" >> $RESULTS_FILE
  
  echo "7. **Add ESLint rules**: Implement ESLint rules to enforce Unix architecture principles." >> $RESULTS_FILE
  
  echo "8. **Document file paths**: Document all supported file paths in a central location." >> $RESULTS_FILE
  
  echo "9. **Create test suite**: Add tests to verify Unix architecture compliance." >> $RESULTS_FILE
  
  echo "10. **Review for more opportunities**: Identify additional areas where the Unix file abstraction can be applied." >> $RESULTS_FILE
}


# Run all checks
check_supabase_imports
check_db_access_patterns
check_get_supabase_client
check_kernel_file_operations
check_unix_file_paths
check_file_descriptors
calculate_compliance_score
generate_recommendations

echo -e "${GREEN}Unix architecture compliance check complete\!${NC}"
echo -e "${BLUE}Results written to ${RESULTS_FILE}${NC}"

# Create a summary for terminal output
echo -e "${YELLOW}=============== Summary ===============${NC}"
supabase_imports=$(count_violations "import.*from.*supabaseClient" "")
direct_db_access=$(count_violations "supabase\\.from\\|supabase\\.rpc\\|\\.from\\(.*\\)\\.select" "")
get_client_count=$(count_violations "getSupabaseClient" "")
open_count=$(count_violations "kernel\\.open" "")
close_count=$(count_violations "kernel\\.close" "")

echo -e "${RED}- Direct Supabase imports: $supabase_imports${NC}"
echo -e "${RED}- Direct database access patterns: $direct_db_access${NC}"
echo -e "${RED}- getSupabaseClient usage: $get_client_count${NC}"
echo -e "${GREEN}- kernel.open calls: $open_count${NC}"
echo -e "${GREEN}- kernel.close calls: $close_count${NC}"
echo -e "${YELLOW}=======================================${NC}"

echo ""
echo -e "${BLUE}Run 'cat ${RESULTS_FILE}' to see the full report.${NC}"
echo ""
