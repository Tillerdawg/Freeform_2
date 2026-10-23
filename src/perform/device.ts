/**
 * Phones get only the performer and director views; drill is written on a computer or tablet.
 * "Phone" = touch screen whose short side is under 600 CSS px (every iPhone; iPads start at 744).
 */
export const isPhone = () => matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
