# PHOTOBOOK ADMIN UPLOAD + HERO/GALLERY IMPLEMENTATION
## Status: 🚀 IN PROGRESS (Plan Approved ✅)

## Backend (Priority 1)
- [✅] 1. Create `photobook-api/src/Controller/Api/AdminPhotoController.php` (upload/CRUD /admin/photos)
- [✅] 2. Create `photobook-api/src/Controller/Api/AdminAlbumController.php` (/admin/albums)
- [✅] 3. Implement `PhotoRepository.php` methods (findPublicPhotos, findFeaturedPhotos, etc.)
- [✅] 4. Create `config/routes/admin_photo.yaml` + `admin_album.yaml`
- [✅] 5. Edit `config/routes.yaml` (import new routes)
- [ ] 6. Install thumbnails: `cd photobook-api && composer require liip/imagine-bundle`
- [ ] 7. Cache clear: `php bin/console cache:clear`

## Frontend (Minor)
- [ ] 8. Verify/edit `HomePage.jsx` (dynamic hero from /api/gallery/featured)
- [ ] 9. Test PhotosManagement.jsx upload flow

## Testing
- [ ] 10. Create/test ROLE_EMPLOYE user
- [ ] 11. Full flow: Admin upload → toggle hero → HomePage/Gallery update
- [ ] 12. Frontend dev server: `npm run dev`

## Commands to run after each backend change:
```
cd photobook-api
composer dump-autoload
php bin/console cache:clear
php bin/console doctrine:schema:validate
```

**Current Step: 6/12 - Install Liip Imagine**
