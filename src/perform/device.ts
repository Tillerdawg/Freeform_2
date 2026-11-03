/**
 * Phones get only the performer and director views; drill is written on a computer or tablet.
 * "Phone" = a touch screen whose screen's short side is under 600 CSS px (every iPhone; iPads start at 744), or whose
 * window's short side is under 450 (an iPhone Duo closed, 382 × ~600, whatever screen size it reports; open it is
 * 669 × 867, or 951 × 585 on its side, and gets the editor). A narrow iPad Split View pane (under 450) counts too.
 */
export const phoneSized = (touch: boolean, screenW: number, screenH: number, winW: number, winH: number) =>
  touch && (Math.min(screenW, screenH) < 600 || Math.min(winW, winH) < 450);
export const isPhone = () => phoneSized(coarse(), screen.width, screen.height, innerWidth, innerHeight);

/** A touch screen is the main input (iPad, phone): controls get Apple's 44 px minimum and fingers get bigger hit areas. */
export const coarse = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
