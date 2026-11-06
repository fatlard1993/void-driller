/**
 * Bookend timing configuration for SpaceCo bulletin transitions
 *
 * The spaceco_bulletin_bookends.wav file contains two parts:
 * - First half: Intro jingle (plays and fades out as bulletin starts)
 * - Second half: Outro jingle (fades in and plays as bulletin ends)
 *
 * All timestamps are in milliseconds.
 * Adjust these after analyzing the actual audio file.
 */

const bookendConfig = {
	// First half timing (intro jingle)
	firstHalfEnd: 14500, // Total length of intro bookend (14.5 seconds)

	// Second half timing (outro jingle)
	secondHalfStart: 13000, // Where the outro starts in the file (13 seconds)
	secondHalfEnd: null, // Play to end of file
};

export default bookendConfig;
