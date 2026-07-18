let scrollLockCount = 0;
let prevBodyOverflow = "";

export function lockScroll() {
  if (scrollLockCount === 0) {
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount++;
}

export function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = prevBodyOverflow || "";
  }
}
