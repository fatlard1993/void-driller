import gameContext from '../../shared/gameContext';

import player from './player';
import spaceco from './spaceco';
import world from './world';

export default data => {
	if (data.id !== gameContext.gameId) return;

	if(player(data)) return;
	if(spaceco(data)) return;
	if(world(data)) return;
};
