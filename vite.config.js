
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                home: resolve(__dirname, 'index.html'),
                destinations: resolve(__dirname, 'destinations.html'),
                tours: resolve(__dirname, 'tours.html'),
                rentals: resolve(__dirname, 'rentals.html'),
                reviews: resolve(__dirname, 'reviews.html'),
                about: resolve(__dirname, 'about.html'),
                contact: resolve(__dirname, 'contact.html'),
                booking: resolve(__dirname, 'booking.html'),
            },
        },
    },
});
