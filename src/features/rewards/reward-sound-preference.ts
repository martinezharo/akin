const REWARD_SOUND_KEY = "akin.reward-sound.v1";
const COIN_SOUND_SOURCE = "/sounds/coins-added.mp3";
let coinSound: HTMLAudioElement | null = null;

function getCoinSound() {
	coinSound ??= new Audio(COIN_SOUND_SOURCE);
	coinSound.preload = "auto";
	coinSound.volume = 0.42;
	return coinSound;
}

export function warmRewardSound() {
	try {
		getCoinSound().load();
	} catch {
		// Sound is optional; unsupported media must not affect rewards.
	}
}

export function isRewardSoundEnabled() {
	try {
		return window.localStorage.getItem(REWARD_SOUND_KEY) !== "off";
	} catch {
		return true;
	}
}

export function setRewardSoundEnabled(enabled: boolean) {
	try {
		window.localStorage.setItem(REWARD_SOUND_KEY, enabled ? "on" : "off");
	} catch {
		// A session without local storage should retain the default behaviour.
	}
}

/** Starts fetching the real coin SFX before the reward mutation settles. */
export function primeRewardSound() {
	if (!isRewardSoundEnabled()) return;
	warmRewardSound();
}

export function playRewardSound() {
	if (!isRewardSoundEnabled()) return;
	try {
		const sound = getCoinSound();
		// The source has a tiny lead-in. Starting just after it makes the clink
		// feel attached to the coin animation instead of arriving late.
		sound.currentTime = 0.065;
		void sound.play().catch(() => undefined);
	} catch {
		// The visual feedback still lands if the browser denies audio.
	}
}
