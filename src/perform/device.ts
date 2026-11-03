/**
 * Phones get only the performer and director views; drill is written on a computer or tablet.
 * "Phone" = a touch screen whose window's short side is under 500 CSS px: every iPhone (the biggest is 440 across), and
 * an iPhone Duo closed (382 × ~600); open it is 669 × 867, or 951 × 585 on its side, and gets the editor, as every
 * iPad does (744 and up). The window, not the screen: what a Duo reports as its screen isn't known, and an iPad Split
 * View pane under 500 wide is phone-sized too.
 */
export const phoneSized = (touch: boolean, winW: number, winH: number) => touch && Math.min(winW, winH) < 500;
export const isPhone = () => phoneSized(coarse(), innerWidth, innerHeight);

/** A touch screen is the main input (iPad, phone): controls get Apple's 44 px minimum and fingers get bigger hit areas. */
export const coarse = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
