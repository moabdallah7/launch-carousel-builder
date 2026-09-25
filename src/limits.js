export const TIER = { free: 'free', pro: 'pro' };
export const LIMITS = {
free: {
label: 'Free',
imagesPerDeck: 3,
maxFrames: 10,
},
pro: {
label: 'Pro',
imagesPerDeck: Infinity,
maxFrames: 20,
},
};
export const limitsFor = (tier = TIER.free) => LIMITS[tier] || LIMITS.free;
export const countImages = (deck) =>
deck.frames.reduce((n, f) => n + (f.image?.src ? 1 : 0), 0);
export function imageQuota(deck, tier = TIER.free) {
const max = limitsFor(tier).imagesPerDeck;
const used = countImages(deck);
return { used, max, remaining: max - used, exceeded: used >= max };
}
export function canAddImageTo(deck, frame, tier = TIER.free) {
if (frame?.image?.src) return true;          // replacing, not adding
return !imageQuota(deck, tier).exceeded;
}