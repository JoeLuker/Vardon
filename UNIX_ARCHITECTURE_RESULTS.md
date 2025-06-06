# Unix Architecture Compliance Report

Generated on Fri May 9 14:33:27 MDT 2025

This report identifies areas where the codebase could better comply with Unix architecture principles.

## Direct Supabase Imports

⚠️ Found 1 files with direct imports from supabaseClient.ts

Files with direct Supabase imports:

```
  src/lib/domain/application-new.ts:import { supabase } from '$lib/db/supabaseClient';
```

## Direct Database Access Patterns

⚠️ Found 1 instances of `\.from(.*)\.select`

Files with pattern `\.from(.*)\.select`:

```
  src/lib/domain/capabilities/database/DatabaseDriver.test.ts:        mockSupabaseClient.from().select().eq().maybeSingle.mockResolvedValueOnce({ data: null, error: null });
```

## getSupabaseClient Usage

⚠️ Found 3 instances of getSupabaseClient

Files using getSupabaseClient:

```
  src/lib/db/gameRules.api.ts:  getSupabaseClient(): SupabaseClient<Database> {
  src/lib/db/gameRules.api.ts:    console.warn('DEPRECATED: getSupabaseClient() is deprecated and will be removed in a future version.');
  src/lib/db/gameRules.api.ts:   * REMOVED: getSupabaseClient() method has been removed as part of the transition to Unix-style
```

## Kernel File Operations

🔍 Found 1057 total kernel file operations
🔍 Found 0 files using kernel file operations

## Unix-style File Paths

🔍 Found 242 total Unix-style file paths
🔍 Found 0 files using Unix-style file paths

## File Descriptor Management

🔍 Found 206 kernel.open calls
🔍 Found 207 kernel.close calls
🔍 Found 0 try/finally blocks with kernel.close
⚠️ Found 1 more close calls than open calls - may indicate code issues
⚠️ Found 206 open calls that may not be in try/finally blocks

## Unix Architecture Compliance Score

### Score: 100 / 100

### Grade: A

#### Score Breakdown:

- Total violations found: 5

  - Direct Supabase imports: 1
  - Direct database access patterns: 1
  - getSupabaseClient usage: 3

- Total compliance patterns found: 655
  - kernel.open calls: 206
  - kernel.close calls: 207
  - Unix-style file paths: 242
  - try/finally blocks with kernel.close: 0

## Recommendations

1. **Remove direct Supabase imports**: Replace Version: ImageMagick 7.1.1-47 Q16-HDRI aarch64 22763 https://imagemagick.org
   Copyright: (C) 1999 ImageMagick Studio LLC
   License: https://imagemagick.org/script/license.php
   Features: Cipher DPC HDRI Modules OpenMP
   Delegates (built-in): bzlib fontconfig freetype heic jng jp2 jpeg jxl lcms lqr ltdl lzma openexr png raw tiff webp xml zlib zstd
   Compiler: clang (16.0.0)
   Usage: import [options ...] [ file ]

Image Settings:
-adjoin join images into a single multi-image file
-border include window border in the output image
-channel type apply option to select image channels
-colorspace type alternate image colorspace
-comment string annotate image with comment
-compress type type of pixel compression when writing the image
-define format:option
define one or more image format options
-density geometry horizontal and vertical density of the image
-depth value image depth
-descend obtain image by descending window hierarchy
-display server X server to contact
-dispose method layer disposal method
-dither method apply error diffusion to image
-delay value display the next image after pausing
-encipher filename convert plain pixels to cipher pixels
-endian type endianness (MSB or LSB) of the image
-encoding type text encoding type
-filter type use this filter when resizing an image
-format "string" output formatted image characteristics
-frame include window manager frame
-gravity direction which direction to gravitate towards
-identify identify the format and characteristics of the image
-interlace type None, Line, Plane, or Partition
-interpolate method pixel color interpolation method
-label string assign a label to an image
-limit type value Area, Disk, Map, or Memory resource limit
-monitor monitor progress
-page geometry size and location of an image canvas
-pause seconds seconds delay between snapshots
-pointsize value font point size
-quality value JPEG/MIFF/PNG compression level
-quiet suppress all warning messages
-regard-warnings pay attention to warning messages
-repage geometry size and location of an image canvas
-respect-parentheses settings remain in effect until parenthesis boundary
-sampling-factor geometry
horizontal and vertical sampling factor
-scene value image scene number
-screen select image from root window
-seed value seed a new sequence of pseudo-random numbers
-set property value set an image property
-silent operate silently, i.e. don't ring any bells
-snaps value number of screen snapshots
-support factor resize support: > 1.0 is blurry, < 1.0 is sharp
-synchronize synchronize image to storage device
-taint declare the image as modified
-transparent-color color
transparent color
-treedepth value color tree depth
-verbose print detailed information about the image
-virtual-pixel method
Constant, Edge, Mirror, or Tile
-window id select window with this id or name
root selects whole screen

Image Operators:
-annotate geometry text
annotate the image with text
-colors value preferred number of colors in the image
-crop geometry preferred size and location of the cropped image
-encipher filename convert plain pixels to cipher pixels
-extent geometry set the image size
-geometry geometry preferred size or location of the image
-help print program options
-monochrome transform image to black and white
-negate replace every pixel with its complementary color
-quantize colorspace reduce colors in this colorspace
-resize geometry resize the image
-rotate degrees apply Paeth rotation to the image
-strip strip image of all profiles and comments
-thumbnail geometry create a thumbnail of the image
-transparent color make this color transparent within the image
-trim trim image edges
-type type image type

Miscellaneous Options:
-debug events display copious debugging information
-help print program options
-list type print a list of supported option arguments
-log format format of debugging information
-version print version information

By default, 'file' is written in the MIFF image format. To
specify a particular image format, precede the filename with an image
format name and a colon (i.e. ps:image) or specify the image type as
the filename suffix (i.e. image.ps). Specify 'file' as '-' for
standard input or output. with Unix file operations using the kernel. 2. **Eliminate direct database queries**: Replace direct Supabase queries with kernel file operations:

- Replace with
- Replace with
- Replace with
- Replace with special write operation with flag

3. **Remove getSupabaseClient usage**: Replace calls to with kernel file operations.
4. **Improve error handling**: Ensure all file operations use try/finally blocks to properly close file descriptors.
5. **Standardize file paths**: Use consistent Unix-style file paths for all resources:
   - Character data:
   - Character abilities:
   - Schema operations:
   - Entity operations:
6. **Add ESLint rules**: Implement ESLint rules to enforce Unix architecture principles.
7. **Document file paths**: Document all supported file paths in a central location.
8. **Create test suite**: Add tests to verify Unix architecture compliance.
9. **Review for more opportunities**: Identify additional areas where the Unix file abstraction can be applied.
