// Gallery Image Management
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('galleryImage')) {
        return; // Gallery not on this page
    }

    const galleryImages = [
        { src: 'assets/images/accident.avif', title: 'Road Accident' },
        { src: 'assets/images/fire.jpg', title: 'Fire Outbreak' },
        { src: 'assets/images/flood.jpeg', title: 'Flood/Disaster' },
        { src: 'assets/images/robbery.webp', title: 'Crime/Robbery' },
        { src: 'assets/images/stealing.jpg', title: 'Theft' }
    ];

    let currentImageIndex = 0;
    const galleryImage = document.getElementById('galleryImage');
    const imageTitle = document.getElementById('imageTitle');
    const imageCounter = document.getElementById('imageCounter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const thumbnails = document.querySelectorAll('.thumbnail');

    // Initialize first thumbnail as active
    if (thumbnails[0]) {
        thumbnails[0].classList.add('active');
    }

    // Function to update gallery display
    function updateGallery(index) {
        // Ensure index is within bounds
        if (index < 0) {
            currentImageIndex = galleryImages.length - 1;
        } else if (index >= galleryImages.length) {
            currentImageIndex = 0;
        } else {
            currentImageIndex = index;
        }

        const image = galleryImages[currentImageIndex];
        
        // Update image with fade animation
        galleryImage.style.animation = 'none';
        setTimeout(() => {
            galleryImage.src = image.src;
            galleryImage.style.animation = 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            imageTitle.textContent = image.title;
            imageCounter.textContent = (currentImageIndex + 1) + ' / ' + galleryImages.length;
        }, 10);

        // Update active thumbnail
        thumbnails.forEach((thumb, idx) => {
            thumb.classList.remove('active');
            if (idx === currentImageIndex) {
                thumb.classList.add('active');
            }
        });
    }

    // Previous button click
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            updateGallery(currentImageIndex - 1);
        });
    }

    // Next button click
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            updateGallery(currentImageIndex + 1);
        });
    }

    // Thumbnail clicks
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', function() {
            updateGallery(index);
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            updateGallery(currentImageIndex - 1);
        } else if (e.key === 'ArrowRight') {
            updateGallery(currentImageIndex + 1);
        }
    });

    // Auto-rotate gallery every 8 seconds
    setInterval(function() {
        updateGallery(currentImageIndex + 1);
    }, 8000);
});
