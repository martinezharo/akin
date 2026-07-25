import type { Friend } from "../model/friend-types";

/**
 * The demo crew. Weekly XP deliberately does not track lifetime XP: the crew
 * board is about this week's effort, and the fixtures show a veteran having a
 * quiet week while a newcomer leads.
 *
 * Plain data rather than part of the demo hook, so server-rendered surfaces —
 * the landing among them — can show the same crew without pulling a client
 * hook into their graph.
 */
export const DEMO_FRIENDS: Friend[] = [
	{ id: "nova", username: "nova_moves", petSkin: "sky", petHair: "cream", xp: 2840, weeklyXp: 21, relationship: "friends" },
	{ id: "juno", username: "juno_dailies", petSkin: "plum", petHair: "lilac", xp: 3120, weeklyXp: 12, relationship: "friends" },
	{ id: "remy", username: "remy_reps", petSkin: "cinnamon", petHair: "honey", xp: 1685, weeklyXp: 26, relationship: "friends" },
	{ id: "milo", username: "milo_makes", petSkin: "moss", petHair: "honey", xp: 1920, weeklyXp: 9, relationship: "incoming", requestId: "demo-milo" },
	{ id: "bea", username: "bea_bloom", petSkin: "berry", petHair: "mint", xp: 3765, weeklyXp: 17, relationship: "outgoing", requestId: "demo-bea" },
	{ id: "sam", username: "tinywins", petSkin: "cinnamon", petHair: "lilac", xp: 1240, weeklyXp: 4, relationship: "none" },
	{ id: "leo", username: "leo_keepsgoing", petSkin: "plum", petHair: "rose", xp: 4210, weeklyXp: 0, relationship: "none" },
	{ id: "ivy", username: "ivy_everyday", petSkin: "ember", petHair: "mint", xp: 980, weeklyXp: 14, relationship: "none" },
];
