window.onload = function() {
    document.querySelector('.container').scrollTo(0, 2100);
};

function scaleContainer() {
        const container = document.querySelector('.container');
        const containerWidth = 1519;
        const containerHeight = 730;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
    
        // Calculate scale factors for both width and height
        const scaleWidth = windowWidth / containerWidth;
        const scaleHeight = windowHeight / containerHeight;
    
        // Use the smaller scale factor to ensure the container fits in the viewport
        const scale = Math.min(scaleWidth, scaleHeight);
    
        // Apply the scale transform
        container.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
    
    window.addEventListener('resize', scaleContainer);
    window.addEventListener('load', scaleContainer);