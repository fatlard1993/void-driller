/**
 * Music timing configuration for all level tracks
 *
 * Each level track has:
 * - intro: { start: ms, end: ms } - Plays once at the beginning
 * - loops: [{ start: ms, end: ms }, ...] - Composeable sections that repeat
 * - outro: { start: ms, end: ms } - Plays once when transitioning away
 *
 * All timestamps are in milliseconds.
 *
 * **Implicit End Times:**
 * Set `end` to `null` or `undefined` to play until the audio naturally ends.
 * This is useful for outros that play to the end of the file.
 *
 * Example:
 *   outro: { start: 120000, end: null } // Play from 2m to end of file
 */

const musicConfig = {
	L1_Training_Shallows: {
		intro: { start: 0, end: 20000 }, // 20 seconds
		loops: [
			{ start: 20000, end: 135000 } // 20s to 2m15s (main loop)
		],
		outro: { start: 135000, end: null } // 2m15s to end (will play to file end)
	},

	L2_Surface_Prospects: {
		intro: { start: 0, end: 30000 }, // 30 seconds
		loops: [
			{ start: 30000, end: 90000 } // 30s to 1m30s
		],
		outro: { start: 90000, end: null } // 1m30s to end of file
	},

	L3_Amber_Extraction_Zone: {
		intro: { start: 0, end: 14000 }, // 14 seconds
		loops: [
			{ start: 14000, end: 95000 } // 14s to 1m35s
		],
		outro: { start: 95000, end: null } // 1m35s to end of file
	},

	L3B_Fractured_Prospects: {
		intro: { start: 0, end: 10000 }, // 10 seconds
		loops: [
			{ start: 10000, end: 40000 } // 10s to 40s
		],
		outro: { start: 40000, end: null } // 40s to end of file
	},

	L4_Verdant_Volatiles: {
		intro: { start: 0, end: 12000 }, // 12 seconds
		loops: [
			{ start: 12000, end: 52000 } // 12s to 52s
		],
		outro: { start: 52000, end: null } // 52s to end of file
	},

	L5_Ethereal_Depths: {
		intro: { start: 0, end: 15000 }, // 15 seconds
		loops: [
			{ start: 15000, end: 51000 } // 15s to 51s
		],
		outro: { start: 51000, end: null } // 51s to end of file
	},

	L6_Azure_Anomalies: {
		intro: { start: 0, end: 9000 }, // 9 seconds
		loops: [
			{ start: 9000, end: 55000 } // 9s to 55s
		],
		outro: { start: 55000, end: null } // 55s to end of file
	},

	L7_Prismatic_Confluence: {
		intro: { start: 0, end: 10000 }, // 10 seconds
		loops: [
			{ start: 10000, end: 51000 } // 10s to 51s
		],
		outro: { start: 51000, end: null } // 51s to end of file
	},

	L7B_Unstable_Confluence: {
		intro: { start: 0, end: 18000 }, // 18 seconds
		loops: [
			{ start: 18000, end: 89000 } // 18s to 1m29s
		],
		outro: { start: 89000, end: null } // 1m29s to end of file
	},

	L8_Resonant_Caverns: {
		intro: { start: 0, end: 9000 }, // 9 seconds
		loops: [
			{ start: 9000, end: 37000 } // 9s to 37s
		],
		outro: { start: 37000, end: null } // 37s to end of file
	},

	L9_Crimson_Foundries: {
		intro: { start: 0, end: 15000 }, // 15 seconds
		loops: [
			{ start: 15000, end: 48000 } // 15s to 48s
		],
		outro: { start: 48000, end: null } // 48s to end of file
	},

	L9B_Thermal_Breach: {
		intro: { start: 0, end: 17000 }, // 17 seconds
		loops: [
			{ start: 17000, end: 70000 } // 17s to 1m10s
		],
		outro: { start: 70000, end: null } // 1m10s to end of file
	},

	L10_Obsidian_Throne: {
		intro: { start: 0, end: 20000 }, // 20 seconds
		loops: [
			{ start: 20000, end: 105000 } // 20s to 1m45s
		],
		outro: { start: 105000, end: null } // 1m45s to end of file
	},

	L11_Sacred_Fragments: {
		intro: { start: 0, end: 24000 }, // 24 seconds
		loops: [
			{ start: 24000, end: 73000 } // 24s to 1m13s
		],
		outro: { start: 73000, end: null } // 1m13s to end of file
	},

	L11B_Resonance_Chamber: {
		intro: { start: 0, end: 16000 }, // 16 seconds
		loops: [
			{ start: 16000, end: 80000 } // 16s to 1m20s
		],
		outro: { start: 80000, end: null } // 1m20s to end of file
	},

	L11C_Void_Sanctum: {
		intro: { start: 0, end: 23000 }, // 23 seconds
		loops: [
			{ start: 23000, end: 68000 } // 23s to 1m8s
		],
		outro: { start: 68000, end: null } // 1m8s to end of file
	}
};

export default musicConfig;
