import { useEffect, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import useUIStore from '../../stores/uiStore';

const PhotoLightbox = () => {
  const { lightbox, closeLightbox, setLightboxIndex } = useUIStore();

  return (
    <Lightbox
      open={lightbox.isOpen}
      close={closeLightbox}
      index={lightbox.currentIndex}
      slides={lightbox.images.map(img => ({
        src: img.src || img.filePath,
        alt: img.alt || 'Photo',
        width: img.width || 1920,
        height: img.height || 1080,
      }))}
      plugins={[Zoom, Fullscreen, Slideshow, Thumbnails]}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 2,
        keyboardMoveDistance: 50,
        wheelZoomDistanceFactor: 100,
        pinchZoomDistanceFactor: 100,
        scrollToZoom: true,
      }}
      animation={{ fade: 300, swipe: 250 }}
      carousel={{
        finite: false,
        preload: 2,
      }}
      on={{
        view: ({ index }) => setLightboxIndex(index),
      }}
    />
  );
};

export default PhotoLightbox;
