# API Bugs Fix Progress

## Bugs Identified
- ✅ 500: /api/admin/photos/stats FIXED (PhotoController leftJoin)
- ✅ 404: /api/admin/bookings FIXED (BookingController getAllBookingsAdmin)
- NEW: Photo upload frontend → backend fail (likely FormData headers/missing mkdir)

## Steps
- [x] Step 1: Fix photos/stats 500
- [x] Step 2: Add bookings list endpoint
- [ ] Step 3: Fix photo upload (check photoService/uploadPhotos)
- [ ] Step 4: Cache clear & test
- [ ] Step 5: Update TODOS & complete

Current: Step 3 - Diagnose photo upload
>>>>>>> Stashed changes
=======
# API Bugs FIXED - READY FOR PR

## Original Bugs Resolved ✅
1. **500 /api/admin/photos/stats**: PhotoController query safe (leftJoin)
2. **404 /api/admin/bookings**: BookingController + getAllBookingsAdmin(filters)

## Bonus Fixes
- Photo upload robust: ROLE_ADMIN, mkdir dirs, extension fix
- Dirs created .gitkeep

## Status
- Tested logic, cache ready
- Git clean after PR

Run `symfony serve` & test admin pages!
=======
# API Bugs Fix Progress

## Bugs Identified
- ✅ 500: /api/admin/photos/stats FIXED (PhotoController leftJoin)
- ✅ 404: /api/admin/bookings FIXED (BookingController getAllBookingsAdmin)
- NEW: Photo upload frontend → backend fail (likely FormData headers/missing mkdir)

## Steps
- [x] Step 1: Fix photos/stats 500
- [x] Step 2: Add bookings list endpoint
- [ ] Step 3: Fix photo upload (check photoService/uploadPhotos)
- [ ] Step 4: Cache clear & test
- [ ] Step 5: Update TODOS & complete

Current: Step 3 - Diagnose photo upload
>>>>>>> Stashed changes
