# Gallery Categories Feature Update

## Overview
Updated the salon photo gallery system to support categorized photos similar to hotel booking apps (like the OYO UI shared). Photos can now be organized into categories: Interior, Reception, Services, and Exterior.

## Changes Made

### Frontend Changes

#### 1. SalonProfile.tsx
- **Hero Banner Enhancement**: Updated the hero banner to display category thumbnails at the bottom
- Added photo count badge showing current photo position (e.g., "1/29")
- Category thumbnails show preview images for each category (Interior, Reception, Services, Exterior)
- Each thumbnail displays the category name overlaid on the image
- Imported `ImageIcon` from lucide-react for the photo count badge

#### 2. GalleryManager.tsx
- **Category Selection**: Added category selector in the upload dialog
- Users can now choose which category to assign when uploading photos
- **Organized Display**: Photos are now grouped by category in the gallery view
- Each category section shows the category name and photo count
- Uncategorized photos are shown in an "Other" section
- **Upload Mutation**: Updated to send category information with each photo upload
- Default category is set to "interior" if not specified

### Backend Changes

#### 1. db.ts (MongoDB Schema)
- Added `category` field to `salonPhotoSchema`
- Category is an enum with values: 'interior', 'reception', 'services', 'exterior'
- Default value is 'interior'

#### 2. routes.ts
- Updated photo upload endpoint to accept and save the `category` field
- Category is extracted from `req.body.category` with a default of 'interior'

## Photo Categories

The system supports four main categories:

1. **Interior** - Main salon interior, styling areas, ambiance
2. **Reception** - Reception desk, waiting area, entrance
3. **Services** - Service stations, equipment, treatment areas
4. **Exterior** - Building facade, parking, outdoor signage

## User Experience

### For Salon Owners (Upload)
1. Click "Add Photos" button in Gallery Manager
2. Select a category (Interior, Reception, Services, or Exterior)
3. Choose one or more photos to upload
4. Photos are automatically organized by category

### For Customers (View)
1. Main hero image shows the first photo
2. Category thumbnails at the bottom allow quick preview of different areas
3. Photo count badge shows total number of photos available
4. Clean, organized presentation similar to popular booking apps

## Technical Notes

- The database uses MongoDB (Mongoose), not PostgreSQL
- Category field is optional and defaults to 'interior'
- Existing photos without a category will appear in the "Other" section
- The UI gracefully handles missing categories by using the first available photo as fallback

## Migration

No database migration is required. The new `category` field is optional and will be automatically added to new photo uploads. Existing photos will continue to work without the category field.
